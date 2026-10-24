# Stakewolf practice preview — SCRUM-37

Homepage and JD adaptation accepted by the owner; local answer-coaching increment, 2026-10-24. Implements the connected interface proposed in SCRUM-19 and GitHub PR24. This is a bounded design prototype, not a validated interview assessment product.

## Try it

Private preview: https://stakewolf-practice.v4nswe.chatgpt.site

For a local preview, run `node serve.mjs` in this directory, then open http://127.0.0.1:4184/. Requires an installed Node runtime; no packages or build step.

1. General practice → choose one of three rounds → investigate claims and records → recommend → respond to new evidence → review your trace.
2. Interview preparation → paste a JD or use a synthetic sample → review matched responsibilities and their supporting wording → confirm context and select skills → practise a relevant three-stakeholder discussion → inspect consequences and private incentives.

General practice retains the three introductory samples. Interview preparation now selects from six distinct responsibility modules, with role/level-specific interview prompts, three competing stakeholder accounts, a two-question budget, decision-specific consequences and a private-incentive reveal. See ADAPTATION.md for the matching rules and limits.

## Boundaries

- Local phrase matching with visible supporting clauses and editable skill selection. Six authored modules, no live AI or inference cost.
- User-entered text and activity remain in browser memory and clear on refresh. No account, uploads, analytics or browser storage.
- Answer coaching distinguishes evidence openings, direct name references and conservative wording cues. Case-linked prompts and a separate rehearsal help the learner review their response. No correctness judgment or ability score is produced. See FEEDBACK.md for the rules and limitations.
- New evidence is authored and fixed for each round; adaptive rounds also show a separate consequence linked to the first recommendation.
- Target level changes the interview-question framing, not calibrated difficulty.
- ADAS material is illustrative and requires expert review before external assessment use.
- No DNS changes, purchases, schedules or further feature work are part of this checkpoint.

See REVIEW.md for actual checks and limitations. Complete a round, choose Review my answer, inspect the evidence/public-view comparison, and use Check my rehearsal to practise a final explanation without overwriting the original attempt. Next owner review should check whether these prompts are useful and where the local matching misses the intended meaning. Broader role coverage, open-ended dialogue and validated assessment remain future increments. Previous November targets require reforecast for the platform pivot; this preview does not establish release readiness.
