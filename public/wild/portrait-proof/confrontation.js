// A staged version of the existing dispute. Orders still use the same game rules.
import {act} from './clearing-state.js';

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
