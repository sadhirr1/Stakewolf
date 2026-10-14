# Authored Warg coat variants

`ash.jpg` and `black.jpg` are the creator's actual alternate coats for the existing Warg UV atlas. They provide a gray/white coat and a charcoal coat, respectively. They are not arbitrary color tints. Both retain the source's gold eyes, mouth details and fur pattern.

Creator: **Daniel Gruginski / algumacoisaqq**. The same **CC0 1.0** license and disclosed AI/code-generated production process described in [README.md](README.md) and [LICENSE.txt](LICENSE.txt) apply.

- Creator page: https://algumacoisaqq.itch.io/fantasy-creatures-wolf-giant-rat-spider-wasp-centipede
- Creator repository: https://github.com/danielgruginski/Beasts
- Original source archive: `Creatures_FBX.zip`, SHA-256 `43252dfaca8d99c52a3dab11181291fa594d7e41e6a1c1f2d87b9ba009babf56`, acquired 2026-10-13.
- Sources within that archive: `Creatures/Beasts/Textures/T_Warg_Ash.png` and `T_Warg_Black.png`.

| File | Bytes | SHA-256 |
| --- | ---: | --- |
| Source `T_Warg_Ash.png` | 1,577,097 | `e9d0902c68f65b3523939b9c1b6e96ba7ba7ae9f4a9a06781480ced352e7a78f` |
| Source `T_Warg_Black.png` | 1,386,402 | `7fca0b99f199a727e89d306ac12e291725f16a32fdb00c5472e5b20d3535cfb9` |
| Shipped `ash.jpg` | 324,417 | `c5fe52a844c3c57468649ce13efcc6e2b771740a2f944d03cda1e2de5d4a6730` |
| Shipped `black.jpg` | 247,575 | `dd98e2618dfe2ec7ecfcedf3c4dabd5b221fc398fb9712cfed675502efc11c4f` |

The two coats add **571,992 bytes**. The existing GLB, geometry, rig, animations, normal map and roughness map are shared and unchanged by this conversion.

## Conversion and material compatibility

`scripts/asset-prep-warg-variants.mjs` is an offline converter using separately supplied Sharp 0.35.5. It accepts the extracted texture directory, an output directory and a Sharp module path. It downloads nothing, installs nothing and executes no creator code. It writes only the two JPEG files and prints its validation report.

Both actual source files are 1024×1024 RGBA. Every one of the 1,048,576 alpha samples in each variant is identical to the brown `T_Warg.png` base. Alpha represents smoothness, so the existing GLB's derived roughness map is exactly compatible with both variants. The creator describes these coats as sharing UVs and `T_Warg_Normal.png`. Neither a separate roughness map nor a normal-map adjustment is needed. The converter stops before writing if a supplied variant has different alpha.

The source rows are vertically flipped to match the existing GLB's embedded coat; alpha is removed from the color image, and JPEG is encoded at quality 94 with 4:4:4 chroma. Resolution remains 1024×1024. No tint, hue change, repainting, cropping or UV edit is applied. JPEG is lossy; decoded RGB is therefore not byte-identical to the source.

For externally loaded maps, use **sRGB color space** and **`flipY = false`** to match the embedded glTF material. Retain its normal-map settings and opaque material. Each cast member needs its own material instance so replacing one coat does not recolor the other characters.

## Recorded conversion checks

The author checked source dimensions and alpha equality, viewed both source atlases, and compared every decoded JPEG RGB sample with both row orientations of its source:

| Coat | Mean absolute RGB error, correct flipped source | Error against incorrectly unflipped source |
| --- | ---: | ---: |
| Ash | 1.16064 / 255 | 27.11486 / 255 |
| Black | 0.95612 / 255 | 14.82034 / 255 |

These numerical checks support the intended row orientation and bounded compression change. Independent asset review and an actual in-scene visual check are recorded separately by the session coordinator. This document alone does not claim visual acceptance.

The cast still shares one quadruped model. Coat variation improves identification but does not add distinct anatomy, bespoke animation, higher-resolution fur or final cinematic character quality.
