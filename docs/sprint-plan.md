# Stakewolf two-week sprint plan

Status: initial planning baseline for the existing Jira `SCRUM Sprint 0` (ID `2`), under [epic SCRUM-5](https://sadhirr1.atlassian.net/browse/SCRUM-5). Its recorded start is September 29, 2026, at 8:48 p.m. PDT and its recorded end is October 13, 2026, at 8:48 p.m. PDT. The target is first-release acceptance by October 13. These dates come from an existing sprint; the agents did not establish its start through this document.

The exact Jira timestamps are `2026-09-30T03:48:27.098Z` through `2026-10-14T03:48:27.098Z`, a 14-calendar-day interval. All target dates below are in 2026, in America/Los_Angeles local time, and do not claim completed activity. Jira due dates govern the containing work items; earlier action dates are internal checkpoints. Daily scrum is at 8 p.m. local time. The user's revised work-session schedule runs hourly from 6 a.m. through 1 p.m.

## Sprint goal

Deliver one complete, reviewed, playable product management scenario that demonstrates hidden stakeholder agendas, memory, trust, rumors, delayed consequences, typed decisions, and a debrief grounded in the playthrough.

The release working scope and acceptance criteria are in [the product brief](product-brief.md). Product defaults remain distinct from confirmed process requirements. Agents may make and document reversible design refinements within the authorized scope; user input is reserved for consequential scope, cost, or release changes.

## Roles and independent review

| Role | Primary action points | Regular review responsibility |
| --- | --- | --- |
| Coordinator / delivery lead | Order work, assign agents, resolve dependencies, maintain handoffs, compile daily scrum, prepare release decision. | Verify evidence and integration; ensure separate authors and reviewers. |
| Product manager | Define scope, prioritize backlog, clarify acceptance, evaluate the complete player outcome. | Scenario relevance, feature acceptance, scope changes. |
| Game designer | Define stakeholders, rounds, information rules, consequences, and debrief rubric. | Engine behavior and scenario consistency. |
| UX designer | Map the player journey, clarify typed-input handling, design interaction and accessible flows. | Implemented interactions and observed usability. |
| Visual designer | Establish the visual language and screen specifications. | Implemented visual consistency, readability, and responsive layouts. |
| Developer | Assess reuse, select architecture, implement and integrate the game, maintain meaningful automated checks. | Technical feasibility of product/design work and another developer's code. |
| QA specialist | Build the risk-based test plan, challenge acceptance criteria, execute independent tests, document defects. | Testability, release evidence, regression risk. |

Logical roles persist across work sessions. Active specialists rotate through the available worker slots; the plan does not require all roles to run simultaneously. A separate reviewing agent must inspect each deliverable. A second development agent can review code when scheduled; the author cannot approve it under another role name.

## Work tracking

Use Jira project `SCRUM` as the live source of work status. Use GitHub repository [sadhirr1/Stakewolf](https://github.com/sadhirr1/Stakewolf) for artifacts, source changes, reviews, and release history.

The action identifiers below are planning IDs, not Jira issue keys. They map to confirmed tickets under epic `SCRUM-5` in the table below. Additional planning rows do not imply additional Jira issues, branches, or pull requests.

Each Jira item needs:

- A planning ID, clear outcome, owner role, actual account assignment when appropriate, and an independent reviewer.
- Priority, acceptance criteria, dependencies, target date, and required or optional release classification.
- Current status and a blocked flag when needed, with the blocker, dependency owner, and next action.
- Timestamped progress entries recording action, result, evidence, blocker, and next step.
- Links to relevant documents, GitHub changes, review findings, tests, and acceptance evidence.

Use the existing Jira workflow: **To Do → In Progress → In Review → Done**. Backlog priority and readiness are planning checks within To Do, not additional Jira statuses. Independent review and QA / Validation both occur within In Review. Do not reconfigure the workflow for this plan.

Readiness requires sufficient acceptance criteria and resolved blocking dependencies. Review findings return the work to In Progress when changes are needed. QA / Validation uses checks appropriate to the artifact: software receives tests; product and design work receive documented acceptance checks. Blocked work retains its underlying status and uses the `blocked` label with a recorded reason and next action.

The coordinator confirmed these created Jira tickets. The finer planning actions in the next section are checklists within them, not claims that additional issues exist.

| Jira ticket | Tracked work | Planning actions | Jira due date |
| --- | --- | --- | --- |
| [SCRUM-6](https://sadhirr1.atlassian.net/browse/SCRUM-6) | Product scope and acceptance | PM-01, PM-02 | September 30 |
| [SCRUM-7](https://sadhirr1.atlassian.net/browse/SCRUM-7) | Scenario and stakeholder design | GD-01 | October 2 |
| [SCRUM-8](https://sadhirr1.atlassian.net/browse/SCRUM-8) | Player journeys and interaction design | UX-01 | October 2 |
| [SCRUM-9](https://sadhirr1.atlassian.net/browse/SCRUM-9) | Visual design | VIS-01 | October 2 |
| [SCRUM-10](https://sadhirr1.atlassian.net/browse/SCRUM-10) | Technical foundation and reuse assessment | DEV-01, DEV-02 | October 2 |
| [SCRUM-11](https://sadhirr1.atlassian.net/browse/SCRUM-11) | Quality plan and acceptance coverage | QA-01; initial draft September 30, finalized coverage October 2 | October 2 |
| [SCRUM-12](https://sadhirr1.atlassian.net/browse/SCRUM-12) | Gameplay implementation | DEV-03, DEV-04 | October 4 |
| [SCRUM-13](https://sadhirr1.atlassian.net/browse/SCRUM-13) | Consequences and stakeholder memory | GD-02 rules by October 2; DEV-07 implementation by October 6 | October 6 |
| [SCRUM-14](https://sadhirr1.atlassian.net/browse/SCRUM-14) | Typed decision handling | DEV-05 | October 6 |
| [SCRUM-15](https://sadhirr1.atlassian.net/browse/SCRUM-15) | Debrief and integrated scenario | DEV-06 | October 7 |
| [SCRUM-16](https://sadhirr1.atlassian.net/browse/SCRUM-16) | Independent validation and defect follow-up | QA-02, UX-02 by October 10; create linked defect issues with FIX-01 retest target October 11 | October 10 |
| [SCRUM-17](https://sadhirr1.atlassian.net/browse/SCRUM-17) | Release candidate and acceptance | REL-01 by October 12; PM-03 by October 13 | October 13 |
| [SCRUM-18](https://sadhirr1.atlassian.net/browse/SCRUM-18) | Coordination, scrum, and retrospective | DL-01 setup September 30; DL-02 closeout October 13 | October 13 |

## Initial backlog

The rows describe the planned backlog; Jira records each item's current status. An item remains To Do until its readiness is verified. Required items take precedence over optional polish.

| Planning ID | Owner | Deliverable and acceptance | Dependencies | Target | Independent reviewer |
| --- | --- | --- | --- | --- | --- |
| PM-01 | Product manager | Baseline product brief: player outcome, working scope, exclusions, acceptance criteria, and unresolved decisions explicitly recorded. | None | September 30 | Game designer + QA |
| DL-01 | Coordinator | Delivery setup: Jira items linked to planning IDs and existing epic/sprint, GitHub workflow documented, role ownership assigned, existing delivery dates recorded, and scheduling implementation verified or visibly blocked. | PM-01 | September 30 | Product manager |
| DEV-01 | Developer | Initial architecture and reuse assessment: inspect available prototype if accessible, document adopted/rejected elements, verify setup approach, and recommend typed-input handling. No unverified reuse claims. | PM-01 | September 30 | Independent developer + UX |
| PM-02 | Product manager | Prioritized, testable backlog: all required criteria mapped to owned work; scope and input-handling decisions resolved or escalated with options. | PM-01, DEV-01 | September 30 | QA + developer |
| GD-01 | Game designer | Scenario specification: four proposed stakeholders, five proposed rounds, conflicting objectives, information boundaries, and at least three reference playthroughs. | PM-01 | October 2 | Product manager + UX |
| UX-01 | UX designer | Complete journey and interaction flow: onboarding, conversations, decisions, clarification, consequences, completion, debrief, and restart. Include keyboard and narrow-screen behavior. | PM-01, DEV-01 | October 2 | Developer + QA |
| GD-02 | Game designer | State and consequence rules: explicit memory, trust, rumor, and delayed-effect rules; debrief claims mapped to event evidence. Rules satisfy AC-02 through AC-06. | GD-01 | October 2 | Developer + QA |
| VIS-01 | Visual designer | Reviewable screen specifications and shared visual rules for all primary game states; readable text, visible focus, and non-color status cues. | UX-01 | October 2 | UX + developer |
| QA-01 | QA specialist | Test plan covering every required acceptance criterion, reference playthroughs, typed-input ambiguity and preset equivalence, hidden-information leaks, repeated actions, and the accepted refresh/reopen policy. Initial draft September 30; finalize fixture coverage after reviewed rules exist. | PM-02, GD-01, GD-02, UX-01 | October 2 | Product manager + developer |
| DEV-02 | Developer | Runnable foundation: documented setup, automated check entry points, game-state boundaries, event recording, and a start-to-finish skeleton. | DEV-01, PM-02 | October 2 | Independent developer |
| DEV-03 | Developer | Base scenario loop: a playable preset-driven session starts, moves through valid round transitions, completes, and restarts cleanly. Meaningful engine checks verify the core transitions. Advanced consequence behavior follows in DEV-07. | GD-02, DEV-02, QA-01 | October 4 | Independent developer + game designer |
| DEV-04 | Developer | Player interface: implements reviewed flows and visual specifications for the base loop, including stakeholder information and decision feedback. Primary loop is keyboard usable. | DEV-02, UX-01, VIS-01 | October 4 | UX + visual designer; code reviewed separately |
| DEV-07 | Developer | Consequence implementation: integrate reviewed memory, trust, rumor, and delayed-effect rules; verify allowed information flow and delayed triggers against approved fixtures. | GD-02, DEV-03, QA-01 | October 6 | Independent developer + game designer |
| DEV-05 | Developer | Typed decisions: interpreted intent is shown before state changes; ambiguous and unsupported input follows the agreed handling; representative language cases pass. | PM-02, GD-02, DEV-03, DEV-04 | October 6 | Independent developer + UX |
| DEV-06 | Developer | Debrief and integrated scenario: every assessment claim links to actual events; full game completes and replays; reference playthroughs show different consequences. | DEV-03, DEV-04, DEV-05, DEV-07 | October 7 | Independent developer + game designer |
| QA-02 | QA specialist | Independent integrated test report: execute required criteria against an identified build, attach evidence, log reproducible defects, and verify hidden information and debrief accuracy. | DEV-06, QA-01 | October 10 | Independent developer + product manager |
| UX-02 | UX designer | Usability review: inspect implemented flows and seek representative player feedback where available; record observations separately from assumptions and prioritize issues. | DEV-06 | October 10 | Product manager + QA |
| FIX-01 | Developer | Release fixes and retests: resolve required acceptance failures and severe defects; link each correction to its defect issue and regression evidence. | QA-02, UX-02 | October 11 | Independent developer; QA verifies fixes |
| REL-01 | Coordinator + developer | Release candidate and handoff: documented setup, known limitations, release notes, traceable version, evidence links, and confirmed access/delivery method. | FIX-01 | October 12 | QA + product manager |
| PM-03 | Product manager | Acceptance decision: assess every required criterion against release-candidate evidence, record unresolved defects and disposition, and recommend release or a specific corrective action. | REL-01 | October 13 | QA + UX |
| DL-02 | Coordinator | Sprint review and retrospective: deliver the accepted result, summarize actual outcomes and remaining backlog, record process improvements and follow-up ownership. | PM-03 | October 13 | Product manager |

Optional polish may receive additional tickets only after its effect on required work and review capacity is assessed. Tickets should be split further when they cannot produce a small, reviewable deliverable.

## Delivery checkpoints

| Period | Expected evidence | Decision if evidence is missing |
| --- | --- | --- |
| September 29–30 | Working scope, populated tracker, initial architecture recommendation, typed-input feasibility, recorded existing sprint dates. | Resolve dependencies before broad implementation; expose any threat to the deadline. |
| October 1–2 | Reviewed scenario and design, finalized test coverage, runnable start-to-finish skeleton. | Reduce optional complexity and remove blockers; do not defer the first playable loop until the final days. |
| October 3–7 | Base playable session by October 4, consequences and typed actions by October 6, integrated debrief by October 7, with appropriate automated checks. | Identify the remaining acceptance gap and protect review/testing time. |
| October 8–10 | Independent test evidence, UX findings, triaged defects, and focused reviews. | Prioritize failures of the player journey and evidence integrity. |
| October 11–13 | Verified fixes, release candidate, documented acceptance, release handoff, retrospective. | Report the actual unmet criteria; do not claim completion to satisfy the date. |

These are checkpoints within one two-week sprint, not gates that prevent early reviews or testing. Review small increments throughout implementation.

## Definition of Done

A work item is Done only when its deliverable exists, its acceptance criteria pass, a separate reviewer has resolved or explicitly accepted findings, appropriate validation has evidence, and its Jira/GitHub links and handoff are current. Code must be integrated through the agreed review workflow before the implementation item is Done.

The release is accepted only when all required product criteria pass against the identified release candidate. Apply the [quality plan's severity and release rules](quality-plan.md#defect-severity-and-release-rules): no open S0 or S1 defects and no unresolved acceptance-blocking S2 defects. A deadline does not waive these gates. Minor defects require documented impact, a workaround if applicable, an owner, and a release decision. Scope changes require the quality plan's explicit acceptance and dependency review. Ticket completion alone does not establish release readiness.

## Daily scrum and work logs

At 8 p.m. America/Los_Angeles local time each day, the coordinator should report each role's completed outcomes, current action point, next action, blockers, and review results. Include links to changed artifacts or playable evidence when available, decisions needing user input, and the next day's priorities. A role with no activity should be reported honestly.

The coordinator confirmed active scrum automation `stakewolf-daily-scrum` through October 13. Its existence does not establish that a future briefing or any work session has executed.

The user requested eight hours of work per day and subsequently selected hourly session starts from 6 a.m. through 1 p.m. Use that morning schedule and record execution prerequisites and interruptions. Log measured activity only where it can be supported. Do not treat scheduled time, overlapping agent activity, waiting, or an open application as proof of eight hours worked; never sum overlapping agent durations into a misleading elapsed-work figure.

Work logs should capture meaningful actions and results rather than internal reasoning or exhaustive tool traces. If work stops, retain a durable handoff: role, ticket, artifact location, last verified state, review findings, blocker, and exact next action.

## Change control and risks

New required work must identify its acceptance criteria, effort implications, and what it displaces. The product manager records the tradeoff; the coordinator keeps the deadline and dependencies visible. Routine reversible design refinements can proceed with documented team review. Consequential changes to scope, cost, or release commitments need user input. Required scope changes always need a recorded decision.

| Risk | Early signal | Response |
| --- | --- | --- |
| Typed input exceeds the bounded model | Representative language cannot be interpreted transparently. | Complete the initial assessment by September 30; document a viable alternative and its dependencies. |
| Scope expansion | Required items or rounds are added without capacity tradeoffs. | Preserve the playable scenario and evidence-based debrief; defer optional breadth. |
| Unavailable execution capacity | Interrupted sessions, usage limits, offline machine, or approvals block progress. | Log the actual blocker and reforecast the affected items; do not fabricate time or progress. |
| Review becomes a bottleneck | Multiple items wait for the same reviewer. | Keep changes small and schedule a separate qualified reviewer before starting more work. |
| Prototype reuse is harder than expected | Candidate code lacks reproducible setup, tests, or clear behavior. | Record the assessment and proceed with an explicit implementation decision. |
| Player feedback is unavailable | No representative tester can participate by October 10. | Conduct an independent UX inspection, label the evidence accurately, and retain player validation as an open follow-up. |
| Deadline pressure hides quality gaps | Required failures remain late in the sprint. | Publish the specific remaining gap and corrective plan; accept the release only against verified criteria. |

The existing Jira sprint, epic, tickets listed above, and active scrum automation are confirmed context reported by the coordinator. Their implementation outcomes, GitHub publication, work-session execution, and deployment require separate evidence. This setup is not the completed game.
