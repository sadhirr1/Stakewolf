# Stakewolf visual system

Owner: Visual Design, [SCRUM-9](https://sadhirr1.atlassian.net/browse/SCRUM-9). Version: `dossier-v1`, October 1, 2026. Implementation owner: Development; independent specification reviewer: QA acting as UI/UX, with coordinator product review. Visual Design reviews the rendered implementation separately from its own specification.

This specification uses reviewed main `30a612a` on `feature/SCRUM-9-visual-system`. The separate memory/event increment in PR #5 is not included in this branch. Do not imply its callbacks exist here. The [player experience contract](player-experience.md), [product requirements](product-brief.md) and [quality gates](quality-plan.md) govern behavior and release acceptance.

Status: independently reviewed visual specification, with implemented token/state correspondence and focused rendered examples reviewed below. Source-level calculations and those examples do not establish complete interface accessibility. The [independent QA record](evidence/session-2026-10-01-0700-qa.md) identifies the measured checks and source hashes; the [coordinator's session evidence](evidence/session-2026-10-01-0700.md) records browser execution and remaining gates. Full release checks remain open.

## Direction and hierarchy

Retain the dark dossier: near-black green canvas, quiet panel layers, Georgia headlines, compact sans-serif controls, lime action emphasis and initials-based stakeholder identities. The player should first see the current situation, then people and evidence, then the decision and its consequences. Decoration must not compete with those tasks.

Keep generous reading space around the scene and authored quotation. Borders group information; they are not a substitute for headings or control labels. Use the lime accent for action, selection and current position. Character colors identify people, not morality, evidence reliability or a hidden agenda. Signed numbers and names explain positive/negative effects without relying on green/orange alone.

No new illustration, portrait, texture, animation sequence, icon library or external font is required. This scope makes existing screens consistent and improves state clarity.

## Color tokens

Keep tokens in the single `:root` section of `public/style.css`. Components consume semantic tokens instead of repeating color literals. Existing short names remain stable because authored character data refers to them.

| Token | Value | Use |
| --- | --- | --- |
| `--bg` | `#101513` | Page canvas |
| `--panel` | `#171e1a` | Dossier, choice and evidence panels |
| `--raised` | `#202923` | Elevated control/surface treatment |
| `--dialog` | `#1a231c` | Modal surface |
| `--field` | `#111813` | Text entry surface |
| `--surface-hover` | `#20291f` | Enabled control hover |
| `--surface-selected` | `#242e1d` | Selected choice/radio label |
| `--text` | `#f0f2e9` | Primary text |
| `--body-text` | `#c6cec3` | Reading copy on dark surfaces |
| `--muted` | `#a7b2a8` | Supporting copy, labels and metadata |
| `--line` | `#344038` | Decorative separators; not the only interactive boundary |
| `--control-border` | `#718276` | Choice, question, field and secondary-control outlines |
| `--lime` | `#d5f478` | Primary action, focus, selected/current state, Theo |
| `--blue` | `#9ac9e6` | Ishan and supporting evidence treatment |
| `--orange` | `#f0b17c` | Mara and signed negative-effect emphasis |
| `--pink` | `#d9b0da` | Leah |
| `--primary-ink` | `#18201a` | Text on the lime-filled primary action |
| `--disabled-bg` | `#1b221e` | Unavailable controls |
| `--disabled-text` | `var(--muted)` | Readable unavailable-control text |
| `--disabled-border` | `#627066` | Dashed unavailable-control outline |

Keep meaningful text at least 4.5:1 against its actual surface as a project design target. Target at least 3:1 for the interactive boundaries and focus treatment needed to identify a control. Decorative separators can be quieter. Disabled controls are deliberately readable at full opacity: this is a project usability requirement, not a claim that inactive controls violate an accessibility standard merely because their contrast is lower.

These ratios were calculated independently in Node from the hexadecimal colors using sRGB linearization and relative luminance, `(Llighter + .05) / (Ldarker + .05)`, rounded to two decimals. They are solid-color calculations; opacity, overlays, antialiasing and actual rendered focus geometry need their own inspection.

| Pair | Calculated ratio |
| --- | --- |
| Primary text / panel | 15.02:1 |
| Muted text / raised | 6.83:1 |
| Muted text / selected surface | 6.46:1 |
| Body text / dialog | 10.01:1 |
| Primary ink / lime action | 13.52:1 |
| Lime / panel | 13.78:1 |
| Blue / panel | 9.60:1 |
| Orange / panel | 9.12:1 |
| Pink / panel | 9.03:1 |
| Control border / raised | 3.68:1 |
| Control border / selected surface | 3.48:1 |
| Control border / dialog | 3.96:1 |
| Disabled text / disabled surface | 7.40:1 |
| Disabled border / disabled surface | 3.11:1 |

The inherited palette's body colors are suitable to preserve. Repair the low-contrast interactive use of `--line` and the blanket `opacity:.45` on disabled buttons; do not darken all supporting text to make a disabled state look inactive.

## Typography, space and shape

Use `--sans: 'Segoe UI', Arial, sans-serif` and `--serif: Georgia, 'Times New Roman', serif`. They use fonts already available on the device with explicit fallbacks. The design must tolerate fallback widths without clipping. Do not download or bundle a font for this increment.

| Role | Specification |
| --- | --- |
| Base | 16px (`1rem`) sans serif |
| Reading copy | 15–17px (`.9375rem`–`1.0625rem`), line height 1.6–1.7 |
| Control labels / card titles | 15–16px, weight 600, line height at least 1.35; allow wrapping |
| Compact stakeholder identity | Names may use 14px at narrow widths, with roles at the 12px minimum; identity remains paired with its initials tile and explicit conversation affordance |
| Supporting copy | 13px (`.8125rem`), line height 1.6 |
| Eyebrow / compact metadata | At least 12px (`.75rem`), line height 1.5–1.6; uppercase tracking only on short labels |
| Intro headline | Georgia, existing fluid 3.1–5.8rem desktop range; smaller responsive scale may wrap naturally |
| Scene / result headline | Georgia, 2.2–3.75rem fluid range, line height about 1.1 |
| Debrief headline | Georgia, 2.8–4.5rem fluid range, line height about 1.1 |
| Section / conversation heading | Georgia, approximately 1.8–2.5rem according to hierarchy |
| Scenario quotation | Georgia, 1.25–1.3rem, line height 1.45–1.55 |
| Numbers / case identifiers | System monospace; always pair a metric number with its name |

Raise the inherited 11px stamp and narrow-screen chapter label to the 12px compact-label floor. This is a consistent design minimum, not a general certification of legibility. Keep the existing page heading order and accessible names.

Use a shared spacing scale of **4, 8, 12, 16, 20, 24, 32, 40, 48 and 56px**, exposed as `--space-*` tokens where repeated. The scale is a default for component gaps/padding, not a reason to change a working 1px border or a measured layout width. Typical cards use 16–24px padding; major sections use 24–40px separation. Use 3px control/card corners and 6px dialog corners. A shadow is reserved for dialogs; primary content should remain flat and readable.

Preserve maximum content widths of approximately 1450px for the intro, 1600px for gameplay, 1160px for the debrief and 650px for dialogs. Reading paragraphs should not stretch across the full desktop canvas. Use `minmax(0, 1fr)` and `min-width:0` where nested grid/flex content must wrap.

## Stakeholder treatment and asset provenance

| Character | Initials | Role | Accent |
| --- | --- | --- | --- |
| Mara Voss | MV | Growth lead | Orange |
| Ishan Chen | IC | Engineering lead | Blue |
| Leah Okafor | LO | Trust & legal | Pink |
| Theo Bell | TB | Customer advocate | Lime |

Retain a bordered initials tile beside the full name and role. Typical room tiles are 38–42px; conversation tiles may be 48×56px; compact reaction tiles may be smaller. The surrounding button, rather than the avatar alone, supplies the interactive target. Initials may be `aria-hidden` when the adjacent name already supplies identity. At narrow widths, wrap the name/role before shrinking required text. Role and name stay readable when the control is disabled after a decision.

The brand mark, borders, metric bars, initials, checkmark and close glyph are code-native text/CSS treatments inherited from or extended within this repository. No generated images, stock assets, third-party icon package or remote font is introduced. The implementation uses installed system-font fallbacks; it does not redistribute font files. A checkmark must accompany a word when it conveys a new state. Do not use portraits, voice, or animation to imply an NPC knows more than the scenario permits.

## Component and state rules

| Component | Required visual treatment and state cues |
| --- | --- |
| Primary action | Lime fill with dark ink; at least 48px high; clear action label. Hover changes only an enabled action. Keyboard focus remains a separate outline. |
| Secondary / text / close action | Strong boundary where a box identifies the control; underlined/emphasized text treatment where appropriate. Every actionable button has a design target of at least 44×44 CSS pixels; text can wrap, so use minimum dimensions rather than fixed height. Close remains labelled for assistive technology. |
| Prepared choice | Panel surface, strong border, letter, title and description. Selected state adds lime boundary, selected surface, **✓ Selected** text and `aria-pressed=true`. Reserve the status row to avoid layout movement when selecting. An unselected card never visibly says Selected. Focus must remain distinguishable from selection. |
| Typed interpretation option | Preserve the native radio and its checked state; make the whole labelled row a generous target. A checked row receives the selected surface/border; the native checked control supplies an additional shape cue. It is a suggestion/selection, not a committed decision. |
| Disabled control | Native disabled behavior, full-opacity disabled text/surface, and a distinct dashed border where applicable. Do not apply enabled hover styling. Preserve **Asked** on consumed questions and the visible exhausted-conversation reason. When commit is unavailable, explain **Select an approach before committing** adjacent to it. Keep dialog Close/Back enabled. |
| Workspace tab | Selected tab uses its labelled position, lime underline and `aria-selected`; focused tab has the independent focus ring. Labels wrap rather than overflow. Visual styling does not replace the interaction contract's arrow-key behavior. |
| Text field | Field surface, strong border, visible label and readable supporting text. Focus outline is not cropped by the form. Preserve the draft; validation must include visible words and field association when that UX work is implemented. Placeholder text never replaces the label. |
| Evidence / journal | Panel or ruled record treatment with heading, source and reliability words. Player-written quotations wrap and remain labelled separately from scenario-authored speech. Empty states use explanatory text, not only a decorative icon. |
| Consequence / result | Keep the action summary, signed metric changes, and each person's named reaction distinct. Color reinforces signs and names. Do not add celebratory colors that imply one universally correct strategy. |
| Metrics / round progress | Preserve values, names and textual current-round context. Bars and chapter marks are supporting visualizations, not the only information. Decorative lines may use the quieter separator token. |
| Dialog | Dialog surface and visible boundary, clear title, reachable Close/Back, vertical scrolling within the viewport. Use a 3px lime focus outline with a visible gap from the control; leave room for the outline at edges. |
| Error / warning | Orange emphasis plus concise visible explanatory words. Do not rely on orange or a screen-reader-only announcement as the entire error treatment. The broader error/clarification behavior remains SCRUM-12/14 work. |

The specification's disabled treatment does not authorize disabling readable evidence, closing a dialog, or revisiting a conversation for inspection. Keep business rules and keyboard behavior from the player experience contract.

## Responsive and motion behavior

Keep the existing responsive structure: reduced desktop spacing around 1100px; a stacked game/intro/debrief layout around 800px; two-column stakeholder buttons and further wrapping around 440px. Prepared choices and reactions become one column before their text becomes cramped. Action rows wrap, and the primary intro action can fill the narrow width. Do not remove essential information to make a screenshot fit.

Verify at **1280×720**, **390×844** and a **320px-wide stress viewport**, then at actual **200% desktop browser zoom**. A resized browser is not a physical-phone test or a substitute for zoom. Dialog width remains at most `calc(100% - 32px)` and height at most roughly 85vh, with vertical scrolling. Avoid fixed content heights and horizontal clipping. Long unbroken player text, control labels and names must remain contained. If metric columns or the chapter/tab rows cannot fit, wrap or stack them; do not reduce required text below the minimum merely to preserve columns.

Preserve `prefers-reduced-motion: reduce`: disable nonessential transitions/animation and smooth scrolling. Outside that preference, short color/border transitions of about 150ms are sufficient. No information, focus movement, decision result or affordance depends on animation. Do not add artificial loading time.

## Examples and verification record

The implemented review should capture these examples, not a separate mockup that can drift from the game:

1. Fresh intro: serif headline, assignment dossier, character identities and visible no-save notice.
2. Prepared decision: an unselected card beside **✓ Selected**, visible keyboard focus, and the unavailable commit explanation before selection.
3. Conversation after both questions: readable **Asked**/unavailable controls while Close/Back remains usable.
4. Typed review: checked radio, wrapped description and distinct confirm/edit controls.
5. Result/debrief: signed effects, named reactions, readable long record and narrow stacked layout.

| Check | Status / evidence |
| --- | --- |
| Independent solid-color calculations | Executed by Visual Design against the literal palette above; listed ratios only. |
| Developer coordination | Development accepted the palette/control-border recommendations, full-opacity disabled treatment, 44px control targets and reserved **✓ Selected** status text. Implementation remains independently reviewable. |
| Independent UI/UX specification review | QA reviewed scope, states, type, responsive rules and provenance, and independently recomputed all 14 listed color pairs. No blocking specification finding. The coordinator independently found no blocking product/scope issue. These are specification reviews, not rendered acceptance. |
| Implemented token/component correspondence | Visual Design independently inspected the developer's CSS/application changes: exact semantic palette, primary-ink token, spacing/radii, 12px stamp/chapter labels, full-opacity disabled treatment, minimum control sizes, stronger boxed controls, selected-state text and conditional commit hint match this specification. Selected hover preserves its state. This source review does not establish rendered behavior. |
| Rendered intro and choices | Visual Design inspected the coordinator's retained [intro](evidence/images/session-2026-10-01-0700-intro.jpg), [desktop selection](evidence/images/session-2026-10-01-0700-desktop.jpg) and [narrow selection](evidence/images/session-2026-10-01-0700-narrow.jpg) screenshots. The dossier hierarchy, visible session notice, readable choices, distinct Selected text/focus ring, and narrow stacked cards are consistent in those captured states. No blocking visual finding. A screenshot does not prove keyboard movement or all page states. |
| Rendered exhausted questions and typed review | Visual Design inspected the retained 320px-wide [conversation](evidence/images/session-2026-10-01-0700-conversation.jpg) and [proposal](evidence/images/session-2026-10-01-0700-proposal.jpg) captures. The exhausted questions have readable Asked labels and dashed boundaries; focused Back remains clear. The proposal shows a checked native radio, selected/focused row and wrapped description. No blocking visual finding in these partial/scrolled states. |
| Final stakeholder borders and debrief | Visual Design also inspected the final [320px stakeholder cards](evidence/images/session-2026-10-01-0700-stakeholders.jpg) and [debrief](evidence/images/session-2026-10-01-0700-debrief.jpg). The corrected boxed boundaries, wrapped names/roles, current-round context, headline and labelled values are readable in those captures. No blocking visual finding. Existing debrief narrative correctness remains separate work. |
| Other rendered states and interaction checks | Coordinator execution and QA evidence are recorded separately; do not infer full keyboard traversal or every result/error/debrief state from the seven reviewed screenshots. The first five images precede the final mobile stakeholder-border-only correction; the session evidence identifies the final reload and dedicated corrected-state capture. |
| Actual 200% browser zoom | Not run in this session: the coordinator reports no exposed browser zoom control. Remains required under SCRUM-16; narrow resizing does not replace it. |

Before SCRUM-9 completion, resolve review findings, match the documented tokens and states to the implementation, and link the actual build, screenshots, computed-style/contrast checks and observed results in the session evidence. Record every unexecuted state or device check explicitly. This visual increment does not certify full accessibility, complete keyboard play, correct game narration, or release acceptance; those remain subject to SCRUM-16 and the quality plan.
