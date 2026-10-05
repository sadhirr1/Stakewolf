# SCRUM-20 visual directions — review handoff

These are original, static visual explorations for the Stakewolf opening and a dense investigation screen. They are **concepts**, not implemented gameplay, and neither is approved. Both are standalone HTML files with embedded CSS and no build, network, font, image, or JavaScript dependency.

## A — Signal / Noise

[Open concept A](signal-noise.html). A cinematic near-black stage uses large compressed typography, one acid-lime accent, perspective-rendered case-file geometry, and a circular promise stamp. The investigation screen keeps the dossier mood but organizes claims, sourced evidence and next questions in a high-density three-column desk. It develops the existing dark Stakewolf identity into a more striking opening. Risk: dramatic large type and layered geometry could crowd smaller displays; the working implementation would need careful motion restraint and source/text hierarchy.

## B — The Archive

[Open concept B](the-archive.html). An editorial off-white canvas contrasts with a midnight file cabinet, rust-red annotations, paper slips and an oversized serif headline. The investigation view evokes annotated documents, with source and time plainly shown. Its lighter reading surface may help long-form investigation, and its visual difference from A makes owner review a meaningful choice. Risk: the light palette is a departure from the existing dark visual system and would require a deliberate migration of all dialogue, backlog, result and error states.

## Shared rules and provenance

- Each mockup contains an opening and a **post-interview comparison** state using **illustrative excerpts from the draft case**, aligned in source with [KB-01/02/03](../case-design-v2.md) and the current [scenario](../../public/scenario.js): a Monday brief with a Wednesday target, 600 waitlisted teams versus 20 onboarded, and 3 of 40 reviewed long meetings missing an action owner on `relay-beta-17`. This assumes the player has already acquired KB-02/03 through the respective interviews; it is not an opening-state reveal. The follow-up prompts ask about launch scope and operating/verifying the review gate rather than re-asking known facts. This material illustrates layout; it does not define new scenario truth or acceptance behavior. The interpretation area is a dashed, labelled **concept-only** display, not a working control.
- Each shows a source/time for records and explicitly warns that conflicting evidence does not prove intent. The desired mechanic is judgment under uncertainty.
- Both stack the investigation columns on narrow widths; headings and cards wrap, and there is a 340px stress rule. `prefers-reduced-motion` disables the only optional smooth scrolling. Keyboard focus uses a visible outline, and the skip link becomes visible on focus through CSS without JavaScript.
- Typography uses system Arial/Georgia fallbacks. All perspective cards, folders, grid lines, stamps, colors and borders are original CSS/text. No asset, code, layout, or animation was copied from the inspiration site.
- Further implementation must preserve readable controls and verified contrast, actual 200% browser zoom, reduced-motion behavior, real game state, and a source-linked debrief. Static concepts cannot establish those properties.

## Review status

Visual Design authored both files. Coordinator source review found that the original skip link used inline focus handlers despite the no-JavaScript claim; Visual Design replaced those handlers with CSS focus styling in both files. Independent QA then found invented Friday-release/checklist content; Visual Design aligned the copy to KB-01/02/03 and replaced the self-linking interpretation CTA with an explicitly concept-only display. QA's final source review found that the evidence view could imply pre-interview access and re-asked already obtained facts; Visual Design labelled it post-interview and changed the prompts to next-step questions. These corrections need independent re-review. Owner concept feedback remains pending. The owner subsequently authorized resuming and previewing, but the in-app browser returned `Browser is not available: iab` and the browser inventory was empty. No screenshot or visual acceptance check was completed. The author has not self-approved either direction. The next step is to inspect both concepts at desktop and narrow widths when a preview surface is available, fix visible issues, and record owner direction before integrated implementation.

