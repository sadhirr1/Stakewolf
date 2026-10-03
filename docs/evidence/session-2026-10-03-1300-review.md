# Startup recovery: Product/UIUX review

Tracked work: [SCRUM-12](https://sadhirr1.atlassian.net/browse/SCRUM-12) and [SCRUM-16](https://sadhirr1.atlassian.net/browse/SCRUM-16), October 3, 2026, 13:00 scheduled slot. Product/UIUX/Visual (`product_plan`) owns this review and later evidence-based updates to the readiness/handoff documents only. Development owns application changes, QA owns independent checks, and the coordinator owns baseline/retest browser execution and publication. QA and the coordinator review this authored record.

Status: Product independently reviewed the startup source, QA test definitions and completed execution record, the coordinator's completed record and all five retained captures. The controlled missing-module recovery defect is corrected and retested; native JavaScript-disabled browser execution remains unverified. QA and the coordinator independently approved this review within those limits. No release acceptance or execution-hour claim is made.

## Required behavior

The [player experience contract](../player-experience.md#empty-error-clarification-and-loading-states) explicitly requires understandable initial-load failure and a visible JavaScript-disabled fallback. The previous candidate had an empty app container and static module entry. Its normal-path successes cannot satisfy this missing recovery behavior.

1. When the module cannot start, the page retains visible plain-language recovery text. Appropriate failure copy is **The game could not load. Reload to start a new attempt.** If a static fallback is also present while modules are still fetching, use conditional wording such as **If this message remains…**, so normal loading is not falsely declared failed.
2. JavaScript-disabled guidance explains enabling JavaScript and reloading. A native link must provide the reload action without relying on an event handler. There is no account recovery or saved attempt; do not claim prior decisions or drafts were preserved, restored or resumed.
3. The static fallback includes a focusable main destination for the existing skip link. Do not expose a usable game Start action before state exists. Recovery content remains readable and operable at the inspected viewport sizes.
4. Successful initialization replaces the fallback once and keeps the ordinary intro, no-save notice, Start/Help behavior and established keyboard focus rules. It must not duplicate main IDs, leave an error alongside a working game, or add an artificial loading delay.
5. Preserve the current CSP and the server's known-assets-only policy. An explicitly allowlisted external bootstrap module may support recovery; do not broaden arbitrary-file or route access. No remote asset, service, provider, backend or persistence system is needed.

## Evidence needed before closure

| Check | Required evidence |
| --- | --- |
| Original failure | Coordinator identifies original candidate and controlled failure condition, then records actual visible result. Source absence alone is not a browser reproduction or assigned severity. |
| Fixed failed-module startup | Same controlled failure on the identified corrected source leaves readable recovery and a working native reload route, with a valid skip destination and no unusable Start. |
| JavaScript unavailable | Inspect static/noscript semantics and independently verify them as far as the available environment supports. Actual JavaScript-disabled browser execution must be distinguished from a missing module, omitted script or source-only check. Do not call a simulation a native no-JS browser pass. |
| Normal loading and keyboard regression | Corrected source reaches a clean intro. Verify skip → main → Start through actual keys, visible focus/normal transition, and restored Help if it was disabled or hidden during startup. Any application-driven focus is distinguished from test-assisted focus. |
| Source and automated regression | Independent QA checks the relevant behavior and exact source identity, then runs justified syntax/gameplay/server regressions. CSP remains unchanged. No test total is invented from separately passing reports. |
| Scope of readiness change | Update only the startup clauses supported by these results. Independent full browser execution, actual 200% zoom and received-download verification remain open unless separately executed and reviewed. |

## Review ledger

| Item | Status |
| --- | --- |
| Development approach | Product independently approved the pre-implementation design: static focusable main with truthful not-started/conditional copy, native fresh-reload link and noscript guidance; Help unavailable until ready; external bootstrap catches import/dependency/evaluation failure and restores the static node after a partial replacement. Transfer focus only if the user was using a removed fallback; ordinary startup gains no unsolicited autofocus. Baseline reproduction precedes edits. This is design approval, not an execution pass. |
| Baseline reproduction | Independently reviewed the coordinator's retained baseline section and capture: original checkout `0c99872c3e3dd0c649c05572e3bce209b32140b3`, isolated fixture omitting app.js, approximately 13:07 PDT. Empty app, no main/recovery, ineffective Help and native skip with no destination violate UX-V10. Product agrees with QA's **S2 acceptance-blocking** classification of this supported recovery case; normal gameplay startup failure is not alleged. |
| Final source review | Reviewed index.html, bootstrap.js, the narrow server/package/workflow changes and unchanged gameplay sources. Static main/native fresh-reload/noscript, hidden Help, awaited module evaluation plus ready-screen validation, restoration after partial initialization, conditional focus transfer and unchanged CSP match the approved design. No blocking source/copy finding. Exact corrected identities are below. |
| QA checks | Independently reviewed all nine startup test definitions and narrow server additions: actual missing/dependent/invalid/throwing modules, async rejection, successful wait/once-only loading and independent recovery controls; static markup/native link/noscript and CSP checks are accurately scoped. Reviewed the [completed QA record](session-2026-10-03-1300-qa.md): five syntax checks and one full 109/109 run at 13:10:02 PDT, 1198.0116 ms, exact identities and bounded coordinator-attributed browser results. No blocking accuracy finding; Product did not run this suite. |
| Browser/capture review | Product opened all five retained images independently. Coordinator supplied failed/transitive/partial/missing-bootstrap and normal-load observations, including native skip/reload and normal Start/Help/refresh checks. Supported states and limits are recorded below. Product did not execute the browser. |
| Candidate/readiness reconciliation | This record identifies the tested working tree by its base and frozen hashes. Readiness/handoff updates are a subsequent documentation action after the source publication checkpoint exists; the old pinned commit must not be represented as containing the new fallback. |
| Independent review of this document | QA independently approved source/capture/protocol accuracy, hashes and execution limits. The coordinator independently approved the same record after the approximate browser interval was corrected to 13:11–13:13. This authored review is frozen for publication. |

No application, test or Git edits are owned by Product in this increment.

## Source identity and independently inspected states

The execution used the reviewed working tree atop `0c99872c3e3dd0c649c05572e3bce209b32140b3`, identified here by frozen hashes rather than incorrectly attributing it to the old base commit. Source/test checkpoint `22de1c4927d70054a1ce4ee7cffbeab4f34099de` now contains the correction. QA separately reconciled committed blobs with these working bytes; the app-only historical line-ending normalization is explicit in its record. Product independently read the changed files and verified SHA-256 values:

| File | SHA-256 |
| --- | --- |
| public/index.html | `3C3D8DB0DB0749ED9D7C5E47A874655C3D569E28E074E86D9F2E45EE4CF303E1` |
| public/bootstrap.js | `BB533070381442051771D0A96C161B411BE959E9A2B9223D82C4DDC69C4E654E` |
| server.mjs | `36E942EE3D5E255CF1BA28CC4FAB08E1F2A0914C5700B417A71D1CAFE4D364AC` |

The app/engine/scenario/style working bytes remain `F18DCEE3…` / `3F444704…` / `40541B99…` / `A5A959D9…`. The previously documented app CRLF/LF distinction remains historical; it does not conceal a gameplay change.

| Retained capture / independently visible observation | Coordinator-executed behavior and limit |
| --- | --- |
| [Original missing-app baseline](images/session-2026-10-03-startup-baseline.jpg): blank body below header, focused skip link, visible Help. | At approximately 13:07, inspection found no main/recovery and native skip had no destination. This is the preserved failure, not a passing state. |
| [Fixed missing-app state](images/session-2026-10-03-startup-fixed.jpg): readable failure/no-save text, visible native fresh-reload link and focused main outline; Help absent. | Around 13:11–13:13 PDT, isolated port 4176 fixture showed one main/no Start. Native Tab → Enter reached main; Tab reached Reload; Enter reloaded with a clean URL fragment. A missing-engine fixture on 4177 showed the same recovery behavior. |
| [Partial initialization](images/session-2026-10-03-startup-partial-init.jpg): restored failure/reload panel, no falsely usable game. | Port 4179 synthetic app replaced main/Start then threw. The original fallback returned with one main/no Start. This deliberately constructed failure is not an ordinary scenario outcome. |
| [Missing-bootstrap state](images/session-2026-10-03-startup-static.jpg): truthful not-started/conditional guidance, no-save notice and native reload link. | Port 4178 omitted bootstrap with JavaScript **enabled**; native skip reached main. This does not execute the browser's JavaScript-disabled/noscript path. |
| [Normal startup](images/session-2026-10-03-startup-normal.jpg): established intro and visible no-save notice, Start and Help, with no recovery panel left alongside them. | Port 4180 normal source had one main, Help visible and no startup autofocus. Current-focus native skip/Start and Help/Escape/return focus worked. R1 launch committed 68/50/36, then refresh returned to clean intro. This is a bounded startup regression, not a repeated full playthrough. |

The inspected desktop captures show readable recovery copy and preserve the dark dossier/lime direction. No new stylesheet or generated asset was needed. They do not establish narrow recovery layout, actual 200% zoom or a native JavaScript-disabled browser pass. Received-file verification and a separate full-browser executor also remain open. The [coordinator record](session-2026-10-03-1300.md) owns execution chronology; Product's role here is independent source, expectation, evidence and presentation review.
