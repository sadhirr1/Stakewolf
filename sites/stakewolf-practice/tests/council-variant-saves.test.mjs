import test from 'node:test';
import assert from 'node:assert/strict';
import {createCouncil,councilAct,councilView} from '../dist/council.mjs';
import {STORAGE_KEY,createSavedCouncil,loadSavedCouncils,saveCouncil,compareSavedCouncils,savedCouncilVariant,savedCouncilLabel} from '../dist/council-saves.mjs';
const meta=id=>({id,completedAt:'2026-10-25T12:00:00.000Z',origin:'general'});
function complete(topic,variantId){
  let s=createCouncil(topic,variantId);
  s=councilAct(s,{type:'investigate',recordId:councilView(s).records[0].id});
  s=councilAct(s,{type:'propose',proposalId:councilView(s).proposals[0].id});
  return councilAct(councilAct(s,{type:'commit'}),{type:'finish'});
}
function memory(){const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};}
test('all six situation snapshots coexist with legacy original shape and reopen their original feedback',()=>{
  const storage=memory();
  for(const topic of ['accessibility','systems'])for(const variant of ['original','b','c']){
    const snapshot=createSavedCouncil(complete(topic,variant),{},meta(`${topic}-${variant}`));
    assert.ok(snapshot);assert.equal(savedCouncilVariant(snapshot),variant);
    assert.equal(snapshot.caseVersion,variant==='original'?'council-v1':`council-v1:${variant}`);
    assert.equal(Object.hasOwn(snapshot,'variantId'),false,'legacy envelope shape is preserved');
    assert.equal(saveCouncil(storage,snapshot).error,null);
    assert.deepEqual(loadSavedCouncils(storage).items.find(x=>x.id===snapshot.id),snapshot);
  }
  const prior=storage.getItem(STORAGE_KEY),loaded=loadSavedCouncils(storage);
  assert.equal(loaded.items.length,6);assert.equal(storage.getItem(STORAGE_KEY),prior);
  assert.deepEqual(loaded.items.filter(x=>x.caseVersion==='council-v1').map(savedCouncilLabel),['Situation A','Situation A']);
});
test('comparison distinguishes changed situations from a repeated situation without scoring them',()=>{
  const old=createSavedCouncil(complete('systems','original'),{},meta('old'));
  const different=createSavedCouncil(complete('systems','b'),{},meta('changed'));
  const repeat=createSavedCouncil(complete('systems','original'),{},meta('repeat'));
  const changed=compareSavedCouncils(old,different),same=compareSavedCouncils(old,repeat);
  assert.equal(changed.sameSituation,false);assert.match(changed.context,/Different situations/);
  assert.match(changed.context,/same record name can contain different findings/);
  assert.match(changed.limits.join(' '),/not.*proof of improved skill/);
  assert.equal(same.sameSituation,true);assert.match(same.context,/unchanged/);
  assert.equal(compareSavedCouncils(old,createSavedCouncil(complete('accessibility','b'),{},meta('other'))),null);
  assert.notEqual(changed.rows.find(x=>x.label==='Situation').before,changed.rows.find(x=>x.label==='Situation').after);
});
test('variant identity cannot relabel an old fact snapshot as a different situation',()=>{
  const snapshot=JSON.parse(JSON.stringify(createSavedCouncil(complete('accessibility','original'),{},meta('legacy'))));
  snapshot.caseVersion='council-v1:b';
  assert.ok(saveCouncil(memory(),snapshot).error);
  snapshot.caseVersion='council-v1:unknown';
  assert.equal(savedCouncilVariant(snapshot),null);assert.ok(saveCouncil(memory(),snapshot).error);
});
