# The Launch Room: scenario rules contract

Version: `launch-room-rules-v1`, authored October 1, 2026. Owner: Game Design/Product, [SCRUM-7](https://sadhirr1.atlassian.net/browse/SCRUM-7). Implementation handoffs: [SCRUM-13](https://sadhirr1.atlassian.net/browse/SCRUM-13), [SCRUM-15](https://sadhirr1.atlassian.net/browse/SCRUM-15); verification handoff: [SCRUM-11](https://sadhirr1.atlassian.net/browse/SCRUM-11).

This contract starts from `public/scenario.js` and `public/engine.js` at repository revision `d3efe6d`. It preserves all 15 choices, numeric effects, evidence bonuses, and outcome thresholds. It defines the missing narrative, knowledge, and traceability rules. Acceptance of the contract is distinct from implementation and release acceptance. Reference values below are arithmetic expectations from the authored tables, not claims that the engine or interface passed them.

## Scope and implementation boundary

The player leads Relay's launch across five rounds: **promise**, **consent**, **rumor**, **scope**, and **accountability**. The objective is to make explicit tradeoffs between delivery, team trust, and product quality, then understand the consequences. There is no universal winning score, hiring judgment, paid service, new scenario, or additional playable stakeholder.

| Existing baseline to preserve | Required implementation or correction |
| --- | --- |
| Four stakeholders; five rounds; three choices per round; two optional questions per round | Conditional stakeholder callbacks based on recorded decisions and permitted knowledge |
| Deterministic metric/relationship changes, evidence bonuses, and next-round callbacks | Explicit event IDs, effect provenance, audiences, and debrief citations |
| Confirmed mapping of typed input to an authored choice | Never fabricate player wording; disclose matching limits and preserve only actual confirmed input as player text |
| Complete-page replay and clean start after refresh | Visible pre-play notice and verified clean restart, as specified in the product brief |
| Authored private motives revealed in the debrief | Separate authored motives, verified story records, attributed accounts, and unverified rumors |

New knowledge and memory records have **zero additional numeric effect** in this version. They make existing consequences coherent and inspectable. Do not add hidden score changes, relationship gates, random events, or automatic rumor simulations while implementing this contract.

## Stakeholders and starting knowledge

All four know the public launch target, the player has the PM role, and a reliability concern exists. Before R1, the player has only the briefing, public roles, and mottos. Each person knows their own private motive; nobody automatically knows another person's motive. Hints in an interview remain attributed accounts until the final authored reveal.

| ID | Public responsibility | Private objective and conflict | Additional knowledge available at R1 |
| --- | --- | --- | --- |
| `mara` (M) | Growth and launch commitments | Protect momentum and a promotion case tied to the date. Favors launch/commercial progress; conflicts with Ishan's review time and Leah's consent friction. A promotion is not an observed game outcome. | 600-person waitlist versus 20 onboarded teams; placements still cancellable; her own board pressure. Owns `campaign`, `mara-pressure`. |
| `ishan` (I) | Engineering and reliability | Contain a real failure while advocating a platform rewrite. Favors reliability; the rewrite is not required for the pilot. Conflicts with Mara's date and Theo's custom branch. | Three of 40 long meetings missed an action owner; review gate could contain the failure; full rewrite is a separate preference. Owns `failure`, `rewrite`. |
| `leah` (L) | Trust, consent, and decision ownership | Avoid unowned data risk after a prior blame experience. Can support a bounded experiment with explicit responsibility. Conflicts with quiet fixes and indefinite exceptions. | Suspected unowned retention-default change, explicitly unverified; acceptable pilot conditions. Owns `consent-warning`, `safe-pilot`. |
| `theo` (T) | Customer advocacy | Protect Atlas, whose needs he may overgeneralize. Favors that account's requests, in tension with broad reliability and maintenance costs. | Atlas and two other teams value reliable action items; Atlas would join an explicitly labeled pilot. Owns `atlas-need`, `pilot-customer`. |

Private objectives explain the authored preferences and relationship deltas below. They do not authorize an NPC to invent evidence. Relationships express cooperation in this scenario, not the truth of an NPC's statements.

## State, questions, and effect order

Use one-based R1–R5 in records and UI; the current engine's array index is R−1. Metric tuple order is **D/T/Q**: delivery, team trust, product quality. Relationship tuple order is **M/I/L/T**. Initial values are `(50,55,50)` and `(50,50,50,50)`. Every value is an integer clamped separately to `[0,100]`.

1. Start from a fresh run: phase `briefing`, no decisions/evidence/flags/pending effects. Begin R1 with phase `play`, two questions, and an empty per-round asked set.
2. A valid question must belong to the current round and its named stakeholder, be unasked this round, and have a remaining conversation. It consumes one conversation, grants the player its attributed evidence, and adds **+2** to that person's relationship, clamped immediately. Both questions may concern the same person. Zero questions is allowed. Other NPCs do not learn a private answer automatically.
3. Choosing/editing a preset or proposing typed input changes no committed state. Match the current JavaScript validation: trimmed text must contain at least 20 UTF-16 code units and raw input must not exceed 1,200. Store the confirmed text with outer whitespace trimmed; never replace it with interpreter-generated wording. It must be reviewed and explicitly confirmed. A tie/no match requires a choice. No extra effects come from wording, length, keywords, or a favorable explanation.
4. On one confirmed choice, combine its base D/T/Q change with its eligible evidence bonus, then clamp once per metric. Apply each relationship change to the current value after conversations, then clamp. Append its flag, a decision event, the actual changes, and the chosen approach. Enter `result`. Repeat confirmation in that phase is rejected without another effect.
5. On advance from R1–R4, apply that choice's single delayed rule once, independently clamping its D/T/Q changes. Attach it to the originating decision and expose it at the next round's arrival. Then the next round is playable with two questions and an empty asked set. Retain accumulated evidence, decisions, relationships, and flags.
6. Advance from the R5 result enters `complete`, adds no delayed effect, and reveals the debrief/private motives. Further decisions, questions, and advances are rejected. Restart creates a new run and clears prior state and pending input. No persistence is part of this contract.

Store requested and actual changes separately. For a metric value `x`, base change `b`, and eligible bonus `e`, commit `clamp(x+b+e)`. Actual change is the result minus `x`; the bonus's marginal benefit is `clamp(x+b+e)−clamp(x+b)`. A qualified bonus can have zero marginal effect at a cap. Do not claim it improved the outcome if its marginal effect is zero.

Each round has exactly one confirmed choice. A missing, duplicate, or contradictory predecessor choice is invalid state; do not silently select a fallback delayed effect. Existing engine fallbacks are not an authorization to accept malformed histories. Numeric relationships retain their current descriptive labels: `65+` backing, `48–64` open to persuasion, `32–47` guarded, `0–31` strained. Labels do not change question availability.

## All immediate and delayed rules

Each row defines a stable rule ID `choice:<round-id>:<choice-id>`. Values are signed **D/T/Q** and **M/I/L/T** vectors. A bonus applies only if the player acquired that exact question ID before confirming this choice. Acquiring a fact through a subsequent public reveal does not retroactively earn a listening bonus.

| Round / choice ID | Intent | Immediate D/T/Q | Relationship M/I/L/T | Evidence bonus | Flag | Next-round D/T/Q |
| --- | --- | --- | --- | --- | --- | --- |
| R1 `pilot` | Small gated pilot | `+5,+5,+9` | `−3,+5,+3,+3` | `failure`: Q `+5` | `pilot` | `0,0,+3` |
| R1 `launch` | Keep public launch | `+18,−5,−14` | `+8,−8,−5,−3` | None | `publicLaunch` | `0,−4,−2` |
| R1 `delay` | Move launch date | `−14,+4,+18` | `−10,+8,+5,0` | `campaign`: T `+4` | `delay` | `+4,0,+3` |
| R2 `explicit` | Explicit consent | `−7,+11,+9` | `−5,+2,+8,+5` | `retention-fix`: D `+4` | `explicitConsent` | `0,+3,0` |
| R2 `quiet` | Quiet default fix | `+7,−7,+4` | `+4,+3,−6,−4` | None | `quietFix` | `0,−6,0` |
| R2 `exception` | Atlas retention exception | `+10,0,−6` | `+4,−4,−3,+5` | `atlas-retention`: Q `+4` | `atlasException` | `0,0,−2` |
| R3 `open` | Public context correction | `−5,+13,+3` | `−4,+6,+5,+3` | `full-thread`: T `+4` | `openContext` | `0,+2,+3` |
| R3 `broker` | Private leadership reset | `+3,+5,+1` | `+5,+3,0,−2` | None | `privateReset` | `0,+1,0` |
| R3 `ignore` | Decline rumor discussion | `+9,−14,−5` | `+3,−9,−4,−5` | None | `ignoredRumor` | `0,−3,−5` |
| R4 `core` | Shared action-item reliability | `−3,+3,+14` | `−3,+6,+2,−4` | `market-sample`: D `+5` | `sharedCore` | `0,0,+5` |
| R4 `custom` | Atlas workflow | `+14,+2,−10` | `+6,−7,−2,+8` | `contract-terms`: T `+4` | `customBranch` | `+4,0,−3` |
| R4 `both` | Split team across both | `+6,−6,−7` | `+4,−10,−3,+3` | None | `splitTeam` | `−6,0,−4` |
| R5 `evidence` | Bounded recommendation | `+1,+10,+5` | `0,+5,+6,+3` | `gate`: D `+4` | `evidenceBrief` | None |
| R5 `momentum` | Lead with demand/momentum | `+15,−8,−9` | `+7,−5,−7,−2` | None | `momentumBrief` | None |
| R5 `shared` | Joint checkpoint | `−8,+7,+8` | `−4,+4,+4,+4` | `owners`: T `+4` | `jointCheckpoint` | None |

Delayed rule IDs are `delay:<origin-round-id>:<choice-id>`. A table audience lists who learns the detailed event in-world. The player sees every arrival as an authored narrator report; this does not make every NPC omniscient. No delayed rule changes relationships.

| Applied entering | Origin | Required authored event | NPCs permitted to reference its details |
| --- | --- | --- | --- |
| R2 | `pilot` | Pilot failure report caught by review gate | I, T |
| R2 | `launch` | Wider exposure and Support escalation | M, I, L, T |
| R2 | `delay` | Engineering reproduces defect during the pause | I |
| R3 | `explicit` | Consent notice gives Support a clear customer answer | L, T |
| R3 | `quiet` | Customer questions the unexplained earlier recordings | L, T |
| R3 | `exception` | Separate retention policy consumes review time | I, L |
| R4 | `open` | Engineer posts a blocker in the shared channel | M, I, L, T |
| R4 | `broker` | Joint leadership summary reduces speculation; full record still not shared | M, I, L, T may reference the summary; only M/I know the private agreement's details |
| R4 | `ignore` | Privately reported defect misses the launch checklist | I; other NPCs must not quote that private report |
| R5 | `core` | Shared action-item fix passes review; Atlas contract remains pending | I, T |
| R5 | `custom` | Atlas confirms a conditional commitment; branch still costs maintenance | M, I, T |
| R5 | `both` | Shared review bottleneck causes a slip/incomplete validation | M, I, T |

## Evidence inventory and knowledge boundaries

The 40 existing question IDs remain valid. At each round's entry, the named source receives that round's authored information; this is timed story evidence, not proof they knew a future event in R1. Asking creates an evidence event for the player and source only. An answer's `kind` and source must remain visible. Keep its current `kind` unless the corrected planning-note attribution below requires more precise wording.

| Round | Mara's question IDs | Ishan's question IDs | Leah's question IDs | Theo's question IDs |
| --- | --- | --- | --- | --- |
| R1 | `campaign`, `mara-pressure` | `failure`, `rewrite` | `consent-warning`, `safe-pilot` | `atlas-need`, `pilot-customer` |
| R2 | `funnel`, `mara-signoff` | `retention-fix`, `data-scope` | `data-promise`, `legal-path` | `atlas-retention`, `customer-trust` |
| R3 | `screenshot-source`, `mara-reset` | `full-thread`, `eng-silence` | `rumor-boundary`, `decision-log` | `rumor-customer`, `theo-context` |
| R4 | `runway`, `mara-market` | `review-bottleneck`, `manual-bridge` | `exception-cost`, `deal-language` | `market-sample`, `contract-terms` |
| R5 | `demand-quality`, `mara-reflection` | `gate`, `ishan-reflection` | `owners`, `leah-reflection` | `customer-next`, `theo-reflection` |

The source text in `scenario.js` supplies these accounts. Its statements are constrained by this contract: a claim about player history must match an actual event; a general reflection must not pretend to recall a nonexistent decision. Existing claims about fictional tests/customers are authored story evidence, not real-world facts. No external research or legal evaluation is implied by the consent storyline.

All four hear each committed **approach ID/title** and its public outcome. They do not automatically receive the player's raw typed rationale, another NPC's private interview, or hidden motive. A numeric trust change never grants factual knowledge. Memory rendering must check the originating event and its audience before using a specific detail. The player may inspect their own collected evidence throughout the run; ordinary tool responses follow the same player-visible boundary. Authoring/test fixtures may contain all motives, as may downloaded client source; neither is a secure store for secrets.

### Corrected source of the rumor

The cropped material is a **pre-existing team-planning note**, authored before the player's first decision. Its canonical planning question is: “What evidence would make a limited launch safe?” The full note also mentions a review gate. It is not a quote of the player's preset choice or their typed input. Preserve the note identity as `story:planning-note` and the existing interview ID `full-thread`.

R3's title/description must identify earlier team planning context rather than assert that a particular player decision was cropped. Ishan's answer and evidence description must identify the earlier note; his `open` reaction refers to the note asking for evidence. Mara's admission says she shared the crop to **discuss launch planning**, not necessarily to explain a campaign change, because `launch` does not move the date. These are content corrections with no score or bonus changes.

At the opening of R3, record `story:rumor-circulates`: the claim “Product has lost confidence in Engineering” has reached the four leads and the engineering channel. It is an **unverified interpretation**, not a fact about the player. Mara knows she shared the crop with two leads and added her interpretation; no actor knows who caused the wider spread. Ishan and Leah know the full planning note. Theo knows the crop's claim and customer date confusion, not the full note or the two-lead admission. Customers have received conflicting dates, not the internal screenshot.

| R3 choice | Disclosure event and resulting knowledge | Prohibited inference or disclosure |
| --- | --- | --- |
| `open` | `disclosure:rumor:open` shares the full planning note and public correction with all four leads, the engineering channel, and player. Those recipients can now contrast the crop with its source. | Do not expose Mara's private admission or motives, invent a culprit for wider sharing, send private messages to customers, or attribute the note to player input. |
| `broker` | `disclosure:rumor:broker` makes the full note/private agreement available to M, I, and player. At next-round arrival, everyone receives the limited leadership summary. L/T still cannot quote the private agreement or newly claim access to the note through this action. | Do not treat the summary as a full public correction. Other actors' pre-existing knowledge is not erased: Leah already knows the note independently. |
| `ignore` | No new verified source disclosure. Keep the rumor flagged uncorrected. The delayed private-defect event is known only to I in-world and to the player as narrator evidence. | Do not silently turn the rumor into truth or share the private defect with every stakeholder. |

Sharing the note during the choice does not add a conversation, create an asked-question ID, or award the `full-thread` bonus unless it was already heard. Other choices do not disclose private interviews. R5 reveals each private motive as **authored scenario information**, even when its hints were never interviewed; it must not be described as a deduction the player made.

## Conditional stakeholder memory

Implement these minimum callbacks in the named round's conversation opening. They supplement the existing question options, consume no question, and add no numeric change. Use the recorded **choice**, never an inferred quote. If the referenced decision event is absent or invalid, omit the callback and report invalid state for QA rather than choosing an invented history. The source event is public to the relevant actor, so each listed statement is allowed.

| Rule ID / actor / time | Branches and required meaning | Evidence |
| --- | --- | --- |
| `memory:mara:promise`, M at R2 | `pilot`: “You kept a limited opening rather than the broad launch.” `launch`: “You kept the public date; Growth is carrying that commitment.” `delay`: “You moved the launch date; I need a revised commitment.” | R1 confirmed decision |
| `memory:ishan:promise`, I at R2 | `pilot`: “You chose containment; the review gate now matters.” `launch`: “You kept the public launch despite the reliability risk.” `delay`: “You gave us review time; the immediate fix and the rewrite remain separate.” | R1 confirmed decision; if discussing the reproduced defect, also the appropriate delayed event |
| `memory:leah:consent`, L at R3 | `explicit`: “You chose explicit consent, so the customer notice can name the policy.” `quiet`: “You changed the default without explaining the earlier recordings.” `exception`: “You chose a separate Atlas policy; it needs an owner.” | R2 confirmed decision; complaint details additionally require `delay:consent:quiet` |
| `memory:theo:scope`, T at R5 | `core`: “You prioritized the shared core; Atlas still needs a follow-up.” `custom`: “You prioritized Atlas's workflow; its commitment remains conditional.” `both`: “You split the work; the review bottleneck has affected the plan.” | R4 confirmed decision plus the corresponding R5 arrival for validation, contract, or bottleneck details |

A private interview answer may state the speaker's own perspective, but another person cannot react to that answer merely because the player collected it. A relationship label can be displayed alongside memory; it must not manufacture factual evidence or silently unlock more information. Existing later reflections (`mara-reflection`, `theo-reflection`, etc.) need a narrative consistency pass under the same rule before release.

## Event and debrief evidence contract

Use an append-only causal record per fresh run. The implementation may adapt storage shape, but must retain these fields and distinctions:

| Event data | Required meaning |
| --- | --- |
| `runId`, `eventId`, sequence, rules version, round ID | Unique within a run and stable after creation; sequence defines order. IDs such as `<run>/R3/question/full-thread` and `<run>/R3/choice/open` are sufficient. |
| `type`, `ruleId`, actor/source, `sourceEventIds` | Distinguish question, confirmed decision, delayed consequence, authored story, disclosure, memory, and completion. Every derived statement identifies its causes. |
| Metric/relationship before, requested change, actual change, after | Enough evidence to recompute clamping. Record eligible bonus question ID, requested bonus, and marginal benefit separately. |
| Approach ID/title, confirmed input mode and text | Raw player text only when actually submitted and confirmed. Preset decisions have no invented text. Escaped display/export must preserve the meaning of stored input. |
| Knowledge audience, player visibility, evidence status | Distinguish documented/authored fact, attributed account, unverified claim, and interpretation. Knowledge never comes solely from a metric or from the author knowing the whole scenario. |

Memory events cite a prior decision; delayed events cite the decision that caused them; rumor corrections cite both the rumor event and planning-note source. Do not count UI rerenders or repeated opening of a conversation as new story events. Proposed/edited/cancelled typed input is not a confirmed decision and creates no gameplay effect. A logging event must not recursively generate additional memory events when rendered.

The debrief must contain the five recorded choices, actual effects including caps, linked later consequences, conversations heard, final relationships, and the authored motive reveal. Each factual claim must link to specific event IDs or an inspectable aggregate calculation over them. Player wording and scenario-authored quotations need distinct labels. Unsupported details are omitted, not filled in.

Retain the current ordered outcome rubric below. Titles are scenario interpretations, not factual hiring/personality assessments. Show the final D/T/Q values and the matched rule; qualify interpretive prose accordingly. Do not infer “repeated delays,” actual team beliefs, or a promised feature's completion from a score alone.

| First matching rule | Condition | Outcome label |
| --- | --- | --- |
| `outcome:earned` | Q ≥65, T ≥65, D ≥40 | You earned the next step. |
| `outcome:deadline` | Otherwise Q ≥65, T ≥60 | Credibility needs a deadline. |
| `outcome:borrowed` | Otherwise D ≥70, Q <55 | You launched on borrowed time. |
| `outcome:room` | Otherwise Q ≥60, T <55 | The product is ahead of the room. |
| `outcome:proof` | Otherwise T ≥65 | The room believes you. Now prove it. |
| `outcome:fragile` | Otherwise | A fragile compromise. |

Conversation counts cite question events and distinguish up to ten interviews from distinct stakeholders heard. A “listening improved the result” claim requires a positive marginal bonus, not merely an eligible bonus flag. A quiet-fix or ignored-rumor reflection cites that choice and its actual later event. An Atlas-specialization reflection cites `exception` or `custom` and the related maintenance consequence; it cannot claim realized revenue. Reflection questions and suggestions are labeled as such and do not become alleged historical events.

## Three reference paths

These fixtures are normative expectations from the numeric tables above. I calculated them with an independent arithmetic routine using literal authored vectors and the specified clamp/order; it did not import or call the game engine. QA independently reviewed the arithmetic and must execute implementation checks against an identified build. Passing candidate regression tests alone does not approve narrative behavior or this contract's new events.

In each table, **entry** is after the previous delayed effect and before that round's questions; **commit** is immediately after the confirmed choice; **next** is after its delayed effect, or the final complete state for R5. Relationships are after questions and choice; delayed rules leave them unchanged. Evidence and flags accumulate in listed order. At commit, phase is `result`, history length equals the round number, and conversations remaining equal two minus that row's questions. Advancing resets asked IDs and conversations to two, except R5 completes. All paths start from the same fresh state.

### PATH-A: bounded evidence

| R / choice | Questions in order (source) | Entry D/T/Q | Commit D/T/Q | Next D/T/Q | Commit M/I/L/T |
| --- | --- | --- | --- | --- | --- |
| 1 `pilot` | `failure` (I), `mara-pressure` (M) | `50/55/50` | `55/60/64` | `55/60/67` | `49/57/53/53` |
| 2 `explicit` | `retention-fix` (I), `data-promise` (L) | `55/60/67` | `52/71/76` | `52/74/76` | `44/61/63/58` |
| 3 `open` | `full-thread` (I), `screenshot-source` (M) | `52/74/76` | `47/91/79` | `47/93/82` | `42/69/68/61` |
| 4 `core` | `market-sample` (T), `review-bottleneck` (I) | `47/93/82` | `49/96/96` | `49/96/100` | `39/77/70/59` |
| 5 `evidence` | `gate` (I), `owners` (L) | `49/96/100` | `54/100/100` | `54/100/100` | `39/84/78/62` |

Expected: `outcome:earned`; ten conversations, all four sources, five positive marginal bonuses. R4 delayed Q is **+4 actual**, not requested +5; R5 T is **+4 actual**, Q **0 actual**, D **+5 actual**. Final labels: M guarded, I backing, L backing, T open. Public correction reaches the room; Mara's private admission remains private. Debrief links the R3 correction to the earlier authored note, not to invented player wording.

### PATH-B: momentum without disclosure

No questions are asked in any round; this is a valid play style and earns no listening bonus.

| R / choice | Entry D/T/Q | Commit D/T/Q | Next D/T/Q | Commit M/I/L/T |
| --- | --- | --- | --- | --- |
| 1 `launch` | `50/55/50` | `68/50/36` | `68/46/34` | `58/42/45/47` |
| 2 `quiet` | `68/46/34` | `75/39/38` | `75/33/38` | `62/45/39/43` |
| 3 `ignore` | `75/33/38` | `84/19/33` | `84/16/28` | `65/36/35/38` |
| 4 `both` | `84/16/28` | `90/10/21` | `84/10/17` | `69/26/32/41` |
| 5 `momentum` | `84/10/17` | `99/2/8` | `99/2/8` | `76/21/25/39` |

Expected: `outcome:borrowed`; zero conversations/sources/bonuses. Final labels: M backing, I strained, L strained, T guarded. R2 explanation gap and R3 withheld-defect consequences have distinct causes and events. The rumor remains uncorrected; the private defect must not appear as something every NPC knows. The final motive reveal is authored information, not a claim that the player discovered it.

### PATH-C: account accommodation and clarification

| R / choice | Questions in order (source) | Entry D/T/Q | Commit D/T/Q | Next D/T/Q | Commit M/I/L/T |
| --- | --- | --- | --- | --- | --- |
| 1 `delay` | `campaign` (M), `rewrite` (I) | `50/55/50` | `36/63/68` | `40/63/71` | `42/60/55/50` |
| 2 `exception` | `atlas-retention` (T), `legal-path` (L) | `40/63/71` | `50/63/69` | `50/63/67` | `46/56/54/57` |
| 3 `broker` | `mara-reset` (M), `rumor-boundary` (L) | `50/63/67` | `53/68/68` | `53/69/68` | `53/59/56/55` |
| 4 `custom` | `contract-terms` (T), `exception-cost` (L) | `53/69/68` | `67/75/58` | `71/75/55` | `59/52/56/65` |
| 5 `shared` | `owners` (L), `customer-next` (T) | `71/75/55` | `63/86/63` | `63/86/63` | `55/56/62/71` |

Expected: `outcome:proof`; ten conversations, all four sources, four positive marginal bonuses. Final labels: M open, I open, L open, T backing. Atlas receives two special accommodations with recorded maintenance costs, but no unconditional revenue is asserted. M/I know the private agreement; L/T only receive its leadership summary, with Leah retaining her independent prior knowledge of the note.

For typed coverage, at R3 enter `I need more context before choosing an approach.` and review it without commitment; edit to `I will broker a private reset with the leads.` and explicitly choose `broker`. The confirmed text alone is recorded. The pre-confirmation review/edit consumes no round or conversation and does not mutate committed metrics, relationships, flags, evidence, or history. The final state must equal a preset `broker` run with the same questions. Whether the first wording receives a weak suggestion or no suggestion must not affect this equivalence; the player can change it. Add a separate genuinely no-match string such as `zzzz qqqq xxxx vvvv nnnn` to verify explicit selection is required when no keywords match.

### Control and boundary variants

- Replace PATH-B's R3 `ignore` with `broker`, keeping all other choices and zero questions. At R3 entry `75/33/38`, commit becomes `78/38/39`; R4 entry becomes `78/39/39`, with a summary event and **no private-defect event**. Final metrics are `93/25/19`. This isolates the absence of the ignored-rumor trigger; different immediate effects must also be accounted for.
- Repeat PATH-A R1 without `failure` but with its other question unchanged: immediate Q is `59`, next-entry Q `62`, exactly five below the main path at those checkpoints. Only I's missing interview relationship +2 is absent; M's interview remains. Do not reuse later main-path totals without recomputation because later caps can erase a difference.
- For all three R1 choices, ask `full-thread` at R3 in a separate valid variant. The note remains authored pre-run context and never claims to reproduce the player's actual decision. Also use a typed R1 decision whose wording is different from the note.
- Refresh/restart after a committed round in a separate run. Under the selected session policy, the result is the fresh initial state, not a resumed fixture. No old decision, pending effect, input, or event ID may contaminate the new run.
- Verify clamping at each step rather than at the end of a run, question budget/duplicate guards, invalid predecessor histories, repeated confirmation/advance, and no raw player-text interpretation until confirmed. These are verification obligations, not asserted passing results.

## Handoff and review

SCRUM-13 can implement the four memory rules, knowledge audiences, disclosure events, and once-only delayed provenance without changing numeric tuning. SCRUM-15 can implement event-backed claims and preserve observed facts versus interpretation. SCRUM-11 can turn the tables and paths into independently reviewed executable expectations. SCRUM-8/12 own the visible session warning and interaction behavior; this document adds no alternative save policy.

QA and development/UX reviewed arithmetic, audience consistency, implementability, the typed/preset equivalence contract, and compatibility of the corrected quotation with every R1 choice. The coordinator owns Git/Jira updates. Completion of this authored contract does not mean memory, rumor knowledge, or debrief citations are implemented or release-verified.

| Independent review, October 1 | Outcome and limits |
| --- | --- |
| QA | Independently recomputed all three reference paths, interview relationship changes, bonuses, caps, and the broker control: no numeric mismatch. Reviewed knowledge audiences and found no blocking specification issue. Execution of new memory/event/debrief requirements remains outstanding. |
| Development / UX | Compared all 15 choice vectors, bonuses, and flags with the source; reviewed effect order, fixture arithmetic, scoped disclosure, memory idempotency, and debrief traceability. No blocking implementability or scope finding. This is contract review, not a claim of completed features. |
