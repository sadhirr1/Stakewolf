# SCRUM-36 — cinematic skeleton, before story

October17,2026. The owner redirected effort to characters, place and an interactive cinematic environment, deferring an ambitious story. Coordinator authored this bounded presentation-only increment; independent reviewer `cast_gate` covers source, UI and captures. Private art remains local. No new art generation, models, paid assets, dependencies or services.

## Result

Separate `/explore` on the local port4181 preview: a council-fire composition with both portrait stand-ins, camera travel to Orin/Sera/river/shelter, projected accessible world pins, persistent keyboard navigation, restrained pointer look, lighting previews, animated fire/smoke/water/ferns, cached directional shadows and motion controls. Existing scanned pines/ferns/rocks/ground and the supplied portrait cutouts are reused. The environment is the primary view; no story or dialogue panel is added.

The scene neither imports encounter rules nor accesses storage. Existing game saves remain independent. This is a presentation skeleton, not completed cinematic art. Portraits face the constrained camera as 2.5D planes; there are no new bodies, rigs, expressions or voices. Bridge/shelter/lantern geometry remains provisional. Water has procedural highlights, not true scene reflections. Movement is curated viewpoint travel, not free walking or physics. No full-world, AAA quality, performance or release acceptance is claimed.

## Executed checks

- Source, generated bundle and preview-server syntax checks passed. Existing esbuild produced the local bundle; no dependency installation. Initial syntax error was corrected before browser use. An obsolete shadow-map constant triggered a browser warning; it was replaced with the supported existing renderer constant.
- Desktop1440×900: loaded local forest/portraits; visited all five positions; viewed both lighting modes; keyboard Enter on Orin's world pin moved focus to the persistent Orin navigation button. Pause changed the control to Resume motion; two later paused screenshots were byte-identical. Selecting shelter/river while paused remained usable and moved directly.
- Mobile390×844: Sera framing, all five navigation controls (78px high), lighting/motion controls, no horizontal overflow (document390px), and the return link were inspected. Returning to the encounter retained the owner's actual noon state: held Orin, admission/hearing, protected stores and unfinished crossing. The new mobile Explore the Hollow entry was present.
- HTTP HEAD: five intended page/style/bundle/portrait routes returned200 with expected types; source-module and documentation paths returned404. The initial shell run was blocked by sandbox loopback restrictions; approved rerun completed. A result-formatting error for absent404 content-type headers was corrected and those two statuses checked separately.
- Private captures retained under `.tmp-scrum36/explore-*.png`; their inspected content is summarized here so the public handoff does not publish owner art. No full regression suite was rerun for the isolated presentation module. Browser-forced WebGL failure, system reduced-motion emulation, physical phones, GPU frame-time/load benchmarks and precise credit/hour accounting were not performed; lifecycle/fallback/reduced-motion logic received source review.

## Review and continuation

Review identified a hidden mobile entry, initially visible pins on failed WebGL startup, and lost focus after pin activation. Fixes: dedicated mobile-visible link styling, initially hidden pins revealed only after projection, and focus transfer to persistent destination navigation. The keyboard fix and mobile entry were verified in the browser. Final reviewer verdict and publication confirmation belong in Jira SCRUM-36 and coordination SCRUM-18 with the exact commit on existing draft PR22.

The next owner gate is the feeling of exploring this place and approaching its two stand-in characters. Keep story expansion paused. Improve/select character animation and environmental assets only after that concrete visual feedback, retaining independent review and bounded usage. Existing November6/13 delivery risks remain; schedules stay off.
