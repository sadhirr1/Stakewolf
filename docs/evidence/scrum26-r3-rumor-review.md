# SCRUM-26 independent QA — R3 rumor provenance

**Candidate:** `C:\Users\sadhi\Project_work\Stakewolf\.tmp-pr12-review-20261006` (isolated SCRUM-25 candidate; frozen source reviewed)  
**Environment:** Node.js v24.21.0 on Windows  
**QA-owned files:** `tests/scrum26-r3-rumor.test.mjs`; this evidence summary  
**Scope:** R3 KB-09 child access, rumor choices and disclosure provenance, conversation budget, source chronology, note reread/revision, restart isolation, and preserved representative numeric vectors. Automated source checks only; no visual/browser accessibility review is claimed.

## Candidate identity

**Git base:** PR #13 base commit `52115a8761b053d8af216d3a3ab00ffd4075a8e6`. This identifies the repository ancestry only; the application source snapshot is identified by the file hashes below.

The application source hashes matched the Development-declared frozen snapshot before and after testing:

| File | SHA-256 |
| --- | --- |
| `public/scenario.js` | `8D85B391829E89275EDE105D6A3EAFB4C9FDFAB4737172B00275493B564C325A` |
| `public/engine.js` | `9CC0C9D822ECBC63280752ED0CED17131806D6045C8373A74E8ECFE13E1894EA` |
| `public/app.js` | `E0C13026A36FAA63805EB8705FFEAE9441C621F7903CE2F24155342D6CE0F8EB` |
| `tests/scrum26-r3-rumor.test.mjs` | `9E001C378452977F3315BC10D5981D719F33C580CA35755DA546BC38FA9D3B29` |

## Commands and results

- `node --test tests/scrum26-r3-rumor.test.mjs` — **10 passed, 0 failed**.
- `npm run check` — five JavaScript syntax checks passed; **143 tests passed, 0 failed**.

## Acceptance covered

- R3 entry acquires only the KB-09 index and KB-09b crop; verifies source event, audience, authored timestamp, acquisition round/sequence, and no score effects. The full planning note and Mara admission remain hidden. R1/R2 attempts to ask `full-thread` are rejected without acquiring a KB-09 record.
- KB-09a opens through Ishan's `full-thread` interview and through the accepted `open`/`broker` choices. The test preserves its Monday 08:15 authorship separately from its R3 acquisition event and confirms Leah's earlier access without granting the note to Mara or Theo before a disclosure.
- KB-09c opens only through Mara's `screenshot-source` interview. Wrong-person access fails without mutation; the R3 record preserves the two-lead admission and uncertainty about wider circulation, with Mara/player audience only.
- `open`, `broker`, and `ignore` have separate source and audience expectations. The open correction cites the decision, rumor and original note; broker shares only with player/Mara/Ishan and gives Theo the later summary; ignore creates no disclosure and keeps the delayed defect limited to Ishan/player. No path exposes Mara's admission or implies motive/wider circulation.
- R3 choice vectors remain at the authored v1 values from the independently recorded PATH-A entry of 52/74/76: open 47/87/79 without an interview bonus, open 47/91/79 with `full-thread`, broker 55/79/77, and ignore 61/60/71. The existing full suite also retains the reviewed PATH-A/B/C numeric assertions.
- Asking both R3 questions exhausts the round budget; a third question fails without mutation. Re-reading player-visible records is pure. Revising the R2 retention interpretation in R3 changes no metrics, relationships, conversation count, dossier acquisition, or another stakeholder's knowledge. A fresh run has no R3 artifacts/events or prior investigation.
- A tampered open-disclosure audience is rejected by the completed-trace/debrief validator.

## Findings and limits

No blocking defects were found in this automated scope on the frozen candidate. Test-authoring assertion adjustments were limited to matching the documented model: an ineligible open bonus is represented as a zero-applied bonus record, and the debrief cites decision/source ancestors rather than every descendant acquisition event. Those adjustments do not weaken disclosure or provenance checks. Development and Coordination remain the required independent reviewers of these QA-owned files. No browser rendering, manual keyboard traversal, deployment, or release approval is claimed.
