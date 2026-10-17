# Warg groom candidate — SCRUM-36

`warg-groom.glb` is a reversible derivative of `warg.glb`. It reduces the long pointed mane, throat and tail locks while retaining the underlying closed body. This is a geometry and fur-shading benchmark, not an approved final cinematic character.

## Provenance

- Creator: Daniel Gruginski / algumacoisaqq; CC0. See `LICENSE.txt` and `README.md` in this folder for the original download and conversion record.
- Official source: https://algumacoisaqq.itch.io/fantasy-creatures-wolf-giant-rat-spider-wasp-centipede
- Creator source code: https://github.com/danielgruginski/Beasts. The creator's scripts were read to understand semantic part tags; they were not executed.
- Original extracted `Warg.fbx`: 554,796 bytes; SHA-256 `bd3872a52e8044c45a92369a50551c6ab6771f469593619b36f0450dd243f661`.
- Baseline `warg.glb`: 3,169,108 bytes; SHA-256 `e97b8563f061bb59f94090c0fceb96c7bc71e4517b360767c87ecc184b735026`.
- Candidate `warg-groom.glb`: 3,530,504 bytes; SHA-256 `3349c9c75ba9c3f5210ab7995d6a0de10f824d6df318459fa255fc509969f9f6`.

## Geometry changes and preservation

The original contains 7,071 triangles and 21,213 expanded vertices. Semantic part 11 identifies 1,901 triangles in 127 separate hair islands. The derivative modifies the 119 simple locks (nine welded points and fourteen triangles each), leaving eight irregular fringes intact. No triangles are removed or added.

Each simple lock has a capped four-point root ring. The four lowest values in the source's blue root-distance channel must form exactly two root-cap triangles. The preparation script verifies that contract for every modified lock. Root positions stay fixed. The remaining points are moved to 45% of their original reach along the root-to-tip axis, with at most 12% transverse narrowing toward the tip. Exactly 2,856 expanded position vertices change; maximum displacement is 0.177853 in mesh-local units. The existing normalization wrapper is retained.

Normals are recalculated within each modified lock using area-weighted face normals. They are never averaged into body or facial geometry. The script verifies that all 15,510 non-hair vertices retain exact position and normal bytes, and that all existing binary bytes outside POSITION/NORMAL remain identical. This preserves UVs, skin weights/joints, bind matrices, animation data, and all embedded image bytes. Original Idle and IdlePant clips, 41-joint skin, texture orientation and source coats remain compatible.

## Fur attributes

Custom attributes use the unchanged mesh-local coordinates (Z up, front toward -Y). Existing node transforms orient the model for the runtime. The Three.js loader exposes these attribute names in lowercase.

| glTF attribute | Type | Meaning |
| --- | --- | --- |
| `_FUR_MASK` | Float32 scalar | 1 on body coat and added hair; 0 on nose, eyes, teeth, jaw and tongue |
| `_FUR_DIRECTION` | Float32 vector3 | Unit tangent-projected coat direction; zero on excluded parts |
| `_FUR_PART` | Unsigned byte scalar, not normalized | Creator semantic part ID |

Part IDs: 1 body coat, 2 nose, 3 eyes, 4 teeth, 5 lower jaw, 6 tongue, 11 added hair. The source semantic colors are not exported as display colors. Twelve mixed-part triangles at the fur/nose boundary retain per-vertex masks rather than a triangle-wide guess.

## Reproduction

Use the already installed Node/Three dependencies. The preparation script reads source model data without downloads or external source-code execution:

```powershell
node scripts/asset-prep-warg-groom.mjs path/to/Warg.fbx public/wild/assets/warg/warg.glb public/wild/assets/warg/warg-groom.glb path/to/groom-report.json
```

The optional report records source/output identities plus each changed lock's fixed root indices, changed vertices, tip indices and axis. It supports independent baseline comparisons without including a source FBX in the runtime bundle. The original must remain a distinct file; the script rejects overwriting it.

## Limits

The underlying body remains the creator's coarse sculpt, including its integrated broad tufts. Eight irregular fringes are unchanged. This derivative does not add strand geometry, facial detail, new animation, or an anthropomorphic body. Shortening locks is intended to remove the largest spikes; browser comparison and the separate runtime fur treatment determine the actual visual improvement. Final artistic acceptance remains with the owner.
