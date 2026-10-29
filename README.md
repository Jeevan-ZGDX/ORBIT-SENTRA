# ASTRA-Guard: AI-Powered Astronaut Health Monitoring & Early Warning System
**NASA Space Apps Challenge 2026** — *Create Health Monitoring Software for Astronauts on Space Missions*

ASTRA-Guard is an offline-first astronaut health monitoring and early warning application designed for deep-space missions (such as Mars transit). It unifies longitudinal physiological indicators, personalized statistical anomaly detection, explainable alerts, and resilient offline synchronization.

---

## 🚀 Key Innovations

1. **Personalized Baseline & Anomaly Detection:** Rather than relying solely on generalized static thresholds, ASTRA-Guard calculates astronaut-specific baseline distributions using **Median Absolute Deviation (MAD)** and **EWMA** rolling trends.
2. **Multi-Signal Context-Aware Analysis:** Correlates physiological observations (Heart Rate, Blood Pressure, SpO₂) with behavioral indicators (Sleep Duration, Sleep Efficiency, Fatigue Score) to detect compound anomalies like acute hypoxia under cumulative sleep debt.
3. **Data Quality Awareness:** Distinguishes sensor faults (implausible spikes, frozen/stale telemetry, packet dropouts) from real physiological crises.
4. **Offline-First Continuity:** Essential monitoring, local analytics, and alert explanations execute entirely client-side inside the PWA using **Dexie.js (IndexedDB)** and a pure TypeScript inference engine.
5. **Idempotent Batch Synchronization:** Queues local observations during deep-space communication blackouts and synchronizes them idempotently with the **FastAPI/PostgreSQL** backend upon reconnection.
6. **Flight Surgeon Clinical Review Portal:** Provides flight surgeons with role-based clinical review, immutable annotations, and a tamper-evident audit trail.

---

## 📁 Repository Structure

```
.
├── backend/                  # FastAPI Application (Python 3.14+)
│   ├── app/
│   │   ├── api/              # Endpoints: /auth, /vitals, /sync, /surgeon
│   │   ├── core/             # JWT Auth, database configuration, security
│   │   ├── models/           # SQLAlchemy 2.0 ORM models (PostgreSQL ENUMs)
│   │   └── schemas/          # Pydantic v2 schemas & idempotency validation
│   └── tests/                # Pytest async test suite (Auth, Vitals, Idempotent Sync)
├── frontend/                 # Next.js 14+ PWA Application (React, TypeScript, Tailwind CSS)
│   ├── src/
│   │   ├── app/              # Next.js App Router (Dashboard & Flight Surgeon Portal)
│   │   ├── components/       # Vitals Cards, Recharts Trend Lines, Alert Banners
│   │   ├── db/               # Dexie.js offline IndexedDB repository
│   │   ├── engine/           # Pure TypeScript Anomaly Detection Engine (MAD/EWMA/Rules)
│   │   └── types/            # Shared TypeScript domain interfaces
├── database/                 # PostgreSQL DDL & Seed Data
│   └── schema.sql            # Full database schema (15 tables, enums, indices)
├── scripts/
│   ├── telemetry_simulator.py# Deterministic simulator (Normal, Hypoxia, Faults)
│   └── run_dev.sh            # Native multi-service orchestrator
└── docs/                     # PRD, Architecture diagram, and research references
```

---

## 🛠️ Quick Start (Local Development)

### 1. Prerequisites
- Docker (for PostgreSQL)
- Node.js 18+ and npm
- Python 3.10+

### 2. Launch Local Environment
Run the orchestrator script to start PostgreSQL, the FastAPI backend, and Next.js:

```bash
./scripts/run_dev.sh
```

- **Frontend Mission Control:** [http://localhost:3000](http://localhost:3000)
- **FastAPI OpenAPI Swagger:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Backend Health Check:** [http://localhost:8000/health](http://localhost:8000/health)

---

## 🧪 Running the 4-Scene Demonstration

On the frontend header at [http://localhost:3000](http://localhost:3000), use the interactive demo bar:

1. **Scene 1 (Baseline Trends):** Generates 25 nominal telemetry samples to establish the astronaut's personal baseline envelope.
2. **Scene 2 (Inject Anomaly):** Injects a multi-signal crisis (sleep deficit + subjective fatigue 8/10 + SpO₂ dropping to 88.5% + tachycardia). Evaluates the alert locally and provides explainable guidance grounded in NASA-STD-3001v1.
3. **Scene 3 (Offline Operation):** Simulates a deep-space communications blackout. Shows that telemetry ingestion and local anomaly detection remain 100% operational offline.
4. **Scene 4 (Reconnect & Review):** Restores connectivity, executes idempotent batch synchronization to the server, and switches to the Flight Surgeon view to annotate and sign off on the alert.
