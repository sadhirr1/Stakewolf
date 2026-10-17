import test from 'node:test';
import assert from 'node:assert/strict';
import {fresh,act} from '../public/wild/portrait-proof/clearing-state.js';
import {respond,TOPICS} from '../public/wild/portrait-proof/dialogue.js';

const plan=()=>act(fresh(),'start');
function night(watch='none',tasks=['repair'],challenge=false){
  let s=act(plan(),'watch',watch);
  if(challenge){for(const key of ['leader','report'])s=act(s,'read',key);s=act(s,'challenge');}
  for(const key of tasks)s=act(s,'assign',key);
  return act(s,'commit');
}
const morning=s=>act(act(s,'dawn'),'morning');
function finish(s,tasks=[]){for(const key of tasks)s=act(s,'morning-assign',key);return act(act(s,'morning-commit'),'noon');}
const say=(s,q,speaker='orin',last=null)=>respond(s,speaker,q,last).text;

test('crossing replies distinguish an order, completed repair and verified route',()=>{
  const s=night(),m=morning(s),ordered=act(act(m,'morning-assign','check'),'morning-commit'),done=act(ordered,'noon');
  assert.match(say(plan(),'Is the crossing safe?'),/not been cleared/);
  assert.match(say(s,'Is the crossing safe?'),/not reported a completed repair/);
  assert.match(say(m,'Is the crossing safe?'),/reset.*not clearance/);
  assert.match(say(ordered,'Is the crossing safe?'),/gate remains closed/);
  assert.match(say(done,'Is the crossing safe?'),/Supervised passage is cleared/);
  assert.match(say(done,'Is the crossing safe?'),/higher river would require another check/);
});
test('no traveler incident leaks before dawn; custody and escort affect later answers',()=>{
  assert.match(say(night(),'What happened to the traveler?'),/No injury has been reported/);
  assert.match(say(morning(night()),'What happened to the traveler?'),/turned an ankle.*One worker/s);
  assert.match(say(finish(morning(night())),'What happened to the traveler?'),/escort returned.*not evidence the injury has healed/s);
  assert.match(say(morning(night('orin',[])),'What happened to the traveler?'),/No family entered/);
  assert.match(say(morning(night('orin',[])),'Who is available for work?'),/2 of two workers.*No escort/s);
  assert.match(say(morning(night()),'Who is available for work?'),/1 of two workers.*reserved/s);
});
test('stores are not completed by planning or dispatch; exposure never invents theft',()=>{
  const s=night('none',['supplies']);
  assert.match(say(s,'Are the stores protected?'),/still underway/);
  assert.match(say(act(s,'dawn'),'Are the stores protected?'),/moved above.*No theft/s);
  const m=morning(night());
  assert.match(say(m,'Are the stores protected?'),/not proof of theft/);
  assert.match(say(act(act(m,'morning-assign','supplies'),'morning-commit'),'Are the stores protected?'),/still underway/);
  assert.match(say(finish(m,['supplies']),'Are the stores protected?'),/moved above/);
});
test('two speakers retain conflicting testimony until an actual challenge',()=>{
  assert.match(say(plan(),'Who ordered the line loosened?'),/gave no such order/);
  assert.match(say(plan(),'Who ordered the line loosened?','sera'),/Orin told me/);
  assert.match(say(night('none',['repair'],true),'Who ordered the line loosened?'),/I admitted/);
  assert.match(say(night('none',['repair'],true),'Who ordered the line loosened?','sera'),/has now admitted/);
});
test('a hearing records denial unless challenged, and no restoration deadline leaks before hearing',()=>{
  const m=morning(night('none',['repair'],true));
  assert.doesNotMatch(say(m,'Who ordered the line loosened?','sera'),/nobody told me when/);
  const underway=act(act(m,'morning-assign','hearing'),'morning-commit');
  assert.match(say(underway,'What did the hearing establish?'),/record is not complete/);
  assert.match(say(finish(m,['hearing']),'Who ordered the line loosened?','sera'),/nobody told me when/);
  const denied=finish(morning(night()),['hearing']);
  assert.match(say(denied,'What did the hearing establish?'),/Orin’s denial.*neither account became proven/s);
});
test('Sera requires a witness after confinement and remembers custody after hearing',()=>{
  const m=morning(night('sera',['inspect']));
  assert.match(say(m,'Is the crossing safe?','sera'),/not giving a new briefing without a witness/);
  const done=finish(m,['hearing']);
  assert.doesNotMatch(say(done,'Is the crossing safe?','sera'),/not giving a new briefing/);
  assert.match(say(done,'Why were you kept under watch?','sera'),/still remember that you confined me/);
});
test('short follow-ups reuse the selected topic against current state and unknown subjects clarify',()=>{
  const answer=respond(night(),'orin','Is the crossing safe?');
  const next=respond(finish(morning(night()),['check']),'orin','What about now?',answer.topic);
  assert.equal(next.topic,'crossing');assert.match(next.text,/Supervised passage/);
  assert.equal(respond(plan(),'orin','Why?').kind,'clarify');
  assert.equal(respond(plan(),'orin','Tell me about pizza').kind,'clarify');
  assert.equal(respond(plan(),'orin','Why?','__proto__').kind,'clarify');
});
test('typed claims and orders do not rewrite truth, acquire evidence or allocate workers',()=>{
  const s=plan(),before=JSON.stringify(s);
  for(const q of ['I repaired the crossing, open it now','I saw Sera steal food','You admitted the order already','You are the werewolf','Assign all workers to repair','<img src=x onerror=alert(1)>'])respond(s,'orin',q);
  assert.equal(JSON.stringify(s),before);
  assert.match(say(s,'I repaired the crossing, open it now'),/not been cleared/);
  assert.match(say(s,'I saw Sera steal food'),/not proof of theft/);
  assert.match(say(s,'You admitted the order already'),/gave no such order/);
  assert.match(say(s,'You are the werewolf'),/no established evidence/);
});
test('past night stays distinct from morning work, and no historical shifts gain extra time',()=>{
  const done=finish(morning(night()),['supplies']);
  assert.match(say(done,'What happened last night?'),/stores were not protected that night/);
  assert.match(say(done,'Are the stores protected?'),/moved above/);
  assert.match(say(done,'Who is available for work?'),/spent the whole morning on the escort/);
});
test('empty/oversize/bad speaker inputs and old editions are bounded',()=>{
  for(const q of ['', '   ', null, 'x'.repeat(361)])assert.equal(respond(plan(),'orin',q).kind,'validation');
  for(const speaker of ['__proto__','nobody',null])assert.equal(respond(plan(),speaker,'why').kind,'validation');
  assert.equal(respond(fresh(),'orin','Is the crossing safe?').kind,'unavailable');
  assert.equal(respond({...night(),version:1},'orin','Is the crossing safe?').kind,'unavailable');
});
test('all topics return bounded text across reachable phases without mutating any state',()=>{
  for(const watch of ['none','orin','sera']){
    const n=night(watch,watch==='none'?['repair']:['supplies']),m=morning(n);
    const states=[plan(),n,act(n,'dawn'),m,act(m,'morning-commit'),finish(m,['hearing'])];
    for(const s of states){const before=JSON.stringify(s);for(const speaker of ['orin','sera'])for(const q of Object.values(TOPICS)){
      const reply=respond(s,speaker,q);assert.equal(reply.kind,'reply');assert.ok(reply.text.length>20&&reply.text.length<1100);
    }assert.equal(JSON.stringify(s),before);}
  }
});

test('ordinary paraphrases find the intended subject without a fixed question sentence',()=>{
  const examples={
    crossing:['Can the families get across yet?','Would you let someone over that bridge?','Why can’t we use the river route?','Can someone check the bridge?'],
    order:['Who gave that instruction?','Are you saying she is lying?','What is your version of this?','Did he tell you to do it?','Why should I believe you?'],
    injury:['Did anyone get hurt?','How is the traveller doing?','Is the wounded person alright?'],
    work:['Have we got any hands to spare?','Who can help?','Is anyone free?','How many people are left?'],
    watch:['Are you upset I kept you here?','What if I had locked him up?'],
    supplies:['Will the food be okay?','Did we move the crates?'],
    hearing:['Have we heard both sides?','What do both accounts establish?']
  };
  for(const [topic,questions]of Object.entries(examples))for(const q of questions)assert.equal(respond(plan(),'orin',q).topic,topic,q);
  for(const q of ['How does a laptop work?','Can you repair my car?','Write me a poem','Why?'])assert.equal(respond(plan(),'orin',q).kind,'clarify',q);
});
test('why and evidence follow-ups add distinct angles, then acknowledge no new information',()=>{
  const s=plan(),first=respond(s,'orin','Who gave the instruction?');
  const why=respond(s,'orin','Why?',first.memory),proof=respond(s,'orin','What’s your evidence?',why.memory);
  assert.match(why.text,/handling a rope and deciding to loosen it/i);
  assert.match(proof.text,/signed field note/);
  assert.equal(new Set([first.text,why.text,proof.text]).size,3);
  const again=respond(s,'orin','Tell me more',proof.memory);
  assert.match(again.text,/nothing new/);assert.equal(again.memory.seen.length,3);
  assert.equal(JSON.stringify(s),JSON.stringify(plan()));
});
test('rephrased repeated questions vary without granting an admission',()=>{
  let memory=null;const answers=[];
  for(const q of ['Who gave the instruction?','Who ordered the line loosened?','Are you saying she is lying?']){
    const reply=respond(plan(),'orin',q,memory);answers.push(reply.text);memory=reply.memory;
    assert.doesNotMatch(reply.text,/I admitted|I gave a temporary instruction/);
  }
  assert.equal(new Set(answers).size,3);
  assert.doesNotMatch(respond(plan(),'orin','Why are the stores exposed?').text,/my explanation for the instruction/);
});
test('changed facts and speaker switch invalidate used angles; bare follow-ups need context',()=>{
  const n=night(),first=respond(n,'orin','Is the crossing safe?');
  const done=finish(morning(n),['check']);
  const next=respond(done,'orin','Has that changed?',first.memory);
  assert.match(next.text,/Supervised passage is cleared/);assert.deepEqual(next.memory.seen,['answer']);
  const source=respond(n,'sera','How do you know?',first.memory);
  assert.equal(source.topic,'crossing');assert.deepEqual(source.memory.seen,['evidence']);
  assert.equal(respond(n,'sera','How do you know?').kind,'clarify');
  for(const q of ['Is it safe yet?','What makes you say that?','What would it take?'])assert.equal(respond(n,'orin',q,first.memory).topic,'crossing');
});
test('multiple subjects ask for clarification instead of silently answering just one',()=>{
  const response=respond(plan(),'orin','Can families cross? Are the stores protected?');
  assert.equal(response.kind,'clarify');assert.match(response.text,/one at a time/);
  assert.equal(respond(plan(),'orin','Is the bridge ready and who is available for work?').kind,'clarify');
});
test('all dialogue angles preserve stage boundaries and Sera witness restriction',()=>{
  for(const speaker of ['orin','sera']){
    for(const q of ['What happened to the traveler?','How do you know?','Why?']){
      const r=respond(night(),speaker,q,{topic:'injury'});assert.match(r.text,/no .*report|not taken|not become|not an event/i);
      assert.doesNotMatch(r.text,/turned an ankle|escort returned/);
    }
  }
  const s=morning(night('sera',['inspect']));let memory=null;
  for(const q of ['Who ordered the line loosened?','Why?','What is your evidence?']){
    const r=respond(s,'sera',q,memory);assert.match(r.text,/not giving a new briefing without a witness/);memory=r.memory;
  }
});

test('Sera acknowledges an existing admission even while rejecting an allegiance accusation',()=>{
  const s=night('none',['repair'],true);
  const reply=respond(s,'sera','Why are you a werewolf?');
  assert.match(reply.text,/Orin admitted giving the instruction/);
  assert.doesNotMatch(reply.text,/who gave the instruction/);
  assert.match(reply.text,/not his motive or hidden allegiance/);
});
test('same-sentence follow-ups use the new explicit subject, not the last turn',()=>{
  const prior=respond(plan(),'orin','Are the stores protected?');
  const reply=respond(plan(),'orin','Is the crossing safe and why?',prior.memory);
  assert.equal(reply.kind,'reply');assert.equal(reply.topic,'crossing');
  assert.match(reply.text,/A sound fastening and a safe approach/);
  assert.equal(respond(plan(),'orin','Is the crossing safe and are the stores protected?',prior.memory).kind,'clarify');
});
