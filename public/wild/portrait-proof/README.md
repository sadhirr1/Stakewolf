# SCRUM-36 — owner artwork portrait test

One human council leader supplied by the owner on October 15, 2026. This is a local 2D art-direction test, not a 3D character, game integration, facial animation, new story or release acceptance. The owner declined the CC5 acquisition route.

Run `node scripts/serve-portrait-proof.mjs` from the repository root and open http://127.0.0.1:4181/. No new dependencies. The server serves five exact routes and binds to loopback only. The main game, wolf proof and previous council proof are unchanged.

## Local assets

Assets remain ignored, outside the public repository, in `.tmp-scrum36/portrait-proof/`:
- `leader-original.jpg`: owner's first supplied portrait, originally `Character_portrait_for_Stakewolf_2K_20261015220039.jpg`. Original white background is real: JPEG has no alpha.
- `leader-cutout.png`: one built-in image-generation edit for background extraction. It has genuine alpha, but subtly changes face/skin and clothing detail. It is NOT a pixel-identical matte of the supplied image. Do not describe it as unchanged art. The original toggle makes that limitation inspectable. No additional generation pass was attempted.

Close-up and Portrait alter image framing only. Neutral and Warm apply CSS colour treatment to the cutout; this is not physical relighting. The Original option displays the source without colour treatment and disables those controls. All buttons are keyboard-accessible; no autonomous motion or GPU renderer is used. Asset-loading failures are visible and the alternate image remains selectable.

Both source and cutout await owner art approval. Public redistribution of artwork is not part of this test. The exact background-removal prompt and verification record are retained in `docs/evidence/scrum36-owner-portrait.md`. No claim of production asset clearance, exact facial fidelity, target-device performance or gameplay acceptance.
