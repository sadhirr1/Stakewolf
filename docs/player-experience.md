# Stakewolf player experience contract

Owner: UI/UX, [SCRUM-8](https://sadhirr1.atlassian.net/browse/SCRUM-8). Authored October 1, 2026 against baseline `d3efe6d`, the [product brief](product-brief.md), current `public/index.html`, `public/app.js`, and `public/style.css`. Independently reviewed by QA, product, and development for feasibility; findings and limits appear in the review record below. Status: reviewed interaction contract. This specification does not claim its requirements have all been implemented or tested.

## Scope and evidence boundary

Keep one authored scenario, four stakeholders, five rounds, two optional conversations per round, prepared choices, and player-confirmed typed intents. The game runs locally in the browser without accounts, a paid provider, or a backend game service. Refresh/reopen starts a clean attempt. A downloaded decision record is a readable export, not a resumable save.

The [September 30 browser handoff](evidence/session-2026-09-30-0600.md) reports a completed desktop path, one typed preview/cancellation, replay, a 390 by 844 resized browser check, and clean refresh. It also records focus returning to the document after an answered conversation. It does not establish full keyboard traversal, screen-reader behavior, contrast, all narrow-screen states, or 200% zoom. Source inspection establishes that controls and CSS exist, not that those checks pass.

At the inspected baseline, the no-save notice exists only in optional Help; errors caught by the app are announced through a screen-reader-only live region; there is no explicit logical opener restoration after dialog/page redraws. These are required changes or verification gaps below. Conditional stakeholder memory, information rules, and debrief claim accuracy remain separate scenario/implementation work. This document is an interaction contract, not completion of [SCRUM-9 visual design](https://sadhirr1.atlassian.net/browse/SCRUM-9).

## Immediate implementation handoff

Two small changes can proceed before the rest of the scenario implementation:

1. Place this visible text adjacent to the intro start action, before a player starts: **“Progress is not saved. Refreshing or reopening this page starts a new attempt.”** Keep it in normal document flow, including at narrow widths and zoom. Associate the start action with the notice using `aria-describedby` where practical; do not place it only in a tooltip, dialog, or screen-reader-only element.
2. Restore dialog focus using a logical opener that can be found again after rendering. Asking a question replaces the stakeholder button in the main page; a saved reference to the removed element is insufficient. Preserve the stakeholder ID across answer redraws. Close, X, and Escape return to the current corresponding stakeholder button if usable, then fall back to the current scene heading or start action. A commit, advance, or confirmed restart must keep focus on its new screen rather than letting a delayed close event restore old focus.

The full focus matrix below governs Help, proposal, and restart dialogs as well. Root/development owns the application changes and browser evidence; this document records the intended behavior.

## Complete journey

| Stage | Player information and actions | Transition and state rule |
| --- | --- | --- |
| Intro | State the PM role, fictional launch problem, four stakeholders, five decisions, and approximate 10–15 minute duration as an estimate. Show the no-save notice beside **Enter the launch room**. **How to play** remains optional. | Starting creates the first active round and focuses its heading. Reading Help or the briefing consumes nothing. No hidden agendas appear in ordinary introductory content. |
| Round briefing | Show “Round N of 5,” the situation, attributed speaker quote, any later effect from the previous decision, and conversations remaining. Keep the four public names/roles available. | Reading or navigating panels changes no metrics, history, evidence, or conversation count. A later effect already applied by the engine must not reapply on render. |
| Conversation | Open a named stakeholder's dialog. Explain that each chosen question uses one conversation. Show available questions, previously asked labels, and the answer with its source. | Opening/closing is free. An accepted new question consumes exactly one conversation and records one evidence entry. The answered question becomes unavailable. Returning to the room must retain all committed evidence. A player may decide without using either conversation. |
| Evidence | Show source, round, title, statement, and its scenario-defined evidence status. Distinguish a reported concern from established evidence using text, not color alone. | Changing tabs or rereading evidence is free. Reuse recorded evidence; do not invent a new disclosure when the panel opens. The scenario rules determine what each stakeholder could know. |
| Prepared decision | Present the available approaches with concrete descriptions. Selecting highlights one approach and enables **Commit to this approach**; changing selection is allowed. | Selection is a preview only. Commitment applies the selected valid action once and moves to the result. Do not auto-commit on card selection. |
| Written decision | **Write your own decision** reveals a labelled textarea, length guidance, and a character count. Explain that authored intent matching suggests an approach and the player chooses the interpretation. | Typing, editing, switching tabs, or returning to prepared choices does not commit. Preserve the draft until the player commits, starts another round, or explicitly resets the attempt. |
| Interpretation review | Show the submitted wording or a clearly labelled summary of it, all candidate approaches, and any suggestion. A tie, no match, or unsupported meaning requires an explicit choice. Offer **Confirm and make the call** and **Edit my wording**. | The player can override a suggestion. No selection means no commit. Confirmation applies the chosen authored action once; the original wording is retained as the player's wording, not rewritten as something they allegedly said elsewhere. Cancel/edit consumes no round. |
| Immediate result | Show confirmed approach, the player's wording when used, actual metric changes, attributed reactions, and any evidence-related modifier. Distinguish game signals from an assessment of professional ability. | Focus the result heading. Offer one clear **Continue to round N** action, or **Open your debrief** after round five. Repeated activation cannot advance twice or submit another decision. |
| Next round | Show the next briefing and “From your last call” when a delayed consequence applies. Refresh the two-conversation allowance and current-round question availability. | The previous decision remains in the journal. Clear the previous round's draft, selection, and unconfirmed proposal. Focus the new scene heading. |
| Debrief | Show the outcome, five recorded decisions, immediate and later effects, and reflections with identifiable supporting events/rounds. Reveal private agendas here. Distinguish observation, authored interpretation, and uncertainty. | Opening a cited decision moves to that record without changing the outcome. Do not fabricate a player quotation, disclosure, or causal explanation. **Download decision record** exports the result locally. |
| Replay | Offer **Play another attempt** as an explicit new-attempt action after completion. Explain that the next attempt starts fresh; the existing download action is available before leaving. | Return to the intro, clear prior game/UI state, and focus the start action. Do not imply the prior run can be resumed or reopened. |
| In-progress restart | **Restart attempt** opens a confirmation explaining that current decisions will be cleared. Offer **Keep playing** and **Start again**. | Cancel/Escape changes nothing. Confirm clears the attempt and transient UI, closes dialogs, returns to the intro, and focuses the start action. No extra confirmation is needed for ordinary panel navigation. |

The header brand currently navigates to a fresh page. During an active attempt, intercept that in-app home action through the same restart confirmation; do not silently discard a run through the brand link. External browser refresh/close cannot guarantee recovery: the visible pre-play notice remains the contract, and this release must not promise resume or rely on an unload dialog.

For results and debrief, follow the [scenario rules' effect order and cap calculations](scenario-rules.md#state-questions-and-effect-order). Display actual changes separately from requested changes when a limit matters. Evidence may qualify for a bonus while adding zero at the cap; do not say listening improved the score in that case. A trace can instead say the evidence qualified but the metric was already at its limit. The [event and debrief contract](scenario-rules.md#event-and-debrief-evidence-contract) governs each claim's supporting record.

## Empty, error, clarification, and loading states

| State | Required message or response | Focus and data handling |
| --- | --- | --- |
| No evidence yet | “No evidence collected yet. Talk to a stakeholder to hear their perspective. Each question uses one of this round's two conversations.” | Keep the Evidence tab selected. Stakeholder controls remain available; no forced modal or invented evidence. |
| No decisions yet | “Your confirmed decisions and their consequences will appear here.” | Keep the Decision record tab selected. No empty scores or fabricated timeline entries. |
| No approach selected | Keep commit unavailable and show “Select an approach before committing.” | Available choices stay keyboard reachable; selection has a visible non-color indicator and `aria-pressed` state. |
| Conversations exhausted | “No conversations remain this round. Review your evidence or make your decision.” | Keep answered content readable, disable unavailable questions, and leave the close action usable. Opening a stakeholder to inspect the dialog does not spend a conversation. Do not silently advance the game. |
| Draft empty or too short | “Write at least 20 characters, or use a prepared approach.” | Show the message next to the textarea, associate it with the field, and focus the invalid field. Preserve the draft; consume nothing. |
| Draft too long | “Keep your decision within 1,200 characters.” | Retain or allow correction of the text without committing. Enforce the limit consistently for typed and pasted input. The current engine counts UTF-16 code units; keep UI validation consistent and revisit user-facing character semantics if input cases expose confusion. |
| No clear interpretation | “There isn't one clear match. Choose the approach that best captures your intention, or edit your wording.” | Show no preselected choice when the interpreter returns no suggestion. Keep the original draft. Require an explicit choice before commitment. |
| Suggested meaning is wrong | “Change the selected approach if it doesn't fit.” | The player can choose any valid approach or return to editing. A keyword match is not proof of semantic understanding; negation and irrelevant input remain SCRUM-14 test cases. |
| Rejected or duplicate action | Explain the specific recoverable condition, such as an already-asked question or a decision already recorded. | Preserve the last valid state. Show visible feedback near the relevant control plus an appropriate live announcement; do not depend solely on hidden speech output or leave focus on a disabled/removed element. |
| Unexpected action failure | “That action could not be completed. Your last confirmed state has been kept. Try again or choose another approach.” Use this wording only when the implementation actually preserves that state. | Update state only after validation succeeds. Keep the relevant controls usable. If consistency cannot be guaranteed, explicitly offer a fresh start with the no-save consequence; do not claim the attempt was recovered. |
| Initial asset loading/failure | A lightweight “Loading Stakewolf…” may occupy the app area while local modules load. If they fail, show “The game could not load. Reload to start a new attempt.” Provide a visible fallback when JavaScript is unavailable. | Start must not be usable until state exists. No fake AI-thinking animation, progress percentage, or claim of a remote service. A loading state must resolve to the intro or an error rather than a permanently empty page. |
| Local interpretation/commit | These are synchronous local actions. Use the actual transition, not an artificial wait. If future work becomes asynchronous, expose a busy state and keep the submitted round/action identity. | A processing control cannot submit again. Stale completion from an earlier attempt must be discarded. Do not introduce a backend or persistence dependency solely for a loading state. |
| Download blocked or fails | Keep the debrief on screen and say “The download could not be started. Your decision record is still shown below.” Offer retry when possible. | Do not claim a download completed merely because the browser was asked to start one. Starting a download must not reset the game or move focus out of the page. |
| Refresh/reopen | Show a clean intro with the same visible no-save notice. | No prior decisions, draft, selected approach, pending effects, or dialog state may appear. There is no saved-game recovery flow in this release. |

Required corrective work above is assigned to SCRUM-12 for the general player loop and SCRUM-14 for typed-input states. Exact copy can be refined without changing the behavior or concealing its consequences.

## Keyboard, dialogs, and announcements

All primary actions must work with Tab/Shift+Tab and their native Enter/Space activation. The skip link moves focus to the main content; use a programmatically focusable main region or heading. DOM order follows reading order. Never remove focus styling without a visible replacement.

The workspace uses a single tab stop for the selected tab. Left/Right cycle tabs; Home/End choose the first/last. Focus remains on the newly selected tab; Tab enters the selected panel. Tab changes do not commit a draft or reset a round. Radio controls in the interpretation dialog retain native keyboard behavior. A selected suggestion is not a confirmed action.

Use native modal dialog behavior: an accessible title, focus inside the dialog while open, working Tab/Shift+Tab containment, and equivalent X/Close/Escape cancellation. Keep every close control operable when questions are exhausted. Do not layer a second modal over an existing one for ordinary actions.

| Dialog/action | On open or redraw | On close or transition |
| --- | --- | --- |
| Help | Focus the visible close control or start of the guide; its title supplies context. | X, Understood, and Escape return to **How to play**. |
| Conversation opened from a stakeholder | Retain that stakeholder's stable ID as the logical opener. Initial focus enters the dialog on its close control or titled content. | Close/Back to the room/Escape finds the current corresponding stakeholder button and focuses it if connected and enabled. |
| Answered conversation | The question just used may be replaced and disabled. Keep focus inside the dialog on the new close control, with the visible answer and an “Evidence added; N conversations remaining” announcement. Do not restore focus to the consumed question. | Preserve the original stakeholder opener across this redraw; resolve its current element when closing. Asking the second question does not change the return target merely because the conversation budget is now zero. |
| Interpretation review | With a suggestion, focus the checked radio; without one, focus the first radio without selecting it. Keep all descriptions available and avoid committing on focus. | **Edit my wording** returns to the textarea with its draft intact. X/Escape returns to the review-submit control in the current form, or the textarea if the trigger no longer exists. Cancelling never changes committed state. |
| Restart confirmation | Focus **Keep playing**, the non-destructive choice. | Cancel/X/Escape returns to the specific restart trigger that opened it. Confirm skips opener restoration and focuses the new intro start action. |
| Confirm decision / advance | Close any obsolete dialog as part of the state transition. | Focus the new result, scene, or debrief heading. A later `close` event must not pull focus back to the former screen. |
| Opener removed, disabled, or hidden | Do not focus a disconnected, disabled, hidden, or background element. Another active modal takes precedence. | First try the current logical equivalent; otherwise focus the current `#scene-title`, then `#start-game`, then the focusable main region. Never intentionally fall back to the document body. |

Implementation can store a small return-focus descriptor per dialog: stable control ID or stakeholder/action identity, close reason, and current phase. Resolve it after rendering. A live element reference is useful only while still connected and usable. Programmatic close events can arrive after a render; phase transitions must override older return-focus requests. The two restart buttons need distinct return targets or a recorded position so cancellation remains predictable.

Use a polite live region for concise state changes, including evidence added, decision recorded, new round, and replay. Errors also need visible text and field associations. Do not announce whole pages or every character typed. The keyboard focus target and announcement should complement each other without reading the same long content twice.

## Responsive and visual interaction requirements

Verify desktop at 1280 by 720 and a narrow viewport of 390 by 844 CSS pixels. Also test actual browser zoom at 200% on the desktop setup, recording the resulting viewport dimensions. A resized viewport is not a physical-phone test or a substitute for actual zoom.

- Intro, briefing, conversation/answer, evidence, prepared choices, written draft, interpretation, result, restart, Help, and debrief must remain readable and operable without required horizontal scrolling or overlapping controls.
- Stack decision cards, result actions, and debrief sections when space is insufficient. Long names, evidence text, and a long unbroken typed string must wrap within their containers. The repaired round-header structure must keep the scene outside the horizontal header row.
- Dialogs fit within the viewport and scroll vertically. Their titles and close/actions remain reachable, including with enlarged text and a mobile keyboard. Do not require a fixed-height whole screen to expose the commit action.
- Provide visible focus and a discernible hit area; use a 44 by 44 CSS-pixel design target for compact icon controls where the layout permits. Visual design must inspect spacing, contrast, and component states; this contract does not certify the inherited palette.
- Selection has a visible “Selected” label or equivalent check symbol plus programmatic state. Current round has text/position as well as color. Metric changes retain signed values and names. Evidence reliability is labelled in words. Disabled questions say “Asked” or the exhausted-conversation reason; color alone never communicates an essential state.
- Preserve reduced-motion behavior. No required meaning depends on animation, hover, or sound. Optional polish cannot displace acceptance work before October 13.

## Reproducible verification handoff

Run these checks on an identified build after implementation. Record browser/version, operating system, viewport, actual zoom setting, tester, steps, observed result, and screenshots or focus observations where useful. Use **Passed / Failed / Blocked / Not run** per check. The tests below are instructions, not executed passes. Retain evidence according to the [team workflow](agent-team.md#quality-gates).

| ID | Reproducible steps and required observation | Quality mapping |
| --- | --- | --- |
| UX-V01: onboarding/session policy | Load a fresh page at desktop and 390 by 844. Read the notice without opening Help, activate Start by keyboard, make a decision, then refresh/reopen. Verify clean intro and no old draft/history. | AC-01/10; QA-AC-08/10/11/12 |
| UX-V02: conversation return focus | Start, keyboard-open Ishan, ask a question, close with Back to the room; verify focus on the newly rendered Ishan button. Repeat through X and Escape. Ask the second available question, then close and verify the same valid return target. Also close without asking. | AC-07; QA-AC-11; conversation limit/duplicate checks |
| UX-V03: other dialog exits | Open Help and use each close path; verify return to How to play. Open restart from each trigger; cancel/Escape preserves state and returns to that trigger. Confirm restart focuses Start and clears state. | AC-07/10; QA-AC-08/11 |
| UX-V04: typed preview and cancellation | Enter “I propose a small pilot with limited access and a clear stop condition.” Review the suggestion, change the radio choice, and choose Edit. Verify text and committed state unchanged, focus on textarea. Repeat X/Escape, then confirm an explicit choice. Verify one result and focus on its heading. | AC-05/07; QA-AC-03/04/09/11 |
| UX-V05: clarification and validation | Try empty text, a short sentence, 1,200-character input, an over-limit paste, irrelevant text, ambiguous text, and a negated intended action. Verify visible errors/clarification, accessible association, retained draft, and no accidental round consumption. Record the actual interpretation; do not infer semantic correctness from a suggestion. | AC-05; QA-AC-03/04 |
| UX-V06: complete keyboard path | From intro, use only keyboard to visit all stakeholders, switch all workspace tabs using arrows/Home/End, select prepared choices, use a typed review, continue all five rounds, inspect debrief, download, and replay. Record actual focus at transitions and after every dialog exit. | AC-01/05/07; QA-AC-01/03/07/08/11 |
| UX-V07: viewport and zoom | At desktop, 390 by 844, and actual 200% desktop zoom, inspect every state listed above. Use long input and an exhausted conversation. Check for horizontal overflow, clipped controls, readable text, and visible focus while scrolling. Record dimensions; do not label browser resizing as phone-device validation. | AC-07; QA-AC-12 |
| UX-V08: no mutation during inspection | Record round/history/metrics before switching tabs, opening/closing Help, cancelling a proposal, or cancelling restart. Repeat actions and verify no committed change. Rapidly activate commit/continue and verify one valid transition. | AC-03/05/10; QA-AC-02/03/08/09 |
| UX-V09: evidence and debrief language | Follow a reviewed scenario fixture. Compare each displayed claim, prior-action callback, and reflection with its event/source reference. Check reliability labels and normal-play agenda concealment. Open a decision citation without changing game state. | AC-02/04/06; QA-AC-05/07/14 |
| UX-V10: failure/loading affordances | In a controlled local test, prevent initial script loading and exercise recoverable invalid actions. Verify visible fallback/feedback and no false claim of state preservation or download success. Restore the normal environment afterwards. | AC-01/05/07; QA-AC-04/11 |

Browser regression should specifically inspect focus after the opener is re-rendered and after transition-driven dialog closes. A source-string assertion or passing engine test cannot establish these browser behaviors. Screen-reader and physical-phone checks, if executed, need their own environment record; otherwise label them not run.

## Owned follow-up and completion boundary

| Work | Owner / tracker | Completion evidence |
| --- | --- | --- |
| This journey/state/focus contract | UI/UX, SCRUM-8 | Product, QA, and development review findings resolved; implementation handoff is actionable. |
| Visible notice, dialog focus, main-loop states | Development, SCRUM-12 with SCRUM-8 review | Implemented screens and focused browser retests, including the opener replacement case. |
| Typed-input clarification and representative language | Development, SCRUM-14 with UI/UX review | Input fixtures, actual interpretation results, and preview/cancel/confirm evidence. |
| Memory, disclosure, and rumor presentation | Game design/development, SCRUM-7/13 | Reviewed information rules and event-grounded dialogue; UI shows permitted knowledge only. |
| Debrief citations and accurate reflections | Development/product, SCRUM-15 | Every claim supported by the recorded path; false attribution resolved. |
| Visual system, contrast, responsive component polish | Visual designer, SCRUM-9 | Separate reviewed visual specification and implemented-state inspection. |
| Full browser/accessibility regression | QA with UI/UX review, SCRUM-16 | Executed checks against the release candidate with durable evidence and defect retests. |

This contract can be complete as a design deliverable while implementation remains open in the named tickets. The October 13 target does not waive the [quality plan's release gates](quality-plan.md#defect-severity-and-release-rules). No tests, release approval, or dedicated visual-system completion are asserted by this document.

## Review record

| Review on October 1 | Evidence and outcome |
| --- | --- |
| Independent QA contract review | QA inspected the journey, state/error coverage, logical focus behavior, and quality-check mapping. No blocking specification finding. It explicitly retained the unimplemented proposal/result wording, initial-focus matrix, in-app home confirmation, visible errors, and full browser checks as follow-up work. |
| Development feasibility review | The coordinator/development reviewer found the contract actionable within the existing SCRUM-12/14/15 scope. No additional service, account, persistence system, or consequential owner decision is required for this design. |
| Product contract review | Product inspected the local-only scope, full journey, typed-intent limits, session policy, and interpretation/evidence boundaries. No blocking finding. Its requested refinement now links the scenario cap calculations and distinguishes a qualified bonus from a positive marginal improvement. |
| Independent review of the immediate application patch | This document's author reviewed the coordinator's notice/return-focus implementation. A queued close-event race could delete a newly reopened dialog's return target. The coordinator moved the open-dialog guard before the lookup/deletion and guarded focus when another modal is open; source reinspection confirmed the finding resolved. Browser execution and its evidence are owned by the coordinator, not implied by this source review. |
