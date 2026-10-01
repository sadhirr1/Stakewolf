import { PEOPLE, ROUNDS } from './scenario.js';

// The simulation is intentionally deterministic. Language never changes state
// until the player confirms one of the three explicit approaches for the round.
export const METRICS = ['delivery', 'trust', 'quality'];
export function createGame() {
  return { version: 1, phase: 'briefing', round: 0, metrics: {delivery:50,trust:55,quality:50}, relationships: Object.fromEntries(PEOPLE.map(p=>[p.id,50])), flags: [], evidence: [], asked: [], talksLeft: 2, history: [], arrival: null };
}
const copy = s => structuredClone(s);
const clamp = value => Math.max(0, Math.min(100, value));
const requirePlay = s => { if (s.phase !== 'play') throw new Error('There is no active decision right now.'); };
export function beginGame(state) {
  if (state.phase !== 'briefing') throw new Error('This attempt has already started.');
  return {...copy(state), phase:'play'};
}
export function currentRound(state) { return ROUNDS[state.round]; }
export function askQuestion(state, personId, questionId) {
  requirePlay(state);
  const person = PEOPLE.find(p=>p.id===personId);
  const question = currentRound(state).conversations[personId]?.find(q=>q.id===questionId);
  if (!person || !question) throw new Error('Choose a question from this round.');
  if (state.asked.includes(questionId)) throw new Error('You already asked this question.');
  if (state.talksLeft < 1) throw new Error('You have used both conversations this round.');
  const next = copy(state);
  next.talksLeft--;
  next.asked.push(questionId);
  next.evidence.push({id:question.id,round:state.round,person:personId,title:question.title,text:question.evidence,kind:question.kind,question:question.question,answer:question.answer});
  next.relationships[personId]=clamp(next.relationships[personId]+2);
  return next;
}
function shiftMetrics(state, delta) {
  const actual = {};
  for (const key of METRICS) { const old=state.metrics[key]; state.metrics[key]=clamp(old+(delta[key]||0)); actual[key]=state.metrics[key]-old; }
  return actual;
}
export function decide(state, choiceId, writtenDecision='') {
  requirePlay(state);
  const round = currentRound(state);
  const choice = round.choices.find(c=>c.id===choiceId);
  if (!choice) throw new Error('Choose a valid approach.');
  if (typeof writtenDecision !== 'string' || writtenDecision.length>1200) throw new Error('Keep your decision within 1,200 characters.');
  if (writtenDecision && writtenDecision.trim().length<20) throw new Error('Add a little more detail to your decision.');
  const next=copy(state);
  const effects={...choice.delta};
  let bonus=null;
  if (choice.evidenceBonus && state.evidence.some(e=>e.id===choice.evidenceBonus.id)) {
    const b=choice.evidenceBonus;
    effects[b.metric]=(effects[b.metric]||0)+b.amount;
    bonus=b.reason;
  }
  const actual=shiftMetrics(next,effects);
  for (const p of PEOPLE) next.relationships[p.id]=clamp(next.relationships[p.id]+(choice.relations[p.id]||0));
  next.flags.push(...choice.flags);
  next.history.push({round:state.round,roundId:round.id,choiceId,title:choice.title,writtenDecision:writtenDecision.trim(),headline:choice.headline,outcome:choice.outcome,delta:actual,bonus,reactions:{...choice.reactions},heard:state.evidence.filter(e=>e.round===state.round).map(e=>e.id),metrics:{...next.metrics},followup:null});
  next.phase='result';
  return next;
}
function delayedEffect(state) {
  const has=f=>state.flags.includes(f);
  if(state.round===1) {
    if(has('publicLaunch')) return {text:'Your public-launch commitment means the retention surprise reaches more teams. Support escalates it before the next invitation goes out.',delta:{trust:-4,quality:-2}};
    if(has('delay')) return {text:'The time you bought lets Engineering reproduce the long-meeting defect. The campaign is paused, but the review now has a concrete target.',delta:{delivery:4,quality:3}};
    return {text:'Your small pilot brings back its first useful failure report. The review gate catches it before a summary reaches a customer.',delta:{quality:3}};
  }
  if(state.round===2) {
    if(has('quietFix')) return {text:'The customer notices the changed default and asks why no one explained the earlier recordings. Your quiet fix has become a trust question.',delta:{trust:-6}};
    if(has('atlasException')) return {text:'Engineering has started maintaining Atlas’s separate retention policy. That exception now consumes review time.',delta:{quality:-2}};
    return {text:'The explicit consent notice gives Support a clear answer when the next customer asks about recordings.',delta:{trust:3}};
  }
  if(state.round===3) {
    if(has('ignoredRumor')) return {text:'A defect reported privately did not reach the launch checklist. The shared channel is quieter, but the risk has grown.',delta:{trust:-3,quality:-5}};
    if(has('openContext')) return {text:'After the open correction, an engineer posts a blocker early enough to fix it. The room is sharing inconvenient information again.',delta:{trust:2,quality:3}};
    return {text:'The joint leadership update reduces speculation, though Support still asks to see the decision record.',delta:{trust:1}};
  }
  if(state.round===4) {
    if(has('splitTeam')) return {text:'Both workstreams reach the same review bottleneck. One slips, and the other goes into the review with incomplete validation.',delta:{delivery:-6,quality:-4}};
    if(has('customBranch')) return {text:'Atlas confirms the conditional commitment. The custom branch brings a commercial signal and another path to maintain.',delta:{delivery:4,quality:-3}};
    return {text:'The shared action-item fix passes its review. Atlas is still waiting on a contract, but the core experience is stronger for every team.',delta:{quality:5}};
  }
  return null;
}
export function advance(state) {
  if(state.phase!=='result') throw new Error('Complete the current decision first.');
  const next=copy(state);
  if(state.round===ROUNDS.length-1) {next.phase='complete';return next;}
  next.round++; next.phase='play'; next.asked=[]; next.talksLeft=2;
  const effect=delayedEffect(next);
  if(effect) {
    const actual=shiftMetrics(next,effect.delta);
    next.arrival={text:effect.text,delta:actual};
    next.history[next.history.length-1].followup={...next.arrival};
  } else next.arrival=null;
  return next;
}
// A finite suggestion grammar, not a semantic interpretation of arbitrary prose.
// All authored keywords still identify competing approaches; an action anchor
// is an additional requirement before any one approach may be suggested.
const INTENT_FRAMES = [
  'i will', 'i would', 'i choose', 'i propose', 'i recommend', 'i plan to',
  'we will', 'we should', 'we choose', 'we propose', 'we recommend', 'we plan to',
];
const UNCERTAIN_WORDS = new Set([
  'no', 'not', 'never', 'neither', 'nor', 'without', 'avoid', 'avoiding',
  'refuse', 'refusing', 'reject', 'rejecting', 'instead', 'rather',
  'if', 'unless', 'until', 'when', 'provided', 'assuming', 'depending',
  'otherwise', 'maybe', 'perhaps', 'might', 'could', 'or', 'either', 'versus', 'vs',
  'dont', 'doesnt', 'didnt', 'cant', 'cannot', 'wont', 'wouldnt', 'shouldnt',
  'couldnt', 'isnt', 'arent', 'wasnt', 'werent', 'havent', 'hasnt', 'hadnt',
  'said', 'says', 'quote', 'quoted',
]);
const ACTION_ANCHORS = {
  promise: {
    pilot:['pilot', 'limited rollout', 'staged rollout'],
    launch:['launch now', 'public launch', 'public release', 'release the product', 'all users'],
    delay:['postpone', 'delay the launch', 'pause the launch', 'move the date'],
  },
  consent: {
    explicit:['explicit consent', 'opt in', 'permission', 'deletion'],
    quiet:['patch the retention', 'retention default', 'quiet fix', 'silently patch'],
    exception:['atlas', 'retention exception'],
  },
  rumor: {
    open:['full thread', 'all hands', 'share the context'],
    broker:['broker', 'mediate', 'private reset', 'one on one'],
    ignore:['ignore the rumor', 'dismiss the rumor', 'keep working', 'move on'],
  },
  scope: {
    core:['shared core', 'reliability', 'all teams'],
    custom:['atlas', 'custom workflow'],
    both:['split the team', 'both workstreams', 'parallel workstreams', 'two teams'],
  },
  accountability: {
    evidence:['bounded recommendation', 'present evidence', 'release gate', 'risk threshold'],
    momentum:['lead with momentum', 'broad expansion', 'expand the launch'],
    shared:['joint checkpoint', 'bring all leads together', 'align all leads'],
  },
};
const matchText = text => text.toLowerCase().replace(/[‘’']/g,'').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
export function interpretDecision(state,text) {
  requirePlay(state);
  if(typeof text!=='string' || text.trim().length<20) throw new Error('Write at least 20 characters so you can record a meaningful decision.');
  if(text.length>1200) throw new Error('Keep your decision within 1,200 characters.');
  const wording=text.trim(), normalized=matchText(wording);
  const result={suggestedId:null,text:wording};
  // Quotation marks at word boundaries require a choice. Apostrophes within
  // words (Atlas's, don't) remain available to the separate token/veto rules.
  if(/[?"“”`]/u.test(wording) || /(^|[^\p{L}\p{N}])['‘’]|['‘’]($|[^\p{L}\p{N}])/u.test(wording)) return result;
  if(!INTENT_FRAMES.some(frame=>normalized.startsWith(frame+' ')) ||
      normalized.split(' ').some(word=>UNCERTAIN_WORDS.has(word))) return result;
  const containsPhrase=phrase=>(' '+normalized+' ').includes(' '+matchText(phrase)+' ');
  const round=currentRound(state);
  const candidates=round.choices.filter(choice=>choice.keywords.some(containsPhrase));
  if(candidates.length===1 && ACTION_ANCHORS[round.id][candidates[0].id].some(containsPhrase))
    result.suggestedId=candidates[0].id;
  return result;
}
export function relationshipLabel(value) {return value>=65?'Backing your decisions':value>=48?'Still open to persuasion':value>=32?'Guarded':'Trust is strained';}
export function getDebrief(state) {
  if(state.phase!=='complete') throw new Error('Finish all five decisions to see the debrief.');
  const {delivery,trust,quality}=state.metrics;
  let title,description;
  if(quality>=65 && trust>=65 && delivery>=40) { title='You earned the next step.';description='Relay has a credible basis for controlled expansion. The product has improved, the room is still sharing information, and you have enough momentum to act. The next test is whether your release criteria hold up with unfamiliar teams.'; }
  else if(quality>=65 && trust>=60) {title='Credibility needs a deadline.';description='You protected product quality and kept the team engaged, but repeated delays weakened momentum. Relay can move forward once you turn its safeguards into a concrete release date and a small, testable scope.';}
  else if(delivery>=70 && quality<55) {title='You launched on borrowed time.';description='You created commercial momentum faster than the product could become dependable. The open risks now travel with the release. Your next responsibility is to narrow exposure, repair the experience, and correct any overstatement.';}
  else if(quality>=60 && trust<55) {title='The product is ahead of the room.';description='The product has a stronger foundation, but the team is less willing to share uncertainty. A good release can still fail when important information stays private. Restoring a shared, credible record is the next product decision.';}
  else if(trust>=65) {title='The room believes you. Now prove it.';description='You built enough trust for people to keep talking. The product evidence is still incomplete, so agreement needs to turn into a bounded experiment with a clear owner and a stop condition.';}
  else {title='A fragile compromise.';description='Relay leaves the review with unresolved tension across delivery, trust, and product quality. Revisit the weakest signal, narrow the next promise, and identify the evidence that would justify expanding it.';}
  const heardPeople=new Set(state.evidence.map(e=>e.person));
  const reflections=[{title:'How you gathered evidence',text:'You used '+state.evidence.length+' of 10 available conversations and heard from '+heardPeople.size+' of 4 stakeholders. '+(heardPeople.size===4?'Your evidence included every function. That gives you more perspectives, not certainty.':'The voices you did not hear may explain some of the surprises in this attempt.')}];
  const knowledgeWins=state.history.filter(h=>h.bonus).length;
  if(knowledgeWins) reflections.push({title:'When listening changed the result',text:knowledgeWins+' decision'+(knowledgeWins===1?' used':'s used')+' a specific piece of evidence to improve the outcome. Those effects are identified in your decision record.'});
  const hidden=state.flags.includes('quietFix')||state.flags.includes('ignoredRumor');
  reflections.push({title:hidden?'The cost of missing context':'Your response to uncertainty',text:hidden?'You left at least one important issue unexplained. Later events show where silence reduced trust or hid a defect. Consider what the team needed to know at the time.':'You created opportunities to surface uncomfortable information. The useful question is whether that information changed your next action.'});
  if(state.flags.includes('customBranch')||state.flags.includes('atlasException')) reflections.push({title:'The account you optimized for',text:'You made an exception for Atlas. That protected a relationship while creating additional work. In a replay, inspect the evidence from other teams before deciding how far to specialize.'});
  return {title,description,reflections};
}
