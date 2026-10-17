# SCRUM-36 — a changing clearing and playable morning

October 17, 2026. Owner approved the next bounded step after the council dispute: visible work activity and a playable morning in the same one-character forest. Author: coordinator (development/UI/verification). Independent game-design/QA review: `cast_gate`. Existing draft [PR22](https://github.com/sadhirr1/Stakewolf/pull/22), reviewed parent `baf8f2f005c620894f5e62a475db3ba56e37297d`; final source commit is recorded on SCRUM-36. No additional characters, images, dependencies, purchases, live services or schedules.

## Result

- Dusk decisions now continue through a locked morning shift to noon. An injured traveler's escort reserves one worker for the entire morning. It cannot be recalled or retroactively spent on another job.
- A two-person repair competes with stores and a witnessed hearing. Route verification requires an overnight repair; a repair started this morning cannot be checked in the same shift. Verification marks firm footing on the higher approach and load-checks the line; the unstable bank stays off limits.
- At noon, completed work changes conditions. The gate opens only after verification, stores move above the observed water line, escort finishes without claiming the injury healed, and testimony/custody history remains. The hearing records conflicting accounts, not a guilt or allegiance verdict. No admission is invented if the player did not obtain it.
- **Look around the clearing** reveals a timber crossing, slack/reset rope, closed/open gate, stores and raised platform. Two small lanterns represent workers, with different journeys for crossing/stores/escort and stationary watch/hearing. They are clearly described as markers, not animated bodies. Source geometry is original code; existing forest assets and local portrait are retained.
- Scene lighting changes with dusk/night/morning/noon. Work completion is tied to explicit shift advancement, not real elapsed time. WebGL travel lasts four seconds, capped at30fps, then stops; pause, reduced motion, visibility and page lifecycle are handled. Reduced/paused initial loads show destinations immediately.
- Schema3 retains the existing local save key. Schema2 migration preserves night outcomes. Completed schema1 nights retain their original ending and cannot gain retroactive custody/injury. No server, live AI or external-feed integration.

## Verification performed

Coordinator: **24/24 focused tests passed, 205.283ms** on final implementation; syntax checks passed for UI/renderer. The suite includes all10 feasible night paths ×16 morning task subsets, capacity, immutable shifts, unsafe clearance rejection, saved phases, schema migration, forged-save rejection and world changes occurring only after committed completion. A small source-contract regression verifies the existing motion controller's active value matches renderer gates. No full repository suite, remote CI, deployment, measured GPU performance or full accessibility conformance claimed.

Browser checks in the in-app browser:

1. Desktop1440×900: keep both free, overnight pair repair, then injury reserves escort and leaves one worker. Select route verification, reload and retain selection; commit morning, advance noon. Open gate and higher-route clearance observed, exposed stores/hearing still pending. Reload restores noon.
2. Actual successive scene captures showed lanterns at the fire then at the crossing. Pause during the morning trip kept positions unchanged across captures; resume moved escort west and checker to the crossing. Gate stayed closed during work and opened at noon. Existing props were moved to avoid rock/platform overlap discovered during inspection.
3. Mobile390×844: watch Orin with no night work, then two workers available. Space activated supplies, Enter activated hearing; two-person repair disabled when capacity used. Noon retained closed crossing, protected stores, witnessed denial and Orin's custody memory. Morning heading y334–368; document width375≤390. Overview retained text/controls; the narrow scene crops distant props (desktop-first fallback).
4. Local captures: `docs/evidence/local-scrum36-living-clearing/desktop-open-crossing.png`, `mobile-noon.png`. These are local review aids; this sanitized summary and source are the durable public evidence. Portrait files remain ignored and excluded from publication.

## Review and limits

Independent review found a P2 integration mismatch: renderer expected `running`, while the existing motion control emits `playing`. Corrected all three gates, rebuilt bundle, added regression and verified visible trips/pause/resume. Minor narrative findings corrected: Sera adds rather than repeats a new claim; an admitted instruction remains separate from unresolved intent; absence of a public hearing does not erase the player's obtained admission. `cast_gate` approved the bounded final increment with no remaining blocker and independently passed24/24 tests in168.3911ms. Reviewer inspected source and desktop/mobile captures; interactive motion evidence is the coordinator's. Restart from overview restored the intro panel/focus; no warning/error logs were observed in the inspected browser log.

This remains one authored dispute, ending at noon. Unfinished work and accusation memory are saved but no later day is playable. Worker activity is represented by lanterns, the leader remains an illustrated cutout, and the crossing/water props are functional prototype art, not cinematic acceptance. Random hidden roles, further encounters, generated dialogue and outside-information adapters remain future work. SCRUM-36 stays In Review; November6/13 scope/quality targets remain at risk.

Account usage was observed at1% initially and4% near verification, with the same reset timestamp1792874439. That is an account-wide meter movement, not exact attribution to this chat. No reset credit was used; no hours were inferred.
