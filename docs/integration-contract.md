# Combined candidate: gameplay equivalence and retained evidence

Version: `integration-v1`, October 3, 2026. Product/Game Design/UIUX contract for [SCRUM-16](https://sadhirr1.atlassian.net/browse/SCRUM-16). This defines integration of the separately reviewed memory/debrief PR #5, visual PR #6, and session/typed-input PR #7. It does not merge or approve any PR. The coordinator records exact candidate revisions and execution evidence.

Status: expectations independently reviewed by QA and the coordinator. Product has independently reviewed the combined source and test expectations. Executed checks, combined browser behavior and release acceptance have separate evidence and limits below.

## Preserve the three increments

The existing [scenario rules](scenario-rules.md), [debrief contract](debrief-contract.md), [typed-decision contract](typed-decision-contract.md), [visual system](visual-system.md) and [player experience](player-experience.md) remain the product baseline. Their prior evidence belongs to their original source checkpoints; it is not a pass for this combined candidate.

| Increment | Behavior that integration must retain |
| --- | --- |
| PR #5: memory, events and debrief | Four conditional callbacks, authored knowledge audiences, append-only causal events, original planning-note attribution, complete-only motives, unchanged numerical rules, truthful rubric/claims, actual capped effects and shared debrief/export sources. |
| PR #6: visual system | Semantic palette/type/spacing, readable disabled controls, visible **Selected** text plus pressed state, conditional unavailable-commit explanation, strong control boundaries, visible independent focus, target sizes, wrapping and reduced-motion treatment. |
| PR #7: session flow and typed choices | Active-attempt Home/restart confirmation, safe cancel/focus, usable skip target, visible associated draft/proposal errors, conservative finite suggestions, explicit fallback/override, checked/first-radio focus, preserved wording shown separately in preview/result. |

Resolve overlapping application/engine changes semantically. Choosing one side of a conflict wholesale is insufficient if it removes another reviewed behavior. Do not change scenario choices, numerical effects, outcome thresholds, persistence policy or the finite matcher vocabulary merely to make integration easier.

## Meaning of typed/preset equivalence

Given the same starting game state, conversation history, question order and **confirmed authored choice**, typing and using a prepared choice must produce identical gameplay. Typed wording records how the player expressed the action; it does not produce an additional score, rumor, disclosure, conversation or NPC knowledge change.

The prior PR #7 helper omitted only `history.writtenDecision` before whole-state equality. With PR #5's event foundation, the confirmed private input also legitimately differs in mode/text. Extend the comparison narrowly; do not discard event evidence to preserve an obsolete equality assertion.

Prefer two transitions from the **same frozen predecessor state**. They then share a run ID, and corresponding event IDs must agree exactly. The immutable source state and all earlier events/history must remain unchanged. Fresh independent runs are a separate identity case, described below.

| Data | Required comparison |
| --- | --- |
| Gameplay state | Exact phase, round, metrics, relationships, flags, evidence, questions asked, conversations remaining, arrival and every unchanged state field. Preserve numeric before/requested/actual/after values, caps and bonus eligibility/marginal benefit. |
| Decision history | Exact recorded choices, title/outcome/reactions, heard evidence, metrics, immediate effects, later effects, event references and prior entries. Only `writtenDecision` in explicitly paired typed rounds differs, after independent assertions described below. |
| Complete event ledger | Retain every event and compare its order, identity, run/rules version, type, rule, actor, evidence status, audience, visibility, source references, effects, bonus metadata and non-input details. Never remove all events, input events or knowledge to obtain equality. |
| Knowledge ledger | Exact audiences and known event references for the player, each NPC and any authored channel. A typed input must not become known by an NPC merely because the chosen decision is public. |
| Private confirmed input | Exactly one matching input event per committed round, for both modes. Assert its payload independently, then normalize only that event's `details.mode` and `details.text` for the semantic comparison. Keep the event itself and every other field. |
| Delayed/complete state | Apply the same advance operation on both paths. Repeat full comparison after the actual delayed event or completion. Immediate equality alone is insufficient. |

## Required private-input assertions

Before normalizing any payload, verify all of these on each branch:

1. The typed history and input event contain exactly the confirmed player's text under the established outer-trim-only convention. The paired preset history/input contain empty wording and the input mode is `preset`; typed mode is `typed`.
2. The input belongs to the expected run, round and confirmed choice; the decision's `details.inputEventId` resolves to that exact earlier input event. The event is unique and its sequence is correct. Do not substitute a different round's input.
3. The input actor is the player, audience is exactly the player, status is confirmed input, and its metric/relationship requested and actual effects are zero. Its normal visibility to the player is retained. All before/after signals agree.
4. No NPC knowledge ledger gains the input event. A distinctive typed marker does not appear in NPC memories, authored reactions or public decision text. A reference to a private input ID is not permission to disclose its contents.
5. Preview, editing, cancellation and unsupported-language fallback do not append confirmed input or decision events and do not mutate game state. Explicit confirmation creates one input/decision pair; repeated confirmation cannot create another.

For a single-round pair, normalize only that round's independently verified input payload and history wording. For a full path with several typed rounds, use the fixture's explicit list of expected typed rounds/texts and verify each before normalizing it. Unexpected differences in another round remain test failures. Do not silently replace every string named `text`, remove complete `details` objects, or copy one branch's events over the other.

## Independent fresh-run identities

Separate calls to create a game should have separate run identities. Equality tests that intentionally compare separate attempts may canonicalize declared identity fields only after proving each attempt's own causal record is valid:

- Require unique event IDs, valid sequence/rules versions, same-round/type/rule counterparts, and no missing, dangling or cross-run references.
- Map each run's verified ID namespace to a common fixture namespace. Update declared reference fields consistently: event/run IDs, source IDs, knowledge IDs, history/followup event IDs, decision input reference and bonus question-source reference.
- Preserve the semantic suffix or explicit round/type/rule correspondence and event ordering. Do not flatten different event types or causes into one identifier.
- Do not apply global string replacement to player wording, authored text or unrelated values. A valid private-input difference still needs all assertions above.

The same-predecessor comparison avoids this normalization and is the preferred basis for the fifteen typed-choice fixtures. Replay/reset creates a different run ID in the fresh briefing state, with empty history, events and knowledge. Beginning that new attempt legitimately adds its own R1 story/knowledge records; assert that all belong to the new run and none come from the prior attempt.

## Debrief and export comparison

Both paths must pass the debrief's complete-state/source validation. Compare the same outcome rule, final metrics, counts, factual claims, interpretations, prompts, motives, relationships, immediate/later effects and causal sources. Preserve the allowed citation catalog and all citation statuses, effects, source links and privacy boundaries.

Only these presentation differences are expected for explicitly typed rounds:

- Decision record `inputMode`/`wording` accurately identifies the actual mode/text.
- The corresponding confirmed-input citation's readable label/text identifies either the original player wording or a prepared approach with no supplied quotation. Its ID, round, type, status, zero effects and source relationships remain comparable.
- Export includes the typed wording where it exists and does not invent a quotation for a prepared choice. The rest of the outcome/claim/effect/source account remains equivalent.

Do not demand byte-identical exports with legitimately different player input. Instead verify each export against its own shared debrief model and explicitly compare the unchanged claims/effects/provenance across modes. Dropping all citations or all input-source records would conceal a privacy or attribution regression.

## Bounded verification cases

| Case | Independent expectation |
| --- | --- |
| Fifteen approved typed fixtures | Retain the literal suggestion expectations for every round/choice, preview immutability, explicit confirmation and typed/preset comparison above, including the next delayed/complete transition. |
| Conservative fallback and override | Negated, quoted, incidental, mixed and unsupported wording gets no automatic choice according to the finite contract. A pilot suggestion explicitly confirmed as delay yields the delay's effects while retaining the player's pilot wording. No prose sentiment changes the authored action. |
| Combined five-round path | Use actual questions/decisions from a reviewed reference path; include typed confirmation, a subsequent permitted memory callback, completion and cited debrief/export. Numerical reference expectations remain literal authored values, not copied from current engine output. |
| Cap-zero evidence | Retain the reviewed `41/100/100` path with four positive bonuses and one eligible zero-gain bonus. Typed mode does not turn the fifth bonus into an improvement or alter requested/actual values. |
| Information boundaries | Open/broker/ignore controls still distinguish full-note disclosure, leadership summary and private defect knowledge. Leah retains her independent prior knowledge; Theo does not gain the full private agreement through a broker summary. Input wording does not spread. |
| Phase and reset guards | No repeated input/decision pair, no debrief/motive reveal before completion, no state mutation on previews/reads, and a fresh replay/reset with no previous attempt contamination. |
| Test sensitivity | Meaningful counterexamples must fail the comparison: altered metric/effect, NPC input disclosure, changed source link/audience or unexpected input/history difference cannot be hidden by the helper. These are focused controls, not a claim of tamper-proof client state. |

The exact automated test total comes from executed combined-source checks. Do not sum separately passing branch counts and report that sum as a combined pass. Existing reference, memory, debrief and typed tests must remain meaningful after conflict resolution; any removed assertion needs an explicit reason and independent review.

## Combined interaction gates

Source correspondence is not a browser pass. On an identified combined build, verify the visual and interaction behaviors together: start/skip, visible selection/focus, typed validation and proposal fallback/override, safe Home/restart cancellation, stakeholder memory/privacy, round transitions, debrief citation navigation, literal long wording, export request and delivered file, and clean replay. Record exact checks and limits.

The complete keyboard journey, actual 200% zoom, representative narrow/desktop states and other required release-candidate checks remain pending until executed. Browser resizing does not establish zoom or a physical-device test. A source-inspected download formatter and a request announcement do not establish delivered-file completion. Preserve unresolved checks as open work rather than weakening acceptance to fit the session.

## Review and evidence

Product owns only this integration contract. Development owns the combined implementation; QA owns independent comparison/integration tests and QA evidence; the coordinator owns branch/publication decisions and browser/session evidence. Each author's deliverable has a different reviewer. This contract does not authorize a merge, claim deployment, or extend the October 13 target.

| Evidence | Status |
| --- | --- |
| Contract review | Coordinator independently approved the bounded policy, exact-identity/shared-predecessor comparison, private-payload assertions, full source/audience retention and export distinctions. QA approved the revised contract after clarifying empty briefing versus newly begun R1 records. No blocking specification finding. |
| Combined source correspondence | Product independently compared the final source with the three contributing branches. All three application conflict resolutions retain the validated finite-input form and visible Selected/hint, the complete cited debrief and focusable main, and the reviewed session handlers. The engine differs from PR #5 only by the approved finite matcher; scenario, stylesheet and index match their respective contributing branches. Final hashes begin `F18DCEE3` (app), `3F444704` (engine), `40541B99` (scenario), `A5A959D9` (style) and `414F4DB0` (index). No blocking source finding; this is not a browser pass. |
| Comparison/test expectation review | Product independently reviewed QA's seven new integration test definitions: full causal-graph comparison, private input assertions, actual-action memory/disclosure controls, debrief/export equality, phase guards, seven deliberate mismatch controls and the literal cap-zero path agree with this contract. Product also reviewed the adapted legacy typed helper: each round's actual private payload is asserted before only mode/text/history wording is normalized, retaining full state comparison immediately and after advance. All fifteen literal fixtures and the override expectations remain. No blocking fixture finding. |
| Executed combined checks | Product independently reviewed the [QA execution record](evidence/session-2026-10-03-1000-qa.md): the original helper's 9-pass/16-fail checkpoint, its narrow correction and the subsequent actual **99/99** combined run at October 3, **10:13:51 PDT**, duration **1147.2499 ms**, are distinguished accurately. Four syntax checks and both whitespace checks passed. Exact source/test hashes identify the integrated working tree; its then-current HEAD alone is not that build. QA executed the suite; Product reviewed expectations and evidence, and separately confirmed clean whitespace checks. No release acceptance follows from this bounded automated result. |
| Rendered combined behavior | Product independently inspected all six retained captures and reviewed the coordinator's [combined browser record](evidence/session-2026-10-03-1000.md), with no blocking presentation or evidence finding. Coordinator execution covers the zero-question typed-pilot/quiet/open/both/shared path ending **49/63/69**, validation/fallback, Home cancellation, actual-action memory, literal wording, debrief source focus and inspected narrow layout. The selected-card crop does not itself show the literal cue; the narrow capture shows a decision record, not an expanded source. Product did not execute a separate browser session. Download was requested, but its 15-second wait yielded no file: delivery remains unverified. Full keyboard traversal, actual 200% zoom, fresh candidate setup/playthrough and broader device/accessibility checks remain open. |
| Current-status documentation | Product independently reviewed the coordinator's README summary and quality-plan update against the combined record. They distinguish this reviewed proposal from release acceptance and preserve the earlier checkpoints' historical limits. No blocking accuracy finding. |

Final handoff: Product independently reviewed the completed primary and QA records, including QA's final browser-evidence reconciliation. Source identity, execution attribution, retained captures and unresolved gates agree. This contract is frozen for coordinator publication review; its author's reviews of other deliverables do not replace QA/coordinator review of this document. The bounded combined increment has no unresolved Product review finding; full release acceptance remains open.
