// SCRUM-38: exact replay comparisons shared by the two authored councils.
import {councilView} from './council.mjs';
const label = status => ({supports:'supports',conditional:'conditional',opposes:'opposes'})[status];
const units = amount => `${amount} ${amount===1?'unit':'units'}`;
export function councilOpportunityCosts(state) {
  if (!['systems','accessibility'].includes(state.topic) || state.phase !== 'debrief') return null;
  const view = councilView(state);
  const promises = view.commitments.filter(p=>p.selected);
  const funded = view.debrief.fulfilled.filter(w=>w.origin==='response');
  const movable = [
    ...promises.map(p=>({...p,kind:'promise'})),
    ...funded.map(w=>({...w,kind:'response'}))
  ];
  const unused = view.capacity-view.aftermath.cost;
  const alternatives = view.debrief.deferred.map(task=>{
    const required = Math.max(0,task.cost-unused);
    const candidates = [];
    for (let mask=0; mask<(1<<movable.length); mask++) {
      const removed = movable.filter((_,i)=>mask & (1<<i));
      const freed = removed.reduce((sum,w)=>sum+w.cost,0);
      if (freed<required) continue;
      // Show only inclusion-minimal exchanges; never suggest dropping extra work.
      if (removed.some(w=>freed-w.cost>=required)) continue;
      const removedPromises = removed.filter(w=>w.kind==='promise').map(w=>w.id);
      const removedWork = removed.filter(w=>w.kind==='response').map(w=>w.id);
      const replayClose = councilView({...state,phase:'council',workIds:[],commitmentIds:state.commitmentIds.filter(id=>!removedPromises.includes(id))});
      const supportChanges = view.stakeholders.flatMap(person=>{
        const after = replayClose.stakeholders.find(p=>p.id===person.id);
        return after.support===person.support ? [] : [{id:person.id,name:person.name,before:person.support,after:after.support}];
      });
      const remaining = unused+freed-task.cost;
      const support = supportChanges.length
        ? supportChanges.map(p=>`${p.name}: ${label(p.before)} → ${label(p.after)}`).join('; ')
        : 'Closing support positions would stay the same; that does not make the removed work unnecessary';
      const sacrifice = removed.map(w=>w.kind==='promise'
        ? `Forgo “${w.title}”: ${w.detail}`
        : `Defer “${w.title}”: ${w.consequence}`).join(' ');
      candidates.push({removedPromises,removedWork,freed,remaining,supportChanges,
        explanation:removed.length
          ? `Replay comparison: withdraw ${removed.map(w=>`“${w.title}” (${units(w.cost)})`).join(' and ')}. Together with ${unused} unused ${unused===1?'unit':'units'}, that frees room for “${task.title}” (${units(task.cost)}), leaving ${remaining}. ${support}. ${sacrifice} Promises are locked in this completed attempt; this is a different bargain to test on replay.`
          : `“${task.title}” (${task.cost} units) fits within the ${unused} unused units without changing any promise or funded work. Leaving it deferred may be deliberate; explain the benefit of waiting and accept this consequence: ${task.consequence}`});
    }
    candidates.sort((a,b)=>(a.removedPromises.length+a.removedWork.length)-(b.removedPromises.length+b.removedWork.length)||a.freed-b.freed);
    return {deferredId:task.id,title:task.title,cost:task.cost,required,swaps:candidates.slice(0,2)};
  });
  const responseTotal = [...funded,...view.debrief.deferred].reduce((sum,w)=>sum+w.cost,0);
  return {
    unavoidable:`The two response tasks need ${responseTotal} units. Even with no promises, the 2-unit approach leaves ${view.capacity-2}. At least one task must carry forward in this exercise; that is a constraint to explain, not evidence of a bad decision.`,
    alternatives
  };
}
