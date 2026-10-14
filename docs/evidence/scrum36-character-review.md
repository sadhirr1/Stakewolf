# SCRUM-36 — independent animated-character review

October 13, 2026. Reviewer: `character_review`; asset preparation: `character_asset`; runtime author: `character_runtime`; browser execution, integration and test review: coordinator. These are agent roles. This is a bounded character-animation checkpoint, not owner acceptance of the cinematic quality target.

## Provenance and conversion

The reviewer independently opened the [creator's official pack page](https://algumacoisaqq.itch.io/fantasy-creatures-wolf-giant-rat-spider-wasp-centipede) and [source license](https://github.com/danielgruginski/Beasts/blob/main/LICENSE), read the actual downloaded package's `LICENSE.txt` and `README.txt`, and checked the archive checksum. The package identifies Daniel Gruginski, CC0 licensing, top-down use, and code/AI-generated geometry, textures, rigging and keyed animation. It does not promise close-up or premium character quality.

The actual archive is **41,646,828 bytes**, SHA-256 `43252dfaca8d99c52a3dab11181291fa594d7e41e6a1c1f2d87b9ba009babf56`. It remains an ignored preparation input; no creator script was executed by this review. The retained conversion uses the installed Three.js loader/exporter.

Independent CPU checks against the acquired FBX found:

- **7,071 actual body triangles**, differing from the creator's advertised 7,072; **41 skin joints** and **21,213 unindexed vertices**.
- All skin weights finite, nonnegative and normalized within 0.001; every joint index in range.
- Source Idle (4 seconds), IdlePant (3 seconds), and Walk (approximately 0.933 seconds) each have 126 tracks with no missing target. Only Idle and IdlePant are retained for this stationary cast; Walk was not integrated.
- The converter removes tack/mask meshes and equivalent identity bone duplicates introduced by the FBX loader. Comparing **every bind-skinned source vertex** with the converted glTF under the intended normalization found maximum world-position deviation **5.50 × 10⁻⁸ metres**. The output has 41 unique joints.
- A CPU sample of the actual converted Idle over 0.5 seconds produced approximately **0.108 metres maximum sampled mesh deformation**. This proves skinning changes vertex positions; it does not prove attractive motion or GPU performance.
- Independent comparison of the optimized clips against the full-key GLB found **zero interpolated difference** at the original keys plus 120 Hz samples: 75,852 track samples for Idle and 56,952 for IdlePant. Texture JPEG conversion is a separate lossy size tradeoff, reviewed visually by the coordinator.

The coat's alpha is documented smoothness, not transparency. The conversion preserves opaque color, derives roughness from `1 − alpha`, and flips texture rows for glTF sampling. The author documents an OpenGL/Y-up normal map. Installed GLTFLoader's derivative-tangent Y adjustment is its normal import behavior, not independently a reason to invert the texture again.

## Review findings

| Finding | Disposition |
| --- | --- |
| The first rendered candidate had black skin, purple tufts and a green jaw | The coordinator's [failure capture](local-scrum36-character/candidate-material-failure.png), also inspected by this reviewer, exposed an FBX part-mask color attribute being multiplied into the coat. The asset author removed it. The new regression rejects it; this reviewer inspected the [corrected candidate](local-scrum36-character/candidate-fixed.png) and integrated captures and found the artifact resolved. |
| Clone ownership and cleanup | Source review confirms each character owns bones/skeletons and a mixer, while geometry/materials remain scene-owned. Skeleton disposal precedes renderer teardown. Focused CPU regression covers ownership and disposal events; this does not measure GPU memory. |
| Animation clock and hidden actors | Source review confirms finite, positive, capped updates and hidden-ancestor skips. Scene pause, reduced motion and hidden-page guards precede animation updates. Focus/resize/anchor reads do not independently advance clips. |
| Cached shadows | The previous environment shadow map is static. An animated cast must not retain a frozen articulated shadow. The runtime uses a simple contact patch rather than a new per-frame environment-shadow pass; visual sufficiency remains provisional. |

## Verification status

On October 13, Windows/PowerShell and **Node.js 24.21.0**, this reviewer executed `node --test tests/scrum36-character.test.mjs`: **4 passed, 0 failed, 0 skipped, 0 cancelled; 623.9215 ms; exit 0**. They inspect the real packaged skin/clips, verify independent clone deformation and the untouched template, exercise invalid/hidden/bounded elapsed time, and verify idempotent bone-texture disposal without shared-geometry disposal. Texture loading is omitted from their CPU import; texture appearance requires browser evidence. The coordinator independently reviewed all four tests and separately ran the full suite: **242 passed, exit 0, 3478.9861 ms** after a first sandboxed attempt encountered a denied loopback server. This reviewer did not duplicate that full run.

This reviewer inspected the retained [Orin first pose](local-scrum36-character/orin-motion-a.png), [Orin second pose](local-scrum36-character/orin-motion-b.png), [Sera desktop](local-scrum36-character/sera-desktop.png), [Vela desktop](local-scrum36-character/vela-desktop.png) and [Vela narrow](local-scrum36-character/vela-mobile.png) images. Faces/ears fit; dialogue and the close, account, back and motion controls remain visible. Vela's face stays above the reading panel at 390 × 844. These are independent static-image checks, not another browser executor or a physical-phone result.

The coordinator separately reports actual full-loop desktop observation, identical paused captures, successful resume, paused focus/resize, and no desktop warnings/errors. Reduced-motion and hidden-page scheduling were source-reviewed; no new browser execution of those settings is claimed. No new forced character-load failure was run: prior generic asset-failure browser evidence and current route/package tests remain the available coverage. New loading/frame-interval measurements belong to the coordinator's browser record; they do not establish a universal frame rate or GPU render time.

Reviewed SHA-256 identities:

| File | SHA-256 |
| --- | --- |
| `public/wild/cinema.js` | `55c9842d00fc771af370f337d822908a38709450e37229663a8559b96f96a95b` |
| `public/wild/character.js` | `b122e9423960e25a35c09838d5ff182ccd7838d548fd2e09099b8b73b8e942c1` |
| `public/wild/assets/warg/warg.glb` | `e97b8563f061bb59f94090c0fceb96c7bc71e4517b360767c87ecc184b735026` |
| `public/wild/assets/manifest.json` | `8012e6728813111a707298ed75f32366aaa521d170610ab617b30b4ed125dcb3` |
| `tests/scrum36-character.test.mjs` | `65052c8c8859ffadf2b600b218b952bab083985da7a5b738f16e622793e805bf` |
| `scripts/asset-prep-warg.mjs` | `8111bb84f2ab9e8bf4f5ad9f7e2768f96626b3849075e42dfe7612c1307d2717` |

No blocking source, focused-test or retained-image finding remains for this bounded integration. The rigged quadruped remains provisional: the cast uses one mesh, the close-up fur is coarse, there is no speech/lip-sync or walking behavior, and target-hardware/performance and owner art acceptance remain open. The packaged asset is 3,169,108 bytes; all retained runtime assets total 13,936,220 bytes, still beyond the earlier 1 MB proposal.
