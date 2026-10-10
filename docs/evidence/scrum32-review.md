# SCRUM-32 independent QA review — The Hollow

This record covers the bounded forest visual and interaction prototype at `/wild/`. It does not establish completion of the five-round release scope or authorize release.

## Ownership and environment

- Tracker: [SCRUM-32](https://sadhirr1.atlassian.net/browse/SCRUM-32).
- Execution/reviewer: independent QA agent `forest_qa`; state/app/server author: coordinator; scene author: `forest_scene`.
- QA owns `tests/scrum32-wild.test.mjs` and this evidence record. The coordinator independently reviewed all thirteen tests, including the later fallback addition, with no blocking findings.
- Environment: Windows, Node.js v24.21.0, PowerShell, local loopback HTTP server created on an ephemeral port per HTTP test.
- Source basis: working tree based on `a5eda951d9469bed8c89cf93304478555f9d9be6`. Implementation is uncommitted at this review point; the integration commit/PR must identify the delivered source. Existing unrelated working-tree changes were preserved.
- Execution date: October 10, 2026, America/Los_Angeles (UTC−07:00). Reported milliseconds below are actual test-run output, not working hours.

## Executed checks

| Check | Method and result | Practical coverage |
| --- | --- | --- |
| State rules | Initial `node --test --test-name-pattern='SCRUM-32 state' tests/scrum32-wild.test.mjs`: 8 passed, 0 failed; 139.2597 ms | Entry gating; council-only unique accounts; crossing-only observation; repair prerequisite; hold without observation and truthful uncertainty; single commitment; replay isolation; ordinary invalid values |
| Expanded invalid-input regression | `node --test --test-name-pattern='unsupported actions' tests/scrum32-wild.test.mjs`: **1 failed**, 0 passed; 106.1312 ms before fix | `['orin']` was accepted as an account ID through property-key coercion and stored as an array inside `heard` |
| Focused fixed candidate | `node --test tests/scrum32-wild.test.mjs`: **13 passed, 0 failed, 0 skipped**; 232.9209 ms | The eight state checks with array/boxed-string/null-prototype invalid inputs; one unavailable-WebGL fallback check; four raw HTTP checks |
| Final syntax | `node --check` on `public/wild/app.js`, `state.js`, and `scene.js`: exited successfully after final scene freeze | Syntax only; executed October 10 at approximately 14:07 PDT |
| Full regression | `npm run check`: **197 passed, 0 failed, 0 skipped**, 2031.7972 ms; exit code 0 | Existing simulation, startup/server, cover, and all thirteen new forest checks; executed after final scene freeze on October 10 at approximately 14:07 PDT |
| Final CSS follow-up | `node --test tests/scrum32-wild.test.mjs`: **13 passed, 0 failed, 0 skipped**, 192.1412 ms; exit code 0 | Rerun after the description-selector correction on October 10 at 14:09 PDT; no JavaScript changed after the full regression run |
| Browser interaction and layout | Not executed by this QA agent; coordinator owns the browser | Desktop/mobile appearance, actual shader rendering, keyboard flow, modal focus, sound, pause, zoom and navigation restoration need separately attributed browser evidence |

The HTTP checks request all six allowlisted URLs (`/wild/`, `/wild/index.html`, `/wild/style.css`, `/wild/app.js`, `/wild/state.js`, `/wild/scene.js`) and compare response bytes to disk. GET and HEAD verify MIME, length, and bodyless HEAD. They also check query-string delivery, no-store/nosniff, script/connect restrictions, denied non-read methods, and raw/encoded traversal rejection. An isolated temporary root contains real unlisted files to prove the allowlist blocks existing assets rather than merely missing files.

The state checks use frozen input snapshots to catch in-place mutation. They establish that accounts cannot substitute for observed evidence, a repair begins work without claiming completion or identifying a culprit, a hold preserves uncertainty when the crossing was not inspected, repeated commitments have no effect, and a fresh run cannot contaminate a retained prior run. These are bounded prototype checks relevant to QA-AC-02/07/08/09/10; they are not evidence for the full release criteria.

The fallback check supplies a canvas with unavailable or denied WebGL. It verifies one failure notification, no false ready callback, and safe scene-controller methods. It does not compile shaders, render pixels, or exercise a real GPU.

## Findings and retest status

| Finding | Impact and evidence | Resolution and verification |
| --- | --- | --- |
| Noncanonical account IDs | Input robustness defect: `act(state, 'hear', ['orin'])` added `[['orin']]`; distinct arrays could bypass account uniqueness. Null-prototype objects could throw during property-key conversion. No ordinary UI input supplied these values. | Coordinator added a string type guard before `Object.hasOwn`. Expanded regression now passes for arrays, boxed strings and null-prototype objects. |
| Field guide hidden on mobile | Source review found `display:none` for the only field-guide button at widths <=760px, removing access to its instructions. | Coordinator restored the visible button and subsequently increased its target to 44 pixels. Source fix inspected; actual mobile operability belongs to browser evidence. |
| Back-forward cache disposal | Source review found unconditional `pagehide` scene disposal/audio closure with no restoration, risking frozen visuals and closed audio on history return. | Coordinator now pauses/suspends persisted pages, restores preferences on persisted `pageshow`, and disposes only nonpersisted exits. Source fix inspected; actual history restoration remains a browser check. |
| Enabled WebGL vertex arrays carried between programs | Source review found no attribute reset between programs using different buffers and attribute counts. A leftover particle array could be too short for the next opaque draw. | Scene author added `bindProgram`, disabling every tracked enabled attribute before each pass. Independent QA inspected all sky/opaque/particle call sites. Real rendering remains a browser check. |
| Shared shader precision mismatch | Coordinator reported a rendering failure. Independent QA identified inconsistent default precision for the shared `uTime` uniform, and scene author made shared uniform/varying precision explicit. | Source fix inspected. Coordinator subsequently reported a ready renderer at 1280×800 with no new warning; this is attributed browser evidence, not an independently executed QA browser pass. |
| Delayed scene initialization loses outcome | Source review found that a late scene import applied current location but not an already committed decision, which could omit the selected world markers. | Coordinator added `setOutcome(state.decision)` at initialization. Source fix inspected and syntax check passed; slow-import browser reproduction was not performed. |
| Reading-panel button invalidates description selector | The added button became the last child of `.place`, so the earlier `.place>p:last-child` selector no longer styled the description. Minor appearance defect, reported to the coordinator. | Coordinator replaced both affected selectors with `#place-description`. Independent QA verified both selectors and the final focused 13-test pass. Actual appearance remains covered by the coordinator's browser review. |

The final source review also inspected separate repair/hold geometry and safe null reset in the scene, the reading-panel toggle's `aria-controls`/`aria-expanded` relationship, and replay restoring the reading panel. These observations do not substitute for browser rendering or assistive-technology testing.

## Reviewed source identity

SHA-256 hashes captured October 10, 2026 at 14:09:32 PDT after the final CSS correction identify the reviewed working-tree build. App, state, scene, index, server and test hashes were unchanged from the full regression run; only the recorded CSS selector correction followed that run.

| File | SHA-256 |
| --- | --- |
| `public/wild/index.html` | `483D10670B14A48FD63FAA125C58807382B762C8B0E8C09FF0AE3260DA8CA581` |
| `public/wild/style.css` | `C482783D8F759FA16CFE7A52D9B651A42EFF3C859521F8B048A5849CC7DC43E2` |
| `public/wild/app.js` | `83A1EC41C8D88A3A96F0E9DA734CDB9C7B176F0A7B3DCAFF4A8348A55008E05D` |
| `public/wild/state.js` | `BEABB6A73709F2011A31C95D2E3EE567640576EE66CD7C8DE3D0924F47535F10` |
| `public/wild/scene.js` | `5044F79CEAA0014FA26ABF996369A64138F872BCF1264F7FE345DC5D10056404` |
| `server.mjs` | `5AD493760D7DC26E86E80DFCCB5D4A3EAC2CBFD375DC519DAC0CB509E8B5EA37` |
| `tests/scrum32-wild.test.mjs` | `D0CA6A7C2748F3AC586A8F0F54BEE324EB4338DDFC01751FA31CD076D7137909` |

## Handoff

The independent source/state/HTTP review is accepted for this bounded prototype increment with no remaining confirmed finding in the reviewed source. Full regression and independent test-design review are complete. The coordinator owns the separate final browser record, `docs/evidence/scrum32-forest.md`, and GitHub/Jira integration. The scene is an authored visual prototype with one commitment and immediate consequences; wider simulation depth and release acceptance remain outside this increment.
