# SCRUM-36 continuation — independent encounter review

This record covers the camera, lighting and dialogue continuation after PR22's forest benchmark. It does not replace the earlier [238-test review and six-test placement follow-up](scrum36-review.md); a separate 238-test run on this frozen continuation is recorded below. The provisional static wolf and gameplay/controller files remain unchanged. No rigged candidate was integrated.

Independent reviewer: `hollow_cast`. Renderer author: `hollow_scene`; asset preparation: `cinema_assets`; integration, UI, browser execution and independent test review: coordinator. These are agent roles, not separate employee identities. The reviewer owns this record and any focused encounter tests; the coordinator owns publication and live-browser evidence.

## Source review

The first continuation adds a closer desktop portrait, a focus-dependent rectangular area light and a transparent desktop dialogue panel backed by a dark gradient. Narrow layouts retain a substantially opaque bottom panel, and unavailable-renderer encounters retain a solid reading surface. Required character quality remains subject to actual appearance and motion review.

| Finding | Disposition |
| --- | --- |
| New light tables were disposed after the renderer, too late for explicit texture deallocation | Blocking finding sent directly to the author. Installed Three.js 0.186.1 `WebGLRenderer.dispose()` clears `WebGLProperties`; `WebGLTextures.deallocateTexture()` subsequently returns when `__webglInit` is absent. Deferring shared-table disposal until the final scene also left earlier renderer copies beyond explicit teardown. Author changed cleanup to dispose the four shared DataTextures before each renderer teardown. Independent source re-review passed at renderer SHA-256 `D179BA86774498C384DA8DBFE441B9B2014F64ABFE5F258627F7CF3872FA4672`. This is source evidence, not a measured GPU-memory test. |
| Shared light table reuse | Scene leases now govern initialization, while each teardown dispatches table disposal before losing renderer properties. Installed Three.js retains DataTexture image data and reuploads a disposed texture when another live renderer next uses it. Cleanup's existing idempotence guard prevents duplicate lease release. |
| Pause, reduced motion and resizing | Source review confirms that focusing while paused/reduced and resizing snap to the current target before rendering. Light intensity and placement update in that same render. The area light adds no shadow pass. Hidden-page scheduling and disposal guards remain in place. No successful-GPU interaction result is inferred from source inspection. |
| Reading surface | CSS retains narrow/failure surfaces, scrollable dialog bounds, visible-focus styling and reduced-motion overrides. Desktop text is placed over a strong right-side backdrop gradient. QA independently inspected the retained desktop image below; scrolling and live interaction remain the coordinator's browser scope. |

## Frozen continuation checks

The coordinator froze renderer `D179BA86…`, the rebuilt bundle and current CSS before this run. On **October 12, 2026**, Windows/PowerShell with **Node.js v24.21.0**:

| Executed check | Actual result | Limit |
| --- | --- | --- |
| `npm run check` | **238 passed, 0 failed, 0 skipped, 0 cancelled; 2161.063 ms; exit 0** | Includes package baseline syntax and the existing six cinema package/fallback checks. Does not measure GPU resource release or picture quality |
| Explicit renderer and generated-bundle syntax | `node --check public/wild/cinema.js` and `node --check public/wild/cinema.bundle.js`: **both exit 0** | Syntax only |
| Desktop static-image review | QA inspected [Orin](local-scrum36-encounter/orin-desktop.png) and [Vela](local-scrum36-encounter/vela-desktop.png) desktop encounters | Face and dialogue are separated; text and close, full-account, back and motion controls are visible. No overlap blocker in the shown paused states. The visible low-resolution quadruped remains provisional |
| Narrow static-image review | QA inspected the retained [Vela mobile encounter](local-scrum36-encounter/vela-mobile.png), captured at **390 × 844** CSS pixels | Face remains above the bottom reading panel. Name, quotation, close, full-account, back and motion controls are legible and visible within the image. No overlap blocker in this paused state. Static inspection does not execute scrolling or establish physical-phone behavior |

Only one full regression was run for this continuation, after the runtime freeze. No speculative rig or CSS-mirroring tests were added. The source review establishes the intended LTC disposal ordering against installed Three.js internals; this record does not claim a successful-GPU memory measurement. The coordinator separately owns live pause, expanded-account, Escape, other-portrait and narrow-screen verification. The coordinator reported that narrow full-account expansion produces a scrollable reading panel; that interaction was not executed by this QA agent. The narrow image review followed the frozen run without a code change or repeated suite.

The generated bundle is **912,621 bytes**, an increase of **249,805 bytes** from the earlier 662,816-byte bundle. The area-light lookup tables account for most of this build cost. Assets remain the same **22 files / 10,767,112 bytes**. No new performance sample or broad-device acceptance is inferred from the prior scene's measurements, and the proposed 1 MB initial-transfer target remains unmet.

## Candidate provenance

QA independently opened the creator's [official Fantasy Creatures page](https://algumacoisaqq.itch.io/fantasy-creatures-wolf-giant-rat-spider-wasp-centipede) and its linked [Beasts source repository](https://github.com/danielgruginski/Beasts). Both identify CC0 licensing. The creator explicitly discloses code-generated geometry, texture painting, rigs and keyed motion under human direction/review. The page describes generic rigs, game-resolution assets intended for a top-down camera and code-keyed clips. These disclosures must remain accurate in handoff; the candidate is not evidence of hand-authored premium character art.

The source's Warg rig/clip counts remain descriptions, not verified runtime facts. The coordinator reported a download-tool timeout; candidate download, conversion and animation playback are unverified for this checkpoint. No Warg or other new character file was integrated. The public license finding alone does not establish usable animation, appropriate portrait quality or owner acceptance.

## Tested source identity

SHA-256 hashes captured **October 12, 2026 at 20:49:41 PDT** alongside the frozen continuation checks. The coordinator identifies the delivery parent as PR22 / `dcc8c96`; this review identifies the tested working-tree bytes directly rather than claiming publication or CI completion.

| File | SHA-256 |
| --- | --- |
| `public/wild/cinema.js` | `D179BA86774498C384DA8DBFE441B9B2014F64ABFE5F258627F7CF3872FA4672` |
| `public/wild/cinema.bundle.js` | `5C7D8C7B703940F3AE5E774BE6ED021BAE3158FE1231431BDA0173E6473FBE15` |
| `public/wild/style.css` | `044E74EDFD38AD812A53F362327195CB7A7714F16F9030590F92F85371907C14` |
| `public/wild/app.js` | `A2F4F7CA55B36237961FCCD8828464E50AD03BE0511A12D74BE991CFEA927755` |
| `public/wild/state.js` | `369813AC016CEF2A094A84B886646F9CE9008F0B27CAC3394BBABD9E9950C6FC` |
| `public/wild/assets/wolf/wolf.glb` | `99304C2E723864679170630D30662CD81756BC07472C71F66957705E4138B9CC` |
| `public/wild/assets/manifest.json` | `A22D4B9CB290C24468A937407714ED5765DE5EA3924667D1CF505B85A83073FF` |

The app, state and inventory hashes match the previous reviewed checkpoint. No blocking source or automated-test finding remains in this bounded camera/lighting/UI scope. The character model, rigging, authored motion and owner visual quality gate remain unresolved; this is not a completed cinematic encounter or a release acceptance.
