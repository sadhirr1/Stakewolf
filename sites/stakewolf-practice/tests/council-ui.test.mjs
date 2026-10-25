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

// Independent SCRUM-38 regression checks execute the real app event handlers.
// The DOM double checks rendered controls and state, not native browser behavior,
// layout, screen-reader announcements, or focus. Browser review is separate.
const source=(await readFile(new URL('../dist/app.mjs',import.meta.url),'utf8'))
  .replace(/^import .*;\r?\n/gm,'')+'\nglobalThis.subject={state,start};';
const plain=value=>JSON.parse(JSON.stringify(value));
const escape=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function fixture(){
  let html='';
  const handlers={};
  const nodes=new Map();
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
  const context=vm.createContext({newCouncilAttempt,noteCouncilQuestion,noteCouncilChange,councilReportMarkup,document,window:{scrollTo(){},scrollY:0},cases,profiles,competencies,analyzeJD,makeCase,buildFeedback,councilTopics,createCouncil,councilView,councilAct,councilMarkup,councilEntry,newCouncilChat,submitCouncilMessage,confirmCouncilMessage,councilChatMarkup});
  vm.runInContext(source,context,{filename:'app.mjs'});
  const dispatch=(action,data={})=>handlers.click({target:{closest(){return {dataset:{action,...data}};}}});
  const control=(action,data={})=>[...html.matchAll(/<button\b([^>]*)>/g)]
    .map(m=>m[1]).find(attrs=>attrs.includes(`data-action="${action}"`)&&Object.entries(data).every(([key,value])=>attrs.includes(`data-${key}="${value}"`)));
  return {subject:context.subject,get html(){return html;},get view(){return councilView(context.subject.state.council);},control,dispatch,
    click(action,data={}){
      const attrs=control(action,data);assert.ok(attrs,`Missing rendered button: ${action} ${JSON.stringify(data)}`);
      const id=attrs.match(/\bid="([^"]+)"/)?.[1];
      const disabled=id&&nodes.has(`#${id}`)?nodes.get(`#${id}`).disabled:/\bdisabled\b/.test(attrs);
      assert.equal(disabled,false,`Disabled rendered button: ${action}`);dispatch(action,data);
    },
    input(id,value){handlers.input({target:{id,value}});},
    choose(index){handlers.change({target:{name:'decision',value:String(index)}});}};
}
function start(f,topic='accessibility'){f.click('start-council',{topic});}
function propose(f,id){f.click('council-propose',{id});}
function promise(f,id){f.click('council-promise',{id});}
function inspect(f,id){f.click('council-investigate',{id});}
function support(f,id){return f.view.stakeholders.find(p=>p.id===id).support;}
function complete(f,proposalId){propose(f,proposalId);f.click('council-commit');f.click('council-finish');}

test('home and general practice each reach both named councils and return to general practice',()=>{
  for(const entry of ['home','general'])for(const topic of ['accessibility','systems']){
    const f=fixture();if(entry==='general')f.click('general');
    assert.equal((f.html.match(/data-action="start-council"/g)||[]).length,2);
    start(f,topic);
    assert.equal(f.subject.state.view,'council');
    assert.equal(f.subject.state.council.topic,topic);
    assert.equal(f.subject.state.councilOrigin,'general');
    assert.match(f.html,/GENERAL PRACTICE \/ TWO CONNECTED ROUNDS/);
    assert.match(f.html,/progress clears on refresh/);
    f.click('back-practice');assert.equal(f.subject.state.view,'general');
  }
});

test('JD responsibility links select the corresponding council and preserve the preparation path',()=>{
  for(const {topic,jd,proposalId} of [
    {topic:'accessibility',jd:'UI product manager. Own accessibility, keyboard navigation and inclusive design.',proposalId:'repair'},
    {topic:'systems',jd:'Platform product manager. Own API strategy, backward compatibility and system dependencies.',proposalId:'versioned'}
  ]){
    const f=fixture();f.click('jd');f.input('jd-text',jd);f.click('build-path');
    assert.equal(f.subject.state.view,'path');
    assert.ok(f.subject.state.selected.includes(topic));
    const selected=plain(f.subject.state.selected);
    assert.ok(f.control('start-council',{topic}));
    start(f,topic);
    assert.equal(f.subject.state.councilOrigin,'interview');
    assert.match(f.html,/FROM YOUR SELECTED JD RESPONSIBILITY/);
    complete(f,proposalId);
    assert.equal(f.subject.state.history[0].mode,'interview');
    f.click('back-practice');
    assert.equal(f.subject.state.view,'path');
    assert.equal(f.subject.state.jd,jd);
    assert.deepEqual(plain(f.subject.state.selected),selected);
  }
});

test('accessibility bargaining visibly changes support and carries all six reserved units',()=>{
  const f=fixture();start(f);propose(f,'repair');
  assert.equal(f.view.cost,2);assert.equal(support(f,'design'),'conditional');
  promise(f,'showcase');
  assert.equal(f.view.cost,3);assert.equal(support(f,'design'),'supports');
  inspect(f,'focus');promise(f,'verification');
  assert.equal(f.view.cost,5);assert.equal(support(f,'engineering'),'supports');
  inspect(f,'queue');promise(f,'triage');
  assert.equal(f.view.cost,6);assert.equal(support(f,'support'),'supports');
  assert.equal((f.html.match(/data-support="supports"/g)||[]).length,3);
  assert.match(f.html,/<ul class="council-position-list"><li><b>Mara<\/b><span>Supports<\/span>/);
  // Withdrawing a promise is allowed before closing, and removes its backing.
  promise(f,'showcase');assert.equal(f.view.cost,5);assert.equal(support(f,'design'),'conditional');
  promise(f,'showcase');f.click('council-commit');
  assert.equal(f.view.phase,'aftermath');assert.equal(f.view.aftermath.cost,6);
  assert.equal(f.view.aftermath.work.filter(w=>w.locked).length,4);
  assert.match(f.html,/Reserved by your earlier decision · locked/);
  for(const w of f.view.aftermath.work.filter(w=>!w.locked))assert.match(f.control('council-allocate',{id:w.id}),/\bdisabled\b/);
  f.click('council-finish');
  assert.equal(f.view.debrief.fulfilled.length,4);
  assert.equal(f.view.debrief.deferred.length,2);
  assert.match(f.html,/Promises reserved 4 units alongside 2 for the decision/);
  for(const w of f.view.debrief.deferred)assert.ok(f.html.includes(escape(w.consequence)));
});

test('systems support depends on the investigated claim as well as the offered promise',()=>{
  const f=fixture();start(f,'systems');propose(f,'versioned');
  promise(f,'retirement');assert.equal(support(f,'platform'),'conditional');
  inspect(f,'consumers');assert.equal(support(f,'platform'),'supports');
  promise(f,'customer');assert.equal(support(f,'account'),'conditional');
  inspect(f,'contract');assert.equal(support(f,'account'),'supports');
  promise(f,'rollback');
  assert.equal(f.view.cost,6);
  assert.equal(support(f,'reliability'),'opposes');
  assert.match(f.control('council-investigate',{id:'canary'}),/\bdisabled\b/);
  f.dispatch('council-investigate',{id:'canary'});
  assert.equal(f.view.investigationRemaining,0);
  assert.equal(support(f,'reliability'),'opposes');
  f.click('council-commit');
  assert.match(f.html,/Opposed your proposal/);
  f.click('council-finish');
  assert.match(f.html,/parser.*deferred|deferred.*parser/is);
});

test('round two prevents over-allocation, locks promises and proposal, and records only funded response work',()=>{
  const f=fixture();start(f);propose(f,'repair');promise(f,'showcase');f.click('council-commit');
  assert.equal(f.view.aftermath.cost,3);
  const locked=f.view.aftermath.work.filter(w=>w.locked);
  const before=plain(f.subject.state.council);
  for(const w of locked){assert.equal(f.control('council-allocate',{id:w.id}),undefined);f.dispatch('council-allocate',{id:w.id});}
  f.dispatch('council-promise',{id:'showcase'});
  f.dispatch('council-propose',{id:'replace'});
  f.dispatch('council-investigate',{id:'audit'});
  assert.deepEqual(plain(f.subject.state.council),before);
  f.click('council-allocate',{id:'announce'});assert.equal(f.view.aftermath.cost,5);
  assert.match(f.view.aftermath.reactions.find(r=>r.name==='Mara').text,/Repair and verify error announcements is funded in your response plan/);
  assert.match(f.view.aftermath.reactions.find(r=>r.name==='Jules').text,/If you finish now: Affected users still lack a verified interim save route/);
  assert.match(f.control('council-allocate',{id:'interim'}),/\bdisabled\b/);
  f.dispatch('council-allocate',{id:'interim'});assert.equal(f.view.aftermath.cost,5);
  assert.deepEqual(plain(f.subject.state.council.workIds),['announce']);
  f.click('council-allocate',{id:'announce'});assert.equal(f.view.aftermath.cost,3);
  f.click('council-allocate',{id:'interim'});assert.equal(f.view.aftermath.cost,6);
  assert.match(f.view.aftermath.reactions.find(r=>r.name==='Mara').text,/If you finish now: The save-error announcement remains a task barrier/);
  assert.match(f.view.aftermath.reactions.find(r=>r.name==='Jules').text,/Provide a verified interim save route is funded in your response plan/);
  f.click('council-finish');
  assert.deepEqual(f.view.debrief.fulfilled.map(w=>w.id),['repair-work','promise-showcase','interim']);
  assert.deepEqual(f.view.debrief.deferred.map(w=>w.id),['announce']);
  assert.match(f.html,/The save-error announcement remains a task barrier/);
  assert.match(f.html,/An interim save route is checked and communicated/);
});

test('objectives and unopened source content stay out of live views until the appropriate reveal',()=>{
  for(const {topic,proposalId} of [{topic:'accessibility',proposalId:'repair'},{topic:'systems',proposalId:'versioned'}]){
    const finished=councilAct(councilAct(councilAct(createCouncil(topic),{type:'propose',proposalId}),{type:'commit'}),{type:'finish'});
    const objectives=councilView(finished).debrief.reveals.map(r=>r.objective);
    const f=fixture();start(f,topic);
    for(const phase of ['council','aftermath']){
      assert.equal(f.view.phase,phase);assert.equal(f.view.debrief,null);
      assert.ok(f.view.records.every(r=>!Object.hasOwn(r,'text')));
      for(const objective of objectives){assert.ok(!JSON.stringify(f.view).includes(objective));assert.ok(!f.html.includes(escape(objective)));}
      if(phase==='council'){propose(f,proposalId);f.click('council-commit');}
    }
    f.click('council-finish');
    for(const objective of objectives)assert.ok(f.html.includes(escape(objective)));
    assert.match(f.html,/You were not expected to know these motives in advance/);
    assert.match(f.html,/it does not prove dishonesty/);
  }
});

test('invalid, duplicate and late actions cannot advance early or duplicate a completed attempt',()=>{
  const f=fixture();f.dispatch('start-council',{topic:'unknown'});assert.equal(f.subject.state.council,null);
  start(f);assert.match(f.control('council-commit'),/\bdisabled\b/);
  f.dispatch('council-commit');assert.equal(f.view.phase,'council');
  inspect(f,'audit');f.dispatch('council-investigate',{id:'audit'});
  assert.equal(f.view.investigationRemaining,1);
  propose(f,'repair');f.click('council-commit');f.dispatch('council-commit');
  assert.equal(f.view.phase,'aftermath');assert.equal(f.subject.state.history.length,0);
  f.click('council-finish');const completed=plain(f.subject.state.council),history=plain(f.subject.state.history);
  for(const [action,id] of [['finish',''],['commit',''],['investigate','focus'],['propose','replace'],['promise','triage'],['allocate','announce']])f.dispatch(`council-${action}`,{id});
  assert.deepEqual(plain(f.subject.state.council),completed);
  assert.deepEqual(plain(f.subject.state.history),history);
  assert.equal(history.length,1);assert.equal(history[0].records,1);
});

test('replay resets council state and hides objectives while keeping completed activity separate',()=>{
  const f=fixture();start(f,'systems');inspect(f,'canary');propose(f,'readiness');promise(f,'rollback');
  f.click('council-commit');f.click('council-allocate',{id:'parser'});f.click('council-finish');
  const first=plain(f.subject.state.history);
  f.click('council-replay');
  assert.deepEqual(plain(f.subject.state.council),createCouncil('systems'));
  assert.deepEqual(plain(f.subject.state.history),first);
  assert.doesNotMatch(f.html,/PRIVATE OBJECTIVE|The agendas behind the claims/);
  complete(f,'narrow');assert.equal(f.subject.state.history.length,2);
  assert.deepEqual(plain(f.subject.state.history[0]),first[0]);
  assert.notEqual(f.subject.state.history[0].decision,f.subject.state.history[1].decision);
  f.click('back-practice');start(f,'accessibility');
  assert.deepEqual(plain(f.subject.state.council),createCouncil('accessibility'));
  assert.equal(f.subject.state.history.length,2);
});

test('existing coach still completes and rehearses after a council without overwriting its activity',()=>{
  const f=fixture();start(f);complete(f,'repair');const councilHistory=plain(f.subject.state.history[0]);
  f.click('back-practice');f.click('start',{case:'general'});f.choose(1);
  f.input('reasoning','The conversion brief does not establish the effect for older browsers.');
  f.click('ask',{index:'0'});f.click('commit');f.choose(2);
  f.input('reasoning','I would verify the browser cohort before widening because the comparison is limited.');f.click('finish');
  assert.equal(f.subject.state.view,'review');assert.match(f.html,/YOUR ANSWER \/ LOCAL COACHING/);
  const attempt=plain(f.subject.state.attempt);
  f.input('rehearsal-answer','I recommend a bounded test because the browser cohort remains uncertain.');f.click('rehearse');
  assert.match(f.html,/Rehearsal signals — original attempt preserved/);
  assert.deepEqual(plain(f.subject.state.attempt),attempt);
  f.dispatch('council-finish');f.dispatch('council-replay');
  assert.equal(f.subject.state.view,'review');assert.equal(f.subject.state.history.length,2);
  assert.deepEqual(plain(f.subject.state.history[0]),councilHistory);
});
