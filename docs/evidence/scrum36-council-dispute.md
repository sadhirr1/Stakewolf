# SCRUM-36 — one council dispute, October 17, 2026

Owner request: deepen the accepted one-character forest encounter toward Werewolf through conflicting stories and meaningful consequences, keeping usage low. Coordinator authored state/UI/tests/docs. Independent game-design/QA reviewer: `cast_gate`. One reviewer reused; no new characters, images, dependencies, purchases, schedules or external services.

## Delivered behavior

- Orin explicitly denies ordering the outer line loosened; Sera admits handling it but says he gave the order. Hearing both unlocks a challenge and a persisted admission. This establishes the instruction, not motive, sabotage or supernatural allegiance.
- The council can watch Orin, watch Sera, or keep both free. One watch consumes one of two workers. No automatic removal of an existing assignment when capacity is exceeded. Orin and Sera are not those workers.
- Orin announces he will attempt an unchecked passage if free. Watching him prevents it but rules out the two-person repair that night. Inspection can establish condition but cannot stop his order; this limit is disclosed before commitment.
- If free, Orin leads a traveler onto the unstable approach; the traveler turns an ankle. One worker is needed for an escort tomorrow, reducing availability for new work from two to one. This event occurs independently of reading and of any anchor repair; that repair is not a load check or clearance.
- Watching Sera can be a consequential mistake; she demands a witness at future briefings. Watching Orin produces an authority dispute. These are concrete retained obligations, not invented trust scores. No claim that all choices are equally effective.
- Dawn shows the player's council decision, witnessed night event, cost, and pending work. Tomorrow is recorded but not playable. One authored dispute; no randomized identities, full social-deduction victory rules, live AI or outside feeds.

## Compatibility and checks

Existing local key `stakewolf-clearing-v1` is retained; new state schema is version 2. Committed version 1 nights retain their original three obligations and no retroactive injuries/watch. Uncommitted old plans retain allocations, reset the changed testimony to unread and require an explicit council choice. Source tests cover both paths; a browser load of the previous intro displayed the migration notice. A completed legacy browser save was not separately injected.

Coordinator focused run: **16 tests passed**, zero failures/skips, **143.2438 ms**. Independent final run: **16 passed**, zero failures, **100.5781 ms**. Syntax checks passed for changed JavaScript. Full unrelated game suite, remote CI, storage-disabled and WebGL-failure tests were not run in this increment.

Reviewer caught a P2 malformed-save defect: an array watch value could pass object-key coercion and create contradictory custody/night events. Fixed by requiring string-or-null watch values; added arrays/object/number/boolean regression. Reviewer independently reproduced the original defect and verified the correction. No remaining source blocker. Challenge response now receives focus directly.

Actual browser checks:

- Desktop 1440×900: heard both accounts, challenged denial, watched Orin and protected supplies, committed, reloaded dispatched state, advanced to dawn. Admission retained; guard prevented passage, stores protected, two workers available tomorrow.
- Mobile 390×844: after reload, skipped accounts, watched Sera with Space, assigned inspection with Space, committed/advanced with Enter. No admission attributed; unchecked passage and escort reduced availability to one, inspection left repair pending, Sera requested a witnessed hearing.
- Mobile dawn heading was visible at y207.79–274.48; document width375 versus viewport390. Actual screenshot checked for portrait/panel readability. No warning/error logs observed in the tested journey. This was keyboard activation coverage, not a complete keyboard-only accessibility audit.

Private local captures are for owner review only; public evidence is this text and reviewed source, not redistribution of the portrait. Existing draft PR22 receives only the explicit reviewed files. Root checkout and other prototypes remain unchanged. GitHub/Jira hold the final commit identity.

## Next

Owner plays the council dispute before expanding. A later increment could make the recorded hearing/escort work playable; it is not implemented here. The November 6 candidate and November 13 release-decision targets remain at risk. No elapsed hours or exact per-task usage attribution are claimed.
