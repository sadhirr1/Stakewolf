// A bounded visual prototype. Evidence and decisions are explicit and replayable.
export const PEOPLE = {
  orin: { name: 'Orin', role: 'The builder', mark: 'O', line: '“The crossing will hold. I gave my word.”', detail: 'He has promised the eastern families a crossing by dawn. His crew finished the deck before sunset. He has not inspected the downstream anchor since the river rose.', note: 'A promise made before the water rose.' },
  sera: { name: 'Sera', role: 'The scout', mark: 'S', line: '“I heard timber moving. Not footsteps.”', detail: 'She returned along the river after dark. She heard a crack beneath the eastern bank, but could not see the anchor. She wants another inspection before anyone crosses.', note: 'A warning, with an incomplete view.' },
  vela: { name: 'Vela', role: 'The keeper', mark: 'V', line: '“You can have the repair crew. Or the night watch.”', detail: 'Two people know how to set a river anchor. Both are on watch tonight. Moving them buys repair capacity, but leaves the northern path unwatched until dawn.', note: 'One crew. Two promises.' }
};
export const LOCATIONS = ['overlook', 'council', 'trail', 'crossing'];
export function createWildState() { return { started: false, location: 'overlook', heard: [], evidence: false, decision: null }; }
export function act(state, type, value) {
  if (type === 'restart') return createWildState();
  if (type === 'enter') return { ...state, started: true, location: 'council' };
  if (!state.started) return state;
  if (type === 'travel' && LOCATIONS.includes(value) && value !== 'overlook') return { ...state, location: value };
  if (type === 'hear' && typeof value === 'string' && Object.hasOwn(PEOPLE, value) && state.location === 'council') return { ...state, heard: [...new Set([...state.heard, value])] };
  if (type === 'inspect' && state.location === 'crossing') return { ...state, evidence: true };
  if (type === 'decide' && !state.decision && state.location === 'council') {
    if (value === 'repair' && state.evidence) return { ...state, decision: value };
    if (value === 'hold') return { ...state, decision: value };
  }
  return state;
}
export function outcome(state) {
  if (state.decision === 'repair') return { title: 'The crossing gets its crew.', text: 'Lanterns move toward the river. Orin begins resetting the anchor; Sera stays to inspect the repair. Vela recalls the two skilled workers from the northern watch.', consequence: 'The anchor is being repaired. The northern path is unwatched until dawn.', uncertainty: 'No crossing is approved yet. Repair still needs inspection. What loosened the anchor remains unknown.' };
  if (state.decision === 'hold') return { title: 'The promise waits for daylight.', text: 'Sera closes the river path. The watch stays at its posts, but the eastern families will wake to another delay. Orin will have to explain the promise he made.', consequence: 'The night watch remains staffed. The dawn crossing is postponed.', uncertainty: state.evidence ? 'The loose anchor remains unresolved. You have contained the immediate risk, not repaired the crossing.' : 'You chose to wait without inspecting the anchor. The cause of the reported noise remains unverified.' };
  return null;
}
