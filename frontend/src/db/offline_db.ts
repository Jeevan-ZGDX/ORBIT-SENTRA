import Dexie, { Table } from 'dexie';
import {
  HealthObservation,
  SleepSession,
  FatigueAssessment,
  AnomalyEvent
} from '../types';

export class AstraGuardLocalDB extends Dexie {
  public observations!: Table<HealthObservation, string>;
  public sleepSessions!: Table<SleepSession, string>;
  public fatigueAssessments!: Table<FatigueAssessment, string>;
  public anomalies!: Table<AnomalyEvent, string>;

  constructor() {
    super('AstraGuardOfflineDB');
    this.version(1).stores({
      observations: 'eventId, astronautId, measurement, observedAt, syncStatus, quality',
      sleepSessions: 'eventId, astronautId, startedAt, syncStatus',
      fatigueAssessments: 'eventId, astronautId, reportedAt, syncStatus',
      anomalies: 'eventId, astronautId, detectedAt, severity, status, syncStatus'
    });
  }

  /**
   * Returns all pending records across all tables ready for batch sync
   */
  async getPendingSyncPayload(astronautId: string) {
    const pendingObs = await this.observations
      .where('syncStatus')
      .equals('pending')
      .filter(o => o.astronautId === astronautId)
      .toArray();

    const pendingSleep = await this.sleepSessions
      .where('syncStatus')
      .equals('pending')
      .filter(s => s.astronautId === astronautId)
      .toArray();

    const pendingFatigue = await this.fatigueAssessments
      .where('syncStatus')
      .equals('pending')
      .filter(f => f.astronautId === astronautId)
      .toArray();

    const pendingAnomalies = await this.anomalies
      .where('syncStatus')
      .equals('pending')
      .filter(a => a.astronautId === astronautId)
      .toArray();

    return {
      astronaut_id: astronautId,
      observations: pendingObs.map(o => ({
        event_id: o.eventId,
        astronaut_id: o.astronautId,
        measurement: o.measurement,
        value: o.value,
        systolic_value: o.systolicValue,
        diastolic_value: o.diastolicValue,
        unit: o.unit,
        observed_at: o.observedAt,
        source: o.source,
        quality: o.quality,
        context: o.context || {},
        metadata: o.metadata || {}
      })),
      sleep_sessions: pendingSleep.map(s => ({
        event_id: s.eventId,
        astronaut_id: s.astronautId,
        started_at: s.startedAt,
        ended_at: s.endedAt,
        duration_minutes: s.durationMinutes,
        sleep_efficiency: s.sleepEfficiency,
        source: s.source,
        quality: s.quality
      })),
      fatigue_assessments: pendingFatigue.map(f => ({
        event_id: f.eventId,
        astronaut_id: f.astronautId,
        reported_at: f.reportedAt,
        score: f.score,
        notes: f.notes
      })),
      anomalies: pendingAnomalies.map(a => ({
        event_id: a.eventId,
        astronaut_id: a.astronautId,
        detector_name: a.detectorName,
        detector_version: a.detectorVersion,
        detected_at: a.detectedAt,
        severity: a.severity,
        status: a.status,
        anomaly_score: a.anomalyScore,
        explanation: a.explanation,
        recommended_action: a.recommendedAction,
        data_quality_summary: a.dataQualitySummary
      }))
    };
  }

  /**
   * Marks successfully synced events as 'synced' in Dexie
   */
  async markSynced(receipts: Array<{ event_id: string; status: string }>) {
    for (const r of receipts) {
      if (r.status === 'synced' || r.status === 'duplicate') {
        await this.observations.where('eventId').equals(r.event_id).modify({ syncStatus: 'synced' });
        await this.sleepSessions.where('eventId').equals(r.event_id).modify({ syncStatus: 'synced' });
        await this.fatigueAssessments.where('eventId').equals(r.event_id).modify({ syncStatus: 'synced' });
        await this.anomalies.where('eventId').equals(r.event_id).modify({ syncStatus: 'synced' });
      }
    }
  }

  /**
   * Purges all fabricated/dummy alerts, simulator records, and legacy mock data
   */
  async purgeAllDummyData() {
    // 1. Purge any dummy MultiSignalHypoxiaDetector or alerts containing 88.5%
    const allAnomalies = await this.anomalies.toArray();
    for (const a of allAnomalies) {
      if (
        a.detectorName === 'MultiSignalHypoxiaDetector' ||
        a.explanation?.includes('88.5%') ||
        a.explanation?.includes('hypoxia') ||
        (a as any).source === 'simulator'
      ) {
        await this.anomalies.delete(a.eventId);
      }
    }

    // 2. Purge any simulator observations
    await this.observations.where('source').equals('simulator').delete();

    // 3. Purge any simulator sleep sessions
    await this.sleepSessions.where('source').equals('simulator').delete();

    // 4. Purge any simulated fatigue scores
    const fatigues = await this.fatigueAssessments.toArray();
    for (const f of fatigues) {
      if (f.notes?.includes('Severe fatigue') || f.notes?.includes('simulator')) {
        await this.fatigueAssessments.delete(f.eventId);
      }
    }
  }

  /**
   * Purges all tables in local IndexedDB for a complete clean slate
   */
  async purgeAllTables() {
    await this.anomalies.clear();
    await this.observations.clear();
    await this.sleepSessions.clear();
    await this.fatigueAssessments.clear();
  }
}

export const localDB = new AstraGuardLocalDB();
