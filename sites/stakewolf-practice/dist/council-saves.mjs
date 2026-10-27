// SCRUM-38: completed, browser-local snapshots. No resume, cloud sync or scoring.
import {createCouncil,councilView} from './council.mjs';
import {buildCouncilCoaching} from './council-coaching.mjs';

export const STORAGE_KEY = 'stakewolf.councils.v1';
export const MAX_SAVED = 20;
const CASE_VERSION = 'council-v1';
// Keep the original snapshot schema intact: suffixes identify reviewed situations.
export const savedCouncilVariant = item => ({'council-v1':'original','council-v1:b':'b','council-v1:c':'c'})[item?.caseVersion] ?? null;
export const savedCouncilLabel = item => ({original:'Situation A',b:'Situation B',c:'Situation C'})[savedCouncilVariant(item)] ?? 'Unknown situation';
const MAX_BYTES = 1024 * 1024;
const corrupt = 'Saved councils could not be read safely. They have been kept unchanged. Clear saved councils to start again.';
const unavailable = 'Browser storage is unavailable. Completed councils cannot be saved or loaded.';
const fields = ['schemaVersion','caseVersion','id','completedAt','origin','topic','title','decision','records','promises','support','reserved','used','capacity','fulfilled','deferred','questionCount','feedback'];
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const keys = (value, expected) => object(value) && Object.keys(value).length === expected.length && expected.every(key => Object.hasOwn(value,key));
const text = (value,max=4000) => typeof value === 'string' && value.length > 0 && value.length <= max;
const id = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,100}$/.test(value);
const integer = (value,max) => Number.isSafeInteger(value) && value >= 0 && value <= max;
const iso = value => typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString() === value;
const list = (value,max,valid) => Array.isArray(value) && value.length <= max && value.every(valid);
const unique = value => new Set(value.map(row => row.id)).size === value.length;
const named = row => keys(row,['id','title']) && id(row.id) && text(row.title,200);
const freeze = value => {
  if (value && typeof value === 'object') {Object.values(value).forEach(freeze); Object.freeze(value);}
  return value;
};
const copy = value => JSON.parse(JSON.stringify(value));
const recent = items => items.slice().sort((a,b) => b.completedAt.localeCompare(a.completedAt) || a.id.localeCompare(b.id)).slice(0,MAX_SAVED);
const result = (items=[],error=null) => ({items:freeze(copy(items)),error});
const names = rows => rows.map(row => row.title).join('; ') || 'None';

function facts(view) {
  const chosen = view.proposals.find(row => row.selected);
  return {
    topic:view.topic,title:view.title,decision:{id:chosen.id,title:chosen.title},
    records:view.records.filter(row => row.opened).map(({id,title}) => ({id,title})),
    promises:view.commitments.filter(row => row.selected).map(({id,title,cost}) => ({id,title,cost})),
    support:view.stakeholders.map(({id,name,support}) => ({id,name,support})),
    reserved:view.cost,used:view.aftermath.cost,capacity:view.capacity,
    fulfilled:view.debrief.fulfilled.map(({id,title}) => ({id,title})),
    deferred:view.debrief.deferred.map(({id,title,detail}) => ({id,title,detail}))
  };
}

function validFeedback(value) {
  return keys(value,['sections','rehearsal','limits'])
    && Array.isArray(value.sections) && value.sections.length === 3
    && value.sections.every((row,index) => keys(row,['id','title','summary','observations','next'])
      && row.id === ['questioning','negotiation','consequences'][index]
      && text(row.title,200) && text(row.summary) && text(row.next)
      && list(row.observations,12,line => text(line)) && row.observations.length > 0)
    && list(value.rehearsal,3,line => text(line)) && value.rehearsal.length === 3
    && list(value.limits,10,line => text(line)) && value.limits.length >= 5;
}

function validSnapshot(value) {
  if (!keys(value,fields) || value.schemaVersion !== 1 || !savedCouncilVariant(value)
    || !id(value.id) || !iso(value.completedAt) || !text(value.origin,80)
    || !['accessibility','systems'].includes(value.topic) || !text(value.title,200)
    || !named(value.decision) || !list(value.records,2,named) || !unique(value.records)
    || !list(value.promises,3,row => keys(row,['id','title','cost']) && id(row.id) && text(row.title,200) && integer(row.cost,6)) || !unique(value.promises)
    || !list(value.support,3,row => keys(row,['id','name','support']) && id(row.id) && text(row.name,100) && ['supports','conditional','opposes'].includes(row.support)) || !unique(value.support)
    || !integer(value.capacity,6) || value.capacity !== 6 || !integer(value.reserved,6) || !integer(value.used,6) || value.used < value.reserved
    || !list(value.fulfilled,6,named) || !unique(value.fulfilled)
    || !list(value.deferred,2,row => keys(row,['id','title','detail']) && id(row.id) && text(row.title,200) && text(row.detail)) || !unique(value.deferred)
    || !integer(value.questionCount,60) || !validFeedback(value.feedback)) return false;
  // Reconstruct only to validate public facts; saved feedback is never regenerated.
  try {
    const base = createCouncil(value.topic,savedCouncilVariant(value));
    const commitments = value.promises.map(row => row.id);
    const reservedIds = [`${value.decision.id}-work`,...commitments.map(id => `promise-${id}`)];
    const state = {...base,phase:'debrief',proposalId:value.decision.id,opened:value.records.map(row => row.id),commitmentIds:commitments,workIds:value.fulfilled.filter(row => !reservedIds.includes(row.id)).map(row => row.id)};
    const expected = facts(councilView(state));
    return Object.keys(expected).every(key => JSON.stringify(expected[key]) === JSON.stringify(value[key]));
  } catch { return false; }
}

export function createSavedCouncil(state,attempt={},metadata={}) {
  try {
    const view = councilView(state);
    if (view.phase !== 'debrief') return null;
    const questions = Array.isArray(attempt?.questions) ? attempt.questions : [];
    const snapshot = {
      schemaVersion:1,caseVersion:view.variantId && view.variantId !== 'original' ? `${CASE_VERSION}:${view.variantId}` : CASE_VERSION,id:metadata.id,completedAt:metadata.completedAt,
      origin:metadata.origin ?? 'practice',...facts(view),
      questionCount:Math.min(60,questions.filter(row => row && ['council','aftermath'].includes(row.phase)
        && view.stakeholders.some(person => person.id === row.speakerId)
        && typeof row.question === 'string' && row.question.trim() && row.question.length <= 600).length),
      feedback:buildCouncilCoaching(state,attempt)
    };
    return validSnapshot(snapshot) ? freeze(copy(snapshot)) : null;
  } catch { return null; }
}

export function loadSavedCouncils(storage) {
  let raw;
  try {
    if (!storage || typeof storage.getItem !== 'function') return result([],unavailable);
    raw = storage.getItem(STORAGE_KEY);
  } catch { return result([],unavailable); }
  if (raw === null) return result();
  if (typeof raw !== 'string' || raw.length > MAX_BYTES) return result([],corrupt);
  try {
    const saved = JSON.parse(raw);
    if (!keys(saved,['schemaVersion','items']) || saved.schemaVersion !== 1
      || !list(saved.items,MAX_SAVED,validSnapshot) || !unique(saved.items)) return result([],corrupt);
    return result(recent(saved.items));
  } catch { return result([],corrupt); }
}

function write(storage,items,previous) {
  try {
    if (!storage || typeof storage.setItem !== 'function') return result(previous,unavailable);
    const serialized = JSON.stringify({schemaVersion:1,items});
    if (serialized.length > MAX_BYTES) return result(previous,'This council is too large to save. Existing saved councils are unchanged.');
    storage.setItem(STORAGE_KEY,serialized);
    return result(items);
  } catch { return result(previous,'The browser could not save this change. Storage may be full or disabled. Existing saved councils are unchanged.'); }
}

export function saveCouncil(storage,snapshot) {
  const previous = loadSavedCouncils(storage);
  if (previous.error) return previous;
  try {
    if (!validSnapshot(snapshot)) return result(previous.items,'This completed council could not be saved safely. Existing saved councils are unchanged.');
    const existing = previous.items.find(row => row.id === snapshot.id);
    if (existing) return JSON.stringify(existing) === JSON.stringify(snapshot)
      ? previous : result(previous.items,'This council is already saved. Its original snapshot has been kept unchanged.');
    const items = recent([copy(snapshot),...previous.items.filter(row => row.id !== snapshot.id)]);
    if (!items.some(row => row.id === snapshot.id)) return result(previous.items,'History already holds 20 more recent councils. This older council was not saved.');
    return write(storage,items,previous.items);
  } catch { return result(previous.items,'This completed council could not be saved safely. Existing saved councils are unchanged.'); }
}

export function deleteSavedCouncil(storage,snapshotId) {
  const previous = loadSavedCouncils(storage);
  if (previous.error) return previous;
  const items = previous.items.filter(row => row.id !== snapshotId);
  return items.length === previous.items.length ? previous : write(storage,items,previous.items);
}

export function clearSavedCouncils(storage) {
  const previous = loadSavedCouncils(storage);
  try {
    if (!storage || typeof storage.removeItem !== 'function') return result(previous.items,'Browser storage is unavailable. Saved councils could not be cleared.');
    storage.removeItem(STORAGE_KEY);
    return result();
  } catch { return result(previous.items,'The browser could not clear saved councils. They have been kept unchanged.'); }
}

export function compareSavedCouncils(older,newer) {
  try {
    if (!validSnapshot(older) || !validSnapshot(newer) || older.id === newer.id
      || older.topic !== newer.topic) return null;
    const sameSituation = older.caseVersion === newer.caseVersion;
    const rows = [
      {label:'Situation',before:`${savedCouncilLabel(older)} — ${older.title}`,after:`${savedCouncilLabel(newer)} — ${newer.title}`},
      {label:'Records opened',before:names(older.records),after:names(newer.records)},
      {label:'Retained messages',before:String(older.questionCount),after:String(newer.questionCount)},
      {label:'Confirmed approach',before:older.decision.title,after:newer.decision.title},
      {label:'Promises reserved',before:names(older.promises),after:names(newer.promises)},
      ...older.support.map(person => ({label:`${person.name} at closing`,before:person.support,after:newer.support.find(row => row.id === person.id).support})),
      {label:'Council capacity reserved',before:`${older.reserved} of ${older.capacity}`,after:`${newer.reserved} of ${newer.capacity}`},
      {label:'Final capacity used',before:`${older.used} of ${older.capacity}`,after:`${newer.used} of ${newer.capacity}`},
      {label:'Delivered work',before:names(older.fulfilled),after:names(newer.fulfilled)},
      {label:'Deferred work',before:names(older.deferred),after:names(newer.deferred)}
    ];
    const changes = rows.filter(row => row.before !== row.after).map(row => `${row.label}: “${row.before}” → “${row.after}”.`);
    if (!changes.length) changes.push('These attempts recorded the same evidence, approach, promises, support and work. Their reasoning may still differ; it was not measured.');
    return freeze({rows,changes,sameSituation,
      context:sameSituation ? 'Same situation: the evidence and objectives are unchanged. Use this to examine a different decision, with the benefit of hindsight.' : 'Different situations: evidence, stakeholder objectives and consequences changed. The same record name can contain different findings. Differences in support or delivery are not a like-for-like improvement score.',
      prompt:'Choose one changed decision or trade-off. What evidence justified it, what did it leave unresolved, and what would make you choose differently?',
      limits:[
        sameSituation ? 'A retry knows the same fixed case, including its later evidence and revealed motives. This comparison is not a blind assessment or proof of improved skill.' : 'Different authored situations let you practise applying judgment, but their difficulty is not calibrated. This comparison is not a blind assessment or proof of improved skill.',
        'More records, support, promises or spending do not establish a better decision. These are recorded differences, not scores.',
        'Delivered promises followed automatically from reserved capacity. Additional response choices and deferred consequences should be considered separately.',
        'Saved feedback is the original bounded text. It is not regenerated; no full job description or complete conversation is saved.'
      ]});
  } catch { return null; }
}
