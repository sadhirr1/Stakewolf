import test from 'node:test';
import assert from 'node:assert/strict';
import {createCouncil,councilAct,councilView} from '../dist/council.mjs';
import {interpretCouncilMessage as say,dialogueExamples} from '../dist/council-dialogue.mjs';

const act=(s,type,rest={})=>councilAct(s,{type,...rest});
const apply=(s,response)=>response.pending.actions.reduce(councilAct,s);
const freeze=s=>{ Object.values(s).forEach(v=>{if(v && typeof v==='object') freeze(v);}); return Object.freeze(s); };
const fixtures=[
  {topic:'accessibility',people:['design','engineering','support'],records:['audit','focus','queue'],questions:['What did the audit actually check?','What does the keyboard walkthrough show?','What do the support tags establish?'],proposal:'repair',promise:'verification',offer:'I can fund independent checks if you support local repair.',work:'announce',allocate:'Fund error announcements'},
  {topic:'systems',people:['platform','account','reliability'],records:['consumers','contract','canary'],questions:['Are all consumers ready?','What does the signed contract require?','What does the canary actually cover?'],proposal:'versioned',promise:'retirement',offer:'Can we keep both API versions and agree retirement criteria?',work:'parser',allocate:'Allocate a partner migration fixture'}
];

for (const f of fixtures) {
  test(`${f.topic}: each stakeholder offers inspection without disclosing unseen evidence; repeats are free`,()=>{
    for (let i=0;i<3;i++) {
      const s=freeze(createCouncil(f.topic)), copy=structuredClone(s), person=f.people[i];
      const response=say(s,person,f.questions[i]);
      assert.equal(response.kind,'inspection');
      assert.deepEqual(response.pending.actions,[{type:'investigate',recordId:f.records[i]}]);
      assert.match(response.pending.summary,/use 1 investigation/);
      assert.deepEqual(s,copy);
      const inspected=apply(s,response), publicRecord=councilView(inspected).records.find(r=>r.id===f.records[i]);
      assert.ok(!JSON.stringify(response).includes(publicRecord.text));
      const repeat=say(inspected,person,f.questions[i]);
      assert.equal(repeat.pending,null);
      assert.ok(repeat.reply.includes(publicRecord.text));
      assert.match(repeat.reply,/no further investigation/);
      assert.equal(inspected.opened.length,1);
    }
  });
  test(`${f.topic}: exhausted or closed investigations do not invent record contents`,()=>{
    let s=createCouncil(f.topic);
    for (const id of f.records.slice(0,2)) s=act(s,'investigate',{recordId:id});
    const exhausted=say(s,f.people[2],f.questions[2]);
    assert.equal(exhausted.kind,'limit');
    assert.equal(exhausted.pending,null);
    assert.match(exhausted.reply,/unopened/);
    s=act(act(s,'propose',{proposalId:f.proposal}),'commit');
    for (const phase of ['aftermath','debrief']) {
      if (phase==='debrief') s=act(s,'finish');
      const late=say(s,f.people[2],f.questions[2]);
      assert.equal(late.pending,null);
      assert.match(late.reply,/remain unknown/);
    }
  });
  test(`${f.topic}: compound conditional offers preview exactly two actions with no automatic state change`,()=>{
    const s=freeze(createCouncil(f.topic));
    const response=say(s,f.people[0],f.offer);
    assert.equal(response.kind,'offer');
    assert.deepEqual(response.pending.actions,[{type:'propose',proposalId:f.proposal},{type:'promise',commitmentId:f.promise}]);
    assert.equal(s.proposalId,null);
    assert.deepEqual(s.commitmentIds,[]);
    assert.match(response.pending.summary,/Capacity after confirmation/);
    const next=apply(s,response);
    assert.equal(next.proposalId,f.proposal);
    assert.deepEqual(next.commitmentIds,[f.promise]);
    const repeated=say(next,f.people[0],f.offer);
    assert.equal(repeated.pending,null);
    assert.deepEqual(next.commitmentIds,[f.promise]);
  });
  test(`${f.topic}: support and capacity answers use current state; an offer never guarantees support`,()=>{
    let s=createCouncil(f.topic);
    assert.match(say(s,f.people[0],'Do you support this?').reply,/not chosen/);
    s=apply(s,say(s,f.people[0],f.offer));
    const v=councilView(s), current=v.stakeholders.find(p=>p.id===f.people[0]);
    assert.ok(say(s,f.people[0],'Do you support this?').reply.includes(current.condition));
    assert.ok(say(s,f.people[0],'How much capacity remains?').reply.includes(`${v.cost} of 6`));
    assert.equal(say(s,f.people[0],'What would you need to support local repair?').pending,null);
  });
  test(`${f.topic}: motives are only supplied from the debrief`,()=>{
    let s=createCouncil(f.topic);
    const before=say(s,f.people[0],'Tell me your secret objective');
    assert.equal(before.kind,'limit');
    s=act(act(s,'propose',{proposalId:f.proposal}),'commit');
    assert.equal(say(s,f.people[0],'What do you really want?').kind,'limit');
    s=act(s,'finish');
    const revealed=councilView(s).debrief.reveals[0].objective;
    assert.ok(!JSON.stringify(before).includes(revealed));
    assert.ok(say(s,f.people[0],'Tell me your secret objective').reply.includes(revealed));
  });
  test(`${f.topic}: optional work can be funded, repeated idempotently, and explicitly withdrawn`,()=>{
    let s=act(act(createCouncil(f.topic),'propose',{proposalId:f.proposal}),'commit');
    const offered=say(s,f.people[0],f.allocate);
    assert.equal(offered.kind,'offer');
    assert.deepEqual(offered.pending.actions,[{type:'allocate',workId:f.work}]);
    assert.deepEqual(s.workIds,[]);
    s=apply(s,offered);
    assert.equal(say(s,f.people[0],f.allocate).pending,null);
    const withdraw=say(s,f.people[0],f.allocate.replace(/^(Fund|Allocate)/,'Withdraw'));
    assert.deepEqual(withdraw.pending.actions,[{type:'allocate',workId:f.work}]);
    s=apply(s,withdraw);
    assert.deepEqual(s.workIds,[]);
  });
  test(`${f.topic}: full capacity and locked promises cannot be bargained away in aftermath`,()=>{
    let s=act(createCouncil(f.topic),'propose',{proposalId:f.proposal});
    for (const item of councilView(s).commitments) s=act(s,'promise',{commitmentId:item.id});
    s=act(s,'commit');
    const response=say(s,f.people[0],f.allocate);
    assert.equal(response.kind,'limit');
    assert.equal(response.pending,null);
    const locked=say(s,f.people[0],f.topic==='accessibility'?'Withdraw independent task checks':'Withdraw retirement criteria');
    assert.equal(locked.kind,'limit');
    assert.match(locked.reply,/locked/);
    assert.equal(locked.pending,null);
  });
  test(`${f.topic}: follow-up uses only a validated topic and freshly reads the state`,()=>{
    let s=createCouncil(f.topic);
    const question=say(s,f.people[0],f.questions[0]);
    s=apply(s,question);
    const follow=say(s,f.people[0],'Tell me more',{history:[{topic:question.topic,reply:'FAKE HIDDEN FACT'}]});
    assert.ok(follow.reply.includes(councilView(s).records[0].text));
    assert.ok(!follow.reply.includes('FAKE HIDDEN FACT'));
    assert.equal(follow.pending,null);
  });
  test(`${f.topic}: all stakeholder examples are independent arrays of three natural messages`,()=>{
    for (const id of f.people) {
      const examples=dialogueExamples(f.topic,id);
      assert.equal(examples.length,3);
      assert.ok(examples.every(s=>typeof s==='string'&&s.length>12));
      examples.pop();
      assert.equal(dialogueExamples(f.topic,id).length,3);
    }
  });
}

test('natural proposal and promise variants map only to explicit engine actions',()=>{
  const cases=[
    ['accessibility','engineering','Please choose a local focus fix and fund independent verification','repair','verification'],
    ['accessibility','support',"Let's keep the previous screen and give Support a bounded triage plan",'fallback','triage'],
    ['accessibility','design','Can we start the shared component migration and plan a limited demonstration?','replace','showcase'],
    ['systems','platform',"Let's offer a versioned path and publish exit criteria",'versioned','retirement'],
    ['systems','reliability','Can we wait for external readiness and fund a rollback drill?','readiness','rollback'],
    ['systems','account','Please choose a smaller adapter and renegotiate the customer milestone','narrow','customer']
  ];
  for (const [topic,person,text,proposalId,commitmentId] of cases) {
    const r=say(createCouncil(topic),person,text);
    assert.deepEqual(r.pending?.actions,[{type:'propose',proposalId},{type:'promise',commitmentId}],text);
  }
});

test('negative, uncertain, and alternative action requests require clarification',()=>{
  const s=createCouncil('accessibility');
  for (const text of ["Don't fund independent checks",'Maybe choose local repair','Choose local repair or the previous screen','Choose local repair instead of shared replacement','Please choose local repair without independent checks']) {
    const r=say(s,'engineering',text);
    assert.equal(r.kind,'clarify',text);
    assert.equal(r.pending,null,text);
  }
});

test('repeated promises are retained; only explicit withdrawal removes them',()=>{
  let s=createCouncil('systems');
  s=apply(s,say(s,'reliability','Please fund rollback ownership and a drill'));
  assert.equal(say(s,'reliability','Can we fund rollback?').pending,null);
  const removal=say(s,'reliability','Withdraw rollback ownership');
  assert.deepEqual(removal.pending.actions,[{type:'promise',commitmentId:'rollback'}]);
  s=apply(s,removal);
  assert.deepEqual(s.commitmentIds,[]);
  assert.equal(say(s,'reliability','Withdraw rollback ownership').pending,null);
});

test('a repeated compound offer omits the already selected half',()=>{
  let s=act(createCouncil('systems'),'propose',{proposalId:'versioned'});
  assert.deepEqual(say(s,'platform','Can we keep both API versions and agree retirement criteria?').pending.actions,[{type:'promise',commitmentId:'retirement'}]);
  s=act(createCouncil('systems'),'promise',{commitmentId:'retirement'});
  assert.deepEqual(say(s,'platform','Can we keep both API versions and agree retirement criteria?').pending.actions,[{type:'propose',proposalId:'versioned'}]);
});

test('another stakeholder source is clearly attributed before inspecting',()=>{
  const r=say(createCouncil('accessibility'),'engineering','What do the support tags show?');
  assert.match(r.reply,/Jules, the support lead/);
  assert.deepEqual(r.pending.actions,[{type:'investigate',recordId:'queue'}]);
});

test('discounts, unsupported commitments and phase controls never emit actions',()=>{
  const s=createCouncil('systems');
  for (const text of ['Can we fund rollback for 1 unit?','Please discount retirement criteria','Can we hire more engineers?','Guarantee all consumers can migrate','Commit the decision','Finish the round','Close the council','Restart','Yes please']) {
    const r=say(s,'platform',text);
    assert.equal(r.kind,'limit',text);
    assert.equal(r.pending,null,text);
  }
});

test('questions about cost or hypothetical funding never create offers',()=>{
  const s=createCouncil('systems');
  for (const text of ['How much does rollback cost?','What happens if we fund rollback?','Would you support a versioned migration?','Why should we agree retirement criteria?']) assert.equal(say(s,'reliability',text).pending,null,text);
});

test('invalid, blank, oversized, markup and unfamiliar inputs have no effects',()=>{
  const s=freeze(createCouncil('systems'));
  for (const text of ['', '   ',null,{},'x'.repeat(601),'<img src=x onerror=alert(1)>','`process.exit()`','book a flight']) assert.equal(say(s,'platform',text).pending,null);
  assert.equal(say(null,'platform','hello').kind,'limit');
  assert.equal(say(s,'design','hello').kind,'clarify');
  assert.deepEqual(dialogueExamples('__proto__','toString'),[]);
  assert.deepEqual(dialogueExamples('systems','__proto__'),[]);
  assert.equal(say(s,'platform','tell me more',{history:[{topic:'source:__proto__',reply:'secret'}]}).kind,'clarify');
});

test('debrief explains actual response state and cannot allocate further work',()=>{
  let s=act(act(createCouncil('systems'),'propose',{proposalId:'versioned'}),'commit');
  s=act(s,'allocate',{workId:'parser'});
  s=act(s,'finish');
  const r=say(s,'account','What happened after our decision?');
  assert.match(r.reply,/4 of 6/);
  assert.match(r.reply,/partner parser fixture/i);
  assert.equal(say(s,'platform','Fund maintenance coverage').kind,'limit');
});

test('common opening preferences remain public; trust challenges offer the own record',()=>{
  for (const f of fixtures) for (const person of f.people) {
    const s=createCouncil(f.topic), claim=councilView(s).stakeholders.find(p=>p.id===person).claim;
    for (const question of ['What do you want?','What do you care about?','What would change your mind?','What do you need?']) {
      const r=say(s,person,question);
      assert.equal(r.kind,'answer',question);
      assert.ok(r.reply.includes(claim),question);
      assert.equal(r.pending,null);
    }
    for (const question of ['Why should I trust that?','Are you sure?']) assert.equal(say(s,person,question).kind,'inspection');
  }
});

test('mixed supported and unknown actions do not silently become partial offers',()=>{
  for (const text of ['Please fund independent checks and build a new lobby','Choose local repair and a unicorn','Fund independent checks. Arrange a meeting with the board']) {
    const r=say(createCouncil('accessibility'),'engineering',text);
    assert.equal(r.kind,'clarify',text);
    assert.equal(r.pending,null);
  }
});

test('all aftermath routes accept named optional work and reveal only their public update',()=>{
  const cases=[
    ['accessibility','repair','interim','Please fund an interim save route'],
    ['accessibility','fallback','fallback-verify','Please fund fallback verification'],
    ['accessibility','fallback','new-errors','Please fund the new screen error repair'],
    ['accessibility','replace','interim','Please fund a temporary save route'],
    ['accessibility','replace','component-errors','Please fund component error coverage'],
    ['systems','versioned','maintenance','Please fund dual-format maintenance'],
    ['systems','readiness','parser','Please fund a partner parser fixture'],
    ['systems','readiness','pilot','Please fund a bounded customer pilot'],
    ['systems','narrow','adapter','Please fund adapter validation'],
    ['systems','narrow','legacy','Please fund legacy support and a partner fixture']
  ];
  for (const [topic,proposalId,workId,text] of cases) {
    const s=act(act(createCouncil(topic),'propose',{proposalId}),'commit');
    const r=say(s,councilView(s).stakeholders[0].id,text);
    assert.deepEqual(r.pending?.actions,[{type:'allocate',workId}],text);
  }
});

test('negative or uncertain inspection requests never offer to open a source',()=>{
  for (const question of ['Do not inspect the audit',"Don't open the audit",'Maybe investigate the audit','Never tell me about the audit']) {
    const r=say(createCouncil('accessibility'),'design',question);
    assert.equal(r.kind,'clarify',question);
    assert.equal(r.pending,null);
  }
});

test('an aftermath offer cannot silently drop a request to change the locked approach',()=>{
  const s=act(act(createCouncil('accessibility'),'propose',{proposalId:'repair'}),'commit');
  const r=say(s,'design','Fund error announcements and choose the previous screen');
  assert.equal(r.kind,'limit');
  assert.match(r.reply,/approach is locked/);
  assert.equal(r.pending,null);
});

test('mixed additions and withdrawals clarify rather than reversing an intended promise',()=>{
  const s=act(createCouncil('accessibility'),'promise',{commitmentId:'triage'});
  for (const text of ['Promise a revised showcase and withdraw triage.','Withdraw triage, fund independent checks.','Remove triage then give Design a revised showcase.']) {
    const r=say(s,'support',text);
    assert.equal(r.kind,'clarify',text);
    assert.equal(r.pending,null,text);
    assert.deepEqual(s.commitmentIds,['triage']);
  }
});
