// A bounded visual prototype. Evidence and decisions are explicit and replayable.
export const PEOPLE = {
  orin: { name: 'Orin', role: 'The builder', mark: 'O', line: '“The crossing will hold. I gave my word.”', detail: 'He has promised the eastern families a crossing by dawn. His crew finished the deck before sunset. He has not inspected the downstream anchor since the river rose.', note: 'A promise made before the water rose.' },
  sera: { name: 'Sera', role: 'The scout', mark: 'S', line: '“I heard timber moving. Not footsteps.”', detail: 'She returned along the river after dark. She heard a crack beneath the eastern bank, but could not see the anchor. She wants another inspection before anyone crosses.', note: 'A warning, with an incomplete view.' },
  vela: { name: 'Vela', role: 'The keeper', mark: 'V', line: '“You can have the repair crew. Or the night watch.”', detail: 'Two people know how to set a river anchor. Both are on watch tonight. Moving them buys repair capacity, but leaves the northern path unwatched until dawn.', note: 'One crew. Two promises.' }
};
export const LOCATIONS = ['overlook', 'council', 'trail', 'crossing'];
export function createWildState() { return { started: false, location: 'overlook', heard: [], evidence: false, decision: null, decisionEvidence: null, dawn: false, morningStarted: false, morningChoice: null }; }
export function act(state, type, value) {
  if (type === 'restart') return createWildState();
  if (type === 'enter' && !state.started) return { ...state, started: true, location: 'council' };
  if (!state.started) return state;
  if (type === 'travel' && LOCATIONS.includes(value) && value !== 'overlook') return { ...state, location: value };
  if (type === 'hear' && !state.dawn && typeof value === 'string' && Object.hasOwn(PEOPLE, value) && state.location === 'council') return { ...state, heard: [...new Set([...state.heard, value])] };
  if (type === 'inspect' && !state.dawn && state.location === 'crossing') return { ...state, evidence: true };
  if (type === 'decide' && !state.dawn && !state.decision && state.location === 'council') {
    if ((value === 'repair' && state.evidence) || value === 'hold') {
      return { ...state, decision: value, decisionEvidence: Boolean(state.evidence) };
    }
  }
  if (type === 'advance' && !state.dawn && (state.decision === 'repair' || state.decision === 'hold')) return { ...state, dawn: true, location: 'council' };
  if (type === 'begin-morning' && state.dawn && !state.morningStarted) return { ...state, morningStarted: true, location: 'council' };
  if (type === 'assign-morning' && state.dawn && state.morningStarted && !state.morningChoice && (value === 'crossing' || value === 'trail') && state.location === value) return { ...state, morningChoice: value };
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

// One scout, one morning assignment. These projections carry the same work
// forward without altering the night evidence or the historical dawn report.
export function morningOptions(state) {
  if (!state.morningStarted) return [];
  return [
    state.decision === 'repair'
      ? { id: 'crossing', location: 'crossing', title: 'Guide the first party', detail: 'Sera can guide a small first party across under the conditions she inspected at dawn. The repair crew stays at rest.', cost: 'The northern trail investigation waits this morning.' }
      : { id: 'crossing', location: 'crossing', title: 'Inspect the anchor in daylight', detail: 'Sera can inspect the downstream fastening. Her morning covers inspection; a repair would still need its own crew and plan.', cost: 'The northern trail investigation waits this morning.' },
    { id: 'trail', location: 'trail', title: 'Read the northern trail', detail: 'Send Sera to examine the path. Marks on the ground may survive the night, but their age and maker may remain uncertain.', cost: state.decision === 'repair' ? 'The first guided crossing waits. The eastern families stay on the far bank.' : 'The daylight anchor inspection waits. The crossing stays closed and the eastern families keep waiting.' }
  ];
}

export function morningWork(state) {
  if (!state.dawn || (state.decision !== 'repair' && state.decision !== 'hold')) return [];
  const repaired = state.decision === 'repair';
  const crossing = state.morningChoice === 'crossing';
  const trail = state.morningChoice === 'trail';
  const work = [
    {
      id: 'crossing', label: 'The crossing', owner: 'Orin',
      origin: repaired ? 'Night repair commitment; Sera’s bounded dawn inspection.' : 'Night commitment to hold the crossing closed.',
      status: crossing ? (repaired ? 'Guided passage complete' : 'Repair pending') : (trail ? (repaired ? 'Guidance deferred' : 'Daylight inspection deferred') : (repaired ? 'Guidance pending' : 'Daylight inspection pending')),
      detail: crossing
        ? (repaired ? 'Sera guided a small first party across under the conditions checked at dawn. This passage does not establish safety in other conditions.' : 'Sera’s morning inspection observed the fastening slip under load. Repair and inspection of that repair remain outstanding; the path stays closed.')
        : (repaired ? 'The fastening held in Sera’s dawn check. Without her guidance, no family party has crossed.' : (state.evidence ? 'The night inspection recorded a slipping fastening. The crossing still needs repair and further inspection; no one has crossed.' : 'The anchor’s condition remains unverified. The crossing stays closed until inspection and any required repair.'))
    },
    {
      id: 'trail', label: 'The northern trail', owner: 'Sera',
      origin: repaired ? 'Night repair recalled both skilled workers from the watch.' : 'Night commitment kept the watch staffed.',
      status: trail ? 'Checked; questions remain' : (crossing ? 'Deferred this morning' : 'Investigation open'),
      detail: trail
        ? `Sera found disturbed mud and undated tracks. ${repaired ? 'They cannot reconstruct the unobserved night.' : 'Staffing the watch does not account for every event on the path.'} No maker or cause is established.`
        : (repaired ? 'The path was unwatched during the repair. What happened in that gap remains unknown; the morning investigation is still open.' : 'The watch kept its posts. A closer look at the path remains open; staffing alone does not establish everything that happened.')
    },
    {
      id: 'families', label: 'The eastern families', owner: 'Orin', origin: 'Orin’s promise of a crossing by dawn.',
      status: repaired && crossing ? 'First party across' : 'Still waiting',
      detail: repaired && crossing ? 'A small first party has crossed with Sera. The wider promise is only partly fulfilled; no passage for the remaining families has been recorded.' : 'The families remain on the far bank. They still need an explanation and a credible next step toward passage.'
    }
  ];
  if (repaired) work.push({ id: 'crew', label: 'The repair crew', owner: 'Vela', origin: 'The overnight repair used both skilled workers.', status: state.morningStarted ? 'Resting' : 'Rest needed', detail: state.morningStarted ? 'Both workers are resting after the overnight repair. Their exhaustion still limits further work.' : 'The two workers returned exhausted. Rest is still owed before further work.' });
  return work;
}

export function morningReport(state) {
  if (!state.dawn || !state.morningStarted || !state.morningChoice) return null;
  const repaired = state.decision === 'repair';
  if (state.morningChoice === 'crossing' && repaired) return {
    title: 'A first party crosses.',
    text: 'Sera guides a small first party over the river. The reset fastening holds under the conditions she checked at dawn. On the bank, Orin counts those who have arrived while his exhausted crew rests.',
    consequence: 'A first party is across; the wider promise is partly fulfilled. Sera has spent her morning at the crossing, leaving the northern trail investigation open.',
    uncertainty: 'This passage does not guarantee safety in different conditions. The overnight watch gap remains unknown, and the cause of the original loose fastening is unresolved.',
    voices: [
      { id: 'orin', line: '“A few are across. I will not call that everyone, and I will not spend the crew twice.”' },
      { id: 'sera', line: '“I guided this party under the conditions I checked. The trail will have to wait.”' },
      { id: 'vela', line: '“The crew is resting. The missing watch hours are still missing.”' }
    ],
    threads: morningWork(state), scene: 'crossing-guided'
  };
  if (state.morningChoice === 'crossing' && state.decision === 'hold') return {
    title: 'The anchor still needs work.',
    text: 'Sera kneels at the downstream anchor. Her daylight inspection records the fastening slipping under load. She marks the defect and keeps the river path closed.',
    consequence: 'The slipping fastening is now observed in daylight. Repair remains pending, the eastern families are still waiting, and Sera has no morning left for the northern trail.',
    uncertainty: 'An inspection has established the defect, not its cause or a completed repair. The night watch remained staffed; that did not resolve the crossing.',
    voices: [
      { id: 'orin', line: '“We can name the work now. We still owe the families a crossing.”' },
      { id: 'sera', line: '“The fastening slips under load. I can show the defect; I cannot yet say why.”' },
      { id: 'vela', line: '“We kept the watch. A repair still needs hands and a plan.”' }
    ],
    threads: morningWork(state), scene: 'anchor-found'
  };
  if (state.morningChoice === 'trail') return {
    title: 'Tracks without a time.',
    text: 'Sera follows the northern path and finds disturbed mud with overlapping tracks. The marks are real, but she cannot date them or identify who made them.',
    consequence: repaired ? 'The trail has been checked, but the unobserved night cannot be reconstructed. The guided crossing is deferred, the families still wait, and the repair crew remains at rest.' : 'The trail has been checked. The anchor’s daylight inspection is deferred, the crossing stays closed, and the eastern families still wait.',
    uncertainty: repaired ? 'Undated tracks cannot establish what happened during the watch gap. They identify no culprit and do not explain the loose fastening.' : 'The watch was staffed, but that does not prove every event on the path was seen. Undated tracks identify no culprit and do not explain the reported noise.',
    voices: [
      { id: 'orin', line: '“The families are still on the far bank. I owe them more than another promise.”' },
      { id: 'sera', line: '“There are tracks. I cannot tell you when they were made, or whose they are.”' },
      { id: 'vela', line: repaired ? '“A look at the mud cannot give us back the missing watch hours. The crew still needs its rest.”' : '“Our watch kept its posts. That is not a record of everything that passed.”' }
    ],
    threads: morningWork(state), scene: 'trail-checked'
  };
  return null;
}
