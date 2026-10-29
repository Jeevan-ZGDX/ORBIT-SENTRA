import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.app.core.database import get_db
from backend.app.models.entities import (
    AppUser, HealthObservation, SleepSession, FatigueAssessment,
    AnomalyEvent, SyncReceipt, AstronautProfile
)
from backend.app.schemas.domain import (
    BatchSyncRequest, BatchSyncResponse, SyncReceiptItem
)
from backend.app.api.deps import get_current_user, log_audit_event

router = APIRouter(prefix="/sync", tags=["Synchronization"])

@router.post("", response_model=BatchSyncResponse)
async def batch_sync_telemetry(
    payload: BatchSyncRequest,
    current_user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Idempotent offline batch synchronization endpoint.
    Processes observations, sleep sessions, fatigue ratings, and locally generated anomalies.
    Guarantees no duplicate insertions for re-tried payloads.
    """
    receipts: List[SyncReceiptItem] = []
    processed_count = 0
    duplicate_count = 0
    error_count = 0

    # Ensure astronaut profile exists
    prof_check = await db.execute(
        select(AstronautProfile).where(AstronautProfile.id == payload.astronaut_id)
    )
    if not prof_check.scalars().first():
        raise HTTPException(status_code=404, detail="Astronaut profile not registered")

    # 1. Process Health Observations
    for obs in payload.observations:
        try:
            # Check duplicate by event_id
            existing = await db.execute(
                select(HealthObservation).where(HealthObservation.event_id == obs.event_id)
            )
            if existing.scalars().first():
                duplicate_count += 1
                receipts.append(SyncReceiptItem(event_id=obs.event_id, status="duplicate"))
                continue

            record = HealthObservation(
                event_id=obs.event_id,
                astronaut_id=payload.astronaut_id,
                measurement=obs.measurement,
                value=obs.value,
                systolic_value=obs.systolic_value,
                diastolic_value=obs.diastolic_value,
                unit=obs.unit,
                observed_at=obs.observed_at,
                source=obs.source,
                quality=obs.quality,
                context=obs.context,
                metadata_=obs.metadata
            )
            db.add(record)
            
            # Record receipt
            receipt = SyncReceipt(
                event_id=obs.event_id,
                astronaut_id=payload.astronaut_id,
                status="synced"
            )
            db.add(receipt)
            processed_count += 1
            receipts.append(SyncReceiptItem(event_id=obs.event_id, status="synced"))
        except Exception as e:
            error_count += 1
            receipts.append(SyncReceiptItem(event_id=obs.event_id, status="error", error_message=str(e)))

    # 2. Process Sleep Sessions
    for slp in payload.sleep_sessions:
        try:
            existing = await db.execute(
                select(SleepSession).where(SleepSession.event_id == slp.event_id)
            )
            if existing.scalars().first():
                duplicate_count += 1
                receipts.append(SyncReceiptItem(event_id=slp.event_id, status="duplicate"))
                continue

            record = SleepSession(
                event_id=slp.event_id,
                astronaut_id=payload.astronaut_id,
                started_at=slp.started_at,
                ended_at=slp.ended_at,
                duration_minutes=slp.duration_minutes,
                sleep_efficiency=slp.sleep_efficiency,
                source=slp.source,
                quality=slp.quality
            )
            db.add(record)
            processed_count += 1
            receipts.append(SyncReceiptItem(event_id=slp.event_id, status="synced"))
        except Exception as e:
            error_count += 1
            receipts.append(SyncReceiptItem(event_id=slp.event_id, status="error", error_message=str(e)))

    # 3. Process Fatigue Assessments
    for ftg in payload.fatigue_assessments:
        try:
            existing = await db.execute(
                select(FatigueAssessment).where(FatigueAssessment.event_id == ftg.event_id)
            )
            if existing.scalars().first():
                duplicate_count += 1
                receipts.append(SyncReceiptItem(event_id=ftg.event_id, status="duplicate"))
                continue

            record = FatigueAssessment(
                event_id=ftg.event_id,
                astronaut_id=payload.astronaut_id,
                reported_at=ftg.reported_at,
                score=ftg.score,
                notes=ftg.notes
            )
            db.add(record)
            processed_count += 1
            receipts.append(SyncReceiptItem(event_id=ftg.event_id, status="synced"))
        except Exception as e:
            error_count += 1
            receipts.append(SyncReceiptItem(event_id=ftg.event_id, status="error", error_message=str(e)))

    # 4. Process Locally Detected Anomalies
    for anom in payload.anomalies:
        try:
            if anom.event_id:
                existing = await db.execute(
                    select(AnomalyEvent).where(AnomalyEvent.event_id == anom.event_id)
                )
                if existing.scalars().first():
                    duplicate_count += 1
                    receipts.append(SyncReceiptItem(event_id=anom.event_id, status="duplicate"))
                    continue

            record = AnomalyEvent(
                event_id=anom.event_id or uuid.uuid4(),
                astronaut_id=payload.astronaut_id,
                detector_name=anom.detector_name,
                detector_version=anom.detector_version,
                detected_at=anom.detected_at,
                severity=anom.severity,
                status=anom.status,
                anomaly_score=anom.anomaly_score,
                explanation=anom.explanation,
                recommended_action=anom.recommended_action,
                data_quality_summary=anom.data_quality_summary
            )
            db.add(record)
            processed_count += 1
            if anom.event_id:
                receipts.append(SyncReceiptItem(event_id=anom.event_id, status="synced"))
        except Exception as e:
            error_count += 1
            if anom.event_id:
                receipts.append(SyncReceiptItem(event_id=anom.event_id, status="error", error_message=str(e)))

    await db.commit()

    await log_audit_event(
        db,
        action="sync_batch_processed",
        entity_type="astronaut_profile",
        entity_id=payload.astronaut_id,
        actor_id=current_user.id,
        metadata={"processed": processed_count, "duplicate": duplicate_count, "error": error_count}
    )

    return BatchSyncResponse(
        astronaut_id=payload.astronaut_id,
        processed_count=processed_count,
        duplicate_count=duplicate_count,
        error_count=error_count,
        receipts=receipts
    )
