# Stakewolf working instructions

## Objective and source of truth

Build Stakewolf as an engaging product management simulation. Use Jira project SCRUM at https://sadhirr1.atlassian.net and release epic SCRUM-5 for live work status. Use https://github.com/sadhirr1/Stakewolf for reviewed source and delivery history.

Read README.md, docs/product-brief.md, docs/sprint-plan.md, docs/agent-team.md, docs/quality-plan.md, and docs/backlog.md before choosing work. Reconcile their planning baseline with live Jira and the current repository state. The original Jira sprint ended October 13, 2026 at 8:48 p.m. America/Los_Angeles; it is a historical record and has not been extended. The owner accepted a complete playable-candidate checkpoint for November 6 and a first-case release decision target of November 13, 2026. Use [docs/revised-release-plan.md](docs/revised-release-plan.md) as the current scope and schedule. Raise delivery risks early; never claim a release solely because the date arrived.

## Delegation and ownership

The owner explicitly requests specialist subagents and independent cross-review. Delegate independent work to product, game design, UI/UX, visual design, development, QA, and coordination roles as appropriate. Use the concurrency available in the current session; the initial setup has three worker slots plus the coordinator. Persist role responsibilities and handoffs so later sessions can resume.

Give each assignment a Jira key, bounded action, owned files, acceptance criteria, independent reviewer, and expected evidence. Parallel writers must own different files or isolated branches. The author cannot approve their own deliverable under a different role name. Review small increments and resolve findings before integration.

## Progress and decisions

Use the existing Jira statuses To Do, In Progress, In Review, and Done. Review and verification occur within In Review. Record blockers with a reason, dependency owner and next action. Do not overwrite unrelated or sample issues.

Log meaningful actions, artifacts, review findings, defects and next steps on the responsible issue. Use actual account identities for external writes and name the acting agent role honestly. Never invent separate employee accounts, passing tests, progress, or billable work hours. Publish useful results and evidence, not private reasoning or credentials.

Use the product proposal as the working baseline for reversible design and implementation choices. Refine it through specialist review within the user's authorized goal. Document assumptions; seek user input for consequential scope, cost or release decisions when needed. Do not turn every provisional design detail into an unnecessary permission gate. Inspect the earlier prototype before deciding whether to reuse it; do not edit another chat's active checkout without coordinating ownership.

## GitHub and verification

Link branches, commits and pull requests to actual SCRUM issue keys. Preserve unrelated work. Use reviewed pull requests after the initial empty-repository bootstrap. Keep private configuration and secrets out of Git. The supplied repository is public; do not change its visibility without instruction.

Apply the quality plan's severity and release gates. Run meaningful checks appropriate to each change, inspect user-visible UI, and record actual results. Keep durable evidence in Jira attachments, retained CI artifacts with recorded retention, or sanitized docs/evidence summaries. Generated local reports alone are insufficient for handoff. Do not claim CI, branch protection, deployment, or application tests exist until verified.

## Scheduling and continuity

The owner canceled the Stakewolf work-session and daily-scrum automations. They remain off unless the owner explicitly asks to restart them. Work proceeds only in manually initiated, focused sessions. Never describe a planned window as elapsed work or claim activity hours that were not measured.

At each manually initiated session, inspect active work and the latest Jira handoff, select an unblocked priority, complete a useful reviewed increment, update GitHub and Jira, and leave a checkpoint. Avoid overlapping changes from other chats or agents. Routine progress belongs in Jira; notify the owner for meaningful completion, failure, required action, or material delivery risk. If the owner requests a scrum, report every role's actual completed work, evidence, review results, blockers and next actions, including roles with no activity. Do not initiate voice calls, create schedules, or extend the release window automatically.

