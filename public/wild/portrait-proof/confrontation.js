// A staged version of the existing dispute. Orders still use the same game rules.
import {act,noonResult} from './clearing-state.js';

export const PLANS={
  holdOrin:{watch:'orin',task:'inspect',title:'Orin stays. Inspect with Sera.',summary:'One worker guards Orin. One inspects the crossing, with Sera guiding them. No worker repairs the anchor or protects the stores.',risk:'The guard prevents Orin opening the gate. The families wait; the repair and stores remain your responsibility.',orin:'A guard? In front of my own council? Then you will explain to the families why I was kept from them.',sera:'I’ll show your inspector the fastening. They make their own report. This does not make me innocent.'},
  holdSera:{watch:'sera',task:'inspect',title:'Sera stays. Send an inspector.',summary:'One worker guards Sera. One inspects the crossing alone. Orin retains the gate key. No repair or store protection tonight.',risk:'The inspector cannot stop Orin attempting an unchecked passage. An injury would tie up one worker on tomorrow’s escort. Holding Sera also leaves you owing a witnessed hearing.',orin:'Then send your inspector. I have given those families my word. At the last bell, I’m going.',sera:'You keep me here and leave him the key? Put that in the record. Next time I speak, I want a witness.'},
  repair:{watch:'none',task:'repair',title:'Hold neither. Send both to repair.',summary:'Both workers reset the anchor. Nobody guards either speaker or protects the stores. Sera is free, but no worker is available for her inspection.',risk:'Repair is not clearance. Orin remains free to try the unchecked approach; an injury would reserve one worker for tomorrow’s escort. The stores stay exposed.',orin:'Then let them fix the line. I will take the first family myself. They need to see that someone still keeps a promise.',sera:'The anchor is only half the crossing. Who checks the bank? You have sent both workers. You have left him the key.'}
};

export function proposedOrders(state,key){
  if(state.version!==3||state.phase!=='planning'||!Object.hasOwn(PLANS,key))return null;
  const plan=PLANS[key];
  // Build an isolated preview through existing actions. Never mutate the saved plan.
  let next=state;
  for(const [job,count]of Object.entries(state.crew))if(count)next=act(next,'assign',job);
  next=act(next,'watch',plan.watch);
  return act(next,'assign',plan.task);
}
export function confirmOrders(state,key){
  const next=proposedOrders(state,key);
  return next?act(next,'commit'):state;
}

export function sceneLine(beat,state){
  if(beat.startsWith('morning-')||beat.startsWith('noon-'))return aftermathLine(beat,state);
  const admitted=state.challenged;
  const lines={
    opening:{speaker:'orin',cue:'Orin keeps the gate key in his hand.',line:admitted?'I told her to ease the line. I did not tell her to leave it loose. The families are still waiting.':'Sera loosened the outer line. I gave no such order. Now the families are stranded. Keep her here tonight.',record:'leader',next:'answer'},
    answer:{speaker:'sera',cue:'Sera answers him, not you.',line:'You told me to ease it so the ferry could reach the stores. Say that part, Orin. Say why I was at the fastening.',record:'report',next:'warning'},
    warning:{speaker:'orin',cue:'He turns the key between his fingers.',line:'And while we argue over words, they wait across the river. If I am free at the last bell, I will take the first family through.',next:'intervene'},
    intervene:{speaker:'sera',cue:'She looks to you. Neither steps away.',line:'You heard him. An inspector can report a bad crossing. They cannot stop the council leader opening it.'},
    admission:{speaker:'orin',cue:'His answer is quieter now.',line:'I told her to ease the outer line. To free the ferry for the stores. I did not tell her to leave it loose.',next:'admissionAnswer'},
    admissionAnswer:{speaker:'sera',cue:'Sera does not let him finish the argument there.',line:'Then stop saying I acted alone. I handled the rope. I cannot tell you why it slipped. Your order and that failure are different questions.',next:'decision'},
    limits:{speaker:'sera',cue:'She keeps her account narrow.',line:'I handled the line. He gave the order. The water rose; the rope slipped. I have not proved why. Send a worker to inspect it. If I’m free, I’ll show them where.',next:'limitsAnswer'},
    limitsAnswer:{speaker:'orin',cue:'Orin looks past her, toward the river.',line:'And who tells the families to wait again? If you mean to stop me, say it plainly.',next:'decision'}
  };
  return lines[beat]||null;
}

// Reactions read completed work; hearing/replay never performs another game action.
export function aftermathLine(beat,state){
  if(state.version!==3)return null;
  const held=state.watch==='orin',seraHeld=state.watch==='sera';
  if(beat.startsWith('morning-')){
    if(!['dawn','morning'].includes(state.phase))return null;
    const crossing=state.crew.repair?'The workers reset the anchor. No one has load-checked it or cleared the approach. We can send someone to verify it this morning.':state.crew.inspect?'Your inspector found the fastening loose. We have a report, not a repair. It still needs two workers, then a later check.':'No worker examined the crossing last night. We still have Sera’s warning, not a new inspection or a repair.';
    const stores=state.crew.supplies?'The stores were moved above the water. That job is done for this rise.':'The stores are still exposed. Nobody has counted a loss. Moving them is another job waiting for us.';
    const capacity=held?'Both workers are available now. But a repair takes both; protection or a hearing would have to wait.':'One worker is needed for the traveler’s escort until noon. Only one remains for new work. We cannot promise a two-person repair this shift.';
    const lines={
      'morning-orin':{speaker:'orin',cue:held?'The night watch is over. Orin faces you by the cold fire.':'Orin returns from the river without the family he promised to lead across.',line:held?'Your guard kept me here. No family went onto the crossing. I can see what that prevented. But you put a guard on me in front of everyone. You owe them an explanation—and so do I.':'I opened the gate. The traveler turned an ankle on the approach. We came back. I thought taking them myself would make the risk mine. It didn’t. Now someone must escort them to shelter.',next:'morning-sera'},
      'morning-sera':{speaker:'sera',cue:seraHeld?'Sera stays on the far side of the fire.':'Sera waits until he has finished.',line:(seraHeld?'You held me while he kept the key. I am free now, but I will not give another field briefing without a witness. My earlier note is still there.':held?'Stopping him was not the same as proving me right about everything. I handled that rope. We still have to find out why it slipped.':'You left us both free. He still had the key. That was a decision too. His failed crossing does not explain why the rope slipped.')+' '+(state.challenged?'He admitted giving the instruction. Keep that in the record. It does not settle his intent.':'He still denies the instruction. I still say he gave it. Do not write that down as resolved.'),next:'morning-work'},
      'morning-work':{speaker:'orin',cue:'Orin turns from the argument to the workers’ record.',line:`${crossing} ${stores}`,note:capacity,next:'morning-orders'}
    };
    return lines[beat]||null;
  }
  if(!beat.startsWith('noon-')||state.phase!=='noon')return null;
  const out=noonResult(state);
  const crossing=out.open?'The higher approach and line are checked. We can open that route for supervised passage at this water level.':out.repaired?'The anchor is reset. We still have no verified route. I cannot call the crossing open.':'The anchor still needs a pair. The crossing stays closed. We have not worked our way out of that promise.';
  const memory=held?'You kept me here last night. I still want that explained publicly.': 'The escort brought the traveler to shelter. That cost a whole worker’s morning. Finishing another job does not undo the injury.';
  const supplies=out.protectedStores?'The stores are protected from this rise. That is one obligation we can close.':'The stores are still exposed. We have not established a loss, but protection is still owed.';
  const testimony=out.hearing?(state.challenged?'The witness recorded his earlier admission. I told the hearing that no one said when to restore the line. That is testimony, not proof of intent.':'We gave our accounts to a witness. He denied giving the instruction again. I repeated that he gave it. A hearing is not an agreement.'):(seraHeld?'You have not provided the witness I asked for. I am still withholding a new field briefing.':state.challenged?'His admission remains on record. We have not had the witnessed hearing yet.':'We have not had the witnessed hearing. Our accounts still conflict.');
  const lines={
    'noon-orin':{speaker:'orin',cue:'The morning shift ends. Orin looks toward the crossing.',line:`${crossing} ${memory}`,next:'noon-sera'},
    'noon-sera':{speaker:'sera',cue:out.hearing?'Sera closes the witnessed record.':'Sera answers from beside the council fire.',line:seraHeld&&!out.hearing?testimony:`${supplies} ${testimony}${seraHeld?' Speaking with a witness did not erase the night you held me.':''}`,note:seraHeld&&!out.hearing?`Workers’ record: ${supplies}`:undefined,next:'noon-summary'}
  };
  return lines[beat]||null;
}
