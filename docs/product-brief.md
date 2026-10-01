# Stakewolf product brief

Status: first-release working scope, reconciled with the September 30 read-only prototype audit and independently reviewed by QA. Process requirements below are confirmed; game details are working defaults that agents may refine through independent review. Agents may make reversible design decisions within scope without requesting user permission for each choice. Escalate consequential scope, cost, or release changes. The existing Jira sprint supplies the delivery calendar. The candidate snapshot is imported into `public/` as a development baseline; this is not a release acceptance claim. See the [prototype assessment](prototype-assessment.md) for evidence and gaps.

## Purpose

Stakewolf is a product management simulation inspired by Werewolf. The player works with stakeholders who have conflicting priorities, hidden agendas, incomplete information, and changing relationships. Decisions can affect trust, spread rumors, and create consequences in later rounds.

The intended player outcome is to practice making and explaining product decisions under uncertainty, then understand how those decisions affected people and delivery. The debrief should provide evidence from the playthrough. It should not present a short game as a validated hiring assessment.

## Confirmed requirements

| Requirement | Implementation implication |
| --- | --- |
| Distinct specialist agents with their own action points | Give each work item an owner role, a concrete deliverable, and an independent reviewer. |
| Agile software development lifecycle | Maintain a prioritized backlog, acceptance criteria, review stages, testing evidence, and a release decision. |
| Complete work tracked in Jira | Use the confirmed Stakewolf Jira project, key `SCRUM`, for work items, progress, blockers, reviews, and evidence links. |
| Work updated in GitHub | Use the supplied repository, [sadhirr1/Stakewolf](https://github.com/sadhirr1/Stakewolf), for source, documentation, reviewable changes, and release history. |
| Every person's work reviewed by another specialist | An author cannot approve their own deliverable by changing role labels. Assign a separate reviewing agent. |
| Daily scrum at 8 p.m. | Provide a role-by-role briefing with actual outcomes, reviews, blockers, and next actions at 8 p.m. America/Los_Angeles local time. This is PDT during the current sprint. |
| Requested eight hours of daily work; scheduled sessions from 6 a.m. through 1 p.m. | Use the revised morning schedule in Los Angeles time. Report measured execution honestly; scheduled time is not evidence of eight hours worked. |
| Completion in two weeks | Use the existing `SCRUM Sprint 0` (ID `2`), September 29–October 13, 2026. Target first-release acceptance by its existing end, October 13 at 8:48 p.m. Los Angeles time. |

Jira account ownership and agent role ownership are different concepts. Record the specialist role explicitly without inventing user accounts or claiming that each agent has an independent Jira identity.

## First-release working scope

The first release is a complete browser-based scenario with four stakeholders and five decision rounds. Retain these defaults from the inspected prototype. They are product working decisions, not user-specified numbers. The team can refine them through documented product and feasibility review; a consequential change to the promised scope or deadline requires user input.

The player should be able to start a session, learn the situation, gather stakeholder information, make consequential decisions, see the situation evolve, finish the scenario, inspect a supported debrief, and replay with a different strategy.

| ID | Priority | Proposed feature | Acceptance criteria |
| --- | --- | --- | --- |
| AC-01 | Required | Start and complete a scenario | A new player can understand the objective and controls, complete every round, and reach the debrief without a dead end. A restart creates a clean session. |
| AC-02 | Required | Distinct stakeholders | Each of the four stakeholders has a public responsibility, private objective, starting information, and reaction rules. At least two objectives create a meaningful conflict. Ordinary gameplay screens and tools reveal hidden information only when a scenario rule permits it. The client-only game does not claim to keep authored agendas secret from someone inspecting its source. |
| AC-03 | Required | Decisions and consequences | Each of the five proposed rounds offers at least two materially different choices. At least two earlier decisions affect a later round. Three reviewed reference playthroughs produce meaningfully different event histories or endings. |
| AC-04 | Required | Stakeholder memory, trust, and rumors | Stakeholder reactions can reference prior decisions. Trust and rumor changes follow documented rules. The player can distinguish a stakeholder claim from established scenario evidence. Tests verify when information may spread and when it must remain private. |
| AC-05 | Required | Typed decisions with understandable handling | The player can type a decision. The game shows its interpreted intent before applying consequences. Ambiguous or unsupported input asks for clarification or offers explicit choices; it never silently invents an action. Representative paraphrases, ambiguous input, and irrelevant input are tested. Equivalent confirmed typed and preset actions produce equivalent effects. |
| AC-06 | Required | Evidence-based debrief | The debrief cites recorded decisions and resulting events for every assessment claim. It explains tradeoffs, identifies uncertainty, and gives actionable reflection prompts. It does not invent events or claim a validated measure of professional competence. |
| AC-07 | Required | Usable interface | The full loop works with keyboard input; focus is visible; text and controls remain usable at 200% zoom and representative phone and desktop widths. Consequences and action confirmations do not rely on color alone. |
| AC-08 | Required | Reproducible release | A fresh setup can run the documented checks and start the game. Automated engine tests and an independently executed full playthrough pass against the release candidate. No known defect prevents starting, deciding, completing, or receiving an accurate debrief. |
| AC-09 | Optional | Additional polish | Optional animation, sound, or extra conversation variations may be added only after required criteria pass and required review time is protected. |
| AC-10 | Required | Clear session and restart behavior | The selected first-release policy starts a clean session after refresh or reopen. Before play, the interface visibly explains that progress is not saved. Restart clears prior events, relationships, pending effects, and pending interpretation requests. Reliable local saving may be added through a recorded product/development decision with recovery tests. The October 1 correction adds the visible intro notice; full release-path verification remains required. |

Required means the working release scope, not permission to call an unfinished feature complete. A scope change requires a recorded decision and updated acceptance criteria before release evaluation. Scope acceptance for SCRUM-6 is distinct from implementation acceptance for the feature tickets.

## Typed-input decision

Retain the candidate's bounded interpreter as the starting approach: words suggest one of three explicit scenario intents, the player reviews or changes the selection, and only confirmation applies consequences. Ties or no match require an explicit choice. The September 30 source audit establishes how this is implemented, not that it handles varied player language well. SCRUM-14 must verify paraphrases, ambiguity, negation, irrelevant input, and equivalent confirmed typed/preset actions. Describe the feature as authored intent matching, not live AI or unrestricted semantic understanding.

An AI-backed interpreter is an alternative, not an assumed dependency. Before adopting it, record the provider, cost expectations, credential handling, player-data handling, response validation, fallback behavior, and test strategy. The engine must apply only validated actions and remain testable independently of generated text.

If the bounded approach cannot satisfy AC-05, raise a product decision promptly. Do not quietly replace typed decisions with a nonfunctional text box or drop them from the release.

## Out of scope for this release baseline

- Multiplayer, voice interaction, or real-time multi-user sessions.
- A large scenario library or unrestricted generated story worlds.
- Recruiter dashboards, public leaderboards, and a hiring score.
- Account systems, payments, or saved progress across refresh, reopen, or devices under the selected first-release baseline.
- A guaranteed eight hours of uninterrupted unattended execution.

Hosting destination and public release permissions are unresolved. A runnable release candidate in GitHub is distinct from deployment to a public website.

## Decision log

| ID | Status | Decision or open question | Owner / evidence needed |
| --- | --- | --- | --- |
| D-01 | Confirmed | Use specialist agents, Agile tracking, independent review, Jira, and GitHub. | User instructions; Jira project `SCRUM` and supplied GitHub repository. |
| D-02 | Confirmed existing sprint | Use `SCRUM Sprint 0` (ID `2`) and [epic SCRUM-5](https://sadhirr1.atlassian.net/browse/SCRUM-5). The recorded sprint runs September 29, 2026, 8:48 p.m. PDT to October 13, 2026, 8:48 p.m. PDT. | Existing Jira sprint metadata, reported by the coordinator. This record does not claim the agents created or started the sprint. |
| D-03 | Confirmed revised schedule; automations active | Daily work-session starts hourly from 6 a.m. through 1 p.m.; scrum at 8 p.m., America/Los_Angeles. Both schedules continue through October 13. | User's September 29 schedule change and coordinator verification. Scheduled opportunities and measured execution are separate. |
| D-04 | Selected working scope after source audit | Retain one scenario, four stakeholders, and five rounds. | September 30 product audit; scenario completeness and quality still require authored rules and independent validation. |
| D-05 | Selected baseline; language validation outstanding | Retain bounded keyword-based intent suggestions with explicit confirmation and fallback choice. | Source audit of `interpretDecision` and proposal UI; SCRUM-14 owns language cases and AC-05 validation. |
| D-06 | Selected technical direction | Keep client-only runtime behavior, without accounts, a backend service, or a paid AI provider for this baseline. | Inspected source uses local modules and browser APIs. Development owns reproducible serving and checks; introducing consequential cost requires a separate decision. |
| D-07 | Source audit and initial import verified; layout repair recorded | The inspected five-file candidate snapshot is adopted into `public/` as a starting point, with a subsequent targeted `app.js` layout repair. | [Prototype assessment](prototype-assessment.md) records the original matching import hashes, the changed file's hash, browser evidence, AC mapping, and narrative defects. Provenance and the targeted repair do not establish release readiness. |
| D-08 | Open | Release and hosting destination. | Coordinator establishes how the user will access the release candidate and whether deployment is authorized. |
| D-09 | Selected session policy after source audit | Refresh or reopen starts a clean session; reliable saved progress is not part of this baseline. | No persistence or recovery implementation was found in the inspected snapshot. Earlier recovery claims do not apply to it. Nothing is being removed. SCRUM-8/12 must expose the warning before play; QA verifies the behavior. |

## Evidence and success

Judge this release by the acceptance criteria above, the quality of independent reviews, and observed player experience. Record player feedback as observations with context. Small informal playtests do not establish general usability or recruiting effectiveness.

The sprint plan translates this proposal into owned, reviewable work. Jira is the live work tracker; these repository documents preserve the product intent and agreed delivery rules.
