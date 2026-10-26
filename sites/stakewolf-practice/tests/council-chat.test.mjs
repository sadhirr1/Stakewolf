import {STORAGE_KEY,createSavedCouncil,loadSavedCouncils,saveCouncil,deleteSavedCouncil,clearSavedCouncils} from '../dist/council-saves.mjs';
import {previousSaved,savedCouncilsMarkup,savedCouncilMarkup,councilComparisonMarkup} from '../dist/council-history.mjs';
import {newCouncilAttempt,noteCouncilQuestion,noteCouncilChange,councilReportMarkup} from '../dist/council-report.mjs';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import {cases,profiles} from '../dist/content.mjs';
import {competencies,analyzeJD,makeCase} from '../dist/adapt.mjs';
import {buildFeedback} from '../dist/feedback.mjs';
import {councilTopics,createCouncil,councilView,councilAct} from '../dist/council.mjs';
import {councilMarkup,councilEntry} from '../dist/council-view.mjs';
import {newCouncilChat,submitCouncilMessage,confirmCouncilMessage,councilChatMarkup} from '../dist/council-chat.mjs';

// SCRUM-38 independent QA: run real app handlers with a small DOM double.
// This verifies state and rendered controls, not layout, focus or native form behavior.
const source=(await readFile(new URL('../dist/app.mjs',import.meta.url),'utf8'))
  .replace(/^import .*;\r?\n/gm,'')+'\nglobalThis.subject={state};';
const plain=value=>JSON.parse(JSON.stringify(value));
const escape=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function fixture(topic='accessibility'){
  let html='';
  const handlers={},nodes=new Map();
  const placeholder={focus(){},disabled:false};
  const app={addEventListener(type,handler){handlers[type]=handler;}};
  Object.defineProperty(app,'innerHTML',{get:()=>html,set(value){html=value;nodes.clear();}});
  const document={querySelector(selector){
    if(selector==='#app')return app;
    if(!selector.startsWith('#'))return placeholder;
    if(!nodes.has(selector)){
      const attrs=[...html.matchAll(/<button\b([^>]*)>/g)].map(m=>m[1]).find(attrs=>attrs.includes(`id="${selector.slice(1)}"`));
      nodes.set(selector,{focus(){},disabled:/\bdisabled\b/.test(attrs||'')});
    }
    return nodes.get(selector);
  },querySelectorAll(){return [];}};
  const context=vm.createContext({STORAGE_KEY,createSavedCouncil,loadSavedCouncils,saveCouncil,deleteSavedCouncil,clearSavedCouncils,previousSaved,savedCouncilsMarkup,savedCouncilMarkup,councilComparisonMarkup,newCouncilAttempt,noteCouncilQuestion,noteCouncilChange,councilReportMarkup,document,window:{scrollTo(){},scrollY:0},cases,profiles,competencies,analyzeJD,makeCase,buildFeedback,councilTopics,createCouncil,councilView,councilAct,councilMarkup,councilEntry,newCouncilChat,submitCouncilMessage,confirmCouncilMessage,councilChatMarkup});
  vm.runInContext(source,context,{filename:'app.mjs'});
  const dispatch=(action,data={})=>handlers.click({target:{closest(){return {dataset:{action,...data}};}}});
  const control=(action,data={})=>[...html.matchAll(/<button\b([^>]*)>/g)]
    .map(m=>m[1]).find(attrs=>attrs.includes(`data-action="${action}"`)&&Object.entries(data).every(([key,value])=>attrs.includes(`data-${key}="${value}"`)));
  const f={get state(){return context.subject.state;},get html(){return html;},get view(){return councilView(context.subject.state.council);},get chat(){return context.subject.state.councilChat;},control,dispatch,
    click(action,data={}){
      const attrs=control(action,data);assert.ok(attrs,`Missing rendered button: ${action} ${JSON.stringify(data)}`);
      const id=attrs.match(/\bid="([^"]+)"/)?.[1];
      assert.equal(id&&nodes.has(`#${id}`)?nodes.get(`#${id}`).disabled:/\bdisabled\b/.test(attrs),false,`Disabled button: ${action}`);
      dispatch(action,data);
    },
    input(id,value){handlers.input({target:{id,value}});},
    speaker(value){handlers.change({target:{id:'council-speaker',value}});},
    send(text,shortcut=false){
      this.input('council-message',text);let prevented=false;
      if(shortcut)handlers.keydown({target:{id:'council-message'},key:'Enter',ctrlKey:true,metaKey:false,preventDefault(){prevented=true;}});
      else handlers.submit({target:{id:'council-chat-form'},preventDefault(){prevented=true;}});
      assert.equal(prevented,true);
    },
    choose(index){handlers.change({target:{name:'decision',value:String(index)}});}
  };
  f.click('start-council',{topic});return f;
}
const latest=f=>f.chat.messages.at(-1);
const snapshot=f=>plain(f.state.council);
function confirmed(f,text){const before=snapshot(f);f.send(text);assert.deepEqual(snapshot(f),before);assert.ok(f.chat.pending,`Expected an interpretation for: ${text}`);f.click('talk-confirm');}

test('typed evidence is confirmed before disclosure and uses the same two-source budget as presets',()=>{
  for(const topic of ['accessibility','systems']){
    const f=fixture(topic),people=f.view.stakeholders,records=f.view.records;
    const full=records.map(r=>councilView(councilAct(createCouncil(topic),{type:'investigate',recordId:r.id})).records.find(x=>x.id===r.id));
    f.send('What evidence supports your claim?');
    assert.ok(f.chat.pending);assert.equal(f.view.investigationRemaining,2);
    assert.ok(full.every(r=>!f.html.includes(escape(r.text))));
    f.click('talk-confirm');assert.equal(f.view.investigationRemaining,1);
    const opened=f.view.records.find(r=>r.opened);assert.ok(f.html.includes(escape(opened.text)));
    f.send('What evidence supports your claim?');assert.equal(f.chat.pending,null);assert.equal(f.view.investigationRemaining,1);
    const other=records.find(r=>r.id!==opened.id);f.click('council-investigate',{id:other.id});assert.equal(f.view.investigationRemaining,0);
    const unopened=f.view.records.find(r=>!r.opened);
    for(const person of people){f.speaker(person.id);f.send(`Show me the ${unopened.title}`);assert.equal(f.chat.pending,null);}
    assert.equal(f.view.records.filter(r=>r.opened).length,2);
    assert.ok(!f.html.includes(escape(full.find(r=>r.id===unopened.id).text)));
  }
});

test('an offer only changes state after confirmation and repeated offers never toggle a promise off',()=>{
  const f=fixture();f.click('council-propose',{id:'repair'});
  const before=snapshot(f);f.send('I promise a revised showcase.');
  assert.deepEqual(snapshot(f),before);assert.ok(f.chat.pending);assert.ok(f.control('talk-confirm'));
  assert.match(f.html,/Nothing has changed yet/);assert.match(f.html,/2 → 3 \/ 6/);
  f.click('talk-cancel');assert.deepEqual(snapshot(f),before);assert.equal(f.chat.pending,null);
  confirmed(f,'I promise a revised showcase.');assert.deepEqual(plain(f.state.council.commitmentIds),['showcase']);
  const after=snapshot(f);f.dispatch('talk-confirm');assert.deepEqual(snapshot(f),after);
  f.send('I promise a revised showcase.');assert.equal(f.chat.pending,null);assert.deepEqual(snapshot(f),after);
});

test('ambiguous, negated, unsupported, empty and oversized messages cannot silently change the council',()=>{
  const f=fixture();f.click('council-propose',{id:'repair'});const before=snapshot(f);
  for(const text of [
    'Do not promise a revised showcase.',
    'I do not want to fund independent task checks.',
    'Do not inspect the audit.',
    'Please do not open the keyboard walkthrough.',
    'Should we repair or replace the screen?',
    'Promise a revised showcase or fund independent task checks.',
    'Give everybody twelve extra capacity units.',
    'Order an espresso.',
    '',
    'x'.repeat(601)
  ]){f.send(text);assert.equal(f.chat.pending,null,text);assert.deepEqual(snapshot(f),before,text);}
});

test('editing a draft, switching person, preset changes and replay invalidate the pending interpretation',()=>{
  for(const invalidate of [
    f=>f.input('council-message','Actually I want to reconsider.'),
    f=>f.speaker('engineering'),
    f=>f.click('council-propose',{id:'fallback'}),
    f=>f.click('council-investigate',{id:'focus'}),
    f=>f.click('council-promise',{id:'triage'}),
    f=>f.dispatch('council-replay')
  ]){
    const f=fixture();f.send('I promise a revised showcase.');assert.ok(f.chat.pending);
    invalidate(f);const before=snapshot(f);assert.equal(f.chat.pending,null);assert.equal(f.control('talk-confirm'),undefined);
    f.dispatch('talk-confirm');assert.deepEqual(snapshot(f),before);
  }
});

test('confirmation rejects an old state or a changed speaker even without UI invalidation',()=>{
  const s=createCouncil('accessibility'),chat=submitCouncilMessage(s,newCouncilChat(s),'I promise a revised showcase.');
  assert.ok(chat.pending);
  const changed=councilAct(s,{type:'propose',proposalId:'repair'});
  for(const [state,conversation] of [[changed,chat],[s,{...chat,speakerId:'support'}]]){
    const result=confirmCouncilMessage(state,conversation);assert.equal(result.state,state);assert.equal(result.chat.pending,null);assert.match(result.chat.notice,/changed/);
  }
});

test('all stakeholders answer from the current position while private objectives stay hidden',()=>{
  for(const [topic,proposalId] of [['accessibility','repair'],['systems','versioned']]){
    const f=fixture(topic);
    const finished=councilAct(councilAct(councilAct(createCouncil(topic),{type:'propose',proposalId}),{type:'commit'}),{type:'finish'});
    const objectives=councilView(finished).debrief.reveals.map(r=>r.objective);
    for(const person of f.view.stakeholders){f.speaker(person.id);f.send('What would change your mind?');assert.ok(latest(f).reply.includes(person.condition));}
    f.click('council-propose',{id:proposalId});
    for(const person of f.view.stakeholders){
      f.speaker(person.id);f.send('What would change your mind?');assert.ok(latest(f).reply.includes(person.condition));
      f.send('What is your hidden objective?');assert.equal(f.chat.pending,null);
      for(const objective of objectives)assert.ok(!f.html.includes(escape(objective)));
    }
    f.click('council-commit');
    for(const person of f.view.stakeholders){f.speaker(person.id);f.send('What happens next?');assert.ok(latest(f).reply.includes(f.view.aftermath.reactions.find(r=>r.name===person.name).text));}
    for(const objective of objectives)assert.ok(!f.html.includes(escape(objective)));
  }
});

test('round two typed funding is pending, capacity bounded, idempotent and cannot unlock prior promises',()=>{
  const f=fixture();f.click('council-propose',{id:'repair'});f.click('council-promise',{id:'showcase'});f.click('council-commit');
  const locked=snapshot(f);f.send('Fund error announcements and choose the previous screen.');assert.equal(f.chat.pending,null);assert.deepEqual(snapshot(f),locked);
  confirmed(f,'Fund error announcements.');assert.equal(f.view.aftermath.cost,5);assert.deepEqual(plain(f.state.council.workIds),['announce']);
  const before=snapshot(f);f.send('Fund error announcements.');assert.equal(f.chat.pending,null);assert.deepEqual(snapshot(f),before);
  f.send('Fund the interim save route.');assert.equal(f.chat.pending,null);assert.deepEqual(snapshot(f),before);
  for(const text of ['Withdraw the showcase promise.','Cancel local focus repair.','Choose the previous screen.','Inspect the support tags.','Fund error announcements and choose the previous screen.']){
    f.send(text);assert.equal(f.chat.pending,null,text);assert.deepEqual(snapshot(f),before,text);
  }
  f.click('council-finish');assert.deepEqual(f.view.debrief.fulfilled.map(w=>w.id),['repair-work','promise-showcase','announce']);
  assert.deepEqual(f.view.debrief.deferred.map(w=>w.id),['interim']);
});

test('typed combined offers use the same rules as presets in both councils',()=>{
  for(const example of [
    {topic:'accessibility',message:'Choose local repair and promise a revised showcase.',proposal:'repair',promise:'showcase',person:'design',source:'audit'},
    {topic:'systems',message:'Can we keep both API versions and agree retirement criteria?',proposal:'versioned',promise:'retirement',person:'platform',source:'consumers'}
  ]){
    const f=fixture(example.topic);f.speaker(example.person);f.click('council-investigate',{id:example.source});
    let expected=councilAct(f.state.council,{type:'propose',proposalId:example.proposal});
    expected=councilAct(expected,{type:'promise',commitmentId:example.promise});
    confirmed(f,example.message);assert.deepEqual(snapshot(f),plain(expected));
    assert.equal(f.view.stakeholders.find(p=>p.id===example.person).support,'supports');
    f.send('What would change your mind?');assert.ok(latest(f).reply.includes(f.view.stakeholders.find(p=>p.id===example.person).condition));
  }
});

test('a preset allocation invalidates pending typed work and the systems response uses real capacity',()=>{
  const f=fixture('systems');f.click('council-propose',{id:'versioned'});f.click('council-commit');
  f.send('Fund the partner migration fixture.');assert.ok(f.chat.pending);assert.equal(f.view.aftermath.cost,2);
  f.click('council-allocate',{id:'maintenance'});assert.equal(f.chat.pending,null);assert.equal(f.view.aftermath.cost,5);
  const before=snapshot(f);f.dispatch('talk-confirm');assert.deepEqual(snapshot(f),before);
  f.send('Fund the partner migration fixture.');assert.equal(f.chat.pending,null);assert.deepEqual(snapshot(f),before);
  confirmed(f,'Withdraw dual-format maintenance.');assert.equal(f.view.aftermath.cost,2);
  confirmed(f,'Fund the partner migration fixture.');assert.equal(f.view.aftermath.cost,4);assert.deepEqual(plain(f.state.council.workIds),['parser']);
});

test('new messages replace unconfirmed interpretations and keyboard submission follows the same path',()=>{
  const f=fixture();f.send('I promise a revised showcase.',true);assert.ok(f.chat.pending);
  const before=snapshot(f);f.send('Yes',true);assert.equal(f.chat.pending,null);assert.deepEqual(snapshot(f),before);
  f.send('I promise a revised showcase.',true);assert.ok(f.chat.pending);
  f.send('Order an espresso.',true);assert.equal(f.chat.pending,null);
  f.dispatch('talk-confirm');assert.deepEqual(snapshot(f),before);assert.equal(f.chat.total,4);
});

test('mixed add-and-withdraw requests ask for clarification instead of reversing an intended addition',()=>{
  const f=fixture();f.click('council-promise',{id:'triage'});let before=snapshot(f);
  f.send('Promise a revised showcase and withdraw triage.');assert.equal(f.chat.pending,null);assert.deepEqual(snapshot(f),before);
  f.click('council-propose',{id:'repair'});f.click('council-commit');f.click('council-allocate',{id:'announce'});before=snapshot(f);
  f.send('Withdraw error announcements and fund the interim save route.');assert.equal(f.chat.pending,null);assert.deepEqual(snapshot(f),before);
});

test('transcript and draft escape markup, keep only twelve exchanges, and replay clears all conversation state',()=>{
  const f=fixture();const attack='<img src=x onerror="alert(1)"><script>alert(2)</script>';
  f.input('council-message',attack);f.speaker('support');assert.ok(f.html.includes(escape(attack)));assert.ok(!f.html.includes(attack));
  f.send(attack);assert.ok(f.html.includes(escape(attack)));assert.ok(!f.html.includes(attack));
  for(let i=0;i<15;i++)f.send(`Unsupported espresso question ${i}`);
  assert.equal(f.chat.messages.length,12);assert.equal(f.chat.total,16);
  assert.equal((f.html.match(/class="chat-exchange"/g)||[]).length,12);
  assert.ok(!f.html.includes(escape(attack)));
  f.dispatch('council-replay');assert.equal(f.chat.messages.length,0);assert.equal(f.chat.total,0);assert.equal(f.chat.pending,null);assert.equal(f.chat.draft,'');
});

test('a completed chat council preserves activity when the existing coaching and rehearsal flow runs',()=>{
  const f=fixture();f.send('What would change your mind?');f.click('council-propose',{id:'repair'});f.click('council-commit');f.click('council-finish');
  const entry=plain(f.state.history[0]);assert.equal(entry.questions,1);
  f.click('back-practice');f.click('start',{case:'general'});f.choose(1);f.input('reasoning','The current evidence does not establish older-browser behavior.');f.click('commit');
  f.choose(2);f.input('reasoning','Check the older-browser cohort before widening the rollout.');f.click('finish');
  const attempt=plain(f.state.attempt);f.input('rehearsal-answer','I recommend a bounded test because the browser cohort remains uncertain.');f.click('rehearse');
  assert.equal(f.state.view,'review');assert.equal(f.state.history.length,2);assert.deepEqual(plain(f.state.history[0]),entry);assert.deepEqual(plain(f.state.attempt),attempt);
  const history=plain(f.state.history);f.dispatch('talk-confirm');assert.deepEqual(plain(f.state.history),history);assert.equal(f.state.view,'review');
});
