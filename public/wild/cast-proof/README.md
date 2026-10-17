# SCRUM-36 — council cast study

Isolated local comparison of two **human** community members. Dain is a scout; Rhea is a guardian. Public responsibilities and appearance do not assign hidden allegiance. These names and roles are provisional. This scene has camera inspection, original idle clips, two lighting states and pause controls; it has no gameplay or character dialogue system.

## Result and boundary

The pair demonstrates different silhouettes in the same real 3D woodland scene. **Both faces failed the cinematic close-up gate.** Dain's eyes/mouth are muddy and obscured; Rhea's eyes/lips are malformed. Do not integrate these as accepted production characters or spend another session polishing their source faces. The hooded scout also creates a suspicion cue that needs balancing in a final cast.

## Run locally

From the repository root, with its existing dependencies and scenery assets present:

```powershell
node scripts/serve-cast-proof.mjs
```

Open `http://127.0.0.1:4180/`. Raw character models are deliberately excluded from the public repository. Place the two original downloads below in `.tmp-scrum36/cast-proof/` with their listed filenames. The server exposes only these exact model paths and the existing static-server allowlist; it binds to loopback. The main game and wolf study are separate.

To rebuild the committed browser bundle using the repository's existing esbuild dependency:

```powershell
node --input-type=module -e 'import{build}from"esbuild";await build({entryPoints:["public/wild/cast-proof/scene.js"],bundle:true,minify:true,format:"esm",outfile:"public/wild/cast-proof/scene.bundle.js",legalComments:"eof"});'
```

## Asset provenance — checked October 15, 2026

Publisher: Asset Yard / Binary Helix / XP.COM, LLC. Official [samples](https://assetyard.dev/samples/), [sample manifest](https://assetyard.dev/samples/manifest.json), [pack terms](https://assetyard.dev/pack/) and [provider notices](https://assetyard.dev/licenses/).

| Model / local filename | Original source | Bytes | SHA-256 |
|---|---|---:|---|
| Ashfen Ranger / `ashfen-ranger.glb` | [Original GLB](https://assetyard.dev/pack/files/ashfen-ranger.glb) | 5,672,640 | `1d38fa13a99c2aa9f928735be363e7a3f74a927d9bf00d3e691dfe496073df0f` |
| Vale, Shieldmaiden / `vale-shieldmaiden.glb` | [Original GLB](https://assetyard.dev/pack/files/vale-shieldmaiden.glb) | 17,303,480 | `06ff3473344df33d609cfb61560b7991441bf2376f63536270e685ca42db6d81` |

These are **AI-generated sample outputs, not CC0 or MIT-licensed character models**. The pack page permits use in games/prototypes/tutorials and does not require Asset Yard attribution. We retain credit. Its provider notice page refers to DINOv3 notices for Pixal3D, UniRig MIT, Kimodo NVIDIA model/Apache code terms, and Meta Llama 3 notices. The sample manifest does not identify exact generation versions or complete per-asset provenance. Independent review therefore permits **local evaluation only**; production redistribution/commercial clearance remains unresolved. No source models are included in this checkpoint. No paid generation or purchase occurred.

Original rig, geometry, materials and clips are retained. The renderer only normalizes stature, places the models, plays `idle`, and configures mesh shadows. The loaded ranger has five clips; the guardian has fifteen. No facial animation is claimed. Combined character transfer is 22,976,120 bytes before scenery and JavaScript; no device-performance acceptance is claimed.

Existing ground, pine, fern and rock assets retain their existing repository provenance. Source-page snapshots and originals remain ignored locally; these source links, identities and caveats are the durable handoff.
