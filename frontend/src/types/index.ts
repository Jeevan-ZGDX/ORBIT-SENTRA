export type MeasurementType = 'heart_rate' | 'blood_pressure' | 'spo2';
export type QualityStatus = 'valid' | 'suspect' | 'invalid' | 'missing' | 'stale';
export type AnomalySeverity = 'informational' | 'low' | 'moderate' | 'high' | 'critical';
export type AnomalyStatus = 'open' | 'acknowledged' | 'under_review' | 'resolved' | 'dismissed';
export type SyncStatus = 'pending' | 'processing' | 'synced' | 'failed';
export type ObservationSource = 'manual' | 'wearable' | 'csv_import' | 'simulator' | 'external_api';

export interface HealthObservation {
  id?: string;
  eventId: string;
  astronautId: string;
  measurement: MeasurementType;
  value?: number;
  systolicValue?: number;
  diastolicValue?: number;
  unit: string;
  observedAt: string;
  source: ObservationSource;
  quality: QualityStatus;
  context?: Record<string, any>;
  metadata?: Record<string, any>;
  syncStatus: SyncStatus;
}

export interface SleepSession {
  id?: string;
  eventId: string;
  astronautId: string;
  startedAt: string;
  endedAt: string;
  durationMinutes?: number;
  sleepEfficiency?: number;
  source: ObservationSource;
  quality: QualityStatus;
  syncStatus: SyncStatus;
}

export interface FatigueAssessment {
  id?: string;
  eventId: string;
  astronautId: string;
  reportedAt: string;
  score: number;
  scaleVersion: string;
  source: ObservationSource;
  notes?: string;
  syncStatus: SyncStatus;
}

export interface AnomalyEvent {
  id?: string;
  eventId: string;
  astronautId: string;
  detectorName: string;
  detectorVersion: string;
  detectedAt: string;
  severity: AnomalySeverity;
  status: AnomalyStatus;
  anomalyScore?: number;
  explanation: string;
  recommendedAction?: string;
  dataQualitySummary: Record<string, any>;
  syncStatus: SyncStatus;
}

export interface BaselineStats {
  median: number;
  mad: number;
  sampleCount: number;
  status: 'insufficient_data' | 'learning' | 'established';
  lowerBound: number;
  upperBound: number;
}
