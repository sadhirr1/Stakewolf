# September 30 baseline QA evidence

Work: [SCRUM-10](https://sadhirr1.atlassian.net/browse/SCRUM-10), supporting [SCRUM-11](https://sadhirr1.atlassian.net/browse/SCRUM-11). Author/test executor: QA agent. Independent reviewer: coordinator; engine fixture arithmetic and test design were reviewed against scenario data and delayed-effect rules, and the raw-path server integration tests were separately inspected. No blocking test-design finding remained. Browser execution and QA's independent evidence review are recorded separately below.

## Result and boundary

The imported engine and new local server passed **15 automated tests**, with zero failures, skips, or cancellations. One test exercises all **243 preset decision sequences** for structural completion, bounded values, and distinct recorded choice histories. Three additional complete paths use hand-calculated per-round numeric expectations.

These are regression fixtures for the inspected candidate rules, not the approved release PATH-A/B/C fixtures. The game-design ledger and release narrative remain pending. Passing these checks does not establish accessibility, browser behavior, hidden-information accuracy, meaningful stakeholder memory, or release acceptance.

## Identified build and environment

- Results recorded September 30, 2026 at 06:19 PDT (13:19 UTC), after the local runs below.
- Repository: `C:\Users\sadhi\Project_work\Stakewolf`.
- Branch: `feature/SCRUM-10-reviewed-prototype-baseline`.
- Base commit: `42eb44d3a5e31a681db4c09e9c7bd2afb21a54bd`, plus the working-tree files identified below. This was not a committed or published release at test time.
- Runtime reported by Node: `v24.19.0`, `win32`, `x64`; execution through PowerShell.
- No packages, services, credentials, or external network were required. Server tests used ephemeral ports bound to `127.0.0.1` and closed the servers after execution.

| Tested file | SHA-256 |
| --- | --- |
| `public/engine.js` | `4744ADF9F9958ACF038017661BAD792824F7B0F0F11F0E7D244081FFD9D7F2ED` |
| `public/scenario.js` | `1452E63AEFD23502789CFD0F9137ECD59C89EE22A912594A6EF2DE1133EFCCED` |
| `server.mjs` | `72BE8F78B3BB0AEDC5BBFC780BD9635C4257F05A30428C497552EE4EC5120582` |
| `tests/engine.test.mjs` | `B0A6F644AED2A98C577A6F634D17C050C14114728F733CBDEFA78E3005EBD8AE` |
| `tests/server.test.mjs` | `D9D5ECA9EEE38EE79F5568EFBC657477DBF3F370E92ED1D822C061D1E582CDF1` |

Engine/scenario fingerprints match the read-only candidate recorded in the [prototype assessment](../prototype-assessment.md). Development owns the imported-file provenance. The original `app.js` fingerprint was `756FD4BA0290D6327CEB3163B774D728F4DD2138FE6D6536B19E3333A9AA06CC`; its intentional layout repair has fingerprint `D3A03647EC140BF372CFC4930873EA02AD9B601FB479FE466F0ED3E0D6FB0744`, independently read by QA after the change. Engine tests do not validate rendered layout; the separate review is below.

## Commands actually executed

From the repository root:

```text
node --version
v24.19.0

node --test tests/engine.test.mjs
tests 11; pass 11; fail 0; cancelled 0; skipped 0; todo 0

node --test
tests 15; pass 15; fail 0; cancelled 0; skipped 0; todo 0
```

The second command was the focused engine run. The last command included the newly added server tests. The full runner reported `duration_ms 220.8063`; this is test-run duration, not measured project work hours.

## What the tests establish

| Evidence | Observed result | Release-check relationship |
| --- | --- | --- |
| Phase guards and immutable inputs | Briefing rejects gameplay; results reject duplicate decisions; play rejects premature advance; debrief rejects incomplete runs. Deep-frozen input states remain unchanged across successful transitions. | Partial QA-AC-01/02/09 |
| Conversations and evidence | Questions preserve source/person/round labels, consume one of two slots, reject duplicates and wrong-round questions, and refresh the budget without deleting prior evidence. | Partial QA-AC-05/14; not proof of narrative truth |
| Evidence-controlled pilot | Listening to Ishan's failure evidence changes pilot quality from 59 to 64; history identifies the bonus and the heard evidence. | Candidate-rule regression for QA-AC-06/07 |
| Delayed effect and control | Public launch changes metrics to 68/50/36, then its next-round event to 68/46/34. A second advance is rejected; the following decision does not replay the event. Pilot control follows a different next-round effect. | Partial QA-AC-06/09 |
| Typed proposal and confirmation | Interpreting text mutates no state. The player can override the suggestion; equivalent confirmed typed/preset actions produce equal state effects. Ties, unmatched text, and invalid lengths have explicit handling. | Partial QA-AC-03/04; not broad language validation |
| Complete reference paths | The three paths below match all five expected immediate states and next-round states, reach distinct debrief titles, and retain five decisions with four followups. | Candidate regression coverage for QA-AC-01/06; not narrative acceptance |
| Isolation and replay | Fresh states do not inherit old flags/history/evidence. Alternative branches from one frozen state remain separate and deterministic. | Engine portion of QA-AC-08; not a browser reload test |
| Exhaustive preset combinations | All 243 five-choice combinations complete, retain their exact ordered choices, and keep finite metrics/relationships within 0–100. | Structural regression only; no assertion that all dialogue is accurate |
| Static server integration | All five assets have expected bytes and content types; root serves the page; HEAD has no body; query strings work; private repository routes return 404; POST returns 405; raw malformed/traversal paths return 400. | Baseline serving checks supporting QA-AC-13 |

The hand-calculated paths are defined in [engine tests](../../tests/engine.test.mjs). `delivery/trust/quality` final values are:

| Candidate path | Choices | Conversations | Final values | Observed debrief title |
| --- | --- | --- | --- | --- |
| Informed pilot | pilot → explicit → open → core → evidence | failure; retention-fix; full-thread; market-sample; gate | 54 / 100 / 100 | You earned the next step. |
| Unchecked momentum | launch → quiet → ignore → both → momentum | None | 99 / 2 / 8 | You launched on borrowed time. |
| Cautious consensus | delay → explicit → broker → core → shared | None | 25 / 89 / 100 | Credibility needs a deadline. |

Informed-pilot checks also verify that clamping records the actual applied effects: the fourth delayed quality increase is +4 at the upper bound, and the last immediate trust/quality changes are +4/0. These expectations were calculated from the authored rules before execution, then independently reviewed by the coordinator.

## Independent review and unresolved gaps

QA inspected the developer's local-server implementation, package configuration, and README. The server fixes its asset allowlist independently of requested paths, resolves real paths before serving files, and uses loopback binding for its CLI. Automated integration supports these source-review observations; it does not test every possible security condition. QA also reviewed the product agent's assessment and updated scope: source reuse, session policy, and limitations are separated from feature acceptance. No blocking finding was raised against those product documents.

The coordinator found a rendered-layout defect during browser inspection: a missing closing wrapper in `public/app.js` caused the scene to join the chapter-header flex layout. Development inserted the missing `</div>` at line 55. QA independently inspected the corrected source, fingerprint, and retained [before](images/baseline-layout-before.jpg) / [after](images/baseline-round-after.jpg) screenshots: the scene and decisions are readable in the repaired layout. The coordinator executed the 1280 by 720 browser retest and reported that `.chapter-top` has only two children and document/client widths both equal 1265, with no horizontal overflow. QA reviewed that reported result; QA did not execute those browser interactions. No blocking finding remains against the targeted repair. The passing Node suite had not detected this layout defect.

QA also independently reviewed the coordinator's [browser and session handoff](session-2026-09-30-0600.md), including the debrief and narrow-viewport screenshots. The recorded one-conversation browser path's final 41/100/100 matches the candidate rules and displayed result. The record distinguishes basic keyboard activation and a resized browser from full accessibility or physical-phone testing, preserves the focus-restoration gap, and makes no release claim. No blocking evidence-reporting finding remained.

| Open gap | Follow-up |
| --- | --- |
| A later `full-thread` answer attributes a specific statement to the player regardless of their earlier choice or typed text. Source review identifies this as an S1 narrative defect for release. | [SCRUM-7](https://sadhirr1.atlassian.net/browse/SCRUM-7), [SCRUM-13](https://sadhirr1.atlassian.net/browse/SCRUM-13), [SCRUM-15](https://sadhirr1.atlassian.net/browse/SCRUM-15): correct the attribution and verify counterexample paths. |
| Conditional per-stakeholder memory/rumor boundaries and per-claim debrief evidence are not established by the current authored callbacks. | SCRUM-7/13/15: approved rules, conditional behavior, and traceable claims. |
| Clean restart is the selected session policy, but the no-save warning is only in optional Help. | [SCRUM-8](https://sadhirr1.atlassian.net/browse/SCRUM-8), [SCRUM-12](https://sadhirr1.atlassian.net/browse/SCRUM-12): visible notice before play and browser refresh verification. |
| Negation, incidental keyword matches, representative paraphrases, and real-user comprehension remain broader than the initial typed-input cases. | [SCRUM-14](https://sadhirr1.atlassian.net/browse/SCRUM-14): language fixtures and conservative handling. |
| Keyboard flow, dialogs, zoom, phone layout, browser replay/refresh, a fresh checkout, and remote CI status are not established by these Node runs. | Coordinator browser evidence and later [SCRUM-16](https://sadhirr1.atlassian.net/browse/SCRUM-16) checks; report each separately. |

The result supports the reviewed development baseline. It does not satisfy the release gate while the S1 narrative issue and other required acceptance gaps remain open.
