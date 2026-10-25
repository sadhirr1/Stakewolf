// SCRUM-38: bounded local conversation. Only the engine's public view supplies facts.
import {councilView, councilAct} from './council.mjs';

const vocabulary = {
  accessibility:{
    owners:{audit:'design',focus:'engineering',queue:'support'},
    sources:{
      audit:/\b(audit|automated|contrast|scan|accessible screen|screen (?:is |was )?accessible)\b/,
      focus:/\b(keyboard|walkthrough|focus trap|full rewrite|whole screen|rewriting)\b/,
      queue:/\b(support tags?|complaints?|save failures?|queue|two customers)\b/
    },
    proposals:{
      repair:/\b(local (?:focus )?(?:repair|fix|patch)|repair (?:the )?(?:blocked task|focus)|fix (?:the )?focus|bounded repair)\b/,
      fallback:/\b(fallback|previous screen|old screen|withdraw (?:the )?new screen|roll back (?:the )?screen)\b/,
      replace:/\b(shared (?:component )?(?:replacement|migration)|component (?:replacement|migration)|replace (?:the )?(?:shared )?components?|full rewrite)\b/
    },
    promises:{
      showcase:/\b(showcase|limited demo(?:nstration)?|revised demo(?:nstration)?)\b/,
      verification:/\b(independent (?:task )?(?:checks?|verification|tests?)|task checks?|assistive[- ]technology (?:checks?|tests?)|verification)\b/,
      triage:/\b((?:bounded |temporary )?triage(?: plan)?|temporary (?:issue )?tag|follow up (?:the )?(?:two )?(?:save )?failures)\b/
    },
    work:{
      announce:/\b(error announcements?|announce(?:ment)? repair|failure recovery)\b/,
      interim:/\b(interim (?:save )?route|temporary (?:save )?route)\b/,
      'fallback-verify':/\b(verify (?:and communicate )?(?:the )?fallback|fallback (?:verification|checks?)|route[- ]back)\b/,
      'new-errors':/\b(new screen.*error|error announcements?|error repair)\b/,
      'component-errors':/\b(component.*error|error announcements?|error coverage)\b/
    }
  },
  systems:{
    owners:{consumers:'platform',contract:'account',canary:'reliability'},
    sources:{
      consumers:/\b(consumer register|consumers?|external (?:owners?|integrations?)|readiness evidence|all.*ready)\b/,
      contract:/\b(contract|signed|specification|commitment record|exact (?:response )?format|proposal email)\b/,
      canary:/\b(canary|migration risk|internal clients|parser coverage)\b/
    },
    proposals:{
      versioned:/\b(versioned (?:migration|path|pilot)?|separate (?:response )?version|both (?:api )?(?:versions|formats)|two (?:api )?(?:versions|formats)|keep (?:the )?old (?:api )?route)\b/,
      readiness:/\b(wait (?:for )?(?:external )?(?:readiness|owners?|confirmation)|external readiness|confirm (?:external )?(?:migration )?owners|hold (?:the )?(?:common )?(?:format )?change)\b/,
      narrow:/\b(adapter|narrow (?:the )?(?:customer )?commitment|smaller integration|smaller outcome)\b/
    },
    promises:{
      retirement:/\b(retirement (?:criteria|plan)|exit criteria|review date|legacy exit)\b/,
      rollback:/\b(rollback(?: ownership| drill)?|on[- ]call owner|rehears(?:e|al) rollback)\b/,
      customer:/\b(customer (?:milestone|discussion|conversation)|renegotiate|confirm (?:the )?integration outcome)\b/
    },
    work:{
      parser:/\b(partner (?:migration )?(?:fixture|parser)|parser (?:fixture|migration|repair)|rejecting parser)\b/,
      maintenance:/\b((?:dual|both|two)[- ]format (?:maintenance|support|coverage)|staff both formats|maintenance coverage)\b/,
      pilot:/\b((?:bounded |isolated |customer )?pilot)\b/,
      adapter:/\b(adapter|customer acceptance|integration outcome)\b/,
      legacy:/\b(legacy (?:support|ownership|coverage)|partner fixture|parser regression)\b/
    }
  }
};

const result = (reply,kind='answer',pending=null,topic) => ({reply,kind,pending,...(topic?{topic}:{})});
const hits = (map,text) => Object.entries(map).filter(([,pattern])=>pattern.test(text)).map(([id])=>id);
const cost = view => view.aftermath?.cost ?? view.cost;
const normalize = text => text.toLowerCase().replace(/[’‘]/g,"'").replace(/[–—]/g,'-').replace(/\s+/g,' ').trim();
const uncertain = /\b(maybe|perhaps|possibly|not sure|unsure|might|either|instead of|rather than)\b|\bor\b/;
const negative = /\b(no|not|never|without|don't|do not|can't|cannot|won't|wouldn't|shouldn't|isn't|aren't|doesn't)\b/;
const withdrawal = /\b(withdraw|remove|drop|cancel|unpromise|stop funding|defer)\b/;
const requesting = /\b(i can|i will|i'll|let's|let us|can we|could we|shall we|please|offer|promise|fund|allocate|choose|select|propose|agree|keep|start|give|reserve|withdraw|remove|drop|cancel|defer|stop funding)\b/;
const asking = /^(what|why|how|which|who|when|is|are|does|do|will|would|tell|explain)\b/;
const evidenceQuestion = /\b(evidence|record|source|proof|prove|claim|how do you know|what supports|sure|really|inspect|investigate|open|check that|trust (?:that|you|this))\b/;

function sourceReply(view,person,recordId) {
  const record = view.records.find(r=>r.id===recordId);
  const ownerId = vocabulary[view.topic].owners[recordId];
  const owner = view.stakeholders.find(p=>p.id===ownerId);
  const attribution = owner.id===person.id ? 'My source record' : `${owner.name}, the ${owner.role.toLowerCase()}, is the contact for this record`;
  const topic = `source:${recordId}`;
  if (record.opened) return result(`${record.title}: ${record.text} This record is already open; discussing it uses no further investigation.`, 'answer',null,topic);
  if (view.phase!=='council') return result(`${record.title} was not inspected before the council closed. Its contents remain unknown in this attempt; ${attribution.toLowerCase()}.`, 'limit',null,topic);
  if (!view.investigationRemaining) return result(`${record.title} is still unopened. Both investigations are used, so I cannot establish its contents in this attempt.`, 'limit',null,topic);
  return result(`${attribution}: ${record.title}. I can offer an inspection before discussing what it establishes. It costs 1 of your ${view.investigationRemaining} remaining investigations; no contents have been revealed.`, 'inspection', {
    label:`Inspect ${record.title}`,
    actions:[{type:'investigate',recordId}],
    summary:`Open ${record.title}; use 1 investigation, leaving ${view.investigationRemaining-1} of 2. Capacity reservations are unchanged.`
  },topic);
}

function supportReply(view,person) {
  const chosen = view.proposals.find(p=>p.selected);
  const reaction = view.aftermath?.reactions.find(p=>p.name===person.name);
  return result(`${chosen?`For ${chosen.title.toLowerCase()}, my support is ${person.support}.`:'You have not chosen an approach yet.'} ${person.condition}${reaction?` ${reaction.text}`:''}`,'answer',null,'support');
}

function capacityReply(view) {
  const promises = view.commitments.filter(c=>c.selected);
  return result(`${cost(view)} of ${view.capacity} capacity units are ${view.phase==='debrief'?'used':'reserved'}; ${view.capacity-cost(view)} remain. ${promises.length?`Promises: ${promises.map(c=>`${c.title} (${c.cost})`).join('; ')}.`:'No promises are reserved.'} Each approach reserves 2 units. Investigations have a separate two-record limit; ${view.investigationRemaining} remain.${view.phase==='aftermath'?' The approach and council promises are locked.':''}`,'answer',null,'capacity');
}

function describe(view,kind,ids) {
  const items = kind==='proposal'?view.proposals:kind==='promise'?view.commitments:view.aftermath?.work || [];
  return ids.map(id=>items.find(item=>item.id===id)).filter(Boolean).map(item=>`${item.title}: ${item.detail}${kind==='promise'?` Cost: ${item.cost} units. ${item.selected?'Already promised.':'Not currently promised.'}`:kind==='work'?` Cost: ${item.cost} units. ${item.selected?'Currently funded.':'Not currently funded.'}`:item.selected?' This is your current approach.':''}`).join(' ');
}

function offer(state,view,person,actions,labels,topic) {
  if (!actions.length) return result(`That is already reflected in the current plan; nothing will be toggled off. ${supportReply(view,person).reply}`,'answer',null,topic);
  let preview = state;
  for (const action of actions) {
    const next = councilAct(preview,action);
    if (next===preview) return result(`That combination does not fit the current phase or remaining capacity (${view.capacity-cost(view)} units). No part of it has been applied. Withdraw optional work first if you want to reallocate it.`,'limit',null,topic);
    preview = next;
  }
  const after = councilView(preview), afterPerson = after.stakeholders.find(p=>p.id===person.id);
  const summary = `${labels.join('; ')}. Capacity after confirmation: ${cost(after)}/${after.capacity}, leaving ${after.capacity-cost(after)}. ${afterPerson.name}: ${afterPerson.support}; ${afterPerson.condition}`;
  return result(`I understand this as: ${labels.join('; ')}. Review the proposed cost and support before confirming. ${afterPerson.condition} This offer does not guarantee agreement from every stakeholder.`,'offer',{label:'Apply this offer',actions,summary},topic);
}

/** Pure interpretation only. Caller must preview, then explicitly confirm engine actions. */
export function interpretCouncilMessage(state,stakeholderId,text,{history=[]}={}) {
  let view;
  try { view=councilView(state); } catch { return result('This council state is unavailable. Start a new council.','limit'); }
  const person = view.stakeholders.find(p=>p.id===stakeholderId);
  if (!person) return result('Choose a stakeholder from this case before asking.','clarify');
  if (typeof text!=='string' || !text.trim()) return result('Ask a question or describe an offer in your own words.','clarify');
  if (text.length>600) return result('Please keep this message to 600 characters so I can interpret one bounded question or offer.','limit');
  if (/[<>`\x00-\x08\x0b\x0c\x0e-\x1f]/.test(text)) return result('Please use a plain-text question or offer without markup or code.','clarify');
  const input = normalize(text), lex=vocabulary[view.topic];
  if (/\b(hidden|secret|private|agenda|objective|real motive|really want|incentive)\b/.test(input)) {
    if (view.debrief) {
      const reveal=view.debrief.reveals.find(p=>p.id===person.id);
      return result(`Now that the debrief has revealed it: ${reveal.objective} ${reveal.reflection}`,'answer',null,'objective');
    }
    return result(`My public role is ${person.role.toLowerCase()}. My claim is: “${person.claim}” Private objectives are revealed in the debrief; they are not established evidence during the council.`,'limit',null,'objective');
  }
  if (/\b(finish|close (?:the )?council|end (?:the )?round|lock (?:it|this|the decision) in|commit (?:the |my |this )?(?:decision|proposal)|replay|restart)\b/.test(input)) return result('Use the existing close-council, finish-round, or replay control when you are ready. Conversation cannot advance or restart the round.','limit');
  if (/^(yes|yes please|do it|apply|confirm|okay|ok)[.! ]*$/.test(input)) return result('Use the confirmation control attached to an interpreted offer. A typed yes does not apply actions.','limit');
  if (/\b(discount|cheaper|free|half (?:the )?cost|zero cost|less capacity|fewer units|one unit instead|for (?:\d+|one|two|three|zero) (?:capacity )?units?|at (?:\d+|one|two|three|zero) (?:capacity )?units?)\b/.test(input)) return result('The authored costs are fixed. I cannot discount a promise or add capacity; review the listed cost and choose what to reserve or defer.','limit',null,'capacity');
  if (/\b(hire|overtime|cash|dollars|salary|marketing campaign|new specialist queue|guarantee|guaranteed|universal accessibility|unlimited|extra capacity|more capacity)\b/.test(input)) return result('I cannot create that commitment or guarantee that outcome. This case supports only the displayed approaches, promises, investigations, and response work at their stated costs.','limit');
  const proposals=hits(lex.proposals,input), sources=hits(lex.sources,input);
  const work=view.aftermath?hits(lex.work,input).filter(id=>view.aftermath.work.some(w=>w.id===id&&!w.locked)):[];
  // "Fallback verification" names optional work, not the independent-checks promise.
  const promises=hits(lex.promises,input).filter(id=>!(id==='verification' && work.includes('fallback-verify') && !/\b(independent|task checks?|assistive)\b/.test(input)));
  const remove=withdrawal.test(input) && !/withdraw (?:the )?new screen/.test(input);
  const intent=!asking.test(input) && (requesting.test(input) || remove);
  const entities=proposals.length+promises.length+work.length;
  if ((/^(?:please )?(?:don't|do not|never)\b/.test(input) || /\b(inspect|investigate|open)\b/.test(input)) && (negative.test(input)||uncertain.test(input))) return result('I heard a negative or uncertain inspection request. No record will be opened. Ask one positive question or explicitly name the record you want to inspect.','clarify');
  // Inspect requests and factual challenges take priority over overlapping proposal words.
  if (!intent || /\b(inspect|investigate|open|evidence|record|source|proof|prove|claim|how do you know)\b/.test(input)) {
    if (sources.length>1) return result('That touches more than one source. Ask about one named record at a time; each unopened record uses one investigation.','clarify');
    if (sources.length===1) return sourceReply(view,person,sources[0]);
    if (evidenceQuestion.test(input)) return sourceReply(view,person,Object.keys(lex.owners).find(id=>lex.owners[id]===person.id));
  }
  if ((entities && intent) && (uncertain.test(input) || negative.test(input))) return result('I heard uncertainty, a negative, or alternatives. Please name one positive offer, or explicitly say “withdraw” followed by the promise or optional work you want removed. Nothing has changed.','clarify');
  if (proposals.length>1) return result('Those are different approaches. Which single approach should I interpret? Nothing has changed.','clarify');
  if (intent && entities) {
    const clauses=input.split(/\s+(?:and|but|then|also)\s+|[.;,]\s*/).filter(Boolean);
    if (remove && clauses.some(clause=>!withdrawal.test(clause)&&/\b(promise|fund|allocate|give|reserve|offer|agree|choose|select|propose|keep|start)\b/.test(clause))) return result('That mixes adding and withdrawing work. Please make one offer to add work or one explicit withdrawal at a time, so neither intention is lost.','clarify');
    if (clauses.some(clause=>!hits(lex.proposals,clause).length&&!hits(lex.promises,clause).length&&!hits(lex.work,clause).length&&!/^(?:a )?(?:drill|revised date|review date)\b/.test(clause))) return result('Part of that offer does not match an available approach, promise, or response item. Please restate the supported offer on its own; I will not quietly drop the extra condition.','clarify');
    if (view.phase==='debrief') return result('This attempt is complete. We can discuss its evidence and outcomes; replay with the existing control to make a new offer.','limit');
    if (view.phase==='aftermath') {
      if (!work.length) return result('The approach and council promises are locked. Name one of the optional response-work items to allocate or withdraw.','limit');
      if (proposals.some(id=>!view.proposals.find(p=>p.id===id).selected)) return result('The council approach is locked. Please ask separately about the optional response work you want to allocate or withdraw; I cannot include a different approach in that offer.','limit');
      // A phrase naming a promise as well as optional work must not silently discard the promise request.
      if (promises.length) return result('Council promises are locked. Please ask separately about the optional response work you want to allocate or withdraw.','limit');
      const chosen=work.map(id=>view.aftermath.work.find(w=>w.id===id));
      const actions=chosen.filter(w=>remove?w.selected:!w.selected).map(w=>({type:'allocate',workId:w.id}));
      return offer(state,view,person,actions,chosen.map(w=>`${remove?'Withdraw':'Fund'} ${w.title.toLowerCase()} (${w.cost} units)`),`work:${work[0]}`);
    }
    if (remove && (proposals.length || !promises.length)) return result('I can withdraw a named council promise before closing, but an approach must be replaced by another approach. Please name the promise to withdraw.','clarify');
    const actions=[], labels=[];
    for (const id of proposals) {
      const item=view.proposals.find(p=>p.id===id);
      if (!item.selected) actions.push({type:'propose',proposalId:id});
      labels.push(`Choose ${item.title.toLowerCase()} (2 units)`);
    }
    for (const id of promises) {
      const item=view.commitments.find(p=>p.id===id);
      if (remove?item.selected:!item.selected) actions.push({type:'promise',commitmentId:id});
      labels.push(`${remove?'Withdraw':'Promise'} ${item.title.toLowerCase()} (${item.cost} units)`);
    }
    return offer(state,view,person,actions,labels,proposals.length?`proposal:${proposals[0]}`:`promise:${promises[0]}`);
  }
  if (/\b(capacity|cost|units?|afford|budget|room|reserved|remaining|promises|committed)\b/.test(input)) return capacityReply(view);
  if (/\b(what do you (?:want|need|care about)|what matters|what would change your mind|your priorities|important to you)\b/.test(input)) return result(`As ${person.role.toLowerCase()}, my public position is: “${person.claim}” ${supportReply(view,person).reply}`,'answer',null,'support');
  if (/\b(support|backing|back (?:me|us|this|it)|agree|conditions?|on board|what (?:do you )?need)\b/.test(input)) {
    if (view.phase==='council' && proposals.length===1 && !view.proposals.find(p=>p.id===proposals[0]).selected) {
      const hypothetical=councilView(councilAct(state,{type:'propose',proposalId:proposals[0]}));
      return result(`If you chose that approach with your current promises and inspected records: ${supportReply(hypothetical,hypothetical.stakeholders.find(p=>p.id===person.id)).reply} This is an explanation; your plan has not changed.`,'answer',null,'support');
    }
    return supportReply(view,person);
  }
  if (view.aftermath && /\b(changed|update|happened|now|aftermath|consequence|outcome|deferred|delivered|next|response|work)\b/.test(input)) return result(`${view.debrief?.summary||view.aftermath.summary} ${view.aftermath.reactions.find(p=>p.name===person.name).text}`,'answer',null,'aftermath');
  if (work.length) return result(describe(view,'work',work),'answer',null,`work:${work[0]}`);
  if (proposals.length) return result(describe(view,'proposal',proposals),'answer',null,`proposal:${proposals[0]}`);
  if (promises.length) return result(describe(view,'promise',promises),'answer',null,`promise:${promises[0]}`);
  if (/^(why|tell me more|what about that|and that|explain that|what does that mean)[?.! ]*$/.test(input)) {
    const previous=Array.isArray(history)?[...history].reverse().find(h=>h && typeof h.topic==='string'):null;
    const [type,id]=(previous?.topic||'').split(':');
    if (type==='source' && view.records.some(r=>r.id===id)) return sourceReply(view,person,id);
    if (type==='support') return supportReply(view,person);
    if (type==='capacity') return capacityReply(view);
    if (['proposal','promise','work'].includes(type)) {
      const reply=describe(view,type,[id]);
      if (reply) return result(reply,'answer',null,previous.topic);
    }
  }
  if (/\b(hello|hi|your view|your position|do you think|tell me about yourself|your role)\b/.test(input)) return result(`I'm ${person.name}, the ${person.role.toLowerCase()}. My public claim is: “${person.claim}” You can question my source, ask what I need to support an approach, or make an offer.`,'answer',null,'claim');
  return result('I can discuss this case’s records, support conditions, capacity, named approaches and promises, or optional work after the council. Please name one of those in a question or offer. This is local authored dialogue with limited language coverage.','clarify');
}

/** Natural examples, not a required menu. The same three are safe in every phase. */
export function dialogueExamples(topic,stakeholderId) {
  const examples={
    accessibility:{
      design:['What did the audit actually check?','What would you need to support the local repair?','Can we plan a revised showcase?'],
      support:['What do the support tags establish?','Would a bounded triage plan help?','How much capacity have we reserved?'],
      engineering:['What does the keyboard walkthrough show?','I can fund independent checks if you support local repair.','What changes after our decision?']
    },
    systems:{
      platform:['Are all consumers ready?','Can we keep both API versions and agree retirement criteria?','How much capacity remains?'],
      account:['What does the signed contract require?','Can we renegotiate the customer milestone?','Would you support a versioned migration?'],
      reliability:['What does the canary actually cover?','Can we fund rollback ownership and a drill?','What response work remains?']
    }
  };
  return Object.hasOwn(examples,topic) && Object.hasOwn(examples[topic],stakeholderId) ? [...examples[topic][stakeholderId]] : [];
}
