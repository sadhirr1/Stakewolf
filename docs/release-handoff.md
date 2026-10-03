# Stakewolf candidate handoff

Prepared October 3, 2026 by Development for [SCRUM-17](https://sadhirr1.atlassian.net/browse/SCRUM-17); Product updated the candidate and supported startup clauses after the 13:00 correction. QA and the coordinator independently review those updates. This is a runnable candidate handoff, **not an accepted release, merge or deployment**. The target remains October 13 at 8:48 p.m. America/Los_Angeles, subject to the [quality gates](quality-plan.md#defect-severity-and-release-rules).

## Candidate to review

| Item | Identity and meaning |
| --- | --- |
| Current application/source checkpoint | [`22de1c4927d70054a1ce4ee7cffbeab4f34099de`](https://github.com/sadhirr1/Stakewolf/commit/22de1c4927d70054a1ce4ee7cffbeab4f34099de): combined feature candidate plus reviewed static recovery/bootstrap, narrow server allowlist and startup tests/check wiring. This is the pin used below. |
| Historical gameplay/fresh evidence | [`387d6fbab5d86871912cf2f1f12378f8ddabd41c`](https://github.com/sadhirr1/Stakewolf/commit/387d6fbab5d86871912cf2f1f12378f8ddabd41c) is the preceding combined application; [`0cb12126dd2256bb417cfa65fb91bc8632cd5c4b`](https://github.com/sadhirr1/Stakewolf/commit/0cb12126dd2256bb417cfa65fb91bc8632cd5c4b) adds fresh setup and keyboard evidence. Those complete-path/fresh-checkout executions predate bootstrap and remain attached to their original source. |
| Review proposal | Draft [PR #8](https://github.com/sadhirr1/Stakewolf/pull/8), branch `feature/SCRUM-16-combined-candidate`. The coordinator verified it open and unmerged at the start of this session. Prior PRs and main have not been replaced by this document. |
| Live delivery status | [Release epic SCRUM-5](https://sadhirr1.atlassian.net/browse/SCRUM-5), [validation SCRUM-16](https://sadhirr1.atlassian.net/browse/SCRUM-16), [handoff SCRUM-17](https://sadhirr1.atlassian.net/browse/SCRUM-17). The [readiness ledger](release-readiness.md) maps every required acceptance clause and remaining owner/action. |

The [startup QA record](evidence/session-2026-10-03-1300-qa.md) records the corrected source/test SHA-256 identities and reconciliation with checkpoint `22de1c49…`. Gameplay app/engine/scenario/style content remains unchanged; HTML and the external bootstrap add recovery, and the server allows that one additional asset. The committed `app.js` hash `286BEB49…` differs from the working copy `F18DCEE3…` solely through the previously verified two CRLF-to-LF conversions. Use the pinned candidate identity when recording a new check, and identify any later source change explicitly.

## Obtain and run it locally

Use Node.js **24.x**; the recorded Windows environment used **24.19.0**. Git is needed only to obtain a fresh checkout. In a directory where `Stakewolf-candidate` does not already exist:

```sh
git clone --branch feature/SCRUM-16-combined-candidate --single-branch https://github.com/sadhirr1/Stakewolf.git Stakewolf-candidate
cd Stakewolf-candidate
git checkout --detach 22de1c4927d70054a1ce4ee7cffbeab4f34099de
node --version
node server.mjs
```

Pinning the checkpoint prevents a later branch update from silently changing the review target. No package installation, build, account, API key or external AI provider is required. Open the address printed by the server, normally [http://127.0.0.1:4173](http://127.0.0.1:4173). If occupied, stop this attempted start and use `node server.mjs 4174`; do not stop an unrelated process. Stop your own server with Ctrl+C when finished. The server listens on loopback only; this is local access, not public hosting.

For a new checkout, the documented checks are:

```sh
node --check server.mjs
node --check public/bootstrap.js
node --check public/app.js
node --check public/engine.js
node --check public/scenario.js
node --test
```

Optional npm shortcuts are in [package.json](../package.json); npm is not required. These commands are instructions for the next executor. The current source passed five syntax checks and 109 tests in the existing working checkout; the earlier clean-clone 99-test execution remains historical. A fresh-checkout run of the corrected bootstrap is not claimed. Updating this handoff itself does not change application or tests.

## Where the behavior lives

| Entry point | Responsibility |
| --- | --- |
| [server.mjs](../server.mjs) | Dependency-free local server; serves only the six known public assets with unchanged restrictive CSP. |
| [public/index.html](../public/index.html) | Page shell, static focusable recovery main/native reload/no-script guidance, skip link, native dialogs and bootstrap entry. |
| [public/bootstrap.js](../public/bootstrap.js) | Awaits application initialization, validates usable intro, restores visible recovery after startup failure and enables Help only when ready. |
| [public/style.css](../public/style.css) | Dark dossier/serif/lime visual system, readable controls, visible focus and selection, responsive and reduced-motion rules. |
| [public/scenario.js](../public/scenario.js) | Four stakeholders, five rounds, authored dialogue, choices, numerical effects, delayed rules and memory copy. |
| [public/engine.js](../public/engine.js) | Deterministic state transitions, event/knowledge provenance, conservative intent suggestions, debrief model and text-record formatter. |
| [public/app.js](../public/app.js) | Rendering including the focusable main target, session UI, validation, confirmation/restart focus, source navigation and download request. |
| [tests](../tests) / [baseline workflow](../.github/workflows/checks.yml) | Independent rule, server, narrative, memory, typed-input, debrief and integration checks; Node 24 syntax/tests on Windows and Linux in CI. |

## Behavior and limits to explain to a player

- One authored scenario has four stakeholders, five decisions and up to two optional questions per round. Choices affect delivery, trust, quality and relationships; earlier choices produce scripted later effects and four approved conditional memory callbacks. This is a simulation, not a validated professional assessment.
- Progress lives in the current page. Refresh, reopen, confirmed restart and replay start clean attempts. The intro states this visibly. In-app Home during play/results asks for confirmation; cancelling preserves the active attempt. A downloaded record is readable evidence, not a resumable save.
- Written decisions use a finite local word/phrase matcher, not general language understanding. Supported affirmative forms can suggest an authored approach. Recognized veto cues, competing authored matches and wording outside the supported patterns leave selection to the player; other prose may not be understood correctly. The player can override any suggestion and must explicitly confirm it. Only confirmation changes game state. The separately labelled wording does not change the selected action's rules. See the [typed contract](typed-decision-contract.md).
- Game inputs remain in browser memory within this implementation; no live model, account service or telemetry is implemented. Confirmed typed wording is stored as a player-only event, separate from the public choice. Export deliberately includes the player's wording. Browser software and a file the player downloads are outside the game's in-memory lifecycle.
- Hidden agendas are concealed in ordinary play and revealed at completion; shipped client source contains their authored text. This is a player-facing spoiler boundary, not secure server-side secrecy. Debrief sources filter private event ancestors; completion does not make every hidden record public.
- The debrief distinguishes recorded facts, an authored outcome rubric and reflection prompts, with sources for effects and claims. Eligible bonuses that add no points at a cap are distinguished from positive gains. The download formatter shares that model. Actual receipt of a downloaded file remains unverified; a successful request is not evidence of delivery.

## Reviewed evidence available now

| Evidence | Recorded result and limit |
| --- | --- |
| [Combined integration and review](evidence/session-2026-10-03-1000.md), [independent QA](evidence/session-2026-10-03-1000-qa.md) | The three feature increments were combined and independently reviewed; 99 tests ran together, not merely added from separate reports. Sampled desktop/narrow UI, literal wording, memory and source links have browser evidence. |
| [Fresh QA](evidence/session-2026-10-03-1100-qa.md) | On October 3 at **12:15:18 PDT**, a clean local clone at the application commit passed four syntax checks and **99/99 tests**, zero failures/skips/cancellations, **1219.9596 ms**, Node 24.19.0 on Windows. A fresh checkout is not a second computer or OS. |
| [Keyboard journey](evidence/session-2026-10-03-1100.md), [151 retained action/focus entries](evidence/keyboard-trail-2026-10-03-1100.json) | Coordinator-executed five-round path using current-focus native keys, independently reviewed by Development, QA and Product. Root authored earlier application patches; this is not a wholly separate application author's browser acceptance. |
| [CI run 37147817198](https://github.com/sadhirr1/Stakewolf/actions/runs/37147817198) | Coordinator verified completed/success for publication checkpoint `0cb12126…`, both Ubuntu and Windows Node 24 syntax/test jobs. This historical run does not establish the status of a later publication. Workflow presence or passing CI does not establish branch protection or release acceptance. |
| [12:00-slot QA attempt](evidence/session-2026-10-03-1200-qa.md) | QA's initial inventory returned `apps:[]` and `browsers:[]`. No independent UI actions or new tests ran. The missing worker capability does not invalidate earlier passes or satisfy the remaining browser gate. |
| [Startup correction](evidence/session-2026-10-03-1300.md), [independent QA](evidence/session-2026-10-03-1300-qa.md), [Product review](evidence/session-2026-10-03-1300-review.md) | Preserves the approximately 13:07 controlled missing-app S2 failure and its corrected/retested recovery. QA independently ran **five syntax checks and 109/109 tests at 13:10:02 PDT**, 1198.0116 ms. Coordinator checked missing app/dependency, synthetic partial initializer, absent bootstrap and normal startup around 13:11–13:13; native skip/reload/Start/Help plus a locator-selected R1 launch/refresh passed within that scope. Native JavaScript-disabled rendering remains unverified. |

Source/model reviews and formatter tests support their named clauses; they do not substitute for actual zoom, browser interaction or file receipt. The [readiness ledger](release-readiness.md) is the detailed acceptance map.

## Concrete next review assignment

Coordination should assign a human reviewer or worker who did not author the application and already has a usable browser surface. This does not assume that the coordinator can enable unavailable tooling. Use the pinned checkout above, record its commit, server address, Node/browser/OS and the actual execution time. Start with this bounded path:

| Round | Prepared choice visible in the game | Reference ID |
| --- | --- | --- |
| 1 | Hold the public launch | `launch` |
| 2 | Fix the default quietly | `quiet` |
| 3 | Keep attention on delivery | `ignore` |
| 4 | Build the Atlas workflow | `custom` |
| 5 | Lead with momentum | `momentum` |

1. Read the no-save notice, start, and use **zero questions**. Opening/closing a conversation is free; asking a question would change this reference path. Choose and confirm `launch / quiet / ignore / custom / momentum`, advancing once after each result. Before deciding in R2, open Mara and Ishan to inspect their public-launch callbacks; in R3 inspect Leah's quiet-fix callback; in R5 inspect Theo's conditional Atlas-workflow callback. This is the **PATH-B custom variant**, not canonical PATH-B, which uses `both` in round four.
2. Compare each transition with the [independently derived table](evidence/session-2026-10-03-1200-qa.md#independently-reviewed-expectations-for-a-future-run). Expected final delivery/trust/quality is **100/10/6**; Mara/Ishan/Leah/Theo relationships are **78/24/26/44**; outcome is `borrowed`, with zero conversations and evidence bonuses. These are expectations, not newly observed results. At the cap, R4's delayed delivery requests +4 but adds +2; R5 requests +15 but adds 0.
3. Inspect the quiet-fix, ignored-rumor and Atlas-workflow reflections. Follow their supporting source and causal links. The workflow commitment is conditional; it must not become an invented retention exception. The ignored-defect event is known to Ishan in-world and narrated to the player; ordinary stakeholder text must not invent disclosure to others. Record the actual visible text and source labels.
4. Request the decision record from the debrief. Confirm a file was actually received, open it, and compare its five choices, final signals, counts and cited effects with the visible debrief. Retain a sanitized copy or evidence summary. If the browser/tool cannot expose delivery, record that limitation rather than a pass. Replay and verify a clean intro and Start focus.
5. In a **separate labelled attempt**, cover remaining interaction variants: use both conversations and close an exhausted dialog; cancel and confirm restart from the available triggers; submit repeated Enter/double-click and verify only one decision/advance; enter a draft, refresh and reopen, and verify a clean intro with no old draft. Keep this run separate from the zero-question arithmetic above.
6. Set and visibly verify actual **200% browser zoom**. At the agreed desktop and narrow layouts, inspect briefing/stakeholders, prepared choices, a long typed draft, its validation and confirmation dialogs, result, debrief and an expanded source. Required controls and text must remain readable and operable without overlap or required horizontal scrolling. Record the browser's zoom setting and viewport; resizing or device-pixel ratio alone is not zoom evidence. Existing 390×844/desktop captures remain useful, bounded evidence.
7. Verify the remaining **native JavaScript-disabled load** on this candidate: visibly disable execution in a supported browser, reload, inspect enable-JavaScript/fresh-reload/no-save guidance and the keyboard skip/native reload path, then restore execution and verify normal startup. The [player experience contract](player-experience.md#empty-error-clarification-and-loading-states) requires that behavior. The former missing-module defect was reproduced as S2 acceptance-blocking and corrected/retested in the 13:00 record; useful static fallback also remained when bootstrap was deliberately omitted with JavaScript **enabled**. That result and semantic noscript tests do not substitute for this disabled-browser check. Inspect narrow recovery layout as well. Do not repeat unaffected full gameplay solely to rename the prior pass; investigate and retest any new failure concretely.

Retain steps, results and captured states in a durable `docs/evidence` record or Jira attachment, identifying the executor separately from the reviewers. Call a path keyboard-only only if it actually used current-focus keyboard navigation throughout. The existing full keyboard run need not be repeated solely for a new label. Any new defect should include its trigger, expected/actual behavior, severity, owner and retest plan; test only the affected behavior and justified regressions after a correction.

## Remaining owner actions and delivery boundary

| Owner / issue | Next concrete action |
| --- | --- |
| Coordinator + QA / SCRUM-16 | Arrange the independent browser executor and supported zoom/download access. Execute and review the missing clauses above. Current worker inventory is a capability blocker; root's browser cannot be relabelled as independent QA execution. |
| Product + QA + UIUX / SCRUM-16 | Reconcile the resulting evidence against the readiness ledger, including remaining responsive/dialog/error states. Broader screen-reader/device/cross-browser observations remain unverified; do not infer them from one browser path. |
| QA + UIUX / SCRUM-12 and SCRUM-16 | Execute native JavaScript-disabled rendering and narrow recovery checks on the pinned corrected source. Missing-app/dependency/partial-initializer recovery and normal R1/refresh have bounded execution evidence; the reproduced S2 condition is corrected/retested without accepting every startup clause. Development investigates any newly reproduced defect, with targeted retesting. |
| Coordinator + Product + QA / SCRUM-17 | Record all required acceptance results and open defects. Apply the quality plan: no open S0/S1 or acceptance-blocking S2; remaining S3 issues need a linked owner and recorded release decision. Verify CI against the exact proposed publication and retain the run link. |
| Owner + coordinator / SCRUM-17 | Review the concrete candidate and decide the requested merge/integration. Earlier automatic approval review rejected merging without explicit owner authorization; that authorization remains pending. Preparing and reviewing this package can continue. No prior PR is closed, main merged, or release accepted by this document. |
| Owner + coordinator / SCRUM-17 | Decide the delivery destination if public website access is wanted, then authorize that deployment separately. Loopback startup and a public source repository do not publish a playable website. No hosting service or cost has been selected. |

The release date does not waive these gates or extend itself. The original Development handoff and its Product/QA/coordinator reviews are retained in the [12:00-slot checkpoint](evidence/session-2026-10-03-1200.md). The 13:00 Product update pins the corrected source and reconciles only supported clauses, with independent QA/coordinator review recorded in the [startup checkpoint](evidence/session-2026-10-03-1300.md). Authorship of this documentation update is separate from Development's startup implementation and QA's execution; no new full playthrough, release or deployment is implied.
