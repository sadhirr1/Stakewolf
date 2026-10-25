import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';
import {cases,profiles} from '../dist/content.mjs';
import {competencies,analyzeJD,makeCase} from '../dist/adapt.mjs';
import {buildFeedback} from '../dist/feedback.mjs';
import {councilTopics,createCouncil,councilView,councilAct} from '../dist/council.mjs';
import {councilMarkup,councilEntry} from '../dist/council-view.mjs';

// Executes the real handlers with a small DOM double. This verifies state and
// generated markup, not browser layout, native focus, or browser event ordering.
const source=(await readFile(new URL('../dist/app.mjs',import.meta.url),'utf8'))
  .replace(/^import .*;\r?\n/gm,'')+'\nglobalThis.subject={state,start};';
const plain=value=>JSON.parse(JSON.stringify(value));
function fixture(){
  let html='',records=[];
  const handlers={};
  const placeholder={focus(){},disabled:false};
  const app={addEventListener(type,callback){handlers[type]=callback;},contains(el){return records.includes(el);}};
  Object.defineProperty(app,'innerHTML',{get:()=>html,set(value){
    for(const record of records)record.isConnected=false;
    html=value;
    records=[...value.matchAll(/<details\b[^>]*data-record="([^"]+)"([^>]*)>/g)].map(match=>{
      const callbacks={};
      return {dataset:{record:match[1]},open:/\bopen\b/.test(match[2]),isConnected:true,
        addEventListener(type,callback){callbacks[type]=callback;},
        dispatchToggle(){callbacks.toggle?.({target:this});}};
    });
  }});
  const document={querySelector(selector){return selector==='#app'?app:placeholder;},
    querySelectorAll(selector){if(selector==='[data-record]')return records;if(selector==='[data-record][open]')return records.filter(r=>r.open);return [];}};
  const context=vm.createContext({document,window:{scrollTo(){},scrollY:0},cases,profiles,competencies,analyzeJD,makeCase,buildFeedback,councilTopics,createCouncil,councilView,councilAct,councilMarkup,councilEntry});
  vm.runInContext(source,context,{filename:'app.mjs'});
  return {subject:context.subject,get html(){return html;},get records(){return records;},
    click(action,data={}){handlers.click({target:{closest(){return {dataset:{action,...data}};}}});},
    input(id,value){handlers.input({target:{id,value}});},
    choose(index){handlers.change({target:{name:'decision',value:String(index)}});}};
}
function begin(f,id='general'){f.click('start',{case:id});f.choose(1);}
function complete(f){f.click('commit');f.click('finish');}

test('first evidence snapshot is fixed; later evidence is recorded separately',()=>{
  const f=fixture();begin(f);
  f.records[0].open=true; // no toggle delivered yet
  f.input('reasoning','Conversion brief: this segment alone cannot settle the rollout.');
  f.click('commit');
  assert.deepEqual(plain(f.subject.state.openedBefore),['conversion']);
  f.records[1].open=true;
  f.input('reasoning','I would compare the older browser before widening.');
  f.click('finish');
  assert.deepEqual(plain(f.subject.state.attempt.openedBefore),['conversion']);
  assert.deepEqual(plain(f.subject.state.attempt.openedAfter),['conversion','support']);
  const feedback=buildFeedback(cases.general,f.subject.state.attempt);
  assert.equal(feedback.records.find(r=>r.id==='support').openedBefore,false);
  assert.equal(feedback.records.find(r=>r.id==='support').openedAfter,true);
  assert.match(f.html,/Opened after deciding/);
});

test('commit, finish, and late question delivery cannot duplicate or alter a completed attempt',()=>{
  const f=fixture();begin(f);f.click('ask',{index:'0'});f.click('commit');
  const first=plain(f.subject.state.openedBefore);f.click('commit');
  f.click('ask',{index:'1'});assert.equal(f.subject.state.asked.size,1);
  f.click('finish');const attempt=plain(f.subject.state.attempt);
  f.click('finish');f.click('ask',{index:'1'});
  assert.equal(f.subject.state.history.length,1);
  assert.deepEqual(plain(f.subject.state.attempt),attempt);
  assert.deepEqual(plain(f.subject.state.openedBefore),first);
});

test('rehearsal and clearing it preserve original answers, decisions, and history',()=>{
  const f=fixture();begin(f);f.input('reasoning','First answer.');f.click('commit');
  f.choose(2);f.input('reasoning','Final answer.');f.click('finish');
  const before=plain({attempt:f.subject.state.attempt,history:f.subject.state.history,note:f.subject.state.note,revision:f.subject.state.revision,choice:f.subject.state.choice});
  f.input('rehearsal-answer','My recommendation is a bounded test because the denominator is unknown.');f.click('rehearse');
  assert.match(f.html,/Rehearsal signals — original attempt preserved/);
  f.input('rehearsal-answer','');f.click('rehearse');f.click('reset-rehearsal');
  assert.equal(f.subject.state.rehearsalResult,null);
  assert.deepEqual(plain({attempt:f.subject.state.attempt,history:f.subject.state.history,note:f.subject.state.note,revision:f.subject.state.revision,choice:f.subject.state.choice}),before);
});

test('answer and rehearsal markup is displayed literally in all feedback contexts',()=>{
  const f=fixture();begin(f);const payload='</textarea><img src=x onerror="alert(1)"><script>bad()</script>&';
  f.input('reasoning',payload);f.click('commit');f.input('reasoning',payload);f.click('finish');
  f.input('rehearsal-answer',payload);f.click('rehearse');
  assert.doesNotMatch(f.html,/<img src=x|<script>bad/);
  assert.match(f.html,/&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt;/);
  assert.equal(f.subject.state.attempt.note,payload);
});

test('a record opened before asking is retained even if its toggle is still queued',()=>{
  const f=fixture();begin(f);f.records[0].open=true;
  f.click('ask',{index:'1'});f.click('commit');
  assert.deepEqual(plain(f.subject.state.openedBefore),['conversion']);
});

test('detached record toggle from a previous attempt cannot contaminate a new round',()=>{
  const f=fixture();begin(f);const stale=f.records[0];stale.open=true;
  f.click('start',{case:'ui'});stale.dispatchToggle();
  assert.equal(f.subject.state.opened.size,0);
  f.choose(0);complete(f);
  assert.deepEqual(plain(f.subject.state.attempt.openedBefore),[]);
  assert.equal(f.subject.state.history[0].records,0);
});

test('adaptive question budget has descriptive coverage and keeps private incentives out of coaching',()=>{
  const f=fixture();const topic=competencies[0].id;f.subject.start(topic,makeCase(topic,{level:'PM',role:'general'}));
  f.choose(0);f.click('ask',{index:'0'});f.click('ask',{index:'1'});f.click('ask',{index:'2'});complete(f);
  assert.equal(f.subject.state.asked.size,2);
  assert.match(f.html,/one stakeholder will remain unasked/);
  const coaching=f.html.split('<section class="agenda-reveal">')[0];
  for(const person of f.subject.state.activeCase.people)assert.ok(!coaching.includes(person.privateAim));
});

test('all authored rounds complete with blank notes and a replay clears only attempt-specific state',()=>{
  const examples=[...Object.entries(cases).map(([id,c])=>({id,c,adaptive:false})),...competencies.map(skill=>({id:skill.id,c:makeCase(skill.id),adaptive:true}))];
  for(const {id,c,adaptive} of examples){
    const f=fixture();f.subject.start(id,adaptive?c:null);f.choose(2);complete(f);
    assert.equal(f.subject.state.view,'review');
    assert.match(f.html,/No answer written for this stage/);
    assert.equal(f.subject.state.history.length,1);
    f.input('rehearsal-answer','My final rehearsal.');f.click('rehearse');
    f.subject.start(id,adaptive?c:null);
    assert.equal(f.subject.state.stage,'investigate');
    assert.equal(f.subject.state.attempt,null);
    assert.equal(f.subject.state.rehearsalResult,null);
    assert.equal(f.subject.state.rehearsal,'');
    assert.equal(f.subject.state.opened.size,0);
    assert.equal(f.subject.state.asked.size,0);
    assert.equal(f.subject.state.history.length,1);
  }
});

test('review shows the received reply without exposing the unasked reply',()=>{
  const f=fixture();begin(f);f.click('ask',{index:'0'});complete(f);
  assert.match(f.html,/<summary>The reply you received<\/summary>/);
  assert.match(f.html,/The lift is relative: 10% to 11\.8%\./);
  assert.doesNotMatch(f.html,/There were 36 payment complaints, up from 24\./);
});
