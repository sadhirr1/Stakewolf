# SCRUM-36 — independent portrait and forest-depth review

Date: October 15, 2026. Reviewer: `character_review`; portrait author: `character_asset`; environment/runtime author: `character_runtime`; integration, browser execution and test review: coordinator. These are agent roles. Parent checkpoint: `f1735c2`. The coordinator owns live Jira/GitHub reconciliation. This document records independent review of the bounded portrait/forest increment, not owner acceptance of cinematic quality.

## Baseline assessment

The reviewer inspected the retained [Vela](local-scrum36-fur/vela-after.png) and [Sera](local-scrum36-fur/sera-after.png) captures and the preceding groom evidence. Vela's shoulder/chest fur is finer, but bright, flat yellow eyes with hard pupils and a broad smooth muzzle still dominate the toy-like appearance. The shallow socket and lack of readable gaze limit expression. Sera's face remains difficult to distinguish from the dark neck. Repeated straight trunks, an empty horizon and little overlap at middle distance flatten the forest; a detailed ground texture does not resolve that depth problem.

The reviewer proposed a bounded eye/socket response improvement and overlapping forest depth. Shader detail cannot repair the source's coarse facial topology or supply facial acting. Actual candidate findings and the final bounded review are recorded below.

## Review contract

- Portrait geometry must preserve source skin/UV data and actor bone binding, with exact eye selection rather than broad texture-coordinate guesses. The original eyes must remain visible whenever a replacement is unavailable or disabled.
- Composed material changes must retain fur behavior, isolate actor variants and avoid changing shared source materials or textures. Helpers need explicit ownership and idempotent cleanup.
- Atmosphere must use the existing motion gates, without a second timer or animation loop. Placements, shader inputs and opacity must remain finite and bounded; detail changes must preserve readable encounters and narrow-screen fallback.
- Actual retained before/after images decide whether the change is visibly useful. CPU tests establish only the structural behavior they exercise. The coordinator executes browser transitions, pause/reduced motion and console checks; this reviewer does not operate the shared browser concurrently.

## Source and focused verification

The final helper uses the existing eye surfaces directly; it does not create replacement eyeballs or hide/discard the original eyes. The reviewer examined the bounded muzzle deformation, including its inverse-transpose normal transform and forward-transformed/projected fur direction. `portrait.js` clones actor geometry and wraps that actor's existing fur material, preserving the fur controller's material identity. It adds no meshes or animation clock. `cinema.js` attaches the portrait before generating fur, so generated strand roots use the refined surface. Cleanup runs fur, portrait, actor, then scene-owned resources. Portrait disposal restores the prior geometry, material hooks/cache key and clearcoat settings, and invalidates the old material program.

Height-aware haze composes with the material's prior hook and uses a duplicate-injection guard. Both exponential and linear scene-fog branches exist; the current scene uses exponential fog. The rejected silhouette generator was removed completely. Final source reuses the existing scanned pine geometry/material instances for six additional placements (ten total), without adding another material draw or animation clock. This adds 146,916 pine triangles, so unchanged draw count does not mean unchanged GPU cost. Existing scene cleanup retains resource ownership. The haze is distance/height shading, not volumetric fog or physical cloud simulation.

The coordinator independently reviewed the four initial tests before the first run, which passed in 522.2447 ms. After the visual fixes removed the silhouette generator, the reviewer replaced that obsolete test with a retained haze-composition/ownership test; the coordinator reviewed the revision with no findings. The final frozen run of `node --test tests/scrum36-portrait.test.mjs` reported **4 passed, 0 failed, 0 skipped**, exit 0, **533.2004 ms**. The reviewer did not run the full suite.

- The actual shipped rig retains byte-equivalent source data. The clone preserves topology, UVs, skin indices/weights and semantic attributes; only the intended position/normal/flow arrays change. Maximum independently measured displacement is **0.017918 mesh-local metres**. Posterior body positions remain unchanged; transformed normals and fur flow are finite, unit length and orthogonal. Eye coordinates cover the actual 420 eye vertices.
- Actor materials, detail uniforms and geometry are independent. The composed fur, portrait and haze hooks remain present without duplicate haze declarations. Disposal restores the previous hooks and geometry without disposing shared/scene-owned resources or changing other actors. CPU hook inspection does not prove GPU shader compilation.
- During seven seconds of sampled pant-to-idle motion, refined and unrefined characters have identical bone poses and attention behavior. Sampled facial points stay finite with a maximum refinement delta of **0.016052 world-space metres**. No pose advances from portrait detail/update calls. This is a sampled deformation check, not exhaustive proof for every future animation.
- The retained haze preserves prior shader hooks and their material receiver, cache separation, source texture/color references and uniform identity. Repeated ownership does not wrap the same hook repeatedly. Unsupported shader materials and materials with fog disabled remain untouched; adding haze takes no resource ownership.

No structural blocker was found in the final reviewed source. Actual visual and browser review remains separate from these passing tests; the coordinator owns the full frozen regression.

## First rendered candidate — visual findings

The reviewer independently inspected [the first forest view](local-scrum36-portrait/forest-candidate.png) and [the first Vela portrait](local-scrum36-portrait/vela-candidate.png). The council view has more atmospheric depth, but repeated large, symmetric zigzag tree edges are conspicuous between the foreground trunks. In Vela's view those shapes dominate the background and read as graphic cutouts. The coordinator and reviewer rejected this treatment as a final backdrop.

Vela's eye is less fluorescent than the baseline, but a tiny amber ring within a broad black almond reads as a hollow socket. No clear corneal highlight is visible at the inspected pose. The muzzle appears subtly longer/narrower without an obvious deformation problem. The reviewer requested more readable iris coverage and less black exposed-eye area, while retaining pupil contrast. These were visual findings despite passing structural tests. A second silhouette contour still resembled pointed blobs on stems; the coordinator removed it instead of accepting density as quality.

## Resolved shader finding

Independent source review of the optical revision found that the iris-angle calculation called GLSL `atan(y, x)` at `(0, 0)` on non-eye surfaces and at the pupil center. That case is undefined; an apparently successful browser capture does not establish portable behavior. The author added a positive-radius guard with a zero-angle fallback. The reviewer checked the correction. The added corneal normal response uses the actual animated surface/eye-coordinate derivatives, guards a small determinant and short tangent vectors, and clamps its radial contribution. No painted emissive highlight was introduced.

## Final visual assessment and limits

The reviewer independently inspected the [final council view](local-scrum36-portrait/forest-after.png), [Sera](local-scrum36-portrait/sera-after.png), [Vela](local-scrum36-portrait/vela-after.png), [Orin](local-scrum36-portrait/orin-after.png), and [dawn forest](local-scrum36-portrait/forest-dawn.png). Scanned branch overlap and softer distance haze produce a materially better sense of depth than the rejected cutouts. Sera's eyes, muzzle and neck planes are now readable. Vela and Orin retain readable eyes without the first candidate's hollow-socket appearance, although convincing corneal highlights and expression remain limited in these views. Final portrait framing keeps the head and controls visible. Dawn maintains readable labels and distinguishes the warmer foreground from the hazy background; the coarse trunks and simplified distant ground remain apparent.

This is a useful incremental improvement, **not cinematic or owner acceptance**. Coarse head/ear and trunk geometry, rigid resting teeth, limited facial expression and the texture resolution remain visible constraints. The portrait captures do not have identical animation poses. Source inspection establishes no new motion clock and retains the existing motion gates; the browser checks actually executed are attributed below. Added pine geometry still requires performance validation on target hardware. No universal frame-rate claim is supported by these tests or images.

## Coordinator-executed final verification

The coordinator reports the frozen full suite passed **254/254**, with **zero failures and skips**, in **2,760.2335 ms**. An initial sandbox attempt could not open temporary loopback sockets (`EACCES`); the permitted local-network rerun completed successfully. These are coordinator-executed results, not a second full-suite run by this reviewer.

The coordinator also reports actual browser checks of all three coats; Sera resume, motion and pause; paused **390 × 844** fallback; crossing inspection; and repair-to-dawn forest progression. Inspected console warning/error output was empty. Retained evidence includes [narrow Vela](local-scrum36-portrait/vela-mobile.png), [crossing at night](local-scrum36-portrait/crossing-night.png), and the final portraits/daylight images independently inspected above. Browser interaction and console execution belong to the coordinator; this reviewer inspected the retained images and source without taking over the shared browser.

Reviewed SHA-256 identities:

| File | SHA-256 |
| --- | --- |
| `public/wild/portrait.js` | `f2772adc83019fb2d7d50618b1d8896a39812c72697490ef8d4ca21a85304269` |
| `public/wild/atmosphere.js` | `e71b5756f5d8b89b4b936cccbf0ac5056d9df6d8ea53c625fbaec2beb087ad25` |
| `public/wild/cinema.js` | `3ef350a11aa9f7f53d3e2732798b1c60cbbe4f2945f90b92028b7e73e86b4fe6` |
| `tests/scrum36-portrait.test.mjs` | `f03fd8f1d562884729c2e96ee9c86d897692c3a1c30cf50ce64c4e4ab2036265` |
