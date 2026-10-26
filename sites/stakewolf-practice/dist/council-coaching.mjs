// SCRUM-38: local reflection on recorded choices, never a proficiency assessment.
import {councilView} from './council.mjs';

const LIMIT = 60;
const count = value => Number.isSafeInteger(value) && value > 0 ? value : 0;
const names = items => items.map(item => item.title).join('; ');
const excerpt = text => {
  const compact = text.replace(/\s+/g, ' ').trim();
  return compact.length > 180 ? `${compact.slice(0, 179)}…` : compact;
};
const closingFacts = view => ({
  topic:view.topic, variantId:view.variantId ?? 'original', capacity:view.capacity, cost:view.cost,
  records:view.records?.filter(row => row.opened).map(row => row.id),
  proposals:view.proposals?.filter(row => row.selected).map(row => row.id),
  commitments:view.commitments?.filter(row => row.selected).map(row => row.id),
  support:view.stakeholders?.map(({id,support,condition}) => ({id,support,condition}))
});

export function buildCouncilCoaching(state, attempt = {}) {
  const view = councilView(state);
  if (view.phase !== 'debrief') return null;
  attempt = attempt && typeof attempt === 'object' ? attempt : {};
  const snapshot = attempt.closed;
  const hasClosingSnapshot = snapshot?.phase === 'council'
    && JSON.stringify(closingFacts(snapshot)) === JSON.stringify(closingFacts(view));
  const close = hasClosingSnapshot ? snapshot : view;
  const opened = view.records.filter(record => record.opened);
  const unopened = view.records.filter(record => !record.opened);
  const selected = view.proposals.find(proposal => proposal.selected);
  const promises = view.commitments.filter(promise => promise.selected);
  const promiseCost = promises.reduce((sum, promise) => sum + promise.cost, 0);
  const room = view.capacity - view.cost;
  const fulfilled = view.debrief.fulfilled;
  const funded = fulfilled.filter(work => work.origin === 'response');
  const deferred = view.debrief.deferred;
  const unused = view.capacity - view.aftermath.cost;
  const rawQuestions = Array.isArray(attempt.questions) ? attempt.questions : [];
  const validQuestions = rawQuestions.filter(message => message
    && ['council','aftermath'].includes(message.phase)
    && view.stakeholders.some(person => person.id === message.speakerId)
    && typeof message.question === 'string'
    && message.question.trim() && message.question.length <= 600);
  const questions = validQuestions.slice(-LIMIT);
  const omitted = count(attempt.droppedQuestions) + Math.max(0, validQuestions.length - LIMIT);
  const offers = questions.filter(message => message.kind === 'inspection'
    && typeof message.topic === 'string' && message.topic.startsWith('source:'));
  const examples = [];
  for (const relevant of [
    message => message.phase === 'council' && message.topic?.startsWith('source:'),
    message => message.phase === 'council' && message.topic === 'support'
  ]) {
    const message = questions.findLast(relevant);
    if (message && !examples.includes(message)) examples.push(message);
  }
  for (const message of questions.slice().reverse()) {
    if (examples.length === 2) break;
    if (!examples.includes(message)) examples.push(message);
  }
  examples.sort((a,b) => questions.indexOf(a) - questions.indexOf(b));

  const questioning = [
    `${opened.length
      ? `You opened ${names(opened)} before closing. Opening a record shows inspection; it does not establish how you understood or used it.`
      : 'No source record was opened before closing. This describes the inspection choices, not your understanding of the public claims.'} Unopened records: ${names(unopened)}. Their contents are not evidence of what you knew. The investigation limit leaves some evidence unknown.`,
    ...opened.map(record => `${record.title} states: ${record.text}`)
  ];
  if (questions.length) {
    for (const message of examples) {
      const person = view.stakeholders.find(person => person.id === message.speakerId);
      questioning.push(`Retained ${message.phase === 'council' ? 'council' : 'aftermath'} message to ${person.name}: “${excerpt(message.question)}”${message.kind === 'clarify' ? ' The local matcher requested clarification; that is not a judgment of the question’s quality.' : ' This is a message example, not proof that a proposed action was confirmed.'}`);
    }
  } else {
    questioning.push('No typed-message examples are available in this attempt log. Preset controls can still inspect sources and make the same decisions; this does not show whether you challenged a claim mentally.');
  }
  const questioningNext = opened.length
    ? `Use ${opened[0].title} to rehearse: “What does this record establish, what remains unknown, and what check would justify the next claim?” Explain how that distinction affects ${selected.title.toLowerCase()}.`
    : `On replay, choose a public claim to examine and ask which record could test it. For example, ask what ${view.records[0].title} covers before deciding whether to spend an investigation on it.`;

  const negotiation = [
    `Confirmed approach: ${selected.title}. ${selected.detail}`,
    promises.length
      ? `Confirmed promises: ${promises.map(promise => `${promise.title} (${promise.cost} ${promise.cost === 1 ? 'unit' : 'units'})`).join('; ')}.`
      : 'You closed without reserving any promises. That kept capacity available and left the displayed support conditions as they stood.',
    ...close.stakeholders.map(person => `${person.name} ${person.support === 'supports' ? 'supported the approach' : person.support === 'opposes' ? 'opposed the approach' : 'offered conditional support'} at closing: ${person.condition}`)
  ];
  const negotiationNext = promises.length
    ? `Compare keeping “${promises[0].title}” with leaving its ${promises[0].cost} ${promises[0].cost === 1 ? 'unit' : 'units'} available. Ask the affected stakeholder what public concern the promise addresses, then explain which trade-off you would defend.`
    : `Pick one closing support condition and ask what concrete commitment it would require. Compare its capacity cost with keeping room for response work; explain why you would accept or decline it.`;

  const consequences = [
    ...fulfilled.filter(work => work.origin === 'decision').map(work => `Agreed work: ${work.title}. ${work.detail}`),
    promises.length
      ? `${promises.length} ${promises.length === 1 ? 'promise was' : 'promises were'} delivered automatically from reserved capacity. This is not evidence of discretionary follow-through; your later choice was which additional response to fund or defer.`
      : 'There were no reserved promises to deliver. Your later choice was which additional response to fund or defer.',
    ...funded.map(work => `You funded ${work.title} (${work.cost} units). ${work.detail}`),
    ...deferred.map(work => `You deferred ${work.title} (${work.cost} units). ${work.detail}`),
    `The council reservation left ${room} units for new information. The final plan left ${unused} ${unused === 1 ? 'unit' : 'units'} unused. Spending every unit is not itself an objective.`
  ];
  const nextWork = deferred.find(work => work.cost <= unused) || deferred[0];
  const consequencesNext = !nextWork
    ? 'Rehearse the limits of the funded outcomes: what remains unverified, and what would change the next decision?'
    : nextWork.cost <= unused
    ? `“${nextWork.title}” would fit in the ${unused} unused units. Rehearse an explicit reason to fund it or leave it deferred, including the stated consequence and what evidence would change that decision.`
    : `Compare funding “${nextWork.title}” with your current plan on replay. Name which reservation or response you would need to change, the consequence of that change, and why you would keep or revise your choice.`;

  const limits = [
    'This is deterministic, local reflection from public records, confirmed choices and retained message examples. It does not measure professional competence or infer whether you understood a source.',
    'Private objectives revealed at the end are not used to judge your earlier choices. New aftermath evidence is discussed as a response challenge, not something you should have known before closing.',
    'The record cannot establish your unstated reasoning or real-world results. More inspections, more support, more promises or more spending do not guarantee a better decision.',
    'Support describes a negotiated position, not decision quality. Unanimity and a larger number of promises are not universal goals.',
    'At most 60 typed messages are retained per attempt. Up to two shortened examples prioritize council source and support questions; they do not represent a complete conversation.'
  ];
  if (offers.length) limits.push(`${offers.length} retained typed ${offers.length === 1 ? 'message offered' : 'messages offered'} a source inspection. An offer alone does not open a record.`);
  if (!hasClosingSnapshot) limits.push('A matching pre-commit snapshot was unavailable. Closing facts are reconstructed from the completed council’s locked approach, sources, promises and support conditions.');
  if (omitted) limits.push(`The question log is incomplete: ${omitted} ${omitted === 1 ? 'message was' : 'messages were'} not retained for this feedback. Examples are drawn only from the retained log.`);
  if (count(attempt.droppedEvents)) limits.push(`The action log omitted ${count(attempt.droppedEvents)} events. Capacity and outcomes above come from the final confirmed state, not action counts.`);
  return {
    sections:[
      {id:'questioning',title:'Questioning claims',summary:`You inspected ${opened.length} of ${view.records.length} records before closing, with at most ${view.investigation.limit} available to inspect.`,observations:questioning,next:questioningNext},
      {id:'negotiation',title:'Negotiating support',summary:`The approach reserved 2 units; promises reserved ${promiseCost}. That left ${room} of ${view.capacity} units for new information.`,observations:negotiation,next:negotiationNext},
      {id:'consequences',title:'Living with consequences',summary:`You funded ${funded.length} additional ${funded.length === 1 ? 'response' : 'responses'} and deferred ${deferred.length}, using ${view.aftermath.cost} of ${view.capacity} units.`,observations:consequences,next:consequencesNext}
    ],
    rehearsal:[questioningNext,negotiationNext,consequencesNext],
    limits
  };
}
