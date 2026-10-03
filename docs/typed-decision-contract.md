# Typed decisions: conservative authored matching

Owner: Product/Game Design and UI/UX, [SCRUM-14](https://sadhirr1.atlassian.net/browse/SCRUM-14). Version: `typed-choice-v1`, October 1, 2026. This increment extends open PR #7 from `4d0f3df` on `feature/SCRUM-12-session-flow`; the separate memory and visual PRs are not included. The [product brief](product-brief.md), [player experience contract](player-experience.md) and [scenario rules](scenario-rules.md) remain authoritative for scope, interaction and game effects.

Status: reviewed contract and independently expected fixtures, with implemented matcher/wording display and QA execution recorded below. Development owns the implementation; QA owns its fixture execution. Product independently reviewed the source, test expectations and retained screenshots. No general language-understanding or release-acceptance claim is made.

## Decision and scope

Keep typed decisions as a local convenience for choosing among the current round's three authored approaches. A suggestion is a visible, overridable selection; it is never a commitment, confidence score or assessment of whether the player's reasoning is good. Complex or unsupported wording remains usable: the player chooses an approach explicitly and confirms it.

The inspected baseline matcher uses substring counts and a unique highest score. That can let fragments such as `ship` in `spaceship`, a negated action, or several competing intents select an unintended approach. Replace that selection policy with a conservative finite contract. Do not change scenario keywords, choice IDs, numerical rules, evidence bonuses, question limits or delayed effects. Add no model, network service, credential, logging destination or cost.

The coordinator approved this reversible scope. Product and QA agreed the fifteen affirmative examples below against the authored choice meanings before treating implementation output as evidence. Generic words such as `public`, `20`, `test` or `meeting` are insufficient alone: a candidate also needs a reviewed anchor. This remains a lexical convenience, not a parser capable of judging every English sentence.

## Matcher contract

1. Only interpret an active decision round. Keep the existing validation: a string with at least 20 UTF-16 code units after trimming and at most 1,200 code units before trimming. Invalid input throws without changing the game. The existing field validation remains visible and associated with the textarea. Character-unit semantics are unchanged.
2. Return the existing shape `{ suggestedId, text }`, with `text` equal to the original submitted string after **outer whitespace trimming only**. Preserve internal whitespace, punctuation, casing, symbols and line breaks. Use a separate normalized representation for matching; never display it as the player's wording.
3. Normalize matching text to lowercase, remove straight/curly apostrophes, and tokenize letters/numbers on punctuation, hyphens and whitespace. Match an authored keyword or anchor as a whole contiguous token sequence. A token embedded inside another word is not a match. Do not stem words, translate, infer synonyms or score semantic similarity.
4. Require one of the following leading token sequences: **I will; I would; I choose; I propose; I recommend; I plan to; We will; We should; We choose; We propose; We recommend; We plan to**. Other forms return `suggestedId:null`. A frame expresses only a supported form, not proof that the following sentence describes a sensible game decision. Contractions such as “I'll” are not added as affirmative aliases in this version.
5. Return no suggestion if the original text contains `?`, a straight/curly double quotation mark, or a backtick. Also reject a straight/curly single quote anywhere when either adjacent side is a boundary rather than a letter or number, including the beginning/end of text. Keep inside-word apostrophes available for normalization: `don't` is still vetoed as `dont`. Plural possessives may conservatively require an explicit choice. These finite quotation/question checks do not parse reported speech.
6. Return no suggestion when any normalized whole token is in the veto inventory below. Vetoes apply before positive matching, including in otherwise clear choices. Do not try to infer which clause a negation modifies.
7. Identify **every** current-round approach with at least one authored keyword/phrase match. Exactly one candidate is necessary; zero or two/three candidates return no suggestion, regardless of relative keyword counts. Repeating keywords cannot win a conflict. All existing keywords still participate in ambiguity detection.
8. The sole candidate must also match at least one of its anchors in the table below. Otherwise return no suggestion. This removes weak incidental signals without claiming all irrelevant prose is detected.
9. Reading a proposal changes no metrics, relationships, evidence, history, flags, round or conversation count. Only the subsequent explicit confirmation applies the selected approach once. A manual override is valid even when it differs from the suggestion or no suggestion exists.

Veto tokens are an explicit inventory, not a promise to recognize every negation, condition, alternative or quotation:

```text
no not never neither nor without avoid avoiding refuse refusing reject rejecting
instead rather if unless until when provided assuming depending otherwise
maybe perhaps might could or either versus vs
dont doesnt didnt cant cannot wont wouldnt shouldnt couldnt isnt arent
wasnt werent havent hasnt hadnt
said says quote quoted
```

The apostrophe normalization makes `don't` and `don’t` equivalent to `dont` for this inventory. `or` does not match part of `for`. `would` and `should` are allowed in the listed affirmative forms; `wouldn't` and `shouldn't` are vetoed. Authored keyword phrases such as `not launch`, `not engage`, `without announcing` and `no announcement` remain in the scenario but cannot override the veto. The player can still select their intended approach manually.

## Reviewed anchors

Anchors are case-insensitive whole token sequences. They are additional matcher metadata, not new playable actions or alternative scoring rules. Keep them reviewable in the implementation beside this finite policy.

| Round / choice | At least one anchor required |
| --- | --- |
| 1 / `pilot` | `pilot`; `limited rollout`; `staged rollout` |
| 1 / `launch` | `launch now`; `public launch`; `public release`; `release the product`; `all users` |
| 1 / `delay` | `postpone`; `delay the launch`; `pause the launch`; `move the date` |
| 2 / `explicit` | `explicit consent`; `opt in`; `permission`; `deletion` |
| 2 / `quiet` | `patch the retention`; `retention default`; `quiet fix`; `silently patch` |
| 2 / `exception` | `Atlas`; `retention exception` |
| 3 / `open` | `full thread`; `all hands`; `share the context` |
| 3 / `broker` | `broker`; `mediate`; `private reset`; `one on one` |
| 3 / `ignore` | `ignore the rumor`; `dismiss the rumor`; `keep working`; `move on` |
| 4 / `core` | `shared core`; `reliability`; `all teams` |
| 4 / `custom` | `Atlas`; `custom workflow` |
| 4 / `both` | `split the team`; `both workstreams`; `parallel workstreams`; `two teams` |
| 5 / `evidence` | `bounded recommendation`; `present evidence`; `release gate`; `risk threshold` |
| 5 / `momentum` | `lead with momentum`; `broad expansion`; `expand the launch` |
| 5 / `shared` | `joint checkpoint`; `bring all leads together`; `align all leads` |

An anchor never bypasses the unique-candidate requirement. In R1, “I will run a small pilot with a stop condition” intentionally needs manual selection because `pilot/small` and `stop` match different authored approaches. In R4, an explicit phrase about splitting the team may suggest `both`; mentioning both `core` and `Atlas` instead is a conflict and needs a choice. Do not special-case those sentences into a semantic parser.

## Fifteen affirmative fixtures

These are literal independent expectations, approved against the authored scenario before executing the new matcher. Use the stated round in a valid run, not a synthetic phase that skips required prior choices. Each preview must leave the original state unchanged. After explicit confirmation, typed and preset versions of the same approach must have equivalent game effects, including evidence bonuses and the subsequent delayed effect; the typed record additionally retains its confirmed wording.

| ID | Round | Submitted wording | Expected suggestion |
| --- | --- | --- | --- |
| TD-P01 | 1 | I will run a small pilot with a clear review process. | `pilot` |
| TD-P02 | 1 | I will release the product to all users on the announced date. | `launch` |
| TD-P03 | 1 | I will postpone the announced date for a week. | `delay` |
| TD-P04 | 2 | I will ask for explicit consent and provide a deletion path. | `explicit` |
| TD-P05 | 2 | I will quietly patch the retention default this afternoon. | `quiet` |
| TD-P06 | 2 | I will negotiate an Atlas retention agreement for this account. | `exception` |
| TD-P07 | 3 | I will share the full thread so the team has the context. | `open` |
| TD-P08 | 3 | I will broker a private reset with Growth and Engineering. | `broker` |
| TD-P09 | 3 | I will ignore the rumor and keep working toward delivery. | `ignore` |
| TD-P10 | 4 | I will protect the shared core and improve reliability for all teams. | `core` |
| TD-P11 | 4 | I will build a custom Atlas workflow for the anchor account. | `custom` |
| TD-P12 | 4 | I will split the team and run both workstreams in parallel. | `both` |
| TD-P13 | 5 | I will present a bounded recommendation with evidence and a next gate. | `evidence` |
| TD-P14 | 5 | I will lead with momentum and ask for broad expansion. | `momentum` |
| TD-P15 | 5 | I will bring all leads together for a joint checkpoint. | `shared` |

## Clarification fixtures and boundaries

Every example below is valid-length input and must return `suggestedId:null`, preserve the trim-only text and leave committed state unchanged. No suggestion means no checked radio, first-radio focus and a required explicit choice; it is not rejection of the player's draft.

| Category | Independently expected examples |
| --- | --- |
| Negation | R1: “I will not run a small pilot this week.”; R2: “I will not negotiate a special Atlas contract.”; R3: “I will never ignore the rumor or dismiss the concerns.”; R4: “I will not build a custom Atlas workflow.”; R5: “I will not lead with momentum or demand.” |
| Word fragments | R1: “I will hire a spaceship mechanic tomorrow.” and “I will ask the latest applicant to return tomorrow.”; R4: “I will discuss the scorecard with the team tomorrow.”; R5: “I will delegate this administrative request tomorrow.” |
| Incidental whole words | R1: “I will visit a public park tomorrow afternoon.”, “I will read 20 books during my vacation.”, “I will mark this test paper tomorrow morning.”; R2: “I will read a quiet book on the train tomorrow.”; R3: “I will schedule a private meeting about office chairs.”; R5: “I will buy a scale for the office kitchen.” |
| Unequal competing signals | R1: “I will run a small limited pilot and release the product to all users.” Repetition or a higher count for one candidate must not select a winner. |
| Condition / alternative | R1: “I will run a pilot if the team agrees tomorrow.”; R2: “I will ask for explicit consent or quietly patch the default.”; R4: “I will protect the shared core or build a custom Atlas workflow.” |
| Mixed intents without `or` | R3: “I will share the full thread and broker a private reset.”; R5: “I will present evidence and lead with momentum for expansion.” |
| Reported / quoted | R1: “Mara recommends a public launch for all users.”, “I heard that Mara wants a small pilot tomorrow.”, `I will quote "run a small pilot" in the minutes.`, `I will use 'pilot' as a label for the lunch menu.`, and `I will use ‘pilot’ as a label for the lunch menu.`; R3: “I was told to share the full thread with everyone.” |
| Unsupported form | R1: “Please run a small pilot with a review process.” is intentionally outside the accepted leading forms. Accept the draft and offer the same three explicit choices. |

Also verify minimum/maximum boundaries: empty, whitespace-only, 19 units after trimming, 20 units, 1,200 raw units, and 1,201 raw units. Include emoji to make the existing UTF-16 counting explicit: ten two-unit emoji meet the minimum but receive no suggestion; 601 exceed the maximum. Adding outer whitespace cannot bypass the raw maximum. Validation does not consume a round.

Case and layout control: `  I WILL run a SMALL pilot with a clear review process.\n` suggests `pilot`, retains internal case and spacing, and stores only the outer-trimmed text. In R2, `I will keep Atlas's retention exception for this account.` and its curly-apostrophe counterpart `I will keep Atlas’s retention exception for this account.` suggest `exception` through the existing `exception` keyword and `retention exception` anchor. This does not add possessive stemming: normalized `atlass` alone does not match `atlas`. A negated or unmatched draft may still be explicitly confirmed as any valid approach. Test overriding a pilot suggestion with `delay` and confirming a no-suggestion draft; resulting effects come solely from the selected approach, never from keyword frequency or prose sentiment.

## Player-facing wording and interaction

Retain the explanation that this edition matches words to three authored approaches and the player chooses the interpretation. A suggestion means “words in your decision suggest this approach,” not “we understood your intention.” A fallback means “choose the approach that best captures your intention, or edit your wording.” Do not claim the draft is wrong or require rewriting it to fit a recognizer.

Show the trim-only submitted text in the proposal under **Your wording**, separately from the approach choices. Escape it as text, preserve line breaks, and wrap long unbroken strings. The confirmed result must separately label **Confirmed approach** and **Your wording**. A preset result has no fabricated player quotation. Journal/export retention follows the same existing trim-only convention. The word “raw” in this handoff means original player content, not an untrimmed persistence promise.

Keep PR #7's reviewed focus/error behavior: checked suggestion or first unselected radio on open; visible associated error if no choice is confirmed; Edit returns to the preserved textarea; cancel returns to the review trigger; confirmation applies one decision and focuses the result heading. Previews, edits, cancellation and manual overrides do not independently change game state. Do not add remote interpretation, waiting animation or hidden automatic confirmation.

## Known limits and acceptance evidence

This intentionally favors manual clarification over uncertain preselection. It does not understand unrestricted English, sarcasm, indirect negation, arbitrary quotation, mixed languages, every irrelevant use of an anchor or every paraphrase. It does not infer which clause contains the player's final intention. The explicit choice remains the authority. Future additions to frames, vetoes or anchors require reviewed examples and counterexamples; never relabel this finite matcher as live AI.

| Deliverable | Evidence / status |
| --- | --- |
| Contract and fixture expectations | Authored from baseline source and scenario meanings; finite policy and fifteen positives agreed with Development/QA. Coordinator, Development correspondence and independent QA reviews passed after the boundary-quote refinement. These are specification reviews, separately recorded from runtime acceptance. |
| Engine and wording-display implementation | Development owns `public/engine.js` and `public/app.js`. Independent Product source review passed, including the boundary-quote correction, metadata correspondence, escape calls and separated wording/action labels. Rendered behavior remains a separate check. |
| Executed fixtures | Product independently reviewed QA's 25 new tests, including fifteen literal intent expectations and thirty clarification examples; no expectation mismatch found. The [QA record](evidence/session-2026-10-01-0900-qa.md) reports 47/47 total tests passing at 09:13:38 PDT after the quote correction. Product independently verified its three final source/test hashes; execution belongs to QA. |
| Browser preview, fallback, override and result wording | Product independently opened the four coordinator captures: [preview](evidence/images/session-2026-10-01-0900-preview.jpg), [overridden result](evidence/images/session-2026-10-01-0900-result.jpg), [narrow long preview](evidence/images/session-2026-10-01-0900-mobile-long-preview.jpg) and [narrow long result](evidence/images/session-2026-10-01-0900-mobile-long-result.jpg). Shown states have readable separate wording/action labels, literal markup and wrapped long input; no blocking presentation finding. Exact text/DOM measurements, metrics and interaction sequences belong to coordinator execution in the [primary session record](evidence/session-2026-10-01-0900.md). Product independently reviewed both final evidence records for scope and attribution; no blocking finding. |

Acceptance for this increment requires the reviewed fixtures and regression checks to pass against identified source, UI wording to remain separate from selected action, no mutation during interpretation, and the relevant browser checks recorded honestly. Broader accessibility, integrated PR #5/#6 behavior, complete debrief traceability and release acceptance remain separate gates. Keep the owner-approved merge boundary and existing October 13 target unchanged.
