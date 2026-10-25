// SCRUM-38: authored, deterministic two-round practice. No network or player scoring.
// Motives are hidden from councilView until the debrief, not from source inspection.
const CAPACITY = 6;
const INVESTIGATIONS = 2;
const decisionWork = (id, title, detail) => ({id, title, detail, cost:2, origin:'decision', consequence:'This work was reserved by the council decision.'});
const option = (id, title, detail, cost, consequence, outcome) => ({id, title, detail, cost, consequence, outcome, origin:'response'});

const cases = {
  accessibility: {
    title:'A cleaner screen. A blocked path.',
    description:'Negotiate access, a showcase and scarce engineering time.',
    intro:'A simpler account-settings screen is ready for a showcase. Three stakeholders want your backing. Open at most two records, choose an approach and negotiate promises. Every promise reserves next-round capacity. Support reflects interests, not the quality of your decision.',
    stakeholders:[
      {id:'design',name:'Mara',role:'Design lead',claim:'The audit passed, so the screen is accessible.',objective:'Retain the simplified design for the scheduled showcase.'},
      {id:'support',name:'Jules',role:'Support lead',claim:'We have no accessibility complaints, so this can wait.',objective:'Protect an understaffed team from an additional specialist queue.'},
      {id:'engineering',name:'Ishan',role:'Engineering lead',claim:'Fixing focus means rewriting the whole screen.',objective:'Fund a shared component migration instead of another local patch.'}
    ],
    records:[
      {id:'audit',title:'Audit scope',text:'The automated scan found no flagged contrast issues. No completed keyboard or assistive-technology task check is attached. It cannot establish that everyone can save.'},
      {id:'focus',title:'Keyboard walkthrough',text:'A keyboard-only walkthrough gets trapped in the settings dialog before Save. A local repair and component replacement have not yet been compared. A full rewrite is not established as necessary.'},
      {id:'queue',title:'Support tags',text:'The queue has no accessibility category. Two customers reported save failures; their input methods and failure causes are unknown. Zero tagged complaints does not mean zero barriers.'}
    ],
    proposals:[
      {id:'repair',title:'Repair the blocked task',detail:'Pause expansion and reserve 2 units for a local focus repair. The showcase loses its original slot; broader component work waits.',work:decisionWork('repair-work','Local focus repair','Implement a bounded focus repair while expansion remains paused.'),summary:'The local focus repair is prepared. The original showcase slot is lost and the shared component migration is deferred.'},
      {id:'fallback',title:'Keep the previous screen',detail:'Withdraw the new screen and reserve 2 units to inspect the fallback and compare repair options. Its accessibility is still unverified.',work:decisionWork('fallback-work','Fallback check and repair estimate','Inspect the previous route and compare local repair with replacement. This is not a claim that the fallback passes.'),summary:'The new screen is withdrawn. The previous route is available for investigation, but its task accessibility remains unverified; Support now handles two versions.'},
      {id:'replace',title:'Start the shared replacement',detail:'Pause expansion and reserve 2 units to begin shared component work. Completion needs another cycle and users still need an interim route.',work:decisionWork('replace-work','Begin component replacement','Begin the shared interaction component project; it will not finish this cycle.'),summary:'Engineering begins the shared component migration. The showcase waits another cycle and the replacement is not yet ready for users.'}
    ],
    commitments:[
      {id:'showcase',title:'Give Design a revised showcase',detail:'Reserve 1 unit to prepare a clearly limited demonstration and revised date.',cost:1,outcome:'A limited demonstration and revised date are prepared; no broad accessibility claim is made.'},
      {id:'verification',title:'Fund independent task checks',detail:'Reserve 2 units for keyboard and assistive-technology save-path checks, with remaining failures recorded.',cost:2,outcome:'The save path receives independent task checks. Outstanding failures stay open; testing is not a declaration of universal accessibility.'},
      {id:'triage',title:'Give Support a bounded triage plan',detail:'Reserve 1 unit to follow up the two failures and add a temporary issue tag without a new specialist queue.',cost:1,outcome:'Support follows up the two save failures and adds a temporary tag with a named owner.'}
    ],
    update:'A separate assistive-technology walkthrough now finds an unannounced save-error message. It is distinct from the focus trap. Your reserved work still consumes capacity; choose what else can fit.',
    responses:{
      repair:[
        option('announce','Repair and verify error announcements','Fix the separate error announcement and recheck failure recovery.',2,'The save-error announcement remains a task barrier on the new screen; expansion must stay paused.','The error announcement is repaired and its failure-recovery path is checked; broader coverage remains open.'),
        option('interim','Provide a verified interim save route','Verify an interim route and explain it to affected users while expansion is paused.',3,'Affected users still lack a verified interim save route.','An interim save route is checked and communicated to affected users.')
      ],
      fallback:[
        option('fallback-verify','Verify and communicate the fallback','Run task checks on the old route and give users a clear route back.',2,'The old route remains unverified and two-version confusion continues.','The fallback receives task checks and a clear route-back message; failures remain tracked.'),
        option('new-errors','Prepare the new screen’s error repair','Repair and check the unannounced error before reconsidering the new screen.',3,'The new screen keeps its separate error-announcement defect and cannot return on the current evidence.','The new screen’s error announcement is repaired and checked; returning it still requires the wider task review.')
      ],
      replace:[
        option('interim','Provide an interim save route','Prepare and verify a temporary route while the shared replacement is unfinished.',2,'Users have no verified interim save route while the replacement continues.','A temporary save route is checked and communicated while replacement continues.'),
        option('component-errors','Add and test error announcements','Add failure announcements and regression coverage to the replacement in progress.',3,'The replacement continues without demonstrated error-announcement coverage.','The component gains checked error announcements; completing the broader replacement still needs another cycle.')
      ]
    }
  },
  systems: {
    title:'One API change. Many downstream owners.',
    description:'Balance a customer milestone against compatibility and migration work.',
    intro:'A platform team plans a response-format change. A large customer wants progress, but external integrations have separate owners. Open at most two records, choose a rollout approach and negotiate promises. Each promise reserves next-round capacity; unanimous support is not the objective.',
    stakeholders:[
      {id:'platform',name:'Pia',role:'Platform lead',claim:'All consumers are ready for the new response.',objective:'Retire legacy maintenance before the team’s maintenance review.'},
      {id:'account',name:'Ari',role:'Account lead',claim:'We promised this exact format in the contract.',objective:'Announce a visible customer milestone this month.'},
      {id:'reliability',name:'Ren',role:'Reliability lead',claim:'A canary will remove migration risk.',objective:'Keep the release inside the existing on-call coverage window.'}
    ],
    records:[
      {id:'consumers',title:'Consumer register',text:'Three internal applications confirmed readiness. Two external integrations have not confirmed readiness and have independent deployment owners.'},
      {id:'contract',title:'Commitment record',text:'The signed specification commits to an integration outcome. The exact response format appears in a proposal email, not in the signed specification; the customer must confirm any alternative.'},
      {id:'canary',title:'Canary plan',text:'The canary exercises internal clients only, not external parsers or retries. A versioned path is feasible but adds dual-format maintenance. Rollback ownership has not been agreed.'}
    ],
    proposals:[
      {id:'versioned',title:'Offer a versioned migration',detail:'Reserve 2 units for a separate response version. The customer can start a pilot while the old route remains and maintenance doubles.',work:decisionWork('versioned-work','Open the versioned pilot','Prepare a separate response version; retain the existing route for current consumers.'),summary:'The customer can start on a versioned pilot. Existing consumers retain their route, while Platform maintains two formats.'},
      {id:'readiness',title:'Wait for external readiness',detail:'Reserve 2 units to confirm external owners and migration needs. The common change waits and the customer milestone slips.',work:decisionWork('readiness-work','Confirm external migration owners','Contact both external owners and document their migration needs before the common response changes.'),summary:'The common format change waits while external owners are contacted. Existing consumers keep the old route and the customer milestone slips.'},
      {id:'narrow',title:'Narrow the customer commitment',detail:'Reserve 2 units to evaluate a small adapter for the integration outcome. Customer acceptance remains open and legacy maintenance stays.',work:decisionWork('narrow-work','Evaluate the customer adapter','Prepare a smaller adapter proposal; customer acceptance and ongoing support cost remain open.'),summary:'An adapter proposal replaces the broad format rollout for now. Customer acceptance is still open and the legacy response remains in service.'}
    ],
    commitments:[
      {id:'retirement',title:'Agree retirement criteria',detail:'Reserve 1 unit to publish consumer-owned exit criteria and a review date; this does not retire the legacy route.',cost:1,outcome:'Consumer-owned exit criteria and a review date are published. The legacy route remains until the criteria are met.'},
      {id:'rollback',title:'Fund rollback ownership and a drill',detail:'Reserve 2 units to assign an on-call owner and rehearse rollback. External parser compatibility is a separate task.',cost:2,outcome:'An on-call owner rehearses rollback in the current coverage window. External parser behavior is not thereby verified.'},
      {id:'customer',title:'Renegotiate the customer milestone',detail:'Reserve 1 unit to confirm the integration outcome and communicate the chosen path and unresolved acceptance.',cost:1,outcome:'The chosen path and open acceptance questions are taken to the customer; agreement is not invented.'}
    ],
    update:'An external partner now sends a trace: its parser rejects unknown response fields. The internal canary never exercised it. Your earlier route determines the exposure and the work you can afford.',
    responses:{
      versioned:[
        option('parser','Build and check a partner migration fixture','Exercise the rejecting parser against the new version before this partner migrates.',2,'The partner must stay on the legacy route; migration to the new version remains unverified.','A partner parser fixture checks the new-version migration; other external consumers still need their own evidence.'),
        option('maintenance','Staff both formats explicitly','Assign dual-format maintenance and support coverage for the next cycle.',3,'Platform carries two formats without dedicated maintenance coverage next cycle.','Both formats gain explicit maintenance coverage for the next cycle; retirement is still conditional.')
      ],
      readiness:[
        option('parser','Resolve and verify the partner parser','Work with the partner on its parser and verify the proposed response against its fixture.',2,'The partner’s parser remains a known readiness blocker and the common change stays on hold.','The partner parser receives a checked migration path; the other external owner still needs readiness confirmation.'),
        option('pilot','Prepare a bounded customer pilot','Prepare an isolated pilot with explicit acceptance questions while the common response stays unchanged.',3,'The customer has no working pilot during the wait and the milestone remains delayed.','A bounded customer pilot is prepared; it does not authorize the common format change.')
      ],
      narrow:[
        option('adapter','Validate the adapter with the customer','Test the smaller integration outcome and record the customer’s remaining acceptance questions.',2,'The adapter remains a proposal with untested customer value and open acceptance.','The adapter is checked against the proposed integration outcome; the customer’s remaining acceptance questions are recorded.'),
        option('legacy','Assign legacy support and a partner fixture','Fund legacy support ownership and capture the rejecting parser in regression checks.',3,'Legacy maintenance has no dedicated new coverage and the partner parser gap remains outside regression checks.','Legacy support is assigned and the partner parser is captured in regression checks; broader migration stays deferred.')
      ]
    }
  }
};

export const councilTopics = Object.freeze(Object.entries(cases).map(([id,c])=>Object.freeze({id,title:id==='accessibility'?'Accessibility':'Platform / API',description:c.description})));

export function createCouncil(topic) {
  if (!Object.hasOwn(cases,topic)) throw new RangeError(`Unsupported council topic: ${String(topic)}`);
  return {version:1,topic,phase:'council',opened:[],proposalId:null,commitmentIds:[],workIds:[]};
}

const selected = (items, ids) => items.filter(item=>ids.includes(item.id));
const proposal = s => cases[s.topic].proposals.find(p=>p.id===s.proposalId);
const reservedCost = s => (s.proposalId ? 2 : 0) + selected(cases[s.topic].commitments,s.commitmentIds).reduce((sum,c)=>sum+c.cost,0);
const responseWork = s => cases[s.topic].responses[s.proposalId] || [];
const totalCost = s => reservedCost(s) + selected(responseWork(s),s.workIds).reduce((sum,w)=>sum+w.cost,0);
const validIds = (ids, items) => Array.isArray(ids) && new Set(ids).size===ids.length && ids.every(id=>items.some(item=>item.id===id));
function validState(s) {
  if (!s || s.version!==1 || !Object.hasOwn(cases,s.topic) || !['council','aftermath','debrief'].includes(s.phase)) return false;
  const c = cases[s.topic];
  if (!validIds(s.opened,c.records) || s.opened.length>INVESTIGATIONS || !validIds(s.commitmentIds,c.commitments)) return false;
  if (s.proposalId!==null && !c.proposals.some(p=>p.id===s.proposalId)) return false;
  if (s.phase!=='council' && !s.proposalId) return false;
  if (!validIds(s.workIds,responseWork(s)) || (s.phase==='council' && s.workIds.length)) return false;
  return totalCost(s)<=CAPACITY;
}

function standing(s, id) {
  const has = key=>s.commitmentIds.includes(key);
  const read = key=>s.opened.includes(key);
  const p = s.proposalId;
  if (!p) return {support:'conditional',condition:'Choose an approach to hear my conditions.'};
  if (id==='design') return has('showcase') && (p==='repair' || read('audit'))
    ? {support:'supports',condition:'Your limited showcase promise protects a visible milestone; I back this approach.'}
    : {support:p==='replace'?'opposes':'conditional',condition:'I need a revised showcase promise. For a fallback or replacement, open the audit scope so we can agree how to explain the change.'};
  if (id==='support') return has('triage') && (p==='fallback' || read('queue'))
    ? {support:'supports',condition:'Your bounded triage plan gives my team a manageable next step.'}
    : {support:p==='replace'?'opposes':'conditional',condition:'I need the bounded triage promise. Unless we are using the fallback, inspect the support tags before expanding our remit.'};
  if (id==='engineering') return p==='replace' || (has('verification') && (p==='fallback' || read('focus')))
    ? {support:'supports',condition:p==='replace'?'The shared replacement gets my backing; it will still need an interim route.':'The funded task checks make this bounded approach workable for Engineering.'}
    : {support:'conditional',condition:'I back the shared replacement. For local repair, open the keyboard walkthrough and fund task checks; for the fallback, fund task checks.'};
  if (id==='platform') return has('retirement') && (p==='readiness' || (p==='versioned' && read('consumers')))
    ? {support:'supports',condition:'The retirement criteria give the legacy route an accountable exit path.'}
    : {support:p==='narrow'?'opposes':'conditional',condition:p==='narrow'?'The adapter leaves my legacy-maintenance concern unresolved.':'Promise retirement criteria. A versioned pilot also needs the consumer register opened before I back it.'};
  if (id==='account') return has('customer') && (p==='readiness' || read('contract'))
    ? {support:'supports',condition:'The customer discussion gives me a defensible milestone message, with acceptance still open.'}
    : {support:p==='readiness'?'opposes':'conditional',condition:'Promise a customer milestone discussion. For a versioned path or adapter, open the commitment record so we can discuss the actual obligation.'};
  return has('rollback') && (p==='readiness' || read('canary'))
    ? {support:'supports',condition:'Funded ownership and a rollback drill fit our coverage window; parser compatibility still needs evidence.'}
    : {support:p==='versioned'?'opposes':'conditional',condition:'Promise rollback ownership and a drill. For a pilot or adapter, inspect the canary plan before I back the coverage.'};
}

function workView(s) {
  const c = cases[s.topic], p = proposal(s);
  if (!p) return [];
  return [
    {...p.work,selected:true,locked:true,outcome:p.summary},
    ...selected(c.commitments,s.commitmentIds).map(w=>({...w,id:`promise-${w.id}`,origin:'commitment',selected:true,locked:true,consequence:'Already reserved by your council promise; delivered from that capacity at the end of this round.'})),
    ...responseWork(s).map(w=>({...w,selected:s.workIds.includes(w.id),locked:false}))
  ];
}

function trace(s) {
  const c = cases[s.topic];
  const lines = s.opened.map(id=>`Investigated: ${c.records.find(r=>r.id===id).title}.`);
  if (s.phase!=='council') lines.push(`Round 1: ${proposal(s).title}. Promises: ${selected(c.commitments,s.commitmentIds).map(c=>c.title).join('; ') || 'none'}. Reserved ${reservedCost(s)} of ${CAPACITY} capacity.`);
  if (s.phase==='debrief') lines.push(`Round 2: ${selected(responseWork(s),s.workIds).map(w=>w.title).join('; ') || 'no extra response work'}. Used ${totalCost(s)} of ${CAPACITY} capacity; unselected response work deferred.`);
  return lines;
}

function reactions(s, stakeholders) {
  const responses = responseWork(s);
  const concerns = {
    repair:{design:'announce',support:'interim',engineering:'announce'},
    fallback:{design:'new-errors',support:'fallback-verify',engineering:'new-errors'},
    replace:{design:'component-errors',support:'interim',engineering:'component-errors'},
    versioned:{platform:'maintenance',account:'parser',reliability:'parser'},
    readiness:{platform:'parser',account:'pilot',reliability:'parser'},
    narrow:{platform:'legacy',account:'adapter',reliability:'legacy'}
  };
  const focus = {design:'For the next design review',support:'For affected users and Support',engineering:'For engineering delivery',platform:'For platform maintenance',account:'For the customer milestone',reliability:'For release coverage'};
  return stakeholders.map(person=>{
    const item = responses.find(w=>w.id===concerns[s.proposalId][person.id]);
    const planned = s.workIds.includes(item.id);
    const response = s.phase==='debrief'
      ? (planned?item.outcome:item.consequence)
      : (planned?`${item.title} is funded in your response plan.`:`If you finish now: ${item.consequence}`);
    return {name:person.name,text:`${person.support==='supports'?'Backed your proposal':person.support==='opposes'?'Opposed your proposal':'Offered conditional support'}: ${person.condition} ${focus[person.id]}: ${response}`};
  });
}

export function councilView(s) {
  if (!validState(s)) throw new TypeError('Invalid council state. Start a new council.');
  const c = cases[s.topic], p = proposal(s), work = workView(s);
  const stakeholders = c.stakeholders.map(({id,name,role,claim})=>({id,name,role,claim,...standing(s,id)}));
  const view = {
    topic:s.topic,title:c.title,intro:c.intro,phase:s.phase,round:s.phase==='council'?1:2,error:null,
    stakeholders,
    records:c.records.map(({id,title,text})=>({id,title,opened:s.opened.includes(id),...(s.opened.includes(id)?{text}:{})})),
    investigationRemaining:INVESTIGATIONS-s.opened.length,investigation:{remaining:INVESTIGATIONS-s.opened.length,limit:INVESTIGATIONS},
    proposals:c.proposals.map(({id,title,detail})=>({id,title,detail,selected:s.proposalId===id})),
    commitments:c.commitments.map(({id,title,detail,cost})=>({id,title,detail,cost,selected:s.commitmentIds.includes(id)})),
    capacity:CAPACITY,cost:reservedCost(s),canCommit:s.phase==='council' && !!p && reservedCost(s)<=CAPACITY,
    trace:trace(s),aftermath:null,debrief:null
  };
  if (s.phase!=='council') view.aftermath = {
    summary:`${p.title} is the agreed approach. Its 2 units and your promises are reserved below; they will be delivered when you finish this round. ${c.update}`,
    reactions:reactions(s,stakeholders),
    work,capacity:CAPACITY,cost:totalCost(s),canFinish:s.phase==='aftermath',
    finishLabel:'Finish with selected work; defer the rest'
  };
  if (s.phase==='debrief') {
    const fulfilled=work.filter(w=>w.selected), deferred=work.filter(w=>!w.selected);
    view.debrief={
      summary:`${p.summary} You used ${totalCost(s)} of ${CAPACITY} capacity. ${s.commitmentIds.length} promised ${s.commitmentIds.length===1?'action was':'actions were'} delivered automatically from reserved capacity. ${deferred.length} response ${deferred.length===1?'item remains':'items remain'} deferred.`,
      reveals:c.stakeholders.map(person=>({id:person.id,name:person.name,role:person.role,objective:person.objective,reflection:`Their public claim was: “${person.claim}” At your decision they ${standing(s,person.id).support==='supports'?'supported':standing(s,person.id).support==='opposes'?'opposed':'had conditions on'} the approach. An incentive explains their preference; it does not prove dishonesty.`})),
      fulfilled:fulfilled.map(w=>({...w,detail:w.outcome})),deferred:deferred.map(w=>({...w,detail:w.consequence})),
      feedback:[
        `You inspected ${s.opened.length} of ${c.records.length} records before committing. ${c.records.filter(r=>!s.opened.includes(r.id)).map(r=>r.title).join(' and ')} remained unopened; the decision did not establish those facts.`,
        `Promises reserved ${reservedCost(s)-2} units alongside 2 for the decision. That left ${CAPACITY-reservedCost(s)} for the new information. Stakeholder support was a negotiation result, not a grade.`,
        ...deferred.map(w=>`${w.title} was deferred: ${w.consequence}`),
        'Replay the same motives and evidence with a different bargain. Which promise would you change to fund a deferred response?'
      ],trace:trace(s)
    };
  }
  return view;
}

export function councilAct(s, action) {
  if (!validState(s) || !action || typeof action!=='object') return s;
  if (action.type==='replay') return createCouncil(s.topic);
  if (s.phase==='council') {
    if (action.type==='investigate') {
      if (s.opened.length>=INVESTIGATIONS || s.opened.includes(action.recordId) || !cases[s.topic].records.some(r=>r.id===action.recordId)) return s;
      return {...s,opened:[...s.opened,action.recordId]};
    }
    if (action.type==='propose') {
      if (s.proposalId===action.proposalId || !cases[s.topic].proposals.some(p=>p.id===action.proposalId)) return s;
      const next={...s,proposalId:action.proposalId};
      return reservedCost(next)<=CAPACITY?next:s;
    }
    if (action.type==='promise') {
      if (!cases[s.topic].commitments.some(c=>c.id===action.commitmentId)) return s;
      const next={...s,commitmentIds:s.commitmentIds.includes(action.commitmentId)?s.commitmentIds.filter(id=>id!==action.commitmentId):[...s.commitmentIds,action.commitmentId]};
      return reservedCost(next)<=CAPACITY?next:s;
    }
    if (action.type==='commit' && s.proposalId && reservedCost(s)<=CAPACITY) return {...s,phase:'aftermath'};
  }
  if (s.phase==='aftermath') {
    if (action.type==='allocate') {
      if (!responseWork(s).some(w=>w.id===action.workId)) return s;
      const next={...s,workIds:s.workIds.includes(action.workId)?s.workIds.filter(id=>id!==action.workId):[...s.workIds,action.workId]};
      return totalCost(next)<=CAPACITY?next:s;
    }
    if (action.type==='finish') return {...s,phase:'debrief'};
  }
  return s;
}
