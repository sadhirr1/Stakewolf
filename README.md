# Stakewolf

A product management simulation inspired by Werewolf: stakeholders have competing objectives, decisions change relationships, and consequences unfold over time.

## Project status

This branch contains a reviewed combined proposal with four stakeholders, five rounds, prepared and typed decisions, conditional stakeholder memory, delayed consequences and a debrief linked to actual events. It runs locally without dependencies or an account. The [October 3 combined record](docs/evidence/session-2026-10-03-1000.md) and [independent QA record](docs/evidence/session-2026-10-03-1000-qa.md) identify executed checks and their limits. Integration approval and full release acceptance remain tracked in Jira.

- [Release epic — SCRUM-5](https://sadhirr1.atlassian.net/browse/SCRUM-5)
- [GitHub repository](https://github.com/sadhirr1/Stakewolf)

The current release target is October 13, 2026, using the existing two-week Jira sprint. Progress and completion claims must be supported by reviewed artifacts and test evidence.

## Run locally

Use Node.js 24.x; development was checked with Node.js 24.19.0. No package installation, account, API key, or build step is required. From the repository root, run:

```sh
node server.mjs
```

Open [Stakewolf on this computer](http://127.0.0.1:4173). Stop the server with Ctrl+C. If that port is occupied, choose another with `node server.mjs 4174` and open the printed address. The server binds only to this computer's loopback address and serves the five known game assets from `public/`.

Progress stays in the current page session. Refreshing, reopening, or choosing restart starts a clean attempt. Written decisions are matched to explicit authored approaches for the player to review and confirm; no live AI service is called. Private agendas are concealed during ordinary play but remain present in the downloadable client source.

## Check the baseline

Run the independent automated tests with Node's built-in test runner:

```sh
node --test
```

Check JavaScript syntax when changing the application or server:

```sh
node --check server.mjs
node --check public/app.js
node --check public/engine.js
node --check public/scenario.js
```

If npm is available, `npm start`, `npm test`, and `npm run check` are optional shortcuts; the direct Node commands work without npm. The [baseline workflow](.github/workflows/checks.yml) runs syntax checks and tests on Windows and Linux when triggered in GitHub. Its presence does not claim that a remote run has passed or branch protection is configured. Automated baseline checks do not establish full product, accessibility, or release acceptance.

The authored browser files live in `public/`: `scenario.js` supplies scenario data, `engine.js` applies deterministic state transitions, and `app.js` renders the interface. `index.html` and `style.css` provide the page structure and styling. They were imported as an unchanged snapshot from the earlier prototype, then a missing closing tag in `app.js` was repaired after browser review found compressed game content. The original prototype, its hosting configuration, and its other files were left untouched. Make future changes in this repository and link them to the relevant Jira ticket.

## Delivery documents

- [Product brief and release acceptance](docs/product-brief.md)
- [Sprint plan and dependencies](docs/sprint-plan.md)
- [Live Jira ticket index](docs/backlog.md)
- [Agent roles, reviews and handoffs](docs/agent-team.md)
- [Quality plan and release gates](docs/quality-plan.md)
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

## Daily rhythm

During the release window, work sessions are scheduled hourly from 6 a.m. through 1 p.m. and the daily scrum at 8 p.m., America/Los_Angeles. These schedules are configured in the project chat, not by this repository. They require the local computer and app to be available and sufficient usage capacity. Eight scheduled opportunities do not guarantee eight uninterrupted hours of execution.

Every role reports concrete results, evidence, review findings, blockers and its next action. Jira is authoritative for current status; this repository records the reviewed deliverables.
