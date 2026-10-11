# SCRUM-34 — a playable morning

October 11, 2026 (America/Los_Angeles). [SCRUM-34](https://sadhirr1.atlassian.net/browse/SCRUM-34). Parent: PR19 / `d15c094ad88d63df212d85839f94d3164ae92f90`. Owner manually resumed development; schedules remain off.

## Scope and rules

One new morning assignment follows the first-light report. Sera can work at the crossing or investigate the northern trail. Visiting costs nothing; confirmation consumes her single morning. The unselected task is deferred. Repeated input or travel cannot perform both jobs.

| Prior night | Morning assignment | Result | Cost left visible |
| --- | --- | --- | --- |
| Repair | Crossing | Small first party guided across under the checked conditions | Northern investigation deferred; wider family promise partial; repair crew resting |
| Hold | Crossing | Slipping fastening observed in daylight; marked and kept closed | Repair remains pending; families wait; northern investigation deferred |
| Either | Trail | Disturbed mud and undated tracks observed | Crossing work deferred; families wait; neither tracks nor staffing identifies a culprit |

The ledger preserves work IDs, owners and origins rather than adding duplicate tasks. Morning findings do not rewrite night observation, commitment evidence or the first-light report. The journal labels each period. Post-dawn hearing cannot append new night claims. Restart clears all added state and scene objects.

Visual development by `hollow_scene`; game rules by `hollow_rules`; app/UI/UX and integration by coordinator; independent source/test review by `hollow_qa`. Coordinator reviewed the rules and all fourteen new tests, including the added history assertion. These are agent roles under the owner's connected account.

## Executed coordinator browser checks

Local preview `http://127.0.0.1:4174/wild/`, Codex in-app browser. Desktop 1280×800 and narrow 390×844 viewport; these are browser viewport checks, not physical-device tests.

- Hold without a night observation → dawn → morning → crossing. Escape cancelled the assignment and returned focus to **Assign Sera here**. A subsequent Enter confirmation completed inspection. Ledger showed repair pending, deferred trail and waiting families. The journal kept **No night inspection** separately from the new morning finding. Travelling to the trail after completion produced zero assignment buttons and retained the same report.
- Repair → morning → guided crossing. At 390×844 the confirmation, cost and confirm/cancel controls were readable. The work ledger scrolled to its return button; Enter returned focus to the review button. Document width was 375 at viewport width 390. The ledger retained crew rest, a partial family promise and deferred trail work.
- At desktop the hold route visibly retained the barrier with an ochre anchor marker. The repaired route visibly showed travelers at the near bank and a secured fastening instead of the dangling binding. Pausing motion preserved the result.
- Hold → morning → trail produced **Tracks without a time**, an explicitly deferred anchor inspection and waiting families. No culprit or time was inferred from the marks.
- Replay was used between paths and returned to night with no inherited assignment. Confirmation and modal exit were exercised with Enter/Escape; this is not a claim of an entire keyboard-only journey.

## Review corrections and limits

The coordinator found that the state API still allowed a night account to be heard after dawn; the state author closed that gate and QA added a history regression. QA requested replay confirmation explicitly mention the morning assignment; corrected. Large place headings obscured part of the scene in view mode; viewing now compacts them and restores progress/description with the reading panel.

Initial trail inspection marks were too dark and close to the navigation overlay in the actual browser. The scene author moved them farther along the path, lightened the two pennants and added a small inspection lantern with local illumination. The coordinator repeated the complete hold-to-trail path on the final files at 1280×800: both pennants and the lantern are visible above navigation, with subtle ground impressions nearby. A final repaired-crossing replay also retained the travelers and secured fastening. Captured browser warning/error logs were empty at the end of these checks.

Local supporting captures: `docs/evidence/local-scrum34/trail-morning.png` and `crossing-morning.png`. These local captures are not the durable handoff; this sanitized summary and the independent review are included in the GitHub checkpoint.

Final automated results and hashes belong to `scrum34-review.md`. No CI, fresh-checkout, public deployment, merge, FPS, 200% zoom, screen-reader or physical-phone acceptance is claimed. Scene author mock checks do not establish real GPU performance. The prior model-like JPG remains reference only. No dependencies, plugins, purchases or schedules were added.

This implements one constrained continuation with deferred obligations, not the full Werewolf deduction system or a multi-round backlog simulation. November 6 candidate and November 13 release-decision targets still need scope reassessment after the wilderness pivot.
