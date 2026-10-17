# SCRUM-36 — owner-supplied council leader portrait

October 15, 2026. Owner supplied two JPG portraits after declining CC5 acquisition and choosing an illustrated/2.5D test. The first portrait was selected for its fuller framing. This checkpoint is an isolated visual comparison, not game integration, accepted art, animation, or production readiness.

## Delivered
- One local page at http://127.0.0.1:4181/, started with `node scripts/serve-portrait-proof.mjs`.
- Close-up / Portrait framing, Neutral / Warm colour treatment, Original / Cutout comparison.
- Generated alpha cutout uses a single built-in imagegen background-extraction call. It changes forehead/cheek wrinkles, beard/hair and clothing texture; it is not a pixel-identical matte. Original is retained unchanged and unfiltered. No further image generation was attempted.
- No new dependency, paid purchase, CC installation, scenery or automatic schedule. No main-game files changed. Public source excludes both image files and local captures; source records their identities below.

## Source and output
Files are local and ignored under `.tmp-scrum36/portrait-proof/`.
| Asset | Dimensions | Bytes | SHA-256 |
|---|---|---:|---|
| leader-original.jpg | 1792 × 2400 | 2,946,553 | 96a07377c228fac343586640df19b5098f7de24351055df35687b495d1993895 |
| leader-cutout.png | 1084 × 1451 | 2,297,736 | 0a34f7b1d13f661bfc1877380f19f74efb8a6e552d3dad6a31d4b7a7200dc65b |

Original supplied filename: `Character_portrait_for_Stakewolf_2K_20261015220039.jpg`.
Built-in generated output: `exec-e60bad2b-9dde-4fc9-b2cc-390aa9e0e812.png`, copied into the project. Inspected PNG Format32bppArgb, corner alpha 0, sampled face alpha 253. This is actual transparency, not a checkerboard/white background.

Exact image-edit prompt:
> Use case: background-extraction. Edit target: the provided human council leader portrait. Remove ONLY the solid white background and deliver a true transparent-alpha PNG cutout for a game. Preserve the exact existing face, facial identity, eyes, expression, hairstyle, stubble, age, skin texture, colour, clothing, pose, proportions, lighting and original framing. Do not beautify, repaint or redesign. Keep the fine natural hair strands and clean anti-aliased clothing silhouette without white fringes. Preserve the entire visible portrait and lower crop. No new objects, no shadows outside the figure, no background, no checkerboard pixels. Make the area outside the character fully transparent.

## Verification and review
Author: coordinator (UI/development). Independent reviewer: `cast_gate` (QA/visual), read-only source, source/cutout images and desktop screenshot. Reviewer independently ran both syntax checks and approved the technical comparison; owner likeness/art approval remains open. Reviewer explicitly flagged altered wrinkles, beard/hair and fabric, plus scrolling to controls at the captured desktop height. Follow-up reviewed the default-visible image / no-script note resilience change and found no new blocker.

Coordinator executed:
- Syntax: both `portrait.js` and `serve-portrait-proof.mjs` passed; reviewer independently confirmed initial versions, then read the minor HTML/CSS-only resilience change.
- HTTP: five exact public routes 200; /.git/config 404; HEAD / 200; POST / 405. Server binds only 127.0.0.1:4181. Sandbox-only launch initially could not be reached by the browser; restarted authorized hidden local process with normal loopback access, then verified.
- Actual browser: loaded cutout; switched Original (1792-pixel source, colour controls disabled); switched Cutout; wider Portrait; Warm; Neutral; Close-up. Keyboard Space activated Portrait. Warm is a CSS colour grade, not physical light.
- 390 × 844 viewport: loaded 1084-pixel cutout, document width 375 within inner width 390 (scrollbar), no horizontal overflow, all six buttons 44px tall. Temporary viewport reset.
- No autonomous animation. Reduced-motion CSS removes filter transitions.
- Original and cutout screenshots retained locally in `docs/evidence/local-scrum36-owner-portrait/`: close-desktop.png, original-desktop.png, portrait-warm.png, mobile.png. Durable public evidence is this text summary. Original desktop capture preceded the HTML/CSS-only no-script change.
- Full game suite was not rerun: the main game and its servers are untouched. No claim of actual JS-disabled or missing-image browser execution, hardware performance acceptance or full keyboard journey.

## Handoff
Ask the owner to judge this actual browser portrait before further cast work. Exact original-image fidelity would require a non-generative alpha export/cutout; do not repeatedly regenerate the face to chase it. Do not integrate the character into the main game or widen the art scope solely because the comparison page works. SCRUM-36 remains In Review. Previous council/wolf studies and original artwork remain preserved.

Current November 6/13 targets remain at risk; no reforecast, release decision or schedules introduced.

