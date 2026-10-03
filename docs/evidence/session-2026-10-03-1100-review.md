# October 3, 11:00 acceptance evidence review

Tracked work: [SCRUM-16](https://sadhirr1.atlassian.net/browse/SCRUM-16). Product/Game Design/UIUX/Visual reviewer: `product_plan`. This agent owns only this review record; it does not modify application files, run Git operations, or publish externally. QA and the coordinator independently review this authored record.

Status: bounded fresh-setup and keyboard evidence independently reviewed, final QA reconciliation approved, and this record independently reviewed by QA and the coordinator. Frozen for publication review. The 11:00 title identifies the scheduled session, not the time of every check: resumed execution occurred after noon on October 3. This is not release approval. The reviewed combined candidate is `387d6fbab5d86871912cf2f1f12378f8ddabd41c`.

## Review basis

The reviewer refreshed README, product/sprint/team/quality/backlog documents and the candidate's [player experience](../player-experience.md), [integration](../integration-contract.md), [typed-decision](../typed-decision-contract.md), [debrief](../debrief-contract.md), scenario and visual contracts. The prior [combined checkpoint](session-2026-10-03-1000.md) establishes source/test/capture review, but its locator-directed keyboard activation does not establish a keyboard-only journey. Prior download delivery and actual 200% zoom remain unverified.

## Bounded keyboard journey agreed before execution

Start with a newly loaded candidate and a documented initial browser-content focus. Use actual Tab/Shift+Tab traversal, Enter/Space activation, arrow/Home/End tab/radio navigation and Escape exits. Text may be entered after the keyboard has reached the textarea. Read-only inspection can record active elements or state; it must not focus controls, mutate state or perform actions. Do not use locator-directed focus/click/activation, engine calls, or script focus to skip navigation during a journey labelled keyboard-only. If assistance becomes necessary, record the interruption and narrow the result.

Record the actual key sequence and observed focused controls, not a guessed fixed Tab count. Application-driven focus after a real keyboard action is expected behavior, not test assistance.

| Segment | Required observations |
| --- | --- |
| Start and Help | Reach skip, activate it, then reach Start. Session notice is visible before play. Open/close Help by keyboard and verify return to its opener. Start enters the round and focuses the heading. |
| Stakeholders | Reach all four stakeholder controls. Open/close dialogs without a focus trap; ask at least one question, inspect the answer, and verify return to the current stakeholder control after its underlying markup has been replaced. Keep actual question/evidence counts in the path record. |
| Workspace and prepared choices | Use arrows/Home/End across the three tabs. Select/change a prepared choice with visible focus and Selected text; selection alone does not commit. Reach the enabled confirmation control without pointer use. |
| Typed validation and review | Reach the text action and submit empty text: visible associated error, retained state and focus on the field. Enter an explicitly negated or mixed draft, reach Review, and verify no suggestion. Exercise Edit/cancel with intact wording and expected return focus; use an explicit radio choice and confirmation. Player wording remains separately labelled from the confirmed authored action. |
| Safe restart cancellation | Keyboard-open Home/restart during play, verify Keep playing initially focused, cancel and confirm the specific trigger regains focus. Committed state, draft and selection remain intact. Record the actual trigger tested; do not generalize to untested triggers. |
| Completion and evidence | Traverse all five rounds using the keyboard. Record actual questions and confirmed actions and compare their resulting metrics/claims with the scenario rules. Follow a debrief citation using keys; its source opens and its summary receives visible focus. No motives appear before completion. |
| Download and replay | Keyboard-reach the download action. Report request announcement separately from verified received file/content. Keyboard-reach Replay, verify clean intro and sensible Start focus, and check skip behavior on the new screen. |

This journey targets QA-AC-01/03/04/07/08/11 and the interaction portion of QA-AC-13. It is a bounded end-to-end keyboard check, not proof of every dialog variant, screen reader, browser or device. Additional planned cases remain open when not exercised.

## Independent expected arithmetic for the executed choices

The coordinator reported one R1 question, Theo's `atlas-need`, followed by confirmed choices `pilot / explicit / open / core / evidence`. Product calculated the following from the authored vectors and cap rule in [scenario rules](../scenario-rules.md), before accepting the browser's final result as correct. This is arithmetic review, not a separate engine run. Opening other stakeholder dialogs without asking a question has no score or interview effect.

| Round | Entry D/T/Q | Expected commit D/T/Q | Expected after advance D/T/Q |
| --- | --- | --- | --- |
| 1 pilot | 50/55/50 | 55/60/59 | 55/60/62 |
| 2 explicit | 55/60/62 | 48/71/71 | 48/74/71 |
| 3 open | 48/74/71 | 43/87/74 | 43/89/77 |
| 4 core | 43/89/77 | 40/92/91 | 40/92/96 |
| 5 evidence | 40/92/96 | 41/100/100 | 41/100/100, complete |

Expected counts: one conversation, one heard stakeholder, zero evidence bonuses. `atlas-need` is not a bonus trigger for these choices. R5 requested changes are `+1/+10/+5`, while actual changes after caps are `+1/+8/+4`. Final relationships M/I/L/T are `35/74/74/62`, including Theo's interview `+2`. The first rubric, `outcome:earned` (You earned the next step), applies: Q ≥65, T ≥65 and D ≥40.

An initially planned R5 `shared` choice would instead yield `32/99/100`; it was not the coordinator's final keyboard action. The actual `41/100/100` result is also not evidence of the earlier five-question/four-bonus cap fixture: identical final metrics do not imply identical event histories or counts.

Resolved reviewer correction: Product initially communicated an incorrect delivery threshold of 45 and predicted the deadline title. The coordinator challenged it against the displayed rubric. Direct reinspection found `D ≥40` consistently in `scenario-rules.md:153`, `debrief-contract.md:37` and `public/engine.js:297`; the earned title is correct. This was a review error, not a stale product contract or application defect. The independent numeric calculation above was unchanged; no source fix is required.

## Fresh setup and separate limits

For QA-AC-13, retain the new checkout path, exact commit, clean status before execution, Node/platform identity, README-only setup steps, commands, actual results and source hashes. Identify who starts its server and who completes its UI playthrough. A successful test run in the new directory does not establish a rendered playthrough served from that directory; the source of the served assets must be attributable to it.

For QA-AC-12, actual browser zoom must be set and its value verified as 200%. Record dimensions and readability/operability at that setting. A 390px viewport override, operating-system scaling, device-pixel ratio or font enlargement alone is not equivalent. If no supported control verifies zoom, retain Not run/Blocked with the concrete tool limitation.

For export, a generated string, download announcement or absence of console errors is not file delivery. Verify the returned/downloaded artifact and its content if the tool exposes it; otherwise preserve the unknown outcome without calling the game defective solely because a tool wait times out.

## Evidence review ledger

| Evidence | Review state |
| --- | --- |
| Fresh checkout and documented checks | Product independently reviewed [QA's fresh-checkout record](session-2026-10-03-1100-qa.md): four syntax checks and 99/99 tests, zero failures/skips/cancellations, at October 3 **12:15:18 PDT**, duration **1219.9596 ms**, Node 24.19.0 / Windows x64. Product independently verified the fresh directory's exact candidate HEAD and clean status. QA executed the suite; Product did not rerun it. |
| Actual keyboard journey | Product inspected all **151 entries** of the [retained native-key trail](keyboard-trail-2026-10-03-1100.json), including each recorded active element. It shows skip/start, workspace arrows/End/Home, all four stakeholder dialogs, Theo's question and restored opener, Help, prepared-choice changes, typed error/fallback/Edit, Home cancellation, all five rounds, source activation, download request and replay to Start. Keys act on current focus; typing occurs after the field is reached. The [primary record](session-2026-10-03-1100.md) identifies the server launched from the fresh clone on port 4175; the trail uses that address. No blocking finding in this bounded recorded journey; Product did not execute a separate browser session. |
| Retained visual states | Product opened [the source capture](images/session-2026-10-03-keyboard-source.jpg). The expanded R1 pilot record has a visible focused summary, readable actual/requested effects and Theo's earlier conversation link. Its values agree with independent arithmetic: metrics 50/55/50 to 55/60/59, Theo relationship 52 to 55 after the interview. The image establishes that captured state; the key trail supplies traversal evidence. |
| Actual 200% zoom | **Unverified.** The coordinator attempted native Ctrl+plus after replay, then Ctrl+0; observed viewport, device-pixel ratio and visualViewport scale did not change. The exposed browser surface supplies no verified 200% control. These attempts do not close QA-AC-12. |
| Delivered download | **Unverified.** Steps 130–148 show nineteen reverse-Tab transitions to Download; step 149 activates it and records the honest request announcement. The coordinator's pre-armed delivery wait timed out after 15 seconds without a file path, with no warn/error logs. Request reachability passed; received-file/content verification remains open. |
| Primary session record and status updates | Product reviewed the completed coordinator record, README update and quality-plan current-status paragraph. Fresh setup, actual current-focus keys, arithmetic, source capture and unresolved gates are scoped accurately. The final ownership clarification correctly separates Development's current integration work from the coordinator's earlier application patches; a second independently executed browser journey remains useful for final acceptance. Product verified that correction and the final review/cleanup handoff. No blocking accuracy finding. |
| Final QA evidence reconciliation | Product independently reviewed QA's appended browser-evidence section against the 151-entry trail, source capture and completed primary record. Its actual execution/review distinctions, counts, corrected rubric, source-byte explanation and remaining gates are accurate. No blocking accuracy finding. |
| Independent review of this record | QA approved the final keyboard analysis, fresh-checkout attribution, source observations, limits and corrected arithmetic. Coordinator independently approved the corrected ledger/arithmetic/limits. Development independently reviewed protocol feasibility and numerical expectations. No blocking review finding remains in this document. |

Product also independently checked the app-byte distinction documented by QA. The prior working file has SHA-256 `F18DCEE3AEEC97D09EFA6BAD4CFBEE5CEE800A8AD78C1222A3C42212CCA1482C`; the fresh committed file has `286BEB49ECBEA0B950D6D3C07F7AC3BEBF943C810F166C259F92700025CA425E`. The former has two CRLF sequences and the latter none; replacing only CRLF with LF in memory produces exact text equality. Product made no file change for this comparison. The new QA run applies directly to the committed fresh bytes.

No application change, independent Product test/browser execution, completed release, merge, deployment or measured work-hour claim is made by this review.

The reviewed evidence supports the documented fresh-setup/checks and one complete current-focus keyboard path against the fresh served candidate. It does not certify every dialog path, full AC-07 or all release acceptance. The browser executor contributed earlier application patches, while Development owned the current integration and separate agents reviewed its evidence. Actual 200% zoom, received-download verification, a separate browser execution and broader accessibility/device coverage remain the next acceptance priorities.
