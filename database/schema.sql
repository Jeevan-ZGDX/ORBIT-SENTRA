-- ============================================================
-- ASTRA-Guard Database Schema
-- NASA Space Apps Challenge 2026
-- PostgreSQL Version 16+
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. ENUM TYPES
CREATE TYPE app_role AS ENUM (
    'astronaut',
    'flight_surgeon',
    'administrator'
);

CREATE TYPE mission_status AS ENUM (
    'planned',
    'active',
    'completed',
    'cancelled'
);

CREATE TYPE observation_source AS ENUM (
    'manual',
    'wearable',
    'csv_import',
    'simulator',
    'external_api'
);

CREATE TYPE measurement_type AS ENUM (
    'heart_rate',
    'blood_pressure',
    'spo2'
);

CREATE TYPE quality_status AS ENUM (
    'valid',
    'suspect',
    'invalid',
    'missing',
    'stale'
);

CREATE TYPE anomaly_status AS ENUM (
    'open',
    'acknowledged',
    'under_review',
    'resolved',
    'dismissed'
);

CREATE TYPE anomaly_severity AS ENUM (
    'informational',
    'low',
    'moderate',
    'high',
    'critical'
);

CREATE TYPE sync_status AS ENUM (
    'pending',
    'processing',
    'synced',
    'failed'
);

-- 2. USERS AND PROFILES
CREATE TABLE IF NOT EXISTS app_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    display_name TEXT NOT NULL,
    role app_role NOT NULL DEFAULT 'astronaut',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS astronaut_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE REFERENCES app_users(id) ON DELETE CASCADE,
    callsign TEXT,
    profile_timezone TEXT NOT NULL DEFAULT 'UTC',
    baseline_status TEXT NOT NULL DEFAULT 'insufficient_data'
        CHECK (baseline_status IN (
            'insufficient_data',
            'learning',
            'established',
            'review_required'
        )),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. MISSIONS AND ACCESS
CREATE TABLE IF NOT EXISTS missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    mission_type TEXT NOT NULL DEFAULT 'deep_space',
    destination TEXT NOT NULL DEFAULT 'Mars',
    status mission_status NOT NULL DEFAULT 'active',
    start_at TIMESTAMPTZ DEFAULT NOW(),
    end_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (end_at IS NULL OR start_at IS NULL OR end_at >= start_at)
);

CREATE TABLE IF NOT EXISTS mission_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mission_id UUID NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    role app_role NOT NULL,
    astronaut_id UUID REFERENCES astronaut_profiles(id) ON DELETE SET NULL,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    UNIQUE (mission_id, user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_memberships_user ON mission_memberships(user_id, mission_id);

-- 4. DATA SOURCES
CREATE TABLE IF NOT EXISTS data_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    astronaut_id UUID NOT NULL REFERENCES astronaut_profiles(id) ON DELETE CASCADE,
    source_type observation_source NOT NULL,
    source_name TEXT NOT NULL,
    device_identifier TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_data_sources_astronaut ON data_sources(astronaut_id);

-- 5. HEALTH OBSERVATIONS
CREATE TABLE IF NOT EXISTS health_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL UNIQUE,
    astronaut_id UUID NOT NULL REFERENCES astronaut_profiles(id) ON DELETE CASCADE,
    mission_id UUID REFERENCES missions(id) ON DELETE SET NULL,
    data_source_id UUID REFERENCES data_sources(id) ON DELETE SET NULL,
    measurement measurement_type NOT NULL,
    value NUMERIC(10,3),
    systolic_value NUMERIC(10,3),
    diastolic_value NUMERIC(10,3),
    unit TEXT NOT NULL,
    observed_at TIMESTAMPTZ NOT NULL,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source observation_source NOT NULL,
    quality quality_status NOT NULL DEFAULT 'valid',
    source_event_key TEXT,
    sequence_number BIGINT,
    context JSONB NOT NULL DEFAULT '{}'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (
        (measurement = 'blood_pressure'
            AND value IS NULL
            AND systolic_value IS NOT NULL
            AND diastolic_value IS NOT NULL
            AND systolic_value > 0
            AND diastolic_value > 0)
        OR
        (measurement <> 'blood_pressure'
            AND value IS NOT NULL
            AND systolic_value IS NULL
            AND diastolic_value IS NULL)
    ),
    CHECK (
        measurement <> 'heart_rate'
        OR (value > 0 AND unit = 'bpm')
    ),
    CHECK (
        measurement <> 'spo2'
        OR (value >= 0 AND value <= 100 AND unit = 'percent')
    )
);

CREATE INDEX IF NOT EXISTS idx_observations_astronaut_time ON health_observations(astronaut_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_observations_measurement_time ON health_observations(astronaut_id, measurement, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_observations_sync_time ON health_observations(received_at DESC);

-- 6. SLEEP SESSIONS
CREATE TABLE IF NOT EXISTS sleep_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL UNIQUE,
    astronaut_id UUID NOT NULL REFERENCES astronaut_profiles(id) ON DELETE CASCADE,
    mission_id UUID REFERENCES missions(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER,
    source observation_source NOT NULL DEFAULT 'simulator',
    quality quality_status NOT NULL DEFAULT 'valid',
    sleep_efficiency NUMERIC(5,2),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (ended_at > started_at),
    CHECK (duration_minutes IS NULL OR duration_minutes > 0),
    CHECK (sleep_efficiency IS NULL OR sleep_efficiency BETWEEN 0 AND 100)
);

CREATE INDEX IF NOT EXISTS idx_sleep_astronaut_time ON sleep_sessions(astronaut_id, started_at DESC);

-- 7. FATIGUE ASSESSMENTS
CREATE TABLE IF NOT EXISTS fatigue_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL UNIQUE,
    astronaut_id UUID NOT NULL REFERENCES astronaut_profiles(id) ON DELETE CASCADE,
    mission_id UUID REFERENCES missions(id) ON DELETE SET NULL,
    reported_at TIMESTAMPTZ NOT NULL,
    score SMALLINT NOT NULL CHECK (score BETWEEN 0 AND 10),
    scale_version TEXT NOT NULL DEFAULT 'fatigue-0-10-v1',
    source observation_source NOT NULL DEFAULT 'manual',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fatigue_astronaut_time ON fatigue_assessments(astronaut_id, reported_at DESC);

-- 8. BASELINE VERSIONS
CREATE TABLE IF NOT EXISTS baseline_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    astronaut_id UUID NOT NULL REFERENCES astronaut_profiles(id) ON DELETE CASCADE,
    measurement measurement_type NOT NULL,
    version_number INTEGER NOT NULL CHECK (version_number > 0),
    algorithm_name TEXT NOT NULL,
    algorithm_version TEXT NOT NULL,
    training_window_start TIMESTAMPTZ NOT NULL,
    training_window_end TIMESTAMPTZ NOT NULL,
    sample_count INTEGER NOT NULL CHECK (sample_count >= 0),
    baseline_median NUMERIC(12,4),
    baseline_mad NUMERIC(12,4),
    lower_reference NUMERIC(12,4),
    upper_reference NUMERIC(12,4),
    parameters JSONB NOT NULL DEFAULT '{}'::jsonb,
    established_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (training_window_end >= training_window_start),
    UNIQUE (astronaut_id, measurement, version_number)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_baseline ON baseline_versions(astronaut_id, measurement) WHERE is_active = TRUE;

-- 9. GUIDANCE REFERENCES
CREATE TABLE IF NOT EXISTS guidance_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    source_name TEXT NOT NULL,
    source_url TEXT,
    reference_version TEXT,
    reviewed_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    guidance_category TEXT NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. ANOMALY EVENTS
CREATE TABLE IF NOT EXISTS anomaly_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID UNIQUE,
    astronaut_id UUID NOT NULL REFERENCES astronaut_profiles(id) ON DELETE CASCADE,
    mission_id UUID REFERENCES missions(id) ON DELETE SET NULL,
    baseline_id UUID REFERENCES baseline_versions(id) ON DELETE SET NULL,
    guidance_reference_id UUID REFERENCES guidance_references(id) ON DELETE SET NULL,
    detector_name TEXT NOT NULL,
    detector_version TEXT NOT NULL,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    event_window_start TIMESTAMPTZ,
    event_window_end TIMESTAMPTZ,
    severity anomaly_severity NOT NULL DEFAULT 'informational',
    status anomaly_status NOT NULL DEFAULT 'open',
    anomaly_score NUMERIC(10,6),
    confidence_score NUMERIC(6,5),
    explanation TEXT NOT NULL,
    recommended_action TEXT,
    data_quality_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anomalies_astronaut_time ON anomaly_events(astronaut_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_anomalies_open ON anomaly_events(astronaut_id, severity, detected_at DESC) WHERE status IN ('open', 'acknowledged', 'under_review');

-- 11. ANOMALY EVIDENCE
CREATE TABLE IF NOT EXISTS anomaly_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anomaly_id UUID NOT NULL REFERENCES anomaly_events(id) ON DELETE CASCADE,
    observation_id UUID REFERENCES health_observations(id) ON DELETE SET NULL,
    evidence_type TEXT NOT NULL,
    description TEXT NOT NULL,
    observed_value NUMERIC(12,4),
    baseline_value NUMERIC(12,4),
    deviation_value NUMERIC(12,4),
    context JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anomaly_evidence_event ON anomaly_evidence(anomaly_id);

-- 12. ALERT REVIEWS
CREATE TABLE IF NOT EXISTS alert_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anomaly_id UUID NOT NULL REFERENCES anomaly_events(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('acknowledged', 'reviewed', 'resolved', 'dismissed', 'reopened')),
    notes TEXT,
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_alert_reviews_event ON alert_reviews(anomaly_id, reviewed_at DESC);

-- 13. SYNCHRONIZATION RECEIPTS
CREATE TABLE IF NOT EXISTS sync_receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL UNIQUE,
    astronaut_id UUID NOT NULL REFERENCES astronaut_profiles(id) ON DELETE CASCADE,
    payload_hash TEXT,
    status sync_status NOT NULL DEFAULT 'pending',
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    error_code TEXT,
    error_message TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_sync_receipts_status ON sync_receipts(status, received_at);
CREATE INDEX IF NOT EXISTS idx_sync_receipts_astronaut ON sync_receipts(astronaut_id, received_at DESC);

-- 14. AUDIT EVENTS
CREATE TABLE IF NOT EXISTS audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID REFERENCES app_users(id) ON DELETE SET NULL,
    mission_id UUID REFERENCES missions(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    request_id TEXT,
    outcome TEXT NOT NULL DEFAULT 'success',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_audit_actor_time ON audit_events(actor_user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_events(entity_type, entity_id, occurred_at DESC);

-- 15. SEED DATA FOR DEMO ACCOUNTS & GUIDANCE
INSERT INTO app_users (id, username, email, hashed_password, display_name, role)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'astronaut1', 'alex.vance@nasa.gov', '$2b$12$YxHVo9snf9qHMP3fTfDnmeYumfIMF06THUtYRlkx6sDDDyTL.5qHG', 'Dr. Alex Vance (CDR)', 'astronaut'),
    ('00000000-0000-0000-0000-000000000002', 'surgeon1', 'elena.rostova@nasa.gov', '$2b$12$YxHVo9snf9qHMP3fTfDnmeYumfIMF06THUtYRlkx6sDDDyTL.5qHG', 'Dr. Elena Rostova (Flight Surgeon)', 'flight_surgeon'),
    ('00000000-0000-0000-0000-000000000003', 'admin1', 'flight.admin@nasa.gov', '$2b$12$YxHVo9snf9qHMP3fTfDnmeYumfIMF06THUtYRlkx6sDDDyTL.5qHG', 'Mission Ops Admin', 'administrator')
ON CONFLICT (username) DO NOTHING;

INSERT INTO astronaut_profiles (id, user_id, callsign, profile_timezone, baseline_status)
VALUES 
    ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'ARES-LEAD', 'UTC', 'established')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO missions (id, name, mission_type, destination, status)
VALUES 
    ('22222222-2222-2222-2222-222222222222', 'Ares V - Mars Transit', 'deep_space', 'Mars', 'active')
ON CONFLICT DO NOTHING;

INSERT INTO mission_memberships (mission_id, user_id, role, astronaut_id)
VALUES 
    ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', 'astronaut', '11111111-1111-1111-1111-111111111111'),
    ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000002', 'flight_surgeon', NULL)
ON CONFLICT DO NOTHING;

INSERT INTO guidance_references (id, title, source_name, source_url, reference_version, guidance_category, content)
VALUES
    ('33333333-3333-3333-3333-333333333331', 'Hypoxia and Acute O2 Desaturation Protocol', 'NASA-STD-3001v1', 'https://www.nasa.gov/reference/nasa-std-3001v1/', 'Rev-C', 'respiratory', 'If SpO2 drops below 90% at rest, verify sensor placement, assess cabin environmental pO2, initiate supplemental oxygen mask if symptomatic, and log event for immediate medical consultation.'),
    ('33333333-3333-3333-3333-333333333332', 'Cumulative Sleep Debt & Fatigue Mitigation', 'NASA Crew Health Guidelines', 'https://www.nasa.gov/reference/7-0-crew-health-records/', '2024-v2', 'behavioural', 'When sleep efficiency drops below 70% for >2 consecutive cycles with subjective fatigue >= 7, adjust duty cycles, defer non-critical EVA/maintenance, and schedule monitored rest window.')
ON CONFLICT DO NOTHING;
