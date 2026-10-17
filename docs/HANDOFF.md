# Stakewolf — start here

Last direction/checkpoint update: October 17, 2026, SCRUM-36 / coordination SCRUM-18.

## Current checkpoint — conflicting stories and a costly council watch

Owner accepted the playable clearing, then asked for stronger Werewolf-style conflict/consequences with low usage. The same one-portrait forest now has Orin/Sera's incompatible accounts, an optional challenge, a watch decision that consumes one of two workers, and a night event with consequences for tomorrow's capacity. Watching Orin prevents his announced unsafe passage; otherwise a traveler is injured and needs a worker's escort tomorrow. Watching Sera produces a witnessed-hearing obligation. No character expansion or new art. Preview remains `http://127.0.0.1:4181/`.

Coordinator authored; `cast_gate` independently reviewed. Sixteen focused tests passed for both, and desktop/mobile opposite outcomes were checked. A malformed-watch save defect found in review was corrected. [Evidence and limits](evidence/scrum36-council-dispute.md). New saves use schema2 under the existing key; completed schema1 nights retain original outcomes, while old uncommitted plans explicitly require the new council choice. Tomorrow's obligations are still recorded only, not playable. This is a fixed dispute, not a complete hidden-role game.

Continue existing draft PR22 from parent `39b3ef2bc5187b87837e43e1673bede206be9b49`; publish only explicit reviewed files and preserve the dirty root. Next: owner plays the changed encounter before further expansion. No purchases, generation, dependencies, reset credits or schedules. November6/13 risks remain.

## Preceding checkpoint — one playable clearing with the owner portrait

This entry takes precedence over the historical character evaluations below. The owner accepted the one-human forest direction for a short playable test. Preview: `http://127.0.0.1:4181/`, start with `node scripts/serve-portrait-proof.mjs`. One leader, two dated evidence items, two-person crew allocation, one night commitment and dawn obligations; no cast expansion or new artwork. The `/study` comparison and earlier `/wild/` prototype are preserved.

Coordinator authored; `cast_gate` independently reviewed and ran all eight focused checks. Desktop and mobile journeys, reload, replay confirmation, keyboard actions and mobile transition focus were checked. See [the precise result and verification limits](evidence/scrum36-playable-clearing.md) and [local setup](../public/wild/portrait-proof/README.md). Saves use only `stakewolf-clearing-v1`; the next morning's obligations are recorded, not playable yet. The illustrated face is not rigged 3D.

Continue existing draft PR22; preserve the dirty checkout and publish only reviewed files. The owner should play this one encounter before more cast or locations are added. SCRUM-36 remains In Review; November 6/13 targets remain at risk. Schedules stay off. No purchases, new generation, external feeds or reset credits in this increment.

## Read this before continuing

The owner rejects the present low-detail graphics as the target and rates overall depth at roughly 4% of expectations. Do not interpret prior encouraging feedback or passing tests as visual acceptance. Current priority: **looks/feel first, then story**. Target **desktop/laptop first with a simpler mobile fallback**. The eventual world must respond to **both player input and outside information**. The October 12 override at the top of `revised-release-plan.md` supersedes incompatible fixed workplace-case assumptions.

Next output: one materially different visual benchmark, a playable forest arrival plus a character encounter using coherent authored models/materials/animation and deliberate lighting. Review its actual appearance and motion with the owner before widening the world. More procedural primitive detail alone is not the accepted route. A browser rendering library is a proposed application dependency, not a plugin the player installs. Actual asset sourcing, licensing, animation requirements, target hardware and any cost must be resolved concretely.

Keep the reusable gameplay state, history, rules and interaction checks. Future input adapters should translate player/outside information into validated world events; they must not let generated narration overwrite facts or history. No external feed, model service, saving system or dynamic campaign has been built in this checkpoint.

## SCRUM-36 varied council cast — latest

The owner rejected the wolf face and challenged all-wolf casting, then approved a bounded two-character scene. A separate comparison now runs at `http://127.0.0.1:4180/`: human scout Dain and guardian Rhea, different silhouettes, real original rigs and idle animation, shared woodland, individual/council views, orbit, light and pause controls. Public responsibility and appearance must remain separate from hidden allegiance. This proof assigns no factions and has no gameplay. [Setup and original asset identities](../public/wild/cast-proof/README.md), [actual captures and limits](evidence/scrum36-council.md).

Coordinator authored; `cast_gate` independently reviewed provenance, source and screenshots. **Both faces fail the cinematic close-up gate.** The hooded scout has muddy eyes/mouth; the guardian has malformed eyes/lips. Do not integrate or repeatedly polish these assets. Local comparison only; raw Asset Yard AI-generated sample GLBs remain ignored and production redistribution clearance is unresolved. The reviewer found a cached-navigation disposal defect; persisted navigation now suspends/resumes instead. Syntax and seven bounded HTTP checks passed; actual desktop controls and a narrow layout were inspected. One PMREM shader precision warning remains. No full-game regression, CI, performance, facial animation or production acceptance is claimed.

Stop for owner judgment on cast direction. A further model must first demonstrate a convincing unretouched close-up. Preserve the main game at 4174 and rejected wolf comparison at 4179. Publish only the reviewed council source, bundle, evidence and handoff to existing draft PR22 from verified parent `fdf276d04af62eeb538a71a5d9bd3a2551f8a4be`. Weekly account usage was observed at 25% initially and 27% near completion; this is an account-wide reading, not exact chat attribution. No purchase/reset credit or schedules. SCRUM-36 remains In Review; November 6/13 targets remain at risk.

## SCRUM-36 asset-first fallback — preceding checkpoint

The owner rejected the preceding visual output and selected a bounded replacement-asset test: one better wolf, one small scene, conserve usage, no further polish before judging it. A separate local proof now runs at `http://127.0.0.1:4179/`; the existing game at 4174 is unchanged. It uses Literock Studios' free Dire Wolf Lite with its original rig/materials/idle/walk clips, plus existing scenery. Raw licensed assets are kept only in ignored `.tmp-scrum36/wolf-proof/` and must not be uploaded to the public repository. [Setup/provenance](../public/wild/wolf-proof/README.md), [actual rendered evidence and review](evidence/scrum36-wolf-proof.md).

Coordinator authored the proof. Independent `asset_gate` approves local evaluation only: anatomy, ears, eyes and muzzle improve, but the coat is carved/scaly, the mouth stiff, and a black nose wedge remains visible. The removed shadow-map setting was corrected and rebuilt. Syntax, bounded HTTP routes and actual desktop idle/walk/pause/camera/light checks passed; no full-game, mobile, cinematic or performance approval is claimed. One candidate and one reviewer; weekly account meter observed 20% to 24%, not precise chat attribution. No purchase/reset credit used. Publish the explicit reviewed proof/evidence files on draft PR22 from verified parent `9bb8cce9ebea27698a28308047af86dd58d264e6`, preserving the dirty root.

**Stop here for the owner's visible judgment. Do not integrate or start another model-polishing loop.** This is an asset comparison, not accepted production art. SCRUM-36 remains In Review; November 6/13 targets remain at risk; schedules stay off.

## SCRUM-36 portrait and forest depth — preceding checkpoint

The owner resumed manually and requested more cinematic wolves and surroundings. The retained increment adds warmer, defined irises, a darker nose response, and a restrained narrower/longer muzzle. Sera's existing portrait light now illuminates her viewed facial planes. Height-aware haze softens the hard horizon; ten scanned pines (six more than the preceding checkpoint) provide real branch overlap. Two procedural distant-tree candidates were visibly rejected and removed. The existing coarse head/ear shapes and limited facial acting remain below target; this is not owner cinematic acceptance.

Authors: `character_asset` (portrait helper) and `character_runtime` (lighting/environment/integration); independent reviewer/test author: `character_review`; coordinator: integration, test review, actual browser comparisons and publication. Four focused checks passed; the full frozen suite passed **254 tests**, zero failures/skips, 2,760.2335 ms. The first sandbox full-suite attempt was blocked from temporary loopback sockets; the permitted rerun passed. QA found an undefined shader angle on non-eye fragments, fixed before final verification. All three desktop coats, Sera motion/pause, paused 390 × 844 fallback, crossing inspection and the repair-to-dawn transition were inspected. Final captured browser warnings/errors: none. [Results and actual comparisons](evidence/scrum36-portrait.md), [independent review](evidence/scrum36-portrait-review.md).

Continue existing [PR22](https://github.com/sadhirr1/Stakewolf/pull/22) from `f1735c2fc576547ce10d7d11a2d1ecd3c786af20`; GitHub/Jira record the final checkpoint and its CI. The parent fur checkpoint passed [Windows/Ubuntu CI](https://github.com/sadhirr1/Stakewolf/actions/runs/38688810606), reconciled this session after the earlier pause. Preserve the dirty root; publish only explicitly reviewed files. Preview remains `http://127.0.0.1:4174/wild/` with the generated bundle. No new server routes or downloaded assets were required. Bundle: 950,513 bytes; active assets: 13,914,280 bytes. Added pines cost 146,916 triangles in existing instanced material draws, plus small trunk subdivision changes. This is geometry cost, not a hardware-performance pass.

Next: use this actual encounter as a comparison point for a substantially better authored face and ears, eyelids and facial acting. Do not repeat small shader/color adjustments and call them a new character. The current model's resting teeth, coarse anatomy, generic quadruped design and low-resolution maps remain the main blockers. No visible wet corneal glint, final performance budget, deeper story or dynamic-input system is claimed. November 6/13 targets remain at risk. Work is manual; schedules remain off; no purchase or reset credit was used.

## SCRUM-36 fur and groom — preceding checkpoint

The owner again called quality subpar and requested continued wolf/fur work. Two rendered candidates were rejected before the final thin-strand treatment: shortened locks alone looked like scales, and broad ribbons became orange patches. The final version shortens 119 original locks for the distant fallback and adds 7,000 thin curved skinned strands for one close desktop character at a time. Coarse detached locks fade out in that portrait. Narrow views retain the simpler groom. Paused/reduced-motion views retain static detail. The original body/face, rig, maps and clips remain unchanged. No lighting or story change is included.

Geometry author `character_asset`; material/runtime author `character_runtime`; independent reviewer/test author `character_review`; integration, browser and independent test review by coordinator. Four focused checks passed; the full frozen suite passed **250 tests**, zero failures/skips, 2,709.428 ms. The reviewed skin-attachment risk was reduced with bounded root resampling; sampled animated root gaps stayed below 0.581 mm. [Actual before/after evidence and limitations](evidence/scrum36-fur.md), [independent review](evidence/scrum36-fur-review.md), [asset reproduction](../public/wild/assets/warg/GROOM.md).

Continue existing [PR22](https://github.com/sadhirr1/Stakewolf/pull/22) from parent `861a81aef4bccd300fea4778a01d4af265a51aa5`; GitHub/Jira record the final commit and exact CI result. Preserve the dirty root; publish only explicit reviewed files. Main preview runs at `http://127.0.0.1:4174/wild/` and was restarted for the new groom route. Active asset payload is 13,914,280 bytes before JavaScript; one focused coat adds 42,000 triangles and one draw.

This is a visible fur improvement, **not cinematic acceptance**. Facial anatomy, eyes, low-resolution base maps and the generic quadruped remain below the owner's target. Do not spend another session merely retuning this same coat or reporting tests as art progress. Next visual priority is a portrait-suitable character with substantially better facial form and acting, resolved against an actual rendered benchmark before expanding scope. No external-input system, deeper story, campaign or save system was added. November 6/13 targets remain at risk; schedules stay off.

## SCRUM-36 cast identity and attention — preceding checkpoint

Orin now has the creator's brown coat, Vela ash and Sera charcoal. Encounters blend in a head turn capped at approximately 22 degrees over the existing animation; the camera stays on its stable anchor. Sera's first encounter briefly uses IdlePant (at most two cycles of active animation time) and returns to Idle, without restarting on revisit. Paused/hidden/reduced-motion scenes do not advance these poses. Sera's night portrait fill was modestly increased after browser inspection; her darker face still has weaker definition than the other two.

Asset author `character_asset`, runtime author `character_runtime`, independent reviewer/test author `character_review`, integration/browser and independent test review by coordinator. Four new real-rig checks passed; the final full suite passed **246 tests**, zero failures/skips. Actual three-character desktop encounters, pause/resume and paused resize/refocus at 390 × 844 were checked. [Implementation/browser evidence](evidence/scrum36-cast.md), [independent review](evidence/scrum36-cast-review.md), [coat provenance](../public/wild/assets/warg/VARIANTS.md).

Existing [PR22](https://github.com/sadhirr1/Stakewolf/pull/22) continues from `6c488d2d113a56b7ee8cd0b010f37a88627e09f2`; final commit and remote CI belong in GitHub/Jira. Root changes outside this bounded increment are preserved. Active assets now total 13,552,884 bytes plus a 928,739-byte bundle. Preview remains `http://127.0.0.1:4174/wild/`; the main server was restarted for the two explicit JPEG routes.

This is a small cast-readability improvement, not final cinematic acceptance. Shared quadruped geometry, pointed fur, weak facial acting and Sera's night face remain art limitations. No new locations, deeper story, live information feed, campaign or save system was added. Next: use owner feedback on this actual encounter to resolve the portrait-quality character direction before widening the world. The November 6/13 scope and performance risks remain; schedules stay off.

## SCRUM-36 animated cast — preceding checkpoint

The active forest now uses a real 41-joint Warg rig with independent Idle animation for five characters, replacing the static wolf in the renderer. Actual candidate inspection caught and fixed incorrect vertex-color masks before integration. The 3,169,108-byte CC0 GLB preserves two clips, has 7,071 triangles and 1K maps; only Idle is currently used. Creator attribution, license, source hash and offline conversion script are retained. The older wolf and its attribution remain preserved.

Authors: `character_asset` and `character_runtime`; independent reviewer/test author: `character_review`; integration/browser/test review: coordinator. Four focused tests and the final **242-test full suite passed**. Actual desktop encounters, narrow 390 × 844 layout, pause/resume and paused resize/focus were checked. See [implementation and browser evidence](evidence/scrum36-character.md) and [independent review](evidence/scrum36-character-review.md). The source, helper, asset and manifest identities are recorded there; GitHub/Jira hold the final commit and CI result.

This is a **technical animation increment, not final cinematic art**. The cast remains one generic quadruped with coarse, pointed fur. Facial acting, character differentiation, walking/lip-sync and final anthro art are unresolved. The frame budget and transfer targets are also unmet: active assets 12,980,892 bytes plus a 927,026-byte bundle. Moving wolves use soft contact patches rather than articulated cast shadows. No deeper story, dynamic-input service, save system or campaign was introduced.

Publication continues existing PR22 / `codex/SCRUM-36-forest-materials` from parent `cd301ae40dca24baf815137bde2fa1f4cb32b82e`, preserving the dirty root and unmerged draft stack. Main preview remains `http://127.0.0.1:4174/wild/`; restart the server for the explicit new asset route if needed. Temporary showroom 4178 is stopped. Schedules remain off. Next work must reconcile live Jira/PR state and obtain owner feedback on the actual animated encounter before widening the visual scope. November 6/13 delivery risk remains unresolved.

## SCRUM-36 encounter continuation — preceding checkpoint

PR22 now also carries a closer desktop portrait camera, broad neutral-warm face light and a transparent desktop dialogue layout backed by a dark gradient. Narrow screens retain the opaque bottom panel. Renderer author `hollow_scene`, UI/build/browser coordinator, independent QA `hollow_cast`. A light-table cleanup-order defect was found by QA and fixed by the author before the frozen **238-test passing** run. Actual desktop and 390 × 844 browser checks, screenshots, source identities and limits: [encounter evidence](evidence/scrum36-encounter.md) and [independent review](evidence/scrum36-encounter-review.md).

The new bundle is **912,621 bytes** (+249,805); assets remain 10,767,112 bytes. The previous transfer target remains unmet. This is staging/UI work only: the same static provisional quadruped remains. No rigged replacement, new animation, deeper story or dynamic-input system was delivered. The character is still the main visual blocker.

`cinema_assets` found a CC0 Warg candidate through the creator's official Fantasy Creatures page and source repository. Its AI/code-generated, top-down-game origin is disclosed; quality is unaccepted. The official FBX download stalled and yielded no usable archive. No conversion or playback was verified. Bounded research details are in the evidence record; do not report its advertised rig/clip counts as integrated assets. Next work should validate a portrait-suitable character and real animations, not repeat cosmetic revisions or broad asset hunts. November 6/13 delivery risk remains unresolved.

Latest continuation updates the existing `codex/SCRUM-36-forest-materials` branch / [PR22](https://github.com/sadhirr1/Stakewolf/pull/22), from parent `dcc8c96f97d5ef729e8f0f1e4f28865d4166c0e0`. Only named renderer, bundle, CSS and evidence/handoff files belong to it. GitHub and Jira contain the final commit/CI result. The dirty root and earlier unmerged draft stack remain preserved. Preview stays at `http://127.0.0.1:4174/wild/`; schedules remain off.

## SCRUM-36 forest rendering benchmark — preceding checkpoint

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
