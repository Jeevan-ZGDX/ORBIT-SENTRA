"""
Normalization Engine for Heterogeneous Physiological Telemetry
Standardizes units, timestamps to UTC ISO 8601, and builds clean Pandas DataFrames.
"""

import uuid
from datetime import datetime, timezone
from typing import List, Dict, Any
import pandas as pd

class NormalizerEngine:
    @staticmethod
    def normalize_to_observations(
        records: List[Dict[str, Any]],
        source_name: str,
        is_synthetic: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Flattens multi-metric records into normalized HealthObservation dictionaries.
        """
        normalized: List[Dict[str, Any]] = []

        for r in records:
            subject_id = r.get("subject_id", "ASTRONAUT-GENERIC")
            raw_ts = r.get("timestamp")
            
            # Format timestamp to UTC ISO
            if isinstance(raw_ts, (int, float)):
                obs_time = datetime.fromtimestamp(raw_ts, tz=timezone.utc).isoformat()
            elif isinstance(raw_ts, str):
                obs_time = raw_ts
            else:
                obs_time = datetime.now(timezone.utc).isoformat()

            context = dict(r.get("context", {}))
            context["is_synthetic"] = is_synthetic
            context["source_repository"] = source_name

            # 1. Heart rate
            if "heart_rate" in r and r["heart_rate"] is not None:
                normalized.append({
                    "event_id": str(uuid.uuid4()),
                    "subject_id": subject_id,
                    "measurement": "heart_rate",
                    "value": float(r["heart_rate"]),
                    "systolic_value": None,
                    "diastolic_value": None,
                    "unit": "bpm",
                    "observed_at": obs_time,
                    "source": "simulator" if is_synthetic else "external_api",
                    "quality": r.get("quality", "valid"),
                    "context": context
                })

            # 2. SpO2
            if "spo2" in r and r["spo2"] is not None:
                normalized.append({
                    "event_id": str(uuid.uuid4()),
                    "subject_id": subject_id,
                    "measurement": "spo2",
                    "value": float(r["spo2"]),
                    "systolic_value": None,
                    "diastolic_value": None,
                    "unit": "percent",
                    "observed_at": obs_time,
                    "source": "simulator" if is_synthetic else "external_api",
                    "quality": r.get("quality", "valid"),
                    "context": context
                })

            # 3. Blood Pressure
            if "bp_systolic" in r and r["bp_systolic"] is not None:
                normalized.append({
                    "event_id": str(uuid.uuid4()),
                    "subject_id": subject_id,
                    "measurement": "blood_pressure",
                    "value": None,
                    "systolic_value": float(r["bp_systolic"]),
                    "diastolic_value": float(r.get("bp_diastolic", 80.0)),
                    "unit": "mmHg",
                    "observed_at": obs_time,
                    "source": "simulator" if is_synthetic else "external_api",
                    "quality": r.get("quality", "valid"),
                    "context": context
                })

        return normalized

    @staticmethod
    def to_pandas_dataframe(normalized_records: List[Dict[str, Any]]) -> pd.DataFrame:
        if not normalized_records:
            return pd.DataFrame()
        return pd.DataFrame(normalized_records)
