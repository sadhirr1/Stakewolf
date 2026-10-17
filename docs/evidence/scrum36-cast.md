# SCRUM-36 — cast identity and encounter attention

October 13, 2026, America/Los_Angeles. Continues [PR22](https://github.com/sadhirr1/Stakewolf/pull/22) from `6c488d2d113a56b7ee8cd0b010f37a88627e09f2`. Jira: [SCRUM-36](https://sadhirr1.atlassian.net/browse/SCRUM-36), coordination SCRUM-18. Asset author `character_asset`; runtime author `character_runtime`; independent reviewer/test author `character_review`; integration, browser checks and independent test review by coordinator. These are agent roles.

## Delivered

- Orin uses the original brown coat, Vela the creator's ash variant and Sera the charcoal variant. These are actual alternate textures from the licensed source pack, not generated recolors. [Provenance and reproducible conversion](../../public/wild/assets/warg/VARIANTS.md).
- Each actor gets a distinct material instance, with shared immutable geometry, normal and roughness maps. External coat maps use sRGB and `flipY=false`. Every source smoothness-alpha sample was independently verified equal to the brown source.
- Focus blends a world-up head turn of at most approximately 22 degrees over the authored pose. Leaving focus blends it out. Head movement does not move the encounter camera or accumulate rotation across frames.
- Sera's first active encounter blends into IdlePant, then returns to Idle after at most two cycles (six seconds of active animation time). Revisiting does not restart it. Pauses, hidden tabs and frame-time clamping can extend its wall-clock duration.
- An actual scene check found Sera's charcoal face underlit. Her existing night portrait fill increased from 3.8 to 4.9; other characters and daylight retain their previous levels. No additional light or shadow pass was added.

## Verification

Independent [source, asset and focused-test review](scrum36-cast-review.md) found no blocking functional issue. The coordinator reviewed the four new tests against the shipped skeleton, including rotated-parent head turns without drift, material ownership, queued/hidden focus, and Sera's smooth return to idle without replay.

Final local full regression: **246 passed**, zero failures, skips or cancellations; Node 24.21.0, Windows, **3,035.465 ms**, exit 0. This measures test duration, not work hours. The cinematic bundle was rebuilt from the frozen sources. Remote checks are reported against the final commit in GitHub/Jira after publication.

Actual browser observations at 1280 × 720:

- [Brown Orin](local-scrum36-cast/orin-desktop.png), [ash Vela](local-scrum36-cast/vela-desktop.png), and [charcoal Sera during arrival](local-scrum36-cast/sera-desktop.png) loaded with readable dialogue and visible heads/ears.
- [Sera settled](local-scrum36-cast/sera-settled.png) returned to a closed-mouth idle. [Refocusing](local-scrum36-cast/sera-revisited.png) retained idle rather than replaying the arrival pant. The real-rig tests verify the sequence more precisely than these spaced captures.
- Pause changed the control to Resume. Two separately captured screenshots were byte-identical while paused; resume restored motion. [Paused capture](local-scrum36-cast/sera-paused.png).
- A paused desktop-to-390 × 844 resize and focus change remained usable. [Narrow Vela](local-scrum36-cast/vela-mobile.png) keeps the head above the opaque reading panel and close/back/motion controls visible. Temporary viewport override reset afterward.
- No warnings/errors were present in the inspected browser log. No physical-phone, broad hardware, full frame-by-frame clipping or new missing-asset browser test is claimed.

## Size and limitations

The unchanged GLB is 3,169,108 bytes. The two coats add **571,992 bytes**: ash 324,417 and charcoal 247,575. Active assets total **13,552,884 bytes**; all preserved assets total **14,508,212 bytes**. Bundle: **928,739 bytes**. Exact hashes live in the manifest and independent review. Transfer/frame-budget targets remain unmet; performance was not newly benchmarked in this increment.

The reviewer found the coats distinguishable, but Sera's face still has weaker definition than Orin/Vela. The shared quadruped, coarse pointed fur, lack of facial acting/walking/lip-sync and contact-patch-only character shadows remain visible compromises. This is not the final anthropomorphic cast or owner-approved cinematic quality. No story expansion, outside-data service, campaign, save system or deployment was introduced.

Next: review the actual moving cast with the owner and resolve suitable final character art before wider scenery/story expansion. November 6 candidate / November 13 release-decision targets remain at risk. Schedules stay off; local preview stays at `http://127.0.0.1:4174/wild/`.
