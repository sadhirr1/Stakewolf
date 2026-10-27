import test from 'node:test';
import assert from 'node:assert/strict';
import {buildFeedback} from '../dist/feedback.mjs';
import {cases} from '../dist/content.mjs';
import {makeCase,competencies} from '../dist/adapt.mjs';

const attempt = overrides=>({note:'',revision:'',firstChoice:0,choice:1,openedBefore:[],openedAfter:[],asked:[],rehearsal:null,...overrides});
const detected = analysis=>analysis.cues.filter(cue=>cue.status==='detected');

test('blank and sparse attempts produce no fabricated reasoning matches',()=>{
  for (const input of [undefined,null,{},attempt(),attempt({note:' \n ',revision:12,asked:['0',99]})]) {
    const result=buildFeedback(cases.general,input);
    assert.equal(result.first.hasText,false);
    assert.equal(result.final.hasText,false);
    assert.deepEqual(detected(result.first),[]);
    assert.deepEqual(detected(result.final),[]);
    assert.ok(result.first.references.every(reference=>reference.status==='not detected'));
    assert.match(result.nextSteps[0],/blank notes/);
  }
  assert.doesNotThrow(()=>buildFeedback(null,null));
});

test('specific reasoning produces exact excerpts without a quality judgment',()=>{
  const note='Conversion brief covers first-time mobile visitors only. I would compare complaint rates per order with the Support lead before expansion. I accept the slower rollout while we verify the complaint denominator. The cause of the higher count remains unknown.';
  const revision='Given the new evidence, I now recommend a browser-focused test. I would ask the Support lead to verify exposed orders on the older browser.';
  const result=buildFeedback(cases.general,attempt({note,revision,openedBefore:['conversion'],openedAfter:['support'],asked:[1]}));
  assert.equal(result.first.references.find(reference=>reference.name==='Conversion brief').status,'detected');
  assert.equal(result.first.references.find(reference=>reference.name==='Support lead').status,'detected');
  assert.deepEqual(new Set(detected(result.first).map(cue=>cue.id)),new Set(['tradeoff','verification','uncertainty']));
  assert.ok(result.final.cues.some(cue=>cue.id==='update' && cue.status==='detected'));
  for (const analysis of [result.first,result.final]) for (const match of [...analysis.references,...analysis.cues]) {
    for (const excerpt of match.excerpts) assert.ok(analysis.text.includes(excerpt));
    assert.ok(['detected','not detected'].includes(match.status));
  }
  assert.match(result.first.notice,/does not establish/);
  assert.equal(Object.hasOwn(result,'score'),false);
  assert.equal(Object.hasOwn(result.first,'score'),false);
});

test('record openings preserve phase and linked replies do not masquerade as openings',()=>{
  const result=buildFeedback(cases.general,attempt({openedBefore:['conversion'],openedAfter:['support'],asked:[1]}));
  assert.deepEqual(result.records.map(record=>[record.id,record.openedBefore,record.openedAfter,record.consultedViaReply]),[
    ['conversion',true,false,false],['support',false,true,true],['release',false,false,false]
  ]);
  assert.match(result.records[1].prompt,/after the first decision/);
  assert.equal(result.views[0].response,null);
  assert.equal(result.views[1].response,cases.general.people[1].answer);
  const replyOnly=buildFeedback(cases.general,attempt({asked:[0]})).records[0];
  assert.equal(replyOnly.openedBefore,false);
  assert.equal(replyOnly.consultedViaReply,true);
  assert.match(replyOnly.prompt,/may not contain the whole record/);
});

test('name dropping and bare cue lists cannot produce quality claims',()=>{
  const note='Conversion brief; Support lead; trade-off; verify; uncertainty; update.';
  const result=buildFeedback(cases.general,attempt({note,revision:note}));
  assert.deepEqual(detected(result.first),[]);
  assert.deepEqual(detected(result.final),[]);
  assert.equal(result.first.references.find(reference=>reference.name==='Conversion brief').status,'detected');
  assert.match(result.limits.join(' '),/name dropping/);
  assert.match(result.nextSteps[0],/naming the record alone/);
});

test('common negations do not become positive cues and rejected names remain only name matches',()=>{
  const note='I will not verify the claim from the Support lead. There is no uncertainty in the Conversion brief. I will never change my decision because of this update. I reject any delay but will not check the denominator.';
  const result=buildFeedback(cases.general,attempt({note,revision:note}));
  assert.deepEqual(detected(result.first),[]);
  assert.deepEqual(detected(result.final),[]);
  assert.equal(result.first.references.find(reference=>reference.name==='Support lead').status,'detected');
  assert.match(result.limits.join(' '),/rejection/);
  const alternatives=buildFeedback(cases.general,attempt({note:'The count might reflect increased exposure or a different mix of users.'}));
  assert.equal(alternatives.first.cues.find(cue=>cue.id==='uncertainty').status,'detected');
  assert.match(alternatives.limits.join(' '),/alternative explanations.*not interpreted or scored/);
});

test('short explicit uncertainty is detected without accepting bare or negated wording',()=>{
  const result=buildFeedback(cases.general,attempt({revision:'The estimate remains unknown.'}));
  const cue=result.final.cues.find(cue=>cue.id==='uncertainty');
  assert.equal(cue.status,'detected');
  assert.deepEqual(cue.excerpts,['The estimate remains unknown.']);
  for (const revision of ['Uncertainty.','Unknown.','There is no uncertainty.']) {
    assert.equal(buildFeedback(cases.general,attempt({revision})).final.cues.find(cue=>cue.id==='uncertainty').status,'not detected');
  }
});

test('next-step record prioritizes uncited and unconsulted evidence in the active answer',()=>{
  const c=makeCase('accessibility');
  const revision='Keyboard walkthrough records a reproduced focus trap. I would verify the repaired save path before expansion.';
  const result=buildFeedback(c,attempt({note:'Support tags requires follow-up.',revision,openedBefore:['audit'],openedAfter:['focus'],asked:[2]}));
  assert.match(result.nextSteps[0],/^Use a specific detail from Support tags:/);
  const allOpened=buildFeedback(c,attempt({revision,openedBefore:['audit','focus','queue']}));
  assert.match(allOpened.nextSteps[0],/^Use a specific detail from Audit scope:/);
  const firstOnly=buildFeedback(c,attempt({note:revision,openedBefore:['audit']}));
  assert.match(firstOnly.nextSteps[0],/^Use a specific detail from Support tags:/);
  const allCited=buildFeedback(c,attempt({revision:'Audit scope; Keyboard walkthrough; Support tags.'}));
  assert.match(allCited.nextSteps[0],/^Revisit your explanation of Audit scope:/);
  assert.match(allCited.nextSteps[0],/Decide whether/);
});

test('update and hidden incentives never become initial-answer criteria',()=>{
  const c=makeCase('research');
  const first='I would compare Study notes with the proposed audience before deciding.';
  const result=buildFeedback(c,attempt({note:first}));
  assert.equal(result.first.cues.some(cue=>cue.id==='update'),false);
  assert.equal(JSON.stringify(result.first).includes(c.update),false);
  for (const person of c.people) assert.equal(JSON.stringify(result).includes(person.privateAim),false);
  assert.equal(result.update.detail,c.update);
  assert.match(result.nextSteps.at(-1),/initial answer is not judged/);
});

test('rehearsal changes only final analysis and preserves both original answers and access history',()=>{
  const original=attempt({note:'Study notes informs my recommendation.',revision:'I would revise the recommendation after the update.',openedBefore:['sample'],asked:[0]});
  const saved=structuredClone(original);
  const initial=buildFeedback(makeCase('research'),original);
  const rehearsal=buildFeedback(makeCase('research'),{...original,rehearsal:'I would verify the sample with the Research lead before expanding.'});
  assert.deepEqual(original,saved);
  assert.equal(rehearsal.mode,'rehearsal');
  assert.deepEqual(rehearsal.first,initial.first);
  assert.deepEqual(rehearsal.original,{note:original.note,revision:original.revision});
  assert.notEqual(rehearsal.final.text,original.revision);
  assert.deepEqual(rehearsal.records.map(({finalMention,...record})=>record),initial.records.map(({finalMention,...record})=>record));
  assert.equal(buildFeedback(makeCase('research'),{...original,rehearsal:''}).final.hasText,false);
});

test('all nine cases receive authored evidence and public views; selected options earn no special result',()=>{
  for (const c of [...Object.values(cases),...competencies.map(skill=>makeCase(skill.id))]) {
    const before=structuredClone(c);
    const variants=c.choices.map((_,choice)=>buildFeedback(c,attempt({note:'I would check the evidence before making a recommendation.',choice})));
    const result=variants[0];
    assert.equal(result.records.length,c.evidence.length);
    assert.equal(result.views.length,c.people.length);
    assert.deepEqual(result.records.map(record=>record.detail),c.evidence.map(record=>record.detail));
    assert.deepEqual(result.views.map(view=>[view.claim,view.aim]),c.people.map(person=>[person.claim,person.aim]));
    for (const variant of variants) {
      assert.deepEqual(variant.first,result.first);
      assert.deepEqual(variant.nextSteps,result.nextSteps);
    }
    assert.deepEqual(c,before);
    assert.doesNotThrow(()=>JSON.parse(JSON.stringify(result)));
  }
});

test('matching avoids partial names and preserves exact source casing and spacing',()=>{
  const note='A fakeConversion brief is not the record. Read CONVERSION   BRIEF with care. The Support leader is elsewhere.';
  const result=buildFeedback(cases.general,attempt({note}));
  assert.equal(result.first.references.find(reference=>reference.name==='Conversion brief').status,'detected');
  assert.equal(result.first.references.find(reference=>reference.name==='Support lead').status,'not detected');
  for (const reference of result.first.references) for (const excerpt of reference.excerpts) assert.ok(note.includes(excerpt));
  assert.equal(buildFeedback(cases.general,attempt({note:'fakeConversion brief'})).first.references[0].status,'not detected');
});
