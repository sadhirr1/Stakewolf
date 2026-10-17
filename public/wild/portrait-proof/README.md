# SCRUM-36 — one leader in the forest

One human council leader supplied by the owner on October 15, 2026. The owner accepted this forest direction for a bounded playable test on October 17. This now contains one authored clearing encounter; it is not a complete game or a rigged 3D character. The owner declined the CC5 acquisition route.

## Play one night and the morning after

Enter the clearing and hear Orin and Sera disagree about who ordered the line loosened. Read both accounts to challenge Orin's denial. Choose whether to keep Orin, Sera or neither under watch, then allocate the remaining workers. A watch costs one of two workers; inspection and supplies each cost one, repair costs both. Watching Orin prevents his announced unchecked passage; leaving him free produces an injured traveler and a one-worker escort obligation tomorrow. Watching Sera also creates a witnessed-hearing obligation. Some accusations are mistakes: the options are not claimed to be equally effective.

Give orders once, advance to first light and inspect the witnessed event trail, tomorrow's available crew and retained work. Reading/challenging changes knowledge, not physical outcomes. Repair still needs inspection; an inspector cannot overrule the leader; supplies are exposed without an invented theft/loss. Orin and Sera are distinct from the two assignable workers. This is a fixed authored dispute, not randomized hidden roles or a complete Werewolf game.

Continue from dawn into a playable morning. The injured traveler's escort reserves one worker for the whole shift; otherwise both are available. Choose a two-person repair, verify an overnight repair and safe higher approach, protect outstanding stores, or spend a worker on a witnessed hearing. Same-shift repair cannot unlock verification. Commit once and advance to noon: the gate opens only after verification, supplies move only after completed protection, and a hearing records testimony without resolving allegiance or erasing custody history. Remaining work stays saved. This bounded test ends at noon.

Use **Look around the clearing** to see the timber crossing, its loose/reset line and closed/open gate, stores moving to a raised platform, and two lanterns representing worker activity. These markers are not animated bodies. Current conditions are also provided as accessible text. Desktop is the primary scene view; narrow screens crop the scene but retain all condition text and controls.

State saves locally under the retained key `stakewolf-clearing-v1`, with schema version 3. Schema2 upgrades without rewriting the night; schema1 committed nights retain original outcomes and cannot acquire a new morning with invented history. Old schema1 uncommitted plans retain crew but require the new council choice. Restart asks for confirmation and resets only this encounter. Unsupported/corrupt saves are rejected; unavailable storage leaves a usable in-memory attempt with a notice. No external feeds, live AI calls, victory score or hidden allegiance resolution. Play duration has not been measured.

Run the focused checks with `node --test tests/scrum36-clearing-encounter.test.mjs`. See [morning and scene verification](../../../docs/evidence/scrum36-living-clearing.md), [council dispute verification](../../../docs/evidence/scrum36-council-dispute.md) and the [preceding playable verification](../../../docs/evidence/scrum36-playable-clearing.md).

Run `node scripts/serve-portrait-proof.mjs` from the repository root and open http://127.0.0.1:4181/. The original comparison is retained at `/study`. No new dependencies. The server serves exact preview routes and the existing allowlisted forest assets, binding to loopback only. Other character models and repository files are not exposed. The main game, wolf proof and previous council proof are unchanged.

The encounter reuses the Poly Haven pine, fern, mossy rock and forest-floor assets already in `public/wild/assets/`; see their existing README for CC0 provenance. Worksite geometry is original code. The existing cutout is unchanged in this increment. Colour grading, a tiny whole-image breathing-like rise, drifting haze and six motes provide atmosphere. There is no mouth, eye or head rig. Pause stops animated layers; system reduced motion disables movement; hidden tabs pause. WebGL renders on changes plus bounded four-second worker-lantern trips capped at30fps; it stops after arrival. Paused/reduced-motion initial loads show assigned destinations. Work only completes via the explicit advance action, not elapsed real time. If WebGL fails, the portrait and playable textual state remain available with a status message. No performance benchmark or cinematic acceptance is claimed.

To rebuild the checked-in forest bundle with the existing dependencies: `node node_modules/esbuild/bin/esbuild public/wild/portrait-proof/forest.js --bundle --minify --format=iife --outfile=public/wild/portrait-proof/forest.bundle.js`.

## Local assets

Assets remain ignored, outside the public repository, in `.tmp-scrum36/portrait-proof/`:
- `leader-original.jpg`: owner's first supplied portrait, originally `Character_portrait_for_Stakewolf_2K_20261015220039.jpg`. Original white background is real: JPEG has no alpha.
- `leader-cutout.png`: one built-in image-generation edit for background extraction. It has genuine alpha, but subtly changes face/skin and clothing detail. It is NOT a pixel-identical matte of the supplied image. Do not describe it as unchanged art. The original toggle makes that limitation inspectable. No additional generation pass was attempted.

In `/study`, Close-up and Portrait alter framing only. Neutral and Warm apply CSS colour treatment to the cutout; this is not physical relighting. Original displays the source without colour treatment and disables those controls. The comparison itself has no autonomous motion or GPU renderer. Asset-loading failures are visible and the alternate image remains selectable.

Public redistribution of artwork is not part of this test. The background-removal prompt and original verification are retained in `docs/evidence/scrum36-owner-portrait.md`; the prior atmosphere checkpoint is in `docs/evidence/scrum36-forest-portrait.md`. No claim of production asset clearance, exact original facial fidelity, target-device performance or full-game acceptance. Judge this one playable scene before expanding the cast.
