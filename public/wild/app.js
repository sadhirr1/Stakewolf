import { PEOPLE, createWildState, act, outcome, dawnReport } from './state.js';

const $ = selector => document.querySelector(selector);
let state = createWildState();
let scene;
let returnTarget = '#enter';
let pendingChoice = null;
const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
let reduced = motionQuery.matches;
let paused = reduced;
let audio = null;
let soundOn = false;
let soundGeneration = 0;
let sceneReady = false;
let encounter = null;
let projected = [];
let pinExclusions = [];
const places = {
  council: ['THE FIRST NIGHT', 'The council fire', 'Three voices. One crossing. A promise that must survive the night.'],
  trail: ['BEYOND THE FIRELIGHT', 'Follow the river', 'The path narrows. Somewhere ahead, wood knocks against stone.'],
  crossing: ['THE EASTERN BANK', 'What the dark hides', 'From here, the deck looks finished. Look beneath the promise.']
};
function announce(text) { $('#announcement').textContent = text; }
function updatePins(points = projected) {
  projected = points;
  const enabled = sceneReady && state.started && !state.dawn && !$('#sheet').open && innerWidth > 760;
  $('#world-targets').hidden = !enabled;
  const placed = [];
  for (const point of points) {
    const pin = $(`#pin-${point.id}`);
    if (!pin) continue;
    const relevant = point.id === 'anchor' ? state.location === 'crossing' && !state.evidence : state.location === 'council' && !state.decision;
    const inBounds = Number.isFinite(point.x) && Number.isFinite(point.y) && point.x > 90 && point.x < innerWidth - 90 && point.y > 115 && point.y < innerHeight - 155;
    const collides = pinExclusions.some(r => point.x + 88 > r.left && point.x - 88 < r.right && point.y + 30 > r.top && point.y - 30 < r.bottom);
    const overlapsPin = placed.some(p => Math.abs(p.x - point.x) < 190 && Math.abs(p.y - point.y) < 70);
    pin.hidden = !enabled || !relevant || !point.visible || !inBounds || collides || overlapsPin;
    if (!pin.hidden) { pin.style.left = `${point.x}px`; pin.style.top = `${point.y}px`; placed.push(point); }
  }
}
function refreshPinExclusions() {
  pinExclusions = ['.place', '#context', '.wayfinder'].map(selector => $(selector)).filter(el => !el.hidden).map(el => el.getBoundingClientRect());
  updatePins();
}
addEventListener('resize', refreshPinExclusions);
addEventListener('scroll', refreshPinExclusions, { passive: true });
function showReadingPanel(show) {
  $('#context').hidden = !show;
  $('#view-scene').setAttribute('aria-expanded', String(show));
  $('#view-scene').textContent = show ? 'Hide reading panel ↗' : 'Show reading panel ↙';
  refreshPinExclusions();
}
function personRows() {
  return `<div class="people">${Object.entries(PEOPLE).map(([id,p]) => `<button class="person" data-person="${id}"><span class="portrait" aria-hidden="true">${p.mark}</span><span class="person-text">${p.name}<small>${p.role}</small></span><span>${state.heard.includes(id) ? '<span class="sr-only">Account heard</span>✓' : '<span class="sr-only">Hear account</span>↗'}</span></button>`).join('')}</div>`;
}
function render(focus = false) {
  $('#opening').hidden = state.started;
  $('#experience').hidden = !state.started;
  $('#journal-open').hidden = !state.started;
  document.body.dataset.phase = state.started ? 'play' : 'opening';
  document.body.dataset.daylight = String(state.dawn);
  $('#world-time').textContent = state.dawn ? 'FIRST LIGHT · THE HOLLOW' : state.decision ? 'DEEP NIGHT · THE HOLLOW' : 'NIGHTFALL · THE HOLLOW';
  [['listen', state.heard.length > 0], ['inspect', state.evidence], ['decide', !!state.decision], ['dawn', state.dawn]].forEach(([id, done]) => {
    $(`#step-${id}`).classList.toggle('complete', done);
    const labels = {listen:'Listen', inspect:'Investigate', decide:'Commit', dawn:'Dawn'};
    $(`#step-${id}`).textContent = `${done ? '✓ ' : ''}${labels[id]}`;
    $(`#step-${id}`).setAttribute('aria-label', `${labels[id]}: ${done ? 'complete' : 'not completed'}`);
  });
  $('#note-count').textContent = state.heard.length + Number(state.evidence);
  if (!state.started) { updatePins(); return; }
  const place = state.dawn ? ['THE MORNING AFTER', state.location === 'council' ? 'What the night leaves behind' : state.location === 'trail' ? 'The path at first light' : 'The river remembers', 'The light has changed. The promises are still here.'] : places[state.location];
  $('#place-kicker').textContent = place[0];
  $('#place-title').textContent = place[1];
  $('#place-description').textContent = place[2];
  document.querySelectorAll('[data-travel]').forEach(b => {
    if (b.dataset.travel === state.location) b.setAttribute('aria-current', 'location');
    else b.removeAttribute('aria-current');
  });
  const result = outcome(state);
  const morning = dawnReport(state);
  if (morning) {
    $('#context').innerHTML = `<p class="eyebrow">DAWN / WHAT FOLLOWED</p><h2>${morning.title}</h2><p>${morning.text}</p><div class="morning-voices">${morning.voices.map(v => `<blockquote><span>${PEOPLE[v.id].name} · ${PEOPLE[v.id].role}</span><p>${v.line}</p></blockquote>`).join('')}</div><h3 class="field-label">Work carried into the morning</h3><div class="open-threads">${morning.threads.map(t => `<div><span>${t.status}</span><strong>${t.label}</strong><p>${t.detail}</p></div>`).join('')}</div><p class="subtle">${morning.uncertainty}</p><p class="scene-ending">The end of your first night. These open threads belong to the next chapter.</p><button class="text-action" id="replay">Try another night ↗</button>`;
  } else if (result && state.location === 'council') {
    $('#context').innerHTML = `<span class="outcome-label">YOUR DECISION IS IN MOTION</span><h2>${result.title}</h2><p>${result.text}</p><div class="evidence-mark"><strong>The cost of the call</strong><p>${result.consequence}</p></div><p class="subtle">${result.uncertainty}</p><button class="primary" id="advance-dawn">Stay until first light <span aria-hidden="true">↗</span></button><p class="subtle">Let the night unfold, then hear what your decision changed.</p><button class="text-action" id="replay">Return to the beginning ↗</button>`;
  } else if (state.location === 'council') {
    $('#context').innerHTML = `<p class="eyebrow">A PROMISE AT DAWN</p><h2>“The crossing is ready.”</h2><p>The eastern families are counting on it. Around the fire, readiness means something different to everyone.</p>${personRows()}<button class="primary" data-travel="trail">Leave the firelight <span aria-hidden="true">↗</span></button><button class="text-action" id="decision-open">Bring a decision to the council</button><p class="subtle">${state.evidence ? 'Field note acquired: the downstream anchor is loose.' : 'Hear an account, or follow the river to see for yourself.'}</p>`;
  } else if (state.location === 'trail') {
    $('#context').innerHTML = `<p class="eyebrow">BETWEEN CLAIM & EVIDENCE</p><h2>The forest has another account.</h2><p>Lantern light catches a supply cart beside the path. The timber is here. The repair crew is not.</p><p>Water carries a slow, irregular knocking from the eastern bank.</p><div class="rule"></div><p class="subtle">Presence is not completion. Follow the work to its end.</p><button class="primary" data-travel="crossing">Inspect the crossing <span aria-hidden="true">↗</span></button>`;
  } else {
    $('#context').innerHTML = state.evidence
      ? `<p class="eyebrow">FIELD NOTE 01 · OBSERVED</p><h2>A finished deck.<br>A loose anchor.</h2><div class="evidence-mark"><strong>Downstream anchor</strong><p>The rope slips when the river pulls. The deck is complete, but its downstream fastening is not holding.</p></div><p class="subtle">This establishes a condition, not a culprit. You cannot tell whether it was neglect, rising water, or interference.</p><button class="primary" data-travel="council">Take this to the council <span aria-hidden="true">↗</span></button>`
      : `<p class="eyebrow">LOOK CLOSER</p><h2>Something moves beneath the deck.</h2><p>The rope goes taut. A timber shifts. Then the sound again.</p><p>You can inspect the downstream fastening from this bank without stepping onto the deck.</p><button class="primary" id="inspect">Examine the anchor <span aria-hidden="true">↗</span></button>`;
  }
  $('#context').scrollTop = 0;
  refreshPinExclusions();
  if (focus) { $('#place-title').focus({preventScroll:true}); window.scrollTo({top:0,behavior:'instant'}); }
}
function travel(location) {
  state = act(state, 'travel', location);
  scene?.travelTo(state.location);
  render(true);
  announce(`At ${$('#place-title').textContent}.`);
}
function showSheet(html, target, person = null) {
  returnTarget = target;
  encounter = person;
  if (person) window.scrollTo({top:0,behavior:'instant'});
  $('#sheet').classList.toggle('encounter', !!person);
  document.body.dataset.encounter = String(!!person);
  scene?.focusPerson(person);
  $('#sheet-content').innerHTML = html;
  if (!$('#sheet').open) $('#sheet').showModal();
  $('#sheet-close').focus();
  updatePins();
}
function closeSheet() {
  $('#sheet').close();
}
$('#sheet').addEventListener('close', () => {
  pendingChoice = null;
  encounter = null;
  document.body.dataset.encounter = 'false';
  scene?.focusPerson(null);
  refreshPinExclusions();
  const target = $(returnTarget);
  (target && !target.hidden && target.getClientRects().length ? target : $('#place-title')).focus({preventScroll:true});
});
function openPerson(id, source) {
  if (!Object.hasOwn(PEOPLE, id) || state.location !== 'council' || state.dawn) return;
  const p = PEOPLE[id];
  state = act(state, 'hear', id);
  render();
  showSheet(`<p class="eyebrow">AT THE FIRE · ${p.role.toUpperCase()}</p><h2 id="sheet-title">${p.name}</h2><p class="quote">${p.line}</p><p>${p.detail}</p><div class="rule"></div><p class="field-label">An account, not a verdict</p><p>${p.note}</p><button class="primary" data-close>Back to the fire <span aria-hidden="true">↗</span></button>`, source?.id ? `#${source.id}` : `#context [data-person="${id}"]`, id);
}
function openDecision() {
  showSheet(`<p class="eyebrow">THE COUNCIL IS WAITING</p><h2 id="sheet-title">Where does the crew go?</h2><p>Two skilled people. A crossing to repair. A northern path to watch. Choose what happens tonight.</p><button class="choice" data-choice="repair" ${state.evidence ? '' : 'disabled'}><strong>Move the watch to the river</strong><span>Repair the anchor, then inspect it. The northern path goes unwatched until dawn.${state.evidence ? '' : ' Inspect the anchor first to support this action.'}</span></button><button class="choice" data-choice="hold"><strong>Hold the crossing until daylight</strong><span>Keep the watch in place. Postpone the promise to the eastern families.</span></button><p class="subtle">${state.evidence ? 'Your field note supports a repair. It does not identify who caused the fault.' : 'You have not inspected the crossing. You can still choose to postpone it.'}</p>`, '#decision-open');
}
function confirmChoice(choice) {
  pendingChoice = choice;
  $('#sheet-content').innerHTML = `<p class="eyebrow">MAKE THE COMMITMENT</p><h2 id="sheet-title">${choice === 'repair' ? 'Send them to the river?' : 'Hold until daylight?'}</h2><p>${choice === 'repair' ? 'Vela will recall the two skilled workers from the northern watch. Orin will reset the anchor with Sera observing. The crossing remains closed pending inspection.' : 'Sera will close the crossing tonight. The watch remains staffed. The eastern families will face a delay at dawn.'}</p><button class="primary" id="confirm-choice">Commit to this decision <span aria-hidden="true">↗</span></button><button class="text-action" id="decision-back">Reconsider</button>`;
  $('#confirm-choice').focus();
}
function openJournal() {
  const morning = dawnReport(state);
  showSheet(`<p class="eyebrow">WHAT YOU KNOW SO FAR</p><h2 id="sheet-title">Field notes</h2>${state.heard.length ? state.heard.map(id => `<div class="notes-item"><span class="field-label">NIGHT ACCOUNT · ${PEOPLE[id].role}</span><p><strong>${PEOPLE[id].name}</strong></p><p>${PEOPLE[id].line} ${PEOPLE[id].note}</p></div>`).join('') : '<p>No night accounts recorded.</p>'}${state.evidence ? '<div class="notes-item"><span class="field-label">OBSERVED AT NIGHT · EASTERN BANK</span><p><strong>The loose anchor</strong></p><p>The downstream fastening slipped under load. Its cause was unknown.</p></div>' : '<p>No night inspection of the downstream anchor recorded.</p>'}${state.decision ? `<div class="notes-item"><span class="field-label">YOUR NIGHT COMMITMENT</span><p>${outcome(state).consequence}</p><p>${state.decisionEvidence ? 'You had inspected the anchor before committing.' : 'You committed before inspecting the anchor.'}</p></div>` : ''}${morning ? `<div class="notes-item"><span class="field-label">DAWN REPORT</span><p><strong>${morning.title}</strong></p><p>${morning.consequence}</p></div>` : ''}`, '#journal-open');
}
function openGuide() {
  showSheet('<p class="eyebrow">FIELD GUIDE</p><h2 id="sheet-title">Enter. Listen. Investigate.</h2><p>You lead tonight’s council. A river crossing has been promised for dawn, but the accounts do not agree.</p><ul><li>Use the three location buttons to move through the forest.</li><li>Select a name in the clearing or reading panel to approach a character.</li><li>Inspect the crossing using its marker or the reading panel. Hide the panel for a clear view.</li><li>Make one commitment, then stay until first light to see what follows.</li></ul><p>Every action works with Tab and Enter. Escape closes a panel. Sound is optional. Pause motion freezes the atmosphere and makes travel immediate.</p><p>This is one short authored night. The wider story is still to come. Refresh starts over.</p><a href="../">Open the earlier Relay prototype ↗</a>', '#guide-open');
}
function syncMotion() {
  $('#motion').setAttribute('aria-pressed', String(paused));
  $('#motion').textContent = paused ? 'Motion paused' : 'Pause motion';
  scene?.setReducedMotion(reduced || paused);
  scene?.setPaused(paused);
}
motionQuery.addEventListener('change', e => { reduced = e.matches; paused = reduced; syncMotion(); });
async function setSound(enabled) {
  const generation = ++soundGeneration;
  soundOn = enabled;
  $('#sound').textContent = enabled ? 'Sound on' : 'Sound off';
  $('#sound').setAttribute('aria-pressed', String(enabled));
  try {
    if (enabled && !audio) {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) throw new Error('Audio unavailable');
      const context = new Audio();
      const buffer = context.createBuffer(1, context.sampleRate * 5, context.sampleRate);
      const samples = buffer.getChannelData(0);
      let last = 0;
      for (let i = 0; i < samples.length; i++) { last = (last + (Math.random() * 2 - 1) * .022) / 1.022; samples[i] = last * 3; }
      const source = context.createBufferSource(); source.buffer = buffer; source.loop = true;
      const filter = context.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 560;
      const volume = context.createGain(); volume.gain.value = .17;
      source.connect(filter).connect(volume).connect(context.destination); source.start();
      audio = context;
    }
    if (audio) {
      if (enabled && !document.hidden) await audio.resume(); else await audio.suspend();
      if (generation !== soundGeneration && !soundOn) await audio.suspend();
    }
  } catch { soundOn = false; $('#sound').textContent = 'Sound unavailable'; $('#sound').setAttribute('aria-pressed','false'); announce('Sound could not start. You can continue silently.'); }
}
document.addEventListener('visibilitychange', () => { if (audio) (document.hidden ? audio.suspend() : soundOn ? audio.resume() : audio.suspend()).catch(()=>{}); });
document.addEventListener('click', e => {
  const button = e.target.closest('button');
  if (!button || button.disabled) return;
  if (button.id === 'enter') { state = act(state,'enter'); scene?.travelTo('council'); render(true); return; }
  if (button.id === 'view-scene') { showReadingPanel($('#context').hidden); return; }
  if (button.dataset.travel) { travel(button.dataset.travel); return; }
  if (button.dataset.person) { openPerson(button.dataset.person, button); return; }
  if (button.id === 'inspect' || button.hasAttribute('data-inspect')) {
    const next = act(state,'inspect');
    if (next === state) return;
    state = next; render(); showReadingPanel(true); $('#context .primary').focus(); announce('Field note acquired. The downstream anchor is loose. Its cause is unknown.'); return;
  }
  if (button.id === 'decision-open' || button.id === 'decision-back') { openDecision(); return; }
  if (button.dataset.choice) { confirmChoice(button.dataset.choice); return; }
  if (button.id === 'confirm-choice' && pendingChoice) {
    const next = act(state, 'decide', pendingChoice);
    if (next !== state) { state = next; scene?.setOutcome(state.decision); render(true); returnTarget = '#place-title'; closeSheet(); announce(outcome(state).consequence); }
    return;
  }
  if (button.id === 'advance-dawn') {
    const next = act(state, 'advance');
    if (next === state) return;
    state = next; scene?.setDawn(true); scene?.travelTo(state.location); render(true); showReadingPanel(true);
    announce(`First light. ${dawnReport(state).consequence}`); return;
  }
  if (button.id === 'replay') {
    showSheet('<p class="eyebrow">A FRESH NIGHT</p><h2 id="sheet-title">Begin again?</h2><p>Your accounts, field note, and decision will be cleared.</p><button class="primary" id="restart-confirm">Begin again <span aria-hidden="true">↗</span></button><button class="text-action" data-close>Keep exploring</button>', '#replay'); return;
  }
  if (button.id === 'restart-confirm') { state = act(state,'restart'); scene?.setOutcome(null); scene?.setDawn(false); scene?.travelTo('overlook'); showReadingPanel(true); render(); returnTarget = '#enter'; closeSheet(); window.scrollTo({top:0,behavior:'instant'}); announce('A fresh night. All field notes cleared.'); return; }
  if (button.id === 'journal-open') { openJournal(); return; }
  if (button.id === 'guide-open') { openGuide(); return; }
  if (button.id === 'sheet-close' || button.hasAttribute('data-close')) { closeSheet(); return; }
  if (button.id === 'motion') { paused = !paused; syncMotion(); return; }
  if (button.id === 'sound') setSound(!soundOn);
});
syncMotion();
function sceneUnavailable(reason) { sceneReady = false; updatePins(); showReadingPanel(true); console.warn('Forest renderer:', String(reason)); $('#render-notice').hidden = false; $('#render-notice').textContent = 'The 3D scene is unavailable on this browser. All exploration and decision controls still work.'; }
import('./scene.js').then(({createForestScene}) => {
  scene = createForestScene($('#forest'), { reducedMotion: reduced || paused, onReady() { sceneReady = true; $('#forest').dataset.ready = 'true'; refreshPinExclusions(); }, onProject: updatePins, onFailure: sceneUnavailable });
  syncMotion();
  scene?.travelTo(state.location);
  scene?.setOutcome(state.decision);
  scene?.setDawn(state.dawn);
  scene?.focusPerson(encounter);
}).catch(sceneUnavailable);
window.addEventListener('pagehide', event => {
  if (event.persisted) { scene?.setPaused(true); audio?.suspend().catch(()=>{}); }
  else { scene?.dispose(); audio?.close().catch(()=>{}); }
});
window.addEventListener('pageshow', event => {
  if (!event.persisted) return;
  syncMotion();
  if (soundOn && !document.hidden) audio?.resume().catch(()=>{});
});
