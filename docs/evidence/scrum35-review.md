# SCRUM-35 independent QA — cinematic clearing and encounters

This record covers the bounded `/wild/` visual increment: authored character geometry, clearing and encounter cameras, lighting and restrained motion, readable dialogue, and the explicit module route. Gameplay rules remain outside this increment. This is not full release acceptance.

**October 12 owner decision: visual target not accepted.** The owner rejected the current procedural graphics as the intended visual direction and prioritized looks and feel before further story expansion. Preserve this increment as a technically checked prototype and reusable state/history foundation. Passing checks and earlier coordinator browser observations do not override that decision or establish finished visual quality.

The owner selected desktop-first presentation with simpler mobile support, and eventual evolution from both player input and outside information. The proposed next step is one forest arrival and character benchmark using authored assets before a wider build. These are direction decisions, not implemented or verified capabilities; asset sourcing/licensing, visual acceptance, input interpretation, external sources, operating costs and persistence still need concrete scope.

## Ownership and environment

- Tracker: [SCRUM-35](https://sadhirr1.atlassian.net/browse/SCRUM-35).
- Independent source reviewer and test author: QA agent `hollow_qa`. Character geometry author: `hollow_cast`. Renderer author: `hollow_scene`. App, markup, styling, route integration and browser verification: coordinator.
- QA owns `tests/scrum35-cinematic.test.mjs` and this record. The coordinator independently reviewed all ten test definitions and accepted their design. Earlier tests were preserved.
- Windows, PowerShell, Node.js v24.21.0. Focused checks ran October 11, 2026; final syntax and regression ran October 12 at approximately 17:57 PDT, after the coordinator's global freeze. All dates use America/Los_Angeles (UTC−07:00). Runner durations are execution measurements, not work hours.
- Local checkout HEAD during review: `a5eda951d9469bed8c89cf93304478555f9d9be6`. The coordinator identified preceding delivery PR 20 at `be9f216`; the shared working-tree candidate includes preceding increments. Final file hashes identify the tested source independently of that older checkout HEAD.

## Executed checks

| Check | Actual result | Scope |
| --- | --- | --- |
| Geometry contract | `node --test --test-name-pattern='SCRUM-35 cast:' tests/scrum35-cinematic.test.mjs`: **4 passed, 0 failed, 0 skipped**, 462.8237 ms | Determinism; fresh caller-owned arrays; finite complete triangles; unit normals; outward winding; RGB/tag bounds; integration envelope and aggregate vertex budget; invalid input rejection |
| Test syntax | `node --check tests/scrum35-cinematic.test.mjs`: **exit 0** | Ten test definitions and fixture syntax |
| Controller and module route | Focused controller/HTTP selection: **6 passed, 0 failed, 0 skipped**, 1273.5038 ms | Reduced-motion and normal camera paths; pause/hidden scheduling; cleanup/fallback; actual HTTP bytes, metadata, HEAD, route/method/traversal guards |
| Final wild syntax | Explicit `node --check` on `public/wild/app.js`, `state.js`, `scene.js` and `cast.js`: **all exited 0** | Run after global freeze; package check does not include these wild modules |
| Final full regression | `npm run check`: **232 passed, 0 failed, 0 skipped**, 3706.944 ms; **exit 0** | Executed once after global freeze; includes all ten new tests and the previous 222 checks |
| Browser experience | Coordinator-owned; not executed by this QA agent | Appearance, shader compilation, keyboard interaction, layout and actual GPU behavior require separate browser evidence |

The controller fixture observes public projected points and allocated resources through a controlled WebGL/RAF context. It does not compile GLSL or produce pixels. Its normal-motion fixture advances 250 ms frames through the clearing and each of three encounter entries/exits, requiring camera settlement within four seconds, finite coordinates, and hidden world targets during transitions. Paused and reduced-motion changes schedule no animation. Hidden-page updates draw no frame. Encounter changes reuse uploaded geometry. Disposal releases all allocated handles and listeners; later controller calls cannot restart work. Deliberate shader initialization failure retains inert controls and releases partial allocations.

The focused controller/HTTP command was `node --test --test-name-pattern='SCRUM-35 (controller|HTTP):' tests/scrum35-cinematic.test.mjs`.

HTTP checks start the real static server on a temporary loopback port. They compare the served module with its file bytes, check JavaScript MIME and security metadata, confirm empty HEAD bodies with correct lengths, and reject neighboring paths, traversal and write methods. These are local server checks, not deployment or CI evidence.

The full regression and syntax commands completed and their outputs were returned before the interruption. Those results were recovered from the completed tool output; no tests were rerun during the owner-direction handoff. The current source hashes below match those captured immediately after execution.

## Independent source review

QA inspected cast construction and validation; triangle winding and normal generation; deterministic palettes and geometry; local-to-world positions and normals; character animation tags and pose uniforms; bounded head attention; safe camera orbit and exact settlement; zoom/lens framing and projected markers; shared scheduling and disposal; late scene initialization; unavailable-rendering behavior; native expandable accounts; modal focus return; in-dialog motion controls; and the explicit `cast.js` route.

| Review item | Resolution and evidence |
| --- | --- |
| Height-based head motion could deform Sera's tall staff | QA raised the source risk with the renderer author and coordinator. The renderer now transforms world positions back into local horizontal coordinates and excludes Sera's outer staff/holding region from head turn, sway and breath. QA reviewed the correction. Its visible appearance remains a browser check, not a result from the fixture. |
| Modal encounter makes the header motion control inert | The coordinator added an encounter motion control, synchronized with the header and disabled when the system reduced-motion preference applies. Source review confirms the same scene scheduling controls are used. |
| More compact dialogue must retain account details | Original detail and caution text remain in a native `details` element with a keyboard-focusable summary. The journal and state rules are unchanged. Rendered expanded-account scrolling and keyboard behavior remain coordinator-owned. |
| Import or renderer failure must preserve readable play | The existing import rejection and renderer failure paths show the reading panel, disable scene pins and retain controls. The new unavailable-scene style centers the dialogue. The new cast route is explicitly allowlisted and is covered by real HTTP checks. |
| Final clearing and lighting refinements | QA reviewed the preuploaded ground, lamps and camp props; bounded light-distance terms; guarded side-fill normalization; shared resource cleanup; and modal-only background scroll lock. This establishes source review, not visual acceptance or measured rendering performance. |

No blocking source or automated-test finding remains in the recorded prototype. The owner's visual rejection remains unresolved by those technical results. `public/wild/state.js` retains SHA-256 `369813AC016CEF2A094A84B886646F9CE9008F0B27CAC3394BBABD9E9950C6FC`, matching the SCRUM-34 reviewed state module.

The coordinator reported desktop Orin/Sera encounters with expandable details, pause/resume and Escape focus return; an expanded Sera account at 900×800 with dialogue scrolling clear of the face; and Vela at 390×844 with reachable expanded-account actions, functional pause/resume and document width exactly 390. These are attributed coordinator observations, not checks executed by this QA agent, and do not establish owner acceptance. No actual OS reduced-motion, frame-rate measurement or full browser acceptance is claimed.

## Final source identity and handoff

SHA-256 hashes were captured October 12, 2026 at **17:58:01 PDT**, after the completed regression, and read again from current files at **18:03:39 PDT**. All eight hashes match; no runtime or test changes occurred between those captures.

| File | SHA-256 |
| --- | --- |
| `public/wild/index.html` | `69FBC059E5ABD3B84C6392118CF1B8A174D3CA9DFE8974D16FD46E70A3F53A22` |
| `public/wild/style.css` | `AC308EE0D7B9A6A81160FA868D2FFD880891A463FE29AE799E76A1EFD57D0C5C` |
| `public/wild/app.js` | `76F5EA2D681FA41EA2E15F91B10D99B2CD62769983962CC64B034CBF470C9C58` |
| `public/wild/state.js` | `369813AC016CEF2A094A84B886646F9CE9008F0B27CAC3394BBABD9E9950C6FC` |
| `public/wild/scene.js` | `E31561C92B09B4A5B51109AA436797636C84F84BA055A2F6AB97DFE65DABB8BE` |
| `public/wild/cast.js` | `DE9C83395D28D483FEC0BFEA2FB38D68ADC6ED3F86A318CD910F232535BFF728` |
| `server.mjs` | `F72A63143AAB7926C549137A6CBCA16C043EB291E39B8D084B45995DE40A7352` |
| `tests/scrum35-cinematic.test.mjs` | `50AAE71E2E4A4826BC430DAE8F133458D33ABA2D1A15C57FA749C28C48D76134` |

Independent implementation review and the coordinator's independent test review are retained for this prototype. The coordinator owns the rendered verification record, updated direction, and GitHub/Jira delivery. The current graphics must not be described as an accepted visual benchmark or finished product. No CI execution, merge, deployment, fresh-checkout verification or full release acceptance is claimed here. The controlled tests do not establish visual quality, physical-phone behavior, screen-reader use, actual OS reduced-motion behavior, broad browser compatibility or GPU performance.
