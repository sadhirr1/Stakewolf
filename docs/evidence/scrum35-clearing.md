# SCRUM-35 — preserved clearing and encounter prototype

Coordinator record, October 12, 2026, America/Los_Angeles. [SCRUM-35](https://sadhirr1.atlassian.net/browse/SCRUM-35), parent PR20 / `be9f216e6fb35a659b0a449d3fd1fa9026fbde5f`.

The owner subsequently rejected this level of procedural graphics as the visual target and requested a desktop-first cinematic approach, followed by story and evolution from both player and outside inputs. These observations preserve technical evidence; they do not establish visual acceptance or a finished game. See the October 12 direction in `../revised-release-plan.md`.

## Actual browser observations

Codex in-app browser, local updated server on `http://127.0.0.1:4175/wild/`. The owner's existing played tab at port 4174 was left intact. Temporary viewport sizes were used, not physical phones/tablets.

- At 1440 x 900, entered the clearing and approached Orin and Sera. New character geometry and the revised shaders rendered; the face was composed to the left and the compact account panel to the right. Sera's walking staff remained visually coherent in the observed encounter after the renderer author's animation-weight correction prompted by QA.
- Expanded Orin's full account with Enter. Original detail/caution text remained readable. Paused and resumed through the in-dialog control; header and modal labels agreed. Escape closed the encounter and returned focus to Orin's heard-account button.
- At 900 x 800, the expanded Sera account stayed beside the face; its content and return/motion controls were reachable within the scrolling dialog.
- At 390 x 844, Vela's face stayed above the bottom encounter panel. Expanded text and buttons were reachable by keyboard, which scrolled the dialog to the controls. Pause/resume and Escape return were exercised. After the background scroll-lock correction, document width equaled viewport width (390), with no horizontal overflow; the account itself had 438 px visible height and 570 px content height.
- The coordinator requested less flat frontal light after inspecting the first Orin rendering. The renderer author lowered character fire/ambient contributions and shifted the selected-character fill off camera. The resulting Orin desktop and Vela mobile views remained readable. This is an appearance observation, not an objective cinematic-quality score.
- After resuming the preview connection following a host interruption, the council controls and the heard-account state were present. No final full night-to-morning replay was completed on this visual increment before the owner changed direction.

Local supporting captures are in `docs/evidence/local-scrum35/`: `encounter-before.png`, `encounter-after.png`, `sera-after.png`, `tablet-account.png`, `mobile-encounter.png`, `mobile-account.png`. Some intermediate images precede the final lighting/scroll-lock refinement. The sanitized observations here and QA's reviewed results are the durable evidence; local image existence alone is not a published artifact claim.

## Limits and retained work

Characters are original procedurally constructed geometry with restrained vertex motion, not a supplied rigged wolf model. There are no imported production textures, facial-performance system or measured hardware frame times. The new cast contains 34,974 vertices across three characters; the renderer author reports the main scene at 271,842 vertices with 15 buffers and three programs. These geometry counts are not FPS evidence.

Gameplay state remains unchanged from SCRUM-34. The automated results and source hashes are in `scrum35-review.md`; the fixture-based renderer tests cannot prove appearance or actual GPU speed. No physical-phone, actual OS reduced-motion, screen-reader, 200% zoom, deployment, merge or production release acceptance is claimed. No plugin, dependency, payment or schedule was added in this preserved prototype increment.
