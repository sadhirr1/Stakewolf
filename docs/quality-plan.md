# Stakewolf first-release quality plan

Status: release quality plan with partial baseline regression evidence from September 30. The [baseline QA record](evidence/baseline-qa.md) reports the executed checks and their limits; full release acceptance remains pending.

QA owns this document; product and development independently reviewed the planning coverage. The working scope is one scenario, four stakeholders, five decision rounds, preset and typed decisions, hidden objectives, changing relationships, delayed consequences, replay, and a debrief grounded in recorded events. The September 30 source audit selected a reusable prototype and clean-start session policy. Those decisions and partial regression results do not establish completed features or release readiness.

## Quality work and ownership

| Action | Owner | Independent reviewer | Evidence required |
| --- | --- | --- | --- |
| QA-ACT-01: map release requirements to acceptance checks | QA agent | Product agent | Requirement IDs, checks, unresolved decisions |
| QA-ACT-02: define three reproducible scenario paths | QA agent | Game design agent | Fixed scenario version, starting state, decisions, approved expected results |
| QA-ACT-03: verify gameplay and action submission | QA agent | Development reviewer | Automated or manual results linked to a commit |
| QA-ACT-04: verify keyboard use, mobile layout, and restart | QA agent | UI/UX agent | Device/browser details, steps, screenshots where useful |
| QA-ACT-05: reproduce defects and verify fixes | QA agent | Developer other than the fix author where available | Defect tickets, failing evidence, fix links, retest results |
| QA-ACT-06: prepare release assessment | QA agent | Product agent and release coordinator | Coverage summary, open defects, risks, reviewer decisions |

The `QA-ACT` identifiers are local action points within tracked work, not separate Jira keys or duplicates of the sprint's `QA-01` and `QA-02` backlog items. Planning actions QA-ACT-01/02 belong to the test-plan work ([SCRUM-11](https://sadhirr1.atlassian.net/browse/SCRUM-11)); execution and defect actions QA-ACT-03/04/05 belong to integrated validation ([SCRUM-16](https://sadhirr1.atlassian.net/browse/SCRUM-16)); QA-ACT-06 contributes to release readiness ([SCRUM-17](https://sadhirr1.atlassian.net/browse/SCRUM-17)). These issue mappings were supplied by the delivery coordinator; their existence does not establish completed QA work.

The implementation author cannot be the sole reviewer of a change. Test implementation also needs an independent review; passing a test written by the implementation author is not itself release approval.

## Decisions required before implementation tickets are Ready

- Product defines the completion condition, scoring or outcome categories, supported typed actions, and what hidden information the debrief may reveal.
- Game design supplies the starting values, limits, immediate effects, delayed-effect triggers, and rules for competing effects in each round.
- Development specifies reproducibility controls and how a confirmed action is applied once. The audited prototype has no persistence implementation; product selected clean start after refresh/reopen, with a visible notice before play. No existing recovery feature is being removed. If persistence is added later, record its contract and include resume, interrupted-write, invalid-save, and version-migration checks.
- UI/UX defines the confirmation, clarification, empty, loading, error, and completion states, including keyboard focus behavior.
- Product and development agree on the fallback when typed input cannot be interpreted. If interpretation uses a remote service, service failure must have a defined user-visible outcome.
- The team agrees on supported browsers and phone viewport sizes. Proposed minimum verification is current desktop Chromium and a 390 by 844 CSS-pixel mobile viewport; record actual versions at execution. A resized desktop viewport does not demonstrate testing on a physical phone.

Unknown expected behavior is a requirement gap, not a passing test. Record the owner and resolution on the ticket.

## Release acceptance checks

The `AC` references below are requirements in [the product brief](product-brief.md). `QA-AC` identifiers name distinct verification checks. Required product criteria AC-01 through AC-08 and AC-10 are covered below. Optional AC-09 needs feature-specific checks if it enters the release; it cannot weaken required coverage.

| Check | Product criteria | Test and expected result |
| --- | --- | --- |
| QA-AC-01: complete scenario | AC-01, AC-03, AC-08 | Start a new run with a clear objective and usable controls, then complete exactly five decision rounds with all four stakeholders represented. Each round offers at least two materially different choices. The game reaches one coherent final outcome and debrief without a crash or dead end. |
| QA-AC-02: preset decisions | AC-03, AC-05 | Each available preset has the documented effect once. Unavailable actions cannot be submitted through ordinary UI interactions. Changing a selection before confirmation causes no state change. |
| QA-AC-03: typed decisions | AC-05 | Enter supported actions using reviewed representative paraphrases. The interface shows its proposed interpretation before commitment. Confirming applies the approved action once; cancelling or editing leaves the committed game state unchanged. Equivalent confirmed typed and preset actions produce equivalent effects. |
| QA-AC-04: clarification and fallback | AC-05 | Empty, ambiguous, unsupported, irrelevant, and very long input produce the specified validation or clarification state. Preset choices remain accessible. Where remote interpretation exists, timeout and service failure preserve progress within the current session and allow the documented fallback. Unconfirmed or failed interpretation consumes no round. |
| QA-AC-05: stakeholder memory | AC-02, AC-04 | A later stakeholder response references only events that the stakeholder could know under the scenario rules. Reactions correctly reference earlier committed decisions. Hidden objectives affect behavior but are not exposed prematurely in ordinary player screens. |
| QA-AC-06: consequences | AC-03, AC-04 | At least two earlier decisions affect a later round. Immediate effects match the approved rules. A delayed effect occurs at its specified trigger, once, with the correct target and value. Relationship values remain within their defined limits. A control path without the triggering decision does not receive that delayed effect. The three reviewed reference playthroughs produce materially different event histories or endings. |
| QA-AC-07: debrief traceability | AC-06 | Every factual claim about player behavior, stakeholder reactions, and outcomes maps to a recorded event or decision. Evaluative feedback identifies its rubric and supporting evidence, explains tradeoffs and uncertainty, and supplies actionable reflection prompts. The debrief distinguishes interpretation from observed events and makes no unsupported hiring-performance claim. |
| QA-AC-08: replay and isolation | AC-01, AC-10 | Restarting creates the documented initial state and a separate run. Prior relationship values, pending effects, decisions, and interpretation requests cannot contaminate the new run. Reopening an earlier result, if added to scope, cannot alter its recorded outcome. |
| QA-AC-09: repeated submission | AC-03, AC-05, AC-10 | Rapid double-click, repeated Enter, and retried requests cause one committed decision and one round transition. A late interpretation response cannot replace a newer input or apply to a restarted run. Controls communicate that an action is being processed. |
| QA-AC-10: refresh and reopen | AC-10 | Under the selected clean-start policy, visibly explain before play that progress is not saved. Refresh/reopen offers a clean start with the documented initial state, and no prior committed/unconfirmed action or late interpretation affects the new run. If persistence is added later through a recorded scope decision, add checks for exact restoration of committed state, no duplicate effects after interruption, understandable handling of invalid saves, and defined version migration. |
| QA-AC-11: keyboard access | AC-07 | Start, choose/type, clarify, confirm, cancel, advance, open the debrief, and replay using only the keyboard. Focus is visible, order follows the interface, dialogs can be exited, and focus returns to a sensible control. No required action or consequence cue depends only on hover or color. |
| QA-AC-12: responsive layout and zoom | AC-07 | At 200% browser zoom and each agreed phone/desktop viewport, stakeholder information, decision controls, confirmation, error messages, and debrief remain readable and operable without overlapping content or required horizontal scrolling. Long names and typed text remain contained. |
| QA-AC-13: fresh setup | AC-08 | A separate reviewer starts from a fresh checkout using only documented prerequisites and setup steps, runs the documented automated engine checks, starts the game, and independently completes a full playthrough against the identified release candidate. Record actual commands, environment, and results; do not substitute the author's existing working environment as evidence. |
| QA-AC-14: stakeholder and information model | AC-02, AC-04 | Each of four stakeholders has a documented public responsibility, private objective, starting information, and reaction rules; at least two objectives conflict meaningfully. Test allowed and prohibited rumor spread, its trust effects, and reveal conditions. Player screens distinguish stakeholder claims from established scenario evidence without revealing information earlier than the rules permit. |

Each implementation ticket must reference applicable checks and any narrower feature-specific acceptance criteria. Do not defer all QA until the final week: review requirements on days 1-2, verify the first complete playable path as soon as it exists, and run focused checks with each feature. Use the later testing window for broader regression checks and player feedback.

## Reproducible scenario paths

Game design must approve concrete actions and expected results before these become release reference fixtures. The names below describe coverage targets, not completed scenarios or promised outcomes. The separately executed baseline fixtures regress the candidate's current rules; they are not approval of these release paths or the candidate's narrative accuracy.

| Path | Decisions and behavior to cover | Required distinction |
| --- | --- | --- |
| PATH-A: cooperative choices | Preset choices that acknowledge competing stakeholder interests | A documented relationship trajectory and end result |
| PATH-B: competing priorities | Choices that favor one stakeholder while creating costs for another | A different relationship trajectory and a triggered delayed consequence |
| PATH-C: clarification and restart | Typed actions, one ambiguous input, an edited interpretation, and a separate interruption/reload variant following the selected clean-start policy | The same underlying rules hold across input methods; the completed reference run has a materially different event history or ending. The interruption variant verifies clean restart and then completes the resulting fresh run. |

For each fixture, record scenario/rules version, application commit, seed if randomness exists, starting state, the five confirmed actions, expected state after each round, expected delayed events, and the final debrief evidence. Include a control variant that removes a delayed-event trigger. Include a typed/preset equivalent pair to verify that equivalent approved actions have equivalent effects.

Expected values must come from independently reviewed scenario rules, not a snapshot accepted solely because the current implementation produced it. If interpretation uses a nondeterministic provider, verify the game engine with fixed approved actions and test the interpretation layer separately. Record provider/model configuration for integration checks without recording credentials.

## Traceability and test evidence

The implementation should make a run's causal history inspectable for QA. The exact representation belongs to development; the evidence must identify the run, round, confirmed decision, rule applied, affected stakeholder, before/after values, delayed-effect trigger, and any debrief claims derived from that event. Internal fixtures may contain hidden objectives; ordinary gameplay screens must follow the reveal rules.

Report each execution using:

| Field | Required content |
| --- | --- |
| Test identity | Test ID, applicable acceptance checks, tracker key, fixture/version |
| Build and environment | Commit or build ID, date/time with timezone, browser/version, viewport or device |
| Execution | Actual tester/agent role, automated or manual method, precise steps or test command |
| Result | Expected result, observed result, and Passed / Failed / Blocked / Not run |
| Evidence | Relevant output, screenshot, event trace, or recording; redact secrets and unrelated personal data |
| Follow-up | Defect key, fix commit, independent reviewer, and retest result when applicable |

A written test plan is not an executed test. A screenshot demonstrates only the state it captures. A successful build does not establish gameplay correctness. Do not report planned checks or another agent's unverified statements as passes. Preserve failing evidence when a fix is retested.

## Defect severity and release rules

| Severity | Examples | Release rule |
| --- | --- | --- |
| S0: critical | Exposed credentials, destructive corruption of stored runs | Block release; contain the issue and independently verify the correction. |
| S1: major | A run cannot finish; confirmed actions apply twice; core consequences or debrief claims are wrong; required controls are inaccessible | Block release until fixed and retested. |
| S2: significant | A supported secondary path or recovery case fails; material mobile layout issue | Block when it violates release acceptance. Product may remove the affected capability from scope only with a recorded scope change, dependency review, and updated acceptance checks. |
| S3: minor | Cosmetic issue with no loss of required information or function | May remain with a linked ticket, owner, and documented release decision. |

Severity describes impact; priority describes repair order. QA proposes severity with a reproducible case. Product and development resolve disagreements on the issue, retaining the evidence and decision.

Release requires all in-scope acceptance checks to pass on the release candidate, all required reviews to be recorded, no open S0/S1 defects, no unresolved acceptance-blocking S2 defects, and an accurate known-issues list. Verify each fix and run regression checks justified by its affected behavior. A subsequent change invalidates affected evidence; rerun those checks on the new candidate. Do not broaden or repeat unrelated tests without a reason.

## Current evidence status

The [October 3 combined candidate](evidence/session-2026-10-03-1000.md) brings the separately reviewed visual, session/typed, memory/event and debrief increments together for integration review. [Independent QA](evidence/session-2026-10-03-1000-qa.md) executed 99 tests and four syntax checks against the recorded source hashes. Conservative language cases and event-grounded debrief claims now have combined automated evidence; targeted browser checks cover a complete five-round path, safe Home cancellation, later memory, source-link focus, literal wording and narrow layout. Fresh release-candidate setup/playthrough, full keyboard-only traversal, actual 200% zoom, broader accessibility/device checks and actual downloaded-file delivery remain open. These bounded results are not release acceptance. The earlier entries below retain their historical checkpoint limits.

- Application baseline: imported candidate plus a new local server; tested files, base commit, hashes, and environment appear in the [baseline QA record](evidence/baseline-qa.md).
- Executed checks: the September 30 baseline passed 15 Node tests. The [first October 1 checkpoint](evidence/session-2026-10-01.md) passed 22. The [06:00 memory/event increment](evidence/session-2026-10-01-0600.md) passed 51, adding exact reference paths, memory branches, information boundaries, provenance, invalid-state and capped-bonus checks. The 243-path coverage remains structural, not exhaustive narrative acceptance.
- Release reference expectations: the reviewed [scenario contract](scenario-rules.md) specifies three paths, arithmetic, information audiences, and debrief obligations. Exact numeric fixtures and focused memory/event checks now have executed evidence. Full debrief citations and broader narrative acceptance remain pending.
- Refresh/reopen policy: clean restart selected after source audit. The coordinator observed replay and narrow-viewport refresh returning to the intro. The October 1 patch adds the visible intro notice and verifies focused dialog-return behavior; full release-path verification remains required.
- Browser and device checks: the coordinator's [session handoff](evidence/session-2026-09-30-0600.md) records targeted desktop/narrow-viewport checks and their limits. The Node tests do not establish rendered layout, keyboard use, zoom, or phone usability.
- Release assessment: not accepted. The specific S1 false player attribution has a reviewed correction and focused retests in the first October 1 checkpoint. The 06:00 increment adds the required minimum conditional callbacks and event foundation, with focused independent checks. Supported debrief claims/citations, later-dialogue consistency, typed-language coverage and full accessibility remain open; preserve the severity gates above.
