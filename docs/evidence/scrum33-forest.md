# SCRUM-33 — The Hollow encounters and first light

Date: October 10, 2026. Ticket: [SCRUM-33](https://sadhirr1.atlassian.net/browse/SCRUM-33). Scope: one reviewed expansion of the owner-approved forest direction. Continued interest is not final visual acceptance.

## Delivered behavior

- Distinct procedural wolf faces, clothing and tools for Orin, Sera and Vela. Selecting an account enters a close-up with a readable dialog; closing it returns to the clearing.
- Keyboard-operable DOM markers positioned over the 3D scene. Markers wait until the camera settles, avoid interface and marker collisions, and have reading-panel alternatives. The loose anchor can be inspected from its world marker.
- A once-only transition from commitment to dawn. Warmer sky, fog and lighting accompany the morning report. Each path includes three character reactions and three obligations.
- Repair spends the watch's crew capacity and leaves rest and an unobserved path unresolved. Delay preserves the watch while families wait and the crossing remains closed. A dawn inspection only supports the conditions checked. No text identifies a saboteur without evidence.
- The immediate outcome keeps the evidence available at commitment time. Later observations cannot rewrite that basis. Replay clears all progress and returns to night.

## Actual coordinator browser checks

Executed against the local preview in the Codex in-app browser. Desktop viewport 1280 by 800; narrow viewport 390 by 844. Browser checks are separate from QA's automated and source review evidence.

1. Paused-motion world interaction: entered the clearing, hid the reading panel and selected Sera's marker. Correct Sera dialog and green scout model appeared. Escape returned to the clearing. At the crossing, keyboard Enter on the anchor marker acquired the field note, restored the reading panel and enabled the repair choice.
2. Final normal-motion retest: reload, enter, hide the panel, wait for Vela's marker, then select it. Correct Vela dialog and purple lantern-bearing model appeared. Returning to the fire restored markers. Both visibility waits completed within their 10-second bounds; the return action and wait tool call took about 3.7 seconds. This is not a measured FPS benchmark.
3. Final narrow encounter: full Orin face visible above the bottom dialog at 390 by 844. Dialog content scrolls independently; Escape exits. Document scroll width was 375 pixels at a 390-pixel viewport, with no horizontal overflow observed.
4. Repair path: inspected the anchor, chose repair, confirmed with Enter, then advanced to first light. Warm scene, all three reactions and carried obligations appeared. The report began at scroll position zero; all four progress steps exposed completion text and checkmarks.
5. Hold path on narrow viewport: committed without inspecting, advanced to dawn, observed a staffed watch, waiting families and closed crossing with no invented anchor observation. Replay returned to opening/night and zero notes.
6. Browser warning/error log query returned no entries during the final retest. This is limited to the captured browser session, not an assertion about every device.

## Findings resolved during this session

- A moving Orin marker initially opened Vela. Moving markers are now hidden until the camera is stationary; overlapping or obscured markers are culled. Final normal-motion selection opened the correct character.
- Camera entry briefly passed through a character. Author added an orbit; QA found that the exit path also needed that protection. Final source retains the orbit until returning to the wide view. Author geometry mocks and independent source review support the path fix; browser checks confirm unobstructed settled views, not frame-by-frame path coverage.
- In the actual browser, marker reveal initially took over 10 seconds with motion enabled. Camera delta had shared the atmosphere's capped step. Camera now follows elapsed time independently; the final normal-motion retest above passed. Author low-frequency mocks informed the fix; QA independently reviewed the timing separation.
- Progress originally relied on color; visible checkmarks and accessible completion labels were added. Dawn now clearly identifies the end of this playable night.
- A scrolled context card carried its position into dawn; render now starts the new card at the top. Mobile dialog height was reduced to keep the complete face visible.

## Evidence and limits

Independent reviewer `hollow_qa` records 208 passing checks and final hashes in `scrum33-review.md`. Coordinator reviewed the new tests; the test author did not approve their own deliverable. Scene and rules authors own separate files.

Local screenshots in `docs/evidence/local-scrum33/` support the chat preview but are not required for durable handoff; this sanitized browser record and the QA record are committed with the source. Screenshots: `sera-encounter.jpg`, `repair-dawn.jpg`, `mobile-dawn.jpg`.

No FPS, actual mobile hardware, OS reduced-motion runtime, screen-reader, 200% zoom, audio-quality or BFCache acceptance is claimed for this increment. The unavailable-WebGL controller fallback is covered by a new test; no forced GPU-loss browser check was performed. No new plugin, dependency, hosted service or schedule was added. No elapsed work hours or project-specific usage percentage is inferred.

The open morning threads are authored consequences, not yet an accumulating-backlog simulation. Hidden roles, a playable next chapter, production art and public hosting remain pending. November 6 and November 13 remain planning targets requiring scope reassessment, not release promises.
