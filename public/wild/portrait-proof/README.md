# SCRUM-36 — one leader in the forest

One human council leader supplied by the owner on October 15, 2026. After approving the portrait direction as better, the owner requested a single forest encounter with subtle movement. This is a local 2.5D atmosphere test, not a rigged 3D character, playable encounter, or release acceptance. The owner declined the CC5 acquisition route.

Run `node scripts/serve-portrait-proof.mjs` from the repository root and open http://127.0.0.1:4181/. The original comparison is retained at `/study`. No new dependencies. The server serves exact preview routes and the existing allowlisted forest assets, binding to loopback only. Other character models and repository files are not exposed. The main game, wolf proof and previous council proof are unchanged.

The encounter reuses the Poly Haven pine, fern, mossy rock and forest-floor assets already in `public/wild/assets/`; see their existing README for CC0 provenance. The supplied cutout is unchanged in this increment. Colour grading, a tiny whole-image breathing-like rise, drifting haze and six motes provide atmosphere. There is no mouth, eye or head rig. Pause stops every animated layer; the system reduced-motion preference disables motion; hidden tabs pause it. WebGL renders the background on load/resize/visibility restoration rather than continuously. If WebGL fails, the portrait remains on a simple atmospheric background with a status message.

To rebuild the checked-in forest bundle with the existing dependencies: `node node_modules/esbuild/bin/esbuild public/wild/portrait-proof/forest.js --bundle --minify --format=iife --outfile=public/wild/portrait-proof/forest.bundle.js`.

## Local assets

Assets remain ignored, outside the public repository, in `.tmp-scrum36/portrait-proof/`:
- `leader-original.jpg`: owner's first supplied portrait, originally `Character_portrait_for_Stakewolf_2K_20261015220039.jpg`. Original white background is real: JPEG has no alpha.
- `leader-cutout.png`: one built-in image-generation edit for background extraction. It has genuine alpha, but subtly changes face/skin and clothing detail. It is NOT a pixel-identical matte of the supplied image. Do not describe it as unchanged art. The original toggle makes that limitation inspectable. No additional generation pass was attempted.

In `/study`, Close-up and Portrait alter framing only. Neutral and Warm apply CSS colour treatment to the cutout; this is not physical relighting. Original displays the source without colour treatment and disables those controls. The comparison itself has no autonomous motion or GPU renderer. Asset-loading failures are visible and the alternate image remains selectable.

Public redistribution of artwork is not part of this test. The background-removal prompt and original verification are retained in `docs/evidence/scrum36-owner-portrait.md`; the forest checkpoint is in `docs/evidence/scrum36-forest-portrait.md`. No claim of production asset clearance, exact original facial fidelity, target-device performance or gameplay acceptance. Judge this one scene before expanding the cast.
