# HILO — NASA Space Apps Challenge 2026
## Master Project Enhancement, Scientific Validation, Engineering Roadmap and Competition Strategy

**Project:** HILO — Astronaut Health Monitoring and Mission Resilience Platform  
**Target challenge:** Create Health Monitoring Software for Astronauts on Space Missions  
**Target repository:** https://github.com/Jeevan-ZGDX/ORBIT-SENTRA  
**Document version:** 1.0  
**Prepared:** October 29, 2026  
**Target hackathon:** November 14–15, 2026  
**Document purpose:** Define the technical, scientific, product, security, usability, demonstration and submission improvements required to make HILO a credible, differentiated and competition-ready open-source prototype.

---

# 1. Executive vision

## 1.1 Project vision

HILO is an offline-first astronaut health-monitoring platform designed to help crew members and authorized medical personnel understand changes in health indicators, identify unreliable telemetry, inspect evidence behind alerts, and maintain useful monitoring during communication interruptions.

The next version of HILO should evolve beyond a conventional dashboard into a **transparent, evidence-aware astronaut health monitoring and mission resilience system**.

The product should make five things exceptionally clear:

1. What was measured?
2. How reliable is that measurement?
3. What has changed relative to the astronaut's established baseline?
4. Why did the system raise an alert, and what evidence supports it?
5. What can the astronaut or authorized medical professional verify or review next, including when Earth communication is unavailable?

The central innovation will be the **HILO Mission Replay Lab**: a controlled environment that allows users to replay a health-monitoring timeline and compare how alerting, sensor reliability, and information delivery behave under mission disruptions.

The feature will not claim to predict biological outcomes unless an appropriate model has been validated. Instead, it will demonstrate measurable and reproducible system behavior under realistic communication and telemetry failure conditions.

## 1.2 Competition objective

The objective is not to maximize the number of features. It is to demonstrate one complete, scientifically responsible and technically convincing solution to the selected NASA challenge.

HILO should be judged on the strength of its evidence, not its marketing claims.

The project must demonstrate:

- Direct, documented use of relevant NASA open data or resources.
- A coherent connection between the data and the health-monitoring workflow.
- A meaningful differentiator beyond charts, threshold alerts and a general-purpose chatbot.
- An executable, reproducible end-to-end demonstration.
- Reliable local operation during a network interruption.
- Transparent data provenance and uncertainty.
- Secure handling of health information.
- Measured results, useful tests and an accessible public repository.
- A clear explanation of how the prototype could be evaluated and developed further.

No technical feature guarantees an award. The purpose of this plan is to strengthen HILO against the dimensions commonly used in Space Apps evaluation: **Impact, Creativity, Validity, Relevance and Presentation**. Confirm the final 2026 judging and submission guide before submission.

---

# 2. The most important finding from the current repository

Before adding the new feature, fix the existing implementation so the project can withstand technical questions from judges.

## 2.1 Priority Zero: Correct the data provenance problem

**This is the first technical issue to resolve.**

The inspected `backend/app/pipeline/acquisition.py` implementation contains a method named `_build_osdr_records`. Although the code requests NASA OSDR study metadata, the method creates heart-rate, oxygen-saturation and blood-pressure values from deterministic formulas and loop indices. It does not extract those measurements from the returned NASA metadata.

The inspected `_build_bidmc_records` method similarly constructs formula-generated physiological records. At the same time, the source registry in `backend/app/pipeline/sources.py` labels the corresponding sources as non-synthetic.

This means the current acquisition workflow risks presenting generated data as genuine downloaded physiological measurements.

**Required correction:**

- Inspect every acquisition adapter and every existing file in `raw_data/`.
- Identify which records were downloaded, which were transformed from genuine source records, and which were generated locally.
- For every genuine source, download or retrieve permitted source records and parse the actual data fields.
- Preserve the original source file or permitted immutable snapshot, dataset identifier, source URL, access date, license, transformation history and SHA-256 checksum.
- Confirm that the actual source contains the measurements the application claims to use.
- If the available NASA dataset does not contain a desired measure, do not invent it and attribute it to NASA.
- Mark generated fixtures explicitly as synthetic.
- Change the source registry and dataset dashboard so the displayed classification matches the underlying records.
- Never claim live integration merely because a network request successfully retrieved metadata.

If genuine physiological measurements cannot be acquired and parsed reliably before the demonstration, use a small verified real-data example for the source-inspection workflow and a separately labelled synthetic dataset for scenario testing. This is better than presenting fabricated observations as NASA research data.

### Required data classifications

Every record and visualization must distinguish:

| Classification | Meaning | Required display |
|---|---|---|
| Observed source data | A measurement taken from a documented source record | Source, dataset ID, measure, unit and timestamp |
| Transformed data | A value derived from documented source records | Formula or transformation version and input references |
| Synthetic data | A generated test, simulation or demonstration value | Visible `SIMULATED` label |
| Model-derived result | An output generated by an algorithm | Model or rule version, input evidence and limitations |
| Assumption | A user-configured scenario parameter | Explicit assumption label and rationale |
| Missing or invalid data | A value that cannot be interpreted safely | Quality status and reason |

A single chart must not silently combine genuine observations, synthetic test values and model outputs as though they were equivalent measurements.

## 2.2 Priority Zero: Make the machine-learning claims defensible

The inspected `backend/app/pipeline/trainer.py` contains rule-derived labels for records and adds synthetic warning and critical cohorts whose labels are assigned during generation.

This can be useful for testing whether a prototype model learns a known, deliberately defined classification rule. It is not sufficient evidence that the model predicts validated astronaut health risks.

The project must distinguish between:

- A deterministic rule engine.
- A model trained on synthetic or rule-derived labels.
- A model evaluated against independently labelled real observations.
- A medically validated prediction system.

These are not interchangeable.

### Required corrections

1. Record the provenance of every training row.
2. Separate genuine observed records from generated cohorts.
3. Document how each label was assigned.
4. Prevent source-derived, subject-overlapping and time-overlapping leakage between training and evaluation data.
5. Evaluate on held-out subjects whenever the dataset structure allows it.
6. Compare the model with a clearly defined rule-based baseline.
7. Report precision, recall, macro F1, confusion matrix, class support and limitations when the evaluation data can support those metrics.
8. Evaluate controlled synthetic events separately from real-data performance.
9. Do not display a model accuracy percentage unless it is reproduced from a documented evaluation.
10. Do not describe synthetic labels or thresholds as independent clinical ground truth.

**Competition-safe positioning:** HILO currently demonstrates an explainable monitoring and analysis prototype. Any learned model should be presented according to the evidence actually available, not described as clinically validated merely because it has been trained.

A strong hackathon project can demonstrate rigorous engineering without claiming clinical predictive performance that it has not established.

## 2.3 Priority Zero: Fix authentication and authorization

The inspected `backend/app/core/security.py` contains a password-verification fallback that accepts the strings `password123` or `mission2026` if the stored password hash cannot be verified. This must be removed.

The inspected configuration also contains a hard-coded JWT signing secret and database credentials. These must be replaced by validated environment configuration before the application is exposed beyond a trusted local development environment.

The inspected vitals endpoints accept astronaut identifiers from the request, and the synchronization workflow checks that an astronaut profile exists without, in the shown code path, establishing that the authenticated user owns that profile or has mission-scoped authorization. These are important authorization boundaries to correct and verify.

### Required security work

- [ ] Remove insecure password fallbacks. Invalid hashes must fail closed.
- [ ] Load JWT signing secrets and database credentials from environment variables.
- [ ] Refuse to start in non-development mode when secrets are absent, weak or still set to known defaults.
- [ ] Rotate any credentials or signing secrets that have been used in a deployed environment.
- [ ] Enforce ownership, role and mission-membership checks on every sensitive API operation.
- [ ] Scope observation reads, summaries, exports and synchronization writes to authorized records.
- [ ] Validate user and mission identity on the backend instead of trusting client-provided IDs or roles.
- [ ] Test expired tokens, malformed tokens, inactive users and unauthorized cross-astronaut requests.
- [ ] Review CORS policy and avoid permissive deployment defaults.
- [ ] Ensure that secrets, raw sensitive payloads and credentials do not appear in logs.
- [ ] Use synthetic demonstration identities and data in public screenshots and recordings.
- [ ] Add regression tests for every identified authorization issue.

The project should not be described as production-ready until these controls have been reviewed and tested. For the hackathon, demonstrate a secure prototype and disclose the remaining limitations.

---

# 3. Positioning and comparison with similar projects

The previously reviewed repositories show that many projects already describe personalized health trends, anomaly scores, AI summaries, crew dashboards, mission logs, mental-wellness support, adaptive monitoring and countermeasure concepts.

HILO should not claim to be unique merely because it offers these common functions.

Its differentiator should be specific and demonstrable:

> **HILO can reproduce and compare how astronaut health alerts and telemetry delivery behave under mission disruptions, trace the evidence behind each result, and continue essential local analysis while disconnected.**

The inspected peer descriptions do not prove that no other project has a similar replay feature. The defensible claim is that HILO is implementing this specific combination with a traceable and reproducible workflow.

The comparison should guide scope:

- Do not add a generic chatbot merely to compete with projects that already have one.
- Do not add more AI models without relevant data, validation and a clear user benefit.
- Do not add blockchain merely to claim security or novelty.
- Do not add many specialized physiological modules if the available data and evaluation cannot support them.
- Do not spend the core development window polishing charts while the data provenance and access-control issues remain unresolved.

Prioritize scientific credibility, mission resilience, explainability, practical usability and reproducible evaluation.

---

# 4. The new differentiating feature

## HILO Mission Replay Lab
### Evidence-aware, offline-capable mission scenario analysis

The Mission Replay Lab is the primary new capability recommended for HILO.

It is a controlled simulation and comparison workspace in which the user can replay an authorized health timeline, introduce mission-related disruptions, and compare system behavior between an original timeline and a modified scenario.

It is not a fully validated physiological digital twin. The first release is a **health-monitoring system digital twin**: it simulates the monitoring, telemetry, alerting, quality and synchronization workflow.

## 4.1 The user problem

During deep-space missions, the system cannot assume that all measurements will arrive on time, all sensors will work correctly, or remote medical review will be immediately available.

A dashboard may show an alert but still leave important questions unanswered:

- Would local monitoring still work during a communication blackout?
- Would a frozen sensor be flagged rather than mistaken for stable health?
- Would delayed telemetry create an incomplete or misleading historical view?
- Would a repeated synchronization packet duplicate an existing event?
- Could a flight surgeon reconstruct why an alert was generated?
- Does the system know when the evidence is insufficient to make a confident assessment?

Mission Replay Lab will answer these questions with visible, reproducible scenarios.

## 4.2 Core functions

### A. Timeline replay

Allow a user to select a supported historical timeline or an explicitly synthetic demonstration timeline.

Provide:

- Play, pause, restart and step controls.
- Adjustable replay speed.
- A synchronized event timeline.
- Original observed time and received time.
- Data-source and quality markers.
- An alert event marker linked to the underlying evidence.
- Local processing and remote synchronization status.

Replay should not change the original health observations.

### B. Scenario branches

The user should be able to create a separate scenario branch from a chosen baseline.

Initial scenarios:

1. Nominal telemetry.
2. Communication blackout.
3. Frozen or stale sensor.
4. Missing measurement or packet dropout.
5. Delayed batch arrival.
6. Duplicate synchronization packet.
7. Several independent sensor faults.
8. Late-arriving data with an older observed timestamp.
9. Insufficient baseline history.
10. Combined offline and telemetry-quality drill.

Every scenario must record its parameters, base timeline, scenario version, engine version and source-data classification.

### C. Paired comparison

Compare the original timeline with the modified scenario.

Display measurable changes such as:

- Number of expected and received observations.
- Missing, invalid, stale and delayed data counts.
- Time at which a local event first became detectable.
- Time at which the event became available remotely.
- Synchronization delay.
- Duplicate events prevented.
- Unresolved or conflicted records.
- Whether the evidence needed to explain an alert was available.
- Whether the comparison is limited by missing data.

Only calculate metrics that can be derived from the stored events. Display `Not comparable` when the evidence is insufficient.

### D. Evidence trace

Selecting any changed result must open an evidence panel that shows:

- Input observations and timestamps.
- Input source and data classification.
- Data-quality result.
- Applicable detector or rule and its version.
- Relevant baseline state.
- Scenario parameters responsible for the change.
- Output event and event sequence.
- Limitations or missing inputs.

This should answer the judge's question: **“Show me exactly why the system reached this result.”**

### E. Offline resilience

The simulation must continue to work when the browser cannot reach the backend.

The local application must be able to:

- Load a previously available timeline.
- Run the deterministic replay engine.
- Generate local data-quality and anomaly events.
- Save scenario branches and checkpoints.
- Show queued synchronization packets.
- Resume synchronization after connectivity returns.

The UI must distinguish local completion from server synchronization. A locally generated alert must not be presented as already reviewed by Mission Control.

### F. Integrity-checked mission packet

Allow the user to export a compact JSON packet containing:

- Scenario identifier.
- Baseline timeline checksum.
- Scenario parameters.
- Input event references.
- Detector and engine versions.
- Comparison metrics.
- Quality and uncertainty notes.
- Synchronization status.
- Event-integrity manifest.
- Data-source references.

Compute a SHA-256 checksum of the exported manifest. If an append-only event hash chain is used, describe it accurately as tamper-evident; a hash chain alone does not prove identity or prevent a privileged operator from replacing the entire chain.

### G. Evidence-bounded operational actions

The application may show approved verification steps, such as checking sensor placement, repeating a measurement, reviewing data quality, or escalating through the applicable mission protocol.

It must not invent treatment instructions, automatically prescribe medication, or generate an unsupported biological recovery prediction.

Where the model does not support a biological effect, display:

**“The scenario changes the simulated operational state. The physiological effect is unknown.”**

This makes the feature scientifically responsible while preserving its usefulness as a mission-resilience tool.

## 4.3 Suggested demonstration scenario

Use a small, deterministic and clearly labelled synthetic scenario to demonstrate the feature:

1. Start with a baseline timeline and show the original observations.
2. Inject an explicitly synthetic multi-signal anomaly into the demonstration timeline.
3. Show the local detector and its supporting evidence.
4. Activate a communication blackout.
5. Introduce a frozen sensor or delayed observation.
6. Show that local monitoring continues and data-quality checks identify the fault.
7. Show that remote delivery is pending rather than falsely marked as complete.
8. Restore connectivity.
9. Re-send a packet to demonstrate duplicate protection.
10. Compare the baseline with the disrupted scenario.
11. Open the evidence trace and export the integrity-checked packet.

The demonstration should use synthetic values only where they are marked as such. Any genuine source-data view must separately identify the data and its provenance.

---

# 5. Required product improvements beyond Mission Replay Lab

## 5.1 Data provenance and NASA data integration

Use NASA's Open Science Data Repository and other suitable permitted sources as documented research resources. The NASA OSDR includes diverse space-life-science information, including physiological, behavioral, phenotypic and environmental data. Its dataset contents are heterogeneous, so verify the exact study, variables and licensing before using a dataset for a specific claim.

Required implementation:

- Add a source-inspection view showing the source organization, exact dataset ID, URL, version or access date, license, and fields actually used.
- Preserve a link between each normalized value and its source record where practical.
- Record transformations, missing-value handling and unit conversions.
- Check subject identifiers and temporal boundaries when preparing data splits.
- Document whether data were downloaded directly, transformed locally or supplied by a simulator.
- Do not call a historical sample “real-time telemetry.”
- Clearly separate NASA data from supplementary clinical or wearable data.
- Keep a small known-good dataset snapshot for a reproducible demo, where the terms and license permit it.

**Demonstrable result:** A judge can select a measurement, inspect its source and transformation, and determine whether it is observed, derived or simulated.

## 5.2 Health monitoring and personalized baselines

Retain HILO's core monitoring architecture, but make the behavior easier to understand and evaluate.

- Establish personal baselines only when there is sufficient valid history.
- Display whether a baseline is insufficient, learning or established.
- Explain which valid observations were used.
- Exclude known invalid or stale observations from the baseline calculation.
- Do not let a single extreme event silently distort an individual's baseline.
- Distinguish fixed safety rules from personalized deviations.
- Show the current value, baseline, time window and data-quality condition together.
- Treat a missing reading differently from a normal reading.
- Make the contribution of each input visible in a multi-signal explanation.
- Keep thresholds configurable, versioned and documented.
- Verify any claimed connection to a NASA standard against the actual relevant standard; do not attribute an unsupported threshold to NASA.

## 5.3 Explainable and conservative alerts

Each alert should answer four questions:

1. **What changed?** The measurement and its time window.
2. **Why was it flagged?** The rule, baseline deviation or detector that fired.
3. **How reliable is the evidence?** Relevant quality, missing-data and source information.
4. **What is the appropriate next step?** A cautious verification or escalation action consistent with the documented workflow.

Use stable alert IDs and versioned detectors. Record the alert lifecycle, including when it was created locally, acknowledged, reviewed, synchronized and resolved.

The language model, if one is used, should explain already computed outputs using supplied evidence. It must not set the triage class independently, fabricate citations or override deterministic safety rules.

## 5.4 Flight-surgeon workflow

Strengthen the existing review interface around the evidence trail rather than adding more decorative cards.

The authorized reviewer should be able to:

- Filter alerts by status, severity, astronaut and time.
- Inspect the original observations and data-quality warnings.
- Read the detector rationale and applicable limitations.
- See whether a result was computed locally or received from the backend.
- Acknowledge, annotate and resolve an alert according to the role's permissions.
- Inspect synchronization conflicts.
- Export a concise review packet.
- See an audit history for relevant actions.

The API must enforce the role and mission boundary. Hiding a page or disabling a button in the frontend is not authorization.

## 5.5 Privacy and access control

Astronaut health information is sensitive even in a prototype.

Implement:

- Server-side authorization for every protected route.
- Explicit mission membership and resource ownership checks.
- Least-privilege role permissions.
- Secure session and token handling.
- Environment-based secrets.
- Audit records for access, changes, exports and review actions.
- Data minimization in logs.
- Synthetic user identities for demos.
- A documented data-retention and deletion policy suitable for the prototype.

Do not upload real or sensitive personal health data into a public demonstration repository.

## 5.6 Usability and accessibility

Optimize the experience for a user who needs to understand a health event quickly, not for visual complexity.

- Show the latest trusted measurement and its age.
- Use explicit labels for normal, warning, critical, missing and stale states.
- Use text and icons in addition to colors.
- Keep the key alert explanation visible without requiring several modal windows.
- Provide keyboard-accessible controls and visible focus.
- Support reduced motion.
- Ensure the primary offline and alert states remain understandable on mobile screens.
- Avoid unnecessary animated effects that compete with critical information.
- Make the difference between local analysis and remote review unmistakable.

---

# 6. Technical architecture

Keep the current stack unless the audit identifies a concrete blocker. A hackathon upgrade should not become an unnecessary framework migration.

| Layer | Recommended responsibility |
|---|---|
| Next.js, React, TypeScript | Monitoring dashboard, Flight Surgeon view, Mission Replay Lab |
| Dexie.js / IndexedDB | Local observations, replay state, checkpoints, scenario branches and outbox |
| Pure TypeScript scenario engine | Deterministic timeline replay, event transformations, comparison and evidence generation |
| FastAPI | Authentication, authorization, validated endpoints, scenario metadata and synchronization |
| PostgreSQL | Health records, mission membership, scenario metadata, audit events and synchronization receipts |
| Python pipeline | Genuine dataset acquisition, validation, normalization, training and evaluation |
| Automated tests | Data provenance checks, engine determinism, authorization, synchronization and regression tests |

### Proposed component layout

```text
HILO
├── Astronaut Monitoring
│   ├── Health Indicators
│   ├── Personal Baseline
│   ├── Alerts and Explanations
│   └── Data Quality
├── Mission Replay Lab
│   ├── Timeline Replay
│   ├── Scenario Branch Builder
│   ├── Paired Comparison
│   ├── Evidence Inspector
│   └── Mission Packet Export
├── Flight Surgeon Review
│   ├── Alert Queue
│   ├── Evidence and History
│   └── Review and Audit
├── Data Provenance
│   ├── Source Registry
│   ├── Dataset Inspector
│   └── Quality and Evaluation Reports
└── Offline and Sync
    ├── Local Persistence
    ├── Pending Outbox
    ├── Idempotent Synchronization
    └── Conflict Reporting
```

### Engineering constraints

- The local simulation engine must not require a backend call for every event.
- Keep scenario transformations deterministic and versioned.
- Do not execute arbitrary code received in scenario parameters.
- Validate and limit request payload size, replay length and resource use.
- Use explicit observed, received and simulated timestamps.
- Never silently discard divergent local and server results.
- Use database migrations for schema additions.
- Avoid duplicating existing anomaly or data-quality logic in the new engine.
- Treat all scenario inputs as untrusted until validated.
- Do not persist a new health interpretation without keeping its origin and version.

---

# 7. Data model additions

Align these additions with the existing SQLAlchemy models and PostgreSQL schema before implementation. Use a new migration rather than destructively modifying an already deployed schema.

## 7.1 Scenario run

Suggested fields:

- `id`
- `mission_id`
- `created_by`
- `parent_scenario_id`
- `base_timeline_hash`
- `scenario_name`
- `scenario_kind`
- `engine_version`
- `random_seed`
- `status`
- `data_classification`
- `created_at`
- `completed_at`

## 7.2 Scenario parameters

Record:

- `scenario_id`
- `parameter_key`
- `parameter_value`
- `unit`
- `rationale`
- `evidence_class`
- `created_at`

Include the evidence class, such as configured, observed, synthetic or unsupported.

## 7.3 Scenario events

Record:

- `scenario_id`
- `event_sequence`
- `simulated_at`
- `event_type`
- `source_observation_id`, when applicable
- `event_payload`
- `evidence_refs`
- `previous_hash`
- `event_hash`

A unique constraint on `(scenario_id, event_sequence)` should prevent duplicate sequence positions.

## 7.4 Scenario comparisons

Record:

- `baseline_scenario_id`
- `comparison_scenario_id`
- `metrics`
- `limitations`
- `computed_by_version`
- `computed_at`

Store the comparator version and the limitations alongside the metrics.

## 7.5 Provenance manifests

Record:

- `scenario_id`
- `manifest_version`
- `manifest`
- `sha256_checksum`
- Optional signature and signing-key identifier
- `created_at`

Use JSON schema validation and access-control checks for all stored scenario payloads. Add indexes for mission, author, parent scenario, event sequence and creation time as justified by the actual query patterns.

---

# 8. API work

Fit the final routes to HILO's existing versioning and Pydantic conventions.

Recommended endpoints:

- `POST /scenarios` — create an authorized scenario branch.
- `GET /scenarios/{id}` — retrieve scenario metadata.
- `POST /scenarios/{id}/replay` — execute a deterministic replay or retrieve a result snapshot.
- `GET /scenarios/{id}/compare?against={baseline_id}` — compare two runs.
- `GET /scenarios/{id}/evidence` — inspect provenance, input references and version information.
- `GET /scenarios/{id}/export` — export the evidence packet.
- `POST /sync/scenario-packets` — synchronize packets idempotently.

Every endpoint must validate the authenticated user, mission membership, scenario ownership or role permissions, and request structure. A UUID in a URL does not establish permission.

The sync endpoint should return explicit accepted, duplicate and conflict results. It should not trust a client timestamp as the authoritative ordering of events.

---

# 9. Validation and measurable outcomes

HILO must publish only the results that the current data and test design can support.

## 9.1 System evaluation

| Dimension | Evaluation method |
|---|---|
| Replay determinism | Repeat an identical scenario using the same engine version and seed; compare outputs |
| Branch isolation | Verify that running a scenario never changes its source timeline |
| Data provenance | Check every source claim against actual downloaded or documented source records |
| Data-quality detection | Run known fixtures containing frozen, missing, out-of-range and delayed measurements |
| Offline resilience | Disable the network and verify local analysis and persistence |
| Sync correctness | Repeat packets and exercise delayed arrival and conflict scenarios |
| Alert traceability | Verify that each output can be tied to its input events and detector version |
| Authorization | Attempt cross-mission and cross-astronaut reads and writes using separate test identities |
| Uncertainty handling | Verify that unsupported or insufficiently supported cases show limitations, not invented confidence |
| Performance | Record replay time and resource usage against a fixed test fixture on the target machine |

## 9.2 Clinical and machine-learning evaluation

If validated ground-truth labels are unavailable, do not claim clinical sensitivity, specificity or health-prediction accuracy.

For controlled scenario fixtures, measure software behavior: whether the expected rule fires, whether the event remains available offline, whether sensor faults are classified correctly, and whether duplicate packets are prevented.

For any genuine model evaluation, document:

- Dataset identifiers and provenance.
- Inclusion and exclusion criteria.
- Label definitions and label provenance.
- Subject-aware train, validation and test separation.
- Baseline comparison.
- Class counts and imbalance.
- Precision, recall, macro F1 and confusion matrix where supported.
- Limitations and generalizability.
- Reproducible configuration, model version and evaluation script.

Synthetic test performance and clinical prediction performance must be reported separately.

## 9.3 Release acceptance criteria

- [ ] Genuine and synthetic data are visibly and consistently distinguished.
- [ ] Every advertised dataset integration is verified.
- [ ] The system can load a demo timeline and replay it deterministically.
- [ ] A scenario branch does not mutate the source observations.
- [ ] Local monitoring remains functional during the network outage test.
- [ ] The simulator shows local detection separately from remote delivery.
- [ ] Repeated packets do not duplicate saved observations.
- [ ] Changed outputs show their supporting inputs and assumptions.
- [ ] Insufficient data and unsupported biological effects are explicitly reported.
- [ ] Unauthenticated and unauthorized access attempts are rejected.
- [ ] The core demo works from a clean installation using documented commands.
- [ ] Automated tests run and their actual results are documented.
- [ ] No fabricated dataset, benchmark or clinical-validation claim appears in the submission.

---

# 10. Repository cleanup and branding

The public README now uses HILO, but inspected source and documentation still contain legacy `ASTRA-Guard` branding in several places. This inconsistency should be fixed before the public demonstration.

Audit and update:

- `README.md`
- `PRD file.md`
- `frontend/src/app/layout.tsx`
- `backend/app/core/config.py`
- `database/schema.sql` comments
- ML trainer class and module documentation
- Model artifact filenames and references where renaming is safe
- User-facing headings, metadata and demo copy
- Architecture diagrams and reports
- Test fixtures and seed-data labels where applicable

Do not use a blind global replacement on identifiers, database migrations or model paths. Update references together and run the affected tests.

### Developer experience

- [ ] Remove obsolete or contradictory documentation.
- [ ] Reconcile stated Python and Node.js requirements with versions actually tested.
- [ ] Add a concise root-level setup guide.
- [ ] Document backend, frontend, database and test commands separately.
- [ ] Provide a non-secret environment example.
- [ ] Keep lockfiles and deterministic dependencies.
- [ ] Add CI for Python tests, TypeScript checking and frontend build.
- [ ] Confirm that generated build outputs and caches remain excluded from version control.
- [ ] Preserve dataset licenses, source attributions and provenance metadata.
- [ ] Review any committed secrets or generated sensitive files in the current and prior repository history.

---

# 11. Scope control: build the strongest prototype, not the largest one

## P0 — Required before a credible public demonstration

1. Correct source-data provenance.
2. Remove insecure authentication defaults and enforce authorization.
3. Correct machine-learning and accuracy claims.
4. Verify the complete install/build/demo workflow.
5. Add source and synthetic-data labels to the interface.
6. Ensure core offline monitoring and synchronization actually work.
7. Eliminate inconsistent project branding.
8. Demonstrate the real NASA data contribution in an inspectable way.

## P1 — Primary differentiator

1. Implement deterministic timeline replay.
2. Implement blackout, stale sensor, missing packet and duplicate sync scenarios.
3. Add paired comparison metrics.
4. Add the evidence inspector.
5. Add scenario export with a provenance manifest.
6. Test the workflow end to end.

## P2 — Useful if the core is already stable

- Better chart interactions and accessibility.
- An improved reviewer queue.
- A more detailed source-inspection panel.
- A concise report format for mission-control review.
- Performance profiling and a documented test report.

## Defer

Do not prioritize a new LLM chatbot, extra predictive models, facial or speech emotion inference, blockchain, complex 3D animations or a large rewrite before the core deliverable is robust.

These features add code and claims without necessarily improving challenge relevance, scientific validity or demonstrable impact.

---

# 12. Implementation roadmap through the challenge

The 2026 Space Apps event is scheduled for November 14–15. The project should be technically ready for a short development sprint rather than depending on an unfinished architectural rewrite during the event.

## October 29–31: Truth and safety audit

- [ ] Reproduce the current installation and startup workflow.
- [ ] Audit every data acquisition adapter.
- [ ] Correct data-source metadata and synthetic flags.
- [ ] Remove password fallbacks and hard-coded runtime secrets.
- [ ] Add API authorization tests.
- [ ] Inventory the real project state and mark unfinished features honestly.
- [ ] Align branding and version information.

## November 1–4: Data and baseline verification

- [ ] Choose and verify the permitted NASA dataset(s) relevant to the health-monitoring challenge.
- [ ] Document dataset IDs, fields, units, access date and license.
- [ ] Implement genuine record parsing where available.
- [ ] Keep synthetic fixtures separate.
- [ ] Create a reproducible source-data snapshot for the demo if permitted.
- [ ] Establish a rule-engine baseline.
- [ ] Record baseline tests and evaluation results.
- [ ] Fix issues that prevent a clean installation.

## November 5–8: Mission Replay Lab core

- [ ] Define versioned scenario interfaces.
- [ ] Implement deterministic replay.
- [ ] Add blackout, dropout, stale sensor, delayed packet and duplicate packet transforms.
- [ ] Implement paired comparison.
- [ ] Add provenance trace and limitation states.
- [ ] Add unit tests for determinism, event ordering and branch immutability.

## November 9–11: User workflow and integration

- [ ] Add the Mission Replay Lab screen.
- [ ] Connect the existing anomaly and quality engine through one adapter.
- [ ] Add visible observed/synthetic/derived labels.
- [ ] Add local persistence and checkpoints.
- [ ] Add export and manifest checks.
- [ ] Integrate the backend scenario and sync endpoints only after the local flow is stable.

## November 12–13: Freeze and rehearsal

- [ ] Run the full test suite.
- [ ] Verify offline reload and reconnection.
- [ ] Demonstrate duplicate packet protection.
- [ ] Conduct the cross-user authorization test.
- [ ] Verify clean setup using the public README.
- [ ] Capture authentic screenshots and record the real application.
- [ ] Prepare the project summary, source references, AI-use declaration where required and presentation.
- [ ] Recheck the current 2026 participant terms, submission guide and local-event instructions.
- [ ] Freeze nonessential features.

## November 14–15: Hackathon execution and submission

- [ ] Follow the official event timetable and current rules for existing work and new contributions.
- [ ] Work on the selected challenge in the permitted scope.
- [ ] Keep a concise record of contributions, data sources, external code and AI assistance.
- [ ] Test the final commit and demo on a clean session.
- [ ] Ensure the public repository and live demo are accessible without permission barriers.
- [ ] Complete the official project page and all required fields.
- [ ] Submit before the official deadline shown on the event platform.
- [ ] Verify that the submitted links work from a separate browser/session.

This roadmap is a planning target, not a promise that every feature will be completed. P0 work takes precedence over new functionality.

---

# 13. Hackathon judging strategy

Prepare evidence against the five criteria commonly used in Space Apps evaluation. Do not assume specific weights unless they are stated in the current 2026 judging instructions.

| Criterion | What HILO should demonstrate |
|---|---|
| Impact | How unreliable telemetry, delayed review and communication loss affect astronaut health monitoring; why the system is useful |
| Creativity | Replay and compare mission failure scenarios with event-level evidence, not only show another risk dashboard |
| Validity | Real source-data provenance, documented transformations, reproducible rules and honest limitations |
| Relevance | An end-to-end workflow that supports health review and action under limited connectivity |
| Presentation | A live, concise, clearly labelled demonstration with a strong problem–solution–evidence narrative |

For each criterion, prepare one concrete artifact: a source-inspection view, a working scenario, a test report, a completed user workflow or a concise demonstration segment.

Do not substitute slogans for evidence.

## 13.1 Demonstrate impact with a concrete story

Tell a simple operational story:

An astronaut's local health-monitoring application receives new observations. Connectivity to the remote reviewer becomes unavailable. A sensor freezes and another measurement arrives late. HILO continues local analysis, marks the unreliable input, preserves the event history and shows that the remote review has not yet occurred. When the connection returns, HILO synchronizes the packet and identifies a repeated delivery rather than duplicating the observation. The reviewer can inspect the evidence behind the alert and compare system behavior under the disruption.

The impact lies in reliability, evidence continuity and reduced ambiguity—not in claiming that HILO independently diagnoses or prevents disease.

## 13.2 Avoid overclaiming

Never claim that HILO is:

- NASA-approved, NASA-endorsed or officially deployed by NASA.
- A clinically validated medical device.
- A validated biological digital twin.
- An accurate real-time astronaut monitor unless the data connection and sampling behavior are genuinely implemented.
- A predictor of clinical conditions on the basis of synthetic labels alone.
- Proven to reduce medical emergencies without appropriate evidence.

Use language such as “prototype,” “decision support,” “demonstration,” “controlled scenario,” and “requires domain-specific validation” where appropriate.

---

# 14. Demo design

The demo should demonstrate a complete outcome rather than tour every page.

### Scene 1 — Establish trust

- Select the documented dataset or a clearly labelled synthetic fixture.
- Show the source identity, measurement timestamp, units and quality.
- Establish the baseline and explain whether it has sufficient history.

### Scene 2 — Detect and explain a change

- Trigger a controlled anomaly in the synthetic fixture.
- Show the input measurements and quality states.
- Explain which rule or detector generated the result.
- Open the evidence inspector.

### Scene 3 — Break connectivity and telemetry

- Activate offline mode.
- Introduce a stale sensor or delayed packet.
- Show local analysis continuing.
- Show the telemetry quality warning and pending remote delivery.

### Scene 4 — Recover and reconcile

- Reconnect.
- Synchronize the packet.
- Submit a repeated packet.
- Show that the record is treated as a duplicate.
- Compare the original timeline with the disrupted run.

### Scene 5 — Show the evidence

- Open the comparison details.
- Show event references, parameters, versions and limitations.
- Export the integrity-checked packet.
- State what the prototype can prove and what remains to be validated.

A short reliable demonstration is stronger than a longer tour of incomplete screens. Prepare the demo using the actual constraints in the current 2026 submission guide rather than assuming that an earlier year's format or duration still applies.

---

# 15. Project summary draft for the submission page

## Working title

**HILO: Offline-First Astronaut Health Monitoring and Mission Resilience**

## High-level summary

HILO is an offline-first astronaut health-monitoring prototype designed for missions where communication with remote medical support may be delayed or unavailable. It brings together health observations, personal baseline analysis, data-quality checks and explainable alerts while preserving a local monitoring workflow during network interruptions.

Its differentiating feature, Mission Replay Lab, lets users replay health-monitoring timelines and compare how communication blackouts, sensor faults, missing measurements and delayed synchronization affect alert availability and evidence continuity. Each comparison is linked to its source events, scenario assumptions and engine version.

HILO distinguishes observed data from transformed values, synthetic scenarios and algorithmic outputs. It is designed to help astronauts and authorized reviewers inspect what the system knows, what it cannot establish and what requires further review.

The prototype uses documented NASA open data and appropriately attributed supplementary sources where applicable. It is a research and software demonstration, not a certified medical device or a NASA-endorsed product.

## The problem

On long-duration space missions, crew members must monitor changing health indicators while dealing with isolation, altered gravity, radiation exposure, disrupted sleep and limited access to immediate remote support. A useful monitoring tool must do more than display readings: it must help users understand change, recognize unreliable telemetry, inspect the basis of an alert and maintain continuity during disconnection.

## The solution

HILO combines local-first monitoring, personal baseline analysis, data-quality assessment, evidence-linked alerts and offline synchronization. Mission Replay Lab provides controlled scenarios for testing the monitoring workflow under degraded conditions. The system preserves the distinction between real observations, derived results and synthetic demonstrations.

## Intended impact

HILO aims to improve the transparency and resilience of astronaut health-monitoring software. By making data provenance, alert rationale, uncertainty and synchronization state visible, it can help developers, astronauts and medical reviewers evaluate whether the monitoring workflow remains dependable when the mission environment is less than ideal.

The prototype's system behavior can be tested in reproducible scenarios. Any clinical or predictive use would require appropriate scientific validation and qualified domain review.

---

# 16. Three-minute presentation script

**Opening — The problem**

“On a deep-space mission, detecting a health concern is only part of the problem. A measurement can be missing, a sensor can freeze, and a connection to remote medical support can disappear. The system still needs to explain what it knows, what it does not know, and whether an alert has actually reached the reviewer.”

**Introduce HILO**

“HILO is an offline-first astronaut health-monitoring prototype. It combines documented observations, personal baselines, data-quality checks and explainable alerts. Essential local analysis can continue without a live backend connection.”

**Show the differentiator**

“Our key feature is Mission Replay Lab. Instead of simply displaying a score, it lets us replay a timeline, introduce a controlled mission disruption and compare the monitoring system's behavior. We can see which observations were available, when a local event appeared, whether synchronization was delayed and which evidence caused the result.”

**Demonstrate the scenario**

“Here is our baseline timeline. We now simulate a communication blackout and a frozen sensor. HILO continues locally and marks the telemetry quality issue. The remote synchronization state remains pending. When connectivity returns, we synchronize the packet and re-submit it to demonstrate duplicate protection. We can inspect the event trace and export the comparison.”

**Explain data integrity**

“We separate genuine source observations from transformed values and synthetic test data. Every scenario records its parameters and software versions. We do not treat a synthetic demonstration as clinical evidence.”

**Close**

“HILO's goal is to make astronaut health monitoring more transparent and resilient when telemetry and communication are imperfect. We are demonstrating a testable software workflow—not claiming an autonomous doctor or a clinically validated prediction system. The next step is evaluation with appropriately curated data, stronger evidence and relevant domain experts.”

Rehearse this using the actual interface. Remove any line from the script that the current build cannot demonstrate.

---

# 17. Source references and scientific grounding

Use authoritative documentation and the exact sources actually integrated into the project.

1. **NASA Space Apps Challenge 2026 — Health Monitoring Software for Astronauts on Space Missions:**  
   https://www.spaceappschallenge.org/2026/challenges/create-health-monitoring-software-for-astronauts-on-space-missions/

2. **NASA Space Apps Challenge 2026 event page, registration and submission dates:**  
   https://www.spaceappschallenge.org/2026/

3. **NASA Open Science Data Repository:**  
   https://science.nasa.gov/biological-physical/data/osdr/  
   https://osdr.nasa.gov/bio/repo/

4. **NASA Human Research Program:**  
   https://www.nasa.gov/hrp/

5. **NASA human spaceflight risks:**  
   https://www.nasa.gov/hrp/risks/

6. **NASA Space Apps legal terms and submission obligations:**  
   https://www.spaceappschallenge.org/legal/

7. **HILO repository:**  
   https://github.com/Jeevan-ZGDX/ORBIT-SENTRA

8. **HILO source-data acquisition workflow:**  
   https://github.com/Jeevan-ZGDX/ORBIT-SENTRA/blob/main/backend/app/pipeline/acquisition.py

9. **HILO model training workflow:**  
   https://github.com/Jeevan-ZGDX/ORBIT-SENTRA/blob/main/backend/app/pipeline/trainer.py

10. **HILO anomaly detection engine:**  
    https://github.com/Jeevan-ZGDX/ORBIT-SENTRA/blob/main/frontend/src/engine/anomaly_detector.ts

11. **HILO authentication and security implementation:**  
    https://github.com/Jeevan-ZGDX/ORBIT-SENTRA/blob/main/backend/app/core/security.py  
    https://github.com/Jeevan-ZGDX/ORBIT-SENTRA/blob/main/backend/app/core/config.py

12. **HILO PostgreSQL schema:**  
    https://github.com/Jeevan-ZGDX/ORBIT-SENTRA/blob/main/database/schema.sql

Every dataset, library, source-code dependency, external research reference and AI-assisted contribution used in the final solution must be documented according to its applicable terms and the current challenge rules. Verify the 2026-specific requirements before the final submission.

---

# 18. Final release checklist

## Scientific credibility
- [ ] Every real-data claim is backed by a verifiable source record.
- [ ] Synthetic data is never labelled as NASA-observed data.
- [ ] Units, timestamps, missing values and transformations are documented.
- [ ] No unsupported clinical threshold is attributed to a NASA standard.
- [ ] Model claims match the actual labels and evaluation data.
- [ ] Limitations are visible in the product and submission.

## Engineering reliability
- [ ] Frontend builds successfully from a clean environment.
- [ ] Backend starts successfully from documented instructions.
- [ ] Database schema and migrations are reproducible.
- [ ] Offline mode works after a page reload.
- [ ] Scenario replay is deterministic.
- [ ] Repeated synchronization does not duplicate observations.
- [ ] Failures and conflicting results are explicitly reported.
- [ ] Automated tests are runnable and actual results are documented.

## Security
- [ ] No known default authentication fallback remains.
- [ ] Secrets are environment-configured.
- [ ] Protected API endpoints enforce ownership and mission authorization.
- [ ] Cross-user access tests pass.
- [ ] Sensitive data is not exposed in public fixtures or logs.
- [ ] Role and audit behavior is documented.

## Differentiator
- [ ] Mission Replay Lab can replay a baseline timeline.
- [ ] A controlled disruption can be injected.
- [ ] Baseline and scenario behavior can be compared.
- [ ] Each changed output can be traced to evidence and assumptions.
- [ ] The export manifest can be verified.
- [ ] The feature works offline.

## Competition readiness
- [ ] The project clearly addresses the selected 2026 health-monitoring challenge.
- [ ] NASA data and resources are integrated and visibly credited.
- [ ] The public repository contains setup instructions, tests and source references.
- [ ] Team members are registered and identified as required.
- [ ] The project is submitted using the official current platform and requirements.
- [ ] Public links work without additional permissions.
- [ ] The demo shows the working build and does not invent results.
- [ ] AI assistance and other resources are declared when required.
- [ ] NASA logos, mission identifiers and other protected branding are not misused.
- [ ] The final presentation states limitations honestly and demonstrates actual evidence.

---

# Final recommendation

Build HILO around **trustworthy health monitoring under mission disruption**.

First correct the data provenance, authentication and model-claim issues. Then implement Mission Replay Lab as a deterministic and evidence-linked demonstration. Finish with an accessible user workflow, reproducible tests, a verified NASA data integration and a clear submission narrative.

A smaller prototype that works, shows its evidence and survives a controlled failure scenario is a stronger competition entry than a larger prototype built around unsupported AI claims.
