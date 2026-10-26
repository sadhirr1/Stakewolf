# SCRUM-38 authored council situations

Development/Game Design owns `dist/council.mjs`, `dist/council-variants.mjs`, `tests/council-variants.test.mjs` and this contract. Independent review belongs to the separately assigned QA reviewer; this document is implementation evidence, not self-approval. UI, saved-attempt identity and dialogue/coaching integration have separate owners.

Each topic now has three coherent situations. The original remains the default. New situations change public claims, evidence, private objectives, support conditions, promised work and consequences together. No fact is randomized during an attempt. Selection is local, with no model call, network request or usage charge from these modules.

```js
import {createCouncil, createFreshCouncil, councilVariantIds, councilView, councilAct} from './dist/council.mjs';
const first = createCouncil('accessibility'); // unchanged original situation
const next = createFreshCouncil(first.topic, first.variantId); // b or c
const repeat = councilAct(next, {type:'replay'}); // same authored situation, clean attempt
```

`councilVariantIds(topic)` returns the frozen IDs `original`, `b`, `c`. `createCouncil(topic, variantId='original')` records the ID in state. `councilView` exposes the same `variantId` plus neutral `variantLabel` (`Situation A`, `Situation B`, `Situation C`). The labels disclose no private objectives. State version remains 1; a legacy state with no `variantId` resolves to `original`. Unknown or null IDs are invalid, rather than silently changing a saved situation.

`createFreshCouncil(topic, previousId, random=Math.random)` samples uniformly among IDs other than a recognized previous ID. If there is no recognized previous ID, all three are eligible. It calls `random` exactly once; injected randomness must return a finite number in `[0,1)`. The resulting state fixes all authored facts and bargaining rules for that attempt. This small pool can recur after another situation; it is not unlimited scenario generation or calibrated difficulty. Deliberate `replay` retains the situation in every phase.

Proposal, stakeholder, record, promise and response IDs stay compatible with the original council. Every route still costs 2, promises cost 1/2/1, optional responses cost 2/3 and capacity remains 6. Promises remain locked and are delivered when the round finishes. At least one optional response must be deferred. No route earns a quality score or universally best outcome; support records interests rather than decision quality.

## Authored fact and bargaining map

The table is an author/reviewer reference and includes incentive information that ordinary play reveals only in the debrief.

| Topic / ID | Evidence and second-round finding | Private interests and changed bargaining | Trade-off retained |
| --- | --- | --- | --- |
| Accessibility / original | Automated contrast scan cannot establish task completion; keyboard focus trap; untagged complaints. Separate save-error announcement fails later. | Original showcase, specialist-queue and shared-component interests and rules remain unchanged. | Local repair, unverified previous route or unfinished shared replacement. |
| Accessibility / b | Fresh-session keyboard path works; ten-minute expiry loses values; five repeat contacts. Expiry warning is later found unannounced. | Design wants the shared layout established, Support wants repeat contacts reduced, Engineering wants a boundary around session ownership. Engineering can back the evidenced fallback without a promise; shared replacement now needs the timed walkthrough, recovery checks and a contact plan. | Local recovery leaves shared ownership open; fallback has longer timeout but unverified recovery; shared session replacement needs another cycle. |
| Accessibility / c | New screen passes keyboard at standard size but clips Save at 400% zoom. Previous route passes the recorded keyboard/zoom task only. Longer translated error text later covers recovery on the new layout. | Design wants local ownership of the enlargement fix, Support wants one guide, Engineering wants to avoid another component migration. Engineering can back the evidenced previous route; local repair instead needs the enlarged walkthrough and a revised showcase. | Previous-route evidence is useful but language scope remains open; local repair needs regressions; replacement displaces maintenance and is unfinished. |
| Platform / b | Both partners parse new fields; one has no retry proof. Signed scope concerns a callback outcome. External canary sends callbacks once only. A later retry loses deduplication identity and executes twice. | Platform wants to avoid a permanent bespoke adapter, Account wants a complete demo without cleanup, Reliability wants to avoid reconciliation work. Platform can back an adapter with signed-scope evidence and a handoff/exit promise; Reliability’s versioned route requires partner-readiness evidence. | Pilot stays isolated pending retry proof, waiting delays the demo, adapter acceptance and permanent ownership remain open. Rollback cannot undo duplicated external work. |
| Platform / c | Both parsers have whole-number-only sign-off. Signed scope explicitly requires the new response version. A later sandbox trace silently rounds decimals. | Platform wants to avoid two ongoing versions, Account wants the signed version in acceptance, Reliability wants numeric meaning preserved. Platform opposes the parallel-version pilot even with retirement criteria; Account needs additional recovery ownership before backing an adapter amendment. | Contracted pilot stays isolated pending numeric proof; waiting moves acceptance; adapter needs a written amendment. Parsing success is not decimal accuracy or acceptance. |

Each new promise and response has authored delivered and deferred text for its situation. Existing IDs such as `parser` or `announce` remain internal compatibility keys; the user-visible title and outcome describe the current task. Opening a record never reassigns the situation. Original support conditions and authored case text are preserved.

## Verification and handoff

Run `node --test tests/council.test.mjs tests/council-variants.test.mjs`. Variant tests cover stable identity and facts, legacy fallback, invalid IDs, no immediate repeat, private-objective concealment, all route/promise combinations, locked promises, capacity, response ledgers, replay, view detachment, independent changed-support examples and situation-specific evidence/consequence checks. The original suite remains the compatibility check. Final actual counts and independent findings belong in the coordinator’s retained evidence and Jira handoff.

The module uses client-side concealment, not secrecy against source inspection. A new situation does not measure greater skill, and cross-situation comparisons should identify the changed context. Independent rendered UI, saved-history and dialogue review are required for integration; engine tests alone do not establish acceptance or publication.
