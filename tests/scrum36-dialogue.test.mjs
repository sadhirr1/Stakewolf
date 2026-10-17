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
