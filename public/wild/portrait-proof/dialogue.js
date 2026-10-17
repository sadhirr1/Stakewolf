import {world,morningCapacity,morningUsed,used} from './clearing-state.js';

export const TOPICS={
  crossing:'Is the crossing safe?',injury:'What happened to the traveler?',watch:'Why were you kept under watch?',
  order:'Who ordered the line loosened?',supplies:'Are the stores protected?',work:'Who is available for work?',
  hearing:'What did the hearing establish?',identity:'Who is the werewolf?',night:'What happened last night?'
};
export const SPEAKERS={orin:'Orin',sera:'Sera'};
const completedNight=state=>['dawn','morning','morning-dispatched','noon'].includes(state.phase);
const normalize=text=>text.toLowerCase().replace(/[’‘]/g,"'").replace(/[^a-z0-9'?\s]/g,' ').replace(/\s+/g,' ').trim();

function topicFor(text,lastTopic){
  if(/^(why|why not|how come|what do you mean|tell me more|explain|and then|what about now)[? .!]*$/.test(text))return Object.hasOwn(TOPICS,lastTopic)?lastTopic:null;
  // Specific subjects precede broad vocabulary ("who ordered the crossing" is testimony).
  if(/\b(werewolf|werewolves|wolf|wolves|allegiance|faction)\b/.test(text))return 'identity';
  if(/\b(hearing|witness|witnessed|testimony|testimonies)\b/.test(text))return 'hearing';
  if(/\b(why|did|who)\b.*\b(open|opened|unlock|unlocked|lead|led|take|took)\b.*\b(gate|family|families|crossing)\b/.test(text))return 'injury';
  if(/\b(injur\w*|hurt|ankle|traveler|traveller|escort|wounded)\b/.test(text))return 'injury';
  if(/\b(order|ordered|loosen\w*|lie|lied|lying|blam\w*|denial|deny|admi\w*|contradict\w*|story|stories|fault|sabotag\w*)\b/.test(text))return 'order';
  if(/\b(watch|held|hold|guard|custody|confin\w*|detain\w*|prison\w*|arrest\w*)\b/.test(text))return 'watch';
  if(/\b(store\w*|suppl\w*|food|crate\w*|rations)\b/.test(text))return 'supplies';
  if(/\b(worker\w*|crew|availab\w*|capacity|job\w*|work|people|hands|staff)\b/.test(text))return 'work';
  if(/\b(cross\w*|bridge|river|gate|anchor|repair\w*|rope|line|safe|ready|passage|route|promise|famil\w*|open)\b/.test(text))return 'crossing';
  if(/\b(last night|what happened|night|update)\b/.test(text))return 'night';
  return null;
}

function replyFor(state,speaker,topic){
  const after=completedNight(state),noon=state.phase==='noon',night=state.phase==='dispatched';
  const scene=world(state),orin=speaker==='orin',held=state.watch==='orin',hearing=noon&&Boolean(state.morning.hearing);
  const challenged=state.challenged,planned=state.phase==='planning';
  if(topic==='night')return after?(held?'The guard stopped Orin from taking a family through the unchecked crossing. No escort was needed.':'Orin attempted passage, a traveler turned an ankle, and an escort became necessary.')+' '+(state.crew.repair?'The overnight pair reset the anchor; that was not clearance.':state.crew.inspect?'The inspector found a loose fastening; it was not repaired that night.':'No crossing job was completed overnight.')+' '+(state.crew.supplies?'The stores were moved above the water line that night.':'The stores were not protected that night.'):'The night’s outcome is not known yet. The accounts disagree, and work is not complete. Advance to first light for the witnessed report.';
  if(topic==='identity')return 'An accusation is not a wolf identity. We have conflicting accounts and an unsafe crossing, but no established evidence of anyone’s hidden allegiance.';
  if(topic==='crossing'){
    if(scene.crossing==='open')return 'The worker marked firm footing on the higher approach and tested the repaired line. Supervised passage is cleared at this water level. The unstable bank is still off limits; a higher river would require another check.';
    if(scene.crossing==='reset')return 'The fastening is reset, but that alone is not clearance. The gate remains closed until someone verifies firm footing and checks the line under load.';
    if(night&&state.crew.repair)return 'The pair are working on the fastening. They have not reported a completed repair. Even afterward, the approach and line will need a check before passage.';
    if(after&&state.crew.inspect)return 'The inspector found a loose fastening and displaced rope. That tells us what needs fixing; nobody has completed the repair. The crossing remains closed.';
    return orin?'My map was checked before the rain. I promised passage before we had a current check. The loose line still needs attention; the gate has not been cleared for use.':'The map predates the rising river. My field note reports a slipped line. Until the fastening and a safe approach have been checked, do not treat that old map as clearance.';
  }
  if(topic==='injury'){
    if(!after)return 'No injury has been reported at this point. Orin has said he will attempt passage if free, but that is a stated intention, not an event that has happened.';
    if(held)return orin?'Your guard stopped me leaving with the key. No family entered the crossing that night, so no traveler needs an escort from that attempt.':'The guard stopped Orin. No family entered the crossing; no escort job was created. That does not mean the crossing is safe.';
    return (orin?'I led a traveler onto the unchecked approach. They turned an ankle and came back. My promise did not make that bank safe.':'The witnessed report says Orin took a traveler onto the unchecked approach. They turned an ankle and returned. That incident is separate from who ordered the line loosened.')+' '+(noon?'The escort returned at noon after taking them to shelter. That is not evidence the injury has healed.':'One worker is committed to escorting them for the morning. That leaves one worker for new work.');
  }
  if(topic==='order'){
    if(orin)return challenged?'I admitted telling Sera to ease the outer line. I said it was to free the ferry for the stores—not to leave it loose. That is my explanation; you have not independently established my intent.':'I say Sera loosened it and that I gave no such order. She disputes that. You can compare our two accounts; my position as leader does not make my denial proof.';
    if(hearing&&challenged)return 'At the hearing I added that nobody told me when to restore the line. Orin has admitted giving the instruction, but calls it temporary. The instruction, the slip and his reason are different questions.';
    return challenged?'Orin has now admitted giving the instruction. That supports this part of my account. It does not establish why the rope slipped or prove anyone’s hidden allegiance.':'My account is that Orin told me to loosen the outer line so the ferry could serve the stores. I handled it. He denies the instruction. Those are our conflicting claims, not an independently settled cause.';
  }
  if(topic==='watch'){
    if(planned)return state.watch===null?'You have not chosen a watch. A guard will take one of the two workers. Choose in the council controls; asking me does not issue that order.':`Your current plan is ${state.watch==='none'?'to leave both of us free':`to keep ${SPEAKERS[state.watch]} under watch`}. It has not been committed yet. A question cannot change that plan.`;
    const self=state.watch===speaker;
    if(night)return self?'You assigned a worker to keep me here until dawn. That worker cannot do another job tonight. Custody is your decision, not proof of guilt.':state.watch==='none'?'You left both of us free. The two workers can do other work; Orin still has the key.':'You put the other person under watch. I remain free. That uses one of the two workers for the night.';
    if(self)return orin?'You kept me from the gate. That prevented my attempt, but I still want a public explanation for being held.':hearing?'I spoke at the witnessed hearing. I still remember that you confined me while Orin kept the key.':'You confined me on Orin’s word while he kept the key. I want a witness before I offer a new briefing; my earlier field note still stands.';
    return state.watch==='none'?'You held neither of us. Orin’s attempted crossing and the injury are now in the record; freedom did not settle either account.':`You held ${SPEAKERS[state.watch]} until dawn. The watch has ended, but that choice remains part of the council’s history.`;
  }
  if(topic==='supplies'){
    if(scene.stores==='protected')return 'The stores have been moved above the observed water line. That protects them from this rise, not every possible flood. No theft has been established.';
    if(night&&state.crew.supplies||state.phase==='morning-dispatched'&&state.morning.supplies)return 'A worker has been sent to move the stores. The shift is still underway; I cannot call that protection complete yet.';
    return 'The stores are still below the reported water mark. Moving and counting them is unfinished work. Exposure is a risk; it is not proof of theft or a confirmed loss.';
  }
  if(topic==='work'){
    if(planned)return `${2-used(state)} of the two workers are unassigned in your current night plan. A watch costs one worker, repair needs both, and inspection or stores needs one. The plan is not committed yet.`;
    if(night)return `${used(state)} of the two workers have committed night assignments, including any watch. Their work is underway. You cannot give their time to a second job this night.`;
    if(noon)return `The morning shift is finished. ${state.watch==='orin'?'No escort was needed.':'One worker spent the whole morning on the escort.'} Jobs not assigned remain unfinished; finishing at noon does not create extra time in the earlier shift.`;
    return `${morningCapacity(state)} of two workers are available for new morning work. ${held?'No escort is needed.':'The other worker is reserved for the traveler’s escort until noon.'}${state.morning?` ${morningUsed(state)} of those available workers ${state.phase==='morning-dispatched'?'have locked assignments':'are assigned in your current plan'}.`:''}`;
  }
  if(topic==='hearing'){
    if(!after)return 'No witnessed hearing has happened. You can hear each account now and compare them. A guard is not a hearing, and hearing a claim does not prove it.';
    if(!hearing)return (challenged?'Orin’s admission of the instruction is already in your record. It has not been recorded at a joint hearing. ':'The conflicting accounts remain unresolved. ')+(state.phase==='morning-dispatched'&&state.morning.hearing?'A worker is witnessing the hearing this shift. Its record is not complete yet.':noon?'No worker witnessed a hearing this morning; that obligation remains.':'A witnessed hearing needs one worker this morning.')+' Intent and allegiance remain unproved.';
    return challenged?'The witness recorded Orin’s admitted instruction and his claim that it was temporary. Sera added that no restoration deadline was given. The order is on record; motive and the cause of the slip remain disputed.':'The witness recorded Orin’s denial and Sera’s claim that he gave the order. Both have been heard; neither account became proven simply by being recorded.';
  }
}

export function respond(state,speaker,input,lastTopic=null){
  if(typeof input!=='string'||!input.trim())return {kind:'validation',text:'Type a question first.',topic:null};
  if(input.length>360)return {kind:'validation',text:'Keep this question to 360 characters so we can address one point.',topic:null};
  if(typeof speaker!=='string'||!Object.hasOwn(SPEAKERS,speaker))return {kind:'validation',text:'Choose Orin or Sera.',topic:null};
  if(state.version!==3||state.phase==='intro')return {kind:'unavailable',text:'Enter the current council encounter before asking questions. Earlier-edition endings stay unchanged.',topic:null};
  const topic=topicFor(normalize(input),lastTopic);
  if(!topic)return {kind:'clarify',text:'I can answer about this crossing, our accounts, the watch, the traveler, stores, workers or the hearing. Which part do you mean?',topic:null};
  let text=replyFor(state,speaker,topic);
  if(speaker==='sera'&&completedNight(state)&&state.watch==='sera'&&!(state.phase==='noon'&&state.morning.hearing)&&topic!=='watch')text='I am not giving a new briefing without a witness. I can refer to my existing note and the public work record: '+text;
  return {kind:'reply',text,topic};
}
