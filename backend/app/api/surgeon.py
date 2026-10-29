import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload

from backend.app.core.database import get_db
from backend.app.models.entities import (
    AppUser, AnomalyEvent, AlertReview, AuditEvent, AstronautProfile
)
from backend.app.schemas.domain import (
    AnomalyResponse, AlertReviewCreate, AlertReviewResponse
)
from backend.app.api.deps import get_current_user, require_role, log_audit_event

router = APIRouter(prefix="/surgeon", tags=["Flight Surgeon Review Portal"])

@router.get("/anomalies", response_model=List[AnomalyResponse])
async def list_anomalies(
    astronaut_id: Optional[uuid.UUID] = None,
    status: Optional[str] = None,
    limit: int = Query(default=50, le=200),
    current_user: AppUser = Depends(require_role(["flight_surgeon", "administrator"])),
    db: AsyncSession = Depends(get_db)
):
    query = select(AnomalyEvent).options(selectinload(AnomalyEvent.reviews).selectinload(AlertReview.reviewer))
    if astronaut_id:
        query = query.where(AnomalyEvent.astronaut_id == astronaut_id)
    if status:
        query = query.where(AnomalyEvent.status == status)
    query = query.order_by(desc(AnomalyEvent.detected_at)).limit(limit)

    result = await db.execute(query)
    anomalies = result.scalars().all()

    response = []
    for a in anomalies:
        revs = []
        for r in a.reviews:
            revs.append(AlertReviewResponse(
                id=r.id,
                anomaly_id=r.anomaly_id,
                reviewer_id=r.reviewer_id,
                reviewer_name=r.reviewer.display_name if r.reviewer else "Flight Surgeon",
                action=r.action,
                notes=r.notes,
                reviewed_at=r.reviewed_at
            ))
        response.append(AnomalyResponse(
            id=a.id,
            event_id=a.event_id,
            astronaut_id=a.astronaut_id,
            detector_name=a.detector_name,
            detector_version=a.detector_version,
            detected_at=a.detected_at,
            severity=a.severity,
            status=a.status,
            anomaly_score=float(a.anomaly_score) if a.anomaly_score is not None else None,
            explanation=a.explanation,
            recommended_action=a.recommended_action,
            data_quality_summary=a.data_quality_summary,
            reviews=revs
        ))
    return response

@router.post("/anomalies/{anomaly_id}/review", response_model=AlertReviewResponse)
async def review_anomaly(
    anomaly_id: uuid.UUID,
    payload: AlertReviewCreate,
    current_user: AppUser = Depends(require_role(["flight_surgeon", "administrator"])),
    db: AsyncSession = Depends(get_db)
):
    # Fetch anomaly
    anom_q = select(AnomalyEvent).where(AnomalyEvent.id == anomaly_id)
    anomaly = (await db.execute(anom_q)).scalars().first()
    if not anomaly:
        raise HTTPException(status_code=404, detail="Anomaly alert not found")

    # Update anomaly status
    if payload.action in ["acknowledged", "under_review", "resolved", "dismissed"]:
        anomaly.status = payload.action

    # Append immutable review record
    review = AlertReview(
        anomaly_id=anomaly.id,
        reviewer_id=current_user.id,
        action=payload.action,
        notes=payload.notes
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)

    await log_audit_event(
        db,
        action=f"alert_review_{payload.action}",
        entity_type="anomaly_event",
        entity_id=anomaly.id,
        actor_id=current_user.id,
        metadata={"action": payload.action, "notes": payload.notes}
    )

    return AlertReviewResponse(
        id=review.id,
        anomaly_id=review.anomaly_id,
        reviewer_id=review.reviewer_id,
        reviewer_name=current_user.display_name,
        action=review.action,
        notes=review.notes,
        reviewed_at=review.reviewed_at
    )

@router.get("/audit-logs")
async def list_audit_logs(
    limit: int = Query(default=100, le=500),
    current_user: AppUser = Depends(require_role(["flight_surgeon", "administrator"])),
    db: AsyncSession = Depends(get_db)
):
    q = select(AuditEvent).order_by(desc(AuditEvent.occurred_at)).limit(limit)
    res = await db.execute(q)
    return res.scalars().all()
