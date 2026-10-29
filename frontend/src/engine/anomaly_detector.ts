import {
  HealthObservation,
  AnomalyEvent,
  BaselineStats,
  MeasurementType,
  AnomalySeverity
} from '../types';

export class AnomalyEngine {
  private static MIN_ESTABLISHED_SAMPLES = 20;

  /**
   * Calculates median of a sorted or unsorted number array
   */
  public static median(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  /**
   * Calculates Median Absolute Deviation (MAD)
   */
  public static calculateMAD(values: number[], med?: number): number {
    if (values.length === 0) return 0;
    const m = med !== undefined ? med : this.median(values);
    const deviations = values.map(v => Math.abs(v - m));
    return this.median(deviations);
  }

  /**
   * Computes personalized baseline for an array of valid numerical values
   */
  public static computeBaseline(values: number[]): BaselineStats {
    if (values.length < 5) {
      return {
        median: 0,
        mad: 0,
        sampleCount: values.length,
        status: 'insufficient_data',
        lowerBound: 0,
        upperBound: 0
      };
    }

    const med = this.median(values);
    const mad = Math.max(0.1, this.calculateMAD(values, med));
    const status = values.length >= this.MIN_ESTABLISHED_SAMPLES ? 'established' : 'learning';

    // 3 * (1.4826 * MAD) approx 3 sigma
    const sigma = 1.4826 * mad;
    const lowerBound = Math.round((med - 3 * sigma) * 10) / 10;
    const upperBound = Math.round((med + 3 * sigma) * 10) / 10;

    return {
      median: Math.round(med * 10) / 10,
      mad: Math.round(mad * 100) / 100,
      sampleCount: values.length,
      status,
      lowerBound,
      upperBound
    };
  }

  /**
   * Validates measurement quality (implausible spikes, sensor dropouts, stale reads)
   */
  public static checkDataQuality(
    obs: HealthObservation,
    recentHistory: HealthObservation[]
  ): { isValid: boolean; qualityStatus: string; warning?: string } {
    const val = obs.value ?? obs.systolicValue ?? 0;

    // 1. Implausible biological spikes
    if (obs.measurement === 'heart_rate') {
      if (val < 30 || val > 240) {
        return {
          isValid: false,
          qualityStatus: 'invalid',
          warning: `Physiologically implausible heart rate: ${val} bpm`
        };
      }
    } else if (obs.measurement === 'spo2') {
      if (val < 50 || val > 100) {
        return {
          isValid: false,
          qualityStatus: 'invalid',
          warning: `Physiologically implausible SpO₂ reading: ${val}%`
        };
      }
    }

    // 2. Stale sensor detection (e.g. frozen value for 5 consecutive samples)
    const matchingRecent = recentHistory
      .filter(h => h.measurement === obs.measurement && h.value !== undefined)
      .slice(-5);
    
    if (matchingRecent.length >= 4) {
      const allSame = matchingRecent.every(h => Math.abs((h.value ?? 0) - val) < 0.001);
      if (allSame) {
        return {
          isValid: false,
          qualityStatus: 'stale',
          warning: `Stale telemetry detected: repeated value ${val} across consecutive samples`
        };
      }
    }

    return { isValid: true, qualityStatus: 'valid' };
  }

  /**
   * Multi-signal anomaly evaluation engine
   */
  public static evaluateObservations(
    currentObs: HealthObservation,
    history: HealthObservation[],
    fatigueScore: number = 2,
    sleepDurationMinutes: number = 450
  ): AnomalyEvent | null {
    // 1. Data Quality Gate
    const qualityCheck = this.checkDataQuality(currentObs, history);
    if (!qualityCheck.isValid) {
      return {
        eventId: crypto.randomUUID(),
        astronautId: currentObs.astronautId,
        detectorName: 'DataQualityGuard',
        detectorVersion: '1.0.0',
        detectedAt: currentObs.observedAt,
        severity: 'low',
        status: 'open',
        explanation: `Sensor data quality warning: ${qualityCheck.warning}`,
        recommendedAction: 'Inspect sensor placement, clean contacts, and verify telemetry link.',
        dataQualitySummary: { fault: qualityCheck.qualityStatus, rawValue: currentObs.value },
        syncStatus: 'pending'
      };
    }

    const validHistoryValues = history
      .filter(h => h.measurement === currentObs.measurement && h.quality === 'valid' && h.value !== undefined)
      .map(h => h.value as number);

    const baseline = this.computeBaseline(validHistoryValues);
    const currentValue = currentObs.value ?? 0;

    // 2. Fixed Clinical Safety Rules (NASA-STD-3001v1)
    if (currentObs.measurement === 'spo2') {
      if (currentValue < 90) {
        const isMultiSignal = fatigueScore >= 7 || sleepDurationMinutes < 300;
        const severity: AnomalySeverity = isMultiSignal ? 'critical' : 'high';
        
        let explanation = `SpO₂ has dropped to ${currentValue}% (Clinical Hypoxia Threshold: <90%).`;
        if (baseline.status === 'established') {
          explanation += ` Baseline: ${baseline.median}% (±${baseline.mad}% MAD).`;
        }
        if (isMultiSignal) {
          explanation += ` Co-occurring with elevated fatigue (${fatigueScore}/10) and cumulative sleep deficit (${Math.round(sleepDurationMinutes/60)} hrs). Acute physiological strain indicated.`;
        }

        return {
          eventId: crypto.randomUUID(),
          astronautId: currentObs.astronautId,
          detectorName: 'MultiSignalHypoxiaDetector',
          detectorVersion: '1.2.0',
          detectedAt: currentObs.observedAt,
          severity,
          status: 'open',
          anomalyScore: Math.round((98 - currentValue) / 98 * 100) / 10,
          explanation,
          recommendedAction: 'Verify sensor placement, evaluate cabin O2 partial pressure, don emergency supplemental O2 mask if symptomatic, and notify Flight Surgeon immediately (NASA-STD-3001v1 Rev-C).',
          dataQualitySummary: { baselineStatus: baseline.status, sampleCount: baseline.sampleCount },
          syncStatus: 'pending'
        };
      }
    }

    if (currentObs.measurement === 'heart_rate') {
      const isResting = currentObs.context?.activity === 'rest';
      if (isResting && currentValue > 115) {
        return {
          eventId: crypto.randomUUID(),
          astronautId: currentObs.astronautId,
          detectorName: 'TachycardiaGuard',
          detectorVersion: '1.0.0',
          detectedAt: currentObs.observedAt,
          severity: 'moderate',
          status: 'open',
          anomalyScore: Math.round((currentValue - 100) / 10),
          explanation: `Resting heart rate elevated to ${currentValue} bpm while astronaut activity indicates rest.`,
          recommendedAction: 'Hydrate, maintain rest posture, log subjective symptoms, and re-evaluate vitals in 15 minutes.',
          dataQualitySummary: { baselineStatus: baseline.status },
          syncStatus: 'pending'
        };
      }
    }

    // 3. Personalized Anomaly Scoring (MAD Z-Score)
    if (baseline.status === 'established' && currentObs.measurement === 'spo2') {
      const zMAD = Math.abs(currentValue - baseline.median) / (1.4826 * baseline.mad);
      if (zMAD > 3.0 && currentValue < baseline.median) {
        return {
          eventId: crypto.randomUUID(),
          astronautId: currentObs.astronautId,
          detectorName: 'PersonalizedMADDetector',
          detectorVersion: '2.0.0',
          detectedAt: currentObs.observedAt,
          severity: 'moderate',
          status: 'open',
          anomalyScore: Math.round(zMAD * 10) / 10,
          explanation: `SpO₂ (${currentValue}%) deviates by ${zMAD.toFixed(1)}σ MAD from established personal baseline (${baseline.median}%).`,
          recommendedAction: 'Re-seat SpO2 finger probe, record subjective breathing comfort, and monitor trend.',
          dataQualitySummary: { baselineStatus: 'established', sampleCount: baseline.sampleCount, zMAD: Math.round(zMAD*10)/10 },
          syncStatus: 'pending'
        };
      }
    }

    return null;
  }
}
