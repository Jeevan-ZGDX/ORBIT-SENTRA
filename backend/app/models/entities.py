import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, String, Boolean, DateTime, Integer, Numeric, Text, ForeignKey
)
from sqlalchemy.dialects.postgresql import UUID, JSONB, ENUM
from sqlalchemy.orm import relationship
from backend.app.core.database import Base

# Postgres Enums mapped to existing DB types
app_role_enum = ENUM('astronaut', 'flight_surgeon', 'administrator', name='app_role', create_type=False)
mission_status_enum = ENUM('planned', 'active', 'completed', 'cancelled', name='mission_status', create_type=False)
observation_source_enum = ENUM('manual', 'wearable', 'csv_import', 'simulator', 'external_api', name='observation_source', create_type=False)
measurement_type_enum = ENUM('heart_rate', 'blood_pressure', 'spo2', name='measurement_type', create_type=False)
quality_status_enum = ENUM('valid', 'suspect', 'invalid', 'missing', 'stale', name='quality_status', create_type=False)
anomaly_status_enum = ENUM('open', 'acknowledged', 'under_review', 'resolved', 'dismissed', name='anomaly_status', create_type=False)
anomaly_severity_enum = ENUM('informational', 'low', 'moderate', 'high', 'critical', name='anomaly_severity', create_type=False)
sync_status_enum = ENUM('pending', 'processing', 'synced', 'failed', name='sync_status', create_type=False)

class AppUser(Base):
    __tablename__ = "app_users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = Column(Text, unique=True, nullable=False)
    email = Column(Text, unique=True, nullable=False)
    hashed_password = Column(Text, nullable=False)
    display_name = Column(Text, nullable=False)
    role = Column(app_role_enum, nullable=False, default="astronaut")
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    astronaut_profile = relationship("AstronautProfile", back_populates="user", uselist=False)

class AstronautProfile(Base):
    __tablename__ = "astronaut_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("app_users.id", ondelete="CASCADE"), unique=True)
    callsign = Column(Text)
    profile_timezone = Column(Text, nullable=False, default="UTC")
    baseline_status = Column(Text, nullable=False, default="insufficient_data")
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    user = relationship("AppUser", back_populates="astronaut_profile")
    observations = relationship("HealthObservation", back_populates="astronaut")
    anomalies = relationship("AnomalyEvent", back_populates="astronaut")

class HealthObservation(Base):
    __tablename__ = "health_observations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(UUID(as_uuid=True), unique=True, nullable=False)
    astronaut_id = Column(UUID(as_uuid=True), ForeignKey("astronaut_profiles.id", ondelete="CASCADE"), nullable=False)
    mission_id = Column(UUID(as_uuid=True), nullable=True)
    data_source_id = Column(UUID(as_uuid=True), nullable=True)
    measurement = Column(measurement_type_enum, nullable=False)
    value = Column(Numeric(10, 3), nullable=True)
    systolic_value = Column(Numeric(10, 3), nullable=True)
    diastolic_value = Column(Numeric(10, 3), nullable=True)
    unit = Column(Text, nullable=False)
    observed_at = Column(DateTime(timezone=True), nullable=False)
    received_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    source = Column(observation_source_enum, nullable=False, default="simulator")
    quality = Column(quality_status_enum, nullable=False, default="valid")
    context = Column(JSONB, nullable=False, default=dict)
    metadata_ = Column("metadata", JSONB, nullable=False, default=dict)

    astronaut = relationship("AstronautProfile", back_populates="observations")

class SleepSession(Base):
    __tablename__ = "sleep_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(UUID(as_uuid=True), unique=True, nullable=False)
    astronaut_id = Column(UUID(as_uuid=True), ForeignKey("astronaut_profiles.id", ondelete="CASCADE"), nullable=False)
    started_at = Column(DateTime(timezone=True), nullable=False)
    ended_at = Column(DateTime(timezone=True), nullable=False)
    duration_minutes = Column(Integer, nullable=True)
    sleep_efficiency = Column(Numeric(5, 2), nullable=True)
    source = Column(observation_source_enum, nullable=False, default="simulator")
    quality = Column(quality_status_enum, nullable=False, default="valid")
    metadata_ = Column("metadata", JSONB, nullable=False, default=dict)

class FatigueAssessment(Base):
    __tablename__ = "fatigue_assessments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(UUID(as_uuid=True), unique=True, nullable=False)
    astronaut_id = Column(UUID(as_uuid=True), ForeignKey("astronaut_profiles.id", ondelete="CASCADE"), nullable=False)
    reported_at = Column(DateTime(timezone=True), nullable=False)
    score = Column(Integer, nullable=False)
    scale_version = Column(Text, nullable=False, default="fatigue-0-10-v1")
    source = Column(observation_source_enum, nullable=False, default="manual")
    notes = Column(Text, nullable=True)

class AnomalyEvent(Base):
    __tablename__ = "anomaly_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(UUID(as_uuid=True), unique=True, nullable=True)
    astronaut_id = Column(UUID(as_uuid=True), ForeignKey("astronaut_profiles.id", ondelete="CASCADE"), nullable=False)
    baseline_id = Column(UUID(as_uuid=True), nullable=True)
    guidance_reference_id = Column(UUID(as_uuid=True), nullable=True)
    detector_name = Column(Text, nullable=False)
    detector_version = Column(Text, nullable=False)
    detected_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    severity = Column(anomaly_severity_enum, nullable=False, default="informational")
    status = Column(anomaly_status_enum, nullable=False, default="open")
    anomaly_score = Column(Numeric(10, 6), nullable=True)
    confidence_score = Column(Numeric(6, 5), nullable=True)
    explanation = Column(Text, nullable=False)
    recommended_action = Column(Text, nullable=True)
    data_quality_summary = Column(JSONB, nullable=False, default=dict)
    metadata_ = Column("metadata", JSONB, nullable=False, default=dict)

    astronaut = relationship("AstronautProfile", back_populates="anomalies")
    reviews = relationship("AlertReview", back_populates="anomaly")

class AlertReview(Base):
    __tablename__ = "alert_reviews"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    anomaly_id = Column(UUID(as_uuid=True), ForeignKey("anomaly_events.id", ondelete="CASCADE"), nullable=False)
    reviewer_id = Column(UUID(as_uuid=True), ForeignKey("app_users.id", ondelete="CASCADE"), nullable=False)
    action = Column(String, nullable=False)
    notes = Column(Text, nullable=True)
    reviewed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    metadata_ = Column("metadata", JSONB, nullable=False, default=dict)

    anomaly = relationship("AnomalyEvent", back_populates="reviews")
    reviewer = relationship("AppUser")

class SyncReceipt(Base):
    __tablename__ = "sync_receipts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    event_id = Column(UUID(as_uuid=True), unique=True, nullable=False)
    astronaut_id = Column(UUID(as_uuid=True), ForeignKey("astronaut_profiles.id", ondelete="CASCADE"), nullable=False)
    payload_hash = Column(Text, nullable=True)
    status = Column(sync_status_enum, nullable=False, default="synced")
    received_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    processed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=True)
    error_code = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    metadata_ = Column("metadata", JSONB, nullable=False, default=dict)

class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    actor_user_id = Column(UUID(as_uuid=True), ForeignKey("app_users.id", ondelete="SET NULL"), nullable=True)
    action = Column(Text, nullable=False)
    entity_type = Column(Text, nullable=False)
    entity_id = Column(UUID(as_uuid=True), nullable=True)
    occurred_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    request_id = Column(Text, nullable=True)
    outcome = Column(Text, nullable=False, default="success")
    metadata_ = Column("metadata", JSONB, nullable=False, default=dict)
