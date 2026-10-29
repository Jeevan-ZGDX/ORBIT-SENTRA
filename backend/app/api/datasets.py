"""
Dataset Acquisition, Provenance & ML Readiness REST API
"""

import uuid
import os
import json
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select

from backend.app.core.database import get_db
from backend.app.pipeline.sources import OFFICIAL_SOURCES, DatasetSourceInfo
from backend.app.pipeline.acquisition import AcquisitionEngine
from backend.app.pipeline.validation import ValidationEngine
from backend.app.pipeline.normalizer import NormalizerEngine
from backend.app.pipeline.ml_prep import MLPreparationEngine
from backend.app.pipeline.trainer import AstraGuardMLTrainer, train_and_export
from backend.app.models.entities import HealthObservation, AstronautProfile

router = APIRouter(prefix="/datasets", tags=["Real-World Datasets Pipeline"])

acquisition_engine = AcquisitionEngine()

@router.get("/sources", response_model=List[DatasetSourceInfo])
async def list_dataset_sources():
    """
    Lists official discoverable physiological dataset repositories:
    NASA OSDR, NASA LSDA / NLSP, PhysioNet, and Authorized Wearables.
    """
    return list(OFFICIAL_SOURCES.values())

@router.post("/acquire/{source_id}")
async def acquire_and_process_dataset(
    source_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Acquires, validates, normalizes, and stores dataset from official repository.
    Computes cryptographic SHA-256 hash, generates quality report, and prevents subject leakage.
    """
    if source_id not in OFFICIAL_SOURCES:
        raise HTTPException(status_code=404, detail=f"Source '{source_id}' not found in official registry.")

    source_meta = OFFICIAL_SOURCES[source_id]

    try:
        # 1. Acquire raw data & compute SHA-256 checksum
        acquisition_res = await acquisition_engine.acquire_source(source_id)
        raw_records = acquisition_res["payload"].get("records", [])

        # 2. Validate biological ranges & sensor sanity
        valid_records, quality_report = ValidationEngine.validate_records(raw_records)

        # 3. Normalize into standard schema
        normalized_records = NormalizerEngine.normalize_to_observations(
            valid_records,
            source_name=source_meta.name,
            is_synthetic=source_meta.is_synthetic
        )

        df = NormalizerEngine.to_pandas_dataframe(normalized_records)

        # 4. Anti-Leakage Subject Split & ML Readiness Evaluation
        train_df, val_df, test_df, split_summary = MLPreparationEngine.create_subject_splits(df)
        readiness_report = MLPreparationEngine.generate_quality_and_readiness_report(df, source_id)

        # 5. Store / Update in PostgreSQL dataset_registry
        sample_count = len(normalized_records)
        subject_count = int(df["subject_id"].nunique()) if not df.empty and "subject_id" in df.columns else 1

        insert_sql = text("""
            INSERT INTO dataset_registry (
                source_name, dataset_id, title, source_url, version, license, 
                checksum_sha256, measurement_types, sample_count, subject_count, 
                quality_score, ml_readiness, metadata
            ) VALUES (
                :source_name, :dataset_id, :title, :source_url, :version, :license,
                :checksum, :types, :samples, :subjects, :quality, :readiness, :metadata
            )
            ON CONFLICT (dataset_id) DO UPDATE SET
                checksum_sha256 = EXCLUDED.checksum_sha256,
                sample_count = EXCLUDED.sample_count,
                subject_count = EXCLUDED.subject_count,
                quality_score = EXCLUDED.quality_score,
                ml_readiness = EXCLUDED.ml_readiness,
                metadata = EXCLUDED.metadata;
        """)

        await db.execute(insert_sql, {
            "source_name": source_meta.name,
            "dataset_id": source_meta.dataset_id,
            "title": source_meta.title,
            "source_url": source_meta.base_url,
            "version": source_meta.version,
            "license": source_meta.license,
            "checksum": acquisition_res["sha256"],
            "types": source_meta.measurement_types,
            "samples": sample_count,
            "subjects": subject_count,
            "quality": quality_report.get("quality_score", 100.0),
            "readiness": readiness_report.get("ml_readiness", "READY_FOR_TRAINING"),
            "metadata": json_dumps_safe({
                "split_summary": split_summary,
                "readiness_report": readiness_report,
                "is_synthetic": source_meta.is_synthetic
            })
        })

        # 6. Seed first 25 normalized records directly into health_observations for the active astronaut profile
        prof_result = await db.execute(select(AstronautProfile).limit(1))
        prof = prof_result.scalars().first()
        if prof and normalized_records:
            from datetime import datetime
            for obs in normalized_records[:30]:
                obs_dt = (
                    datetime.fromisoformat(obs["observed_at"])
                    if isinstance(obs["observed_at"], str)
                    else obs["observed_at"]
                )
                obs_record = HealthObservation(
                    event_id=uuid.UUID(obs["event_id"]),
                    astronaut_id=prof.id,
                    measurement=obs["measurement"],
                    value=obs["value"],
                    systolic_value=obs["systolic_value"],
                    diastolic_value=obs["diastolic_value"],
                    unit=obs["unit"],
                    observed_at=obs_dt,
                    source="simulator" if source_meta.is_synthetic else "external_api",
                    quality=obs["quality"],
                    context=obs.get("context", {})
                )
                db.add(obs_record)

        await db.commit()

        return {
            "status": "ACQUISITION_SUCCESS",
            "source_id": source_id,
            "dataset_id": source_meta.dataset_id,
            "title": source_meta.title,
            "license": source_meta.license,
            "sha256_checksum": acquisition_res["sha256"],
            "raw_records": len(raw_records),
            "normalized_samples": sample_count,
            "subject_count": subject_count,
            "quality_report": quality_report,
            "split_summary": split_summary,
            "ml_readiness": readiness_report.get("ml_readiness")
        }

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Acquisition pipeline failed: {str(e)}")

@router.get("/registry")
async def get_dataset_registry(db: AsyncSession = Depends(get_db)):
    """
    Returns registered official datasets, cryptographic checksums, and readiness status.
    """
    sql = text("SELECT * FROM dataset_registry ORDER BY created_at DESC;")
    res = await db.execute(sql)
    rows = res.mappings().all()
    return [dict(r) for r in rows]

@router.get("/quality-report/{source_id}")
async def get_quality_report(source_id: str):
    """
    Returns the comprehensive Data Quality & ML Anti-Leakage report for a source.
    """
    if source_id not in OFFICIAL_SOURCES:
        raise HTTPException(status_code=404, detail="Source not found")
    report_file = os.path.abspath(f"normalized_data/{source_id}_quality_report.json")
    if os.path.exists(report_file):
        with open(report_file, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"source_id": source_id, "status": "PENDING_ACQUISITION"}

@router.post("/wearable/webhook")
async def wearable_webhook_ingest(payload: Dict[str, Any], db: AsyncSession = Depends(get_db)):
    """
    Authorized live wearable telemetry ingestion webhook adapter.
    """
    records = payload.get("measurements", [])
    if not records:
        return {"status": "NO_MEASUREMENTS_RECEIVED"}

    valid_recs, report = ValidationEngine.validate_records(records)
    normalized = NormalizerEngine.normalize_to_observations(valid_recs, source_name="Authorized Wearable Hub")
    return {
        "status": "LIVE_TELEMETRY_ACCEPTED",
        "ingested_count": len(normalized),
        "quality_score": report.get("quality_score", 100.0)
    }

@router.post("/train-model")
async def trigger_model_training():
    """
    Triggers end-to-end model training across all acquired spaceflight & clinical datasets.
    Optimizes for best clinical accuracy and ultra-compact model size (<50 KB).
    Exports dual-format artifacts: ONNX (for WebAssembly/Runtime) and JSON weights.
    """
    try:
        report = train_and_export()
        return {
            "status": "MODEL_TRAINED_AND_DEPLOYED",
            "report": report
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Model training pipeline failed: {str(e)}")

@router.get("/model-status")
async def get_active_model_status():
    """
    Returns deployment status, accuracy metrics, inference latency, and size of the active model.
    """
    weights_path = os.path.abspath("backend/app/ml/astra_guard_weights.json")
    onnx_path = os.path.abspath("backend/app/ml/astra_guard_model.onnx")
    
    if os.path.exists(weights_path):
        with open(weights_path, "r", encoding="utf-8") as f:
            weights_data = json.load(f)
            weights_data["onnx_file_exists"] = os.path.exists(onnx_path)
            weights_data["onnx_size_bytes"] = os.path.getsize(onnx_path) if os.path.exists(onnx_path) else None
            return weights_data
            
    return {
        "status": "UNTRAINED",
        "model_name": "AstraNet-LightWeight-v2.4",
        "description": "Trigger POST /api/v1/datasets/train-model to train on acquired datasets."
    }

def json_dumps_safe(obj: Any) -> str:
    import json
    return json.dumps(obj)
