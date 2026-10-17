# SCRUM-36 — more natural local replies, October 17, 2026

Owner asked for less repetition and broader wording, with low usage and no live service. Coordinator authored `dialogue.js`, the small `clearing.js` integration and focused tests. Independent QA/game-design reviewer: `cast_gate`. Publication continues [draft PR22](https://github.com/sadhirr1/Stakewolf/pull/22) from verified parent `07f2f527eb833530d20e71ad1f300f4d1d3b1675`; consult the publication record on [SCRUM-36](https://sadhirr1.atlassian.net/browse/SCRUM-36).

## What changed

- Broader phrasing/contraction handling: families getting across, who gave an instruction, people/hands available, crates/food, confinement and hearing both sides. Narrowed generic words such as work/open so unrelated questions are less likely to get a fabricated-looking answer.
- Authored answer/reason/evidence angles. “Why?” and “How do you know?” develop the current topic; consecutive rephrasing selects an unused angle, then honestly acknowledges no new information. Context is speaker-local and bounded to one topic/three angles. Phase or relevant game-state changes refresh it.
- Multiple detected subjects ask for clarification. A trailing “and why?” follows the explicit subject in the same sentence before considering the previous turn.
- First-person wording for the speakers' evidence about the instruction; pre-night Orin speaks about his own stated intention. No hidden-role assignment, additional story event, game-state mutation, API, training, dependency or new assets.

## Verification and review

Coordinator focused suite: **43/43 passed**, zero failures, **148.2348 ms**. Independent final run: **43/43 passed**, zero failures, **137.4228 ms**. Command: `node --test tests/scrum36-clearing-encounter.test.mjs tests/scrum36-dialogue.test.mjs`. These comprise 24 existing encounter tests and 19 dialogue tests. Syntax checks passed for dialogue and UI integration.

Reviewer found P2 testimony inconsistency: Sera's allegiance explanation overlooked an earlier admitted instruction. Fixed to preserve the admission while leaving motive/slip/allegiance unresolved. Reviewer also found P3 false multi-topic detection after a stores question followed by “Is the crossing safe and why?”. Fixed same-sentence context precedence. Both have dedicated regressions; reviewer independently rechecked and approved. No remaining source/test blocker.

Coordinator browser checks on the existing saved night (orders preserved):

- Orin: “Who gave that instruction?” → denial; “Why?” → responsibility distinction; “What's your evidence?” → two sources and their limits; “Tell me more” → no new information, rather than another identical paragraph.
- “Will the food be okay?” reflected the assigned stores job still in progress. “Is the crossing safe and why?” correctly changed topic; “How do you know?” cited the old map and later note, without claiming clearance.
- Switched to Sera; a bare “How do you know?” requested a topic rather than inheriting Orin's memory. “Did he tell you to do it?” and “Why?” gave distinct account/reason replies. Her off-screen presentation remained intact.
- At 390×844, actual reply, input and send control were visually inspected; focus returned to the textarea. Document scrollWidth375 <= viewport390. Temporary viewport override reset. A resized desktop view is not physical-phone testing.

No new CI, broad browser matrix, performance benchmark, or general-language accuracy percentage claimed. Existing save and conversation-clear behavior is unchanged. Local screenshot remains private at `.tmp-scrum36/dialogue-polish-ready.png`; this summary is durable public evidence. No private portrait upload.

## Gemma feasibility, research only

Google documents [running Gemma locally](https://ai.google.dev/gemma/docs/run) and [fine-tuning](https://ai.google.dev/gemma/docs/tune). A pretrained instruction-tuned model can be tested before any training. Proposed next experiment, if requested: choose a small model after checking this computer's hardware, supply a character brief plus current permitted facts, compare a small set of questions for factual consistency, voice and latency. Keep deterministic game rules authoritative; generated dialogue must not assign resources or declare events. Fine-tuning could later target style/consistency using reviewed examples; it is not required just to provide current encounter history.

Local inference avoids cloud per-message API charges, but uses hardware, memory, electricity and maintenance. Public players would still need suitable local execution or hosted compute. No model, runtime, weights or training dataset was installed/downloaded; no license acceptance or performance claim. Current dialogue remains ordinary local JavaScript.

## Handoff

Still a bounded authored encounter. Phrase rules can misunderstand unfamiliar or complex wording. Revisited topics may repeat after context reset; there is no infinite supply of new evidence. Owner should test their natural questions before further expansion. SCRUM-36 remains In Review, with existing November6/13 delivery risks; schedules remain off. No hours or precise task-credit accounting claimed.
