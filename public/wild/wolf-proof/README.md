# SCRUM-36: isolated wolf asset evaluation

This is a bounded comparison scene, not an accepted replacement for Stakewolf's cast. The existing `/wild/` game is unchanged. One wolf, a small clearing, full-body/portrait cameras, dusk/neutral light, idle/walk-in-place selection, orbit/zoom and motion pause are included. No custom fur, face deformation, new story or game integration was added.

## Run locally

1. Download the free **Dire Wolf Lite v1.0.0** from [Literock Studios](https://literock-studios.itch.io/direwolf-lite).
2. Read its supplied license. Extract the folder to `.tmp-scrum36/wolf-proof/Dire_Wolf_Lite/` so that `Dire_Wolf_Lite.glb` is there. This directory is ignored by Git. Do not copy the asset into public source or upload it to GitHub.
3. From the repository root, run `node scripts/serve-wolf-proof.mjs` and open `http://127.0.0.1:4179/`. The server binds only to loopback. Stop that process to close the preview.

The authored bundle is included. To rebuild after source changes using the existing dependencies:

```powershell
node --input-type=module -e 'import{build}from"esbuild";await build({entryPoints:["public/wild/wolf-proof/scene.js"],bundle:true,minify:true,format:"esm",outfile:"public/wild/wolf-proof/scene.bundle.js",legalComments:"eof"});'
```

## Provenance and limits

- Creator: Literock Ventures, trading as Literock Studios. Downloaded October 15, 2026 from the creator's normal free download flow; no purchase.
- File: `Dire_Wolf_Lite.glb`, 12,437,756 bytes, SHA-256 `96c6b647321b0202b10102469d4d186a9e30eea68b28f25cc12ad4fc74eae314`.
- Supplied geometry/materials/rig remain unchanged: 9,991 triangles, 35 joints, 2K embedded maps. Actual clips: `idle_loop`, `walk_loop`, `run_loop`, `bite`; the proof exposes the first two only.
- The creator discloses Meshy-assisted base mesh/textures, followed by rigging, weighting, animation and finishing. These are not original Stakewolf character assets.
- The bundled license permits free commercial/noncommercial end products and modification. It prohibits standalone asset redistribution/re-upload, including modified versions, asset packs/templates, use as ML training data, and claiming authorship. Packaged end products are permitted. Keep the raw model/FBX/textures private and link to the creator. This public checkpoint contains authored viewer code, rendered screenshots and provenance only.
- Scenery reuses existing repository assets and their recorded attributions in `public/wild/credits.html`.
- Reviewer and coordinator found stronger head anatomy, ears, eyes and muzzle than the preceding Warg. The carved/scaly coat, stiff mouth and visible black nose wedge remain limitations. This proof has no cinematic approval, facial acting, mobile quality approval or measured performance acceptance.

See `docs/evidence/scrum36-wolf-proof.md` for actual browser evidence and review. Do not extend or integrate this candidate until the owner has judged the visible result.
