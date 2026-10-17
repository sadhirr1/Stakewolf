# SCRUM-36 — wolf groom and portrait fur, October 14, 2026

This manually initiated session continues the owner's explicit request to improve wolf models and fur. The result is a bounded improvement to the existing provisional quadruped. It is **not acceptance of the cinematic character target**. Parent checkpoint: `861a81aef4bccd300fea4778a01d4af265a51aa5`, [PR22](https://github.com/sadhirr1/Stakewolf/pull/22).

## What changed

- The groom derivative shortens 119 separate locks to 45% of their original reach with fixed roots. All body/facial geometry, UVs, skinning, inverse binds, clips and embedded maps are retained. The original model stays untouched. [Provenance and reproduction](../../public/wild/assets/warg/GROOM.md).
- A focused desktop encounter adds one generated mesh of 7,000 thin curved strands (42,000 triangles). Body-surface sampling excludes the nose, eyes, teeth, jaw, tongue and separate coarse locks. Face, ears and feet receive shorter hair. The strands use the character's existing skeleton and root coat color.
- Coarse separate locks fade away as the portrait coat appears. The fur material softens the carved normal response and adds restrained directional detail. Camera, lights, authored animations and dialogue are unchanged by this increment.
- Narrow views use the simpler groom. Paused/reduced-motion views can show static portrait fur without advancing the rig. No new asset service, plugin or downloaded texture is required.

Geometry author: `character_asset`; material/runtime author: `character_runtime`; independent reviewer and test author: `character_review`; integration, actual browser checks and independent test review: coordinator. All are agent roles. [Independent findings](scrum36-fur-review.md).

## Actual visual iteration

The first shortened-lock/two-shell candidate was rejected by the coordinator and independent reviewer because it looked like scales and a smooth face. A 4,000-card version removed the large plates but produced broad orange patches. The final treatment uses 7,000 individually tapered 3.2 mm strands instead of six subpixel fibers inside each broad card. The thinner coat is visibly finer around the neck, chest and outline, clearest on Vela's ash coat. The face and eyes remain coarse, and Sera's dark coat remains difficult to read. No amount of passing structural tests establishes final artistic acceptance.

| Character | Before | Revised |
| --- | --- | --- |
| Orin | [Original](local-scrum36-fur/orin-before.png) | [Thin coat](local-scrum36-fur/orin-after.png) |
| Vela | [Original](local-scrum36-fur/vela-before.png) | [Thin coat](local-scrum36-fur/vela-after.png) |
| Sera | [Original](local-scrum36-fur/sera-before.png) | [Thin coat](local-scrum36-fur/sera-after.png) |

Desktop captures use 1280 × 720 and the same encounter cameras/lights. Animation/head-attention poses differ between captures; these are not exact-frame image-difference tests. The rejected [first candidate](local-scrum36-fur/orin-first-candidate.png) is retained as evidence of the visual review rather than presented as completion.

## Verification and limits

Independent focused checks passed **4/4**, zero failures/skips, in 541.9749 ms. The coordinator independently reviewed the tests and ran the frozen full regression: **250 passed**, zero failures/skips, in **2,709.428 ms**. Checks cover actual asset preservation, deterministic semantic sampling, finite normalized skin data, shared actor skeletons, bounded detail, and resource ownership. The actual-rig sampled pant-to-idle check measured a maximum root gap of **0.581 mm**. GPU compilation and appearance were checked in the real browser; passing CPU tests alone is not visual acceptance.

An attachment risk was found during review: interpolating body weights and retaining only four influences discarded as much as 12.8% at some roots. Bounded resampling now accepts at most 2% discarded weight. The measured 7,000-strand run rejected 438 candidate roots out of 7,438 and required no fallback. This is still an approximation; sampled pose checks are not proof for every possible future animation.

The active asset payload is **13,914,280 bytes** (24 files), 361,396 bytes more than the preceding cast checkpoint. All 26 retained asset files total **18,038,716 bytes**, including the two inactive original models. JavaScript is additional. Three generated coat geometries are allocated for the named cast, but at most one portrait detail mesh is drawn at a time; background actors do not receive extra fur draws. The earlier transfer/frame targets remain unmet. Local browser measurements do not establish performance across target hardware.

The final generated JavaScript bundle is **940,183 bytes**. Actual browser checks covered all three desktop coats, pose changes during active encounters, pause/resume, switching subjects while paused, and Vela at **390 × 844** with the simpler groom and readable controls ([capture](local-scrum36-fur/vela-mobile.png)). No shader or asset-loading errors appeared in inspected console output. The retained rig tests cover the full sampled pant-to-idle interval; browser snapshots only establish the poses actually inspected. The final scene's first 120-frame measurement reported 36 draws and 435,361 triangles at 1280 × 720; its 759 ms average frame interval included long scheduling gaps during this interactive session and is not a usable steady-state frame-rate benchmark. Performance acceptance remains open; no 60 fps claim is made. Earlier rejected-candidate timings are not attributed to the final build.

Reviewed source hashes are in the independent review. Final GitHub commit and Windows/Ubuntu CI outcome are recorded on PR22 and Jira rather than asserted in advance here. Preview server: loopback port 4174. No package installation or paid service was introduced. The shared account usage reading was 49% near completion (normal project guard 55%); this is not project-only usage or measured work hours, and no reset credit was used.

The model's shared quadruped proportions, facial topology, 1K maps and lack of expressive facial acting remain the main quality constraints. This session adds no story, external-information input, campaign, save system or production deployment. A portrait-suitable character asset is still required before this can be called cinematic. November 6/13 scope risk remains; schedules remain canceled.
