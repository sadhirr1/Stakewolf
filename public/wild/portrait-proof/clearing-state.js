// One authored night and morning. Knowledge, custody and work orders are separate.
export const SAVE_KEY='stakewolf-clearing-v1';
export const TASKS={
  inspect:{name:'Inspect the crossing',cost:1,short:'Inspection',detail:'One worker examines the anchor. They can report damage, but cannot repair it or overrule the leader at the gate.'},
  repair:{name:'Reset the river anchor',cost:2,short:'Repair',detail:'Send both skilled workers. A reset can be completed by dawn, but a separate inspection will still be needed.'},
  supplies:{name:'Protect the supplies',cost:1,short:'Supplies',detail:'Send one person to move the stores above the flood line. This leaves the crossing untouched.'}
};
export const RECORDS={
  map:{title:'The route map',source:'Council route register · yesterday, before the rain',text:'The eastern crossing is marked open. The anchor was checked at the old water level. The leader has promised the waiting families passage by dawn.',limit:'This map predates the rising river. It records an earlier inspection, not the condition of the crossing tonight.'},
  leader:{title:'Orin’s account',source:'Orin · council leader · speaking at dusk',text:'“Sera loosened the outer line. I gave no such order. She was the only one at the fastening. Keep her here tonight. If I remain free, I will take the first family across at the last bell. They have waited long enough.”',limit:'Orin has promised passage by dawn. His denial and accusation are claims, not an independent account.'},
  report:{title:'Sera’s account',source:'Sera · scout · signed field note, delivered at dusk',text:'“I loosened the outer line because Orin ordered it. He said it would free the ferry for the stores. Then the river rose and the rope slipped. Now he says I acted alone. Do not let him open that gate without a load check.”',limit:'Sera admits handling the line and disputes who ordered it. She also reports that the northern stores are below the new water mark. Her motive and the cause of the slip remain unproven.'}
};
export const WATCH={
  orin:{name:'Keep Orin under watch',cost:1,detail:'One worker holds the leader in the clearing all night. He cannot open the gate. Only one worker remains for other jobs.'},
  sera:{name:'Keep Sera under watch',cost:1,detail:'One worker holds the scout in the clearing. Orin remains free to act on his promise. Only one worker remains for other jobs.'},
  none:{name:'Keep both free',cost:0,detail:'Both workers can do essential work. Neither account is endorsed, but Orin remains free to attempt the crossing.'}
};
export const MORNING_TASKS={
  repair:{name:'Reset the river anchor',cost:2,detail:'Both workers reset the fastening this morning. A later shift must check it under load; repair alone never opens the gate.'},
  check:{name:'Verify a safe crossing route',cost:1,detail:'One worker marks firm footing on the higher approach and load-checks the overnight repair. Clearance covers this route at the current water level, not the unstable bank.'},
  supplies:{name:'Move the remaining stores',cost:1,detail:'Move and count the exposed stores. The delay has not established a loss; protection will be confirmed at noon.'},
  hearing:{name:'Witness both accounts',cost:1,detail:'One worker records a joint hearing with you. Sera will speak with a witness present. That worker cannot do a physical job this shift.'}
};
const emptyMorning=()=>({repair:0,check:0,supplies:0,hearing:0});
export const fresh=()=>({version:3,phase:'intro',seen:[],challenged:false,watch:null,crew:{inspect:0,repair:0,supplies:0},morning:null});
export const used=state=>Object.values(state.crew).reduce((sum,n)=>sum+n,0)+(WATCH[state.watch]?.cost||0);
export const morningCapacity=state=>state.watch==='orin'?2:1;
export const morningUsed=state=>Object.values(state.morning||{}).reduce((sum,n)=>sum+n,0);
export function morningBlock(state,key){
  if(!Object.hasOwn(MORNING_TASKS,key))return 'Unknown job.';
  if(key==='repair'&&state.crew.repair)return 'Already reset overnight.';
  if(key==='check'&&!state.crew.repair)return 'Requires a repair completed before this shift.';
  if(key==='supplies'&&state.crew.supplies)return 'Already moved above the water line.';
  return '';
}
export function act(state,type,key){
  if(state.version===1)return type==='dawn'&&state.phase==='dispatched'?{...state,phase:'dawn'}:state;
  if(type==='start'&&state.phase==='intro')return {...state,phase:'planning'};
  if(type==='read'&&state.phase==='planning'&&Object.hasOwn(RECORDS,key))return {...state,seen:[...new Set([...state.seen,key])]};
  if(type==='challenge'&&state.phase==='planning'&&state.seen.includes('leader')&&state.seen.includes('report'))return {...state,challenged:true};
  if(type==='watch'&&state.phase==='planning'&&Object.hasOwn(WATCH,key)){
    const next={...state,watch:key};return used(next)<=2?next:state;
  }
  if(type==='assign'&&state.phase==='planning'&&Object.hasOwn(TASKS,key)){
    const crew={...state.crew,[key]:state.crew[key]?0:TASKS[key].cost};
    const next={...state,crew};return used(next)<=2?next:state;
  }
  if(type==='commit'&&state.phase==='planning'&&state.watch!==null&&used(state)>0)return {...state,phase:'dispatched'};
  if(type==='dawn'&&state.phase==='dispatched')return {...state,phase:'dawn'};
  if(type==='morning'&&state.phase==='dawn')return {...state,phase:'morning',morning:emptyMorning()};
  if(type==='morning-assign'&&state.phase==='morning'&&!morningBlock(state,key)){
    const next={...state,morning:{...state.morning,[key]:state.morning[key]?0:MORNING_TASKS[key].cost}};
    return morningUsed(next)<=morningCapacity(state)?next:state;
  }
  if(type==='morning-commit'&&state.phase==='morning')return {...state,phase:'morning-dispatched'};
  if(type==='noon'&&state.phase==='morning-dispatched')return {...state,phase:'noon'};
  return state;
}
export function restore(text){
  try{
    const x=JSON.parse(text);
    if(!x||![1,2,3].includes(x.version)||!['intro','planning','dispatched','dawn',...(x.version===3?['morning','morning-dispatched','noon']:[])].includes(x.phase)||!Array.isArray(x.seen)||!x.crew||Array.isArray(x.crew))return null;
    const allowed=x.version===1?['map','report']:Object.keys(RECORDS);
    if(x.seen.length>allowed.length||new Set(x.seen).size!==x.seen.length||x.seen.some(k=>!allowed.includes(k)))return null;
    if(Object.keys(x.crew).length!==3||Object.entries(TASKS).some(([key,task])=>!Object.hasOwn(x.crew,key)||![0,task.cost].includes(x.crew[key])))return null;
    const clean={version:x.version,phase:x.phase,seen:[...x.seen],crew:{inspect:x.crew.inspect,repair:x.crew.repair,supplies:x.crew.supplies}};
    if(x.version>=2){
      if(typeof x.challenged!=='boolean'||(x.watch!==null&&(typeof x.watch!=='string'||!Object.hasOwn(WATCH,x.watch))))return null;
      if(x.challenged&&(!x.seen.includes('leader')||!x.seen.includes('report')))return null;
      if(x.phase==='intro'&&(x.challenged||x.watch!==null))return null;
      if(!['intro','planning'].includes(x.phase)&&x.watch===null)return null;
      Object.assign(clean,{challenged:x.challenged,watch:x.watch});
    }
    if(used(clean)>2||(x.phase==='intro'&&(used(clean)||x.seen.length))||(!['intro','planning'].includes(x.phase)&&used(clean)===0))return null;
    if(x.version===3){
      if(['morning','morning-dispatched','noon'].includes(x.phase)){
        if(!x.morning||Array.isArray(x.morning)||Object.keys(x.morning).length!==4)return null;
        for(const [key,task]of Object.entries(MORNING_TASKS))if(!Object.hasOwn(x.morning,key)||![0,task.cost].includes(x.morning[key])||(x.morning[key]&&morningBlock(clean,key)))return null;
        clean.morning={...x.morning};
        if(morningUsed(clean)>morningCapacity(clean))return null;
      }else if(x.morning!==null)return null;
      else clean.morning=null;
    }
    // Never rewrite an already committed legacy night with new events.
    if(x.version===1&&!['dispatched','dawn'].includes(x.phase))return {...fresh(),phase:x.phase,crew:clean.crew,seen:clean.seen.filter(k=>k==='map')};
    return x.version===2?{...clean,version:3,morning:null}:clean;
  }catch{return null;}
}
function legacyResult(state){
  if(!['dispatched','dawn','morning','morning-dispatched','noon'].includes(state.phase))return null;
  const {inspect,repair,supplies}=state.crew;
  const threads=[
    repair?{name:'The crossing',status:'Reset · inspection pending',detail:'The pair reset the downstream fastening. No independent load check has taken place. The path stays closed.',next:'Assign an inspection before promising passage.'}:
    inspect?{name:'The crossing',status:'Inspected · repair pending',detail:'The inspector found the downstream fastening loose and the rope displaced. No repair was made. The path stays closed.',next:'Reset the fastening, then check it under load.'}:
    {name:'The crossing',status:'Uninspected · still closed',detail:'Nobody examined the fastening. The scout’s report remains the latest observation; the crossing has not been cleared.',next:'Inspect the anchor and establish the repair needed.'},
    supplies?{name:'The stores',status:'Moved · protected from this rise',detail:'One worker moved the stores above the observed water line. That job is complete for the conditions checked.',next:'Watch for further changes in the river.'}:
    {name:'The stores',status:'Exposed · protection pending',detail:'Nobody moved the stores. They remain below the reported water mark. No loss or theft has been confirmed.',next:'Move the stores and count what remains.'},
    {name:'The dawn promise',status:'Delayed · explanation owed',detail:'The waiting families cannot cross yet. Work on a fastening is not clearance for passage.',next:'Explain the delay and give a condition for reopening, not an unsupported time.'}
  ];
  const context=state.seen.includes('map')&&state.seen.includes('report')?'You put my old map beside the new report. My promise ran ahead of what we knew.':state.seen.includes('report')?'You heard the scout’s warning. I should have checked before making that promise.':'You made the call with an incomplete picture. I still owe the families an explanation.';
  const reaction=repair?'The fastening is reset. I want to call it ready—but we still need someone to check it.':inspect?'Now we know what needs fixing. The answer cost us the night, and the repair is still ahead.':'The stores are out of this rise. We still have no inspected crossing for the families.';
  return {threads,context,reaction,unassigned:2-used(state),title:repair?'A repair is not a crossing.':inspect?'An answer. Another obligation.':'The stores are safe. The promise waits.'};
}

export function result(state){
  const base=legacyResult(state);
  if(!base||state.version===1)return base;
  const held=state.watch==='orin';
  const events=[
    {time:'DUSK · YOUR DECISION',text:`${WATCH[state.watch].name}. ${WATCH[state.watch].cost?'One worker was assigned to the watch.':'Both workers remained available for work.'}`},
    {time:'LAST BELL · WITNESSED',text:held?'The guard stopped Orin leaving with the gate key. He asked to be let through; the guard refused. No family entered the crossing.':'Orin unlocked the gate and led a traveler onto the unchecked approach. The traveler turned an ankle on the unstable bank. They returned without completing the crossing.'},
    {time:'FIRST LIGHT · COST',text:held?'No escort is needed. Both workers are available tomorrow, but the night spent on watch cannot be recovered.':'One worker must escort the injured traveler back tomorrow. Only one of the two workers is available for new work until that escort is finished.'}
  ];
  const relationship=state.watch==='sera'?'Sera asks for a witness at every future briefing: “You confined me on his word while he kept the key.” A witnessed hearing is now owed.':held?'Orin demands a public explanation for being held. Sera offers her account at a witnessed hearing; she has not been cleared of intent.':'Sera asks why Orin kept the key after announcing his plan. Orin now owes the family an account of the attempted crossing.';
  const threads=[...base.threads,{name:'The council’s trust',status:state.watch==='sera'?'Witness required · hearing owed':held?'Authority disputed · hearing owed':'Authority unchecked · explanation owed',detail:relationship,next:'Hear both accounts with a witness. Separate the instruction, the physical failure and possible intent.'}];
  if(!held)threads.push({name:'The injured traveler',status:'New obligation · one worker tomorrow',detail:'The attempted passage created an escort job. This is separate from the two workers allocated tonight.',next:'Escort the traveler before reassigning that worker.'});
  return {...base,threads,events,availableTomorrow:held?2:1,
    title:held?'The gate stayed shut. The council split.':'A promise crossed the line.',
    reaction:held?'You kept me from the gate. Now tell the families why they are still waiting.':'I thought I could get one family through. The traveler is hurt. I cannot call that a successful crossing.',
    context:state.challenged?'You challenged the denial. Orin admitted ordering the line loosened; his claimed reason is still unverified.':'You did not obtain an admission about the order. The conflicting accounts remain unresolved.',
    unresolved:'No wolf identity has been established. A denial, an accusation and an unsafe order are not proof of supernatural allegiance.'};
}

// Derive consequences from locked orders. Reloading never rolls a new outcome.
export function noonResult(state){
  if(state.phase!=='noon')return null;
  const work=state.morning,open=Boolean(work.check),repaired=Boolean(state.crew.repair||work.repair),protectedStores=Boolean(state.crew.supplies||work.supplies);
  const hearing=Boolean(work.hearing),escort=state.watch!=='orin';
  return {open,repaired,protectedStores,hearing,escort,
    title:open?'A route opens. The story does not.':'The morning ends. The work remains.',
    crossing:open?'The worker marked a firm route on the higher approach and load-checked the reset line. The gate opens for supervised passage on that route at this water level. The unstable bank remains off limits.':repaired?'The anchor is reset. Nobody verified a safe approach and load-checked it this shift. The gate remains closed.':'The anchor still needs the pair. The gate remains closed; the old promise has not become permission.',
    stores:protectedStores?'The stores are above the observed water line. Protection is complete for this rise.':'The stores remain exposed. No theft or loss has been established; moving them is still owed.',
    testimony:hearing?(state.challenged?'The witness records Orin’s earlier admission and his claim that the order was temporary. Sera adds that no one told her when to restore the line. The instruction is on record; intent remains disputed.':'Orin repeats his denial. Sera repeats that he gave the order. Both accounts are now witnessed, but no admission has been obtained. The contradiction is preserved.'):state.challenged?'No witnessed hearing took place. Orin’s admission of the instruction remains in your record, but it has not been recorded at a joint hearing. His intent and the cause of the slip remain disputed.':'No witnessed hearing took place. The conflicting accounts and the council’s demand remain on tomorrow’s table.',
    memory:state.watch==='sera'?(hearing?'Sera spoke because a witness was present. She still records that you confined her on Orin’s word.':'Sera withholds a new briefing until you provide the witness she requested. Her earlier field note remains available.'):state.watch==='orin'?'Orin remembers being held. Preventing the passage did not settle whether the custody was justified.':'The attempted crossing remains on the record. Finishing other work does not erase the injury.',
    escortText:escort?'The escort returned at noon after bringing the traveler to shelter. The injury is not declared healed. That worker spent the whole morning on the escort.':'No traveler needed an escort. Both workers were available for this morning’s jobs.',
    pending:[...(!repaired?['Reset the anchor with two workers.']:[]),...(!open?['Verify the repaired line and a safe approach before reopening.']:[]),...(!protectedStores?['Move and count the exposed stores.']:[]),...(!hearing?['Hear both accounts with a witness.']:[]),state.challenged?'Investigate the admitted order’s intent and the cause of the slip; explain the broken dawn promise.':'Resolve the disputed instruction and explain the broken dawn promise.'],
    unused:morningCapacity(state)-morningUsed(state)};
}

// Scene projection contains only current, observable conditions, never future results.
export function world(state){
  const afterNight=['dawn','morning','morning-dispatched','noon'].includes(state.phase),atNoon=state.phase==='noon';
  const repaired=afterNight&&Boolean(state.crew.repair||(atNoon&&state.morning?.repair));
  const cleared=atNoon&&Boolean(state.morning.check);
  const stores=afterNight&&Boolean(state.crew.supplies||(atNoon&&state.morning?.supplies));
  const jobs=[];
  if(state.phase==='dispatched'){
    for(const [key,n]of Object.entries(state.crew))for(let i=0;i<n;i++)jobs.push(key==='supplies'?'stores':'crossing');
    if(WATCH[state.watch]?.cost)jobs.push('watch');
  }else if(state.phase==='morning-dispatched'){
    if(state.watch!=='orin')jobs.push('escort');
    for(const [key,n]of Object.entries(state.morning))for(let i=0;i<n;i++)jobs.push(key==='supplies'?'stores':key==='hearing'?'hearing':'crossing');
  }
  while(jobs.length<2)jobs.push('idle');
  return {phase:state.phase,light:atNoon?'noon':afterNight?'morning':state.phase==='dispatched'?'night':'dusk',crossing:cleared?'open':repaired?'reset':'damaged',stores:stores?'protected':'exposed',jobs};
}
