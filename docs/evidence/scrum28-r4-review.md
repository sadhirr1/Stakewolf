# SCRUM-28 independent QA — R4 addendum and shared review bundle

**Candidate:** `C:\Users\sadhi\Project_work\Stakewolf\.tmp-pr12-review-20261006`  
**Candidate lineage supplied by Coordination:** PR #14 head `8325705f790571fa8a0cbff65445823c86a4b748`. The isolated checkout currently reports Git `HEAD` `a5eda951d9469bed8c89cf93304478555f9d9be6`; the exact source under test is identified by the SHA-256 values below.  
**Environment:** Node.js v24.21.0 on Windows  
**Scope:** R4 `KB-08-R4` acquisition, capacity evidence, authored R4 question and conversation budget, one shared bundle across OB-01/OB-02, capacity selection and R5 carry-forward boundaries. QA-owned files: `tests/scrum28-r4.test.mjs` and this evidence summary. No browser, visual, keyboard, zoom, deployment, or release review is claimed.

## Exact candidate identity

| File | SHA-256 |
| --- | --- |
| `public/scenario.js` | `FA81DCE30C583529E3D22A9C10AD2B9C3A4075299A269091924F6C5ADB2231C5` |
| `public/engine.js` | `6166C284F5A8E160DE6B0F4647243E86AB394483890A352B4C51B88B1A754BA6` |
| `public/app.js` | `BD5C2677A4B109DA202E57C7BDE3875CFFAF783EDBCDC60B094A46366604417D` |
| `tests/scrum28-r4.test.mjs` | `D26344914E697A8C5E196ECFD8F2A8788D6FF4D3A930B3CC82D52E05430D57C2` |

These source hashes were recomputed after test execution and match Development's frozen report. The test file is auto-discovered by `node --test`; the full-suite count includes its 14 cases.

## Commands and results

- `node --test tests/scrum28-r4.test.mjs` — **14 passed, 0 failed**.
- `npm run check` — JavaScript syntax checks passed; **157 tests passed, 0 failed**.

## Contract checks

- R4 entry exposes the capacity record before choice, with the two-reviewer/one-bundle constraint and carried OB-01/OB-02 named; R5 child receipts are unavailable at R4. Choice descriptions disclose the shared-bundle consequences, including that `core` does not delete old transcripts, `custom` defers shared review, and `both` is blocked.
- `KB-08`'s R2 Atlas request remains separate from `KB-08-R4`. The addendum is absent before R4 and until Theo's R4 `contract-terms` answer, records Tuesday 14:30 as authorship while preserving R4 acquisition round/sequence, cites its exact question event, and says the commitment is conditional with separate reference approval. Wrong-person, wrong-round and repeat access do not create a record. The late artifact does not rewrite the R2 question or bonus; the R4 custom bonus cites the R4 question.
- Ishan's R4 `review-bottleneck` prompt matches the wording in case-design-v2. It records an attributed account with no metric change or added review capacity; the standard +2 relationship gain for an interview still applies. R4's two-question limit rejects a third question without mutating the run.
- Across explicit/quiet/exception × core/custom/both, the R4 choice creates one shared event linking both prior obligation events, the confirmed decision and KB-10a. Both obligations refer to that same bundle; the separate OB-02 workflow transition remains attributable. Every choice has zero metric/relationship effect on obligation events.
- R5 checkpoint assertions occur only after the R5 choice is completed. The shared bundle remains scheduled/deferred/blocked for core/custom/both; it does not by itself verify OB-01. OB-02 stays active; old-data cleanup remains pending, unverified and not overdue. Core reports only the design-authorized partial workflow checks for explicit/quiet; custom/both report no completed workflow checks.

## Findings and limits

Game Design identified premature success wording in the R5 `core` arrival. Development changed the copy to say the fix reaches review and scoped checks still need to run; the added regression asserts that this pre-receipt arrival does not claim verification. No blocking defect remains in the tested engine/state scope. This QA increment does **not** execute the frozen OB-01 synthetic 40+2 fixture, perform the isolated rollback drill, supply two real independent approvals, or verify an OB-01 success receipt. Consequently it does not establish OB-01 as verified; those requirements remain separate release gates. The R4 UI is not visually/keyboard/zoom reviewed by QA in this evidence.
