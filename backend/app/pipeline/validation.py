"""
Data Quality & Physiological Range Validation Engine
Computes completeness, missingness, physiological range sanity, SNR, and generates Data Quality Reports.
"""

from typing import Dict, Any, List, Tuple
import pandas as pd
import numpy as np

PHYSIOLOGICAL_RANGES = {
    "heart_rate": {"min": 30.0, "max": 240.0, "unit": "bpm"},
    "spo2": {"min": 50.0, "max": 100.0, "unit": "percent"},
    "bp_systolic": {"min": 40.0, "max": 260.0, "unit": "mmHg"},
    "bp_diastolic": {"min": 30.0, "max": 160.0, "unit": "mmHg"},
    "sleep_duration_min": {"min": 0, "max": 1440, "unit": "minutes"},
    "sleep_efficiency": {"min": 0.0, "max": 100.0, "unit": "percent"},
    "fatigue_score": {"min": 0, "max": 10, "unit": "score_0_10"}
}

class ValidationEngine:
    @staticmethod
    def validate_records(records: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        if not records:
            return [], {"total_records": 0, "valid_count": 0, "quality_score": 0.0}

        df = pd.DataFrame(records)
        total_count = len(df)
        valid_records = []
        invalid_count = 0
        missing_count = 0
        range_violations = 0

        for r in records:
            is_valid = True
            reasons = []

            # Check physiological metrics if present
            for metric, bounds in PHYSIOLOGICAL_RANGES.items():
                if metric in r and r[metric] is not None:
                    try:
                        val = float(r[metric])
                        if val < bounds["min"] or val > bounds["max"]:
                            is_valid = False
                            range_violations += 1
                            reasons.append(f"{metric}={val} out of biological bounds [{bounds['min']}, {bounds['max']}]")
                    except (ValueError, TypeError):
                        is_valid = False
                        reasons.append(f"{metric} not a valid numeric")

            r_clean = dict(r)
            if is_valid:
                r_clean["quality"] = "valid"
                valid_records.append(r_clean)
            else:
                r_clean["quality"] = "invalid"
                r_clean["rejection_reasons"] = reasons
                invalid_count += 1

        quality_score = round(((total_count - invalid_count) / total_count) * 100, 2) if total_count > 0 else 0.0

        report = {
            "total_records": total_count,
            "valid_records": len(valid_records),
            "invalid_records": invalid_count,
            "range_violations": range_violations,
            "completeness_pct": round((len(valid_records) / total_count) * 100, 2) if total_count > 0 else 0.0,
            "quality_score": quality_score,
            "status": "PASSED" if quality_score >= 90.0 else "WARNING"
        }

        return valid_records, report
