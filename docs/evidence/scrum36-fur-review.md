# SCRUM-36 — independent fur and silhouette review

Reviewer: `character_review`; geometry author: `character_asset`; runtime author: `character_runtime`; integration, browser execution and test review: coordinator. These are agent roles. This review concerns the bounded fur/silhouette increment after the cast checkpoint; it does not establish owner acceptance of cinematic quality.

## Initial topology and risk review

The reviewer independently read the creator's retained `warg_body.py` source without executing it and parsed the original FBX with the project's Three.js loader. The body has **7,071 triangles / 21,213 expanded vertices**. Source parts distinguish fur, nose, eye, tooth, jaw, tongue and separate hair shells. There are **1,901 separate-hair triangles** and twelve mixed-part triangles elsewhere in the body; therefore semantic coverage must use each vertex's label rather than just the first vertex of a triangle.

The source builds the remeshed body before attaching the separate hair locks. The proposed bounded geometry change shortens suitable locks from fixed roots, keeping the body, face pieces, skin, UVs and clips. It does not delete the underlying surface. Independent checks must confirm those invariants on the actual derived file.

Runtime review criteria are: no fur on eyes/nose/mouth/teeth, skin-compatible shell displacement, shared actor skeleton without duplicate animation clocks, bounded detail only for a close focused desktop encounter, static presentation during pause/reduced motion, and disposal that leaves shared resources under their existing owner. Shader compilation and a visibly more organic silhouette require actual browser evidence; CPU tests alone cannot establish either.

## Derived geometry verification

The reviewer independently compared `warg-groom.glb` with the retained original `warg.glb`, then checked source part labels and vertex ordering against a fresh FBX parse. The derived file is **3,530,504 bytes**, SHA-256 `3349c9c75ba9c3f5210ab7995d6a0de10f824d6df318459fa255fc509969f9f6`.

- All **15,510 body/face vertices** retain byte-identical positions and normals. Original UV, skin, inverse-bind, clip and embedded-image binary bytes outside the position/normal ranges are unchanged. Scene, node, skin, animation, image and material JSON structures also match.
- Exactly **2,856 expanded hair vertices** moved across **119 locks**. Their **2,142 expanded root entries** remain fixed; each lock has four distinct root points. The roots are capped, not open boundaries, correcting an early author inference.
- Independently measured tip-to-root length ratios are **0.44999966–0.45000026**. Maximum mesh-local displacement is approximately **0.177853**. The eight irregular fringes remain unchanged.
- Exported semantic labels exactly match the source. The new mask/direction data adds no display vertex-color attribute and preserves the original geometry topology.

These checks establish preservation of the recorded data, not attractive fur or animation quality.

## First visual candidate — rejected

The reviewer inspected the coordinator's [original Orin](local-scrum36-fur/orin-before.png) and [first fur candidate](local-scrum36-fur/orin-first-candidate.png). Shortening the long spikes reduced their length, but the remaining neck/chest locks read as individual stones or scales. The face remained smooth and no convincing fine-fur silhouette was visible at the inspected view. Two shallow shell layers did not resolve the much larger coarse geometry. The reviewer reported this to the coordinator and both authors before any focused test run.

The coordinator requested a bounded second approach: one close-encounter skinned ribbon mesh, with the coarse locks suppressed as the new coat appears. The coordinator also rejected an intermediate broad-card version because it read as scales. The final version uses thinner individual strands. No passing visual result is claimed for either rejected approach.

## Final geometry, runtime and focused verification — 2026-10-14

The final runtime generates **7,000 curved strands / 56,000 vertices / 42,000 triangles** in one additional skinned draw for a close desktop encounter. Roots are sampled only from triangles whose three vertices are closed-body part 1 with full fur coverage; separate locks and facial pieces cannot become strand roots. The helper has a hard limit of 8,000 strands. The reviewer flagged the initial possible loss of 12.8% of merged skin influence at a root. The author resolved that finding by rejecting samples with more than 2% discarded influence, using at most twenty attempts per strand and then an exact source-vertex fallback. Input geometry is unchanged by generation.

Source review found the generated mesh shares the actor's existing skeleton and exact bind transforms. Curved positions are built before skinning; there is no second bone transform or independent animation clock. The scene owns new geometry/materials, while the actor remains the skeleton owner. Cleanup detaches coat detail before the actor releases its skeleton. Shader detail is spatial and static, with no time uniform; facial response is excluded by the semantic mask. The ribbon's constant root UV deliberately omits a normal map because it has no usable UV tangent frame. Shader hooks were inspected against the installed Three.js shader source; this is not a claim of CPU shader compilation.

The scene enables detail only at width 900 pixels or greater near the settled portrait camera. Its departure correction retains only the previous portrait subject and fades that coat by distance as the camera leaves, avoiding an immediate return of coarse locks while still close. At most one actor is eligible. Existing animation pause, hidden-document and reduced-motion gates are unchanged; static detail does not require an animation tick.

The reviewer ran `node --test tests/scrum36-fur.test.mjs`: **4 passed, 0 failed, 0 skipped**, exit 0, **541.9749 ms** reported duration. These checks use the actual shipped GLB and cover:

- Exact source semantic counts, face exclusion, normalized finite normals/tangent flow, and absence of display vertex colors.
- Deterministic bounded ribbon generation, unchanged inputs, finite geometry, valid indices and normalized joint weights, root coat UVs, and sampled roots on eligible body surfaces.
- One additional mesh, correct rig/bind ownership, finite posed geometry, and sampled attachment during seven seconds of pant-to-idle animation. The largest measured root-to-body gap was **0.000581 metres (0.581 mm)** across the sampled roots and poses; this is a sampled check, not exhaustive deformation proof.
- Isolated material uniforms between actors, clamped detail, hidden-parent suppression, no animation advance from detail changes, idempotent detach, and no premature disposal of scene-owned or shared resources.

The coordinator reviews these tests and runs the full suite. The reviewer did not run that suite or independently execute browser interactions in this increment.

## Final visual assessment and remaining limitation

The reviewer independently inspected the retained [final Orin view](local-scrum36-fur/orin-after.png) alongside the original and first candidate. The final view removes the hanging neck/chest spikes in the focused shot and has finer, softer-looking chest and shoulder strands. It is a useful, bounded improvement over both earlier views. The face and ears remain visibly coarse and smooth, and the low-detail source coat still limits realism. Before and after captures have different head poses, so this is a qualitative visual comparison rather than a matched-pixel render assessment. It does **not** establish cinematic-quality or owner acceptance. Live transition, pause/resume, narrow-view and error-log results belong to the coordinator's browser evidence.

No unresolved functional blocker was found in the reviewed geometry/helper increment. The remaining art limitation must stay explicit in the handoff.

Reviewed SHA-256 identities:

| File | SHA-256 |
| --- | --- |
| `public/wild/fur.js` | `7958abecbe52ea2122cd1da7a6024e3c5fe02eacfd7cf65813e9f20a4ada75b5` |
| `public/wild/fur-geometry.js` | `94f9458cc40867f158bf1cb9a03d21f7d08fbcfcedff2de45c28b0ed5a8024d6` |
| `public/wild/cinema.js` | `ba87c6bad033ade33d43c58c5708057cd72f734ff99f6a475d5f46ab4798b3c8` |
| `public/wild/character.js` (unchanged) | `9d8ed1555f8dd76d445b3d797cb8f479b98ea16c135b76684ce9be9be301dfda` |
| `tests/scrum36-fur.test.mjs` | `7efd14496bbd2e7c36b59d003aea3b20a882e39ed0d2a85e3184b03f7a9dac43` |
