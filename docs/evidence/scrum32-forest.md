# SCRUM-32 forest prototype — browser evidence

Date: October 10, 2026, approximately 14:00–14:17 America/Los_Angeles. Executed by the coordinator in the Codex in-app browser against `http://127.0.0.1:4174/wild/`. Browser version was not exposed by the inspected tool metadata. This supplements, rather than replaces, independent QA in `scrum32-review.md`.

## Delivered scope

Native WebGL1 procedural forest and DOM controls. Four camera stops (opening, council, trail, crossing), three character accounts, one inspectable anchor, two commitment options (one selected per run), immediate costs, field notes and a fresh replay. No npm dependency, CDN, paid API, external font, plugin or third-party model was added. The owner's supplied artwork remains in the earlier opening and is not used as a misleading substitute for 3D geometry here.

The full release narrative, hidden-role deduction, day/night systems, accumulating backlog simulation, animated performances and polished production art are not delivered by this slice. No public deployment or owner visual acceptance is claimed.

## Observed results

| Check | Actual observation |
| --- | --- |
| Renderer startup | An initial shader failure showed the readable fallback. Shared uniform/varying precision was corrected. Subsequent reloads had `canvas.dataset.ready === 'true'`, the fallback notice hidden, and visible geometry. No newer warning/error appeared after the recorded pre-fix 21:03:59Z warning. |
| Desktop opening, 1280×800 | Forest, tents, fire, figures, bridge, water and title visible. Final opening framing places the camp beside the title. No horizontal overflow. |
| Travel | Entering and selecting locations changes the 3D camera and location text. With motion paused, travel jumps directly to the selected view. |
| Accounts and keyboard | Orin's account opened; Escape closed the panel. Inspection, return and commitment worked using Enter. Mobile field-guide dismissal restored focus to `guide-open`. This is a sampled keyboard check, not a screen-reader audit. |
| Evidence gate | Repair was disabled before inspection. Inspecting the anchor created one field note, enabled repair, and described the condition without identifying a culprit. |
| Repair path | Confirmation led to a repair-in-progress outcome with the northern watch unstaffed and inspection still required. Additional lanterns and staged timber were visually confirmed at the crossing in the final renderer. |
| Hold without inspection | Confirmation produced delay/watch-preserved text and explicitly said the anchor had not been inspected. It did not assert a discovered cause. The separate barrier geometry was inspected in independent source review; final close-up visibility was not separately accepted here. |
| Replay | Return-to-beginning required confirmation, cleared evidence/decision/accounts, restored the opening and reading panel, and allowed a new inspection. |
| Reading panel | Hide/show removed/restored the context panel while leaving location navigation available. |
| Sound and motion | Buttons switched between Sound off/on and Pause motion/Motion paused, with pressed state. Sound returned off afterward. Actual acoustic quality and animation frame rate were not measured. |
| Mobile viewport, 390×844 | Opening entry and council/guide remained accessible. Council content scrolls vertically. Measured document width 375 within the 390px viewport (scrollbar present); no horizontal overflow. Guide was visible and operable. |
| Fallback | The actual early renderer failure left DOM gameplay operable; the repair sequence completed. Independent tests also cover missing/denied WebGL. |

Local JPEG captures are retained at `docs/evidence/local-scrum32/opening.jpg`, `mobile-council.jpg` and `repair-crossing.jpg`. These local captures are not the sole durable handoff: this sanitized result summary and the independently reviewed test/source evidence are committed with the implementation. Captures are not included in the source checkpoint.

## Limits and follow-up

- Procedural, low-poly art establishes spatial direction, not finished cinematic quality. Camera timing and foreground/text composition need owner feedback.
- No real phone/GPU matrix, FPS measurement, actual 200% zoom, OS reduced-motion runtime test, screen reader, audio listening test or BFCache navigation reproduction was completed. Lifecycle and reduced-motion behavior received source review only.
- The renderer caps device pixel ratio at 1.5 and pixels at 2.2 million. The scene author measured about 9.30 MB of generated geometry and four base/six outcome draw calls in a mock lifecycle check. These are author-reported resource figures, not measured network transfer or a real GPU benchmark.
- Full regression: 197 passing tests after final JavaScript freeze. Final CSS selector correction: thirteen focused checks passing. See independent review for commands, durations, failures fixed and hashes.
- Existing port 4173 process was left untouched. The owned preview server uses 4174; it is retained so the owner can inspect the work. No schedules were enabled.
