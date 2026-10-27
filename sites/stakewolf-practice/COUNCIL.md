# SCRUM-38 council prototype

October 25 variation increment: this contract describes the original situation. Each topic also has two authored alternatives with different evidence, objectives, support rules and consequences. See VARIATIONS.md for selection, stable attempt identity, deliberate repeat and legacy compatibility. The original situation remains unchanged.

This is a bounded, deterministic two-round extension to the PM practice site. It reuses the accessibility and systems case premises in `dist/adapt.mjs`: three public stakeholder claims, three source records, and fixed private incentives. It is not the historical five-round release candidate and does not establish release acceptance.

Development/Game Design owns `dist/council.mjs`, `tests/council.test.mjs`, and this contract. The coordinator owns the UI integration. A separate QA reviewer must review the engine, interaction, and evidence before integration approval; this document is not self-approval.

## Public interface

```js
import {councilTopics, createCouncil, councilView, councilAct} from './council.mjs';
let state = createCouncil('accessibility'); // or 'systems'
state = councilAct(state, {type:'investigate', recordId:'focus'});
state = councilAct(state, {type:'promise', commitmentId:'verification'});
state = councilAct(state, {type:'propose', proposalId:'repair'});
state = councilAct(state, {type:'commit'});
state = councilAct(state, {type:'allocate', workId:'announce'});
state = councilAct(state, {type:'finish'});
const view = councilView(state);
```

`councilTopics` contains frozen `{id,title,description}` metadata. `createCouncil` throws `RangeError` for unsupported topics. `councilView` throws `TypeError` for structurally invalid state. `councilAct` returns the identical state for invalid, repeated, out-of-phase, or unaffordable actions. Valid actions return a new state and never mutate an input. Rendering should use `councilView`, not authored case data. State is not a security boundary and is not intended for importing untrusted saves.

| Action | Phase | Behavior |
| --- | --- | --- |
| `investigate {recordId}` | council | Opens one known record, once. Maximum two records per attempt. |
| `promise {commitmentId}` | council | Toggles a capacity reservation; updates conditional stakeholder support. |
| `propose {proposalId}` | council | Selects a known approach; reserves 2 next-round units. |
| `commit` | council | Requires a proposal; locks the approach, investigation, and promises. |
| `allocate {workId}` | aftermath | Toggles optional response work if it fits. Locked work cannot be toggled. |
| `finish` | aftermath | Delivers reserved and selected work, defers every unselected response, and reveals incentives. |
| `replay` | any valid phase | Starts a clean attempt with the same topic, evidence, and motives. |

The serializable view exposes `topic`, `title`, `intro`, `phase`, `round`, `error`, `stakeholders`, `records`, `investigationRemaining`, `investigation`, `proposals`, `commitments`, `capacity`, `cost`, `canCommit`, `trace`, `aftermath`, and `debrief`. Records omit the `text` key until opened. `aftermath` and `debrief` remain null until their phase is reached. `round` is 1 in council and 2 afterward. The top-level `cost` is the decision/promise reservation; `aftermath.cost` includes optional work.

Stakeholders contain `{id,name,role,claim,support,condition}`. Support is `supports`, `conditional`, or `opposes`, with a plain-language condition. It is an interest-based response and never a player score or commitment gate. Changing evidence, promises, or the proposal recomputes it before commitment.

Aftermath contains a summary, `{name,text}` reactions, capacity/cost, `canFinish`, `finishLabel`, and work rows. Rows contain `{id,title,detail,cost,selected,origin,locked,consequence,outcome}`. Origins are `decision`, `commitment`, and `response`. The first two are locked, selected reservations. Optional rows always explain what deferral means. `canFinish` is immediately true: knowingly deferring all optional responses is allowed and is recorded. Reactions change with the response plan and become actual outcome statements in the debrief.

Debrief contains `summary`, `reveals` (`{id,name,role,objective,reflection}`), `fulfilled` and `deferred` work objects, `feedback` strings, and public `trace` strings. Fulfilled detail describes the authored outcome; deferred detail describes the remaining consequence. Trace records opened sources in order, the committed proposal/promises, and the final response allocation. Editing draft selections does not append events, so toggles cannot duplicate commitments or grow history indefinitely.

## Capacity and consequences

Each case has 6 units for round 2. Every approach reserves 2; the three promises cost 1, 2, and 1. Both optional responses cost 2 and 3, so even without promises the player must defer at least one. All promises can fit, but taking them all leaves no capacity for the new evidence. The visible next-round reservation makes this trade-off knowable before commitment. Promises are automatically fulfilled from reserved capacity at `finish`; they cannot be broken or silently removed in round 2. The meaningful follow-through choice is which additional response to fund or defer.

Accessibility distinguishes local repair, a previous-screen fallback, and a longer shared replacement. The new error-announcement failure is separate from the focus trap. Each route has distinct carried work, optional work, and deferral effects. Verification does not assert universal accessibility; the fallback and unfinished replacement are not silently deemed usable.

Systems distinguishes a versioned customer pilot, waiting for external readiness, and a smaller adapter proposal. The new external-parser trace changes the response choices for the selected route. A rollback drill does not verify parsers; a pilot does not authorize a common-format rollout; a customer conversation does not invent customer acceptance. Legacy maintenance, acceptance, and unconfirmed external readiness remain explicit when relevant.

Private incentives are excluded from ordinary public views and revealed only after finish. They remain present in client source: this is concealment for ordinary play, not protection against source inspection. Motives remain fixed for fair replay. There is no network, AI call, randomization, proficiency score, account, or cross-session saving in this module.

## Verification and handoff

Run `node --test tests/council.test.mjs` from the practice-site folder. Tests cover both topics, source visibility, investigation limits, documented support conditions, all proposal/promise combinations, distinct response sets, capacity rejection, deliberate deferral, locked work, terminal guards, replay, input immutability, public-view detachment, and invalid states/actions.

Independent QA still owns full interaction, keyboard, narrow-screen, and visual review. Retained session evidence and Jira/GitHub disposition are coordinated outside these owned files. A passing engine test does not establish UI or release acceptance.
