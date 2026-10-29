# HILO — Differentiated Feature Upgrade Specification
## Crew Health Mission Digital Twin (CH-MDT) and Evidence-Bounded Counterfactual Planning

**Document type:** Development-ready feature specification  
**Version:** 1.0  
**Status:** Proposed enhancement  
**Target repository:** [Jeevan-ZGDX/ORBIT-SENTRA](https://github.com/Jeevan-ZGDX/ORBIT-SENTRA)  
**Existing application:** HILO — AI-Powered Astronaut Health Monitoring & Early Warning System

> **Scope note:** This is an engineering proposal based on repository-visible README/source material. It does not establish clinical validity or prove that no other project in the world has a similar idea. Any non-validated or simulated output must be labeled clearly.

---

## 1. Executive summary

HILO already has a stronger engineering foundation than a simple health-dashboard prototype: a FastAPI/PostgreSQL backend, an offline-first Next.js PWA, local TypeScript anomaly detection, quality-aware telemetry, a dataset acquisition/normalization/training pipeline, and a flight-surgeon review workflow. Its README describes personalized baselines using Median Absolute Deviation (MAD) and EWMA, multi-signal analysis, stale/spurious telemetry checks, idempotent offline synchronization, and an audit trail.

However, the listed peer projects also describe many of the same headline concepts: per-person baselines, multi-signal risk indicators, natural-language explanations, offline operation, crew monitoring, and AI recommendations. A new feature should therefore do more than add another risk score, chatbot, or chart.

**Recommended differentiator: Crew Health Mission Digital Twin (CH-MDT).** A controlled, deterministic, uncertainty-aware simulation workspace lets the astronaut or flight surgeon explore **“what changes if…?”** scenarios before selecting an operational next step. It replays a recorded or synthetic timeline under explicit assumptions such as communication blackout, telemetry loss, sleep-debt accumulation, delayed review, or a proposed countermeasure. It compares possible future paths, shows which input and rule caused each divergence, and generates a small, integrity-checked evidence packet for delayed mission-control synchronization.

The digital twin is **not** an autonomous medical decision-maker and must not invent clinical outcomes. In the first release it simulates system behavior, telemetry availability, alert timing, data quality, and declared rule outcomes. Where a biological effect is not supported by validated evidence, it must say “effect unknown” rather than fabricating a predicted recovery.

---

## 2. What was reviewed

### HILO repository evidence

Reviewed the public repository README, product requirements document, PostgreSQL schema, client anomaly detector, acquisition and ML-preparation pipeline, and related UI/API files. The README and source structure indicate these existing areas:

- **Offline-first monitoring:** Dexie.js/IndexedDB local persistence and local TypeScript detection.
- **Personal baseline and trend analysis:** MAD-based baseline calculations and EWMA described in the product README/PRD.
- **Data quality:** checks for physiologically implausible samples and repeated/frozen telemetry.
- **Data acquisition and provenance:** registered dataset sources, acquisition timestamps, checksums, validation, normalization, and quality reports.
- **Training preparation:** train/validation/test splitting with subject-level separation logic, plus model export to lightweight formats.
- **Operations:** FastAPI API, PostgreSQL data model, synchronization endpoint, vitals endpoints, dataset endpoints, and Flight Surgeon review UI.

Relevant repository files: [README.md](https://github.com/Jeevan-ZGDX/ORBIT-SENTRA/blob/main/README.md), [PRD file.md](https://github.com/Jeevan-ZGDX/ORBIT-SENTRA/blob/main/PRD%20file.md), [anomaly_detector.ts](https://github.com/Jeevan-ZGDX/ORBIT-SENTRA/blob/main/frontend/src/engine/anomaly_detector.ts), [acquisition.py](https://github.com/Jeevan-ZGDX/ORBIT-SENTRA/blob/main/backend/app/pipeline/acquisition.py), [ml_prep.py](https://github.com/Jeevan-ZGDX/ORBIT-SENTRA/blob/main/backend/app/pipeline/ml_prep.py), and [schema.sql](https://github.com/Jeevan-ZGDX/ORBIT-SENTRA/blob/main/database/schema.sql).

### Peer repository comparison

The descriptions below reflect public README/source files visible during review. Repository descriptions are not equivalent to independently validated model performance; some README claims describe concepts or simulated prototype behavior.

| Peer project | Visible emphasis in repository | Implication for HILO |
|---|---|---|
| [AstroByte Health Monitor](https://github.com/meahadi-hasan10/AstroByte-Health-Monitor) | Interactive telemetry scenarios, heuristic risk index, explainable local summaries, simulated trends, CSV/JSON export, optional historical NASA RadLab sample displayed separately. README labels its health inputs/risk outputs as illustrative. | Basic scenario presets, explanatory risk cards, and export alone are not enough differentiation. HILO should add reproducible paired counterfactual replay and event-level provenance. |
| [ASTRAHEALTH](https://github.com/mdjitumia/Astra-Health-Astronaut-Health-Monitoring) | Personalized trends, multiple physiological/behavioral indicators, risk contributors, early warning, copilot concept, adaptive monitoring, offline concept. The inspected JavaScript includes illustrative crew and metric fixtures. | “Personalized AI health monitoring” is too broad as a unique claim. Emphasize auditable system behavior under mission constraints. |
| [AI Astronaut Health Monitoring](https://github.com/bhavyasreee1234/-AI-Astronaut-Health-Monitoring) | README is a brief, broad statement about AI/ML risk prediction and medical assistance; detailed differentiating implementation was not established from the README. | Insufficient public README evidence to make a reliable feature-by-feature comparison. |
| [Shift-Delete](https://github.com/Shivam6453/Shift-Delete) | React health pages, chatbot/companion and mood analysis code, encryption helpers, and a simple blockchain/hash utility are present in the repository tree. | Mental-wellbeing chat, encryption, or a hash chain alone should not be presented as unique. HILO should use established database/cryptographic primitives and auditable event records rather than inventing a blockchain requirement. |
| [Astro-Mind](https://github.com/niloybhattacharjee1402-glitch/Astro-Mind) | Android app structure includes a predictive-risk engine, personalized intervention screen, mission-guardian screen, team-dynamics screen, local database and AI service. | Predictive labels, interventions, and team-dynamics features are already represented by a peer. Do not compete merely by adding a chatbot or another prediction page. |
| [Create Health Monitoring Software for Astronauts on Space Missions](https://github.com/AyanDas910/Create-Health-Monitoring-Software-for-Astronauts-on-Space-Missions) | React/TypeScript frontend includes live ECG UI, radiation/solar-storm scenario controls, SANS/ocular tracking, cognitive PVT testing, musculoskeletal/bone modules, countermeasure manager and an AI clinical-analysis endpoint. | Domain-specific simulated sensor panels and countermeasure UI are already represented. HILO's novel value can be comparative replay, uncertainty boundaries, offline state transitions and evidence packets. |
| [Lifeline / space-app-AI](https://github.com/godragun/space-app-AI) | Web and Android code includes crew, dashboard, procedures, mission logs, chat/assistant, navigation UI, and a deterministic priority engine assigning crew roles against system threats. | A mission-wide dashboard, role-assignment rule, mission log or generic AI assistant is not sufficient. Focus on traceable health-and-telemetry scenario comparison. |
| [NeuroSpace](https://github.com/Yasir-alhas/neurospace-health-ai) | README describes a multi-model concept covering vitals, sleep/fatigue, bone risk, speech emotion, facial expression, text sentiment and a generated summary report. | Adding more unvalidated models or emotion classifiers is not a responsible differentiator. Prefer transparent inputs, provenance, uncertainty, and reproducible evaluation. |

### Comparison conclusion

The strongest shared themes across these projects are vital dashboards, personal baselines or risk scores, explainable alerts, assistant/chat interfaces, predictive/behavioral concepts, and mission/crew views. This review cannot prove that no peer implements scenario replay internally, and it cannot support a global uniqueness guarantee. HILO's claim should be specific:

> **HILO lets users reproduce, compare and audit health-monitoring system behavior under degraded-mission scenarios, with explicit evidence and uncertainty boundaries, even while disconnected.**

---

## 3. Proposed feature: Crew Health Mission Digital Twin

### 3.1 User story

As an astronaut or authorized flight surgeon, I want to replay a health timeline and compare alternative mission conditions, so that I can understand how missing telemetry, a communication blackout, data-quality faults, delayed review, or a declared operational action affects alert visibility and response timing—without changing the original health record or claiming an unvalidated medical prediction.

### 3.2 Core capabilities

1. **Timeline replay**
   - Select an existing authorized timeline or a clearly labeled synthetic demo.
   - Replay events in observed-time order at 1×, 5×, or 20× speed; allow pause, step, restart and checkpoint.
   - Preserve observed timestamp, received timestamp, source, quality state and sync state.

2. **Counterfactual scenario builder**
   - Clone a timeline into isolated scenario branches; never mutate original observations.
   - Scenario parameters: communications unavailable from T0 to T1; sensor missing/frozen/noisy; delayed packet arrival; selected measurements stale; sleep/fatigue values altered in a synthetic fixture; review latency changed; declared protocol/rule scenario switched.
   - Record the exact parameter edits, the actor, seed, scenario version, and source timeline checksum.

3. **Paired comparison**
   - Show baseline versus scenario timelines side by side.
   - Compare: observation coverage, quality faults detected, time an alert was first available locally, time it could be synchronized, duplicate prevention, unresolved alerts, and missing-data exposure.
   - Show absolute and relative differences only where meaningful; show “not comparable” if a metric cannot be computed.

4. **Rule and evidence trace**
   - Each change in output must link to the specific input events, detector version, rule ID/version, baseline snapshot, and explicit assumption responsible.
   - Distinguish factual observations, derived metrics, simulated events, and illustrative assumptions by type and visual style.
   - Provide an event ledger; compute an append-only hash chain or use equivalent standard integrity controls. A hash chain detects tampering but does not by itself prove who created a record or prevent a privileged operator from replacing the entire chain. Store signed checkpoints or anchors if tamper-evidence against privileged rewriting is required.

5. **Uncertainty and safe comparison**
   - Display input completeness, sensor quality, evidence grade, and whether any assumptions are unsupported.
   - Do not display a numeric biological outcome forecast in the first release.
   - If a countermeasure has no validated effect model, show: “This scenario changes the logged operational state; physiological benefit is unknown.”
   - Never allow generated text to create a new triage level, override safety rules, or prescribe medication.

6. **Offline continuity and sync packet**
   - Persist a running replay, scenario branches, and the latest checkpoint locally.
   - Queue scenario metadata and selected event summaries while disconnected.
   - On reconnect, synchronize idempotently; retain original event IDs and detect conflicting scenario revisions.
   - Generate a compact mission-control packet containing summary, timeline, top evidence references, alert state, quality faults, scenario differences, and checksum. Allow JSON export first; CSV may be added for tabular outputs.

7. **Synthetic mission drills**
   - Include deterministic drills: normal telemetry; sensor freezes; delayed batch arrives after blackout; several sensors fail independently; new critical observation arrives while offline; duplicate re-sync; client clock skew; backend unavailable; original timeline amended after a scenario branch was saved.
   - Label all generated events “SIMULATED” and do not mix them silently with observational records.

### 3.3 Explicit non-goals

- No autonomous diagnosis or prescription.
- No claim to simulate the human body with a validated biological digital twin.
- No predictive mental-health inference from faces, voice or private crew messages.
- No requirement to add blockchain.
- No cloud requirement for the local replay.
- No retraining model as a side effect of replay.
- No modification of original observations.
- No replacement of mission medical procedures or flight-surgeon judgment.

---

## 4. Acceptance criteria

The feature is complete only when the following can be demonstrated and tested:

- [ ] A user can load a permitted baseline timeline or choose a labeled synthetic dataset.
- [ ] Replaying the same input timeline with the same seed and detector versions produces identical event order and deterministic outputs.
- [ ] A new scenario branches from the timeline without mutating original records.
- [ ] A sensor dropout changes quality/coverage metrics and is not misrepresented as a physiological event.
- [ ] A communication blackout leaves local detection running and delays only the relevant remote delivery/synchronization state.
- [ ] A delayed/duplicate batch is reconciled without duplicating original observations or alerts.
- [ ] Each displayed difference links to source events and detector/rule versions.
- [ ] Scenario exports include a provenance manifest, data classifications, timestamps, and SHA-256 integrity checksum.
- [ ] Missing or low-quality inputs create explicit uncertainty and never appear as confidently observed measurements.
- [ ] Unsupported countermeasure effects are rendered as “unknown,” not as a predicted health improvement.
- [ ] Role-based access checks are enforced in the API, not only hidden in the UI.
- [ ] Tests cover time ordering, idempotency, branch immutability, determinism, offline persistence, checksum validation, authorization and failure handling.
- [ ] No benchmark claim (accuracy, reduced risk, earlier detection) is published unless the evaluation protocol and test results exist.

---

## 5. Proposed architecture

### Current stack to retain

- **Frontend:** Next.js App Router, React, TypeScript, Tailwind CSS.
- **Offline persistence:** Dexie.js/IndexedDB.
- **Backend:** FastAPI, asynchronous SQLAlchemy, PostgreSQL.
- **Existing local engine:** TypeScript anomaly/data-quality engine.
- **Existing pipeline:** Python dataset acquisition, validation, normalization, preparation, training and model export.

### New modules

```text
Frontend
  ├── MissionReplayPage
  ├── TimelineReplayController
  ├── ScenarioBranchEditor
  ├── PairedScenarioComparison
  ├── EvidenceTracePanel
  ├── UncertaintyBadge
  └── OfflineMissionPacketExport
         |
         v
Pure TypeScript Scenario Engine (deterministic)
  ├── InputTimelineAdapter
  ├── ScenarioTransformRegistry
  ├── EventClock / ReplayStepper
  ├── Existing AnomalyEngine adapter
  ├── MetricsComparator
  └── ProvenanceManifestBuilder
         |
         +---- IndexedDB (local timeline, branch, checkpoint, outbox)
         |
         v (only when connected)
FastAPI
  ├── /scenarios
  ├── /scenarios/{id}/events
  ├── /scenarios/{id}/compare
  ├── /scenarios/{id}/export
  └── /sync/scenario-packets
         |
         v
PostgreSQL
  ├── scenario_runs
  ├── scenario_parameters
  ├── scenario_events
  ├── scenario_comparisons
  ├── provenance_manifests
  └── existing user/mission/observation/audit structures
```

**Important engineering boundary:** The simulation logic should be deterministic and pure where possible. The backend validates and persists scenario metadata; it must not be required for local replay. If local and server results disagree, preserve both records, mark the divergence, and do not silently pick one.

---

## 6. Data model proposal

Align the final DDL with the actual current schema and existing ORM entities before migration. Proposed tables:

### `scenario_runs`

- `id UUID PRIMARY KEY`
- `mission_id UUID NULL REFERENCES missions(id)`
- `created_by UUID NOT NULL REFERENCES app_users(id)`
- `parent_scenario_id UUID NULL REFERENCES scenario_runs(id)`
- `base_timeline_hash TEXT NOT NULL`
- `scenario_name TEXT NOT NULL`
- `scenario_kind TEXT NOT NULL` — `baseline`, `communications_blackout`, `sensor_failure`, `delayed_sync`, `synthetic_health_context`, `combined_drill`
- `engine_version TEXT NOT NULL`
- `random_seed BIGINT NOT NULL DEFAULT 42`
- `status TEXT NOT NULL` — `draft`, `running`, `completed`, `failed`
- `data_classification TEXT NOT NULL` — `observed`, `synthetic`, `mixed`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- `completed_at TIMESTAMPTZ NULL`

### `scenario_parameters`

- `id UUID PRIMARY KEY`
- `scenario_id UUID NOT NULL REFERENCES scenario_runs(id) ON DELETE CASCADE`
- `parameter_key TEXT NOT NULL`
- `parameter_value JSONB NOT NULL`
- `unit TEXT NULL`
- `rationale TEXT NOT NULL`
- `evidence_class TEXT NOT NULL` — `configured`, `observed`, `synthetic`, `unsupported`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- Unique key: `(scenario_id, parameter_key)`

### `scenario_events`

- `id UUID PRIMARY KEY`
- `scenario_id UUID NOT NULL REFERENCES scenario_runs(id) ON DELETE CASCADE`
- `event_sequence BIGINT NOT NULL`
- `simulated_at TIMESTAMPTZ NOT NULL`
- `event_type TEXT NOT NULL`
- `source_observation_id UUID NULL REFERENCES health_observations(id) ON DELETE RESTRICT`
- `event_payload JSONB NOT NULL`
- `evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb`
- `previous_hash TEXT NULL`
- `event_hash TEXT NOT NULL`
- Unique key: `(scenario_id, event_sequence)`

### `scenario_comparisons`

- `id UUID PRIMARY KEY`
- `baseline_scenario_id UUID NOT NULL REFERENCES scenario_runs(id)`
- `comparison_scenario_id UUID NOT NULL REFERENCES scenario_runs(id)`
- `metrics JSONB NOT NULL`
- `limitations JSONB NOT NULL DEFAULT '[]'::jsonb`
- `computed_by_version TEXT NOT NULL`
- `computed_at TIMESTAMPTZ NOT NULL DEFAULT now()`
- Unique key: `(baseline_scenario_id, comparison_scenario_id, computed_by_version)`

### `provenance_manifests`

- `id UUID PRIMARY KEY`
- `scenario_id UUID NOT NULL REFERENCES scenario_runs(id) ON DELETE CASCADE`
- `manifest_version TEXT NOT NULL`
- `manifest JSONB NOT NULL`
- `sha256_checksum TEXT NOT NULL`
- `signature TEXT NULL`
- `signing_key_id TEXT NULL`
- `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`

Use a new migration instead of modifying the existing initial schema in place. Add appropriate indexes on mission, author, scenario parent, event sequence, and creation time. Ensure authorization checks constrain every read/write to the user's mission membership and role. Scenario JSON must have schema and size validation.

---

## 7. API contract proposal

All writes must authenticate and authorize server-side. Exact response schemas should use the project's current Pydantic conventions.

### `POST /scenarios`

Create a new scenario from an existing timeline/checkpoint.

Request:
```json
{
  "mission_id": "uuid",
  "base_timeline_hash": "sha256:...",
  "scenario_name": "Blackout with one stale sensor",
  "scenario_kind": "combined_drill",
  "parent_scenario_id": null,
  "engine_version": "1.0.0",
  "random_seed": 42,
  "data_classification": "synthetic",
  "parameters": [
    {
      "parameter_key": "communications.blackout",
      "parameter_value": {"start_offset_seconds": 120, "duration_seconds": 900},
      "evidence_class": "configured",
      "rationale": "Exercise delayed synchronization handling"
    }
  ]
}
```

Response: scenario ID, status, accepted engine version, base timeline hash and creation time.

### `POST /scenarios/{id}/replay`

Execute/replay a scenario or create a deterministic result snapshot. Return ordered event summaries, metrics, limitations, and engine version. Enforce resource limits and never execute arbitrary code embedded in `parameter_value`.

### `GET /scenarios/{id}/compare?against={baseline_id}`

Return paired metric differences with explicit unit, comparator, coverage and limitations.

### `GET /scenarios/{id}/evidence`

Return provenance manifest, input event references, detector/rule versions, data quality states, and event-hash validation result.

### `POST /sync/scenario-packets`

Accept an idempotent packet with `packet_id`, `scenario_id`, `manifest_checksum`, `client_sequence`, `created_at_client`, and event summaries. The server should return a per-packet accepted/duplicate/conflict status. Do not rely on client timestamps as authoritative ordering.

---

## 8. UI/UX proposal

Add a primary navigation item **Mission Replay Lab**. Recommended layout:

1. **Left rail — Timeline & scenarios:** choose baseline, clone branch, configure blackout/sensor/data-quality conditions.
2. **Center — Deterministic replay:** synchronized time cursor, play/pause, speed, step, checkpoints and event markers.
3. **Right rail — Paired comparison:** baseline and scenario results side by side, including alert availability vs synchronization time.
4. **Evidence drawer:** click any changed event to inspect original observation, quality state, rule ID/version, inputs, transformation, assumption and resulting alert.
5. **Footer/status strip:** local/remote state, pending packet count, manifest checksum status, last successful sync and “SIMULATED” marker for synthetic runs.

Accessibility requirements: keyboard operation, visible focus, accessible chart labels, color-independent severity encoding, reduced-motion support, and a compact layout suitable for mobile PWA use.

---

## 9. Evaluation plan

The differentiator should be demonstrated by deterministic scenarios and measurable software/system metrics—not unverified medical accuracy.

| Evaluation dimension | Metric | Expected criterion |
|---|---|---|
| Determinism | Same input hash + engine version + seed reproduces output hash | 100% for supported replay cases |
| Branch isolation | Parent timeline changes after scenario creation | Zero mutation |
| Event integrity | Recompute ordered event hash chain | Detect changed, missing or reordered events |
| Offline behavior | Replay and quality analysis during network loss | Local engine remains usable without remote API |
| Sync correctness | Duplicate and delayed packet test | No duplicate observations; explicit conflict status |
| Data quality | Simulated stale/dropout/out-of-range records | Correctly classified by documented test rules |
| Explainability | Every changed metric has event/rule/parameter trace | No unexplained comparison row |
| Uncertainty handling | Missing/invalid data or unsupported countermeasure model | Output marked limited/unknown; no invented biological forecast |
| Authorization | Cross-mission user attempts to read/alter scenario | Denied by API; audited where appropriate |
| Performance | Replay of agreed test-fixture size on target laptop | Set a baseline and publish measured results; do not guess ahead of testing |

### Required test fixtures

- All-normal timeline.
- One implausible value and one frozen sensor.
- Communications blackout with critical local event.
- Blackout ends, duplicate packet retransmitted.
- Missing history and insufficient personal baseline.
- Late-arriving observation with older observed timestamp.
- Two devices with clock skew.
- Parent timeline updated after a saved branch.
- Unauthorized user requests a different mission’s scenario.
- Manifest/event tampering and hash verification.
- Unsupported physiological countermeasure whose effect must remain unknown.

---

## 10. Implementation phases

### Phase 0 — Baseline contract and audit

- [ ] Fetch current `main` head and check no file has changed since this specification was drafted.
- [ ] Align the proposal with existing schema/ORM/API conventions.
- [ ] Define event taxonomy, time model (observed vs received vs simulated), engine determinism contract and versioning rules.
- [ ] Decide what fields are persisted locally vs remotely and define authorization boundaries.
- [ ] Add a short ADR recording why the feature simulates system behavior and not unsupported biology.

### Phase 1 — Pure simulation core

- [ ] Add typed scenario interfaces and a schema validator.
- [ ] Build a deterministic timeline replay stepper.
- [ ] Implement scenario transforms for blackout, stale sensor, dropped packet, delayed packet and duplicate replay.
- [ ] Reuse existing quality and anomaly logic through a stable adapter; do not clone unrelated threshold logic.
- [ ] Generate per-event provenance and comparison metric output.
- [ ] Write unit/property-style tests for determinism, immutability, ordering and transform validation.

### Phase 2 — Offline PWA workspace

- [ ] Add Dexie stores and migration for scenario runs, local checkpoints, branches and outbox packets.
- [ ] Implement the Mission Replay Lab layout and accessible timeline controls.
- [ ] Add baseline vs scenario comparison and evidence drill-down.
- [ ] Add visible observed/synthetic/assumption labels and uncertainty states.
- [ ] Implement JSON packet export and manifest verification in the browser.

### Phase 3 — Backend persistence and secure synchronization

- [ ] Add a PostgreSQL migration for the scenario tables.
- [ ] Add Pydantic request/response models and API routes.
- [ ] Validate mission membership, role and access scope on every endpoint.
- [ ] Make packet ingestion idempotent with a unique packet key and conflict records.
- [ ] Record audit events for create, replay, export, sync, and review operations.
- [ ] Add size/time limits to replay requests and JSON payload validation.

### Phase 4 — Evaluation and demo

- [ ] Run all deterministic mission-drill fixtures.
- [ ] Record performance baseline on the specified laptop.
- [ ] Validate offline reload, reconnection and duplicate retry.
- [ ] Confirm synthetic traces cannot be mistaken for observed health events.
- [ ] Produce a comparison report with actual measured outcomes.
- [ ] Update README with screenshots, a feature walkthrough, limitations and test commands.

---

## 11. Suggested file additions

Fit names to the repository’s current conventions during implementation:

```text
frontend/src/
  app/mission-replay/page.tsx
  components/mission-replay/
    TimelineReplay.tsx
    ScenarioBranchEditor.tsx
    PairedScenarioComparison.tsx
    EvidenceTracePanel.tsx
    ScenarioStatusStrip.tsx
  engine/scenario/
    types.ts
    validation.ts
    replay.ts
    transforms.ts
    compare.ts
    provenance.ts
  db/
    scenario_db.ts
backend/app/
  api/scenarios.py
  schemas/scenarios.py
  services/scenario_service.py
  services/scenario_sync.py
  models/scenario_entities.py
backend/tests/
  test_scenarios.py
  test_scenario_sync.py
database/migrations/
  <timestamp>_add_scenario_mission_digital_twin.sql
docs/
  ADR-001-mission-replay-safety-boundary.md
  HILO_FEATURE_EVALUATION.md
```

Do not create duplicate modules if existing files already provide the corresponding responsibility. The proposed paths are a starting point, not an instruction to duplicate the existing anomaly, data-quality, or offline database logic.

---

## 12. Risks and mitigations

- **False impression of biological prediction:** clearly limit the first release to system/event behavior; show unknown effect for unsupported interventions.
- **Simulation/reality confusion:** immutable provenance and visible data-classification markers on every chart, alert and export.
- **Model-version drift:** record detector version, rule version, engine version, fixture version and manifest checksum.
- **Offline conflicts:** stable event IDs, idempotency keys, explicit conflict states and server-side reconciliation.
- **Sensitive health exposure:** mission-scoped authorization at the API, least privilege, data minimization, and no sensitive payloads in ordinary logs.
- **Integrity overclaim:** describe hash chaining as tamper-evidence, not proof of identity or absolute immutability.
- **Unreproducible benchmark claims:** use a fixed fixture suite and publish actual test data/results, not expected metrics as if already achieved.

---

## 13. Delivery definition

The feature can be called **implemented** only after the P0 acceptance criteria and the test suite pass. It can be called **validated for software behavior** only after the deterministic replay, sync, integrity and authorization tests are documented. Do not call the feature medically validated, clinically predictive, NASA-approved, or a full physiological digital twin without suitable evidence and expert review.

**Recommended product positioning:**

> **HILO — An offline-first astronaut health-monitoring system that can replay, compare, and audit how health alerts and data delivery behave when deep-space missions go wrong.**

---

## 14. Repository references

- HILO current repository: https://github.com/Jeevan-ZGDX/ORBIT-SENTRA
- HILO README: https://github.com/Jeevan-ZGDX/ORBIT-SENTRA/blob/main/README.md
- HILO PRD: https://github.com/Jeevan-ZGDX/ORBIT-SENTRA/blob/main/PRD%20file.md
- HILO anomaly engine: https://github.com/Jeevan-ZGDX/ORBIT-SENTRA/blob/main/frontend/src/engine/anomaly_detector.ts
- AstroByte: https://github.com/meahadi-hasan10/AstroByte-Health-Monitor
- ASTRAHEALTH: https://github.com/mdjitumia/Astra-Health-Astronaut-Health-Monitoring
- AI Astronaut Health Monitoring: https://github.com/bhavyasreee1234/-AI-Astronaut-Health-Monitoring
- Shift-Delete: https://github.com/Shivam6453/Shift-Delete
- Astro-Mind: https://github.com/niloybhattacharjee1402-glitch/Astro-Mind
- AyanDas910 project: https://github.com/AyanDas910/Create-Health-Monitoring-Software-for-Astronauts-on-Space-Missions
- Lifeline / space-app-AI: https://github.com/godragun/space-app-AI
- NeuroSpace: https://github.com/Yasir-alhas/neurospace-health-ai
