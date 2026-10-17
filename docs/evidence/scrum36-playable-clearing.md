# SCRUM-36 — playable clearing, October 17, 2026

Owner accepted the one-leader forest direction and authorized a short encounter: inspect conflicting accounts, allocate scarce people, see consequences and retain unfinished work. Coordinator authored the encounter logic, UI and focused tests. `cast_gate` independently reviewed game rules and implementation and ran the tests. No other specialist work is claimed.

## Delivered scope

- Existing http://127.0.0.1:4181/ preview now has intro, dated evidence, crew allocation, immutable night orders and dawn results. `/study` remains the portrait comparison. The earlier main game and prototypes remain untouched.
- Two people; inspect costs one, anchor reset costs two, protect supplies costs one. There are four feasible nonempty allocations, including deliberate underallocation. Zero-person commitments and overbooking are rejected.
- Old route map and new scout note establish differing knowledge, not guilt. Reading changes the leader's response but not physical consequences. The concrete loose-fastening finding comes from assigning an inspector.
- Dawn changes the forest colour treatment and character grade. Work markers identify dispatched assignments; the result retains crossing, stores and promise obligations. Repair still needs verification, inspection still leaves repair pending, and exposed supplies do not imply theft or damage.
- Saved state uses a validated, versioned browser-local key. Reload restores planning, dispatch or dawn; committed work cannot be reassigned or duplicated. Replay asks for confirmation and resets this encounter only. Storage failures have a notice and retain in-memory play.
- Existing artwork, renderer and movement reused. No new image generation, models, packages, purchases, extra characters, external inputs or schedules. All dialogue is authored. Art remains private/local under the previously documented setup; public source alone does not include the portrait files.

## Executed validation

Coordinator: eight focused Node tests passed, zero failures/skips, 97.9975 ms. Independent reviewer: same eight passed, zero failures, reported 117 ms. Tests cover knowledge idempotence, capacity/recall/immutability, forbidden phase transitions, repair-versus-inspection semantics, all four allocation outcomes, evidence-independent physical results, save restoration, clean initial state and malformed/impossible saves. Authored UI and preview server syntax checks passed. Full unchanged-game regression suite was not run.

Actual browser checks:
- Desktop 1440×900: enter, open both evidence items, assign inspector plus supplies, observe pair repair disabled at full capacity, give orders, reload into the same locked dispatch, advance to dawn. Concrete fastening finding, protected stores and deferred crossing/promise matched the allocation. The leader referred to both read documents.
- Mobile 390×844: restore dawn, cancel replay (preserved result), confirm replay (fresh intro), Enter to start, Space to assign the repair pair, Enter to commit and advance. The repair result retained inspection debt and exposed supplies; unread-evidence response differed from the first path.
- Mobile document width 375 within viewport 390; task buttons 52px high. The layout and reading flow were visually inspected. This was not a complete keyboard-only or screen-reader audit.
- Independent reviewer flagged that mobile page-scrolling could hide the next heading when desktop focus prevented scrolling. Updated responsive focus behavior and retained assignment scroll/focus; task controls now have distinct accessible labels. Actual mobile planning-to-dispatch check put heading at y250–317 in an 844px viewport, visible after the transition. Reviewer accepted the fix.
- Pause remained functional after gameplay integration. Observed browser error/warning list was empty. Local captures under `docs/evidence/local-scrum36-playable-clearing/`; the durable public evidence is this sanitized record.

## Review and handoff

Independent `cast_gate` approved the bounded encounter after the focused tests, source review, coordinator-reported browser journeys and mobile fix. No blocking finding remains for this increment. Technical approval does not establish that the encounter is engaging or that its art meets the final quality target.

The preview is left at a fresh intro for owner play. Next gate: owner feedback on investigation, allocation and consequences before adding cast or another playable morning. Pending obligations persist in this result but cannot yet be executed. No timing measurement supports a claimed three-to-five-minute duration. Actual browser execution with unavailable storage, malformed storage, WebGL loss and no JavaScript was not performed; those limits remain. The new state validator is covered by focused tests, while storage-failure presentation is source-reviewed only.

Checkpoint these explicit files to existing draft PR22, preserving the dirty root. SCRUM-36 stays In Review. November 6 candidate / November 13 release-decision targets remain at risk; this scene is not a release or a reforecast. Work remains manually initiated; no reset credit was used and no elapsed hours are claimed.
