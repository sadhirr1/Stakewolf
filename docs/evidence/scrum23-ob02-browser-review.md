# SCRUM-23 coordinator browser review — R2–R5 retention lifecycle

**Candidate:** isolated SCRUM-23 source copy based on PR #12 head `9eb7ef297203679a3db565f1857130cf128cc8b1`  
**Environment:** Windows, local loopback preview at `http://127.0.0.1:4174/`  
**Scope:** one manually played five-round path, including R2 record/clear, the R4 addendum and revision, and the R5 debrief. This is a coordinator review, separate from the QA-authored automated suite in `scrum23-ob02-review.md`.

## Observed path and results

1. R1 — committed **Open a small, gated pilot**. OB-01 showed Ishan as owner, its due round, the originating decision and delayed R2 consequence as sources, and stated that the promise was not proof of completion.
2. R2 — the evidence panel showed KB-06, KB-07, and KB-08 locked with their individual questions. The comparison help separated the two Ishan routes: “What can we change today?” opens KB-06 and KB-07; “How much data is affected?” opens KB-07 only. Asking Ishan the first question opened the configuration and inventory. Asking Theo “What does Atlas actually need?” opened the initial, Atlas-only KB-08 request.
3. R2 — recorded `default-is-not-cleanup`. Its history cited KB-05/06/07 with the acquisition event IDs and R2 timing. Clearing the active interpretation removed it from the current slot while retaining the original entry and appending a visible **R2 · cleared** event; the clear event also listed the then-acquired KB-08 source. The earlier R2 record did not gain that later source.
4. R2 — committed **Make consent explicit**. Exactly one OB-02 appeared with Leah accountable for policy/scope, Ishan responsible for cleanup, and Theo responsible for the customer explanation. Old-data cleanup remained pending, unverified and not overdue; the inventory did not establish object-level scope or authorization.
5. R3 — on entry, before any R3 question or decision, the OB-02 explanation milestone displayed **met** and cited the R3 consequence. The obligation remained active and cleanup remained pending.
6. R4 — before asking Theo, the evidence panel displayed KB-08-R4 as locked. Asking **What exactly has Atlas offered?** unlocked the separately timed Tuesday 14:30 addendum with its source and limitation. Recording and then revising the finding produced append-only R4 entries; the final revision included `KB-08-R4` with its exact R4 acquisition event ID, round, and sequence. The earlier R2 entry continued to show only sources acquired by R2.
7. R4 — committed **Protect the shared core**. The UI recorded the retention-workflow review as a separate scheduled subtask, while the parent OB-02 remained active and old-data cleanup remained pending. The consequence did not claim old transcripts were deleted.
8. R5 and debrief — committed **Present a bounded recommendation**. The final debrief explicitly rendered all four finding-history entries, including the R2 record, R2 clear, R4 revision, and latest R4 revision with its acquired-source chronology. OB-02 remained active at a workflow checkpoint; cleanup was pending, not overdue, and not verified. The notice, new-data default, and deletion-request workflow were described as selected-path checks without an independent execution receipt. The outcome was labeled an authored rubric, not a validated assessment.

## Review disposition and limits

The inspected path presents the retention lifecycle and separate Atlas addendum with understandable source timing, preserves prior interpretations, and carries unresolved cleanup honestly through the final debrief. No blocking browser-flow defect was observed on this path.

This was one manual path at the browser's normal viewport. It does not establish actual 200% zoom, narrow-screen acceptance, a full keyboard-only journey, screen-reader behavior, or every possible path. Automated coverage for the nine R2/R4 combinations and supporting lifecycle assertions is recorded separately by QA.
