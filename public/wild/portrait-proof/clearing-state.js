// One authored encounter. Reading changes knowledge, never the physical result.
export const SAVE_KEY='stakewolf-clearing-v1';
export const TASKS={
  inspect:{name:'Inspect the crossing',cost:1,short:'Inspection',detail:'Send one person to examine the anchor. Find out what is wrong; no repair will be completed.'},
  repair:{name:'Reset the river anchor',cost:2,short:'Repair',detail:'Send both skilled workers. A reset can be completed by dawn, but a separate inspection will still be needed.'},
  supplies:{name:'Protect the supplies',cost:1,short:'Supplies',detail:'Send one person to move the stores above the flood line. This leaves the crossing untouched.'}
};
export const RECORDS={
  map:{title:'The route map',source:'Council route register · yesterday, before the rain',text:'The eastern crossing is marked open. The anchor was checked at the old water level. The leader has promised the waiting families passage by dawn.',limit:'This map predates the rising river. It records an earlier inspection, not the condition of the crossing tonight.'},
  report:{title:'The scout’s report',source:'Sera’s field note · this evening, after the river rose',text:'“I saw the downstream rope slip when a branch struck it. I could not reach the fastening. The stores beside the north path are below the new water mark.”',limit:'A direct observation of movement, not a full anchor inspection. The cause—and whether anyone interfered—remains unknown.'}
};
export const fresh=()=>({version:1,phase:'intro',seen:[],crew:{inspect:0,repair:0,supplies:0}});
export const used=state=>Object.values(state.crew).reduce((sum,n)=>sum+n,0);
export function act(state,type,key){
  if(type==='start'&&state.phase==='intro')return {...state,phase:'planning'};
  if(type==='read'&&state.phase==='planning'&&Object.hasOwn(RECORDS,key))return {...state,seen:[...new Set([...state.seen,key])]};
  if(type==='assign'&&state.phase==='planning'&&Object.hasOwn(TASKS,key)){
    const crew={...state.crew,[key]:state.crew[key]?0:TASKS[key].cost};
    return Object.values(crew).reduce((a,b)=>a+b,0)<=2?{...state,crew}:state;
  }
  if(type==='commit'&&state.phase==='planning'&&used(state)>0)return {...state,phase:'dispatched'};
  if(type==='dawn'&&state.phase==='dispatched')return {...state,phase:'dawn'};
  return state;
}
export function restore(text){
  try{
    const x=JSON.parse(text);
    if(!x||x.version!==1||!['intro','planning','dispatched','dawn'].includes(x.phase)||!Array.isArray(x.seen)||!x.crew||Array.isArray(x.crew))return null;
    if(x.seen.length>2||new Set(x.seen).size!==x.seen.length||x.seen.some(k=>typeof k!=='string'||!Object.hasOwn(RECORDS,k)))return null;
    if(Object.keys(x.crew).length!==3||Object.entries(TASKS).some(([key,task])=>!Object.hasOwn(x.crew,key)||![0,task.cost].includes(x.crew[key])))return null;
    const clean={version:1,phase:x.phase,seen:[...x.seen],crew:{inspect:x.crew.inspect,repair:x.crew.repair,supplies:x.crew.supplies}};
    if(used(clean)>2||(x.phase==='intro'&&(used(clean)||x.seen.length))||(['dispatched','dawn'].includes(x.phase)&&used(clean)===0))return null;
    return clean;
  }catch{return null;}
}
export function result(state){
  if(!['dispatched','dawn'].includes(state.phase))return null;
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
