# SCRUM-36 — one leader in the forest

One human council leader supplied by the owner on October 15, 2026. The owner accepted this forest direction for a bounded playable test on October 17. This now contains one authored clearing encounter; it is not a complete game or a rigged 3D character. The owner declined the CC5 acquisition route.

## Play one night

Enter the clearing and hear Orin and Sera disagree about who ordered the line loosened. Read both accounts to challenge Orin's denial. Choose whether to keep Orin, Sera or neither under watch, then allocate the remaining workers. A watch costs one of two workers; inspection and supplies each cost one, repair costs both. Watching Orin prevents his announced unchecked passage; leaving him free produces an injured traveler and a one-worker escort obligation tomorrow. Watching Sera also creates a witnessed-hearing obligation. Some accusations are mistakes: the options are not claimed to be equally effective.

Give orders once, advance to first light and inspect the witnessed event trail, tomorrow's available crew and retained work. Reading/challenging changes knowledge, not physical outcomes. Repair still needs inspection; an inspector cannot overrule the leader; supplies are exposed without an invented theft/loss. Orin and Sera are distinct from the two assignable workers. This is a fixed authored dispute, not randomized hidden roles or a complete Werewolf game.

State saves locally under the retained key `stakewolf-clearing-v1`, with schema version 2. Reload restores the same plan or immutable committed result. Version 1 committed nights retain their original outcomes with no retroactive incident; old uncommitted plans keep crew assignments but must read the changed accounts and choose a watch. Restart asks for confirmation and resets only this encounter. Unsupported/corrupt saves are rejected; unavailable storage leaves a usable in-memory attempt with a notice. The next morning's work is recorded but not playable in this increment. There are no external feeds, live AI calls, victory score or hidden allegiance resolution. Target length is a short encounter; play duration has not been measured.

Run the focused checks with `node --test tests/scrum36-clearing-encounter.test.mjs`. See [council dispute verification](../../../docs/evidence/scrum36-council-dispute.md) and the [preceding playable verification](../../../docs/evidence/scrum36-playable-clearing.md).

Run `node scripts/serve-portrait-proof.mjs` from the repository root and open http://127.0.0.1:4181/. The original comparison is retained at `/study`. No new dependencies. The server serves exact preview routes and the existing allowlisted forest assets, binding to loopback only. Other character models and repository files are not exposed. The main game, wolf proof and previous council proof are unchanged.

The encounter reuses the Poly Haven pine, fern, mossy rock and forest-floor assets already in `public/wild/assets/`; see their existing README for CC0 provenance. The supplied cutout is unchanged in this increment. Colour grading, a tiny whole-image breathing-like rise, drifting haze and six motes provide atmosphere. There is no mouth, eye or head rig. Pause stops every animated layer; the system reduced-motion preference disables motion; hidden tabs pause it. WebGL renders the background on load/resize/visibility restoration rather than continuously. If WebGL fails, the portrait remains on a simple atmospheric background with a status message.

To rebuild the checked-in forest bundle with the existing dependencies: `node node_modules/esbuild/bin/esbuild public/wild/portrait-proof/forest.js --bundle --minify --format=iife --outfile=public/wild/portrait-proof/forest.bundle.js`.

## Local assets

Assets remain ignored, outside the public repository, in `.tmp-scrum36/portrait-proof/`:
- `leader-original.jpg`: owner's first supplied portrait, originally `Character_portrait_for_Stakewolf_2K_20261015220039.jpg`. Original white background is real: JPEG has no alpha.
- `leader-cutout.png`: one built-in image-generation edit for background extraction. It has genuine alpha, but subtly changes face/skin and clothing detail. It is NOT a pixel-identical matte of the supplied image. Do not describe it as unchanged art. The original toggle makes that limitation inspectable. No additional generation pass was attempted.

In `/study`, Close-up and Portrait alter framing only. Neutral and Warm apply CSS colour treatment to the cutout; this is not physical relighting. Original displays the source without colour treatment and disables those controls. The comparison itself has no autonomous motion or GPU renderer. Asset-loading failures are visible and the alternate image remains selectable.

Public redistribution of artwork is not part of this test. The background-removal prompt and original verification are retained in `docs/evidence/scrum36-owner-portrait.md`; the prior atmosphere checkpoint is in `docs/evidence/scrum36-forest-portrait.md`. No claim of production asset clearance, exact original facial fidelity, target-device performance or full-game acceptance. Judge this one playable scene before expanding the cast.
