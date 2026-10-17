# SCRUM-36 portrait asset treatment

Acting role: Visual/assets agent. Independent reviewer: character_review. This is a bounded refinement of the existing Warg, not final cinematic-art acceptance.

## Delivered candidate

`public/wild/portrait.js` exports `attachCharacterPortrait(root, { ownMaterial, ownGeometry })`. Call it on an actor with its own `createFurMaterial` instance, **before** `attachFurLayers`, so generated strands follow the refined surface. The returned object has `metadata`, `setDetail(value)`, a no-op `update()`, and idempotent `dispose()`.

The helper clones the actor geometry and wraps its existing material hook in place. Preserving material identity keeps the fur controller's uniform association intact. It adds no meshes, textures, assets, animation clocks or draw calls. The scene owns the registered cloned geometry and existing material; the actor retains sole ownership of its skeleton. Disposal restores the original geometry, shader hook, cache key and clearcoat settings, and invalidates the material program. It does not dispose shared source data.

## Appearance changes

- The muzzle narrows by at most 8% and extends by at most 18 mm in mesh-local coordinates, fading smoothly behind the eyes. The same deformation covers the upper/lower jaw, teeth, nose and coat rather than moving disconnected parts independently. Normals use the deformation's inverse-transpose Jacobian; fur flow uses its forward Jacobian followed by tangent projection.
- Projected eye coordinates come from the actual two semantic eye surfaces, with equal physical units on both axes. The retained optical response has a warm amber iris, circular pupil, dark limbal region, radial iris detail and upper-lid shading. The existing eye dome and a restrained normal treatment feed physical clearcoat lighting; a distinct wet catchlight was not visible in the final captured view. No emissive dots or white eyeball primitives are added.
- The semantic nose receives a darker leathery base and varying roughness. Coat colors, UVs and source textures remain shared and unchanged.
- `setDetail(0)` restores the source optical response. The restrained geometry refinement remains static; no focus animation changes the head's proportions.

## Measured author checks

Checked on the actual shipped `warg-groom.glb`, not a proxy mesh:

| Measurement | Result |
| --- | --- |
| Eye vertices receiving projected coordinates | 420 (210 each side) |
| Muzzle vertices moved | 2,256 expanded vertices |
| Largest position displacement | 0.01791805 mesh-local units |
| Largest unit-normal error | 4.37e-8 |
| Largest normal/flow dot product | 4.54e-8 |
| UV, joint, weight and semantic arrays | Byte-equivalent to source |
| Added draws / triangles | 0 / 0 |
| Fur + portrait shader composition | CPU hook check passed |
| Geometry / material restoration | CPU disposal check passed |

The code passes the Node syntax check. The focused portrait test suite passed 4/4 checks covering actual geometry, material isolation, moving-rig behavior and atmosphere. The coordinator inspected the rendered candidate and retained optical version 2 after independent visual review. These results support this bounded increment, not final cinematic-art acceptance; the coordinator records the complete integration regression separately.

## First rendered comparison and bounded correction

The coordinator's first `local-scrum36-portrait/vela-candidate.png` compiled without reported shader errors. Independent inspection found that removing the fluorescent yellow helped, but the small iris left too much dark exposed eye and read as a hollow socket. The muzzle change remained subtle at the captured distance.

The retained optical correction increases iris radius from 0.64 to 0.92 of the measured eye's short radius, with pupil radius 0.30. It raises warm iris contrast and reduces the dark surrounding-eye and upper-lid treatment. A guarded tangent frame derived from the animated surface supplies a restrained corneal normal dome to the base and clearcoat lighting. Geometry, rig, ownership and helper API are unchanged.

The final [Vela capture](local-scrum36-portrait/vela-after.png) was compared with the [baseline](local-scrum36-portrait/vela-before.png). The coordinator and independent reviewer retained the larger, warmer iris: the hollow-socket finding is resolved and the fluorescent yellow is reduced. A distinct corneal glint is still not apparent at this captured angle. Physical clearcoat support must therefore not be presented as proof of a visible wet highlight.

Independent review also found that evaluating GLSL `atan(0,0)` at default non-eye coordinates could produce undefined results. The code now evaluates the angle only when the measured radius exceeds a small epsilon, using zero otherwise. The reviewer confirmed that this guard resolves the source finding. The final geometry and helper API stayed frozen during the optical correction.

## Remaining limits

The underlying head, ear corners and teeth remain the creator's low-poly anatomy. Head expression remains limited, and the muzzle improvement is subtle in the retained camera view. Source `warg_anim.py` confirms `Idle` already uses the neutral jaw; `IdlePant` opens it 15–20 degrees. Persistent tooth exposure is present in the authored resting shape. Forcing the jaw beyond that rest pose could intersect lips and teeth and was not included. This treatment should not be described as a complete character replacement or photorealistic fur/face.
