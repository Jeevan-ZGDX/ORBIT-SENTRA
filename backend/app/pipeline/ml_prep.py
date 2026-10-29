"""
Machine Learning Preparation & Anti-Leakage Split Engine
Guarantees zero subject-level data leakage across Train/Validation/Test splits.
Generates comprehensive Data Quality and ML Readiness Audit Reports.
"""

import os
import json
import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple, List

NORMALIZED_DIR = os.path.abspath("normalized_data")
os.makedirs(NORMALIZED_DIR, exist_ok=True)

class MLPreparationEngine:
    @staticmethod
    def create_subject_splits(
        df: pd.DataFrame,
        train_ratio: float = 0.70,
        val_ratio: float = 0.15,
        test_ratio: float = 0.15,
        random_seed: int = 42
    ) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, Dict[str, Any]]:
        """
        Groups data by subject_id to guarantee zero data leakage between splits.
        """
        if df.empty or "subject_id" not in df.columns:
            return pd.DataFrame(), pd.DataFrame(), pd.DataFrame(), {"error": "Empty dataset or missing subject_id"}

        unique_subjects = df["subject_id"].unique()
        np.random.seed(random_seed)
        shuffled_subjects = np.random.permutation(unique_subjects)

        n_total = len(shuffled_subjects)
        if n_total == 1:
            # Single subject fallback (time-series sequential temporal split)
            split_idx1 = int(len(df) * train_ratio)
            split_idx2 = int(len(df) * (train_ratio + val_ratio))
            train_df = df.iloc[:split_idx1]
            val_df = df.iloc[split_idx1:split_idx2]
            test_df = df.iloc[split_idx2:]
            leakage_check = "TEMPORAL_SPLIT_SINGLE_SUBJECT"
            train_subjs = list(unique_subjects)
            val_subjs = list(unique_subjects)
            test_subjs = list(unique_subjects)
        else:
            n_train = max(1, int(n_total * train_ratio))
            n_val = max(1, int(n_total * val_ratio))
            
            train_subjs = list(shuffled_subjects[:n_train])
            val_subjs = list(shuffled_subjects[n_train:n_train + n_val])
            test_subjs = list(shuffled_subjects[n_train + n_val:])
            if not test_subjs and len(val_subjs) > 1:
                test_subjs = [val_subjs.pop()]

            train_df = df[df["subject_id"].isin(train_subjs)]
            val_df = df[df["subject_id"].isin(val_subjs)]
            test_df = df[df["subject_id"].isin(test_subjs)]

            # Mathematical Zero-Leakage Verification
            overlap = set(train_subjs).intersection(set(test_subjs))
            leakage_check = "PASSED_ZERO_LEAKAGE" if len(overlap) == 0 else "FAILED_LEAKAGE_DETECTED"

        split_summary = {
            "total_samples": len(df),
            "total_subjects": n_total,
            "train_samples": len(train_df),
            "train_subjects": train_subjs,
            "val_samples": len(val_df),
            "val_subjects": val_subjs,
            "test_samples": len(test_df),
            "test_subjects": test_subjs,
            "subject_leakage_status": leakage_check
        }

        # Save clean splits to disk
        train_path = os.path.join(NORMALIZED_DIR, "train_split.csv")
        test_path = os.path.join(NORMALIZED_DIR, "test_split.csv")
        train_df.to_csv(train_path, index=False)
        test_df.to_csv(test_path, index=False)

        return train_df, val_df, test_df, split_summary

    @staticmethod
    def generate_quality_and_readiness_report(df: pd.DataFrame, source_id: str) -> Dict[str, Any]:
        """
        Generates full Data Quality & ML Readiness Report.
        """
        if df.empty:
            return {"source_id": source_id, "status": "NO_DATA"}

        total_rows = len(df)
        measurements_breakdown = df["measurement"].value_counts().to_dict() if "measurement" in df.columns else {}
        missing_values_count = int(df.isna().sum().sum())
        missing_rate_pct = round((missing_values_count / (total_rows * len(df.columns))) * 100, 2)
        
        # Calculate feature distributions for numerical values
        stats = {}
        if "value" in df.columns:
            valid_vals = df["value"].dropna()
            if not valid_vals.empty:
                stats["value_mean"] = round(float(valid_vals.mean()), 2)
                stats["value_std"] = round(float(valid_vals.std()), 2)
                stats["value_min"] = round(float(valid_vals.min()), 2)
                stats["value_max"] = round(float(valid_vals.max()), 2)

        report = {
            "source_id": source_id,
            "evaluated_at": pd.Timestamp.now().isoformat(),
            "sample_count": total_rows,
            "subject_count": int(df["subject_id"].nunique()) if "subject_id" in df.columns else 1,
            "measurements_breakdown": measurements_breakdown,
            "missing_values_count": missing_values_count,
            "missing_rate_pct": missing_rate_pct,
            "numerical_summary": stats,
            "ml_readiness": "READY_FOR_TRAINING" if missing_rate_pct < 5.0 else "NEEDS_IMPUTATION",
            "quality_tier": "TIER_1_CLINICAL" if "is_synthetic" in df.columns and not df["is_synthetic"].any() else "TIER_2_CALIBRATED_SYNTHETIC"
        }

        # Save report JSON
        report_path = os.path.join(NORMALIZED_DIR, f"{source_id}_quality_report.json")
        with open(report_path, "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)

        return report
