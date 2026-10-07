import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame, beginGame, currentRound, askQuestion, decide, advance,
  getPlayerEvents, getDebrief, recordRetentionFinding,
} from '../public/engine.js';
import { DOSSIER_ARTIFACTS } from '../public/scenario.js';

const people = ['mara', 'ishan', 'leah', 'theo'];
const sorted = rows => [...rows].sort();
const eventFor = (state, ruleId) => {
  const rows = state.events.filter(event => event.ruleId === ruleId);
  assert.equal(rows.length, 1, `expected exactly one ${ruleId}`);
  return rows[0];
};
const artifact = (state, id) => state.artifacts.find(row => row.artifactId === id);
const artifactEvent = (state, id) => eventFor(state, `artifact:acquire:${id}`);
const noEffect = event => {
  for (const group of ['metrics', 'relationships']) {
    assert.ok(Object.values(event.effects[group].requested).every(value => value === 0), `${event.ruleId} requested ${group} effects`);
    assert.ok(Object.values(event.effects[group].actual).every(value => value === 0), `${event.ruleId} applied ${group} effects`);
  }
};

// PATH-A's R1/R2 interview and decision vectors from the reviewed v1 path.
// It reaches R3 at 52/74/76 and leaves both R3 questions available.
function reachR3PathA() {
  let state = beginGame(createGame());
  state = askQuestion(state, 'ishan', 'failure');
  state = askQuestion(state, 'mara', 'mara-pressure');
  state = decide(state, 'pilot');
  state = advance(state);
  state = askQuestion(state, 'ishan', 'retention-fix');
  state = askQuestion(state, 'leah', 'data-promise');
  state = decide(state, 'explicit');
  state = advance(state);
  assert.equal(currentRound(state).id, 'rumor');
  assert.deepEqual([state.metrics.delivery, state.metrics.trust, state.metrics.quality], [52, 74, 76]);
  return state;
}

function reachR3QuietForNoteEdit() {
  let state = beginGame(createGame());
  state = decide(state, 'pilot');
  state = advance(state);
  state = askQuestion(state, 'ishan', 'retention-fix');
  state = askQuestion(state, 'leah', 'data-promise');
  state = recordRetentionFinding(state, 'scope-separated');
  state = decide(state, 'quiet');
  state = advance(state);
  assert.equal(currentRound(state).id, 'rumor');
  return state;
}

function round3Choice(choice, state = reachR3PathA()) {
  return decide(state, choice);
}

test('R3 entry exposes only the KB-09 index and crop, not the full note or Mara admission', () => {
  const state = reachR3PathA();
  const note = eventFor(state, 'story:planning-note');
  const rumor = eventFor(state, 'story:rumor-circulates');
  const admission = eventFor(state, 'story:crop-admission');
  const entryIds = state.artifacts.map(row => row.artifactId).filter(id => id.startsWith('KB-09'));
  assert.deepEqual(entryIds, ['KB-09', 'KB-09b']);
  assert.equal(artifact(state, 'KB-09a'), undefined);
  assert.equal(artifact(state, 'KB-09c'), undefined);
  assert.deepEqual(note.audience, ['ishan', 'leah']);
  assert.equal(note.playerVisible, false);
  assert.equal(note.round, 3);
  assert.equal(note.details.authoredAt, 'Monday · 08:15');
  assert.ok(state.knowledge.ishan.includes(note.eventId));
  assert.ok(state.knowledge.leah.includes(note.eventId));
  assert.ok(!state.knowledge.player.includes(note.eventId));
  assert.deepEqual(admission.audience, ['mara']);
  assert.equal(admission.playerVisible, false);
  assert.ok(!state.knowledge.player.includes(admission.eventId));
  assert.equal(rumor.evidenceStatus, 'unverified-claim');
  assert.equal(rumor.details.widerSpread, 'unattributed');
  assert.match(rumor.details.captionStatus, /interpretation, not source wording/i);

  for (const id of ['KB-09', 'KB-09b']) {
    const row = artifact(state, id), event = artifactEvent(state, id);
    const authored = DOSSIER_ARTIFACTS.find(item => item.id === id);
    assert.equal(event.round, 3);
    assert.equal(event.details.time, authored.time);
    assert.equal(row.acquiredAtRound, 3);
    assert.equal(row.sequence, event.sequence);
    assert.deepEqual(event.sourceEventIds, [rumor.eventId]);
    assert.deepEqual(event.audience, ['player']);
    noEffect(event);
  }
  assert.equal(artifactEvent(state, 'KB-09').details.text.includes('limited launch safe'), false,
    'the index must not disclose the child record content');
  assert.match(artifactEvent(state, 'KB-09b').details.text, /caption is added interpretation/i);
  assert.doesNotMatch(artifactEvent(state, 'KB-09b').details.text, /Mara shared (?:a )?crop with two leads/i,
    'the crop does not reveal Mara’s separate admission');
  const visible = getPlayerEvents(state);
  assert.ok(visible.some(event => event.eventId === rumor.eventId));
  assert.ok(!visible.some(event => event.eventId === note.eventId || event.eventId === admission.eventId));
  const visibleText = JSON.stringify(visible);
  assert.doesNotMatch(visibleText, /What evidence would make a limited launch safe/);
  assert.doesNotMatch(visibleText, /Mara shared a crop with two leads/);
});

test('KB-09a requires Ishan full-thread or a permitted decision; its earlier authoring date is not backdated discovery', () => {
  let early = beginGame(createGame());
  assert.throws(() => askQuestion(early, 'ishan', 'full-thread'), /question from this round/i);
  early = advance(decide(early, 'pilot'));
  assert.throws(() => askQuestion(early, 'ishan', 'full-thread'), /question from this round/i,
    'the R3 full-thread route is unavailable in R2');
  assert.equal(early.artifacts.some(row => row.artifactId.startsWith('KB-09')), false);

  const start = reachR3PathA();
  const before = structuredClone(start);
  assert.throws(() => askQuestion(start, 'mara', 'full-thread'), /question from this round/i);
  assert.deepEqual(start, before, 'wrong-person access must not mutate the run');

  const state = askQuestion(start, 'ishan', 'full-thread');
  const question = eventFor(state, 'question:rumor:full-thread');
  const note = eventFor(state, 'story:planning-note');
  const acquired = artifactEvent(state, 'KB-09a');
  assert.equal(currentRound(start).conversations.ishan.find(item => item.id === 'full-thread').question,
    'What does the complete planning note say, and when was it written?');
  assert.equal(state.evidence.find(item => item.id === 'full-thread').question,
    'What does the complete planning note say, and when was it written?');
  assert.equal(question.actor, 'ishan');
  assert.ok(question.sourceEventIds.includes(note.eventId));
  assert.equal(acquired.details.acquiredVia, question.ruleId);
  assert.deepEqual(acquired.sourceEventIds, [question.eventId]);
  assert.equal(acquired.details.time, 'Monday · 08:15');
  assert.equal(acquired.round, 3);
  assert.equal(artifact(state, 'KB-09a').acquiredAtRound, 3);
  assert.ok(artifact(state, 'KB-09a').sequence > note.sequence);
  assert.ok(artifact(state, 'KB-09a').sequence > question.sequence);
  assert.deepEqual(acquired.audience, ['player']);
  assert.ok(state.knowledge.player.includes(note.eventId));
  assert.ok(state.knowledge.ishan.includes(note.eventId));
  assert.ok(state.knowledge.leah.includes(note.eventId), 'Leah keeps her independent prior note access');
  assert.ok(!state.knowledge.mara.includes(note.eventId));
  assert.ok(!state.knowledge.theo.includes(note.eventId));
  assert.equal(artifact(state, 'KB-09c'), undefined);
  assert.equal(state.talksLeft, 1);
  assert.equal(question.round, 3);
  assert.match(question.details.text, /not a statement made by you in this attempt/i);
  assert.match(question.details.text, /Monday at 08:15/i);

  const afterFirst = structuredClone(state);
  assert.throws(() => askQuestion(state, 'ishan', 'full-thread'), /already asked/i);
  assert.deepEqual(state, afterFirst, 'a repeated question cannot create another event or acquisition');
});

test('KB-09c is unlocked only by Mara screenshot-source and preserves the limited admission audience', () => {
  const start = reachR3PathA();
  const before = structuredClone(start);
  assert.throws(() => askQuestion(start, 'theo', 'screenshot-source'), /question from this round/i);
  assert.deepEqual(start, before, 'a different stakeholder cannot unlock Mara’s record');

  const state = askQuestion(start, 'mara', 'screenshot-source');
  const question = eventFor(state, 'question:rumor:screenshot-source');
  const privateAdmission = eventFor(state, 'story:crop-admission');
  const acquired = artifactEvent(state, 'KB-09c');
  assert.equal(currentRound(start).conversations.mara.find(item => item.id === 'screenshot-source').question,
    'What did you share, what wording did you add, and what can you actually confirm about its spread?');
  assert.equal(state.evidence.find(item => item.id === 'screenshot-source').question,
    'What did you share, what wording did you add, and what can you actually confirm about its spread?');
  assert.equal(question.actor, 'mara');
  assert.ok(question.sourceEventIds.includes(privateAdmission.eventId));
  assert.deepEqual(acquired.sourceEventIds, [question.eventId]);
  assert.deepEqual(acquired.audience, ['player', 'mara']);
  assert.equal(acquired.round, 3);
  assert.equal(artifact(state, 'KB-09c').acquiredAtRound, 3);
  assert.equal(artifact(state, 'KB-09c').sequence, acquired.sequence);
  assert.equal(acquired.details.time, 'Tuesday · 09:20');
  for (const person of ['player', 'mara']) assert.ok(state.knowledge[person].includes(acquired.eventId));
  for (const person of ['ishan', 'leah', 'theo']) assert.ok(!state.knowledge[person].includes(acquired.eventId));
  assert.match(acquired.details.text, /two leads/);
  assert.match(acquired.details.text, /cannot confirm any wider circulation/i);
  assert.match(acquired.details.text, /her interpretation, not wording in the note/i);
  assert.doesNotMatch(acquired.details.text, /player wrote|player's decision/i);
  assert.equal(artifact(state, 'KB-09a'), undefined);
  assert.equal(state.talksLeft, 1);
});

test('open correction cites the note and rumor, shares only the public correction, and keeps authored R3 effects', () => {
  const state = round3Choice('open');
  const decision = eventFor(state, 'choice:rumor:open');
  const rumor = eventFor(state, 'story:rumor-circulates');
  const note = eventFor(state, 'story:planning-note');
  const disclosure = eventFor(state, 'disclosure:rumor:open');
  assert.deepEqual(disclosure.sourceEventIds, [decision.eventId, rumor.eventId, note.eventId]);
  assert.deepEqual(disclosure.audience, ['player', ...people, 'engineering-channel']);
  for (const recipient of ['player', ...people]) assert.ok(state.knowledge[recipient].includes(note.eventId));
  assert.ok(state.knowledge['engineering-channel'].includes(note.eventId));
  assert.ok(!state.knowledge.player.includes(eventFor(state, 'story:crop-admission').eventId));
  assert.equal(artifactEvent(state, 'KB-09a').sourceEventIds[0], disclosure.eventId,
    'the open route may acquire the source from its actual disclosure event');
  assert.equal(artifact(state, 'KB-09c'), undefined);
  assert.deepEqual([state.metrics.delivery, state.metrics.trust, state.metrics.quality], [47, 87, 79]);
  assert.deepEqual(decision.effects.metrics.requested, { delivery: -5, trust: 13, quality: 3 });
  assert.equal(decision.bonus.eligible, false, 'open can correct the record without requiring an interview');
  assert.equal(decision.bonus.applied, 0);
  assert.equal(decision.bonus.sourceEventId, null);
  assert.match(disclosure.details.text, /wider spread remains unattributed/i);
  assert.doesNotMatch(disclosure.details.text, /Mara shared the crop with two leads/i);
  noEffect(disclosure);
});

test('R3 full-thread evidence produces only the established open-choice bonus', () => {
  const state = round3Choice('open', askQuestion(reachR3PathA(), 'ishan', 'full-thread'));
  const decision = eventFor(state, 'choice:rumor:open');
  const question = eventFor(state, 'question:rumor:full-thread');
  assert.deepEqual([state.metrics.delivery, state.metrics.trust, state.metrics.quality], [47, 91, 79]);
  assert.equal(decision.bonus.eligible, true);
  assert.equal(decision.bonus.applied, 4);
  assert.equal(decision.bonus.sourceEventId, question.eventId);
  assert.ok(decision.sourceEventIds.includes(question.eventId));
  assert.equal(state.talksLeft, 1);
});

test('R3 has two questions total; opening or rereading records does not refill the budget', () => {
  let state = reachR3PathA();
  state = askQuestion(state, 'ishan', 'full-thread');
  state = askQuestion(state, 'mara', 'screenshot-source');
  assert.equal(state.talksLeft, 0);
  const afterTwo = structuredClone(state);
  assert.throws(() => askQuestion(state, 'mara', 'mara-reset'), /used both conversations/i);
  assert.deepEqual(state, afterTwo);
  const firstRead = getPlayerEvents(state);
  const secondRead = getPlayerEvents(state);
  assert.deepEqual(secondRead, firstRead);
  assert.deepEqual(state, afterTwo, 'reopening the dossier cannot consume a conversation or change source access');
});

test('broker grants only the scoped note and leadership update; Theo receives a next-round summary', () => {
  const state = round3Choice('broker');
  const decision = eventFor(state, 'choice:rumor:broker');
  const rumor = eventFor(state, 'story:rumor-circulates');
  const note = eventFor(state, 'story:planning-note');
  const disclosure = eventFor(state, 'disclosure:rumor:broker');
  assert.deepEqual(disclosure.sourceEventIds, [decision.eventId, rumor.eventId, note.eventId]);
  assert.deepEqual(disclosure.audience, ['player', 'mara', 'ishan']);
  for (const person of ['player', 'mara', 'ishan']) assert.ok(state.knowledge[person].includes(note.eventId));
  assert.ok(state.knowledge.leah.includes(note.eventId), 'Leah retains prior access but does not receive the new agreement');
  assert.ok(!state.knowledge.theo.includes(note.eventId));
  assert.ok(!state.knowledge.leah.includes(disclosure.eventId));
  assert.ok(!state.knowledge.theo.includes(disclosure.eventId));
  assert.equal(artifactEvent(state, 'KB-09a').sourceEventIds[0], disclosure.eventId);
  assert.equal(artifact(state, 'KB-09c'), undefined);
  assert.deepEqual([state.metrics.delivery, state.metrics.trust, state.metrics.quality], [55, 79, 77]);
  noEffect(disclosure);

  const nextRound = advance(state);
  const summary = eventFor(nextRound, 'delay:rumor:broker');
  assert.ok(nextRound.knowledge.theo.includes(summary.eventId));
  assert.ok(!nextRound.knowledge.theo.includes(note.eventId));
  assert.ok(!nextRound.knowledge.theo.includes(disclosure.eventId));
  assert.match(summary.details.text, /joint leadership update/i);
  assert.ok(!nextRound.knowledge.theo.includes(artifactEvent(state, 'KB-09a').eventId));
});

test('ignoring the crop grants no note or admission and keeps the delayed defect private', () => {
  const state = round3Choice('ignore');
  const decision = eventFor(state, 'choice:rumor:ignore');
  const rumor = eventFor(state, 'story:rumor-circulates');
  assert.equal(state.events.some(event => event.ruleId.startsWith('disclosure:rumor:')), false);
  assert.equal(artifact(state, 'KB-09a'), undefined);
  assert.equal(artifact(state, 'KB-09c'), undefined);
  assert.ok(!state.knowledge.player.includes(eventFor(state, 'story:planning-note').eventId));
  assert.ok(!state.knowledge.player.includes(eventFor(state, 'story:crop-admission').eventId));
  assert.equal(rumor.details.status, 'uncorrected');
  assert.deepEqual([state.metrics.delivery, state.metrics.trust, state.metrics.quality], [61, 60, 71]);
  assert.deepEqual(decision.effects.metrics.requested, { delivery: 9, trust: -14, quality: -5 });
  noEffect(rumor);

  const nextRound = advance(state);
  const defect = eventFor(nextRound, 'delay:rumor:ignore');
  assert.deepEqual(defect.audience, ['ishan', 'player']);
  assert.ok(nextRound.knowledge.ishan.includes(defect.eventId));
  for (const person of ['mara', 'leah', 'theo']) assert.ok(!nextRound.knowledge[person].includes(defect.eventId));
  assert.ok(!nextRound.knowledge.theo.includes(eventFor(nextRound, 'story:planning-note').eventId));
});

test('re-reading and revising an investigation note is free; restart isolates all R3 records', () => {
  let state = reachR3QuietForNoteEdit();
  const before = structuredClone(state);
  const visibleOnce = getPlayerEvents(state);
  const visibleTwice = getPlayerEvents(state);
  assert.deepEqual(visibleTwice, visibleOnce);
  assert.deepEqual(state, before, 'reading the acquired evidence cannot change state');

  state = recordRetentionFinding(state, 'unresolved');
  assert.equal(state.events.filter(event => event.type === 'question' && event.round === 3).length, 0);
  assert.equal(state.talksLeft, before.talksLeft);
  assert.deepEqual(state.metrics, before.metrics);
  assert.deepEqual(state.relationships, before.relationships);
  assert.deepEqual(state.artifacts, before.artifacts, 'editing a note does not unlock dossier children');
  for (const person of people) assert.deepEqual(state.knowledge[person], before.knowledge[person],
    'editing a note cannot grant another stakeholder knowledge');
  const revised = state.events.filter(event => event.type === 'finding' && event.details.findingId === 'default-is-not-cleanup');
  assert.equal(revised.length, 2);
  assert.equal(revised[0].details.recordedAtRound, 2);
  assert.equal(revised[1].details.recordedAtRound, 3);
  const playerKnowledgeDelta = state.knowledge.player.filter(id => !before.knowledge.player.includes(id));
  assert.deepEqual(playerKnowledgeDelta, [revised[1].eventId]);
  for (const event of revised) noEffect(event);

  const oldRun = state.runId;
  const fresh = beginGame(createGame());
  assert.notEqual(fresh.runId, oldRun);
  assert.deepEqual(fresh.artifacts.map(row => row.artifactId), ['KB-01', 'KB-04']);
  assert.deepEqual(fresh.evidence, []);
  assert.deepEqual(fresh.findings, []);
  assert.equal(fresh.events.some(event => event.ruleId.startsWith('story:rumor') || event.ruleId.startsWith('artifact:acquire:KB-09')), false);
  assert.deepEqual(fresh.knowledge.player, fresh.events.filter(event => event.audience.includes('player')).map(event => event.eventId));
});

test('R3 source access errors and repeated reads cannot be used to forge a completed disclosure trace', () => {
  const opened = round3Choice('open');
  const completed = advance(decide(advance(opened), 'core'));
  // Continue with two valid decisions so the audited projection can be evaluated.
  let state = completed;
  state = decide(state, 'evidence');
  state = advance(state);
  const valid = getDebrief(state);
  assert.equal(valid.decisions[2].choiceId, 'open');
  assert.ok(valid.citations.some(item => item.eventId === eventFor(state, 'choice:rumor:open').eventId));

  const forged = structuredClone(state);
  const disclosure = forged.events.find(event => event.ruleId === 'disclosure:rumor:open');
  disclosure.audience = ['player', 'mara', 'ishan'];
  assert.throws(() => getDebrief(forged), /broken event citation trace|contradictory R3 disclosure audience/i);
});

