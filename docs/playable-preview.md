# Stakewolf playable preview — SCRUM-34

## Latest: The Hollow — a morning of competing promises

Run `node server.mjs 4174` from the repository and open **http://127.0.0.1:4174/wild/**. Keep that terminal running. If the server predates SCRUM-32, restart it to load the explicit routes; an existing SCRUM-32 server only needs a page refresh for this increment. Enter the Hollow, hear the council's accounts, inspect the crossing, and bring a commitment back to the fire. Choose **Stay until first light** to see the next morning. Refresh starts a new run. Sound is optional; motion can be paused.

On wider screens, hide the reading panel to approach visible character markers directly. They appear after the camera settles and stay clear of controls. Each encounter moves closer to its character. At the crossing, the anchor marker inspects the same evidence as **Examine the anchor**. Narrow screens retain the reading-panel buttons. Dawn changes the light and shows what each character reports and what work remains. **Try another night** clears the decision, observations and daylight.

After first light, choose **Begin the morning**. Visit the crossing or northern trail, then **Assign Sera here**. The confirmation explains which task waits. Sera has one assignment before midday; travelling does not consume it, and cancellation keeps her available. Repairing overnight unlocks a guided first crossing; holding overnight means Sera must first inspect the fastening. A trail investigation leaves the crossing task waiting. **Review the open promises** shows owners, origins, changed statuses and the unfinished work. The scene shows the result too; hide the reading panel for a wider view.

This is the owner-requested wilderness and 3D skeleton, using native WebGL with no new dependencies or plugins. It contains one authored night, two dawn branches and one morning assignment with different outcomes, using simple procedural art. Hidden roles, deeper deduction, multi-round accumulation, the full narrative and finished cinematic art remain pending. See `docs/HANDOFF.md`, `docs/evidence/scrum34-morning.md` and `docs/evidence/scrum34-review.md` for current scope and verification. Review branch: `codex/SCRUM-34-morning-promises`, stacked on PR19.

## Preserved earlier Relay prototype — SCRUM-31 (historical checkpoint)

The October 10 checkpoint adds a working opening using three owner-supplied images, inspired by the spatial gallery at jesperlandberg.com. Select themes using the cards, numbered buttons or arrows, read the case brief, and enter the existing game. This is the opening design checkpoint; the workplace interaction and narrative rework was still pending at that checkpoint; the wilderness direction now supersedes that framing.

## Run

From `C:\Users\sadhi\Project_work\Stakewolf`, run `node server.mjs` and open http://127.0.0.1:4173/. Keep the server running. When updating from SCRUM-30, restart the server as well as refreshing the page so the new image routes become available. Refresh/reopen still starts a new attempt; progress is not saved.

## Scope and source

- [Draft PR17](https://github.com/sadhirr1/Stakewolf/pull/17), branch `codex/SCRUM-31-owner-art-opening`, is stacked on PR16; the PR14→15→16→17 chain remains unmerged.
- The original eight images and icon remain in local `Assets/`. Three optimized delivery copies are served from `public/cover/`. The owner's October 10 request supersedes the earlier instruction to set the art aside.
- Previous carried-work mechanics, R3 rumor, R4 shared capacity, decision impact desk and repaired debrief remain from SCRUM-30. Use the Carried work tab to inspect promises, owners and deadlines through the five-round case. Evidence and interpretation stay governed by the current authored rules.
- Prior local runtime files were backed up to `.tmp-root-before-SCRUM-31` before the reviewed update; unrelated work was preserved.

## Verification and next work

See `docs/evidence/scrum31-opening.md` and `scrum31-cover-review.md`: independent source review, 184 passing tests, actual gallery/keyboard/entry/restart checks and 390/780px viewport checks. The asset provenance is in `public/cover/README.md`.

Historical next step at SCRUM-31: owner feedback on that opening. The current visual checkpoint is now /wild/. This does not establish full visual approval, actual 200% zoom, screen-reader/reduced-motion runtime acceptance, public hosting or release readiness. The broader gameplay rewrite and scoped R5 validation/rollback remain open. Schedules remain off; November 6 candidate and November 13 release-decision dates are planning targets requiring reassessment as rework progresses.
