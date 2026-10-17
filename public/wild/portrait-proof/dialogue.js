import {world,morningCapacity,morningUsed,used} from './clearing-state.js';

export const TOPICS={
  crossing:'Is the crossing safe?',injury:'What happened to the traveler?',watch:'Why were you kept under watch?',
  order:'Who ordered the line loosened?',supplies:'Are the stores protected?',work:'Who is available for work?',
  hearing:'What did the hearing establish?',identity:'Who is the werewolf?',night:'What happened last night?'
};
export const SPEAKERS={orin:'Orin',sera:'Sera'};
const completedNight=state=>['dawn','morning','morning-dispatched','noon'].includes(state.phase);
const normalize=text=>text.toLowerCase().replace(/[’‘]/g,"'").replace(/\b(can't|cant)\b/g,'cannot').replace(/\b(won't|wont)\b/g,'will not').replace(/\b(isn't|isnt)\b/g,'is not').replace(/[^a-z0-9'?\s]/g,' ').replace(/\s+/g,' ').trim();

function topicFor(text,lastTopic){
  if(/^(why( is that| not)?|how come|what do you mean|tell me more|explain( that)?|and then|what about now|and now|has (that|it) changed|is (that|it) (done|safe|finished)( yet)?|how (do|can) you know( that)?|what('s| is) (the|your) (proof|evidence)|can you prove (that|it)|what makes you (say|think) that|what would it take)[? .!]*$/.test(text))return Object.hasOwn(TOPICS,lastTopic)?lastTopic:null;
  // Specific subjects precede broad vocabulary ("who ordered the crossing" is testimony).
  if(/\b(werewolf|werewolves|wolf|wolves|allegiance|faction)\b/.test(text))return 'identity';
  if(/\b(hearing|witness|witnessed|testimony|testimonies|hear both|heard both|both accounts|both sides)\b/.test(text))return 'hearing';
  if(/\b(why|did|who)\b.*\b(open|opened|unlock|unlocked|lead|led|take|took)\b.*\b(gate|family|families|crossing)\b/.test(text))return 'injury';
  if(/\b(injur\w*|hurt|ankle|traveler|traveller|escort|wounded|anyone (get )?harmed)\b/.test(text))return 'injury';
  if(/\b(order|ordered|instruction\w*|loosen\w*|lie|lied|lying|blam\w*|denial|deny|admi\w*|contradict\w*|story|stories|fault|sabotag\w*|accus\w*|version|trust you|believe you)\b/.test(text)||/\b(who|he|she|orin|sera) (told|asked|tell|ask)\b/.test(text)||/\b(what did (he|she) tell|did (he|she) tell)\b/.test(text))return 'order';
  if(/\b(watch|held|hold|guard|custody|confin\w*|detain\w*|prison\w*|arrest\w*|kept (you|him|her|orin|sera) here|locked (you|him|her) up)\b/.test(text))return 'watch';
  if(/\b(store\w*|suppl\w*|food|crate\w*|rations)\b/.test(text))return 'supplies';
  if(/\b(cross\w*|across|bridge|river|gate|anchor|rope|line|passage|route|promise|famil\w*)\b/.test(text)||/^(is it )?(safe|ready|open|repair)[?]*$/.test(text))return 'crossing';
  if(/\b(worker\w*|crew|availab\w*|capacity|job\w*|hands|staff|who can help|anyone free|anybody free|people (are )?(left|free|to spare))\b/.test(text)||/\b(available for|doing|assigned|left to do|remaining) work\b/.test(text))return 'work';
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
    if(!after)return 'No injury has been reported at this point. '+(orin?'I said I would attempt passage if free. I have not taken anyone through yet.':'Orin says he will attempt passage if free. That is his intention, not an event that has happened.');
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

// Additional angles are authored from the same facts, never generated or promoted
// from the player's claims. Memory holds at most three angles for one topic.
function reasonFor(state,speaker,topic){
  const orin=speaker==='orin',after=completedNight(state),scene=world(state);
  switch(topic){
    case 'order':return orin?(state.challenged?'I was trying to free the ferry for the stores. That is why I say I gave a temporary instruction. You have my admission about the order, not independent proof of my reason.':'Sera handled the fastening, so I put the blame on her. But handling a rope and deciding to loosen it are not the same thing. She says I gave the instruction; I still deny it.'):'I handled the line; I have never denied that. I dispute being made solely responsible for an instruction I say came from Orin. That still leaves the cause of the slip to establish.';
    case 'crossing':return scene.crossing==='open'?'There are two checks behind that clearance: firm footing on the higher approach, and the repaired line under load. It applies here, at this water level—not to the unstable bank.':orin?'I made the promise using yesterday’s map. The river changed; my promise did not change with it. A sound fastening and a safe approach both matter before anyone crosses.':'A repaired rope cannot make an unstable bank safe. We need firm footing and a load check; the old map cannot answer those questions at this water level.';
    case 'injury':return !after?replyFor(state,speaker,topic):state.watch==='orin'?(orin?'The guard kept me from taking the key to the gate. That stopped the attempt; it did not repair the crossing.':'Your guard stopped the attempt. That is why there is no injured traveler to escort from that passage. The unsafe route still needs work.'):(orin?'I wanted to keep my promise to the waiting family. I took them onto an unchecked approach, and the traveler turned an ankle. Wanting to get them across did not make it safe.':'The traveler was taken onto an unchecked approach. That explains the escort obligation. It does not settle the separate dispute about who ordered the rope loosened.');
    case 'watch':return replyFor(state,speaker,topic)+' The trade-off is a person: a guard cannot also repair the crossing or move the stores that night.';
    case 'supplies':return scene.stores==='protected'?'The point was to get the stores above the observed rise. That job is done. We still cannot promise protection against a higher flood.':orin?(state.challenged?'The ferry and the stores were part of my explanation for the instruction. But an explanation has not moved those crates. They are still exposed.':'The stores are still exposed. Promising passage does not protect them; somebody has to move them above the water line.'):'The stores are below the reported water mark. Moving them costs a worker who could otherwise be at the crossing. Exposure calls for work, not an accusation of theft.';
    case 'work':return (after&&state.watch!=='orin'?'The attempted passage created an escort job. That uses one worker for the entire morning, even if the other job seems more urgent. ':'We have two workers, not two workers for every job. ')+(orin?'You cannot make the same person guard, repair and carry stores in one shift.':'Inspection takes one person; resetting the fastening takes two. A hearing also takes a worker away from physical work.');
    case 'hearing':return orin?'A witness can record the disagreement. They cannot turn my position into proof, or make Sera’s account disappear. Hearing us both costs time that could go to another job.':'I want both accounts on the same record. That gives you something to compare; it does not, by itself, tell you whose intent to believe.';
    case 'identity':return orin?'You can question my decisions without treating every mistake as a confession. Nothing in this record establishes who has a hidden allegiance.':state.challenged?'Orin admitted giving the instruction. That settles his earlier denial, not his motive or hidden allegiance. A wolf accusation would not explain why the rope slipped.':'A wolf accusation would be convenient. It would not explain who gave the instruction, why the rope slipped, or what made the bank unsafe. Those still need evidence.';
    case 'night':return !after?'The orders are not a report of what happened. Until first light, neither of us can give you the night’s result.':state.watch==='orin'?'Keeping Orin at the fire stopped the attempted passage. It also spent one worker’s night on the watch, leaving less time for other work.':'Leaving Orin free left him able to use the key. The attempted passage created an injury and a morning escort obligation, regardless of which other job you chose.';
  }
}
function evidenceFor(state,speaker,topic){
  const after=completedNight(state),noon=state.phase==='noon',scene=world(state);
  switch(topic){
    case 'order':return (state.challenged?(speaker==='orin'?'Your council record contains my admission that I gave the instruction.':'Your council record contains Orin’s admission that he gave the instruction.'):(speaker==='orin'?'You have my dusk account and Sera’s signed field note. I deny giving the instruction; she says I gave it.':'You have my signed field note and Orin’s dusk account. I say he gave the instruction; he denies it.'))+' '+(noon&&state.morning.hearing?'The joint hearing recorded the accounts.':'A joint hearing has not been completed.')+' None of that proves motive or the cause of the slip.';
    case 'crossing':return scene.crossing==='open'?'The noon work report records the higher approach and the load check. That supports supervised passage on the checked route at this water level.':scene.crossing==='reset'?'The completed work report establishes a reset fastening. There is no completed clearance check in the record.':after&&state.crew.inspect?'The first-light inspection records a loose fastening and displaced rope. It does not record a completed repair.':'The route register is from before the rain. Sera’s later field note reports a slipped line. A map and a warning are not a current clearance test.';
    case 'injury':return !after?'There is no witnessed injury report yet. Orin’s threat to attempt passage is in his dusk account; it has not become a witnessed event.':state.watch==='orin'?'The last-bell account records the guard stopping Orin. No family entered the crossing in that attempt.':'The last-bell account records the attempted passage and turned ankle. '+(noon?'The noon report adds the escort’s return, not a claim that the injury healed.':'The first-light report reserves a worker for the escort.');
    case 'watch':return state.phase==='planning'?'The council controls show your provisional watch choice. Only committing the night orders makes it final.':'Your committed night orders identify who was held, if anyone. '+(after?'The first-light report records the consequences.':'We have not reached first light, so the consequences are not yet a report.')+' Custody is not evidence of guilt.';
    case 'supplies':return scene.stores==='protected'?'The completed stores job is the evidence: the crates were moved above the observed water line. It is not a guarantee against a different rise.':'Sera’s field note places the stores below the new water mark. There is no completed protection job in the current record and no established loss.';
    case 'work':return replyFor(state,speaker,topic)+' The allocation controls show the assignments; asking here cannot reassign them.';
    case 'hearing':return noon&&state.morning.hearing?replyFor(state,speaker,topic):'There is no completed joint-hearing record yet. '+(state.challenged?'Your earlier challenge did obtain an admission about the instruction.':'The separate dusk accounts still contradict each other.')+' You can inspect those accounts without treating either as a finding of guilt.';
    case 'identity':return 'There is no established wolf identity to cite. The available records concern an instruction, work on a crossing and the consequences of the council’s choices. None proves hidden allegiance.';
    case 'night':return !after?'We have the dusk accounts and any orders you have given. A witnessed night report is not available until first light.':replyFor(state,speaker,topic)+' Those are the last-bell and first-light records; later morning work is a separate shift.';
  }
}

export function respond(state,speaker,input,context=null){
  if(typeof input!=='string'||!input.trim())return {kind:'validation',text:'Type a question first.',topic:null};
  if(input.length>360)return {kind:'validation',text:'Keep this question to 360 characters so we can address one point.',topic:null};
  if(typeof speaker!=='string'||!Object.hasOwn(SPEAKERS,speaker))return {kind:'validation',text:'Choose Orin or Sera.',topic:null};
  if(state.version!==3||state.phase==='intro')return {kind:'unavailable',text:'Enter the current council encounter before asking questions. Earlier-edition endings stay unchanged.',topic:null};
  const textInput=normalize(input),lastTopic=typeof context==='string'?context:context?.topic;
  const subjects=[];let clauseTopic=lastTopic;
  for(const part of textInput.split(/\?+|\band\b|\bbut\b/)){
    const found=topicFor(part.trim(),clauseTopic);
    if(found){clauseTopic=found;if(!subjects.includes(found))subjects.push(found);}
  }
  if(subjects.length>1)return {kind:'clarify',text:'There are a few different points there. Ask one at a time so I can answer it properly: '+subjects.map(key=>TOPICS[key]).join(' '),topic:null};
  const topic=topicFor(textInput,lastTopic);
  if(!topic)return {kind:'clarify',text:'I can answer about this crossing, our accounts, the watch, the traveler, stores, workers or the hearing. Which part do you mean?',topic:null};
  const signature=JSON.stringify([speaker,state.phase,state.watch,state.challenged,state.crew,state.morning]);
  const prior=context?.topic===topic&&context?.signature===signature?context:null;
  const seen=Array.isArray(prior?.seen)?prior.seen.filter(x=>['answer','reason','evidence'].includes(x)).slice(0,3):[];
  const requested=/\b(proof|evidence|source|prove|how (do|can) you know|what makes you (say|think))\b/.test(textInput)?'evidence':/\b(why|how come|what do you mean|tell me more|explain|what would it take)\b/.test(textInput)?'reason':'answer';
  const angle=seen.includes(requested)?['answer','reason','evidence'].find(x=>!seen.includes(x)):requested;
  let text=angle==='reason'?reasonFor(state,speaker,topic):angle==='evidence'?evidenceFor(state,speaker,topic):angle==='answer'?replyFor(state,speaker,topic):(speaker==='orin'?'I have nothing new to add on that.':'That is all I can support on that point.')+' Ask about another part of the encounter, or return to the council decisions to move events forward.';
  if(speaker==='sera'&&completedNight(state)&&state.watch==='sera'&&!(state.phase==='noon'&&state.morning.hearing)&&topic!=='watch')text='I am not giving a new briefing without a witness. I can refer to my existing note and the public work record: '+text;
  return {kind:'reply',text,topic,memory:{topic,signature,seen:angle?[...new Set([...seen,angle])]:seen}};
}
