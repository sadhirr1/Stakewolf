# SCRUM-36 independent QA — asset-based forest benchmark

This review covers the local Three.js renderer, packaged assets, loading/fallback behavior and existing-game integration. It does not accept a finished character encounter or release. The current wolf is a provisional static quadruped: the manifest records 3,024 triangles, a 512-pixel coat texture, no skeleton and no animation. The owner's polished-character requirement remains outstanding.

## Ownership and environment

- Issue: [SCRUM-36](https://sadhirr1.atlassian.net/browse/SCRUM-36).
- Independent reviewer and test author: `hollow_cast`, acting as QA for this increment. This agent authored the earlier procedural cast, which is unchanged and outside the new renderer review. Renderer author: `hollow_scene`; asset preparation/provenance author: `cinema_assets`; integration/build/server/browser owner and independent test reviewer: coordinator.
- QA owns `tests/scrum36-cinema.test.mjs` and this record. The coordinator independently reviewed and approved all six test designs. The coordinator additionally authorized updating the existing SCRUM-32 wild-route CSP expectation to the intentional new policy; base-game server tests remain unchanged.
- Windows, PowerShell, Node.js v24.21.0. Focused checks and final regression ran October 12, 2026, America/Los_Angeles (UTC−07:00). The final run followed the coordinator's explicit runtime freeze and completed at approximately 18:56 PDT. Durations below are runner measurements, not work hours.

## Executed checks

| Check | Actual result | Limits |
| --- | --- | --- |
| Test syntax | `node --check tests/scrum36-cinema.test.mjs`: exit 0 | Checks test source syntax only |
| Packaged inventory and model integrity | Initial 17-file check: **2 passed**, **394.9528 ms**. After the pine increment: **2 passed, 0 failed, 0 skipped**, **294.7112 ms**, using `node --test --test-name-pattern='SCRUM-36 assets:' tests/scrum36-cinema.test.mjs` | Final 22-file inventory and model bytes verified; does not render UVs, materials or lighting |
| Unavailable-GPU fallback | `node --test --test-name-pattern='SCRUM-36 renderer:' tests/scrum36-cinema.test.mjs`: **1 passed, 0 failed, 0 skipped**, **207.7181 ms** | Actual Three.js constructor with an unavailable context; no rendering or successful-GPU resource claims |
| Initial actual HTTP checks | `node --test --test-name-pattern='SCRUM-36 HTTP:' tests/scrum36-cinema.test.mjs`: **3 passed, 0 failed, 0 skipped**, **577.1511 ms** | Initial policy and bundle. The later browser finding required a blob-fetch policy correction, covered by the final regression below |
| Final syntax | Explicit `node --check` on eight changed/new wild, build, asset-preparation and test files: **all exit 0** | Files listed below; package check separately checks the existing application/server modules |
| Frozen-candidate full regression | `npm run check`: **238 passed, 0 failed, 0 skipped**, **3299.095 ms**, **exit 0** | Includes all six new checks on the final 22-file package and corrected wild CSP, plus earlier gameplay/controller/server checks. Precedes the narrow tree-placement correction recorded below |
| Tree-placement correction follow-up | `node --test tests/scrum36-cinema.test.mjs`: **6 passed, 0 failed, 0 skipped**, **698.1686 ms**, **exit 0**. Source and rebuilt bundle syntax both **exit 0** | Rerun after the independently reviewed corridor correction and bundle rebuild. Confirms package serving, inventory and unavailable-GPU behavior; the coordinator checks the actual crossing view |
| Reduced pine index integrity | Additional targeted binary check: both primitives have complete triangles and every index is below its position count | Bark: 486 triangles, maximum index 314 of 315 vertices. Foliage: 24,000 triangles, maximum index 34,331 of 34,332 vertices |
| Browser required-texture failure | Coordinator-reported controlled failure passed; not executed by this QA agent | Final appearance/performance and owner visual acceptance remain separate |

The final asset checks independently enumerate the runtime tree and require exact agreement with `manifest.json`: all **22 files**, totaling **10,767,112 bytes**, match their SHA-256 and byte counts. All 19 unmodified Poly Haven files also match their recorded publisher MD5 values. These local checksum comparisons verify recorded bytes, not the provenance of remote servers independently of their cited source pages.

The three external-buffer glTF models and the embedded GLB have complete containers, local dependencies, existing image data, bounded buffer views and position accessors, and finite position values read from the actual binary buffers. Pine's `../bark/` image references normalize to entries within the packaged asset root; the check rejects resolved escapes, absolute/remote URLs, percent encodings and control characters. Source review confirms the pine's shared trunk/foliage origin is normalized together. The tests do not treat the presence of any wolf model as satisfaction of the intended character-quality requirement.

The final eight syntax checks covered `public/wild/app.js`, `public/wild/cinema.js`, `public/wild/cinema.bundle.js`, `scripts/build-cinema.mjs`, both asset-preparation scripts, `tests/scrum36-cinema.test.mjs`, and the updated `tests/scrum32-wild.test.mjs`. The existing package check additionally ran its five baseline syntax checks. No unrelated repeated full-suite run was performed after the freeze.

## Review findings and scope

| Finding | Current disposition |
| --- | --- |
| Local glTF fetches would be blocked by the old global `connect-src 'none'` policy | Raised with coordinator. Initial real HTTP checks passed the same-origin-only wild policy, while the original-game policy stayed unchanged. This test did not prove all browser fetch schemes were permitted; see the browser finding below. |
| Embedded wolf texture failed despite its GLB loading | Coordinator browser finding: Three.js ImageBitmapLoader fetches the GLB's embedded image through a blob URL, which the initial `connect-src 'self'` blocked. The coordinator added `blob:` only to the wild connection policy; QA updated both relevant test expectations. Renderer author added `LoadingManager.onError` handling because GLTFLoader can return a model despite a texture failure. The controlled browser failure and the final HTTP-policy regression now pass in their recorded scopes. |
| A failing Three.js renderer constructor can attach context listeners before throwing | Renderer captures constructor-added canvas listeners and removes them on failure, restoring the original method in `finally`. Independent fallback test passes: one failure, no readiness, no scheduled frames, no residual canvas listeners, safe controller calls and repeated disposal. |
| Renderer cleanup ownership | Independent source review covers loading-manager cancellation, explicit shadow-target and instance-buffer disposal, tracked geometry/material/texture disposal, closed ImageBitmap deduplication, cleared CPU registries/actors and late-completion guards. Renderer author implemented the cancellation, instance-buffer and registry refinements. This is source review, not a successful-GPU cleanup test. |
| Asset transfer exceeds the earlier proposed 1 MB initial-transfer target | Final assets alone are 10.77 MB, plus a 662,816-byte renderer bundle. Coordinator notified and records the benchmark tradeoff and actual browser measurements separately. These file sizes are not wire-transfer measurements or a performance pass. |
| Character quality remains incomplete | Asset author and coordinator describe the static model as provisional. A suitable polished character, its animation and owner visual acceptance remain outstanding. |
| Crossing view obscured by a foreground procedural trunk | Coordinator found the obstruction while exercising the guided-crossing morning outcome after the full regression. Renderer author added a narrow tree-placement exclusion around every established camera eye-to-target segment. QA independently reviewed endpoint clamping, the trunk-radius allowance and preservation of later seeded placements. The coordinator owns the resulting browser view check; this correction changes placement, not game state or controls. |
| Third-party notices | Asset attribution reviewed. The coordinator added the full Three.js MIT notice to the build banner; QA inspected it in the actual initial generated bundle. |

The independent source check confirmed `public/wild/state.js` still has SHA-256 `369813AC016CEF2A094A84B886646F9CE9008F0B27CAC3394BBABD9E9950C6FC`, matching the previously reviewed SCRUM-34/SCRUM-35 state module. This proves unchanged state bytes at the check, not complete gameplay verification in the new scene.

QA reviewed the renderer's required-asset `Promise.all`, 30-second timeout, first-successful-render readiness, guarded late callbacks, controller validation, hidden-page clock reset, pause/reduced-motion scheduling, responsive framing, existing outcome/morning variants and cleanup ownership. These source checks do not exercise successful GPU loading or reproduce browser pixels. The independent unavailable-context fixture executes the actual Three.js constructor and all returned inert controller methods.

The renderer's two measurement windows reset their interval counters. A sufficiently slow first window can schedule one drawing-resolution reduction, which is applied before the next draw and never increases the current ratio or exceeds the 1.3-million-pixel cap. CSS-space target projection is unchanged. This source review does not establish achieved frame rate, motion quality or broad device performance.

QA also reviewed the README, pinned package versions, bundle build and workflow changes. Installation precedes tests that import Three.js; CI is configured to regenerate the committed bundle and fail on a source/output difference. The full MIT banner is retained, runtime routes remain explicit, and no CDN dependency or source-map route was added. This confirms reviewed configuration, not an executed remote workflow or fresh-checkout setup.

The coordinator reported a browser failure injection on a disposable runtime copy at port 4177: only that copy's embedded wolf PNG signature was damaged. The scene reached `data-scene="unavailable"`, displayed the readable fallback warning, retained Enter-to-council controls, and enabled neither readiness nor scene pins. The coordinator reported the original asset files unchanged; the [failure capture](local-scrum36/texture-failure.png) is retained. This is attributed browser execution, not an execution by this QA agent.

QA independently inspected the retained [desktop Orin encounter](local-scrum36/orin-encounter.png) and [mobile encounter](local-scrum36/mobile-encounter.png). The coat texture is visible, dialogue remains separate and legible, and the shown close/back/motion controls are visible. No overlap blocker is visible in those captured states. The wolf visibly remains a provisional model. Static image inspection does not establish expanded-account scrolling, keyboard focus transitions, motion, physical-phone behavior or owner acceptance; the coordinator owns the corresponding live-browser observations.

## Provenance review

QA independently opened [Poly Haven's asset license statement](https://polyhaven.com/license), the [Fern 02 page](https://polyhaven.com/a/fern_02), the [Rock Moss Set 01 page](https://polyhaven.com/a/rock_moss_set_01), the [Pine Sapling Small page](https://polyhaven.com/a/pine_sapling_small), the correct [Wolf by Sirren page](https://opengameart.org/content/wolf-0), and the [CC BY-SA 3.0 terms](https://creativecommons.org/licenses/by-sa/3.0/) on October 12. Poly Haven identifies its downloadable assets as CC0. The wolf source identifies Sirren/PARPG and CC BY-SA 3.0; the similarly named `/content/wolf` page is a different asset and is not the source for this model.

`public/wild/assets/README.md` and the in-app `credits.html` retain the wolf title, creator, source, license link, conversion/normalization changes and the statement that the adapted GLB remains under CC BY-SA 3.0. The README explicitly distinguishes the asset license from application code and marks the model provisional. Its local model/texture inventory and limitation descriptions match the inspected files. This review does not establish permission for any rejected or unavailable candidate asset.

The pine preparation script was independently read: it selects the recorded source variant, retains its two materials, reduces the foliage with UV/normal attributes, compacts vertices, writes ordinary uncompressed glTF buffers and enforces a 30,000-triangle ceiling. The staged artifact has 24,486 triangles. The offline simplifier is not shipped as a runtime decoder. The derivation and continued CC0 status are recorded in the asset README. Source/script review and valid indices do not prove lossless or visually acceptable simplification.

## Final source identity

Hashes were captured **October 12, 2026 at 18:56:19 PDT**, immediately after the completed frozen-candidate checks. The renderer and bundle rows were refreshed **October 12 at 19:59:08 PDT**, alongside the successful six-test follow-up after the tree-placement correction. The full regression covered renderer `ACED78476BF2B9456A1D9779E13B80CB5A5147FD806B27832B1F959F1144B791` and bundle `7DBAFC57845FCAD5CE30C4613C910402E3B2150A0AA0E1B29A51033259B23C09`; the table records their corrected replacements. Local checkout HEAD at the frozen run remained `a5eda951d9469bed8c89cf93304478555f9d9be6`; these file hashes identify tested working-tree candidates rather than pretending that older HEAD contains the new work. The asset manifest contains individual SHA-256 hashes for every runtime asset.

| File | SHA-256 |
| --- | --- |
| `public/wild/index.html` | `69FBC059E5ABD3B84C6392118CF1B8A174D3CA9DFE8974D16FD46E70A3F53A22` |
| `public/wild/style.css` | `858470A7C564EC1F5B35F4084E36ED83C8D798CBE10C01C4E27692584E59CE95` |
| `public/wild/app.js` | `A2F4F7CA55B36237961FCCD8828464E50AD03BE0511A12D74BE991CFEA927755` |
| `public/wild/state.js` | `369813AC016CEF2A094A84B886646F9CE9008F0B27CAC3394BBABD9E9950C6FC` |
| `public/wild/cinema.js` | `3E11C63445EEF431E14EFC8060B207CB77A9714EA443C7D3B400644E5B4B4C58` |
| `public/wild/cinema.bundle.js` | `72DD85FB595E64B70DEF54781A570AEE58A994730CB5C182BB33B0D63A148226` |
| `public/wild/credits.html` | `CA7CB30FFA946DBC1D5C370307D101F493844F6FD3D4E67E1C3DD84C995C69C0` |
| `public/wild/assets/manifest.json` | `A22D4B9CB290C24468A937407714ED5765DE5EA3924667D1CF505B85A83073FF` |
| `public/wild/assets/README.md` | `8878A0495CE2534E18077D9DD392A5EEC76208ED8A644C8233CFB1117321B282` |
| `server.mjs` | `533A2E77456148131F239AB26BC663124CC4D340FFBBB91F6B5253C6FBD0B955` |
| `package.json` | `E97AC765EDEFF26E78E55BA7B41BC1F3D9C8E77090DF9B95ADCF74D75599355D` |
| `package-lock.json` | `D6143ADBF0699183AD9308544CF8502D6BC7186AA30973D1006764099A86E301` |
| `scripts/build-cinema.mjs` | `C109EAB8D6A8EEF960DD8ACF1A880F70AFADC26BE5057F52266DE052F4D7E53E` |
| `scripts/asset-prep-wolf.mjs` | `E29F7CDF2FA04917ECE8311A3E8FCA194008143DE0F727612DE91478D0B570DB` |
| `scripts/asset-prep-pine.mjs` | `92721A17989ECBEA870CE5847EFD56CE3C614AF066348287F1D6E7F84C3A3F9F` |
| `tests/scrum32-wild.test.mjs` | `69EABE51E42538F2D8A7E4F132502A8248B7EAD4311497CEA9568E890D14BF70` |
| `tests/scrum36-cinema.test.mjs` | `8242BB7D9BB00B4DF21F8B78C08BA99ABA6B22D153359501AD7AA9E8761760C8` |
| `.github/workflows/checks.yml` | `82F7DF4DD8D6BBA9FA9B4ECAF3EAA0573161C790E7871F136B9495A7423648CA` |

## Handoff

Independent source review, the six new targeted test designs, the frozen-candidate 238-test regression and the six-test post-correction follow-up are complete for this technical benchmark; no blocking source or automated-test finding remains in the recorded scope. The polished-character requirement and owner visual acceptance remain outstanding, and the former 1 MB transfer target is not met. No CI execution, deployment, merge, fresh-checkout validation, broad GPU-performance acceptance or release acceptance is claimed. The coordinator owns the live-browser record, performance disposition and GitHub/Jira delivery. Later code or asset changes require checks appropriate to the affected behavior.
