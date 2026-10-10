# Stakewolf — start here

Last checkpoint: October 10, 2026, SCRUM-33.

## Current direction

The owner rejected the office framing and asked for a real 3D cinematic skeleton in the wilderness, combining Werewolf and product-management decisions. After trying the forest prototype, the owner said it was progressing and asked to expand it. This authorizes continued development in that direction, not final visual acceptance or a full release. No plugin installation, paid runtime service, or automatic schedule is authorized by this checkpoint.

## Working result

- `/wild/` is **The Hollow**, a separate native WebGL forest prototype. SCRUM-33 adds distinct wolf characters, close-up encounters, accessible world markers, and a first-light continuation after the repair-versus-delay commitment. Dawn changes the lighting and presents three reactions and three unfinished obligations. The original council, trail, crossing, observable anchor defect, field notes, replay, optional sound, motion controls and readable fallback remain.
- Decision-time evidence is preserved. Inspecting after a commitment cannot retroactively justify it. The repair report describes a bounded dawn inspection; the delay report leaves the crossing closed. Neither invents a culprit. The next chapter and its accumulating-work simulation are still pending.
- `/` retains the earlier Relay game and its owner-art opening. Existing mechanics may be reused selectively; the earlier workplace narrative is not the accepted direction for the new world.
- Run `node server.mjs 4174`, then open `http://127.0.0.1:4174/wild/`. The coordinator left this preview server running for the owner at the end of this session. Restart it if the process has ended.
- Delivery branch: `codex/SCRUM-33-hollow-dawn`, based on PR18 (`codex/SCRUM-32-forest-prototype`, `14aa3b61fdde8c1ff5d005f0f00ad0f12a94411c`). The earlier PR chain remains unmerged. Only named runtime, test and handoff files belong to this checkpoint; unrelated root changes are excluded.
- Jira: [SCRUM-33](https://sadhirr1.atlassian.net/browse/SCRUM-33); coordination handoff: [SCRUM-18](https://sadhirr1.atlassian.net/browse/SCRUM-18). GitHub/Jira record the eventual integration SHA and PR URL.

## Evidence and ownership

Scene/visual author: `hollow_scene`. State/game-rules author: `hollow_rules`. Interaction, UI/UX, styling and integration: coordinator. Independent source/test reviewer: `hollow_qa`. Coordinator independently reviewed the rules and QA's eleven new tests and ran browser checks. These are agent roles, not separate employee identities.

See `docs/evidence/scrum33-review.md` (208 passing regression checks, syntax checks, resolved findings, source hashes) and `docs/evidence/scrum33-forest.md` (actual browser observations and limits). Moving markers initially selected the wrong character; markers now wait for the camera to settle. Entry/exit camera paths avoid the focused character, and camera travel follows elapsed time even at low frame rates. Browser retest selected the correct character with normal motion. No full release, production deployment, FPS result or owner acceptance of this increment is claimed.

## Next session

1. Read the owner's reaction to close-up characters, world interaction and first light at `/wild/`.
2. Improve character animation, environmental detail and cinematic composition; measure performance on target devices. Current art is procedural and simple. Narrow screens use the reading panel as the reliable interaction route.
3. Build the next chapter around the actual carried obligations: crew rest and an unobserved watch gap after repair, or waiting families and a closed crossing after delay. Hidden motives, replay variation and an accumulating backlog require explicit mechanics; the current dawn report is not that system.
4. Reassess scope against the November 6 candidate and November 13 release-decision targets with the owner. Do not silently extend or claim the earlier release scope is finished.
5. Before editing, reconcile live Jira, open PRs, active agents/chats and this dirty local checkout. Preserve unrelated files. Prefer a clean checkout of the reviewed branch for further integration; do not stage the whole root.

Work and scrum schedules remain off. No hours or project-specific usage percentage are inferred from session duration or account-wide usage.
