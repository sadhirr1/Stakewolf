# Stakewolf playable preview — SCRUM-31

The October 10 checkpoint adds a working opening using three owner-supplied images, inspired by the spatial gallery at jesperlandberg.com. Select themes using the cards, numbered buttons or arrows, read the case brief, and enter the existing game. This is the opening design checkpoint; the workplace interaction and narrative rework discussed with the owner is still pending.

## Run

From `C:\Users\sadhi\Project_work\Stakewolf`, run `node server.mjs` and open http://127.0.0.1:4173/. Keep the server running. When updating from SCRUM-30, restart the server as well as refreshing the page so the new image routes become available. Refresh/reopen still starts a new attempt; progress is not saved.

## Scope and source

- [Draft PR17](https://github.com/sadhirr1/Stakewolf/pull/17), branch `codex/SCRUM-31-owner-art-opening`, is stacked on PR16; the PR14→15→16→17 chain remains unmerged.
- The original eight images and icon remain in local `Assets/`. Three optimized delivery copies are served from `public/cover/`. The owner's October 10 request supersedes the earlier instruction to set the art aside.
- Previous carried-work mechanics, R3 rumor, R4 shared capacity, decision impact desk and repaired debrief remain from SCRUM-30. Use the Carried work tab to inspect promises, owners and deadlines through the five-round case. Evidence and interpretation stay governed by the current authored rules.
- Prior local runtime files were backed up to `.tmp-root-before-SCRUM-31` before the reviewed update; unrelated work was preserved.

## Verification and next work

See `docs/evidence/scrum31-opening.md` and `scrum31-cover-review.md`: independent source review, 184 passing tests, actual gallery/keyboard/entry/restart checks and 390/780px viewport checks. The asset provenance is in `public/cover/README.md`.

Owner feedback on this working opening is the next visual checkpoint. This does not establish full visual approval, actual 200% zoom, screen-reader/reduced-motion runtime acceptance, public hosting or release readiness. The broader gameplay rewrite and scoped R5 validation/rollback remain open. Schedules remain off; November 6 candidate and November 13 release-decision dates are planning targets requiring reassessment as rework progresses.
