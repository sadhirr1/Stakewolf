# Stakewolf — start here

Last direction/checkpoint update: October 12, 2026, SCRUM-36 / coordination SCRUM-18.

## Read this before continuing

The owner rejects the present low-detail graphics as the target and rates overall depth at roughly 4% of expectations. Do not interpret prior encouraging feedback or passing tests as visual acceptance. Current priority: **looks/feel first, then story**. Target **desktop/laptop first with a simpler mobile fallback**. The eventual world must respond to **both player input and outside information**. The October 12 override at the top of `revised-release-plan.md` supersedes incompatible fixed workplace-case assumptions.

Next output: one materially different visual benchmark, a playable forest arrival plus a character encounter using coherent authored models/materials/animation and deliberate lighting. Review its actual appearance and motion with the owner before widening the world. More procedural primitive detail alone is not the accepted route. A browser rendering library is a proposed application dependency, not a plugin the player installs. Actual asset sourcing, licensing, animation requirements, target hardware and any cost must be resolved concretely.

Keep the reusable gameplay state, history, rules and interaction checks. Future input adapters should translate player/outside information into validated world events; they must not let generated narration overwrite facts or history. No external feed, model service, saving system or dynamic campaign has been built in this checkpoint.

## SCRUM-36 forest rendering benchmark

The active `/wild/` now loads a local Three.js bundle, scanned ground/bark materials, fern and rock models, four detailed pine trees and provisional textured wolf meshes. Loading is explicit, required-asset failures retain the readable game, and desktop rendering can lower its drawing resolution after measuring slow frame intervals. All files are served locally; players install no plugin. The previous renderer remains preserved but is no longer loaded by the game.

This is a technical and environmental-art checkpoint, **not completion of the cinematic target**. The 3,024-triangle wolf has a 512-pixel texture, no rig and no authored animation. It is not the owner's anthropomorphic reference. Its replacement is the next visual priority. Do not expand the story to compensate for that gap or treat the current animal encounter as accepted character art.

- Renderer author: `hollow_scene`; asset preparation and provenance: `cinema_assets`; integration/UI/build/browser: coordinator; independent renderer QA and test author: `hollow_cast`. The coordinator reviewed the new tests; `cinema_assets` independently reviewed integration and license delivery.
- Full frozen regression: **238 passed**, zero failures/skips. After a narrowly scoped camera-sightline tree exclusion, **six focused checks passed**, plus renderer/bundle syntax. Final identities and review limitations: [independent review](evidence/scrum36-review.md).
- Browser verification includes an Orin encounter, responsive 390 × 844 layout, required-texture failure, and night decision through guided crossing in the morning. The foreground tree obstruction found during that playthrough was fixed and visually retested. Actual screenshots and performance limits: [browser record](evidence/scrum36-forest.md).
- Assets total **10,767,112 bytes** plus a **662,816-byte** bundle. This exceeds the earlier proposed 1 MB transfer target. Local frame-interval samples do not establish broad hardware performance; physical-phone and slower-network validation remain pending.
- Delivery branch: `codex/SCRUM-36-forest-materials`, based on PR21 / `codex/SCRUM-35-cinematic-clearing` at `bbf2e210ca6058102bc9305e515e228dd8767089`. Jira [SCRUM-36](https://sadhirr1.atlassian.net/browse/SCRUM-36) and coordination SCRUM-18 carry the resulting PR and integration identity. The draft stack remains unmerged.
- Restart an older preview server because the new asset routes are explicit. `node server.mjs 4174`, then `http://127.0.0.1:4174/wild/`. The generated bundle is committed, so viewing needs Node only. Authoring/testing additionally needs `npm ci --ignore-scripts` and `npm run build:cinema`.

Next: obtain and validate one coherent, properly rigged character with usable animations and suitable license, then improve its encounter staging against the owner's actual visual feedback. No suitable modern candidate was downloaded behind an authentication requirement; no paid asset or service was purchased. Next sessions must inspect live Jira/PR state before editing this dirty root. Do not stage unrelated files.

Both player input and outside information remain future input sources. No live feed, AI service, save system or dynamic campaign was introduced. Schedules stay off; November 6/13 scope and delivery risks remain unresolved.

## SCRUM-35 technical preservation checkpoint — historical

The interrupted session added original procedural wolf geometry in `public/wild/cast.js`, richer clearing geometry and lights, encounter cameras and restrained idle motion, compact expandable dialogue and a motion control inside the modal. This is preserved experimental work, not fulfillment of the owner's revised visual bar. State rules remain at SCRUM-34.

- Character author: `hollow_cast`; scene author: `hollow_scene`; UI/integration: coordinator; independent review/test author: `hollow_qa`. Coordinator independently reviewed all ten new tests and inspected desktop/tablet/mobile encounters.
- QA recovered the completed full regression from before interruption: **232 passed, zero failures/skips**, plus wild module syntax checks. See `evidence/scrum35-review.md` for execution details and final source identity. No new full suite is needed solely because the chat resumed.
- Actual browser checks and limitations are recorded in `evidence/scrum35-clearing.md`. No GPU frame-time measurement, full final morning replay, production deployment or owner visual acceptance is claimed for this increment.
- Intended preservation branch: `codex/SCRUM-35-cinematic-clearing`, parent PR20 / `be9f216e6fb35a659b0a449d3fd1fa9026fbde5f`. GitHub/Jira carry the integration commit and draft PR once published. Existing draft chain remains unmerged.
- A new explicit `/wild/cast.js` server route requires restarting an older preview server; refreshing the page alone is insufficient. Run `node server.mjs 4174` after stopping the old server and use `http://127.0.0.1:4174/wild/`.

Schedules remain off. The November 6/13 targets require scope and delivery reassessment. No purchase, paid-service integration or deadline change is authorized by this record.

## Previous SCRUM-34 checkpoint — historical working baseline

## Current direction

The owner rejected the office framing and asked for a real 3D cinematic skeleton in the wilderness, combining Werewolf and product-management decisions. After trying the forest prototype, the owner said it was progressing and asked to expand it. This authorizes continued development in that direction, not final visual acceptance or a full release. No plugin installation, paid runtime service, or automatic schedule is authorized by this checkpoint.

## Working result

- `/wild/` is **The Hollow**, a separate native WebGL forest prototype. SCRUM-34 adds a playable morning after SCRUM-33's encounters and dawn report. Begin the morning, visit the crossing or trail, preview the cost and assign Sera once. A work ledger preserves obligation identity, owner, origin and changed status.
- Repair + crossing guides a small first party across; hold + crossing only establishes the slipping fastening and leaves repair pending. Either trail assignment discovers undated tracks and defers the crossing work. The unselected task and waiting families remain visible. A rested crew is not invented after overnight repair.
- World variants show an arriving party, a flagged defective anchor, or trail inspection markers. Repair at dawn now uses a secured fastening mesh. Viewing the scene compacts the heading so it does not cover the action.
- Night evidence, commitment-time evidence and first-light reports remain historical. Morning inspection is a separate finding. Replay clears the assignment and world variant. This is one night plus one constrained morning assignment, not the full campaign or a general backlog simulator.
- `/` retains the earlier Relay game and its owner-art opening. Existing mechanics may be reused selectively; the earlier workplace narrative is not the accepted direction for the new world.
- Run `node server.mjs 4174`, then open `http://127.0.0.1:4174/wild/`. The coordinator left this preview server running for the owner at the end of this session. Restart it if the process has ended.
- Delivery branch: `codex/SCRUM-34-morning-promises`, based on PR19 (`codex/SCRUM-33-hollow-dawn`, `d15c094ad88d63df212d85839f94d3164ae92f90`). The earlier PR chain remains unmerged. Only named runtime, test and handoff files belong to this checkpoint; unrelated root changes are excluded.
- Jira: [SCRUM-34](https://sadhirr1.atlassian.net/browse/SCRUM-34); coordination handoff: [SCRUM-18](https://sadhirr1.atlassian.net/browse/SCRUM-18). GitHub/Jira record the eventual integration SHA and PR URL.

## Evidence and ownership

Scene/visual author: `hollow_scene`. State/game-rules author: `hollow_rules`. Interaction, UI/UX, styling and integration: coordinator. Independent source/test reviewer: `hollow_qa`. Coordinator independently reviewed the rules and QA's fourteen new tests and ran browser checks. These are agent roles, not separate employee identities.

See `docs/evidence/scrum34-review.md` for final checks and source hashes, and `docs/evidence/scrum34-morning.md` for actual browser observations and limits. No full release, production deployment, FPS result or owner acceptance of this increment is claimed.

## Previous next steps — superseded by the October 12 priorities above

1. Read the owner's reaction to the playable morning, its work ledger and world changes at `/wild/`.
2. Improve character animation, environmental detail and cinematic composition; measure performance on target devices. Current art is procedural and simple. Narrow screens use the reading panel as the reliable interaction route.
3. Extend consequences beyond this first morning with credible competing accounts and controlled hidden information. The current ledger updates existing obligations after one assignment; multi-round accumulation, rumors, hidden motives and broader replay variation remain pending.
4. Reassess scope against the November 6 candidate and November 13 release-decision targets with the owner. Do not silently extend or claim the earlier release scope is finished.
5. Before editing, reconcile live Jira, open PRs, active agents/chats and this dirty local checkout. Preserve unrelated files. Prefer a clean checkout of the reviewed branch for further integration; do not stage the whole root.

Work and scrum schedules remain off. No hours or project-specific usage percentage are inferred from session duration or account-wide usage.

The owner's latest wolf JPG is a character reference, not a supplied rigged 3D model. Await an actual mesh/rig before claiming its integration. No model purchase or conversion service was used.
