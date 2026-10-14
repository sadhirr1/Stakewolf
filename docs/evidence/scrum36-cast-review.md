# SCRUM-36 — independent cast identity and attention review

October 13, 2026. Reviewer: `character_review`; runtime author: `character_runtime`; coat preparation: `character_asset`; integration, browser execution and test review: coordinator. These are agent roles. Scope is the cast increment on the existing PR #22 character checkpoint: brown Orin, ash Vela, charcoal Sera, bounded head attention, and Sera's brief first-encounter pant. It does not establish owner acceptance of the cinematic target.

## Independent asset checks

The existing CC0 creator archive and GLB provenance are covered in [the previous character review](scrum36-character-review.md). This increment uses the same archive's actual `T_Warg_Ash.png` and `T_Warg_Black.png`, with the conversion and checksums documented in [VARIANTS.md](../../public/wild/assets/warg/VARIANTS.md). No new model or creator script is executed.

This reviewer read the offline conversion script and independently decoded the source PNGs and shipped JPEGs with the existing Sharp 0.35.5 runtime. Both variants are 1024 × 1024. Each variant's **1,048,576 alpha samples exactly match the brown source**, so reusing its derived roughness map is compatible. The shipped JPEGs are opaque and use 4:4:4 chroma. Mean absolute decoded RGB error against the vertically flipped source was **1.16064 / 255 for ash** and **0.95612 / 255 for black**; error against the wrong, unflipped orientation was 27.11486 and 14.82034 respectively. JPEG compression is lossy; this does not claim identical source pixels.

The two coats add **571,992 bytes**. Their hashes match the manifest and author provenance. The **3,169,108-byte GLB remains unchanged**. Source review confirms that the externally loaded, already-flipped coats use `flipY = false` and sRGB, retain the shared normal/roughness maps, and receive separate scene-owned material instances. The two server routes remain explicit JPEG allowlist entries. The manifest records 25 retained files / 14,508,212 bytes; the active set excludes the retained old static wolf.

## Runtime and focused verification

No blocking source finding was found. Each actor retains its own bones, animation clock, focus intent and material instance. Focus requests copy a finite target and do not advance the pose. The helper restores the authored head rotation before each mixer update, then adds an eased, approximately 22-degree yaw around world up. This avoids accumulating the previous frame's overlay or accidentally rotating about the character's tilted local axis.

Sera's first focused, visible animation update starts two IdlePant loops with a 0.45-second entrance fade and a 0.65-second return to Idle. It is a one-time sequence per loaded actor; repeat focus calls and later refocusing do not restart it. The scene's paused, reduced-motion and hidden-document guards precede character updates. Hidden ancestor groups also suppress helper updates. Rendering, resizing and focus changes do not themselves advance the rig. Cleanup releases each skeleton before scene-owned materials/textures and the renderer. A required coat-load rejection follows the existing asset-failure fallback path.

On Windows/PowerShell with Node.js 24.21.0, this reviewer executed **`node --test tests/scrum36-cast.test.mjs` once after the source freeze**: **4 passed, 0 failed, 0 skipped, 0 cancelled; 846.2059 ms; exit 0**. These tests import the actual packaged rig and clips, omitting image decoding from their CPU fixture:

1. Separate coat materials preserve the source and peer maps; helper disposal leaves scene-owned materials/textures alive and another actor usable.
2. Twelve seconds of head attention under a rotated parent remain bounded about world up, do not alter other actors or the template, and ease back to the authored animation when focus clears.
3. Mutating a caller's target does not alter copied focus intent; hidden or invalid updates cannot start pending attention/pant motion; a non-finite target safely clears focus.
4. The actual jaw moves during the one-time pant, has bounded per-step changes at the fades, returns to its idle pose after seven seconds, and does not restart after refocusing.

The coordinator independently reviewed these new tests and executed the final local full suite: **246 passed, zero failures/skips/cancellations, 3,035.465 ms, exit 0**. This reviewer did not duplicate that run. CPU assertions do not measure GPU memory, frame rate, visual quality or browser preference behavior.

## Retained visual evidence and limits

This reviewer independently inspected the coordinator's [Orin desktop](local-scrum36-cast/orin-desktop.png), [Vela desktop](local-scrum36-cast/vela-desktop.png), [Sera desktop](local-scrum36-cast/sera-desktop.png) and [Vela narrow](local-scrum36-cast/vela-mobile.png) captures. Brown Orin and ash Vela are visibly distinct. Desktop faces/ears and the dialogue controls fit; at 390 × 844, Vela's face remains above the readable panel. These are static-image checks, not independent browser execution or physical-phone testing.

The coordinator separately reports two byte-identical paused captures, successful resume, and paused resize/refocus. No new reduced-motion, hidden-page or forced coat-load-failure browser execution is claimed by this reviewer. Those paths were source-reviewed; the existing asset/route suite is the coordinator's execution responsibility.

**Art remains provisional.** Sera's charcoal face has weaker eye/facial definition than Orin and Vela despite its stronger night fill. The same coarse quadruped mesh and fur silhouette still serve all three characters; coats and a brief pant do not provide distinct anatomy, bespoke performances, speech or final cinematic quality. This limitation was reported to the coordinator and is not represented as owner acceptance.

## Reviewed SHA-256 identities

| File | SHA-256 |
| --- | --- |
| `public/wild/character.js` | `9d8ed1555f8dd76d445b3d797cb8f479b98ea16c135b76684ce9be9be301dfda` |
| `public/wild/cinema.js` | `6cbc073dbd55b3206792ddff1e22beaff6023e7f5691a22af5fadd4f82f159d8` |
| `public/wild/assets/warg/warg.glb` | `e97b8563f061bb59f94090c0fceb96c7bc71e4517b360767c87ecc184b735026` |
| `public/wild/assets/warg/ash.jpg` | `c5fe52a844c3c57468649ce13efcc6e2b771740a2f944d03cda1e2de5d4a6730` |
| `public/wild/assets/warg/black.jpg` | `dd98e2618dfe2ec7ecfcedf3c4dabd5b221fc398fb9712cfed675502efc11c4f` |
| `scripts/asset-prep-warg-variants.mjs` | `8cef25dfa817a7098d8930633456348077581cc018d3d6a3566dc3af69fb25aa` |
| `public/wild/assets/warg/VARIANTS.md` | `18ec9507f299aae15c221f7423a7157a42fb39f5cb90c37827a0fbedda15fd0b` |
| `public/wild/assets/manifest.json` | `0a123538ac224a0ad10344c351c179be2e216bed3c5a36fbcb6b77c65f5f29a5` |
| `server.mjs` | `20dd4ffb5a880e2cc225fb928188fe7124c47634a65a5cd9f1144ce47efc9c6f` |
| `tests/scrum36-cast.test.mjs` | `c2f732847233bb89d6ed706ffb44b63d1f0f92df43f7c1471079d7ec826d0feb` |

The reviewer also checked the current README direction, latest HANDOFF section, asset README counts, browser evidence record and in-app credits against these facts; no material overclaim was found. Historical counts remain labeled, and the local results are not presented as remote CI or owner acceptance.

No blocking functional finding remains for this bounded increment. Target hardware performance, stronger close-up character art and owner visual acceptance remain open.
