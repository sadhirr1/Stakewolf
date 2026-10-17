# SCRUM-36 Sera forest comparison

October 17, 2026. Owner supplied Sera's JPEG and authorized background removal plus one forest comparison with Orin, conserving usage. Coordinator authored the integration; independent `cast_gate` approved for local comparison with no source blocker. Stop here for owner visual feedback.

## Result and asset limits

At http://127.0.0.1:4181/, open Talk to the council and choose Sera or Orin in Speak to. Both use the same existing framing, grade, forest and restrained whole-image movement. Overview hides the selected portrait; returning to decisions restores Orin. A loading portrait is hidden until ready, and a failed image leaves dialogue usable with a named notice. No new conversation, game rule, save change, voice or facial rig.

One built-in image edit produced `.tmp-scrum36/portrait-proof/sera-cutout-v1.png`: 1084 by 1451 RGBA, 2,237,812 bytes. Sampled alpha confirms transparent background and fractional edges. Original owner JPEG is retained unchanged as `sera-original.jpg`; both assets remain ignored and private. Server adds only two exact loopback image routes. No public art redistribution or release acceptance is claimed.

The independent reviewer observes preserved overall pose/identity but altered fine skin, eyelid/lip, wool and strap details. A gray fringe around fine hair is more apparent against black than the dark forest. Coordinator inspected the actual forest view: no white rectangle remains, face and clothing are readable, and the fringe is subdued but not declared flawless. This is an edited comparison candidate, not a pixel-identical matte. No second edit or additional character was generated.

## Verification

- Three modified JavaScript files passed syntax checks. Focused state/dialogue suite passed 43/43, zero failures, 231.7125 ms. No full-game regression, CI or performance result claimed.
- Browser verified Orin→Sera→Orin loading with matching image source and alt text; overview hides Sera, returning restores her, and returning to decisions restores Orin. Existing nightfall orders still showed one worker protecting supplies and one unassigned; no advance or restart was performed.
- At 390 by 844, Sera's face and selector were usable with no horizontal overflow. Pause reported the portrait animation as paused. The existing reduced-motion rule remains unchanged; no new system-setting test claimed.
- Four expected HEAD routes returned200 with appropriate image/JavaScript types; an unknown portrait and `/AGENTS.md` returned404. First shell attempt was blocked by sandbox loopback EACCES; approved rerun passed. Actual browser already loaded both portraits successfully.
- Private captures: `.tmp-scrum36/sera-test-desktop.png`, `sera-test-orin-desktop.png`, `sera-test-mobile.png`. This sanitized summary is durable public evidence; screenshots containing private art are shown locally only.

Account meter observed14% initially and16% near completion in the same account-wide window, not exact task attribution. No purchase, reset credits, new dependency, local-model work or schedules. November6/13 delivery risks remain. Consult SCRUM-36 for the published commit on existing draft PR22; verified parent `0c081117599809b90080a41416bb68fc21375225`.

## Exact image edit prompt

Built-in image tool, transparent background enabled, one reference: the owner's original Sera JPEG.

> Use case: background-extraction. Edit target: the provided Sera character portrait. Remove ONLY the white background to genuine transparent alpha, including between fine loose hair strands and outside the clothing silhouette. Preserve this exact woman's identity, face, expression, eyes, skin texture, hair, pose, clothing, strap, fabric detail, colors and original soft lighting as closely as possible. Preserve the original full portrait composition and all visible hair and shoulders; no zoom, no crop, no resculpting or beautification. No white fringe, halo, checkerboard, replacement scenery, added shadow plane or text. This is one clean PNG cutout for compositing in a forest scene, not a redesigned character.
