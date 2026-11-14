import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

// SCRUM-38 independent QA: execute actual app handlers and rendered controls.
// The DOM double does not establish browser layout, focus, or accessibility.
const appURL=new URL('../dist/app.mjs',import.meta.url);
const raw=await readFile(appURL,'utf8'),imports={};
for(const [,names,path] of raw.matchAll(/^import \{([^}]+)\} from '([^']+)';\r?$/gm)){
  const module=await import(new URL(path,appURL));
  for(const name of names.split(',').map(value=>value.trim()))imports[name]=module[name];
}
const source=raw.replace(/^import .*;\r?\n/gm,'')+'\nglobalThis.subject={state};';
const plain=value=>JSON.parse(JSON.stringify(value));
const KEY='stakewolf.councils.v1';
const pack=items=>JSON.stringify({schemaVersion:1,items});
function storage(items=[]){
  const data=new Map(items.length?[[KEY,pack(items)]]:[]);
  return {data,getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,String(value)),removeItem:key=>data.delete(key),items:()=>JSON.parse(data.get(KEY)||'{"items":[]}').items};
}
function fixture(store=storage(),random=.125){
  let html='',clock=Date.UTC(2026,9,25,18);
  const handlers={},nodes=new Map(),placeholder={focus(){},disabled:false};
  const app={addEventListener(type,handler){handlers[type]=handler;}};
  Object.defineProperty(app,'innerHTML',{get:()=>html,set(value){html=value;nodes.clear();}});
  const document={querySelector(selector){
    if(selector==='#app')return app;
    if(!selector.startsWith('#'))return placeholder;
    if(!nodes.has(selector)){
      const attrs=[...html.matchAll(/<button\b([^>]*)>/g)].map(match=>match[1]).find(attrs=>attrs.includes(`id="${selector.slice(1)}"`));
      nodes.set(selector,{focus(){},disabled:/\bdisabled\b/.test(attrs||'')});
    }
    return nodes.get(selector);
  },querySelectorAll(){return [];}};
  const math=Object.create(Math);math.random=()=>random;
  class Clock extends Date{constructor(...args){super(...(args.length?args:[++clock]));}static now(){return ++clock;}}
  // Imported modules have their own Math global: pass the engine's supported
  // random seam explicitly so a stale-history regression fails deterministically.
  const context=vm.createContext({...imports,createFreshCouncil:(topic,previous)=>imports.createFreshCouncil(topic,previous,()=>random),Math:math,Date:Clock,document,window:{localStorage:store,scrollTo(){},scrollY:0}});
  vm.runInContext(source,context,{filename:'app.mjs'});
  const dispatch=(action,data={})=>handlers.click({target:{closest:()=>({dataset:{action,...data}})}});
  const control=(action,data={})=>[...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)].find(([,attrs])=>attrs.includes(`data-action="${action}"`)&&Object.entries(data).every(([key,value])=>attrs.includes(`data-${key}="${value}"`)));
  return {store,get html(){return html;},get state(){return context.subject.state;},get view(){return imports.councilView(context.subject.state.council);},control,dispatch,
    click(action,data={}){
      const button=control(action,data);assert.ok(button,`Missing button ${action} ${JSON.stringify(data)}`);
      const id=button[1].match(/\bid="([^"]+)"/)?.[1];
      assert.equal(id&&nodes.has(`#${id}`)?nodes.get(`#${id}`).disabled:/\bdisabled\b/.test(button[1]),false,`Disabled button ${action}`);
      dispatch(action,data);
    },
    input(id,value){handlers.input({target:{id,value}});},
    select(id,value){handlers.change({target:{id,value}});},
    send(value){handlers.input({target:{id:'council-message',value}});handlers.submit({target:{id:'council-chat-form'},preventDefault(){}});}
  };
}
const variant=f=>f.state.council.variantId??'original';
const start=(f,topic='accessibility')=>f.click('start-council',{topic});
function complete(f){f.click('council-propose',{id:f.view.proposals[0].id});f.click('council-commit');f.click('council-finish');}
function saved(topic,variantId,id,minute=0){
  let state=imports.createCouncil(topic,variantId);
  const proposalId=imports.councilView(state).proposals[0].id;
  for(const action of [{type:'propose',proposalId},{type:'commit'},{type:'finish'}])state=imports.councilAct(state,action);
  const result=imports.createSavedCouncil(state,{}, {id,completedAt:new Date(Date.UTC(2026,9,25,12,minute)).toISOString(),origin:'general'});
  assert.ok(result,`Failed to create ${topic}/${variantId} snapshot`);return result;
}

test('new situation and repeat situation are distinct real controls, with fixed facts during each attempt',()=>{
  for(const topic of ['accessibility','systems'])for(const random of [.125,.875]){
    const f=fixture(storage(),random);start(f,topic);assert.equal(variant(f),'original');complete(f);
    assert.match(f.control('council-fresh')[2],/new|different/i);
    assert.match(f.control('council-replay')[2],/repeat|same/i);
    const original=plain(f.store.items()[0]);f.click('council-fresh');
    const picked=variant(f);assert.notEqual(picked,'original');
    const claims=plain(f.view.stakeholders.map(({id,claim})=>({id,claim})));
    const record=f.view.records[0];f.click('council-investigate',{id:record.id});
    const evidence=f.view.records.find(row=>row.id===record.id).text;
    f.send('What would change your mind?');f.click('council-propose',{id:f.view.proposals[0].id});
    assert.equal(variant(f),picked);assert.deepEqual(plain(f.view.stakeholders.map(({id,claim})=>({id,claim}))),claims);
    assert.equal(f.view.records.find(row=>row.id===record.id).text,evidence);
    const beforeReveal=f.html;f.click('council-commit');assert.equal(variant(f),picked);f.click('council-finish');
    assert.equal(variant(f),picked);
    for(const {objective} of f.view.debrief.reveals)assert.ok(!beforeReveal.includes(objective),'Private objective leaked before debrief');
    assert.deepEqual(f.store.items().find(row=>row.id===original.id),original);
    assert.equal(f.store.items()[0].caseVersion,`council-v1:${picked}`);
    const completed=plain(f.store.items());f.click('council-replay');
    assert.equal(variant(f),picked);assert.equal(f.state.currentSave,null);
    assert.equal(f.view.records.filter(row=>row.opened).length,0);
    assert.deepEqual(plain(f.state.councilAttempt.questions),[]);assert.deepEqual(plain(f.state.councilChat.messages),[]);
    assert.deepEqual(f.store.items(),completed);
    f.click('council-investigate',{id:record.id});assert.equal(f.view.records.find(row=>row.id===record.id).text,evidence);
  }
});

test('returning to a topic avoids its last in-tab situation independently of other topics',()=>{
  const f=fixture();start(f);const accessibility=variant(f);f.click('back-practice');
  start(f,'systems');assert.equal(variant(f),'original');f.click('back-practice');
  start(f);assert.notEqual(variant(f),accessibility);assert.equal(f.state.councilOrigin,'general');
  assert.equal(f.store.items().length,0);
});

test('the same confirmed UI bargain changes stakeholder backing in each new situation',()=>{
  for(const route of [
    {topic:'accessibility',random:.125,id:'b',proposal:'fallback',record:'focus',speaker:'engineering',before:'conditional',after:'supports'},
    {topic:'accessibility',random:.875,id:'c',proposal:'repair',record:'focus',promise:'verification',speaker:'design',before:'conditional',after:'supports'},
    {topic:'systems',random:.125,id:'b',proposal:'narrow',record:'contract',promise:'retirement',speaker:'platform',before:'opposes',after:'supports'},
    {topic:'systems',random:.875,id:'c',proposal:'versioned',record:'consumers',promise:'retirement',speaker:'platform',before:'supports',after:'opposes'}
  ]){
    const original=fixture(),changed=fixture(storage(),route.random);start(original,route.topic);start(changed,route.topic);
    complete(changed);changed.click('council-fresh');assert.equal(variant(changed),route.id);
    for(const f of [original,changed]){
      f.click('council-propose',{id:route.proposal});f.click('council-investigate',{id:route.record});
      if(route.promise)f.click('council-promise',{id:route.promise});
    }
    assert.equal(original.view.stakeholders.find(row=>row.id===route.speaker).support,route.before);
    assert.equal(changed.view.stakeholders.find(row=>row.id===route.speaker).support,route.after);
    assert.equal(original.view.cost,changed.view.cost,'Changed backing must not come from a different work budget');
    assert.notEqual(original.view.records.find(row=>row.id===route.record).text,changed.view.records.find(row=>row.id===route.record).text);
  }
});

test('fresh council from a JD path retains interview context and the responsibility path',()=>{
  const f=fixture();f.click('jd');f.input('jd-text','Platform product manager. Own API strategy and backward compatibility.');f.click('build-path');
  const selected=plain(f.state.selected),jd=f.state.jd;start(f,'systems');complete(f);f.click('council-fresh');
  assert.equal(f.state.councilOrigin,'interview');assert.notEqual(variant(f),'original');
  assert.match(f.html,/FROM YOUR SELECTED JD RESPONSIBILITY/);f.click('back-practice');
  assert.equal(f.state.view,'path');assert.equal(f.state.jd,jd);assert.deepEqual(plain(f.state.selected),selected);
});

test('new entry reads latest saved situation even if another tab changed storage after startup',()=>{
  for(const topic of ['accessibility','systems']){
    const original=saved(topic,'original','legacy'),changed=saved(topic,'b','other-tab',1);
    const store=storage([original]),f=fixture(store);
    store.data.set(KEY,pack([changed,original]));start(f,topic);
    assert.notEqual(variant(f),'b','The newest completed situation repeated after a stale startup read');
    assert.equal(f.state.saved[0].id,'other-tab');assert.deepEqual(store.items(),[changed,original]);
  }
});

test('reload preserves legacy feedback verbatim and avoids the newest saved variant without resuming it',()=>{
  const legacy=plain(saved('accessibility','original','legacy'));
  assert.equal(legacy.caseVersion,'council-v1');
  legacy.feedback.sections[0].summary='Feedback saved by the original council version.';
  const newer=saved('accessibility','c','newer',1),store=storage([newer,legacy]),f=fixture(store);
  assert.equal(f.state.council,null);assert.equal(f.state.saveError,null);f.click('activity');f.click('saved-open',{id:'legacy'});
  assert.match(f.html,/Feedback saved by the original council version\./);
  f.click('general');start(f);assert.notEqual(variant(f),'c');
  assert.deepEqual(store.items(),[newer,legacy]);assert.deepEqual(plain(f.state.councilAttempt.questions),[]);
});

test('comparison identifies changed situations, still distinguishes same-situation retries, and leaves live facts alone',()=>{
  const f=fixture();start(f);complete(f);const first=f.store.items()[0];
  f.click('council-replay');complete(f);const repeat=f.store.items()[0];
  f.click('council-fresh');complete(f);const different=f.store.items()[0];
  const live=plain({council:f.state.council,chat:f.state.councilChat,attempt:f.state.councilAttempt}),before=f.store.data.get(KEY);
  f.click('activity');f.click('saved-compare',{id:different.id});
  assert.equal(f.state.view,'comparison');assert.match(f.html,/Situation/);
  assert.match(f.html,/different (authored )?situations|different evidence|changed evidence|evidence.*differs/i);
  assert.match(f.html,/not (a )?(controlled|blind)|not.*proof of improved skill|cannot.*(improvement|skill)/i);
  f.select('saved-later',repeat.id);f.select('saved-earlier',first.id);
  assert.match(f.html,/same fixed (case|situation)|same (authored )?situation/i);
  assert.match(f.html,/<table/);assert.equal(f.store.data.get(KEY),before);
  assert.deepEqual(plain({council:f.state.council,chat:f.state.councilChat,attempt:f.state.councilAttempt}),live);
});

test('fresh action is inert outside the live council screen and cannot erase an active attempt through saved history',()=>{
  const f=fixture();start(f);complete(f);const id=f.store.items()[0].id;f.click('council-fresh');
  f.click('council-investigate',{id:f.view.records[0].id});const before=plain(f.state.council),savedRaw=f.store.data.get(KEY);
  f.click('activity');f.click('saved-open',{id});f.dispatch('council-fresh');
  assert.equal(f.state.view,'saved');assert.deepEqual(plain(f.state.council),before);assert.equal(f.store.data.get(KEY),savedRaw);
});
