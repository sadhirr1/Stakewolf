# SCRUM-37 verification record

## 2026-10-24 follow-up — JD adaptation

Owner accepted the initial homepage/flow and requested actual role-specific adaptation. Coordinator authored interface/integration; `jd_engine` authored adapt.mjs and its retained tests; `practice_flow_qa` independently reviewed both.

Reviewer accepted after resolving: role selector originally changed only a label (now changes a substantive transfer prompt); missing-role copy implied an inferred role (now clearly asks for manual context); adaptive session incorrectly said two views (now three). Coordinator also clarified question-phase completion and distinguished claim evidence from private-incentive revelation. No blocking findings remain in the bounded review.

Actual checks:

- Retained `node --test tests/adapt.test.mjs`: 10/10 passing, run by author and independently by QA. Covers same-role JD differences, unknown/mixed/negated/hostile input, exact source excerpts, six complete case schemas, distinct consequences, role/level prompts and detached case instances.
- Syntax: app.mjs, adapt.mjs and serve.mjs passed independent checks. Final interface copy also passed app.mjs syntax check.
- Separate temporary DOM-stub integration harness: 82 passing assertions reported by QA, covering selected skills, escaped JD/notes, six rounds, enforced two-question budget, debrief-only private incentives, original-choice consequence after revision, history/back/replay, role switching and resets. This additional harness is not retained and does not replace browser QA.
- Browser: a research-focused UI JD selected only research; an accessibility-focused UI JD selected only accessibility with different questions and stakeholders. Completed the accessibility round, asked Design and Engineering, observed Support question disabled after the second question, opened evidence, retained typed reasoning, and reached the correct first-choice consequence and three private-incentive reveals.
- Browser: Senior platform sample produced experimentation/prioritization/systems rounds and organizational questions. Unsupported tea-shop text selected zero topics. Manually adding research was labelled manual; changing role to Growth changed the transfer question. These checks used synthetic descriptions, never a private employer JD.
- Desktop path inspected at 1440×1000. Mobile path inspected at 390×844, scrollWidth 375; checkboxes and role control remained readable. No console-error entries were reported during these checks. Some automated pointer activations needed keyboard activation after inspecting unchanged state; keyboard flow completed.

Limits: local phrase coverage, authored simulation, no semantic AI, no inference API cost, no written-answer score, no educational/domain validation, no screen-reader audit or CI claim. Final screenshot is local; durable verification is this retained record and the matching Jira/GitHub checkpoint. Run the retained engine tests from this Site directory. Full release dates still require reforecast.

Date: 2026-10-24. Author: coordinator acting in UI/UX, Visual Design and Development. Independent reviewer: `practice_flow_qa`, a separate QA subagent. No elapsed hours or CI execution claimed.

## Independent review

Reviewer found no blocking flow, state or privacy defects. Two P2 accessibility findings were resolved before delivery:

1. Asking stakeholder 2 before stakeholder 1 focused the wrong existing reply. Replies now have an indexed focus target, and the clicked stakeholder's reply receives focus.
2. Mobile visual order differed from DOM/tab order. Conversation and evidence now preserve DOM order.

Reviewer rechecked both changes and passed `node --check dist/app.mjs`, accepting the increment for owner visual review. A subsequent cosmetic removal of the unsubstantiated registered-mark symbol did not change interaction behavior.

Reviewer checks: syntax checks for app.mjs, content.mjs and serve.mjs; 47 passing assertions in a temporary in-memory DOM-stub harness covering content integrity, sample/unknown/mixed matching, all three round transitions, held/revised decisions, note retention, escaping, manual track switch, activity and clearing the JD. The harness was not retained as a regression suite. These are not browser or domain-expert checks.

## Coordinator browser checks

Local preview at 127.0.0.1:4184 in the Codex in-app browser:

- General practice → growth round → both questions in reverse order → evidence → recommendation and typed reason → new evidence → held recommendation with revision note → review. Observed correct focus on reply 0 after asking it last; review showed 2 questions, 1 opened record and both notes.
- UI sample JD → suggested role/skills → correct UI round → initial recommendation → changed recommendation → review showed Revised and both choices.
- ADAS sample JD → different role/skills → correct ADAS case and limitations → completed review.
- Activity showed all three completed rounds in the correct entrance categories.
- Console error log returned no entries for these flows.
- Desktop layout inspected at 1440×1000. Mobile homepage and practice layout inspected at 390×844; homepage, workspace and JD form scroll widths were 375 CSS pixels within the 390-pixel viewport. Mobile conversation/evidence computed order both 0.
- Local server returned HTTP 200. No production accessibility audit, screen-reader test, cross-browser matrix or performance benchmark claimed.

## Limitations and next gate

Prepared content, local matching and a decision trace demonstrate flow only. Domain validity, genuine JD analysis, role-aware dynamic conversation, privacy retention settings, authenticated progress and calibrated feedback remain future work. ADAS needs subject-matter review. Owner should judge the homepage and both connected paths before authorizing the next increment.
