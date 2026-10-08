# SCRUM-30: independent case-desk QA

Work item: [SCRUM-30](https://sadhirr1.atlassian.net/browse/SCRUM-30). QA author and source reviewer: `agile_quality`; application author: `case_alignment_review`; independent test/evidence reviewers: Product (`product_plan`) and Coordination. This manually initiated October 7, 2026 increment does not establish release acceptance or hours worked.

## Candidate and method

The assigned candidate is `C:\Users\sadhi\Project_work\Stakewolf\.tmp-playable-SCRUM-30`, an extracted PR15 source tree rather than a separate Git checkout. Its enclosing repository HEAD does not identify its complete tested contents. Coordination identifies the base as [PR15](https://github.com/sadhirr1/Stakewolf/pull/15), head `22b248647ee458a78e6f7d77830c2e8c87193b95` (`codex/SCRUM-27-r4-capacity`), copied from `.tmp-pr12-review-20261006`. Coordination verified the baseline app/engine/scenario hashes against that PR. QA owns only this record and `tests/scrum30-case-desk.test.mjs`; QA has made no application, Git, Jira, server or browser changes.

Coordinator-reported baseline SHA-256 values:

| File | Baseline SHA-256 |
| --- | --- |
| `public/app.js` | `BD5C2677A4B109DA202E57C7BDE3875CFFAF783EDBCDC60B094A46366604417D` |
| `public/engine.js` | `6166C284F5A8E160DE6B0F4647243E86AB394483890A352B4C51B88B1A754BA6` |
| `public/scenario.js` | `FA81DCE30C583529E3D22A9C10AD2B9C3A4075299A269091924F6C5ADB2231C5` |

The test expectations come from the authored case rules and existing event contract: R1 creates OB-01, R2 activates it; confirmed R2 creates OB-02 with the customer explanation due at R3 entry; explicit meets that milestone, quiet/exception miss it. R4's one shared bundle uses two reviewers and becomes scheduled/deferred/blocked for core/custom/both. These are planning states, not verified receipts. Old-data cleanup stays pending and not overdue, with policy/scope follow-up Thursday 12:00 in the fictional week.

## Independent coverage

- Briefing/R1 empty recorded work, prospective R1 consequences and all three actual R1 origins.
- R2 preview versus confirmed obligation, exact R3 explanation timing, and misleading private typed wording that cannot override the confirmed action.
- R4 acquired capacity, all three selected consequences, one shared bundle, unchanged conversation budget and no premature event creation.
- Nine R2/R4 combinations at R5 before commitment: actual milestone/bundle state, still-pending cleanup, and only existing R1–R4 citations. R5 framing previews cannot rewrite prior work.
- Acquired R2 Atlas request versus late-addendum-only control, with question and artifact citations when duration is stated.
- Zero-question privacy controls, unsupported/cross-round choice IDs, detached returned objects, completion and fresh-run isolation.
- Three additional debrief contract regressions preserve the coordinator's typed/interview path and independently specified core/custom/both control totals. They require the actual shared-bundle field consumed by the renderer, valid citations, still-unverified cleanup and detached output.
- Every `inspect` call deep-freezes the source, checks complete-state before/after equality, and repeats the getter for deterministic output. The invariant includes metrics, relationships, history, events, knowledge, acquisitions, obligations and conversations rather than a selected projection of those fields.

## Review findings and disposition

1. QA source inspection found that the R5 brief could state the acquired 30-day Atlas request without citing its R2 question and KB-08 acquisition. Development added both sources; the new test passes with the acquired-request case and rejects inference from KB-08-R4 alone.
2. QA source inspection found duplicate `launch-review-title` IDs if the brief appeared in both the summary and carried-work tab. Development now supplies `summary-launch-review-title` and `work-launch-review-title`; QA inspected those call sites. Rendered behavior remains the coordinator's verification responsibility.
3. Product's independent fixture review corrected QA's initial expectation that OB-01 remained open at R2. The reviewed rule is open immediately after R1 confirmation and active on R2 arrival. The fixture was corrected before any test execution; this was not an application defect or an executed failing result.
4. Product identified lost OB-02 subowners and fictional follow-up details after the old cards were moved. Development restored Theo's R3 explanation, Ishan's pending cleanup, Leah's Thursday policy/scope follow-up and the unset cleanup execution deadline. QA's three lifecycle tests assert these details at R2 result, R3 and R4. Cleanup's machine state remains `pending`; its separate label and next action say not overdue.
5. QA caught the previous three-tab arrow/End constants while Development added a fourth tab. The final handler uses four entries and `ids.length` for End, wrapping and left/right navigation. This was a source-review correction before execution, not a claimed reproduced browser failure.
6. After the full automated run, Coordination's browser check found that prepared R1 selection updated the lower preview while the top decision-impact desk stayed empty. Development repaired that binding. QA then noted the R4 capacity branch still displaced the top selected preview; Development made the capacity and selected preview additive. QA inspected both narrow renderer changes and checked final app syntax; Coordination retested R1 and R4 in the browser. This particular repair changed only the renderer.
7. Coordination's subsequent five-round browser path failed when opening the debrief. QA reproduced its model path: `pilot`; typed `explicit` with “Ask teams to opt in and give them a deletion path.”; R3 Mara `screenshot-source` and Ishan `full-thread`, then `open`; `core`; `evidence`. It completed at `41/100/100`; `getDebrief` succeeded and every returned source ID resolved. Source inspection isolated the renderer's `item.validationBundle.status` access to a field absent from the debrief model. Three new independent tests failed on that exact undefined field for core/custom/both, after their expected numeric totals had passed. Development then projected the actual validated checkpoint's `sharedReviewBundle` as a detached `validationBundle` and included its recorded event as a citation. There is no guessed default or weakened trace validation. The three regressions and full suite now pass. Coordination also reran the exact path through the debrief and replay successfully, as separately attributed below.

The engine difference against the provided PR15 copy consists of the added read-model helpers and the final narrow debrief projection/citation repair, leaving existing transition functions unchanged. The new desk, source, milestone and impact strings pass through `esc` in the renderer. Source expansion resolves explicit allowed event IDs rather than recursively revealing private parents. Prepared selection restores focus to its selected button; four tabs retain roving `tabindex`, `aria-selected`, panel labelling and Arrow/Home/End support. Typed confirmation shows a prospective impact in each native radio label, so overriding a suggestion keeps the alternative's effect visible without rewriting the radio group. These are inspected implementation properties; they are not a substitute for browser behavior checks.

## Execution

QA executed the following in the assigned candidate on October 7, 2026, using Node.js `v24.21.0`, Windows `win32/x64`. Dates below are actual command-start observations in PDT, not the slot name or measured work hours.

| Start | Command | Observed result |
| --- | --- | --- |
| `18:57:49.349-07:00` | `node --test tests/scrum30-case-desk.test.mjs` | 21 tests passed; 0 failed, skipped, cancelled or todo; runner duration `1562.2396 ms`; exit 0. |
| `18:57:57.535-07:00` | `npm run check` | Five syntax checks and all 178 tests passed; 0 failed, skipped, cancelled or todo; full test-runner duration `3072.5414 ms`; exit 0. |
| `18:59:13.438-07:00` | `node --check public/app.js` | Passed after the first top-summary repair; intermediate app hash `CF2DC214B3331D004218301261F02E36B2166C50A5457934CAA8888295D6BC5B`. |
| `18:59:46.873-07:00` | `node --check public/app.js` | Passed after the final additive R4 summary repair; final app hash `BBCBE8A72DE531E354B0C6B4779D6702D284C98701EF9386F0C4145718C1A735`. |
| `19:02:49.002-07:00` | `node --test --test-name-pattern="debrief shared-bundle contract" tests/scrum30-case-desk.test.mjs` | Pre-fix regression: all 3 selected tests failed with actual `undefined` versus the recorded `validationBundle` object; duration `271.3886 ms`; exit 1. This was engine hash `BD4D2925…`. |
| Batch beginning `19:03:35.087-07:00` | `node --test tests/scrum30-case-desk.test.mjs` | Final repaired source: all 24 tests passed; 0 failed/skipped/cancelled/todo; duration `1362.2443 ms`; exit 0. |
| Same batch, after the focused pass | `npm run check` | Final repaired source: five syntax checks and all 181 tests passed; 0 failed/skipped/cancelled/todo; test-runner duration `3566.2173 ms`; exit 0. The full-run start was not separately clocked. |

The five syntax checks target `server.mjs`, `public/bootstrap.js`, `public/app.js`, `public/engine.js` and `public/scenario.js`. The final full suite includes 24 new tests plus the existing numerical, event/privacy, dossier, OB-02, R3/R4, typed-input, debrief, server and startup checks. The existing 243-path test is structural coverage, not exhaustive narrative or UI acceptance. Findings 1–5 were addressed before the initial runs; findings 6–7 and their follow-up executions are recorded separately. The model tests do not import `app.js`; their debrief assertion establishes the renderer-consumed data contract, not browser rendering. Development's own execution is separate from QA's recorded results.

Read-only whitespace checks against the supplied baseline `public/` and the new test produced no whitespace-error diagnostics. Git reported its normal line-ending warning for the baseline app; no files were rewritten by QA. The extracted-tree no-index diff identifies content differences rather than a clean Git worktree.

### Initial full-suite execution-source SHA-256 (178 tests)

| File | SHA-256 |
| --- | --- |
| `public/app.js` | `D8B4B44F2013AF427AB5D1D021652DE95DA486B8A05677D43ADF4B6D4468DB20` |
| `public/engine.js` | `BD4D29257C115A7C50F867B4EDE37CFD2E48C7DE1438C4125B5E8720A78978A4` |
| `public/style.css` | `B6116B80147BFB53533E07825760458FE3489C5ED7E548CC69F2902903DC4388` |
| `public/scenario.js` | `FA81DCE30C583529E3D22A9C10AD2B9C3A4075299A269091924F6C5ADB2231C5` |
| `public/index.html` | `3C3D8DB0DB0749ED9D7C5E47A874655C3D569E28E074E86D9F2E45EE4CF303E1` |
| `public/bootstrap.js` | `BB533070381442051771D0A96C161B411BE959E9A2B9223D82C4DDC69C4E654E` |
| `server.mjs` | `36E942EE3D5E255CF1BA28CC4FAB08E1F2A0914C5700B417A71D1CAFE4D364AC` |
| `package.json` | `0322607FABCF7E2109F5521E3D7FBB7819C55DF7065A65C02AB3C54B529718F3` |
| `tests/scrum30-case-desk.test.mjs` | `EB6FF25571EDF2D0C5D101C339B8AA9FAC95AF123207893002383D6FE365119F` |

### Final repaired full-suite SHA-256 (181 tests)

| Changed file since initial run | Final SHA-256 |
| --- | --- |
| `public/app.js` | `BBCBE8A72DE531E354B0C6B4779D6702D284C98701EF9386F0C4145718C1A735` |
| `public/engine.js` | `A9F8DEAD93661A5FCFFF14ED9FBE2982A5653DB364C4AAD182FC2AD02FDC3030` |
| `tests/scrum30-case-desk.test.mjs` | `FC2F7E3EA3FE206688B57CF5814F6D87A6FCB5AA2491576EA89A4341CB56E355` |

All other files in the initial table retain those hashes. Product independently reviewed the initial 21 definitions and three final debrief regressions, including literal core/custom/both metrics `41/100/100`, `62/100/69`, and `44/97/71`, with no remaining blocking test-design finding. Product also approved the repaired source and completed 24/181 execution, browser and integration evidence, without claiming its own test or browser execution. QA's test/evidence files are frozen for coordinator handoff.

## Coordinator browser evidence and independent capture review

Coordination, not this QA agent, executed browser checks against the candidate served on local port 4175 on October 7. The exact browser build and a separately clocked browser interval were not supplied to this record. Runtime assertions below are the coordinator's observations, independently checked for consistency with the source, model and retained captures; they are not separate browser execution by QA.

| Area | Coordinator-observed result |
| --- | --- |
| Selection and tabs | Repaired top R1 preview reflected selection. End reached Decision record; ArrowRight wrapped to Your decision with `aria-selected=true`. Typed R2 radio override was checked and explicit was confirmed. These bounded actions do not establish a complete keyboard-only journey. |
| Carried work | R3 showed the actual met explanation milestone, subowners and fictional follow-up. R4's selected `both` consequence appeared alongside capacity. R5 explicit/core showed scheduled work, pending cleanup and a brief labelled not a receipt. |
| Width and identifiers | At 390×844 and 780×844, DOM checks reported no horizontal overflow. R4/R5 carried-work views had zero duplicate IDs. Resize is not actual 200% zoom, a physical phone or all-layout acceptance. |
| Initial debrief failure | The exact path described in finding 7 reached a display error and remained on the prior result. A repeated open attempt said to complete the current decision first. Empty console logs did not mean success: the action handler caught the failure. |
| Final repaired debrief and replay | On final app `BBCBE8A…` and engine `A9F8DEAD…`, the same full path reached “You earned the next step.” with `41/100/100`. The coordinator verified the rendered “Carried work and R5 checkpoint” section, zero duplicate IDs and no page error, then selected Play another attempt and observed the fresh intro. |

QA independently opened all four local captures: `scrum30-carried-work.png`, `scrum30-decision-desk.png`, `scrum30-debrief-failure.png`, and `scrum30-debrief-fixed.png`. The carried-work capture shows owner/origin/action fields, scoped scheduled work, met explanation and pending/not-overdue cleanup. The decision capture shows the R5 brief beside the decision workspace. The failure capture shows the prior result with retry feedback; the fixed capture shows the completed heading, matching rubric, 41/100/100 signals and replay/download controls. No blocking visual inconsistency was found in these captured states. Exact focus, radio changes, overflow, duplicate-ID counts and replay are runtime observations from Coordination, not facts proved by still images. Product separately inspected the carried-work, decision-desk and fixed-debrief captures with no blocking content/presentation finding, without claiming browser or replay execution.

The screenshots remain local review aids; this text supplies sanitized evidence for publication. This record claims bounded verification of the desk and resolved debrief blocker. It does not claim full keyboard, actual zoom, screen-reader, native no-JavaScript, received-download, physical-phone or complete release acceptance.

## Separate coordinator integration check

After the candidate checks, Coordination reports comparing the recorded root-before public/test hashes, backing up the existing root public/test files, and copying the six candidate public assets, candidate tests and handoff into the owner's usual root checkout. Coordination verified all six copied public hashes matched the candidate. QA did not perform this integration or independently verify its backup operations.

Coordination then executed `npm run check` in the usual root checkout: all five syntax checks and 181 tests passed; zero failed, skipped, cancelled or todo; test-runner duration `2948.0271 ms`, exit 0. This is a separate coordinator-executed check, not another QA run or a fresh-clone test. Coordination also reports restoring the browser viewport. The integration check does not close the release limits listed above.

Finally, Coordination found no existing server on the usual port 4173, started the root application there, verified the intro and current “Decision impact desk” heading, then reloaded to the fresh intro. This is a coordinator-executed root-entry smoke check, not another complete playthrough.
