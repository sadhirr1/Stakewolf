# SCRUM-38 local council coaching

`buildCouncilCoaching(state, attempt)` in `dist/council-coaching.mjs` returns `null` before the debrief, then three sections with ids `questioning`, `negotiation`, and `consequences`. Each section contains `{id,title,summary,observations,next}`; the outer object also contains `rehearsal` prompts and `limits` strings. It is deterministic and does not mutate its inputs, persist data, call a service, or award a proficiency score. As with the engine, invalid council state throws through `councilView`.

Development/Game Design owns this module, its author tests, and this contract. Coordination owns attempt capture and rendering. The independent QA agent reviews integration and behavior; author checks are not approval or release acceptance.

## Attempt contract

Capture `{questions, droppedQuestions, events, droppedEvents, closed}` for each attempt. Questions contain `{speakerId,question,kind,topic,phase}` from actual nonblank typed submissions of at most 600 characters. Retain at most 60 questions independently of the shorter visible chat transcript. Capture council and aftermath questions; exclude debrief chats. Clarification requests are message examples, not evidence of poor questioning. Source-inspection offers describe requests, not completed inspections. Render all strings as escaped text, including quoted user examples.

Capture `closed` as the public `councilView` immediately before a successful commit. Events contain `{type,phase,source:'typed'|'preset'}` only for successful state changes, with each action of a confirmed batch captured separately. Unconfirmed or dismissed offers are not applied actions. Keep at most 60 events and record omissions. Reset the entire capture on replay or case change. The coaching module obtains costs, support and outcomes from confirmed engine facts rather than counting events, so repeated toggles or log limits do not inflate results.

The module verifies that the closing snapshot matches the completed state's locked proposal, opened record ids, selected promise ids, cost and support conditions. Missing or mismatched snapshots fall back to those locked final public fields with an explicit limit. The snapshot cannot introduce a different promise or support history.

## Evidence and coaching boundaries

- Quote source contents only when the final public view says the record was opened. Inspection is distinguished from understanding. Unopened record titles are shown as unknown evidence, without quoting their contents or penalizing unavoidable gaps under the two-record budget.
- Show up to two retained typed-message examples with speaker and phase, prioritizing the latest council source question and support question, then filling from recent messages. Earlier relevant questions survive visible-transcript rollover. Examples are shortened to 180 characters; the original bounded capture is not changed. No arbitrary semantic or skill inference is made from their wording. The 60-message retention limit and omissions are disclosed; debrief messages are excluded.
- Report only the confirmed approach, promises, closing support and capacity left for new information. Support is an interest-based position, not decision quality; unanimity and more promises are not universal goals.
- Distinguish promises delivered automatically from reserved capacity from the discretionary choice to fund or defer additional work. Quote route-specific public outcomes and remaining consequences. An affordable deferral prompts an explicit rationale; constrained work prompts a comparison with the reservations or response it would displace.
- Do not read the revealed private objectives to judge earlier decisions or treat aftermath evidence as knowable before closing. Do not imply that more sources, support or spending always improves an outcome. Reflection prompts support alternate defensible strategies.

## Verification and handoff

Run `node --test tests/council-coaching.test.mjs` in this Site directory. The author suite covers both cases and alternative approaches, debrief gating, preset-only play, unopened/private information, unconfirmed offers, phase-aware examples, clarification limits, bounded/truncated capture, automatic promises, capacity trade-offs, inconsistent snapshots, event-count independence and immutability. Independent integration, browser, keyboard and narrow-screen review is coordinated separately; this document does not claim it passed.

On October 25, 2026, the author command above passed **14 tests with zero failures**. The coordinator's review requested that earlier source/support questions remain visible beyond transcript rollover; the module now prioritizes those examples and includes a focused regression. Independent QA disposition and retained session evidence belong to coordination.
