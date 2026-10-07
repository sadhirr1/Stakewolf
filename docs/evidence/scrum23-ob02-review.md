# SCRUM-24 independent QA evidence — OB-02

**Candidate tested:** `C:\Users\sadhi\Project_work\Stakewolf\.tmp-pr12-review-20261006` (isolated SCRUM-23 candidate, final frozen source)  
**Environment:** Node.js v24.21.0 on Windows  
**QA file:** `tests/scrum23-ob02.test.mjs`  
**Scope:** R2 evidence acquisition and the OB-02 lifecycle through the R5 checkpoint. This is automated evidence; no browser or visual checks are claimed here.

## Candidate identity

SHA-256 values matched Development's declared snapshot before and after both test runs:

| File | SHA-256 |
| --- | --- |
| `public/scenario.js` | `8A3B33D180135B6782FCC3FD4C002A7C33EE1BBAB539387D129AA2FBBABFE28A` |
| `public/engine.js` | `1B626CC3F511820CB5D49F7407F6EBFA1D14C799F456799187015AECF0C9211E` |
| `public/app.js` | `AEF88D6279A256A93151F41C89058738BD5591B937C49A868CC28A232F22FD0B` |
| `tests/scrum23-ob02.test.mjs` | `52217180DC912E677D844D98FD862CA904B009195EDD3883AA612A5646D27F23` |

## Results

- Focused independent module: `node --test tests/scrum23-ob02.test.mjs` — **15 passed, 0 failed**.
- Candidate check suite, run from the isolated candidate with `npm run check` — all five syntax checks passed; **133 tests passed, 0 failed**, including the 15 SCRUM-24 tests.

## Coverage recorded

The focused module checks R2 access/provenance and wrong-person rejection; all nine `explicit|quiet|exception` × `core|custom|both` paths; exactly-once R3 met/missed events in delay-before-milestone-before-R3 order; source links and no numeric effect for OB-02 events; separate parent and workflow-bundle status; cleanup pending/not overdue; supported R5 check lists and Atlas-only scope; operational-receipt audience; debrief/export citations and wording; missing/duplicate/cross-run trace rejection; fresh-run isolation; and typed/preset semantic equivalence. The added lifecycle case records `default-is-not-cleanup` in R2, revises in R3 and R4, proves `KB-08-R4` is absent before Theo's R4 `contract-terms` question and cited only after its exact acquisition event/round/sequence, then clears the finding. It verifies append-only supersession, preserved earlier interpretation and acquisition timestamps, no score/relationship/conversation/history/obligation changes caused by finding actions, and all five lifecycle entries in the R5 debrief and text export.

## Finding

No remaining blocking defect was found in the tested scope on this exact candidate snapshot. Coordination separately performed a manual browser check of R2 record→clear retention, confirming the old entry and source IDs remain in history; the R4 addendum remains hidden until Theo's `contract-terms` answer and the later finding revision shows the exact R4 acquisition event ID and round. QA did not execute that browser review. This result does not claim broader browser accessibility, deployment readiness, or release approval.
