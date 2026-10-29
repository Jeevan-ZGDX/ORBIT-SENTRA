import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc

from backend.app.core.database import get_db
from backend.app.models.entities import (
    AppUser, HealthObservation, SleepSession, FatigueAssessment, AstronautProfile
)
from backend.app.schemas.domain import (
    ObservationResponse, SleepSessionCreate, FatigueAssessmentCreate
)
from backend.app.api.deps import get_current_user

router = APIRouter(prefix="/vitals", tags=["Vitals & Telemetry"])

@router.get("/observations", response_model=List[ObservationResponse])
async def list_observations(
    astronaut_id: uuid.UUID,
    measurement: Optional[str] = None,
    limit: int = Query(default=100, le=1000),
    current_user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(HealthObservation).where(HealthObservation.astronaut_id == astronaut_id)
    if measurement:
        query = query.where(HealthObservation.measurement == measurement)
    query = query.order_by(desc(HealthObservation.observed_at)).limit(limit)
    
    result = await db.execute(query)
    records = result.scalars().all()
    return records

@router.get("/summary/{astronaut_id}")
async def get_astronaut_summary(
    astronaut_id: uuid.UUID,
    current_user: AppUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Fetch profile
    prof_q = select(AstronautProfile).where(AstronautProfile.id == astronaut_id)
    prof = (await db.execute(prof_q)).scalars().first()
    if not prof:
        raise HTTPException(status_code=404, detail="Astronaut not found")

    # Fetch latest observations for HR, BP, SpO2
    vitals_summary = {}
    for m in ["heart_rate", "blood_pressure", "spo2"]:
        q = (
            select(HealthObservation)
            .where(HealthObservation.astronaut_id == astronaut_id, HealthObservation.measurement == m)
            .order_by(desc(HealthObservation.observed_at))
            .limit(1)
        )
        res = (await db.execute(q)).scalars().first()
        if res:
            vitals_summary[m] = {
                "value": float(res.value) if res.value is not None else None,
                "systolic": float(res.systolic_value) if res.systolic_value is not None else None,
                "diastolic": float(res.diastolic_value) if res.diastolic_value is not None else None,
                "unit": res.unit,
                "observed_at": res.observed_at.isoformat(),
                "quality": res.quality
            }

    # Latest sleep
    sleep_q = (
        select(SleepSession)
        .where(SleepSession.astronaut_id == astronaut_id)
        .order_by(desc(SleepSession.started_at))
        .limit(1)
    )
    last_sleep = (await db.execute(sleep_q)).scalars().first()

    # Latest fatigue
    fatigue_q = (
        select(FatigueAssessment)
        .where(FatigueAssessment.astronaut_id == astronaut_id)
        .order_by(desc(FatigueAssessment.reported_at))
        .limit(1)
    )
    last_fatigue = (await db.execute(fatigue_q)).scalars().first()

    return {
        "astronaut_id": str(prof.id),
        "callsign": prof.callsign,
        "baseline_status": prof.baseline_status,
        "latest_vitals": vitals_summary,
        "latest_sleep": {
            "duration_minutes": last_sleep.duration_minutes,
            "sleep_efficiency": float(last_sleep.sleep_efficiency) if last_sleep and last_sleep.sleep_efficiency else None,
            "started_at": last_sleep.started_at.isoformat() if last_sleep else None
        } if last_sleep else None,
        "latest_fatigue": {
            "score": last_fatigue.score,
            "reported_at": last_fatigue.reported_at.isoformat() if last_fatigue else None,
            "notes": last_fatigue.notes
        } if last_fatigue else None
    }
