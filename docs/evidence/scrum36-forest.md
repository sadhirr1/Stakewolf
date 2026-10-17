# SCRUM-36 — actual forest browser observations

Recorded October 12, 2026, America/Los_Angeles. Coordinator execution in the Codex in-app desktop browser; independent source/test review is in [scrum36-review.md](scrum36-review.md). This is a reviewed rendering experiment, not owner visual acceptance or a release.

## What changed on screen

The active forest uses Three.js with local ground and bark materials, scanned fern/rock meshes, four detailed pine instances, provisional textured wolf meshes, moon/fire lighting and revised fog/sky output. The existing decision controller, field notes, historical commitments and morning assignment remain in place. The original procedural renderer is retained as source, but the runtime imports `cinema.bundle.js`.

The wolf is a static quadruped from an older asset set. It does not meet the requested polished anthropomorphic character/animation target. Adding loaded models and materials is an actual change, but is not sufficient evidence of premium visual quality.

## Browser checks actually performed

| Check | Observation | Limit |
| --- | --- | --- |
| Desktop opening | Forest assets load, opening typography and Enter control remain readable | Local desktop browser, normal 1280 × 720 viewport |
| Orin encounter | Character coat texture visible; compact conversation, expanded account, close/back and motion controls exercised | Provisional model, no authored character animation |
| Keyboard | Escape closes the encounter and restores controls | Not a full assistive-technology audit |
| Narrow encounter | 390 × 844 CSS viewport: face remains above the bottom panel; dialogue and controls readable; measured page width 390, no horizontal overflow | Browser viewport emulation, not a physical phone |
| Required texture failure | A disposable copy's embedded wolf PNG signature was damaged. The browser showed a readable fallback and kept Enter/council actions usable; no false readiness or scene pins | Controlled local fault, original assets unmodified; recorded before final pine/framing increment |
| Night through morning | Inspect anchor → choose repair → dawn → begin morning → assign Sera to crossing → guided first party; field notes and deferred northern work visible | One path exercised live; other state branches covered by existing automated tests |
| Tree obstruction correction | A foreground trunk initially blocked the right side of the crossing. Final camera-sightline placement exclusions reveal the deck and downstream anchor; the path above was replayed after rebuild | Final corrected source `3e11c63445eef431e14efc8060b207cb77a9714ea443c7d3b400644e5b4b4c58` |

The final usual preview server was restarted at `http://127.0.0.1:4174/wild/` and the opening was captured there. Earlier verification used a separate local port to avoid disturbing the owner's existing tab.

## Retained images

- [Final opening](local-scrum36/forest-opening.png).
- [Desktop Orin encounter](local-scrum36/orin-encounter.png) and [narrow encounter](local-scrum36/mobile-encounter.png), captured before the final tree-placement correction. Independent QA inspected both.
- [Controlled required-texture fallback](local-scrum36/texture-failure.png).
- [Crossing before correction](local-scrum36/crossing-before-framing-fix.png) and [final corrected crossing](local-scrum36/crossing-after-framing-fix.png).

## Measured performance and unresolved cost

On the same desktop browser, immediately before the final tree-placement correction, the renderer reported local asset loading of **1,173 ms**. Its first measured window had **117 intervals averaging 32.253111 ms**, 156 draw calls, 388,042 triangles and a 1520 × 855 drawing buffer. It then reduced drawing resolution. The later independent window had **240 intervals averaging 25.092083 ms**, with a 1216 × 684 buffer. These are application requestAnimationFrame interval measurements, not GPU timings, an end-to-end load benchmark, or a guarantee of frame rate on other machines. They were not remeasured after the final placement-only fix.

The final 22 runtime assets total **10,767,112 bytes**; the bundle is **662,816 bytes**. This misses the previously proposed 1 MB initial-transfer target. No mobile hardware, throttled-network, cold-cache production, GPU memory or broad accessibility acceptance is claimed. Further art optimization and device measurements are needed before any release decision.

## Delivery and next work

The independent review records 238 passing full-regression tests, followed by six passing targeted tests after the placement correction. No new gameplay-depth, live external input, model service, campaign generation or save feature is claimed. The next visual task is a coherent rigged character and authored motion, with an actual rendered encounter reviewed by the owner. GitHub/Jira contain the durable checkpoint; screenshots alone do not establish that quality gate.
