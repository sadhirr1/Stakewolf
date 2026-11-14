# SCRUM-38 local council conversation

This increment adds a typed, local conversation interpreter for the accessibility and Platform / API councils. It supports the six existing stakeholders and their existing evidence, support conditions, proposals, promises, and aftermath work. It is authored pattern matching, not an AI service or unrestricted conversation. It uses no dependency, account, credential, or network call.

The Development/Game Design author owns `dist/council-dialogue.mjs`, `tests/council-dialogue.test.mjs`, and this document. The coordinator owns the chat wrapper and app integration; the independent QA agent owns handler tests and review. Author checks below are implementation evidence, not approval or release acceptance.

## Interface and confirmation

```js
import {interpretCouncilMessage, dialogueExamples} from './council-dialogue.mjs';

const response = interpretCouncilMessage(state, 'engineering',
  'I can fund independent checks if you support local repair.',
  {history: []});
// {reply, kind, pending, topic?}
// pending: null or {label, actions, summary}
```

`kind` is `answer`, `clarify`, `offer`, `inspection`, or `limit`. The optional topic is `source:<id>`, `proposal:<id>`, `promise:<id>`, `work:<id>`, or a public subject such as `support` or `capacity`. `dialogueExamples(topic, stakeholderId)` returns a new array of three natural questions, or an empty array for an unsupported selection. Examples are suggestions; they are not required answer choices.

Interpretation never mutates the supplied state. A pending offer contains only existing engine actions: `investigate`, `propose`, `promise`, or `allocate`. It never contains `commit`, `finish`, or `replay`. Preview applies the proposed actions to temporary engine states to check feasibility and describe the resulting capacity and the selected stakeholder's support. The integration must show the interpretation and cost/support preview before the player confirms it, reject an obsolete offer if the council changes, and only then apply the actions through the engine. A typed “yes” does not confirm anything.

Offers omit already-selected proposals, promises, and optional work. This is necessary because the underlying engine's promise/allocation actions are toggles: repeating a positive request must not withdraw an existing reservation. Explicit “withdraw,” “remove,” “drop,” “cancel,” or “defer” can remove a named council promise before closing or a named optional item in the aftermath. Empty repeated offers have no pending actions.

## Knowledge and phase rules

All factual answers come from `councilView`. The interpreter does not import scenario internals or contain copies of private objectives or source text.

- A source question offers an inspection costing one of the two investigations. The pending answer names the record and its contact without quoting unopened contents.
- After confirmation, the same question quotes the opened public record without another cost. An exhausted budget or closed council leaves unopened contents unknown, including in the debrief.
- Asking another stakeholder's source question identifies the correct record contact before offering its inspection.
- Public preference and support answers use the role, claim, current proposal, promises, and inspected evidence. Hypothetical support questions can explain a named approach without proposing it.
- Private-objective questions are limited before the debrief. The debrief may quote that stakeholder's objective from the engine's revealed view.
- The aftermath uses only the response items available for the agreed approach. The approach and existing promises remain locked. A compound request cannot silently discard a request to change locked work.
- Capacity answers use current reservations in the council and total selected work in the aftermath/debrief. Investigations remain a separate budget.
- No typed message closes or finishes a round. The player uses the existing phase controls.

## Language coverage and deliberate limits

The interpreter recognizes bounded case vocabulary and common synonyms. Supported examples include:

| Message | Interpretation |
| --- | --- |
| “What did the audit actually check?” | Offer to inspect Audit scope, or discuss its opened text |
| “Why should I trust that?” | Offer the selected stakeholder's own source record |
| “What would change your mind?” | Explain the current public position and support condition |
| “I can fund independent checks if you support local repair.” | Preview the repair approach and independent task-check promise; support remains conditional if its required source is unopened |
| “Can we keep both API versions and agree retirement criteria?” | Preview versioned migration and the retirement-criteria promise |
| “Withdraw rollback ownership.” | Withdraw that existing promise during council; explain its lock afterward |
| “Fund fallback verification.” | Preview the fallback route's optional verification work in the aftermath |
| “How much capacity remains?” | State the current reservation and remainder |

Negatives, uncertainty, multiple alternative approaches, unsupported extra clauses, discounts, new commitments, and guarantees do not create partial offers. The player is asked to clarify or is shown the applicable limit. Negative or uncertain inspection requests do not offer to open a source. Costs cannot be bargained down. The matcher intentionally has false negatives and does not claim to understand arbitrary paraphrases or nuanced intent.

Input is limited to 600 characters. Blank, oversized, non-string, markup/code-like, and unknown messages execute nothing and receive a bounded response. No evaluation or HTML generation occurs here; integration must still escape all displayed user text. The interpreter does not repeat raw input in its generated reply.

Optional follow-up context uses only the last recognized `topic` from the supplied history, revalidated against the current view. It does not trust previous reply text as evidence, infer persistent memory, or use a broad language model. “Tell me more” about a known source rereads current visibility rather than carrying stale facts forward. Integration should pass only the selected stakeholder's bounded history.

## Executed author checks and independent handoff

On October 25, 2026, `node --test tests/council-dialogue.test.mjs` passed **33 tests, zero failures**. Coverage includes both topics, all six stakeholder records, all aftermath response routes, natural compound/synonym variants, source budget/phase boundaries, private-objective gating, immutable input, repeated requests, explicit withdrawal, hypothetical questions, current capacity/support, discounts, unsupported extra clauses, markup, phase controls, and validated follow-up topics.

The independent reviewer identified four defects: the UI's “What would change your mind?” prompt was not recognized; a negated inspection could offer to open a source; an aftermath request could silently discard a different locked approach while offering response work; and mixed addition/withdrawal requests could be interpreted entirely as withdrawals. All four were corrected, with focused author regressions added. Mixed addition/withdrawal requests now ask for separate messages. Independent handler and browser disposition belongs in the coordinator's retained review evidence; this document does not claim those checks passed. No engine, GitHub, Jira, or deployment changes were made by this interpreter author.
