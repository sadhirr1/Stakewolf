# SCRUM-36 — one-character forest encounter

October 15, 2026. Owner said the portrait looked better and requested placement in the forest with subtle movement, keeping one character and usage low. Author: coordinator (UI/development). Independent reviewer: `cast_gate` (QA), read-only bounded review. No other specialist work commissioned.

## Delivered

- http://127.0.0.1:4181/ now shows the existing council-leader cutout in a misty clearing. `/study` preserves the earlier original/cutout comparison.
- Existing pine, fern, mossy-rock and forest-floor assets reused; no purchases, downloads, new image generation, additional cast or gameplay changes.
- Gentle whole-image rise/scale (3px travel, 0.3% scale), slow background/haze drift and six small motes. No facial or skeletal animation. This is explicitly a 2D portrait over a 3D forest.
- Pause/resume control, keyboard operation, system reduced-motion handling, hidden-tab pause and resource disposal. Forest renderer has no perpetual frame loop: it renders on load, resize and return to a visible page.
- Local image files remain excluded from the public checkpoint. Existing cutout SHA-256 remains `0a34f7b1d13f661bfc1877380f19f74efb8a6e552d3dad6a31d4b7a7200dc65b`. This confirms no new raster edit in this increment; the earlier extraction still differs from the owner's original, as documented in the comparison.

## Executed checks

- Independent reviewer: syntax checks passed for encounter.js, forest.js and the preview server; no blocking source issue found. Reviewer checked single-character scope, motion controls, renderer lifecycle, route restrictions and privacy. Coordinator then matched the background colour to the fog colour to remove a horizon seam and rebuilt the bundle.
- Existing esbuild compiled the forest bundle successfully (618,444 bytes). No new package installation.
- Controlled DOM harness executed nine motion/lifecycle state assertions plus a reduced-motion disabled-control assertion: initial playing, pause, resume, reduced preference on/off, hidden/visible and pagehide/pageshow. Passed. This is a harness test, not OS preference emulation in a browser.
- Actual browser at 1440×900: forest loaded, 1084×1451 cutout loaded; Pause stopped all nine animated elements by computed style; keyboard Space resumed the portrait animation. Comparison link reached the original study and its logo returned to the forest. Browser console had no errors or warnings during the inspected load.
- Actual 390×844 layout: document width 375 within 390 viewport (scrollbar); both controls 44px high. Face, caption and controls inspected; no horizontal overflow.
- Final browser QA found focus could scroll the overflowing portrait inside the stage and clip the head. Changed stage `overflow:hidden` to `overflow:clip`; actual focus recheck showed stage scrollTop=0 with the head retained. Independent reviewer accepted this fix. The earlier mobile capture predates this clipping fix.
- HTTP: nine requested preview/scenery routes returned 200; `/.git/config` and `/wild/assets/wolf/wolf.glb` returned 404; HEAD / returned 200, POST / returned 405. Server stays on 127.0.0.1:4181.
- Local desktop/mobile captures: `docs/evidence/local-scrum36-forest-portrait/desktop.png` and `mobile.png`. Public durable evidence is this summary, not the private artwork captures.

## Boundaries and handoff

Technical preview approved by the independent reviewer, subject to coordinator visual checks above. Owner judgment of the forest composition is the next gate. No acceptance claimed for cinematic quality, lip sync, 3D facial motion, actual WebGL failure/context loss, missing-image browser execution, GPU performance, complete accessibility or the full game suite. No authored game logic changed, so that suite was not rerun.

Do not add cast members or purchase/generate assets before the owner judges this one scene. SCRUM-36 remains In Review. Schedules remain off. November 6 candidate / November 13 release-decision targets remain at risk; this visual experiment does not resolve those delivery risks.
