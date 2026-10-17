# SCRUM-36 — animated cast checkpoint

October 13, 2026, America/Los_Angeles. Asset author: `character_asset`; runtime author: `character_runtime`; independent reviewer/test author: `character_review`; integration, browser execution and independent test review: coordinator. These are agent roles. Source destination: [PR22](https://github.com/sadhirr1/Stakewolf/pull/22), continuing parent `cd301ae40dca24baf815137bde2fa1f4cb32b82e`. Jira: [SCRUM-36](https://sadhirr1.atlassian.net/browse/SCRUM-36), coordination SCRUM-18.

## Delivered behavior

The active forest now loads a real skinned wolf with 41 joints and authored idle motion. Five cast instances share immutable geometry/materials but own their bones, animation clocks and bone textures. Their idle phases differ. Hidden morning-party characters do not accumulate animation time. Pause, reduced motion and hidden-page guards stop animation updates; resuming caps elapsed time to avoid a jump. Encounter cameras sample the actual head position without following each head movement.

The model's saddle and mask are removed. Old static collars were removed because they would not follow the animated neck. Moving wolves receive forest shadows and use terrain-conforming soft contact patches; they do not cast articulated shadows into the cached environment map. This is a performance/quality compromise, not realistic character shadowing.

The acquired CC0 Warg is 7,071 triangles with 1K coat, normal and roughness textures. Idle (4 seconds) is used; IdlePant (3 seconds) remains packaged. The [provenance and conversion record](../../public/wild/assets/warg/README.md) retains creator links, source checksum, licensing, AI/code-generated origin, exact normalization and a reproducible offline converter. No source scripts, purchases, installs or hosted services were needed.

## Findings resolved

The first actual render exposed black/purple/green patches that geometry checks could not detect. The FBX's vertex colors were authoring masks, mistakenly exported as visible glTF colors. The asset author removed them; QA added a regression check. [Failure capture](local-scrum36-character/candidate-material-failure.png) and [corrected candidate](local-scrum36-character/candidate-fixed.png) are retained. The coordinator also compared the optimized texture version under the same showroom lighting before integration.

JPEG coat/normal textures and removal of redundant animation keys reduced the corrected 5,657,296-byte PNG version to **3,169,108 bytes**. Independent sampling found identical animation interpolation at original keys and 120 Hz samples. JPEG texture conversion is lossy; full 1024-pixel dimensions were retained.

## Actual verification

- Independent source/provenance review and four focused tests: [review record](scrum36-character-review.md). The coordinator separately reviewed the tests' assertions against real skin data, deformation, clone isolation, hidden/invalid clock input and resource ownership.
- Final full local regression: **242 passed, zero failures/skips/cancellations**, Node 24.21.0 on Windows, **3,478.9861 ms**, exit 0. The first sandbox invocation could not connect to loopback (`EACCES`); rerunning the same suite with authorized localhost access passed. This is test duration, not work hours.
- Built the committed cinematic bundle with the pinned build tool. Bundle: **927,026 bytes**. Exact runtime/model identities are in the independent review and asset manifest. Remote CI result is recorded on the resulting PR and in Jira after publication.
- Actual desktop Orin, Vela and Sera encounters displayed the corrected coat, visible head/ears and readable controls. Spaced captures span more than a full four-second idle cycle and show differing poses; this is sampled observation, not an exhaustive frame-by-frame clipping test. [Orin frame A](local-scrum36-character/orin-motion-a.png), [frame B](local-scrum36-character/orin-motion-b.png), [Vela](local-scrum36-character/vela-desktop.png), [Sera](local-scrum36-character/sera-desktop.png).
- Pause visibly changed the control to Resume. Two screenshots taken at separate times while paused were byte-identical. Resume restored motion. A paused narrow-to-desktop resize and a paused Vela-to-Sera focus change remained usable. [Paused Orin](local-scrum36-character/orin-paused.png).
- Actual **390 × 844** Vela encounter kept the face above the opaque reading panel and retained close/back/motion controls. [Mobile capture](local-scrum36-character/vela-mobile.png). This is browser viewport testing, not physical-phone performance validation. Temporary viewport overrides were reset.
- The inspected integrated preview emitted no browser warnings/errors. The new missing-model browser case was not deliberately induced; the earlier forest record retains a required-texture failure check, and the current regression checks all packaged asset routes/dependencies.

One local reload measured asset readiness at **4,766 ms**. Its first 117 frame intervals averaged **60.016 ms**; after automatic resolution reduction, the next 238 averaged **25.934 ms** at a 1201 × 684 drawing buffer. These are animation-frame intervals on this machine, influenced by browser scheduling, not GPU timings or a broad performance guarantee. The values are included because performance remains a release risk.

## Limits and next action

This delivers real character animation but does not meet the requested cinematic visual bar. All roles still use the same provisional quadruped. Pointed fur, coarse close-up detail, character differentiation, facial acting, walking, lip-sync, articulated shadows and wider hardware performance remain unresolved. The owner's supplied JPG is a visual reference rather than an acquired rigged model. No new story system, external input adapter, saving or dynamic campaign was delivered.

All 23 preserved runtime asset files total **13,936,220 bytes**. The active scene loads 22 of them totaling **12,980,892 bytes**, plus the bundle; it no longer requests the earlier static wolf. The earlier transfer target remains unmet.

Next: review this actual moving encounter with the owner and resolve a coherent, portrait-suitable final cast/animation direction before expanding scenery or story. November 6 candidate / November 13 decision targets remain at risk. Schedules stay off. Main preview: `http://127.0.0.1:4174/wild/`; the temporary conversion showroom is stopped. Local root changes outside the named increment are preserved.
