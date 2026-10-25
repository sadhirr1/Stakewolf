# SCRUM-37 / SCRUM-38 verification record

## 2026-10-25 — two-round council engine

Owner requested a working, low-usage council prototype in two existing practice areas. Development/Game Design specialist `council_engine` authored the deterministic engine, scenario definitions, 13 engine tests and COUNCIL.md. Coordinator authored integration, rendering and styles; separate QA specialist `council_review` independently reviewed both and authored 9 real-handler regression tests. Coordinator inspected and accepted the QA tests. Independent review found no blocking defects in this bounded increment; this is not release or educational-validity acceptance.

Implemented: Accessibility and Platform / API councils accessible from home, General practice and matching JD responsibilities; three stakeholders with concealed motives; two-source investigation budget; evidence/proposal/promise-dependent support; six-unit next-round capacity; locked promises; decision-specific response work, reactions and deferrals; final motive reveal and replay. Support is not a grade. No network inference or new dependencies.

Actual verification:

- Coordinator ran the existing 30 adaptation/coaching/UI tests: 30 passed.
- Engine author ran 13 council tests: 13 passed, including all proposal/promise combinations, immutable state, information boundaries, hard capacity limits, terminal guards and replay.
- Independent QA ran all 52 practice tests: 52 passed. After strengthening sidebar and role-specific reaction assertions, the affected 9 UI tests passed again. Coordinator reviewed those retained tests; no unmeasured final rerun is implied.
- Browser: Accessibility entered through General practice; Keyboard walkthrough inspected using Enter; local repair plus independent checks reserved 4/6 units and won Engineering support; error-announcement response brought allocation to 6/6; the unaffordable interim route was disabled and remained deferred. Final trace retained the keyboard-triggered inspection and actual funded work. Focus returned to the toggled work button.
- Browser: a synthetic Platform JD led to the systems council and retained interview context. Two investigations exhausted the budget. Versioned migration plus retirement and rollback promises won two stakeholders but reserved 5/6 units, leaving both additional responses unfunded. A replay with only retirement reserved funded the parser fixture and left dual-format maintenance deferred. Different bargains produced different delivered/deferred records.
- Browser visuals inspected at the actual 1280×720 viewport; document width was 1265 with no horizontal overflow. Inspected negotiation, current positions, locked commitments and round-two allocation. No console error entries. No mobile emulation, cross-browser or screen-reader audit claimed.
- Browser review prompted an interface refinement: current stakeholder positions now remain beside the capacity ledger so support changes can be seen while bargaining. The author replaced generic positional reaction mapping with role-specific response mapping; independent QA reviewed the final mapping.

Scope limits: fixed fictional cases and agendas; choices drive authored reactions. Promises cannot be broken in round two: their effort is reserved and delivered automatically. Unfunded response work is explicitly carried forward, but this prototype ends after round two; there is no third-round simulation. Activity is in memory only. Hidden objectives are excluded from ordinary play until the debrief, but remain inspectable in client source. There is no proficiency score, live AI, multiplayer, employer-question prediction or validated assessment. Previous November release dates require reforecast for the platform pivot.

Reviewed source is checkpointed with SCRUM-38 to existing draft PR25 and the existing owner-private Site. This document and linked Jira evidence are the durable handoff; a local screenshot alone is not treated as durable verification.

## 2026-10-24 follow-up — local answer coaching

Owner requested missed-evidence, conflicting-view and interview-improvement feedback, keeping usage low. Coordinator authored interface/state integration and documentation; `answer_feedback` authored the pure coaching module and tests. Separate `answer_qa` independently reviewed both and authored retained UI regression tests; coordinator read and accepted those tests.

Resolved review findings: detached record-toggle events could contaminate a later attempt; opening a record immediately before an ask/render could be lost before its queued event; feedback referred to received replies that were no longer visible. Added active-element/phase guards, synchronous capture before ask/commit/finish, and expandable received replies. Browser review also found an explicit short uncertainty statement was missed and a next-step prompt prioritized a record already cited; reduced the uncertainty wording threshold and prioritized uncited/unconsulted records. Independent QA accepted the final two fixes with 11/11 engine tests passing.

Actual verification on Windows / Node 24.21.0:

- Coordinator final combined run: `node --test tests/adapt.test.mjs tests/feedback.test.mjs tests/feedback-ui.test.mjs` — **30/30 passed** (10 adaptation, 11 coaching, 9 integration tests).
- Independent QA ran the earlier 27-test suite, then 9/9 affected integration tests after received-reply coverage, then 11/11 final coaching tests after the browser findings. Do not conflate these separate runs with an independently executed final combined suite.
- App, feedback and server syntax checks passed. Retained tests exercise all nine cases, blank/name-dropping/negated answers, exact excerpts, phase-specific openings, two-question budget, received-vs-unasked replies, hidden-motive exclusion, escaped text, duplicate action guards, detached/pending record events, clean replay and unchanged original history during rehearsal.
- Browser: completed the adaptive Accessibility flow using a synthetic UI JD. Opened Audit scope and asked Design before committing; opened Keyboard walkthrough afterwards and left Support tags unopened. Debrief correctly showed all three access states, initial/final references and public views. Confirmed received-reply disclosure, keyboard Enter rehearsal, detected names/wording, and preserved original text. Final rerun verified Support tags received priority and “The estimate remains unknown.” was detected.
- Browser visual inspection at 935×604: overview, coaching cards and rehearsal readable; document scroll width 920, no horizontal overflow. Console error entries were empty. No new mobile viewport, cross-browser or screen-reader audit is claimed in this follow-up.
- Initial sandbox preview could not be reached. It was stopped, restarted with authorized loopback access, and returned HTTP 200 before the successful browser checks. This was an environment issue, not a passing initial browser run.

Scope limits: exact names and conservative wording patterns, not semantic correctness/persuasion assessment; no score, inferred beliefs, paid inference, private transcript publication or persistence. Domain/educational validity remains unverified. Sanitized evidence is this record plus Jira; screenshots use synthetic test input only. Reviewed source is checkpointed to the existing PR25, and the Site keeps its owner-only audience.

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
