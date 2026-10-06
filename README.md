# Stakewolf

A product management simulation inspired by Werewolf: stakeholders have competing objectives, decisions change relationships, and consequences unfold over time.

## Project status

This branch contains a reviewed combined proposal with four stakeholders, five rounds, prepared and typed decisions, conditional stakeholder memory, delayed consequences and a debrief linked to actual events. It runs locally without dependencies or an account. The [October 3 combined record](docs/evidence/session-2026-10-03-1000.md) identifies integration checks. The subsequent [fresh setup and keyboard journey](docs/evidence/session-2026-10-03-1100.md) and [independent fresh-checkout QA](docs/evidence/session-2026-10-03-1100-qa.md) record 99 passing tests and an actual keyboard-only five-round path. Actual 200% zoom, delivered download and broader acceptance remain open. Integration approval and full release acceptance remain tracked in Jira.

- [Release epic — SCRUM-5](https://sadhirr1.atlassian.net/browse/SCRUM-5)
- [GitHub repository](https://github.com/sadhirr1/Stakewolf)

The [October 3 startup recovery increment](docs/evidence/session-2026-10-03-1300.md) adds a usable failed-load reload screen and static no-script guidance. [Independent QA](docs/evidence/session-2026-10-03-1300-qa.md) passed 109 tests and five syntax checks; controlled missing-module, partial initialization and normal startup browser checks were independently reviewed. Actual JavaScript-disabled browser rendering remains unverified.

The owner accepted a revised **November 6, 2026 complete-candidate checkpoint** and **November 13, 2026 first-case release decision target** on October 4. The original October 13 sprint is historical and was not extended. The revised scope is tracked under [SCRUM-19](https://sadhirr1.atlassian.net/browse/SCRUM-19) and its linked follow-up issues. The [revised release plan](docs/revised-release-plan.md) covers evidence-based investigation, accumulating obligations, and an original visual redesign. Progress and completion claims require reviewed artifacts and test evidence; the date alone does not establish release acceptance.

## Run locally

Use Node.js 24.x; development was checked with Node.js 24.19.0. No package installation, account, API key, or build step is required. From the repository root, run:

```sh
node server.mjs
```

Open [Stakewolf on this computer](http://127.0.0.1:4173). Stop the server with Ctrl+C. If that port is occupied, choose another with `node server.mjs 4174` and open the printed address. The server binds only to this computer's loopback address and serves the six known game assets from `public/`.

Progress stays in the current page session. Refreshing, reopening, or choosing restart starts a clean attempt. Written decisions are matched to explicit authored approaches for the player to review and confirm; no live AI service is called. Private agendas are concealed during ordinary play but remain present in the downloadable client source.

## Check the baseline

Run the independent automated tests with Node's built-in test runner:

```sh
node --test
```

Check JavaScript syntax when changing the application or server:

```sh
node --check server.mjs
node --check public/bootstrap.js
node --check public/app.js
node --check public/engine.js
node --check public/scenario.js
```

If npm is available, `npm start`, `npm test`, and `npm run check` are optional shortcuts; the direct Node commands work without npm. The [baseline workflow](.github/workflows/checks.yml) runs syntax checks and tests on Windows and Linux when triggered in GitHub. Its presence does not claim that a remote run has passed or branch protection is configured. Automated baseline checks do not establish full product, accessibility, or release acceptance.

The authored browser files live in `public/`: `scenario.js` supplies scenario data, `engine.js` applies deterministic state transitions, and `app.js` renders the interface. `bootstrap.js` loads the game and reports startup failure; `index.html` provides recovery before scripts run, with guidance when JavaScript is disabled. `style.css` provides styling. The initial assets were imported from the earlier prototype, then a missing closing tag in `app.js` was repaired after browser review found compressed game content. The original prototype, its hosting configuration, and its other files were left untouched. Make future changes in this repository and link them to the relevant Jira ticket.

## Delivery documents

- [Product brief and release acceptance](docs/product-brief.md)
- [Revised one-case release plan and new acceptance checks](docs/revised-release-plan.md)
- [Sprint plan and dependencies](docs/sprint-plan.md)
- [Live Jira ticket index](docs/backlog.md)
- [Agent roles, reviews and handoffs](docs/agent-team.md)
- [Quality plan and release gates](docs/quality-plan.md)
- [Release-readiness evidence and remaining acceptance](docs/release-readiness.md)
- [Runnable candidate handoff and next reviewer steps](docs/release-handoff.md)
- [Prototype assessment and known product gaps](docs/prototype-assessment.md)
- [Reviewed scenario rules and reference paths](docs/scenario-rules.md)
- [Reviewed player journey and interaction requirements](docs/player-experience.md)
- [October 1 narrative and interaction verification](docs/evidence/session-2026-10-01.md)
- [October 1 memory, event and reference-path verification](docs/evidence/session-2026-10-01-0600.md)
- [Typed-decision contract](docs/typed-decision-contract.md)
- [Event-grounded debrief contract](docs/debrief-contract.md)
- [Visual system](docs/visual-system.md)
- [Combined gameplay-equivalence contract](docs/integration-contract.md)
- [October 3 combined verification and retained captures](docs/evidence/session-2026-10-03-1000.md)
- [Agent working instructions](AGENTS.md)

The initial team setup has been cross-reviewed by product, engineering and QA agents. Application implementation and executed gameplay tests are separate work items.

## Work rhythm

The former hourly work-session and daily-scrum automations were canceled when the owner paused the project; they have not been restarted. Work has resumed in focused, manually initiated sessions. The ordinary Stakewolf usage ceiling is 55% of a weekly Codex allowance; the owner permits up to 155% of a normal weekly allowance during each owner-defined October 16–22 and October 22–29 work period, using available reset credits when useful. Account reset windows may differ from those project periods. No scheduled time is counted as work performed.

Every active role records concrete results, evidence, review findings, blockers and its next action. Jira is authoritative for current status; this repository records reviewed deliverables.

