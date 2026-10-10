# SCRUM-31 working opening checkpoint

October 10, 2026. Author: coordinator acting as Development/Visual Design. Independent implementation reviewer: `cover_review` acting as UI/UX and QA. Baseline: PR16, `295792e12cd139857ca0cebe9e6d3099afb72481`. Ticket: https://sadhirr1.atlassian.net/browse/SCRUM-31.

The owner renewed the request to use their artwork and the Jesper Landberg reference. This replaces the opening with a working three-theme image gallery and case brief; entering it still opens the existing five-round game. Full workplace/gameplay redesign remains pending. No schedules or paid runtime service added.

## Verification

Browser environment: Codex in-app browser on Windows; underlying browser version was not exposed by the used browser tools. Desktop viewport 1280x720 CSS pixels. Manual interactions were observed before the 2026-10-10T13:33:39-07:00 checkpoint; individual action times and an activity duration were not recorded. Both named captures exist at this checkpoint.

- Independent QA source review plus five syntax checks and 184 passing tests are recorded in `scrum31-cover-review.md`. Coordinator read and accepted the three added HTTP tests: they check exact image bytes and actual allowlist boundaries, including files that really exist outside the allowed routes. No blocking test-design finding.
- Coordinator inspected the reference in the in-app browser, then the candidate on local port 4176. All three WebP images loaded with nonzero natural dimensions.
- Next and End selected the third theme with matching live description; Home restored the first. Image-card ArrowRight moved both selection and focus to card 1 (zero-based); Home restored card 0. Only the active image card participates in sequential focus order.
- Enter the launch room reached the existing R1 heading with two conversations and original starting metrics. Restart opened the confirmation dialog; Start again returned to the new opening, selected theme 0 and focused `start-game`.
- At 390x844, document scroll width was 375 CSS pixels; at 780x844 it was 765. Neither exceeded the viewport. Coordinator visually inspected the desktop and 390px opening and restored the default viewport afterwards. This is viewport emulation, not a physical phone or actual 200% zoom test.
- Reduced-motion support was inspected in source: the new transitions are disabled under the preference. No OS/browser preference change or reduced-motion runtime test is claimed. No automatic gallery movement or intro wait is present.
- During author inspection, side-image card tab stops/focus and a missing heading space were corrected before QA's recorded run. A registered-trademark symbol was removed. Final implementation hashes are in the independent review record.

Asset provenance and delivery sizes are in `public/cover/README.md`. The original eight images remain in the owner's local Assets directory. Retained local captures: `scrum31-desktop.png` and `scrum31-mobile.png`; this committed summary is the durable verification record.

The independent reviewer also inspected the source originals against the three delivered WebPs and approved the provenance and byte totals. Coordinator integrated the four changed runtime text files, three WebPs, asset provenance and new test into the usual project folder after backing up its public directory and server to `.tmp-root-before-SCRUM-31`. The four runtime file hashes exactly matched the independent review snapshot after copying. Unrelated source, planning and original artwork were preserved.

## Limits and next action

This is an opening design for owner feedback, not evidence of owner visual approval, a completed content rework, full accessibility, live deployment or release acceptance. Existing PR14→15→16 dependencies are unmerged. The next design step is feedback on the rendered opening before extending this treatment to the actual investigation workspace. The new mechanics and narrative rework discussed with the owner remain separate work.
