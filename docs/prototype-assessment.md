# Prototype reuse assessment

Assessment date: September 30, 2026, morning work session. Owner: product/game-design agent. Related work: [SCRUM-6](https://sadhirr1.atlassian.net/browse/SCRUM-6) and [SCRUM-10](https://sadhirr1.atlassian.net/browse/SCRUM-10).

## Recommendation and evidence boundary

Reuse the inspected five-file browser prototype as a source baseline. Its separated scenario data, deterministic engine, confirmed action flow, decision journal, and existing interface give development useful material. This recommendation does not accept the game for release or establish that any product acceptance criterion has passed.

This assessment uses read-only source inspection and SHA-256 fingerprints. I read the engine and interface code, parsed the authored scenario data without executing it, inspected the HTML/CSS, and compared behavior with the product and quality plans. I did not execute gameplay, browser accessibility checks, recovery tests, or the candidate's test suite. Runtime evidence belongs in the independently authored QA record; code-reading findings below must not be reported as passing tests.

Original local source: `C:\Users\sadhi\Documents\Codex\2026-09-28\i\outputs\stakewolf\dist`. The source was not edited. References below use that directory and its line numbers. At initial import, I independently compared all five adopted-file fingerprints with the source: all matched the original hashes below. The subsequent intentional `public/app.js` repair is recorded immediately after the table; the final working tree is not an unchanged five-file copy. Fingerprints verify identity, not runtime behavior.

| File | SHA-256 of inspected source |
| --- | --- |
| `engine.js` | `4744ADF9F9958ACF038017661BAD792824F7B0F0F11F0E7D244081FFD9D7F2ED` |
| `scenario.js` | `1452E63AEFD23502789CFD0F9137ECD59C89EE22A912594A6EF2DE1133EFCCED` |
| `app.js` | `756FD4BA0290D6327CEB3163B774D728F4DD2138FE6D6536B19E3333A9AA06CC` |
| `index.html` | `976D092D8689900336A48CF07560556A3EE4FFB9DB0196C92560A6CB813A718A` |
| `style.css` | `D6D802BF0F4A4255EB63AE1C9C22C87F600B62AE46EA7315804DAB92C0A3C5AE` |

After the coordinator's browser check exposed a collapsed layout, development added the missing closing `</div>` for `.chapter-top` before the scene in `public/app.js:55`. The original candidate remains unchanged. I independently verified the repaired file's SHA-256 as `D3A03647EC140BF372CFC4930873EA02AD9B601FB479FE466F0ED3E0D6FB0744`. The coordinator reports a successful 1280×720 browser retest: `.chapter-top` contains only the eyebrow and chapter steps, and document width and client width both equal 1265 pixels, with no horizontal overflow. See the [before screenshot](evidence/images/baseline-layout-before.jpg) and [after screenshot](evidence/images/baseline-round-after.jpg). This is a targeted layout correction and reported retest, not broad accessibility or release acceptance; QA independently reviewed the repaired source, fingerprint, before/after screenshots, and coordinator's browser evidence with no blocking finding.

## Findings against release criteria

Coordinator integration note: the inherited extra blank line at the end of `public/scenario.js` was removed after review; no scenario data changed. Its resulting SHA-256 is `D570EF92885E78F2FED62CAB03C044C25A6D2E6F741811CD5FBAD08743EE5653`. `.gitattributes` keeps text checkout endings at LF so fingerprints are reproducible across Windows and Linux. The table above continues to identify the untouched original source.

| Criteria | Source evidence | Reuse assessment and remaining work |
| --- | --- | --- |
| AC-01: complete scenario | `engine.js:6–29,36–57,82–94`; `app.js:58–62,98–123`. States cover briefing, play, result, complete, and fresh attempts. | Reuse the loop. Independent full playthrough, repeated-action, and restart evidence are still required. |
| AC-02: stakeholders | `scenario.js:1–46` defines four public roles and private motives. Reactions and relationship changes are authored per choice. `app.js:48–50` reveals motives in the debrief. | Reuse the cast. Agendas are authored explanations, not an independently evaluated agenda model. Specify how conflicting objectives affect conditional responses and what each person can know. |
| AC-03: choices and later effects | Five rounds each contain three choices. `engine.js:44–54` records effects, while `58–91` applies flag-dependent callbacks on the next round. | Useful deterministic foundation. Approve three reference paths and exact expected values independently of current outputs; check narrative consistency across all branches. |
| AC-04: memory, trust, rumors | Relationships change and produce a generic label (`engine.js:28,52,105`). Prior choice flags change later global callbacks. Questions/answers and choice reactions are otherwise fixed (`app.js:63–70`; `engine.js:54`). | Partial mechanics only. No per-stakeholder knowledge or rumor propagation model is represented. Relationship values do not select different dialogue. Build conditional memory and information rules under SCRUM-7/13. |
| AC-05: typed decisions | `engine.js:95–103` uses substring keyword counts; ties/no match yield no suggestion. `app.js:74–78,120–123` requires selection/confirmation before `decide`. | Retain bounded explicit-intent matching. Test paraphrases, negation, irrelevant text containing keywords, and typed/preset equivalence. This is not semantic understanding or live AI. |
| AC-06: supported debrief | `engine.js:54,91` retains choice, effects, heard evidence, and followup. `getDebrief` at `106–123` derives prose from metric thresholds, counts, and flags. `app.js:48–50` places reflections beside the journal. | Reuse event history and journal. Summary claims have no explicit event-ID citations or per-claim evidence mapping. A concrete false player attribution exists in the scenario; do not describe debrief precision as verified. |
| AC-07: usable interface | Native buttons/dialogs, tab keyboard handling, live announcements, visible focus rules, and responsive CSS are present. | Reuse as a UI starting point. Source inspection does not establish contrast, focus restoration, 200% zoom, phone usability, or screen-reader behavior. |
| AC-08: reproducible release | The inspected app imports local modules and uses browser APIs. This audit did not run a fresh setup or tests. | Development must establish setup/checks and QA must execute them. Imported source is not release evidence. |
| AC-10: session behavior | `app.js:6` creates state on module load; restart/replay calls `createGame` and `resetUI`. No storage/save/restore path was found. `index.html:27` states refresh starts over. | Select clean-start behavior as the working policy. The warning is only in optional Help, not visible on the intro before entering; fix that UI gap before accepting AC-10. |

Hidden agendas are concealed in ordinary game screens until the debrief. They are present in downloadable client source. That is a spoiler boundary for this single-player game, not a security boundary or a claim that browser source cannot reveal them. The optional browser tool snapshot also omits agendas; it does not change the client-source limitation.

## Persistence and recovery decision

This exact snapshot has in-memory state only. It has no localStorage, sessionStorage, IndexedDB, saved-state parser, resume action, or invalid-save recovery path in the inspected app. Reloading a newly initialized document is expected to create a fresh game; verify that behavior in the adopted browser build. A downloaded text decision record is an export, not a resumable save.

Keep the clean-start policy for this release baseline and make its warning visible before play. The earlier report of local recovery does not describe this snapshot. No existing saving feature is being removed. Local resume can be reconsidered as a reversible enhancement with an explicit persistence contract and QA coverage; it is not needed to decide whether to reuse these files.

## Prioritized gaps

Priorities below order follow-up work; the stated S1 finding uses the quality plan's defect severity. None is a blocker to preserving the baseline with accurate limitations.

| Priority | Gap and evidence | Existing work / required outcome |
| --- | --- | --- |
| 1 — release-blocking S1 narrative defect | `scenario.js:609–614`, question `full-thread`, asserts the player wrote “What evidence would make a limited launch safe?” regardless of whether the earlier choice was `pilot`, `launch`, or `delay`, or what the player typed. It is labeled a source document. The fixed question is selected without history checks. | [SCRUM-7](https://sadhirr1.atlassian.net/browse/SCRUM-7), [SCRUM-13](https://sadhirr1.atlassian.net/browse/SCRUM-13), [SCRUM-15](https://sadhirr1.atlassian.net/browse/SCRUM-15): derive the quote from a real recorded event or clearly author it as pre-existing fiction, then make the surrounding rumor narrative consistent. Test launch and delay counterexamples. |
| 1 | Conditional stakeholder memory and information boundaries are not specified; the same later dialogue appears regardless of history or relationship. | [SCRUM-7](https://sadhirr1.atlassian.net/browse/SCRUM-7), [SCRUM-13](https://sadhirr1.atlassian.net/browse/SCRUM-13): define knowledge, disclosure, rumor recipients, and conditions for later responses. |
| 1 | Debrief prose uses proxies and flags without citing supporting event IDs for each claim. Having a journal nearby does not establish claim-level support. | [SCRUM-15](https://sadhirr1.atlassian.net/browse/SCRUM-15): distinguish observed events from interpretation and attach explicit evidence references; inspect all summary branches. |
| 2 | The no-save warning is hidden behind optional Help. | [SCRUM-8](https://sadhirr1.atlassian.net/browse/SCRUM-8), [SCRUM-12](https://sadhirr1.atlassian.net/browse/SCRUM-12): show the session policy on the intro and verify refresh/restart behavior. |
| 2 | Keyword matching can propose an intent from incidental or negated words. Confirmation limits the effect but does not prove understandable suggestions. | [SCRUM-14](https://sadhirr1.atlassian.net/browse/SCRUM-14): cover representative language, conservative fallback, and equivalent confirmed actions. |
| 2 | Rule fixtures, browser checks, and fresh-setup evidence remain separate from source review. | [SCRUM-10](https://sadhirr1.atlassian.net/browse/SCRUM-10), [SCRUM-11](https://sadhirr1.atlassian.net/browse/SCRUM-11), [SCRUM-16](https://sadhirr1.atlassian.net/browse/SCRUM-16): preserve provenance, approve independent expectations, and record executed checks. |

## Next handoff: authored rules

Game design owns SCRUM-7, with product and QA review, targeting October 2 for the rule specification. Begin with the existing `promise`, `consent`, `rumor`, `scope`, and `accountability` rounds; no new scenario is required for this increment.

1. Write a compact rule ledger: rule ID, trigger, prerequisite flags/evidence, stakeholder knowledge, visibility, immediate/delayed changes, and resulting event ID. Include value limits and effect ordering.
2. Specify each stakeholder's private objective, starting knowledge, and at least one response conditional on a recorded earlier decision. Define who receives the cropped-thread rumor and when, including prohibited disclosure.
3. Correct the `full-thread` attribution contract first. Every quoted player statement must come from recorded input or an explicitly identified authored story event.
4. Define three complete five-action reference paths, each with selected conversations, expected per-round state, delayed effects, and supported final claims. Include a control path removing a delayed trigger and a typed/preset equivalent pair.
5. Hand the reviewed ledger and fixtures to SCRUM-13 and SCRUM-15 implementation, and to SCRUM-11 for test coverage. Current engine outputs may expose discrepancies; they cannot be the sole authority for expected behavior.

No paid provider, external account, data migration, irreversible infrastructure change, or new spending is required by this reuse decision. Routine source adoption, rule authoring, and interface refinements can proceed under existing authorization. Public deployment, introducing paid AI, or changing the release commitment remain separate consequential decisions.

## Independent review record

On September 30, the independent QA agent reviewed this assessment and the reconciled product brief against the candidate source. It reported no blocking documentation finding: source inspection is separated from runtime acceptance, session policy and its missing intro notice are explicit, and the memory/narrative gaps remain visible. This is acceptance of the assessment's accuracy, not acceptance of the game's release criteria.

The product agent also independently reviewed the development README's feature claims and verified the five file hashes at initial import, then verified the changed `app.js` fingerprint after the documented layout repair. The product claims correctly describe a prototype, scripted consequences, explicit intent matching, session-only state, and source-visible agendas. Executed application checks are recorded separately by QA and the coordinator.
