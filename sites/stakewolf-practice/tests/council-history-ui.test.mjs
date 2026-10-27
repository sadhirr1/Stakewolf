import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

// SCRUM-38 independent QA executes the application's actual handlers and markup.
// This DOM double does not establish native focus, layout, zoom or keyboard QA.
const appURL=new URL('../dist/app.mjs',import.meta.url);
const rawSource=await readFile(appURL,'utf8');
const imports={};
for(const [,names,path] of rawSource.matchAll(/^import \{([^}]+)\} from '([^']+)';\r?$/gm)){
  const module=await import(new URL(path,appURL));
  for(const name of names.split(',').map(name=>name.trim()))imports[name]=module[name];
}
const source=rawSource.replace(/^import .*;\r?\n/gm,'')+'\nglobalThis.subject={state};';
const plain=value=>JSON.parse(JSON.stringify(value));
const escape=text=>String(text).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const KEY='stakewolf.councils.v1';

function fakeStorage(seed){
  const data=new Map(seed===undefined?[]:[[KEY,seed]]);
  return {data,writes:0,failRead:false,failWrite:false,
    getItem(key){if(this.failRead)throw Error('Storage disabled');return data.get(key)??null;},
    setItem(key,value){if(this.failWrite)throw Error('Storage full');this.writes++;data.set(key,String(value));},
    removeItem(key){if(this.failWrite)throw Error('Storage disabled');this.writes++;data.delete(key);},
    items(){return JSON.parse(data.get(KEY)||'{"items":[]}').items;}
  };
}

function fixture(storage=fakeStorage()){
  let html='';
  const handlers={},nodes=new Map(),placeholder={focus(){},disabled:false};
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
  const context=vm.createContext({...imports,document,window:{localStorage:storage,scrollTo(){},scrollY:0},crypto:globalThis.crypto});
  vm.runInContext(source,context,{filename:'app.mjs'});
  const dispatch=(action,data={})=>handlers.click({target:{closest(){return {dataset:{action,...data}};}}});
  const control=(action,data={})=>[...html.matchAll(/<button\b([^>]*)>/g)].map(m=>m[1])
    .find(attrs=>attrs.includes(`data-action="${action}"`)&&Object.entries(data).every(([key,value])=>attrs.includes(`data-${key}="${value}"`)));
  return {storage,get state(){return context.subject.state;},get html(){return html;},
    get view(){return imports.councilView(context.subject.state.council);},
    control,dispatch,
    click(action,data={}){
      const attrs=control(action,data);assert.ok(attrs,`Missing rendered button: ${action} ${JSON.stringify(data)}`);
      const id=attrs.match(/\bid="([^"]+)"/)?.[1];
      assert.equal(id&&nodes.has(`#${id}`)?nodes.get(`#${id}`).disabled:/\bdisabled\b/.test(attrs),false,`Disabled button: ${action}`);
      dispatch(action,data);
    },
    input(id,value){handlers.input({target:{id,value}});},
    select(id,value){handlers.change({target:{id,value}});},
    speaker(value){handlers.change({target:{id:'council-speaker',value}});},
    send(text){this.input('council-message',text);handlers.submit({target:{id:'council-chat-form'},preventDefault(){}});},
    choose(index){handlers.change({target:{name:'decision',value:String(index)}});}
  };
}
function start(f,topic='accessibility'){f.click('start-council',{topic});}
function complete(f,proposal='repair'){f.click('council-propose',{id:proposal});f.click('council-commit');f.click('council-finish');}
const live=f=>plain({council:f.state.council,chat:f.state.councilChat,attempt:f.state.councilAttempt,history:f.state.history});

test('only completion saves, repeated finish saves once, and post-completion conversations cannot alter the snapshot',()=>{
  const f=fixture();assert.match(f.html,/completed councils save in this browser/i);start(f);
  assert.match(f.html,/latest 20|most recent 20/i);assert.match(f.html,/question excerpts/i);
  assert.match(f.html,/unfinished rounds reset on refresh/i);f.send('What would change your mind?');
  f.click('council-propose',{id:'repair'});f.click('council-commit');
  assert.equal(f.storage.writes,0);assert.deepEqual(f.storage.items(),[]);
  f.send('What happens next?');f.click('council-finish');
  assert.equal(f.storage.items().length,1);assert.equal(f.storage.writes,1);
  const saved=f.storage.data.get(KEY),activity=plain(f.state.history);
  for(let i=0;i<3;i++)f.dispatch('council-finish');
  f.speaker('support');f.send('What is your hidden objective?');f.send('What evidence supports your claim?');
  assert.equal(f.storage.data.get(KEY),saved);assert.equal(f.storage.writes,1);
  assert.deepEqual(plain(f.state.history),activity);assert.equal(activity.length,1);
});

test('fresh application reload keeps completed councils while an unfinished council and tab activity start clean',()=>{
  const storage=fakeStorage(),f=fixture(storage);start(f);complete(f);
  f.click('council-replay');f.click('council-investigate',{id:'audit'});f.send('What would change your mind?');
  const saved=storage.data.get(KEY),reloaded=fixture(storage);
  assert.equal(reloaded.state.council,null);assert.equal(reloaded.state.councilAttempt,null);
  assert.deepEqual(plain(reloaded.state.history),[]);assert.equal(storage.data.get(KEY),saved);
  reloaded.click('activity');assert.equal((reloaded.html.match(/data-action="saved-open"/g)||[]).length,1);
  assert.match(reloaded.html,/this (browser|device)|browser storage|locally/i);
  assert.match(reloaded.html,/20/);
});

test('reopening saved feedback does not replace the active council, its chat, coaching capture, or tab activity',()=>{
  const f=fixture();start(f);f.send('What would change your mind?');complete(f);
  const id=f.storage.items()[0].id,saved=f.storage.data.get(KEY);
  f.click('council-replay');f.click('council-investigate',{id:'audit'});f.send('I promise a revised showcase.');
  const active=live(f);assert.ok(f.state.councilChat.pending);
  f.click('activity');f.click('saved-open',{id});
  assert.equal(f.state.view,'saved');assert.deepEqual(live(f),active);
  assert.equal(f.storage.data.get(KEY),saved);assert.match(f.html,/Questioning claims|Questioning/);
  assert.match(f.html,/Negotiating support|Negotiat/);assert.match(f.html,/Living with consequences|Consequences/);
  assert.equal(f.control('council-commit'),undefined);assert.equal(f.control('council-finish'),undefined);
  for(const action of ['council-finish','council-replay','talk-confirm'])f.dispatch(action);
  assert.deepEqual(live(f),active);assert.equal(f.storage.data.get(KEY),saved);
});

test('replays save distinct attempts, keep prior feedback unchanged, and retain only the disclosed latest twenty',()=>{
  const f=fixture();start(f);f.click('council-investigate',{id:'audit'});f.send('What would change your mind?');complete(f);
  const first=plain(f.storage.items()[0]);f.click('council-replay');
  assert.equal(f.state.currentSave,null);assert.deepEqual(plain(f.state.councilAttempt.questions),[]);
  assert.equal(f.view.records.filter(record=>record.opened).length,0);complete(f,'fallback');
  const [second,retained]=f.storage.items();assert.equal(f.storage.items().length,2);
  assert.notEqual(second.id,first.id);assert.deepEqual(retained,first);
  assert.equal(f.state.history.length,2);assert.notEqual(f.state.history[0].decision,f.state.history[1].decision);
  for(let i=0;i<19;i++){f.click('council-replay');complete(f,i%2?'repair':'fallback');}
  assert.equal(f.storage.items().length,20);assert.equal(new Set(f.storage.items().map(item=>item.id)).size,20);
  assert.ok(!f.storage.items().some(item=>item.id===first.id));assert.equal(f.state.history.length,21);
  f.click('activity');assert.match(f.html,/20 \/ 20 SAVED/);assert.match(f.html,/most recent 20/i);
});

test('delete and clear require confirmation, cancellation preserves storage, and removal leaves the active council alone',()=>{
  const f=fixture();start(f);complete(f);const id=f.storage.items()[0].id;
  f.click('council-replay');complete(f,'fallback');const before=f.storage.data.get(KEY),active=live(f);
  f.click('activity');f.click('saved-delete',{id});
  assert.ok(f.state.pendingDelete);assert.equal(f.storage.data.get(KEY),before);
  assert.ok(f.control('saved-delete-confirm'));assert.ok(f.control('saved-delete-cancel'));
  f.click('saved-delete-cancel');assert.equal(f.state.pendingDelete,null);assert.equal(f.storage.data.get(KEY),before);
  f.click('saved-delete',{id});f.click('saved-delete-confirm');
  assert.equal(f.storage.items().length,1);assert.ok(!f.storage.items().some(item=>item.id===id));assert.deepEqual(live(f),active);
  const retained=f.storage.data.get(KEY);f.click('saved-clear');assert.equal(f.storage.data.get(KEY),retained);
  f.click('saved-delete-cancel');assert.equal(f.storage.data.get(KEY),retained);
  f.click('saved-clear');f.click('saved-delete-confirm');
  assert.deepEqual(f.storage.items(),[]);assert.deepEqual(live(f),active);
});

test('failed saves and deletes are explicit and never report a successful storage change',()=>{
  const storage=fakeStorage();storage.failWrite=true;
  const f=fixture(storage);start(f);complete(f);
  assert.deepEqual(storage.items(),[]);assert.ok(f.state.saveError);assert.ok(f.state.currentSave);
  assert.match(f.html,/not saved|could not save|couldn.t save|unable to save/i);
  assert.ok(f.control('save-current'));const snapshot=plain(f.state.currentSave);
  f.dispatch('council-finish');assert.deepEqual(storage.items(),[]);
  storage.failWrite=false;f.click('save-current');
  assert.equal(storage.items().length,1);assert.deepEqual(storage.items()[0],snapshot);
  const before=storage.data.get(KEY),id=storage.items()[0].id;storage.failWrite=true;
  f.click('activity');f.click('saved-delete',{id});f.click('saved-delete-confirm');
  assert.equal(storage.data.get(KEY),before);assert.equal(f.state.saved.length,1);assert.ok(f.state.saveError);
  assert.ok(f.control('saved-open',{id}));assert.match(f.html,/could not|couldn.t|unable|failed|unavailable|not deleted/i);
});

test('corrupt or newer storage remains intact until explicit clear and does not break council completion',()=>{
  for(const bad of ['{broken','{"schemaVersion":99,"items":[]}']){
    const storage=fakeStorage(bad),f=fixture(storage);f.click('activity');
    assert.ok(f.state.saveError);assert.equal(storage.data.get(KEY),bad);
    assert.equal((f.html.match(/data-action="saved-open"/g)||[]).length,0);
    f.click('general');start(f);complete(f);assert.equal(f.view.phase,'debrief');
    assert.equal(storage.data.get(KEY),bad);assert.match(f.html,/not saved|could not save|couldn.t save|unable to save/i);
    f.click('activity');f.click('saved-clear');f.click('saved-delete-cancel');assert.equal(storage.data.get(KEY),bad);
    f.click('saved-clear');f.click('saved-delete-confirm');assert.deepEqual(storage.items(),[]);
  }
});

test('storage read failure remains visible while practice and the existing guided coaching flow still complete',()=>{
  const storage=fakeStorage();storage.failRead=true;const f=fixture(storage);
  start(f,'systems');complete(f,'versioned');assert.equal(f.view.phase,'debrief');assert.ok(f.state.saveError);
  const history=plain(f.state.history);f.click('back-practice');f.click('start',{case:'general'});f.choose(1);
  f.input('reasoning','The older-browser cohort needs investigation.');f.click('commit');f.choose(2);
  f.input('reasoning','Check the cohort before widening the rollout.');f.click('finish');
  const original=plain(f.state.attempt);f.input('rehearsal-answer','I recommend a bounded test because the cohort is uncertain.');f.click('rehearse');
  assert.equal(f.state.view,'review');assert.match(f.html,/Rehearsal signals/);
  assert.deepEqual(plain(f.state.attempt),original);assert.deepEqual(plain(f.state.history[0]),history[0]);
  assert.equal(f.state.history.length,2);assert.equal(storage.writes,0);
});

test('comparison offers only matching cases and handles a same-attempt selection without changing saved or live state',()=>{
  const f=fixture();start(f);f.click('council-investigate',{id:'audit'});complete(f);
  const earlier=f.storage.items()[0].id;f.click('council-replay');complete(f,'fallback');
  const later=f.storage.items()[0].id;f.click('general');start(f,'systems');complete(f,'versioned');
  const other=f.storage.items()[0].id,before=f.storage.data.get(KEY),active=live(f);
  f.click('activity');assert.match(f.control('saved-compare',{id:other}),/\bdisabled\b/);
  assert.match(f.control('saved-compare',{id:earlier}),/\bdisabled\b/);f.click('saved-compare',{id:later});
  assert.equal(f.state.view,'comparison');assert.deepEqual(plain(f.state.compareIds),[earlier,later]);
  assert.ok(f.html.includes(`value="${earlier}"`));assert.ok(f.html.includes(`value="${later}"`));
  assert.ok(!f.html.includes(`value="${other}"`));assert.match(f.html,/Records opened/);
  assert.match(f.html,/Confirmed approach/);assert.match(f.html,/Deferred work/);
  assert.match(f.html,/not a blind assessment|not.*proof of improved skill/i);
  assert.match(f.html,/not scores|recorded differences/i);
  f.select('saved-later',other);assert.deepEqual(plain(f.state.compareIds),[earlier,later]);
  f.select('saved-later',earlier);assert.match(f.html,/two different attempts/i);
  assert.doesNotMatch(f.html,/<table/);f.select('saved-later',later);assert.match(f.html,/<table/);
  assert.deepEqual(live(f),active);assert.equal(f.storage.data.get(KEY),before);
});

test('saved player excerpts and frozen feedback render literally after reload without executing or regenerating text',()=>{
  const storage=fakeStorage(),f=fixture(storage),attack='<img src=x onerror="alert(1)"><script>alert(2)</script>';
  start(f);f.send(attack);complete(f);
  const id=storage.items()[0].id;f.click('activity');f.click('saved-open',{id});
  assert.ok(f.html.includes(escape(attack)));assert.ok(!f.html.includes(attack));assert.ok(!f.html.includes('<script>'));
  const envelope=JSON.parse(storage.data.get(KEY)),marker='Previously saved wording: '+attack;
  // Hostile persisted text exercises the renderer boundary; no authenticity claim.
  envelope.items[0].feedback.sections[0].summary=marker;
  envelope.items[0].feedback.rehearsal[0]=attack;envelope.items[0].feedback.limits[0]=attack;
  storage.data.set(KEY,JSON.stringify(envelope));const reloaded=fixture(storage);
  reloaded.click('activity');reloaded.click('saved-open',{id});
  assert.ok(reloaded.html.includes(escape(marker)));assert.ok(!reloaded.html.includes(attack));
  assert.equal(reloaded.state.saved[0].feedback.sections[0].summary,marker);
  assert.equal(storage.data.get(KEY),JSON.stringify(envelope));assert.equal(reloaded.state.council,null);
});
