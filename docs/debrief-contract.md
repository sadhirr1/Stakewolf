# Debrief: an inspectable account of this attempt

Version: `debrief-v1`, October 1, 2026. Owner: Product/Game Design and UI/UX, [SCRUM-15](https://sadhirr1.atlassian.net/browse/SCRUM-15). This bounded increment starts from `8ef8b6` on `feature/SCRUM-13-memory-events`, extending open PR #5. It uses the reviewed event foundation; separate visual PR #6 and session/typed-input PR #7 are not included. The [scenario rules](scenario-rules.md), [product brief](product-brief.md) and [player experience](player-experience.md) remain authoritative.

Status: contract, implementation source and retained browser presentation independently reviewed, with identified execution evidence below. The work resumed on October 3 after an interruption; October 1 evidence retains its original date. Delivered download verification remains open. This increment is not release acceptance.

## Purpose and unchanged rules

Explain what was recorded, which authored rules produced the result, and what the player might examine next. Preserve every choice, score delta, relationship rule, bonus, cap and the six ordered outcome thresholds. Do not infer personality, hiring suitability or professional competence. Add no persistence, cross-attempt comparison, remote service or new scenario.

The existing outcome titles remain scenario interpretations. A final score cannot establish that the player repeatedly delayed, that people actually believe them, that they considered no evidence privately, that a promised feature shipped, or that Atlas produced unconditional revenue. Replace such unsupported descriptions with the matched rubric and explicit reflection questions.

## Shared read-only model

Development and Product agreed this model so the screen and local text export share the same account:

| Field | Contract |
| --- | --- |
| `title`, `description` | Existing outcome title and a factual explanation of the matched rubric. |
| `outcome` | `ruleId`, human-readable `predicate`, final `metrics`, tailored reflection `prompt`, and `sourceEventIds`. |
| `counts` | `conversations`, `stakeholders`, `positiveBonuses`, `cappedBonuses`, calculated from the same event selections cited by the corresponding reflections. |
| `reflections[]` | `id`, `title`, `fact`, `interpretation`, `prompt`, `sourceEventIds`. A compatibility `text:fact` alias may remain, but the interface distinguishes the three kinds of prose. |
| `decisions[]` | The five confirmed choices in order: `round`, `choiceId`, `title`, `wording`, `inputMode`, `sourceEventIds`. Actual immediate and later effects remain available through citations. |
| `agendas[]` | Four completion-revealed authored motives: `personId`, `name`, `role`, `text`, reflection `prompt`, final `relationship`, `sourceEventIds`. |
| `citations[]` | Referenced player-visible/known event records with `eventId`, readable `label`, `round`, `type`, evidence `status`, `text`, `effects` and visible `sourceEventIds`. |

`getDebrief(state)` and `formatDecisionRecord(state)` are pure: reading, rendering, following citations and exporting cannot append events or change state. Require a complete run with five consistent decisions and its matching completion event. Required missing, duplicate, contradictory, cross-run or dangling claim sources fail with `INVALID_STATE`; do not invent a replacement fact. This is consistency checking of the authored game record, not a tamper-proof client or authentication claim.

A separately exported pure `evaluateOutcome(metrics)` may expose the unchanged rubric for direct boundary tests. It does not authorize constructing a debrief from metrics without a completed event history. Returned structures must not expose mutable references into the game state.

## Ordered outcome rubric

Use the **first matching** rule. D/T/Q are delivery, team trust and product quality, on the existing 0–100 authored scale. Show final values, the readable matched condition and that earlier rules take precedence. The supporting calculation is the recorded initial values plus the five actual decision changes and four actual delayed changes; never add requested deltas without accounting for caps. Cite the recorded decisions, delayed events and completion that support those final values.

| Rule | Condition, after excluding earlier rules | Existing title | Safe description / next question |
| --- | --- | --- | --- |
| `outcome:earned` | Q ≥65, T ≥65, D ≥40 | You earned the next step. | The authored rubric combines quality and trust of at least 65 with delivery of at least 40. What evidence would justify the next bounded expansion? |
| `outcome:deadline` | Q ≥65, T ≥60 | Credibility needs a deadline. | After earlier rules are excluded, the rubric finds quality of at least 65 and trust of at least 60. What scope and deadline would make the next commitment inspectable? |
| `outcome:borrowed` | D ≥70, Q <55 | You launched on borrowed time. | After earlier rules are excluded, delivery is at least 70 while quality is below 55. Which exposure would you narrow while testing the weakest quality signal? |
| `outcome:room` | Q ≥60, T <55 | The product is ahead of the room. | After earlier rules are excluded, quality is at least 60 while trust is below 55. What shared record or conversation would help people challenge the next decision? |
| `outcome:proof` | T ≥65 | The room believes you. Now prove it. | After earlier rules are excluded, trust is at least 65. Which bounded experiment would distinguish agreement from product evidence? |
| `outcome:fragile` | None of the preceding conditions | A fragile compromise. | The final signals do not meet an earlier outcome condition. Which tradeoff and uncertainty would you make explicit before the next promise? |

The questions are advice, not predictions or events. The titles and interpretations must be visibly qualified as scenario rubric output. In particular, `deadline` does not mean repeated delays occurred, and `proof` does not prove real stakeholder beliefs.

## Claim rules and sources

| Claim / reflection | Required derivation and citations | Interpretation and prompt limits |
| --- | --- | --- |
| Conversations used and stakeholder coverage | Count committed `question` events, and distinct stakeholder actors among them. Fact: “You used N of 10 optional conversations and heard from P of 4 stakeholders.” Cite every counted question. With no questions, cite completion and the inspectable empty question aggregate; display 0/10 and 0/4 explicitly. | “These are the perspectives recorded in this attempt; they do not establish certainty or what you considered privately.” Ask which unasked question or conflicting account would change the next decision. Opening a dialog, rereading, memory callbacks and motive reveal do not count. |
| Evidence that added points | Count decisions whose recorded `bonus.marginalBenefit > 0`. Cite each qualifying decision and its actual bonus-source question. Fact: “N decisions used recorded evidence to gain additional points.” Include N=0. | This measures extra points under authored rules, not the quality of reasoning. Ask which evidence changed an approach versus being collected without use. An eligible bonus at the cap is not a gain. |
| Eligible evidence at a cap | Separately identify decisions with eligible bonus and zero marginal benefit. Cite decision and source question; distinguish requested bonus from actual extra points. It is valid to say an eligible bonus added no points at the cap. | Do not say “listening improved the result,” count it as a win, or mistake a total metric change from the choice for the bonus's contribution. |
| Quiet retention fix | Only when R2 `quiet` and its R3 delayed event exist consistently. Cite `choice:consent:quiet` and `delay:consent:quiet`. Record the quiet change and the customer questioning the unexplained earlier recordings. Its requested delayed trust change is −6; show actual event delta if capped. | A scripted consequence in this scenario. Ask what explanation of earlier recordings was needed. Do not imply all private facts were disclosed. |
| Ignored rumor | Only when R3 `ignore` and its R4 delayed event exist consistently. Cite `choice:rumor:ignore` and `delay:rumor:ignore`. Record that the private defect did not reach the launch checklist. Requested delayed changes are T −3, Q −5; display actual values. | The player receives the authored narrator account; this is not proof that every NPC knows the defect. Ask how a private report could reach the right decision record without indiscriminate disclosure. |
| Atlas retention accommodation | Only when R2 `exception` and its R3 delayed event exist. Cite that choice and delay. Record a separate retention policy consuming review time; requested later Q −2, subject to caps. | Ask whether the account need justified the ongoing review cost. Do not claim revenue or that the player chose a custom workflow unless separately recorded. |
| Atlas workflow accommodation | Only when R4 `custom` and its R5 delayed event exist. Cite that choice and delay. Record Atlas's conditional commitment and another maintenance path; requested later D +4/Q −3, subject to caps. | Ask what evidence distinguishes this conditional account signal from wider demand. Do not convert a conditional commitment to a sale. |
| Final relationships | Show the existing value/label, clearly a game signal. Cite recorded question and decision effects for the relevant person (starting value 50); delayed events add no relationship points in this version. | Do not treat a relationship label as proof of an interview, disclosure, private belief or personality. |
| Authored private motives | Read the four motive texts from the valid completion event and cite it. Label as authored motive reveal, not evidence the player collected. Reflection hints are advice. | Available only after completion in ordinary UI/tools/export. Completion reveals these motives, not every undisclosed private story record. |

The quiet, ignored and two Atlas reflections are independent; two relevant choices produce two supported accounts. Their absence does not justify congratulatory claims such as “you surfaced uncomfortable information.” Omit untriggered historical themes. Every required fact source must exist before the corresponding reflection is returned; flags alone are insufficient evidence.

Stable reflection IDs are `conversations`, `evidence-bonus`, `quiet-fix`, `ignored-rumor`, `atlas-retention` and `atlas-workflow`. The first two are always present, including zero-count paths; the last four require their exact triggering records. The bonus reflection also reports eligible zero-gain bonuses when present.

Use the minimal aggregate source sets: nonzero conversations cite exactly their question events; eligible evidence bonuses cite exactly their decision/question pairs, including cap-zero pairs. When the corresponding aggregate is empty, cite completion. The always-present bonus heading is the neutral “Recorded evidence bonuses,” including zero-gain runs.

## Source status and privacy

Keep event status visible in human terms: authored scenario event, attributed stakeholder account, unverified claim, confirmed player input, and interpretation. A cited stakeholder account supports “X told you Y”; it does not automatically establish Y as an independent fact. A rumor remains labelled unverified unless an actual disclosure/correction rule supports a narrower claim.

Only display records that are already player-visible or in the player's knowledge, plus the completion-authorized motives. Do not recursively expose private parent story records merely because a visible question refers to them. Citation relationships shown to the player must resolve within the allowed citation catalog; otherwise retain only the attributed answer or a generic private-source boundary. The internal event graph may retain its original hidden source IDs without exposing their contents.

For the broker path, Leah retains her prior note knowledge, while Theo does not receive the full private note/agreement merely through a summary. For the ignored-rumor path, the narrator-visible delayed defect does not grant that knowledge to other stakeholders. Rendering/exporting the debrief must not change any knowledge audience.

Typed text is a separate player input source, not a quotation attributed to a stakeholder or a historical planning note. Preserve recorded text exactly under the existing trim-only convention and escape it in HTML. Preset decisions have no fabricated player quotation. A source record must not rewrite a speaker's authored quotation as the player's words.

## Later Theo reflection

R5 `theo-reflection` must express Theo's own bias regardless of whether the player chose `core`, `custom` or `both`. Approved question: “How can your familiarity with Atlas affect your advice?” Approved answer:

> I know Atlas’s team well, so their urgency can feel like everyone’s. That is a bias in my advice, not proof that your decision overfit. Next time I want the wider sample in the room earlier.

Evidence summary: “Theo describes how familiarity with Atlas can narrow his view of demand.” Keep this an attributed stakeholder reflection. It does not establish that the player overfit or that a sale happened. The existing conditional R5 memory separately reports the actual R4 choice.

## Screen and export expectations

Show the outcome as a scenario interpretation, its exact final signals and readable rubric. Separate **Recorded facts**, **Scenario interpretation** and **Consider next** in reflection content; avoid presenting advice as an event. The five-decision record and actual effects remain visible. Keep the non-assessment explanation near the debrief.

Citations must be understandable without parsing UUIDs or code identifiers. Prefer labels such as “Round 2 · Quiet default fix,” “Round 3 · Later consequence,” and “Round 1 · Ishan: A reproducible failure.” A keyboard-operable citation moves to an identifiable, focusable source record and does not change state. Source details show round, source/status, recorded text, actual changes and requested changes when a cap matters. Long IDs can live in expandable details/export; they cannot be the only meaningful link label or force horizontal overflow.

The source catalog may use existing page sections or native details controls. It must not become a second game screen with new actions. Layout, heading order, visible focus, narrow wrapping and text escaping require browser review; source inspection alone does not establish accessibility acceptance.

`formatDecisionRecord(state)` returns the same outcome/rubric, final metrics, facts, interpretations, prompts, five decisions, actual immediate/later effects, conversation sources/statuses, motive reveal and final relationships shown in the UI. Include readable citation labels and stable event IDs so exported claims can be traced. Include requested/actual bonus distinctions where relevant. Export only sources the player is allowed to inspect. Do not recompute a conflicting narrative in the app's download handler.

The local text download remains an export, not a save/resume feature. Replay starts clean; no attempt comparison or persistence is added. Export tests establish content parity; an actual browser download action and its error/announcement behavior need separate verification before claiming them tested.

## Independently expected cases

| Case | Expected result |
| --- | --- |
| Reviewed PATH-A | Final D/T/Q 54/100/100; `outcome:earned`; ten question events, four stakeholder sources, five positive marginal bonuses. No quiet/ignored/Atlas-accommodation reflection. Actual R4 later Q +4 despite requested +5; actual R5 Q 0. |
| Reviewed PATH-B, zero questions | 99/2/8; `outcome:borrowed`; 0/10 questions, 0/4 people, zero positive bonuses. Distinct quiet-fix and ignored-rumor accounts with their exact later sources; no Atlas reflection. All five decisions and motives still available after completion. |
| No-delay counterexample | Preset `pilot/quiet/open/both/shared` with no questions ends 49/63/69 and matches `outcome:deadline`. The title may remain, but description cannot claim repeated delays or a recorded delay choice. |
| Reviewed PATH-C | 63/86/63; `outcome:proof`; ten questions, four people, four positive bonuses. Separate Atlas retention and custom-workflow reflections; no quiet/ignored claim. No unconditional revenue assertion. |
| PATH-B broker control | 93/25/19; quiet reflection remains, ignored-defect reflection and its cited event are absent. No accidental private-note disclosure. |
| Eligible bonus with zero marginal effect | Keep the existing cap fixture: count only positive gains and identify the eligible zero-gain decision accurately. Compare actual/requested fields, not legacy bonus text alone. |
| No question / some questions / all people | Counts reflect distinct question events and distinct actors, not history length, memory events, agendas or UI opens. Zero questions never prevents completion or export. |
| Citation integrity | Every returned claim source resolves to this run and an allowed readable source. Remove a required event, alter its run identity, or duplicate it: no fabricated completed report. Mutating a returned record must not alter state. |
| Theo across all R4 choices | The answer remains about his own familiarity bias; the separate memory matches core/custom/both. It never declares player overfit from the question alone. |
| Typed/preset record | Confirmed typed text is retained and escaped; equivalent preset result has no invented wording. Only actual confirmed content is exported. |
| Export parity | All model claims, matched rubric, allowed source IDs, actual capped effects and motives appear in the exported text. Hidden story text is absent unless independently revealed. Repeated generation changes no state. |

Boundary expectations for the pure ordered rubric use D/T/Q: `40/65/65` earned; `39/65/65` deadline; `70/60/54` borrowed; `39/54/60` room; `39/65/64` proof; `69/64/54` fragile. Test each threshold from both sides and preserve earlier-rule precedence. These are independently specified expectations, not claims that implementation tests have passed.

## Review and handoff

Product owns this contract. Development owns the engine, scenario and application UI/export implementation; the coordinator owns browser execution, primary evidence and publication; QA owns independent fixtures and execution. Another agent reviews each owned deliverable. Required review includes missing/cross-run sources, cap-zero semantics, zero-question behavior, private-source boundaries, readable citations and export parity.

| Evidence | Status |
| --- | --- |
| Independent contract review | Coordinator review passed after correcting the implementation ownership attribution above. QA independently approved the six-rule order, source/claim boundaries, empty and cap-zero counts, motive privacy and shared export model; no blocking specification finding. |
| Implementation correspondence | Product and QA independently reviewed the engine/scenario/application source: unchanged six-rule ordering, stable counts/claim IDs, minimal aggregate sources, outcome/relationship provenance, validated bonus arithmetic, player-visible source filtering, separate fact/interpretation/prompt labels, shared export and Theo self-bias correction align this contract. No blocking source finding. October 3 hash checks confirmed the preserved source; the subsequent singular/plural-only engine correction received separate independent review. Reversing that sentence in memory reproduced the October 1 engine hash exactly. |
| Executed checks | The [independent QA record](evidence/session-2026-10-01-1000-qa.md) identifies the tested source and reports 16/16 focused debrief tests at October 1 10:16:19 PDT, then four syntax checks and 67/67 total tests at 10:16:53 PDT. After the October 3 grammar correction, QA reports four syntax checks and 67/67 at 09:35:02 PDT, duration 1158.8937 ms, against engine `1495625…`. Product independently reviewed all sixteen test definitions and the narrow existing-test stable-ID change. These are QA executions, not additional Product runs. |
| Browser/citation/download inspection | The [primary session record](evidence/session-2026-10-01-1000.md) separates October 1 and October 3 coordinator execution. Product independently inspected the [before](evidence/images/session-2026-10-01-1000-before.jpg)/[after](evidence/images/session-2026-10-01-1000-after.jpg) desktop captures, [desktop source](evidence/images/session-2026-10-03-debrief-source.jpg), [narrow source](evidence/images/session-2026-10-03-debrief-mobile-source.jpg), and [narrow typed source](evidence/images/session-2026-10-03-debrief-typed-source.jpg); no blocking presentation finding. Citation focus/navigation, narrow dimensions, literal-text DOM checks and download-request activation belong to coordinator execution on engine `7460247…`, before the grammar-only correction; app/scenario bytes are unchanged. The download-event wait timed out, so delivered-file completion is unverified. Automated formatter parity is a separate passed check. |
| Evidence review | Product independently reviewed the final primary and QA records for chronology, scope, attribution and remaining limits, and verified all five final source/test hashes. No blocking evidence finding. Review of these records is not a separate test or browser execution. |

Completion of this increment does not establish integration with PRs #6/#7, unrestricted typed-language handling, a complete accessibility audit, deployment or release acceptance. Apply the existing quality gates and October 13 target; record remaining work honestly.
