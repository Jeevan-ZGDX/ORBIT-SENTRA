#!/usr/bin/env python3
"""
ASTRA-Guard Telemetry Simulator
NASA Space Apps Challenge 2026

Generates realistic astronaut physiological & behavioral time-series data:
- Heart Rate (bpm)
- Blood Pressure (systolic/diastolic mmHg)
- Oxygen Saturation (SpO2 %)
- Sleep Sessions (duration minutes, efficiency %)
- Subjective Fatigue (0-10 scale)

Supports:
- Modes: 'csv' (bulk dataset generation) or 'stream' (live event output/HTTP push)
- Scenarios: 'baseline', 'hypoxia_fatigue' (multi-signal anomaly), 'sensor_fault'
- Labeled data quality & contextual annotations
"""

import argparse
import csv
import json
import math
import random
import sys
import time
import uuid
from datetime import datetime, timedelta, timezone

DEFAULT_ASTRONAUT_ID = "11111111-1111-1111-1111-111111111111"
DEFAULT_MISSION_ID = "22222222-2222-2222-2222-222222222222"

class TelemetryGenerator:
    def __init__(self, astronaut_id: str = DEFAULT_ASTRONAUT_ID, seed: int = 42):
        self.astronaut_id = astronaut_id
        random.seed(seed)

    def generate_baseline_series(self, start_time: datetime, count: int, step_seconds: int = 60):
        """Generates healthy astronaut baseline telemetry with circadian variation."""
        records = []
        for i in range(count):
            t = start_time + timedelta(seconds=i * step_seconds)
            hour = t.hour + t.minute / 60.0
            
            # Circadian cycle: slightly lower during sleep (hours 22-06)
            circadian = math.sin((hour - 6) * math.pi / 12)
            
            # Heart rate: 68 + circadian * 8 + noise
            hr_val = round(68 + circadian * 8 + random.gauss(0, 2), 1)
            records.append({
                "event_id": str(uuid.uuid4()),
                "astronaut_id": self.astronaut_id,
                "measurement": "heart_rate",
                "value": hr_val,
                "systolic_value": None,
                "diastolic_value": None,
                "unit": "bpm",
                "observed_at": t.isoformat(),
                "source": "simulator",
                "quality": "valid",
                "context": {"activity": "rest" if (hour < 6 or hour > 22) else "routine_work"}
            })

            # SpO2: 97.5 - 99.5%
            spo2_val = round(max(96.0, min(99.5, 98.2 + random.gauss(0, 0.4))), 1)
            records.append({
                "event_id": str(uuid.uuid4()),
                "astronaut_id": self.astronaut_id,
                "measurement": "spo2",
                "value": spo2_val,
                "systolic_value": None,
                "diastolic_value": None,
                "unit": "percent",
                "observed_at": t.isoformat(),
                "source": "simulator",
                "quality": "valid",
                "context": {"cabin_po2_kpa": 21.2}
            })

            # Blood pressure: every 5 steps
            if i % 5 == 0:
                systolic = round(118 + circadian * 6 + random.gauss(0, 2), 1)
                diastolic = round(76 + circadian * 4 + random.gauss(0, 1.5), 1)
                records.append({
                    "event_id": str(uuid.uuid4()),
                    "astronaut_id": self.astronaut_id,
                    "measurement": "blood_pressure",
                    "value": None,
                    "systolic_value": systolic,
                    "diastolic_value": diastolic,
                    "unit": "mmHg",
                    "observed_at": t.isoformat(),
                    "source": "simulator",
                    "quality": "valid",
                    "context": {"posture": "seated"}
                })
        return records

    def generate_anomaly_series(self, start_time: datetime, count: int, step_seconds: int = 60):
        """
        Generates Multi-Signal Anomaly Scenario:
        Accumulated sleep deficit -> rising fatigue -> resting tachycardia + SpO2 desaturation (Hypoxia).
        """
        records = self.generate_baseline_series(start_time, count, step_seconds)
        anomaly_start_idx = int(count * 0.45)
        
        for i in range(anomaly_start_idx, count):
            progress = (i - anomaly_start_idx) / (count - anomaly_start_idx)
            t = start_time + timedelta(seconds=i * step_seconds)
            
            # Modify the heart rate and spo2 records in this step
            for r in records:
                if r["observed_at"] == t.isoformat():
                    if r["measurement"] == "heart_rate":
                        # Gradual tachycardia: +25 bpm above normal
                        r["value"] = round(r["value"] + (25 * progress) + random.gauss(0, 1.5), 1)
                        r["context"]["scenario_label"] = "anomaly_tachycardia"
                    elif r["measurement"] == "spo2":
                        # Desaturation down to 88-89%
                        r["value"] = round(max(87.5, r["value"] - (9.5 * progress) + random.gauss(0, 0.3)), 1)
                        r["context"]["scenario_label"] = "anomaly_hypoxia"
                    elif r["measurement"] == "blood_pressure":
                        # Elevated blood pressure
                        r["systolic_value"] = round(r["systolic_value"] + 18 * progress, 1)
                        r["diastolic_value"] = round(r["diastolic_value"] + 12 * progress, 1)
        return records

    def generate_sensor_fault_series(self, start_time: datetime, count: int, step_seconds: int = 60):
        """
        Generates Sensor Quality Faults:
        - Stale measurements (repeated identical float values)
        - Implausible values (HR = 320 or 0 bpm)
        - Missing readings / noisy spikes
        """
        records = self.generate_baseline_series(start_time, count, step_seconds)
        fault_start_idx = int(count * 0.3)
        
        stale_val = 74.0
        for i in range(fault_start_idx, count):
            t = start_time + timedelta(seconds=i * step_seconds)
            for r in records:
                if r["observed_at"] == t.isoformat():
                    if i % 7 == 0 and r["measurement"] == "heart_rate":
                        # Implausible spike
                        r["value"] = 310.0
                        r["quality"] = "invalid"
                        r["context"]["fault_type"] = "implausible_spike"
                    elif i % 11 == 0:
                        # Dropped sensor
                        r["quality"] = "missing"
                        r["value"] = None
                        r["context"]["fault_type"] = "sensor_drop"
                    elif i % 4 == 0 and r["measurement"] == "spo2":
                        # Stale reading
                        r["value"] = stale_val
                        r["quality"] = "stale"
                        r["context"]["fault_type"] = "stale_freeze"
        return records

    def generate_sleep_and_fatigue(self, start_date: datetime, days: int = 7, anomaly: bool = False):
        """Generates daily sleep session and subjective fatigue logs."""
        sleep_records = []
        fatigue_records = []

        for d in range(days):
            day_t = start_date + timedelta(days=d)
            sleep_start = day_t.replace(hour=22, minute=random.randint(0, 30), second=0)
            
            if anomaly and d >= (days - 3):
                # Anomaly: restricted sleep (3.5 - 4.5 hours), poor efficiency
                duration = random.randint(210, 270)
                efficiency = round(random.uniform(55.0, 68.0), 1)
                fatigue_score = random.randint(7, 9)
                notes = "Severe sleep fragmentation, persistent cognitive fatigue reported."
            else:
                duration = random.randint(430, 490)
                efficiency = round(random.uniform(84.0, 94.0), 1)
                fatigue_score = random.randint(1, 3)
                notes = "Normal rest cycle, refreshed upon waking."

            sleep_end = sleep_start + timedelta(minutes=duration)
            
            sleep_records.append({
                "event_id": str(uuid.uuid4()),
                "astronaut_id": self.astronaut_id,
                "started_at": sleep_start.isoformat(),
                "ended_at": sleep_end.isoformat(),
                "duration_minutes": duration,
                "sleep_efficiency": efficiency,
                "source": "simulator",
                "quality": "valid",
                "metadata": {"cycle_day": d + 1}
            })

            fatigue_records.append({
                "event_id": str(uuid.uuid4()),
                "astronaut_id": self.astronaut_id,
                "reported_at": (sleep_end + timedelta(minutes=30)).isoformat(),
                "score": fatigue_score,
                "scale_version": "fatigue-0-10-v1",
                "source": "simulator",
                "notes": notes
            })

        return sleep_records, fatigue_records

def main():
    parser = argparse.ArgumentParser(description="ASTRA-Guard Telemetry Simulator")
    parser.add_argument("--mode", choices=["csv", "stream", "json"], default="csv", help="Output mode")
    parser.add_argument("--scenario", choices=["baseline", "hypoxia_fatigue", "sensor_fault"], default="baseline", help="Scenario to simulate")
    parser.add_argument("--count", type=int, default=120, help="Number of time steps to generate")
    parser.add_argument("--step-seconds", type=int, default=60, help="Interval between measurements in seconds")
    parser.add_argument("--output", type=str, default="", help="File path to write CSV or JSON output")
    args = parser.parse_args()

    generator = TelemetryGenerator()
    start_time = datetime.now(timezone.utc) - timedelta(seconds=args.count * args.step_seconds)

    if args.scenario == "baseline":
        records = generator.generate_baseline_series(start_time, args.count, args.step_seconds)
    elif args.scenario == "hypoxia_fatigue":
        records = generator.generate_anomaly_series(start_time, args.count, args.step_seconds)
    else:
        records = generator.generate_sensor_fault_series(start_time, args.count, args.step_seconds)

    sleep_recs, fatigue_recs = generator.generate_sleep_and_fatigue(
        start_time, 
        days=max(3, args.count // 30), 
        anomaly=(args.scenario == "hypoxia_fatigue")
    )

    if args.mode == "csv":
        out_file = args.output if args.output else f"scripts/scenarios/{args.scenario}_telemetry.csv"
        fieldnames = ["event_id", "astronaut_id", "measurement", "value", "systolic_value", "diastolic_value", "unit", "observed_at", "source", "quality", "context"]
        with open(out_file, "w", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for r in records:
                row = dict(r)
                row["context"] = json.dumps(row["context"])
                writer.writerow(row)
        print(f"Generated {len(records)} observations to {out_file}")

    elif args.mode == "json":
        out_file = args.output if args.output else f"scripts/scenarios/{args.scenario}_full.json"
        payload = {
            "scenario": args.scenario,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "observations": records,
            "sleep_sessions": sleep_recs,
            "fatigue_assessments": fatigue_recs
        }
        with open(out_file, "w") as f:
            json.dump(payload, f, indent=2)
        print(f"Exported complete scenario dataset to {out_file}")

    elif args.mode == "stream":
        print(f"Streaming {args.scenario} telemetry ({args.count} steps)... (Press Ctrl+C to stop)")
        for r in records:
            print(json.dumps(r))
            time.sleep(0.05)

if __name__ == "__main__":
    main()
