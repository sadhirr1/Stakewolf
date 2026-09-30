# Stakewolf agent team and delivery workflow

Project tracker: [Jira](https://sadhirr1.atlassian.net)
Source and reviews: [GitHub](https://github.com/sadhirr1/Stakewolf)

## Operating model

Stakewolf uses seven persistent roles, with one coordinator and up to three active worker agents at a time. Roles are responsibilities, not seven continuously running agents. The coordinator assigns available workers to roles, records handoffs, and restores context from tickets and repository records when a new worker takes over.

Each task has an author and a separate reviewer. A second role name on the same worker does not constitute independent review. The reviewer must be a different agent or a human who examines the actual deliverable and evidence. Review findings return to the author for resolution; the reviewer then verifies material fixes.

The target is a reviewed first release within two weeks, tracked under [epic SCRUM-5](https://sadhirr1.atlassian.net/browse/SCRUM-5). The existing active sprint is **SCRUM Sprint 0** (sprint ID 2), September 29-October 13, 2026, in Los Angeles time. Keep the agreed release scope and acceptance criteria in Jira. Product changes that affect the target require an explicit scope or schedule decision.

## Roles and first action points

| Role | Responsibilities | First action point | Independent review |
| --- | --- | --- | --- |
| Coordinator / delivery lead | Priorities, dependencies, assignments, integration, blockers, and daily reporting | [SCRUM-18](https://sadhirr1.atlassian.net/browse/SCRUM-18): establish the release backlog, assign authors and reviewers, and identify missing access or decisions | Product and QA inspect release readiness and the accuracy of delivery reports |
| Product manager | Player goals, release scope, user stories, acceptance criteria, and value | [SCRUM-6](https://sadhirr1.atlassian.net/browse/SCRUM-6): define the first complete playable scenario and what a successful player experience demonstrates | Game design and QA challenge clarity, feasibility, and testability |
| Game designer | Stakeholder agendas, scenario structure, decisions, consequences, balance, and replayability | [SCRUM-7](https://sadhirr1.atlassian.net/browse/SCRUM-7): specify one complete scenario, including state changes and debrief evidence | Product and development inspect value and implementability; QA checks consistency |
| UI/UX designer | Player journeys, interaction states, accessibility, navigation, and usability | [SCRUM-8](https://sadhirr1.atlassian.net/browse/SCRUM-8): map the journey from starting a game through decisions to the final debrief | Product and development review the flow; QA checks the implemented experience |
| Visual designer | Visual identity, typography, colors, artwork, and interface consistency | [SCRUM-9](https://sadhirr1.atlassian.net/browse/SCRUM-9): define the initial visual direction and reusable interface treatments | UI/UX checks usability and accessibility; development checks implementation feasibility |
| Developer | Architecture, game state, interface implementation, integrations, and maintainability | [SCRUM-10](https://sadhirr1.atlassian.net/browse/SCRUM-10): establish a repeatable project startup and implement one complete playable journey | A separate development reviewer checks the code; QA validates behavior and UX inspects screens |
| QA / tester | Test planning, gameplay validation, regression checks, accessibility checks, and defects | [SCRUM-11](https://sadhirr1.atlassian.net/browse/SCRUM-11): derive a test plan from the release acceptance criteria, including failure and recovery paths | Product checks coverage of player goals; development reviews technical test assumptions |

An agent may cover more than one role across assignments. Preserve independent review by assigning review of its own output to someone else. Every role records its action points in Jira, including research, design, testing, documentation, and coordination work.

Follow-on work is tracked in [SCRUM-12: gameplay](https://sadhirr1.atlassian.net/browse/SCRUM-12), [SCRUM-13: consequences](https://sadhirr1.atlassian.net/browse/SCRUM-13), [SCRUM-14: typed decisions](https://sadhirr1.atlassian.net/browse/SCRUM-14), [SCRUM-15: debrief](https://sadhirr1.atlassian.net/browse/SCRUM-15), [SCRUM-16: validation](https://sadhirr1.atlassian.net/browse/SCRUM-16), and [SCRUM-17: release](https://sadhirr1.atlassian.net/browse/SCRUM-17).

These tickets and initial planning documents establish work ownership. Their existence does not satisfy every acceptance criterion, establish a runnable foundation, or mean every role has completed its deliverables. Jira records the current progress; the quality gates below determine completion.

## Jira task records

Use the verified existing Jira statuses: **To Do**, **In Progress**, **In Review**, and **Done**. Do not reconfigure the workflow unless the user explicitly authorizes it.

| Delivery stage | Existing Jira status | Required record |
| --- | --- | --- |
| Requirements and ready for work | To Do | Objective, acceptance criteria, dependencies, author, and reviewer |
| Active work | In Progress | Current action, evidence, and next step |
| Independent review and verification | In Review | Review findings, QA checklist, test results, and fix verification |
| Complete | Done | Resolved required findings, acceptance evidence, and integrated deliverable where applicable |

For blocked work, retain the appropriate current status, apply the `blocked` label, and record the reason, impact, and action needed to unblock it. Remove the label when resolved. Verification stays in **In Review** until the QA and review checklist passes; it is not a new Jira status.

Each work item must include:

- A concrete objective and its player or delivery benefit.
- The responsible role, assigned author, and independent reviewer.
- Acceptance criteria that can be checked against the deliverable.
- Dependencies, scope boundaries, and known blockers.
- An estimate where useful, kept separate from actual time spent.
- Links to the relevant design, branch, commits, pull request, and test evidence.
- The latest completed action, next action, and handoff details.

Agent roles are not Jira user accounts. Use only verified accounts for Jira assignees and record the agent role and assignment in the description or progress updates. Do not invent accounts, fields, labels, statuses, or ticket identifiers. Use actual created issue keys for external links and repository conventions.

## GitHub traceability

Create a focused branch for each implementation task or closely related group of tasks. Use the primary issue key throughout; `SCRUM-123` below is an example, not an existing ticket.

- Branch: `feature/SCRUM-123-stakeholder-memory`, `fix/SCRUM-123-save-recovery`, or `docs/SCRUM-123-player-flow`.
- Commit subject: `SCRUM-123: describe the concrete change`.
- Pull request title: `SCRUM-123: describe the resulting behavior`.
- Pull request body: link the actual Jira issue and describe the change, acceptance evidence, validation results, and remaining limitations.
- Jira update: link the pull request, record the independent review outcome, and attach or link verification evidence.

Reference additional affected Jira issues explicitly. Use the repository's configured base branch. Keep secrets, generated output, and local dependency folders out of commits. Prefer small reviewable changes. Do not report changes as pushed, reviewed, merged, or released until those actions are confirmed.

GitHub's pull request template records the review; it does not enforce it automatically. Branch protection, automated checks, review permissions, and deployment settings must be verified or configured separately before claiming they exist.

## Quality gates

1. **Ready for work:** The objective and acceptance criteria are clear, dependencies are understood, and an author and separate reviewer are assigned.
2. **Ready for review:** The deliverable is available, the author has checked it, and the ticket or pull request includes evidence and unresolved questions.
3. **Review complete:** A different reviewer has inspected the deliverable, recorded findings, and verified the relevant fixes. Code, gameplay, and visual changes receive the appropriate specialist review.
4. **Verified:** Acceptance criteria pass. Run checks appropriate to the change and record the exact results. For functional changes, cover relevant game state, errors, persistence, and regressions. Inspect interface changes in the working application. Use proofreading and link checks for documentation when sufficient.
5. **Done:** Required review findings are resolved, evidence is linked, the approved change is integrated where applicable, and Jira reflects the actual result. A release additionally requires a playable end-to-end check and compliance with the [quality plan's severity and release rules](quality-plan.md#defect-severity-and-release-rules): no open S0/S1 defects or unresolved acceptance-blocking S2 defects. A recorded release decision cannot waive those gates. Removing an S2-affected capability requires the documented scope change, dependency review, and updated acceptance checks specified there. Permitted minor defects need linked tickets and documented release decisions.

Do not invent passing checks, add meaningless tests for simple edits, or equate a successful build with a verified player experience. Mark unavailable checks as not run, explain why, and identify the required follow-up.

Test evidence must survive the worker's local session. Link a retained CI artifact and record its retention expiry, attach the relevant evidence to Jira, or commit a concise, sanitized result summary under `docs/evidence/`. Include the tested commit, environment, actual result, and reviewer. Preserve a durable summary even when using expiring CI artifacts, and copy essential evidence to durable storage before expiry when it is still needed for review or handoff. Generated local reports may stay ignored, but a local-only ignored file is insufficient as the sole review or release evidence.

## Progress logs and handoffs

Log material progress when work starts, changes direction, is handed off, reaches review, becomes blocked, or completes. Keep updates concise and link to the deliverable instead of duplicating it. Do not publish internal reasoning or sensitive data.

Use this structure in Jira updates:

```text
When: timestamp with timezone
Role / author:
Action completed:
Evidence: artifact, commit, pull request, screenshot, or test result
Validation: passed / failed / not run, with relevant details
Reviewer / review outcome:
Blockers or decisions needed:
Next action / next owner:
Actual recorded execution time, if measured:
```

A handoff also identifies the current branch and revision, changed files or artifacts, how to reproduce the current state, and unresolved findings. A receiving worker checks the ticket and repository state before continuing. Never overwrite another worker's changes or claim another worker's output as independently reviewed without inspecting it.

## Daily scrum and work scheduling

The user allows work at any time and requested a daily scrum at 8 p.m. Los Angeles local time (`America/Los_Angeles`, including daylight saving). The coordinator verified both automations as **ACTIVE** through the scheduling tool and saved configuration:

- `stakewolf-daily-scrum`: daily at 8 p.m., through October 13, 2026, inclusive.
- `stakewolf-daily-work-sessions`: eight daily opportunities to run work, at noon and 1, 2, 3, 4, 5, 6, and 7 p.m., through October 13, 2026, inclusive.

All times use Los Angeles local time. The coordinator selected the noon-to-7 p.m. opportunities within the user's flexible working preference; this does not restrict authorized work to those hours. Activation means the schedules are saved and enabled, not that every future run or eight hours of execution has already occurred.

The scrum report includes each role's completed work, evidence, next action, blockers, review results, release progress, and decisions needed from the user. It distinguishes finished work from plans and flags changes that affect the two-week target.

Eight scheduled work opportunities do not guarantee eight hours of uninterrupted execution, seven continuously staffed roles, or a fixed amount of completed work. Execution depends on scheduled runs actually starting, machine and app availability, permissions, dependencies, and usage limits. Report measured execution time only when it is available; do not convert the number of scheduled runs into hours worked.

When changing or reporting the operating schedule, verify the saved automation, timezone, frequency, end date, and notification behavior. Preserve checkpoints so a later run can continue from the last verified state.
