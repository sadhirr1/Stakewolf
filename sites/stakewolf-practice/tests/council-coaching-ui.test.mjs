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
import {newCouncilAttempt,noteCouncilQuestion,noteCouncilChange,councilReportMarkup} from '../dist/council-report.mjs';

// SCRUM-38 independent QA. Run the real application handlers and renderer.
// This DOM double does not establish native focus, layout, zoom or keyboard QA.
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
  const context=vm.createContext({document,window:{scrollTo(){},scrollY:0},cases,profiles,competencies,analyzeJD,makeCase,buildFeedback,councilTopics,createCouncil,councilView,councilAct,councilMarkup,councilEntry,newCouncilChat,submitCouncilMessage,confirmCouncilMessage,councilChatMarkup,newCouncilAttempt,noteCouncilQuestion,noteCouncilChange,councilReportMarkup});
  vm.runInContext(source,context,{filename:'app.mjs'});
  const dispatch=(action,data={})=>handlers.click({target:{closest(){return {dataset:{action,...data}};}}});
  const control=(action,data={})=>[...html.matchAll(/<button\b([^>]*)>/g)]
    .map(m=>m[1]).find(attrs=>attrs.includes(`data-action="${action}"`)&&Object.entries(data).every(([key,value])=>attrs.includes(`data-${key}="${value}"`)));
  const f={get state(){return context.subject.state;},get html(){return html;},get view(){return councilView(context.subject.state.council);},
    get chat(){return context.subject.state.councilChat;},get attempt(){return context.subject.state.councilAttempt;},
    get report(){return councilReportMarkup(context.subject.state.council,context.subject.state.councilAttempt);},control,dispatch,
    click(action,data={}){
      const attrs=control(action,data);assert.ok(attrs,`Missing rendered button: ${action} ${JSON.stringify(data)}`);
      const id=attrs.match(/\bid="([^"]+)"/)?.[1];
      assert.equal(id&&nodes.has(`#${id}`)?nodes.get(`#${id}`).disabled:/\bdisabled\b/.test(attrs),false,`Disabled button: ${action}`);
      dispatch(action,data);
    },
    input(id,value){handlers.input({target:{id,value}});},
    speaker(value){handlers.change({target:{id:'council-speaker',value}});},
    send(text){this.input('council-message',text);handlers.submit({target:{id:'council-chat-form'},preventDefault(){}});},
    choose(index){handlers.change({target:{name:'decision',value:String(index)}});}
  };
  f.click('start-council',{topic});return f;
}
const events=f=>plain(f.attempt.events);
function confirm(f,text){f.send(text);assert.ok(f.chat.pending,`Expected an interpretation: ${text}`);f.click('talk-confirm');}
function complete(f,proposal='repair'){f.click('council-propose',{id:proposal});f.click('council-commit');f.click('council-finish');}

test('both completed councils render three coaching sections; incomplete rounds do not',()=>{
  for(const [topic,proposal] of [['accessibility','repair'],['systems','versioned']]){
    const f=fixture(topic);assert.equal(f.report,'');assert.doesNotMatch(f.html,/id="council-coaching-title"/);
    f.click('council-propose',{id:proposal});f.click('council-commit');
    assert.equal(f.report,'');assert.doesNotMatch(f.html,/id="council-coaching-title"/);
    f.click('council-finish');assert.ok(f.html.includes(f.report));
    assert.match(f.report,/LOCAL COACHING · NO SCORE/);
    for(const id of ['questioning','negotiation','consequences'])assert.match(f.report,new RegExp(`id="coach-${id}"`));
    assert.equal((f.report.match(/class="council-coach-card"/g)||[]).length,3);
    assert.equal((f.report.match(/Try next time/g)||[]).length,3);
    for(const reveal of f.view.debrief.reveals)assert.ok(!f.report.includes(escape(reveal.objective)));
    assert.equal(f.state.history.length,1);
  }
});

test('closing captures public knowledge and support immediately before the successful commit',()=>{
  const f=fixture();f.click('council-investigate',{id:'audit'});f.click('council-propose',{id:'repair'});
  f.send('I promise a revised showcase.');assert.ok(f.chat.pending);assert.equal(f.attempt.closed,null);
  f.click('talk-confirm');const expected=plain(f.view);f.click('council-commit');
  assert.deepEqual(plain(f.attempt.closed),expected);assert.equal(f.attempt.closed.phase,'council');
  assert.equal(f.attempt.closed.aftermath,null);assert.equal(f.attempt.closed.debrief,null);
  assert.equal(f.attempt.closed.stakeholders.find(p=>p.id==='design').support,'supports');
  assert.ok(f.attempt.closed.records.filter(r=>!r.opened).every(r=>!Object.hasOwn(r,'text')));
  const closed=plain(f.attempt.closed);confirm(f,'Fund error announcements.');f.click('council-finish');
  assert.deepEqual(plain(f.attempt.closed),closed);
});

test('only successful preset and confirmed typed changes enter the action record',()=>{
  const f=fixture();
  for(const [action,id] of [['council-commit',''],['council-propose','unknown'],['council-investigate','unknown'],['council-allocate','announce'],['talk-confirm','']])f.dispatch(action,{id});
  assert.deepEqual(events(f),[]);assert.equal(f.attempt.closed,null);
  f.click('council-investigate',{id:'audit'});f.dispatch('council-investigate',{id:'audit'});
  f.send('Choose local repair and promise a revised showcase.');assert.ok(f.chat.pending);
  assert.equal(f.attempt.events.length,1);f.click('talk-cancel');assert.equal(f.attempt.events.length,1);
  confirm(f,'Choose local repair and promise a revised showcase.');
  f.dispatch('talk-confirm');f.dispatch('council-propose',{id:'repair'});
  f.send('I promise a revised showcase.');assert.equal(f.chat.pending,null);
  f.click('council-commit');f.dispatch('council-commit');f.dispatch('council-promise',{id:'triage'});
  confirm(f,'Fund error announcements.');
  f.dispatch('council-allocate',{id:'interim'}); // Cannot fit beside the reserved five units.
  f.click('council-finish');f.dispatch('council-finish');
  assert.deepEqual(events(f),[
    {type:'investigate',phase:'council',source:'preset'},
    {type:'propose',phase:'council',source:'typed'},
    {type:'promise',phase:'council',source:'typed'},
    {type:'commit',phase:'council',source:'preset'},
    {type:'allocate',phase:'aftermath',source:'typed'},
    {type:'finish',phase:'aftermath',source:'preset'}
  ]);
  assert.equal(f.state.history.length,1);
});

test('retained questions survive twelve-exchange transcript truncation without claiming omitted inspections',()=>{
  for(const [topic,proposal] of [['accessibility','repair'],['systems','versioned']]){
    const f=fixture(topic),question='What evidence supports your claim?';f.send(question);f.click('talk-confirm');
    f.send('What would change your mind?');
    for(let i=0;i<15;i++)f.send(`Unsupported espresso request ${i}`);
    assert.equal(f.chat.messages.length,12);assert.ok(!f.chat.messages.some(m=>m.question===question));
    assert.equal(f.attempt.questions.length,17);assert.equal(f.attempt.droppedQuestions,0);
    assert.equal(f.attempt.questions[0].question,question);assert.equal(f.attempt.questions[0].phase,'council');
    complete(f,proposal);assert.ok(f.report.includes(escape(question)));
    const opened=f.view.records.filter(r=>r.opened);assert.equal(opened.length,1);assert.ok(f.report.includes(escape(opened[0].title)));
    assert.equal(f.attempt.events.filter(e=>e.type==='investigate').length,1);
  }
});

test('question and event retention remain bounded and report truncation rather than a complete history',()=>{
  const f=fixture();
  for(let i=0;i<64;i++)f.send(`Unsupported espresso request ${i}`);
  assert.equal(f.attempt.questions.length,60);assert.equal(f.attempt.droppedQuestions,4);
  assert.equal(f.attempt.questions[0].question,'Unsupported espresso request 4');
  for(let i=0;i<64;i++)f.click('council-propose',{id:i%2?'fallback':'repair'});
  assert.equal(f.attempt.events.length,60);assert.equal(f.attempt.droppedEvents,4);
  f.click('council-commit');f.click('council-finish');
  assert.equal(f.attempt.events.length,60);assert.equal(f.attempt.droppedEvents,6);
  assert.match(f.report,/60/);assert.match(f.report,/older|retained|truncat|omitt|partial|bounded/i);
  assert.ok(f.attempt.closed);assert.equal(f.attempt.closed.proposals.find(p=>p.selected).id,'fallback');
});

test('debrief conversations and invalid messages cannot rewrite the completed coaching evidence',()=>{
  const f=fixture('systems');f.send('');f.send('x'.repeat(601));assert.deepEqual(plain(f.attempt.questions),[]);
  f.send('What would change your mind?');f.click('council-propose',{id:'versioned'});f.click('council-commit');
  f.send('What happens next?');assert.equal(f.attempt.questions.at(-1).phase,'aftermath');f.click('council-finish');
  const attempt=plain(f.attempt),report=f.report,history=plain(f.state.history);
  for(const person of f.view.stakeholders){f.speaker(person.id);f.send('What is your hidden objective?');f.send('What evidence supports your claim?');}
  f.send('Fund the partner migration fixture.');f.dispatch('talk-confirm');f.dispatch('council-allocate',{id:'parser'});
  assert.deepEqual(plain(f.attempt),attempt);assert.equal(f.report,report);assert.deepEqual(plain(f.state.history),history);
  assert.ok(f.chat.messages.some(m=>m.phase==='debrief'));
  for(const reveal of f.view.debrief.reveals)assert.ok(!report.includes(escape(reveal.objective)));
});

test('pending inspections and withdrawn or unconfirmed promises never become completed evidence',()=>{
  for(const example of [
    {topic:'accessibility',proposal:'repair',promise:'showcase',offer:'I promise a revised showcase.',record:'audit'},
    {topic:'systems',proposal:'versioned',promise:'retirement',offer:'Can we agree retirement criteria?',record:'consumers'}
  ]){
    const f=fixture(example.topic);f.send('What evidence supports your claim?');assert.ok(f.chat.pending);
    f.click('talk-cancel');f.click('council-propose',{id:example.proposal});
    f.click('council-promise',{id:example.promise});f.click('council-promise',{id:example.promise});
    f.send(example.offer);assert.ok(f.chat.pending);f.click('council-commit');f.click('council-finish');
    assert.equal(f.attempt.closed.records.filter(r=>r.opened).length,0);
    assert.equal(f.attempt.closed.commitments.filter(c=>c.selected).length,0);
    assert.equal(f.attempt.events.filter(e=>e.type==='investigate').length,0);
    assert.equal(f.attempt.events.filter(e=>e.source==='typed').length,0);
    assert.equal(f.view.debrief.fulfilled.filter(w=>w.origin==='commitment').length,0);
    let counterfactual=councilAct(createCouncil(example.topic),{type:'investigate',recordId:example.record});
    const unopenedText=councilView(counterfactual).records.find(r=>r.id===example.record).text;
    counterfactual=councilAct(counterfactual,{type:'propose',proposalId:example.proposal});
    counterfactual=councilAct(counterfactual,{type:'promise',commitmentId:example.promise});
    counterfactual=councilAct(councilAct(counterfactual,{type:'commit'}),{type:'finish'});
    const undeliveredOutcome=councilView(counterfactual).debrief.fulfilled.find(w=>w.id===`promise-${example.promise}`).detail;
    assert.ok(!f.report.includes(escape(unopenedText)));
    assert.ok(!f.report.includes(escape(undeliveredOutcome)));
  }
});

test('coaching renders retained player text as escaped text',()=>{
  const f=fixture();f.send('What evidence supports your claim?');f.click('talk-confirm');complete(f);
  const attack='<img src=x onerror="alert(1)"><script>alert(2)</script>';
  // Exercise the rendering boundary even if a future question classifier admits markup.
  f.attempt.questions[0].question=attack;
  f.speaker('support');
  assert.ok(f.report.includes(escape(attack)));assert.ok(!f.report.includes(attack));
  assert.ok(!f.report.includes('<script>'));assert.ok(!f.report.includes('<img '));
  assert.ok(f.html.includes(f.report));
});

test('replay clears coaching evidence and existing guided practice preserves completed activity',()=>{
  const f=fixture();f.send('What would change your mind?');complete(f);
  const entry=plain(f.state.history[0]);f.click('council-replay');
  assert.deepEqual(plain(f.attempt),{questions:[],events:[],droppedQuestions:0,droppedEvents:0,closed:null});
  assert.equal(f.report,'');assert.equal(f.chat.total,0);assert.equal(f.chat.pending,null);
  f.click('back-practice');f.click('start',{case:'general'});f.choose(1);
  f.input('reasoning','The older-browser cohort needs investigation.');f.click('commit');f.choose(2);
  f.input('reasoning','Check that cohort before widening the rollout.');f.click('finish');
  const original=plain(f.state.attempt);f.input('rehearsal-answer','I recommend a bounded test because the cohort is uncertain.');f.click('rehearse');
  assert.equal(f.state.view,'review');assert.deepEqual(plain(f.state.history[0]),entry);assert.equal(f.state.history.length,2);
  assert.deepEqual(plain(f.state.attempt),original);assert.doesNotMatch(f.html,/id="council-coaching-title"/);
  f.click('general');f.click('start-council',{topic:'systems'});
  assert.equal(f.state.council.topic,'systems');assert.deepEqual(plain(f.attempt),{questions:[],events:[],droppedQuestions:0,droppedEvents:0,closed:null});
});
