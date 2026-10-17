# SCRUM-36 — typed local conversation, October 17, 2026

Owner selected local replies with no API cost. Coordinator authored the increment; `cast_gate` independently reviewed the dialogue, encounter integration, styles, route and focused tests. Existing draft [PR22](https://github.com/sadhirr1/Stakewolf/pull/22), verified publication parent `10aa281964b7110cda2a011a4b0a4c0c33672357`. Final commit and handoff are linked on [SCRUM-36](https://sadhirr1.atlassian.net/browse/SCRUM-36).

## Delivered

The existing one-portrait forest encounter at `http://127.0.0.1:4181/` has a Talk to the council view. Type up to 360 characters to Orin or off-screen Sera. Authored replies depend on current game facts: completed vs ordered repair/protection, injury/escort, custody memory, denial/admission and witnessed hearing. Exact short follow-ups reuse that speaker's last supported topic and read the current phase again. The two speakers keep separate topic context. Questions do not mutate the game, add evidence or issue orders. No extra asset, API, credential, dependency, purchase or schedule.

## Measured verification

- Coordinator ran `node --test tests/scrum36-clearing-encounter.test.mjs tests/scrum36-dialogue.test.mjs`: **35/35 passed**, zero failures, **141.1211 ms** reported by Node. Includes 24 existing encounter checks and 11 new dialogue checks. Node v24.21.0.
- Independent QA/game-design reviewer `cast_gate` ran the same focused suite: **35/35 passed**, zero failures, **172.7341 ms**. No blocking findings; source/tests approved. Reviewer checked phase boundaries, testimony/custody, state immutability, escaped input, bounds and keyboard/composition handling. Browser interaction/layout verification was performed by the coordinator, not claimed by the reviewer.
- Browser: restored an existing dawn save, asked Orin “Why did you open the gate?” using Enter; answer acknowledged the injury and morning escort cost. Switched to Sera: Orin portrait hidden; unsupported pizza question asked for a supported topic. Returned to decisions, assigned a hearing, advanced to noon, switched to Orin and asked “What about now?”: remembered the injury topic, now reported escort returned without claiming healing.
- Browser at 390×844: reload preserved noon game state and cleared the transcript. Shift+Enter did not send. The Ask button sent once and returned focus to the textarea. Viewport width390 / document scrollWidth375: no horizontal document overflow. Readable answer/input/button inspected visually. Viewport override reset afterward.
- Restart through confirmation returned to dusk and cleared conversation. An HTML-shaped typed question rendered as literal text; the transcript contained zero injected images. Before-dawn injury answer explicitly said no injury reported yet. Reload left game decisions intact and cleared the temporary test conversation.
- Startup issue caught in browser: old preview server did not know the new `/portrait/dialogue.js` route (404). Verified its exact port4181 process/command, restarted only that preview server, and confirmed the encounter and new dialogue loaded. Earlier preview servers were not stopped.
- Syntax checks passed for `dialogue.js` and `clearing.js`. These are local tests; no new CI run, full browser matrix, assistive-technology session or performance benchmark is claimed.

Local-only visual evidence: `.tmp-scrum36/local-dialogue-desktop.png` and `local-dialogue-mobile.png`. Screenshots and owner portrait remain ignored/private; this sanitized summary is durable public evidence. The earlier cutout's fidelity/redistribution limitations still apply.

## Limits and next action

This is keyword-routed authored dialogue. It does not understand arbitrary questions, infer compound questions or generate new stories. It covers this fixed dusk-to-noon dispute only. Unsupported text asks for clarification, though a recognized keyword can select a topic from a broader question. Short follow-ups can repeat the prior answer if state has not changed. Latest eight exchanges stay in tab memory only; old saved endings retain their existing behavior. Asking is separate from formal council challenge/order actions and the UI says so.

Owner should try freely worded questions and report the first important question that fails or feels unnatural before we expand the topic set. No live-model integration is enabled or required. SCRUM-36 remains In Review; this increment is not full-game or cinematic acceptance. November6/13 delivery risks from the existing handoff remain; schedules remain off. No work hours or precise task-credit consumption claimed.
