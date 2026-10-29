import uuid
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, AliasChoices

# Auth schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    username: str
    display_name: str
    role: str

class LoginRequest(BaseModel):
    username: str
    password: str

# Observation schemas
class ObservationCreate(BaseModel):
    event_id: uuid.UUID
    astronaut_id: uuid.UUID
    measurement: str
    value: Optional[float] = None
    systolic_value: Optional[float] = None
    diastolic_value: Optional[float] = None
    unit: str
    observed_at: datetime
    source: str = "simulator"
    quality: str = "valid"
    context: Dict[str, Any] = Field(default_factory=dict)
    metadata: Dict[str, Any] = Field(default_factory=dict, validation_alias=AliasChoices('metadata_', 'metadata'))

class ObservationResponse(ObservationCreate):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)
    id: uuid.UUID
    received_at: datetime

# Sleep & Fatigue schemas
class SleepSessionCreate(BaseModel):
    event_id: uuid.UUID
    astronaut_id: uuid.UUID
    started_at: datetime
    ended_at: datetime
    duration_minutes: Optional[int] = None
    sleep_efficiency: Optional[float] = None
    source: str = "simulator"
    quality: str = "valid"

class FatigueAssessmentCreate(BaseModel):
    event_id: uuid.UUID
    astronaut_id: uuid.UUID
    reported_at: datetime
    score: int
    notes: Optional[str] = None

# Anomaly & Review schemas
class AnomalyCreate(BaseModel):
    event_id: Optional[uuid.UUID] = None
    astronaut_id: uuid.UUID
    detector_name: str
    detector_version: str
    detected_at: datetime
    severity: str
    status: str = "open"
    anomaly_score: Optional[float] = None
    explanation: str
    recommended_action: Optional[str] = None
    data_quality_summary: Dict[str, Any] = Field(default_factory=dict)

class AlertReviewCreate(BaseModel):
    action: str  # acknowledged, reviewed, resolved, dismissed
    notes: Optional[str] = None

class AlertReviewResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    anomaly_id: uuid.UUID
    reviewer_id: uuid.UUID
    reviewer_name: Optional[str] = None
    action: str
    notes: Optional[str] = None
    reviewed_at: datetime

class AnomalyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    event_id: Optional[uuid.UUID]
    astronaut_id: uuid.UUID
    detector_name: str
    detector_version: str
    detected_at: datetime
    severity: str
    status: str
    anomaly_score: Optional[float]
    explanation: str
    recommended_action: Optional[str]
    data_quality_summary: Dict[str, Any]
    reviews: List[AlertReviewResponse] = []

# Batch Sync Schema (POST /api/v1/sync)
class BatchSyncRequest(BaseModel):
    astronaut_id: uuid.UUID
    observations: List[ObservationCreate] = []
    sleep_sessions: List[SleepSessionCreate] = []
    fatigue_assessments: List[FatigueAssessmentCreate] = []
    anomalies: List[AnomalyCreate] = []

class SyncReceiptItem(BaseModel):
    event_id: uuid.UUID
    status: str  # synced | duplicate | error
    error_message: Optional[str] = None

class BatchSyncResponse(BaseModel):
    astronaut_id: uuid.UUID
    processed_count: int
    duplicate_count: int
    error_count: int
    receipts: List[SyncReceiptItem]
