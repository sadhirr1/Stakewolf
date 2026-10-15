# SCRUM-36 — character portraits and forest depth

Manual session: October 15, 2026, America/Los_Angeles. This continues the owner-requested visual work from `f1735c2fc576547ce10d7d11a2d1ecd3c786af20` on [PR22](https://github.com/sadhirr1/Stakewolf/pull/22). That preceding fur checkpoint passed [remote CI](https://github.com/sadhirr1/Stakewolf/actions/runs/38688810606). The owner paused before its Jira completion note; that record was reconciled at the start of this session.

## Scope and ownership

The owner requested more cinematic wolves and surroundings. Character appearance is owned by `character_asset`; environment composition and lighting by `character_runtime`; independent source, geometry and image review by `character_review`. The coordinator owns integration, actual browser comparisons, review of the tests, final checks and publication. These names describe agent responsibilities, not employees or separate Jira identities.

The previous prototype has an overbright flat iris, broad muzzle, coarse ears, weak charcoal-coat illumination and a repetitive exposed treeline. This increment addresses the face and surrounding depth. It does not add story, external inputs, a campaign, saved progress, purchases or schedules. The November 6 candidate and November 13 release-decision targets remain at risk. Test passes do not establish cinematic quality or owner acceptance.

## Actual baseline

The coordinator opened the running game at `http://127.0.0.1:4174/wild/`, entered the council, hid the reading panel, paused motion and recorded the forest. Vela and Sera were then opened through normal controls while paused. The desktop comparison viewport is 1280 × 720 CSS pixels. Different idle/attention phases are possible between visits; these are qualitative comparisons, not pixel-matched image regressions.

- [Forest before](local-scrum36-portrait/forest-before.png)
- [Vela before](local-scrum36-portrait/vela-before.png)
- [Sera before](local-scrum36-portrait/sera-before.png)

## Result and verification

### Retained changes

- The three coats retain their identity. A bounded muzzle refinement narrows and lengthens the front of the existing mesh; source UVs, weights, rig and clips remain unchanged. Projected iris/pupil detail replaces the bright painted oval, with a darker nose response. This adds no meshes or draws. [Asset implementation and measurements](scrum36-portrait-asset.md).
- Sera's existing portrait area light moves toward her viewed side with a neutral fill, revealing her face and neck. Orin and Vela retain a warmer shaped light. No new light or shadow pass was added.
- Height-aware distance haze softens the ground/sky boundary. Six additional instances of the already loaded scanned pine provide real branch overlap and varied heights. Existing procedural trunks are less uniform. [Environment implementation and cost](scrum36-atmosphere.md).

The first eye candidate read as a hollow socket and the first forest candidate as sawtooth cutouts. Increasing the iris coverage resolved the socket issue. A second flat-tree revision still read as pointed blobs; all flat silhouette geometry was removed. The retained environment uses scanned tree geometry. These were actual browser findings, not merely hypothetical reviews. Rejected captures: [first forest](local-scrum36-portrait/forest-candidate.png), [first Vela](local-scrum36-portrait/vela-candidate.png).

### Actual browser evidence

| View | Before | Retained result |
| --- | --- | --- |
| Council forest | [Before](local-scrum36-portrait/forest-before.png) | [After](local-scrum36-portrait/forest-after.png) |
| Sera, charcoal | [Before](local-scrum36-portrait/sera-before.png) | [After](local-scrum36-portrait/sera-after.png) |
| Vela, ash | [Before](local-scrum36-portrait/vela-before.png) | [After](local-scrum36-portrait/vela-after.png) |
| Orin, brown | [Before](local-scrum36-portrait/orin-before.png) | [After](local-scrum36-portrait/orin-after.png) |

The coordinator inspected all three desktop portraits at 1280 × 720, resumed Sera's animation and paused it again, then resized a paused Vela encounter to 390 × 844 and back. [Sera in motion](local-scrum36-portrait/sera-motion.png) and [narrow fallback](local-scrum36-portrait/vela-mobile.png) are retained. The narrow fallback deliberately retains the simpler groom. Animation phases and head angles differ between visits, so these are qualitative appearance comparisons, not pixel-matched tests.

Through ordinary game controls, the coordinator examined the downstream anchor, committed the crew to repair, and advanced to first light. The new trees did not obstruct the [crossing inspection](local-scrum36-portrait/crossing-night.png); the [morning council](local-scrum36-portrait/forest-dawn.png) retained clear sightlines and changed lighting. Final browser console warnings/errors returned an empty list. No GPU timing or physical-phone test is claimed.

### Independent review and checks

`character_review` independently reviewed source and actual images, authored four meaningful checks against the shipped rig/materials, and reported the forest depth and Sera readability improvements. The coordinator independently reviewed the tests, including the final haze test that replaced an obsolete silhouette test. QA found an undefined `atan(0,0)` calculation on non-eye fragments; the author guarded it before the final build. [Full independent findings and frozen identities](scrum36-portrait-review.md).

- Final focused suite: **4 passed**, zero failures/skips; **533.2004 ms**, exit 0.
- Full frozen suite: **254 passed**, zero failures/skips; **2,760.2335 ms**, exit 0. The initial sandbox attempt could not connect to temporary local HTTP sockets (`EACCES`); repeating the same suite with local-network permission passed. This was an execution-permission failure, not an application pass.
- Final cinematic build succeeded. The generated bundle is **950,513 bytes**. Author syntax checks passed. Final GPU shader composition was exercised by the actual browser views above.
- Six extra scanned pines add **146,916 triangles**, in existing instanced material draws. Small trunk subdivision changes add further geometry. No image/model download or additional asset payload was introduced; active assets remain **13,914,280 bytes**. Geometry counts do not establish frame-rate performance or acceptable download time.

### Remaining work and delivery limits

The faces remain low-detail: ear shape, teeth exposure, eyelids, facial expression and base maps need substantially better authored character art. The iris is readable, but the captures do not demonstrate a convincing wet corneal glint. The finer portrait fur belongs to the preceding checkpoint; it is not counted again as new work. No extra story or dynamic-input service was added. Hardware performance and the transfer target remain unresolved. The owner has not accepted this as cinematic quality.

This reviewed increment continues draft PR22 under SCRUM-36, with coordination on SCRUM-18. The final commit and exact remote CI outcome are recorded on GitHub/Jira to avoid a self-referential commit identity in this file. Schedules remain off. No billable-hour claim, purchase, reset-credit use or release declaration is made.
