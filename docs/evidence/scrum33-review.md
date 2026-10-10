# SCRUM-33 independent QA review — first light in The Hollow

This review covers the bounded `/wild/` increment: approachable characters and anchor markers, readable encounter panels, one explicit night-to-dawn transition, commitment-time evidence, distinct repair/hold reports, and fresh replay. It does not establish the five-round release scope or authorize a release.

## Ownership and environment

- Tracker: [SCRUM-33](https://sadhirr1.atlassian.net/browse/SCRUM-33).
- Independent reviewer/test author: QA agent `hollow_qa`. State author: `hollow_rules`. Scene author: `hollow_scene`. App, markup and styling author: coordinator.
- QA owns `tests/scrum33-wild.test.mjs`, this record, and the specifically authorized initial-state expectation update in `tests/scrum32-wild.test.mjs`. The coordinator independently reviewed these tests and reported no blocker: scenario coverage is meaningful and the fallback limitation is explicit.
- Windows, PowerShell, Node.js v24.21.0. Execution date: October 10, 2026, America/Los_Angeles (UTC−07:00). Test durations are actual runner output, not work hours.
- Base checkout: `a5eda951d9469bed8c89cf93304478555f9d9be6`. Implementation was uncommitted during review; final source hashes and the integration commit/PR identify the delivered candidate. Unrelated working-tree changes were preserved.

## Checks executed

| Check | Actual result | Coverage and limit |
| --- | --- | --- |
| State and report scenarios | `node --test --test-name-pattern='SCRUM-33 (state\|report)' tests/scrum33-wild.test.mjs`: **10 passed, 0 failed, 0 skipped**, 128.6239 ms | Explicit advance gate; commitment evidence snapshots; truthful late observation; once-only dawn; replay; report content and retained uncertainty; ordinary invalid inputs; independent report arrays |
| Unavailable rendering | `node --test --test-name-pattern='SCRUM-33 fallback' tests/scrum33-wild.test.mjs`: **1 passed, 0 failed, 0 skipped**, 82.9216 ms | Missing and denied WebGL each notify failure once, never claim ready, and retain callable focus/dawn/travel/pause/replay/dispose controllers |
| Final syntax | Separate `node --check` commands for `public/wild/app.js`, `state.js` and `scene.js`: **all exited 0** | Executed after global source freeze on October 10, approximately 14:31 PDT; syntax only |
| Final full regression | `npm run check`: **208 passed, 0 failed, 0 skipped**, 2084.6404 ms; **exit 0** | Executed once after global source freeze, including all eleven new SCRUM-33 tests and the existing state/HTTP/simulation regressions |
| Browser interaction and rendering | Coordinator-owned; not executed by this QA agent | Coordinator reported both repair/hold dawn paths, replay clearing daylight/notes/phase, anchor-marker Enter activation, paused Sera and normal-motion Vela selecting the correct person, and a 390×844 mobile Orin encounter. Detailed browser scope belongs to the separate coordinator record. |

The state scenarios operate through the public action API and freeze prior state snapshots. They cover both hold paths (with and without observation), the repair path, a late night observation after an uninformed hold, travel before advance, and replay into a separate uninformed hold. A repair report must retain the limits of Sera's inspection, the crew's fatigue, and the unknown northern-watch events. A hold report must retain staffed watch posts, a delayed promise, and the absence of an invented repair or dawn inspection. An unobserved anchor must remain unverified.

The commitment's immediate outcome uses the observation available at commitment time. A dawn report may acknowledge an actual observation collected later in the night; that does not retroactively change the basis of the earlier decision. The test fixture explicitly distinguishes these two records.

The new fallback check is a controller contract test. It does not compile shaders, render pixels, create a real GPU context, or establish browser performance. Existing SCRUM-32 state and HTTP checks remain part of regression; only their exact initial-state expectation changes to include `decisionEvidence: null` and `dawn: false`.

These are bounded checks relevant to QA-AC-02/06/07/08/09/10. Actual keyboard and responsive evidence relevant to QA-AC-11/12 belongs to the coordinator's browser record. Full release acceptance still requires the quality plan's remaining scope and severity gates.

## Source review

Independent QA inspected state gates and report claims; app marker relevance and panel alternatives; modal open/close focus handling; late scene initialization with current decision, dawn and encounter; replay clearing the scene outcome/daylight; renderer fallback; projection in CSS coordinates; invalid scene IDs; pause/reduced-motion/visibility guards; and the new shader uniforms' stages and shared precision. Follow-up review inspected settled-camera target visibility, entry/departure orbits, low-frame-rate camera timing, reading-panel scroll reset, and the final mobile encounter height. The resolved findings and evidence limits follow.

| Review item | Finding or limit | Resolution |
| --- | --- | --- |
| Progress completion accessibility | Initial `night-progress` completion was expressed through CSS color alone. | Coordinator added visible checkmarks and explicit complete/not-completed accessible labels. Independent QA inspected the corrected source. |
| End-of-scene clarity | Hold report describes inspection still needed, while new night observations are correctly closed at dawn. The bounded endpoint should be explicit. | Coordinator added an explicit first-night ending and placed remaining threads in the next chapter. Independent QA inspected the corrected source. |
| Moving marker activates wrong person | Coordinator browser inspection reported that a semantic click on visible Orin during camera travel opened Vela. QA proposed acceptance-blocking S2 because the new world control selected the wrong account. | Scene author hides projected markers until camera eye and target settle, then snaps both exactly before projection; pausing snaps immediately. Coordinator adds marker-to-marker collision exclusion. Independent QA inspected both fixes. Coordinator retest reported correct paused Sera selection and normal-motion Vela selection after the marker became visible. The confirmed wrong-target finding is resolved for the reviewed increment. |
| Camera crosses a character on return | After an entry-orbit correction, QA source/math review found that clearing focus still returned linearly to council. For Vela, that segment passed within 0.18911 world units of her axis. This calculation establishes a risky path, not a rendered observation. | Scene author retains a separate departing orbit subject until the destination settles, so closing and travel use the safe arc too. Independent QA inspected the correction. Coordinator verified an unobstructed settled Vela close-up and return to council; neither reviewer claims frame-by-frame visual inspection of the full path. |
| Camera delay on slow frames | Coordinator browser inspection reported more than ten seconds before normal-motion markers appeared. The camera shared the atmosphere's 0.05-second frame cap. | Scene author uses nonnegative elapsed camera time with a separate one-second cap, retaining the smaller atmosphere cap and hidden/pause time reset. Independent QA inspected the separation. Coordinator retest found returning markers inside a ten-second wait, with the combined click/wait call approximately 3.7 seconds. This is an interaction retest, not a device performance benchmark. |
| Marker layout and encounter framing | Source collision culling and CSS do not establish final marker placement or unobscured close-up framing. | Coordinator reported the final mobile Orin face visible above an independently scrollable dialog at 390×844, document width 375≤390, and the settled Vela desktop close-up unobstructed. These are attributed browser observations; independent QA did not render the scene. |

## Final source identity

SHA-256 hashes captured October 10, 2026 at **14:31:55 PDT**, immediately after the final syntax and regression checks. No runtime or test changes followed those checks in this QA handoff.

| File | SHA-256 |
| --- | --- |
| `public/wild/index.html` | `CD1DB09A72E706C7FF74C24D1224EF3C3487BB5BEB6D21310008EB0C243FCDF5` |
| `public/wild/style.css` | `280B94A58CBCD06AFEBEBDD7C8F252A95420422AE319B2CCC1C9FA4120699DC9` |
| `public/wild/app.js` | `195703322C7CA6835629B8AD0B4B55C3BFD05922EE6F24075C0B9B1DE0FCC4D1` |
| `public/wild/state.js` | `C069A8A210FD501772E607EE87B08EF801BDC23CC0F0230CCB80AD65FCE2D5CE` |
| `public/wild/scene.js` | `AE0FD027503782104FE9EA091D1409D339C96FDB3E5D1A9F8CB7F1F6E0F37DDD` |
| `tests/scrum32-wild.test.mjs` | `7D21A665B3750AEBF56F9A776E5238D3D0E0B357E2311F046B25939A586387E0` |
| `tests/scrum33-wild.test.mjs` | `5963BFFFC7BCE436D2FFD642F3228580B4F510C4D3AAC78E9B545DAA9C13DBF5` |
| `server.mjs` | `5AD493760D7DC26E86E80DFCCB5D4A3EAC2CBFD375DC519DAC0CB509E8B5EA37` |

## Handoff

Independent source/state/fallback review is accepted for this bounded increment with no remaining confirmed source or automated-test finding. The coordinator independently approved the test design, and final regression passes. The coordinator owns the detailed browser record and GitHub/Jira integration; no CI execution, deployment, merge, fresh-checkout verification or full release acceptance is claimed here.

The automated evidence does not establish actual GPU performance, continuous camera-path appearance, physical phone behavior, assistive-technology coverage, or complete zoom/browser coverage. The Hollow remains one short authored night with visible unresolved obligations, not the complete five-round release case.
