// A bounded visual prototype. Evidence and decisions are explicit and replayable.
export const PEOPLE = {
  orin: { name: 'Orin', role: 'The builder', mark: 'O', line: '“The crossing will hold. I gave my word.”', detail: 'He has promised the eastern families a crossing by dawn. His crew finished the deck before sunset. He has not inspected the downstream anchor since the river rose.', note: 'A promise made before the water rose.' },
  sera: { name: 'Sera', role: 'The scout', mark: 'S', line: '“I heard timber moving. Not footsteps.”', detail: 'She returned along the river after dark. She heard a crack beneath the eastern bank, but could not see the anchor. She wants another inspection before anyone crosses.', note: 'A warning, with an incomplete view.' },
  vela: { name: 'Vela', role: 'The keeper', mark: 'V', line: '“You can have the repair crew. Or the night watch.”', detail: 'Two people know how to set a river anchor. Both are on watch tonight. Moving them buys repair capacity, but leaves the northern path unwatched until dawn.', note: 'One crew. Two promises.' }
};
export const LOCATIONS = ['overlook', 'council', 'trail', 'crossing'];
export function createWildState() { return { started: false, location: 'overlook', heard: [], evidence: false, decision: null, decisionEvidence: null, dawn: false }; }
export function act(state, type, value) {
  if (type === 'restart') return createWildState();
  if (type === 'enter' && !state.started) return { ...state, started: true, location: 'council' };
  if (!state.started) return state;
  if (type === 'travel' && LOCATIONS.includes(value) && value !== 'overlook') return { ...state, location: value };
  if (type === 'hear' && typeof value === 'string' && Object.hasOwn(PEOPLE, value) && state.location === 'council') return { ...state, heard: [...new Set([...state.heard, value])] };
  if (type === 'inspect' && !state.dawn && state.location === 'crossing') return { ...state, evidence: true };
  if (type === 'decide' && !state.dawn && !state.decision && state.location === 'council') {
    if ((value === 'repair' && state.evidence) || value === 'hold') {
      return { ...state, decision: value, decisionEvidence: Boolean(state.evidence) };
    }
  }
  if (type === 'advance' && !state.dawn && (state.decision === 'repair' || state.decision === 'hold')) return { ...state, dawn: true, location: 'council' };
  return state;
}
export function outcome(state) {
  if (state.decision === 'repair') return { title: 'The crossing gets its crew.', text: 'Lanterns move toward the river. Orin begins resetting the anchor; Sera stays to inspect the repair. Vela recalls the two skilled workers from the northern watch.', consequence: 'The anchor is being repaired. The northern path is unwatched until dawn.', uncertainty: 'No crossing is approved yet. Repair still needs inspection. What loosened the anchor remains unknown.' };
  if (state.decision === 'hold') return { title: 'The promise waits for daylight.', text: 'Sera closes the river path. The watch stays at its posts, but the eastern families will wake to another delay. Orin will have to explain the promise he made.', consequence: 'The night watch remains staffed. The dawn crossing is postponed.', uncertainty: state.decisionEvidence ? 'The loose anchor remains unresolved. You have contained the immediate risk, not repaired the crossing.' : 'You chose to wait without inspecting the anchor. The cause of the reported noise remains unverified.' };
  return null;
}

// Dawn is an explicit player transition. These authored reports distinguish
// a bounded observation from a promise, and leave unfinished work visible.
export function dawnReport(state) {
  if (!state.dawn) return null;
  if (state.decision === 'repair') return {
    title: 'A fastening holds. Other promises remain.',
    text: 'At first light, Sera inspects the reset fastening. It holds under the load and river level she checks. The two workers return exhausted. No one watched the northern path while they were at the river.',
    consequence: 'The repaired fastening passes Sera’s bounded dawn inspection. The crew needs rest, and the overnight watch gap remains unresolved.',
    uncertainty: 'This inspection does not guarantee the crossing under different conditions. The unobserved northern path is a gap in knowledge, not proof of an intrusion. What loosened the original fastening remains unknown.',
    threads: [
      { label: 'The crossing', status: 'Inspected at dawn', detail: 'Sera observed the reset fastening hold under the conditions she checked. Any broader promise of safe passage still exceeds that observation.' },
      { label: 'The northern watch', status: 'Unresolved gap', detail: 'Both skilled workers left their posts for the repair. What happened on the unguarded path is still unknown.' },
      { label: 'The repair crew', status: 'Rest needed', detail: 'The repair used the crew through the night. Their exhaustion carries into the next task; their capacity has not reset with the sunrise.' }
    ],
    voices: [
      { id: 'orin', line: '“The fastening is reset. I still owe the families a careful crossing, and the crew a rest.”' },
      { id: 'sera', line: '“It held during my dawn inspection. I cannot promise what another rise in the river will do.”' },
      { id: 'vela', line: '“Those two worked through the night. We still need rest and an account of the unguarded path.”' }
    ]
  };
  if (state.decision === 'hold') return {
    title: 'Daylight reaches a closed crossing.',
    text: 'The eastern families wait on the far bank. The river path is still closed. The skilled pair stayed at their watch posts through the night; no repair or dawn inspection has been carried out.',
    consequence: 'The night watch remained staffed. The families are still waiting, and the crossing needs inspection and any required repair before it can reopen.',
    uncertainty: state.evidence
      ? 'Your night inspection recorded a slipping fastening. It remains unrepaired, and the cause remains unknown. Keeping the watch staffed does not resolve the crossing.'
      : 'Sera’s account of a noise remains a claim. Without an anchor inspection, its condition and the cause of the noise remain unverified.',
    threads: [
      { label: 'The crossing', status: 'Still closed', detail: state.evidence ? 'The observed slipping fastening still needs repair, followed by inspection. No dawn check has cleared it.' : 'Inspect the anchor to establish its condition and the work required. No dawn check has cleared the crossing.' },
      { label: 'The northern watch', status: 'Staffing kept', detail: 'The two skilled workers kept their posts. That fulfilled the staffing commitment; it makes no claim about every event on the path.' },
      { label: 'The eastern families', status: 'Promise delayed', detail: 'The promised dawn crossing has not happened. The families are waiting for an explanation and a credible next step.' }
    ],
    voices: [
      { id: 'orin', line: '“They are still waiting. My promise ran ahead of what we knew, and I owe them an explanation.”' },
      { id: 'sera', line: state.evidence ? '“The slipping fastening still needs repair. Closing the path bought time; it did not finish the work.”' : '“I still have a noise, not an inspected anchor. Daylight is a chance to look.”' },
      { id: 'vela', line: '“The watch kept its posts. That kept our coverage; it did not answer Sera’s warning.”' }
    ]
  };
  return null;
}
