# SCRUM-34 independent QA — one morning assignment

This record covers the bounded `/wild/` morning continuation: one scout, two competing destinations, work carried from the night, distinct consequences, and replay. It does not establish the full five-round release case or authorize release.

## Ownership and environment

- Tracker: [SCRUM-34](https://sadhirr1.atlassian.net/browse/SCRUM-34).
- Independent source reviewer and test author: QA agent `hollow_qa`. State author: `hollow_rules`. Scene author: `hollow_scene`. App, markup, styling and integration: coordinator.
- QA owns `tests/scrum34-wild.test.mjs`, this record, and the narrowly authorized additive initial-state assertion update in `tests/scrum32-wild.test.mjs`. The coordinator independently reviewed all fourteen new test definitions and accepted their design, including the later historical-hearing assertions.
- Windows, PowerShell, Node.js v24.21.0. Execution date: October 11, 2026, America/Los_Angeles (UTC−07:00). Runner durations are execution measurements, not work hours.
- Local checkout HEAD during review: `a5eda951d9469bed8c89cf93304478555f9d9be6`. The working-tree candidate includes preceding reviewed increments; delivery branch and integration commit belong to the coordinator's handoff. Unrelated working-tree files were preserved.

## Executed checks

| Check | Actual result | Scope |
| --- | --- | --- |
| Initial rules, histories and projections | Focused SCRUM-34 state/history/planning/ledger/outcome/projection/replay selection: **13 passed, 0 failed, 0 skipped**, 169.1645 ms | Before-dawn and explicit-start gates; matching location; one assignment; real competing costs; stable ledger identity; branch consequences; historical evidence; invalid inputs; detached records; replay |
| Historical-hearing follow-up | `node --test --test-name-pattern='SCRUM-34 history: morning work' tests/scrum34-wild.test.mjs`: **1 passed, 0 failed, 0 skipped**, 121.435 ms | Night account archive rejects new hearing at dawn, begun morning and completed morning; earlier reports remain unchanged |
| Unavailable rendering | `node --test --test-name-pattern='SCRUM-34 fallback' tests/scrum34-wild.test.mjs`: **1 passed, 0 failed, 0 skipped**, 209.937 ms | Absent and denied WebGL retain callable morning/dawn/travel/pause/replay/dispose controls, notify once and never claim rendering ready |
| Final syntax | Separate `node --check` commands on `public/wild/app.js`, `state.js` and `scene.js`: **all exited 0** | Executed after global author freeze on October 11 at approximately 14:44 PDT; syntax only |
| Final full regression | `npm run check`: **222 passed, 0 failed, 0 skipped**, 3262.3706 ms; **exit 0** | Executed once after global author freeze; includes fourteen SCRUM-34 checks and existing forest/state/HTTP/simulation regressions |
| Browser experience | Coordinator-owned; not executed by this QA agent | World appearance, interactive confirmation/cancellation, keyboard/focus, ledger scrolling, mobile layout and performance require attributed browser evidence |

The first executed command was `node --test --test-name-pattern='SCRUM-34 (state|history|planning|ledger|outcomes|projections|replay)' tests/scrum34-wild.test.mjs`.

The state fixtures cover six morning routes: repair after observation, hold after observation, and hold without observation, each followed by crossing or trail. A separate fixture carries a late night inspection after an uninformed hold. Frozen prior snapshots detect mutation. Tests use the public action and projection APIs; they do not depend on private implementation functions.

The checks establish the following bounded distinctions:

- Crossing work after repair guides a first party; the wider promise is only partly fulfilled, the trail is deferred, and the exhausted crew rests.
- Crossing work after hold observes the defect in daylight; repair remains pending, the crossing stays closed and families wait. Morning observation does not become night evidence or justify an earlier commitment.
- Trail work records undated marks without identifying a culprit or reconstructing an unseen night. The crossing work is deferred; staffed and unstaffed night-watch histories stay distinct.
- One confirmed assignment consumes the morning even after repeated requests or travel. Planning, travel and reading the ledger consume none.
- Obligations retain stable IDs, owners and origins as statuses change. Reports and the ledger agree, and callers cannot mutate later projections through returned arrays.
- Replay clears the morning along with night records. The old immediate outcome and dawn report remain historical records throughout subsequent work.

The fallback test uses unavailable canvas contexts. It does not compile shaders, render geometry or establish GPU performance. No CI execution is claimed. These checks contribute to QA-AC-02/06/07/08/09/10 for this increment; wider release and accessibility gates remain separate.

## Independent source review

QA inspected new state gates and narrative distinctions; stable obligation ownership and origin; the app's matching-location confirmation and single assignment; clearing pending assignment on modal close; chronological journal labels; morning scene initialization after delayed import; replay resetting the scene; callable fallback; canonical scene enum validation; preuploaded variant buffers; optional lights; opaque attribute rebinding; and shared cleanup of resources.

| Review item | Resolution and evidence |
| --- | --- |
| Night accounts could be added through the state API after dawn | The existing UI already blocked these account interactions. Rules author added a dawn guard to protect the historical archive at the API boundary too. QA inspected the guard and passed the expanded history test; no ordinary-browser reproduction is claimed. |
| Replay confirmation omitted morning assignment | Coordinator updated the confirmation to include the cleared morning work. Independent QA inspected the corrected text. |
| Large heading obscured the world view | Coordinator added a compact heading and hid description/progress when the reading panel is deliberately hidden. Independent QA verified that restoring the panel restores those elements, refreshes marker exclusions, and that replay/fallback restore reading mode. Actual appearance remains coordinator-owned. |
| Trail result needed a clearer visible location | After coordinator browser review, scene author repositioned the trail pennants/impressions and added a local inspection lantern. Independent QA inspected the fragment-only uniforms, variant-specific light gate and zero-distance divisor guard, optional particle light draw, null/other-variant reset and shared cleanup. Coordinator's final retest reported two pale pennants and the lantern visible above navigation, with nearby impressions subtle but visible. No shader execution or pixel result is inferred from QA's source inspection. |
| Branch-specific scene meaning | Source shows guided travelers for the repair path, an observed-defect marker for hold, and undated trail markers. The anchor is secured only for dawn after repair; hold retains the loose fastening and barrier. Pixel appearance and recognizability belong to the coordinator's browser checks. |

No confirmed blocking source or automated-test finding remains in the frozen candidate. The final regression includes the historical-hearing guard and trail visibility follow-up.

The coordinator reported browser checks for uninspected hold followed by morning crossing inspection: cancellation/Escape restored focus to Assign, confirmation/Enter produced pending repair and deferred trail, later travel offered no second assignment, and the journal retained zero night observation while adding the morning finding. The coordinator also reported a readable repair-to-crossing confirmation and work ledger at 390×844, keyboard return with restored focus, and document width 375≤390. The hold barrier/anchor flag were seen with normal motion; the guided party/secured fastening were seen while paused. These are attributed reports, not browser checks executed by `hollow_qa`.

## Final source identity

SHA-256 hashes captured **October 11, 2026 at 14:44:37 PDT**, immediately after final syntax and regression checks. No runtime or test changes followed those checks in this QA handoff.

| File | SHA-256 |
| --- | --- |
| `public/wild/index.html` | `1AE2F60D2E6415DCA13C12B78DB0DDCA5CBF4B65501838DB95B438108D1188BE` |
| `public/wild/style.css` | `5DCCDAD86D690F8E6DFB9BBB9A3751CBCAC498A183874BCD2E3130E1A23FC3B9` |
| `public/wild/app.js` | `67A04EFE68BBB1D7EB7B24DF6C8B79D84D3CF4FC4097CF183F2CD2DE40444275` |
| `public/wild/state.js` | `369813AC016CEF2A094A84B886646F9CE9008F0B27CAC3394BBABD9E9950C6FC` |
| `public/wild/scene.js` | `F936AB20582384FA037D57D2B2283B8C59C812069B343EF5487E7F668CB2FD80` |
| `tests/scrum32-wild.test.mjs` | `4B8DE27C4923EFFF068F491631A6284A355E12940965DDF0438743BC315AE341` |
| `tests/scrum33-wild.test.mjs` | `5963BFFFC7BCE436D2FFD642F3228580B4F510C4D3AAC78E9B545DAA9C13DBF5` |
| `tests/scrum34-wild.test.mjs` | `529160B09E3FEE5988295E5EC916D0570A6B197688581D7D6C3E938856778F93` |
| `server.mjs` | `5AD493760D7DC26E86E80DFCCB5D4A3EAC2CBFD375DC519DAC0CB509E8B5EA37` |

## Handoff

Independent source/state/fallback review is accepted for this bounded increment. The coordinator independently approved the tests, and the frozen candidate passes full regression. The coordinator owns the detailed browser record, GitHub/Jira integration and durable delivery of this evidence. No CI execution, merge, deployment, fresh-checkout verification or full release acceptance is claimed here.

The evidence does not establish a general scheduling engine, a complete five-round wilderness case, actual GPU performance, physical-phone behavior, screen-reader use, OS reduced-motion behavior, full zoom/browser coverage or forced GPU-loss recovery. This increment implements one authored morning assignment with visible remaining work and truthful historical records.
