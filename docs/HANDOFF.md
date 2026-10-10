# Stakewolf — start here

Last checkpoint: October 10, 2026, SCRUM-32.

## Current direction

The owner rejected the office framing and asked for a real 3D cinematic skeleton in the wilderness, combining Werewolf and product-management decisions. The owner authorized a first forest prototype. Judge the setting and interaction before expanding the full story. No plugin installation, paid runtime service, or automatic schedule is authorized by this checkpoint.

## Working result

- `/wild/` is **The Hollow**, a separate native WebGL forest prototype: council, trail, crossing, three accounts, one observable defect, and a repair-versus-delay commitment. It has immediate consequences, field notes, replay, optional ambient sound, motion controls and a readable fallback.
- `/` retains the earlier Relay game and its owner-art opening. Existing mechanics may be reused selectively; the earlier workplace narrative is not the accepted direction for the new world.
- Run `node server.mjs 4174`, then open `http://127.0.0.1:4174/wild/`. The coordinator left this preview server running for the owner at the end of this session. Restart it if the process has ended.
- Delivery branch: `codex/SCRUM-32-forest-prototype`, based on PR17 (`codex/SCRUM-31-owner-art-opening`, `1b2c43d1a4a60206e932c0fc5840170dbf85e633`). The earlier PR chain remains unmerged.
- Jira: [SCRUM-32](https://sadhirr1.atlassian.net/browse/SCRUM-32); coordination handoff: [SCRUM-18](https://sadhirr1.atlassian.net/browse/SCRUM-18). GitHub/Jira record the eventual integration SHA and PR URL.

## Evidence and ownership

Scene author: `forest_scene`. State, interaction, styling, explicit routes and integration: coordinator. Independent source/test reviewer: `forest_qa`. Coordinator reviewed QA's thirteen tests and ran the browser checks.

See `docs/evidence/scrum32-review.md` (197 passing regression checks, final CSS follow-up 13 passing checks, resolved findings, source hashes) and `docs/evidence/scrum32-forest.md` (actual browser observations and limits). No full release or owner visual acceptance is claimed.

## Next session

1. Read the owner's reaction to the actual `/wild/` preview. Refine its visual direction before broadening it.
2. If retained, improve character silhouette/animation, environmental detail, lighting and camera timing; measure performance on target devices. Current art is procedural and deliberately simple.
3. Design a real deduction/capacity loop in this world. Hidden motives, day/night cycles, accumulating work and longer consequences are still pending; this short authored scene does not establish them.
4. Reassess scope against the November 6 candidate and November 13 release-decision targets with the owner. Do not silently extend or claim the earlier release scope is finished.
5. Before editing, reconcile live Jira, open PRs, active agents/chats and this dirty local checkout. Preserve unrelated files. Prefer a clean checkout of the reviewed branch for further integration; do not stage the whole root.

Work and scrum schedules remain off. No hours or project-specific usage percentage are inferred from session duration or account-wide usage.
