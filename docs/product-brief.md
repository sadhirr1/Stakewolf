# Stakewolf product brief

Status: initial release working baseline. Process requirements below are confirmed; proposed game details are working defaults subject to feasibility and independent design review. Agents may refine reversible design details within scope without requesting user permission for each choice. Escalate consequential scope, cost, or release changes. The existing Jira sprint supplies the delivery calendar. This document does not claim that a playable build exists.

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

## Proposed first release

The first release is a complete browser-based scenario with four stakeholders and five decision rounds. These numbers are working planning defaults, not user-specified product requirements. The team can refine them through documented product and feasibility review; a consequential change to the promised scope or deadline requires user input.

The player should be able to start a session, learn the situation, gather stakeholder information, make consequential decisions, see the situation evolve, finish the scenario, inspect a supported debrief, and replay with a different strategy.

| ID | Priority | Proposed feature | Acceptance criteria |
| --- | --- | --- | --- |
| AC-01 | Required | Start and complete a scenario | A new player can understand the objective and controls, complete every round, and reach the debrief without a dead end. A restart creates a clean session. |
| AC-02 | Required | Distinct stakeholders | Each of the four proposed stakeholders has a public responsibility, private objective, starting information, and reaction rules. At least two objectives create a meaningful conflict. Hidden information is unavailable to the player until a scenario rule reveals it. |
| AC-03 | Required | Decisions and consequences | Each of the five proposed rounds offers at least two materially different choices. At least two earlier decisions affect a later round. Three reviewed reference playthroughs produce meaningfully different event histories or endings. |
| AC-04 | Required | Stakeholder memory, trust, and rumors | Stakeholder reactions can reference prior decisions. Trust and rumor changes follow documented rules. The player can distinguish a stakeholder claim from established scenario evidence. Tests verify when information may spread and when it must remain private. |
| AC-05 | Required | Typed decisions with understandable handling | The player can type a decision. The game shows its interpreted intent before applying consequences. Ambiguous or unsupported input asks for clarification or offers explicit choices; it never silently invents an action. Representative paraphrases, ambiguous input, and irrelevant input are tested. Equivalent confirmed typed and preset actions produce equivalent effects. |
| AC-06 | Required | Evidence-based debrief | The debrief cites recorded decisions and resulting events for every assessment claim. It explains tradeoffs, identifies uncertainty, and gives actionable reflection prompts. It does not invent events or claim a validated measure of professional competence. |
| AC-07 | Required | Usable interface | The full loop works with keyboard input; focus is visible; text and controls remain usable at 200% zoom and representative phone and desktop widths. Consequences and action confirmations do not rely on color alone. |
| AC-08 | Required | Reproducible release | A fresh setup can run the documented checks and start the game. Automated engine tests and an independently executed full playthrough pass against the release candidate. No known defect prevents starting, deciding, completing, or receiving an accurate debrief. |
| AC-09 | Optional | Additional polish | Optional animation, sound, or extra conversation variations may be added only after required criteria pass and required review time is protected. |
| AC-10 | Required | Clear session and restart behavior | The proposed first release starts a clean session after refresh or reopen. Before play, the interface explains that progress is not saved. Restart clears prior events, relationships, pending effects, and pending interpretation requests. Reliable local saving may be added through an explicit scope decision with recovery tests. |

Required means proposed release scope, not permission to call an unfinished feature complete. A scope change requires a recorded decision and updated acceptance criteria before release evaluation.

## Typed-input decision

The proposed starting approach is a bounded interpreter that maps player text to explicit, testable scenario intents. The game would preview its interpretation and allow clarification before committing the action. The initial architecture assessment should check feasibility against varied player language by September 30.

An AI-backed interpreter is an alternative, not an assumed dependency. Before adopting it, record the provider, cost expectations, credential handling, player-data handling, response validation, fallback behavior, and test strategy. The engine must apply only validated actions and remain testable independently of generated text.

If the bounded approach cannot satisfy AC-05, raise a product decision promptly. Do not quietly replace typed decisions with a nonfunctional text box or drop them from the release.

## Out of scope for this first release proposal

- Multiplayer, voice interaction, or real-time multi-user sessions.
- A large scenario library or unrestricted generated story worlds.
- Recruiter dashboards, public leaderboards, and a hiring score.
- Account systems, payments, or saved progress across refresh, reopen, or devices under the proposed first-release baseline.
- A guaranteed eight hours of uninterrupted unattended execution.

Hosting destination and public release permissions are unresolved. A runnable release candidate in GitHub is distinct from deployment to a public website.

## Decision log

| ID | Status | Decision or open question | Owner / evidence needed |
| --- | --- | --- | --- |
| D-01 | Confirmed | Use specialist agents, Agile tracking, independent review, Jira, and GitHub. | User instructions; Jira project `SCRUM` and supplied GitHub repository. |
| D-02 | Confirmed existing sprint | Use `SCRUM Sprint 0` (ID `2`) and [epic SCRUM-5](https://sadhirr1.atlassian.net/browse/SCRUM-5). The recorded sprint runs September 29, 2026, 8:48 p.m. PDT to October 13, 2026, 8:48 p.m. PDT. | Existing Jira sprint metadata, reported by the coordinator. This record does not claim the agents created or started the sprint. |
| D-03 | Confirmed revised schedule; automations active | Daily work-session starts hourly from 6 a.m. through 1 p.m.; scrum at 8 p.m., America/Los_Angeles. Both schedules continue through October 13. | User's September 29 schedule change and coordinator verification. Scheduled opportunities and measured execution are separate. |
| D-04 | Proposed | One scenario, four stakeholders, five rounds. | Product manager validates scope against the desired player experience. |
| D-05 | Proposed | Bounded typed-intent interpretation with a visible confirmation step. | Developer feasibility check; UX and QA review against AC-05. |
| D-06 | Proposed | No accounts or server dependency unless required by an accepted technical decision. | Developer and product manager evaluate architecture and release needs. |
| D-07 | Open | Reuse any earlier prototype. | A candidate exists in another chat; at planning time it has not been audited or imported into this repository. It reportedly includes local recovery, which must be inspected independently before choosing the session policy or adopting code. |
| D-08 | Open | Release and hosting destination. | Coordinator establishes how the user will access the release candidate and whether deployment is authorized. |
| D-09 | Proposed scope boundary; audit pending | A refresh or reopen starts a clean session; reliable saved progress is not required under this initial proposal. | This is not a confirmed removal of any earlier prototype capability. Inspect the candidate's local recovery before choosing the final policy. UX must explain the accepted behavior; QA must verify it. Persistence requires its own acceptance and recovery checks. |

## Evidence and success

Judge this release by the acceptance criteria above, the quality of independent reviews, and observed player experience. Record player feedback as observations with context. Small informal playtests do not establish general usability or recruiting effectiveness.

The sprint plan translates this proposal into owned, reviewable work. Jira is the live work tracker; these repository documents preserve the product intent and agreed delivery rules.
