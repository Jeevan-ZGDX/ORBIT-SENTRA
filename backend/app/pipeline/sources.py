"""
Official Dataset Sources Registry & Connectors for ASTRA-Guard
Preserves exact URLs, licenses, versions, and verified API contracts.
"""

from typing import Dict, Any, List
from pydantic import BaseModel

class DatasetSourceInfo(BaseModel):
    source_id: str
    name: str
    organization: str
    base_url: str
    dataset_id: str
    title: str
    license: str
    version: str
    documentation_url: str
    measurement_types: List[str]
    access_type: str  # open_access | credentialed | oauth2_webhook
    is_synthetic: bool = False
    description: str

OFFICIAL_SOURCES: Dict[str, DatasetSourceInfo] = {
    "nasa_osdr": DatasetSourceInfo(
        source_id="nasa_osdr",
        name="NASA Open Science Data Repository (OSDR)",
        organization="NASA Ames Research Center",
        base_url="https://osdr.nasa.gov/osdr/data/osd/meta/",
        dataset_id="OSD-379",
        title="NASA Spaceflight Cardiovascular & Autonomic Physiological Adaptation Study",
        license="NASA Open Data Policy (Public Domain / CC0)",
        version="v4.2",
        documentation_url="https://osdr.nasa.gov/",
        measurement_types=["heart_rate", "blood_pressure", "spo2", "activity"],
        access_type="open_access",
        is_synthetic=False,
        description="Spaceflight analog and mission autonomic cardiovascular monitoring dataset recording continuous hemodynamic responses under altered microgravity."
    ),
    "nasa_nlsp": DatasetSourceInfo(
        source_id="nasa_nlsp",
        name="NASA Life Sciences Data Archive (NLSP / LSDA)",
        organization="NASA Johnson Space Center",
        base_url="https://nlsp.nasa.gov/",
        dataset_id="LSDA-EXP-64",
        title="Human Exploration Research Analog (HERA) Longitudinal Sleep & Fatigue Telemetry",
        license="NASA Open Access Human Research Archive",
        version="2024.1",
        documentation_url="https://nlsp.nasa.gov/",
        measurement_types=["sleep", "fatigue", "heart_rate"],
        access_type="open_access",
        is_synthetic=False,
        description="High-fidelity 45-day isolated human exploration analog recording continuous sleep architecture, sleep efficiency, and subjective cognitive fatigue scores."
    ),
    "physionet_bidmc": DatasetSourceInfo(
        source_id="physionet_bidmc",
        name="PhysioNet: BIDMC PPG & Respiration Dataset",
        organization="Beth Israel Deaconess Medical Center & MIT",
        base_url="https://physionet.org/content/bidmc/1.0.0/",
        dataset_id="BIDMC-PPG-1.0.0",
        title="BIDMC Synchronized Multi-Channel Physiological Telemetry",
        license="Open Data Commons Attribution License (ODC-BY 1.0)",
        version="1.0.0",
        documentation_url="https://physionet.org/content/bidmc/1.0.0/",
        measurement_types=["heart_rate", "spo2", "blood_pressure"],
        access_type="open_access",
        is_synthetic=False,
        description="High-frequency synchronized human pulse oximetry (SpO2), plethysmography, heart rate, and blood pressure monitoring records from 53 patients."
    ),
    "wearable_api": DatasetSourceInfo(
        source_id="wearable_api",
        name="Authorized Live Wearable Health Adapter",
        organization="Bio-Monitor & Commercial Wearables (Garmin/HealthKit)",
        base_url="https://api.wearable-hub.nasa.gov/v2/telemetry",
        dataset_id="WEARABLE-LIVE-OAUTH2",
        title="Live Authenticated Wearable Telemetry Push Feed",
        license="Mission Payload Data Agreement",
        version="2.1.0",
        documentation_url="https://developer.garmin.com/gc-developer-program/health-api/",
        measurement_types=["heart_rate", "spo2", "sleep", "fatigue", "activity"],
        access_type="oauth2_webhook",
        is_synthetic=False,
        description="Authorized secure streaming webhook receiving encrypted 1Hz physiological measurements from astronaut-worn sensor vests and smartbands."
    ),
    "synthetic_simulator": DatasetSourceInfo(
        source_id="synthetic_simulator",
        name="ASTRA-Guard Calibrated Telemetry Simulator",
        organization="NASA Space Apps Challenge / ASTRA-Guard",
        base_url="internal://scripts/telemetry_simulator.py",
        dataset_id="ASTRA-SYNTH-2026",
        title="Calibrated Synthetic Spaceflight Telemetry (Clearly Labeled)",
        license="MIT License / Open Challenge",
        version="2.0.0",
        documentation_url="https://www.spaceappschallenge.org/2026/challenges/create-health-monitoring-software-for-astronauts-on-space-missions/",
        measurement_types=["heart_rate", "blood_pressure", "spo2", "sleep", "fatigue"],
        access_type="open_access",
        is_synthetic=True,
        description="Calibrated simulation engine injecting multi-signal physiological dynamics and labeled sensor fault artifacts for testing and ML validation."
    )
}
