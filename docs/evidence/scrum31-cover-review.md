# SCRUM-31 independent opening review

Reviewer: UI/UX and QA specialist subagent. Implementation author: coordinator. The coordinator independently reviews the test and evidence files authored by this reviewer.

Scope: the opening gallery and its three served images, compared with the SCRUM-30 playable baseline. This is not a full gameplay redesign or a release assessment.

## Build and execution

- Local candidate: `.tmp-SCRUM-31`, reviewed October 10, 2026, approximately 13:30 America/Los_Angeles (UTC−07:00).
- Environment: Windows, Node v24.21.0; local HTTP requests to ephemeral loopback ports.
- Executed command: `npm run check` from the candidate directory.
- Result: all JavaScript syntax checks passed; **184 tests passed, 0 failed, 0 skipped**. Node test duration: 2,212.8433 ms. This includes the three new SCRUM-31 server regressions.
- `public/engine.js` and `public/scenario.js` have identical SHA-256 hashes to the SCRUM-30 baseline. No engine or scenario change was found in this increment.

The reviewed source snapshot is identified by the following SHA-256 values; the integration owner should link this evidence to the resulting commit and pull request.

| File | SHA-256 |
| --- | --- |
| `public/app.js` | `870B3F743424B943F36E137F7F8060C5B1B11F74682D46FF28F3BBE44797E0B8` |
| `public/style.css` | `CEA20FA80DF887D045C961DB68C3ED41D6CFEC8BDB55D8366E100E8CCF7A2978` |
| `public/index.html` | `3AC6F24BA69EA1BE279C0081A3CC4131AA8D3646705C8576E9195B9FCD9B2BCF` |
| `server.mjs` | `8DA2279C5D33C2D5EE37443BC324CDB85C3518EDBEAD7120762D630449DB84D4` |

## Independent source review

| Area | Observed implementation | Assessment |
| --- | --- | --- |
| State isolation | `selectCover` is restricted to briefing, updates the presentation index/DOM, and calls no engine action. | No gallery path to a recorded decision, evidence grant, conversation use, or round transition found. |
| Entry and restart | Entry invokes the existing guarded `start`; restart still uses `createGame`, `resetUI`, and `render`. Returning to briefing resets the selected theme and its markup. | Existing attempt boundaries are preserved in source. QA-AC-08/10 runtime interaction remains a browser check. |
| Keyboard controls | Native buttons expose selected states, previous/next labels, and a live description. Only the centered image card is in sequential focus order. Left/right/Home/End on image cards update selection and move focus to the newly centered card. Numbered controls remain independently operable. | No required gallery control depends on hover. Source supports QA-AC-11; this is not an executed keyboard or screen-reader pass. |
| Responsive and motion behavior | Layout has 900px and 600px breakpoints; small-screen brief/entry stack vertically. Reduced-motion CSS disables the added card and entry-icon transitions. | Source supports responsive and reduced-motion intent. Actual viewport, zoom, clipping, contrast, and motion checks belong to browser evidence. |
| Image descriptions | All three shipped WebPs were opened locally: wolf in suit/glasses, wolf among gears, and teal/gold sky over a dark reflective floor. The descriptions match their visible content. | No misleading image description found. Source-to-derivative filenames and conversion provenance must be retained in the coordinator's asset record. |
| Serving boundary | The server adds only `/cover/the-room.webp`, `/cover/the-pressure.webp`, and `/cover/the-aftermath.webp` to its existing explicit route map. Raw traversal validation and resolved-root containment remain in place. | No request-controlled filesystem route was introduced. Executed regression results are below. |

The reviewed final source includes the coordinator's in-progress correction to side-card tab stops and keyboard focus. This reviewer did not reproduce the earlier version in a browser and does not claim that correction as an executed UI retest.

## Added HTTP regression coverage

`tests/scrum31-cover-assets.test.mjs` executes real HTTP requests against `createStaticServer`; it does not assert layout strings.

| Test | Expected and observed result |
| --- | --- |
| Three named images | Each real shipped file has WebP container markers; GET returns exact file bytes with `image/webp`, correct length, and `nosniff`; HEAD is bodyless with the same length/type; a query string preserves delivery. Passed. |
| Allowlist with existing unlisted files | An injected temporary root contains an allowed image, an unlisted cover image, and an `Assets` original. The allowed route serves its fixture; the unlisted image, repository-style asset route, cover directory, alternate extension, and case variant return 404. Passed. |
| Cover traversal | Raw parent segments, encoded parent/slash segments, backslashes, nulls, and malformed encoding return 400; a double-encoded path remains unlisted and returns 404. No file bytes are returned. Passed. |

## Handoff and limits

No blocking defect was found in this source review and executed HTTP/regression scope. The opening remains eligible for integration after the coordinator's visual/keyboard/restart checks, test review, and provenance record are attached to the reviewed change.

This reviewer did not operate a browser, perform a screen-reader or physical-phone test, inspect the live reference website, exercise reduced-motion emulation, or measure visual contrast. Automated engine tests do not establish the rendered experience. No CI, deployed build, branch protection, or release pass is claimed here.
