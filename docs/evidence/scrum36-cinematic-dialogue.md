# SCRUM-36 conversation framing and Sera art brief

October 17, 2026. Owner deferred local models, prioritized the cast/cinematic experience, and selected creating Sera from a supplied brief. Coordinator authored the UI and brief; independent `cast_gate` reviewed source and art requirements. No new art, dependencies, purchases, model service or schedules.

## Visible result

- Desktop conversation frames the existing Orin portrait closer. Returning to decisions restores the wider composition; the clearing overview still hides character and dialogue.
- The selected speaker's latest retained exchange appears in focus, with phase and speaker names. Remaining retained exchanges, including the other speaker's, are accessible under Earlier exchanges. Replies and state rules are unchanged.
- The conversation guide contains existing topic examples and prototype limits. Input, Enter submission, history bounds and per-speaker topic memory remain local.
- Sera stays explicitly off-screen. Her [portrait brief](../art/sera-portrait-brief.md) specifies a distinct human scout, matched realism/framing/light, genuine transparent PNG and one neutral expression for the first test. Appearance reveals no hidden allegiance. Later cast suggestions are proposals, not implemented characters.

## Actual checks

Coordinator ran `node --test tests/scrum36-clearing-encounter.test.mjs tests/scrum36-dialogue.test.mjs`: 43 passed, 0 failed, 146.8872 ms. Independent reviewer ran the same suite: 43 passed, 0 failed, 139.7225 ms. These check state and dialogue rules; visual checks below cover the changed presentation. No full-game regression, CI or performance result is claimed here.

Actual browser at port4181, existing saved nightfall attempt:

- Asked Orin why he blamed Sera and for evidence; selected Sera and confirmed no Orin answer or portrait was attributed to her. Asked her who gave the instruction, expanded earlier Orin exchanges, and returned to Orin's own most recent reply.
- Checked button and Enter submission, existing history disclosure, speaker selector, clearing overview, return to decisions, and motion pause. Paused DOM state and computed portrait animation play state were both `paused`.
- Checked 390 by 844 layout, no horizontal overflow, and both speaker-switch directions after scrolling. Reviewer's requested check exposed a selector leaving the viewport when Sera shortened the page. Corrected mobile focus scrolling; repeat showed selector tops at 32.125 px for Sera and 243.792 px for Orin, both visible. Reduced the mobile portrait height from the first candidate so the face fits above the panel. Desktop framing remains close.
- Returning to decisions still showed the original nightfall orders: supplies assigned one worker, one worker unassigned. No shift advance, restart or saved decision change was performed. A reload retained those orders and cleared tab-local conversation as designed.

Private local captures: `.tmp-scrum36/cinematic-dialogue-mobile.png` and `.tmp-scrum36/cinematic-dialogue-desktop.png`. These contain owner artwork and are excluded from public publication. This sanitized summary is the durable public evidence. Actual screenshots are shown locally to the owner; no public redistribution of portrait art is implied.

Independent source/brief review found no blocker; final review includes the focus/crop correction. Reduced-motion rules are preserved by source inspection; no new animation was introduced and no fresh system reduced-motion browser emulation is claimed. The existing whole-image movement remains, with no lips, eyes or facial rig. This is a small presentation increment, not cinematic acceptance or a complete Werewolf cast.

## Handoff

Publish explicit reviewed UI/docs files only to existing draft [PR22](https://github.com/sadhirr1/Stakewolf/pull/22), from verified parent `35d24aa10357a3c409bd5ca4d5740a33c4a790c5`; consult SCRUM-36 for the published commit. Preserve unrelated root changes and ignored art. Next: owner supplies one Sera PNG; inspect transparency/face quality and stage it against Orin before expanding cast or generating expressions. SCRUM-36 remains In Review; November 6/13 delivery risks remain. Account-wide meter observed 11% initially and 14% near completion in the same window, not exact task attribution. No reset credit or hours claimed.
