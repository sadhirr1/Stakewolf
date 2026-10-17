# SCRUM-36 — twilight glade and portrait integration

Date: 2026-10-15. Author: Development / Visual Design specialist (`character_runtime`). Independent reviewer: `character_review`. Coordinator owns the browser comparison and publication.

## Problem and change

The retained council and Sera baseline views show a hard ground/sky edge, straight repeating trunks, and a dark portrait face merging into its neck. This increment changes the forest's depth and portrait lighting without changing story state or encounter cameras.

- Height-aware distance haze runs inside existing standard/basic material passes. Low distant surfaces fade into the same horizon color as the sky; nearby faces remain clear. Existing material hooks, including fur and portrait hooks, are preserved.
- Six additional instances of the already loaded scanned pine fill selected middle and distant backgrounds, bringing the total to ten. Height and yaw vary across the small cluster, preserving actual branch depth without a new asset download. Existing procedural trunks gain varied lean, stronger taper and smaller root flares.
- Twilight key and ambient colors separate the glade from the campfire. The existing portrait area light is wider and more frontal. Orin/Vela intensity is lower to account for its larger surface; Sera receives a neutral light from the viewed side with a higher night intensity, because her charcoal face remained unreadable in the first comparison. No additional light, shadow pass or postprocessing pass is introduced.
- The separately authored portrait helper is attached to each actor before strand generation, so the strands bind to the refined face geometry. Its same-pass detail remains enabled on narrow and paused views. Cleanup detaches fur, restores portrait resources, releases actor rigs, then disposes scene-owned geometry/materials/textures.

## Bounded cost and lifecycle

The six additional scanned pine instances add 146,916 triangles without adding a material draw call: each original pine contains 486 trunk triangles plus 24,000 foliage triangles, reused in the existing two instanced meshes. Trunk subdivisions also increase slightly. The flat silhouette layers were removed entirely after browser review. These are geometry counts, not measured GPU timings.

The retained atmosphere hook has no timer, animation loop, texture download, separate scene object or independently owned GPU resources. Existing scene fog supplies color/density uniforms; dawn changes those values through the scene controller. Scene ownership ensures reused materials and geometry are released once. Existing hidden-page, pause, reduced-motion and narrow-layout behavior remains in the scene controller.

## Verification and limits

- Author syntax checks: `node --check public/wild/cinema.js` and `node --check public/wild/atmosphere.js` passed.
- Browser comparison rejected the procedural flat tree silhouettes, including a revised contour attempt. They were removed, with actual scanned pine geometry reused instead.
- Coordinator and author inspected the retained `forest-after.png` and `sera-after.png` against the baseline. The council's hard horizon is softened and the added scanned branches create overlapping depth. Sera's muzzle, shadow-side face and amber eyes are now readable under the view-side fill. The coordinator retained this bounded improvement. Coarse facial anatomy, prominent foreground trunk shapes and overall cinematic polish remain unresolved.
- Independent reviewer final focused run: four passed, zero failures/skips, exit 0, reported duration 533.2004 ms. Coverage includes actual portrait clone/skin/UV invariants, material-hook composition, pant-to-idle refinement bounds, and retained haze cache/idempotency/resource preservation. The obsolete silhouette test was replaced. Reviewer also inspected the retained forest/Sera images and found no functional blocker; coarse head/ear/trunk geometry remains a visual limit.
- Baselines retained locally: `local-scrum36-portrait/forest-before.png`, `vela-before.png`, and `sera-before.png`. These local captures are working evidence, not a substitute for the durable reviewed result recorded here and on Jira.

This is a bounded visual increment on the existing provisional creature. It does not establish final cinematic quality, target-hardware performance, release acceptance or new gameplay depth.

Frozen source SHA-256:

- `public/wild/cinema.js`: `3EF350A11AA9F7F53D3E2732798B1C60CBBE4F2945F90B92028B7E73E86B4FE6`
- `public/wild/atmosphere.js`: `E71B5756F5D8B89B4B936CCCBF0AC5056D9DF6D8EA53C625FBAEC2BEB087AD25`

The coordinator records the final build, broader regression checks and measured browser render metrics with the integration checkpoint. Authoring this note does not claim those checks have run.
