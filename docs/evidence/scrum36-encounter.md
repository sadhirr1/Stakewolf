# SCRUM-36 — encounter framing continuation

October 12, 2026. Continuation of [PR22](https://github.com/sadhirr1/Stakewolf/pull/22), from `dcc8c96f97d5ef729e8f0f1e4f28865d4166c0e0`. Scope: portrait camera, face lighting and conversation layout. No new character, rig, animation, story or external-input system was integrated.

## Visible change and browser checks

Desktop encounters use a closer three-quarter view, a broad warm-neutral face light and less orange fire contribution. The dialogue sits on a right-side gradient instead of an opaque framed card. Narrow screens keep a substantially opaque bottom reading panel. The original static quadruped is still provisional; improved staging does not satisfy the owner's character-quality requirement.

The coordinator exercised the actual game at `http://127.0.0.1:4174/wild/` in the Codex browser:

| Check | Observed result |
| --- | --- |
| Desktop Orin, Sera and Vela encounters | Face and readable dialogue remain separate; full-account, close, back and motion controls are available |
| Pause and account expansion | Paused portraits remain visible; expanding the account exposes its text |
| Escape from an encounter | Dialog closes and focus returns to the character's account button |
| Vela at 390 × 844 | Face remains above the reading panel; collapsed-account controls fit; expanded account scrolls inside the panel |
| Back from expanded narrow account | Returns to council and focuses Vela's account button |
| End state | Temporary viewport override reset; desktop Orin preview left open with scene motion paused |

Actual retained captures: [Orin desktop](local-scrum36-encounter/orin-desktop.png), [Vela desktop](local-scrum36-encounter/vela-desktop.png), [Vela narrow](local-scrum36-encounter/vela-mobile.png). Narrow testing is viewport emulation on this computer, not a physical-phone result. The full night-to-morning flow and forced texture failure were checked in the preceding [forest checkpoint](scrum36-forest.md), not rerun in this portrait-only continuation.

## Independent review and limits

Renderer author: `hollow_scene`; UI/build/browser: coordinator; independent reviewer: `hollow_cast`; asset research: `cinema_assets`. These are agent roles. The reviewer independently ran **238 passing tests**, checked source/bundle syntax, inspected the retained Orin/Vela desktop and narrow images, and found a light-table disposal-order defect. The author fixed it before the final build and review. Exact source identities and test duration are in [the review record](scrum36-encounter-review.md). The coordinator reviewed that record before publication.

The bundle is **912,621 bytes**, up **249,805 bytes** because of the area-light lookup tables. Existing assets remain **10,767,112 bytes**. The earlier proposed 1 MB transfer target remains unmet. No fresh performance measurement, GPU-memory measurement, production deployment or owner visual acceptance is claimed.

## Bounded character research

The asset role found the creator's [Fantasy Creatures pack](https://algumacoisaqq.itch.io/fantasy-creatures-wolf-giant-rat-spider-wasp-centipede) and [Beasts source repository](https://github.com/danielgruginski/Beasts). QA independently confirmed their CC0 statements. The creator describes top-down game assets and discloses code/AI-generated geometry, textures, rigs and keyframes. Advertised Warg rig and animation counts are source claims, not validated runtime properties.

The official FBX download stalled in the browser automation. No archive or usable new model was obtained, and no conversion or animation playback was validated. Only previews/source metadata were inspected. No third-party generator was executed, paid asset bought, or service connected. This candidate may still be too simple for close-up character work and is not an accepted replacement.

Next priority: validate a coherent, portrait-suitable character mesh and real authored animation, then review its appearance and motion with the owner. Avoid repeating broad asset searches or making more cosmetic changes sound like completion. Current November 6/13 targets remain at risk; schedules stay off.
