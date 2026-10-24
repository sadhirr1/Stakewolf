// SCRUM-37: local, deterministic coaching prompts and visible text matches.
// This module neither grades reasoning nor infers beliefs, ability or hidden motives.
const string = value => typeof value === 'string' ? value : '';
const list = value => Array.isArray(value) ? value : [];
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const mention = (text, name) => {
  if (!name) return {status:'not detected',excerpts:[]};
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}_])${escape(name).replace(/\s+/g,'\\s+')}(?![\\p{L}\\p{N}_])`,'giu');
  const excerpts = [];
  for (const match of text.matchAll(pattern)) {
    const excerpt = text.slice(Math.max(0,match.index-65),match.index+match[0].length+105).trim();
    if (!excerpts.includes(excerpt)) excerpts.push(excerpt);
    if (excerpts.length===3) break;
  }
  return {status:excerpts.length ? 'detected' : 'not detected',excerpts};
};

const cueRules = [
  {id:'tradeoff',label:'Contrast or cost wording',pattern:/\b(?:but|while|rather than|instead of|at the (?:cost|expense) of)\b/i,minWords:8},
  {id:'verification',label:'Verification action wording',pattern:/\b(?:verify|check|test|compare|measure|confirm|investigate|review)\b\s+\S+(?:\s+\S+){2}/i,minWords:6},
  {id:'uncertainty',label:'Uncertainty or assumption wording',pattern:/\b(?:unknown|uncertain(?:ty)?|not yet known|do not know|don't know|missing|assum(?:e|ption)|unproven|may|might|could)\b/i,minWords:3},
  {id:'update',label:'Update or reconsideration wording',pattern:/\b(?:new evidence|(?:the|this) update|revis(?:e|ed|ing)|(?:change[sd]?|retain) (?:my|our|the) (?:view|recommendation|decision)|still recommend|now recommend|now propose)\b/i,minWords:6}
];

function cueMatches(text, rule) {
  const excerpts = [];
  // Conservative surface cues: common negations are excluded, not interpreted.
  // Full sentences remain exact excerpts; this does not resolve paraphrases or logic.
  for (const part of text.match(/[^\r\n.!?;]+(?:[.!?;]+|$)/g) || []) {
    const clause = part.trim();
    const stripped = rule.id==='uncertainty' ? clause.replace(/\b(?:not yet known|do not know|don't know)\b/ig,'unknown') : clause;
    if (/\b(?:no|not|never|neither|nothing|without|ignore|won't|cannot|can't|don't|doesn't|isn't|isn’t|don’t|won’t|can’t)\b/i.test(stripped)) continue;
    if (clause.split(/\s+/).length<rule.minWords || !rule.pattern.test(clause)) continue;
    const match = clause.match(rule.pattern);
    const start = Math.max(0,match.index-60);
    const excerpt = clause.length<=240 ? clause : clause.slice(start,start+240).trim();
    if (!excerpts.includes(excerpt)) excerpts.push(excerpt);
    if (excerpts.length===2) break;
  }
  return {id:rule.id,label:rule.label,status:excerpts.length ? 'detected' : 'not detected',excerpts};
}

function analyze(text, records, people, isFinal) {
  const hasText = Boolean(text.trim());
  return {
    text,hasText,
    references:[
      ...records.map(record=>({kind:'record',id:string(record.id),name:string(record.name),...mention(text,string(record.name))})),
      ...people.map((person,index)=>({kind:'stakeholder',id:String(index),name:string(person.name),...mention(text,string(person.name))}))
    ],
    cues:cueRules.filter(rule=>isFinal || rule.id!=='update').map(rule=>cueMatches(text,rule)),
    notice:hasText
      ? 'Detected means a name or wording pattern appears in your text. It does not establish accurate use, agreement, a sound trade-off or answer quality. Review the exact excerpts yourself.'
      : 'No answer text was supplied for this stage. There is no reasoning to analyze; the prompts below are invitations to write, not findings about your ability.'
  };
}

/** Plain data only. Rehearsal replaces only the analyzed final text, never the attempt. */
export function buildFeedback(c={}, attempt={}) {
  c = c && typeof c==='object' ? c : {};
  attempt = attempt && typeof attempt==='object' ? attempt : {};
  const evidence = list(c.evidence).filter(item=>item && typeof item==='object');
  const people = list(c.people).filter(item=>item && typeof item==='object');
  const choices = list(c.choices);
  const note = string(attempt.note), revision = string(attempt.revision);
  const rehearsing = typeof attempt.rehearsal==='string';
  const first = analyze(note,evidence,people,false);
  const final = analyze(rehearsing ? attempt.rehearsal : revision,evidence,people,true);
  const before = new Set(list(attempt.openedBefore));
  const after = new Set(list(attempt.openedAfter));
  const asked = new Set(list(attempt.asked).filter(Number.isInteger));
  const records = evidence.map(record=>{
    const name=string(record.name),id=string(record.id);
    const openedBefore=before.has(id),openedAfter=after.has(id);
    const consultedViaReply=people.some((person,index)=>asked.has(index) && person.source===name);
    const timing = openedBefore ? 'You opened this record before the first decision.'
      : openedAfter ? 'You opened this record after the first decision; use it when explaining your final answer.'
      : 'No direct opening of this record was recorded.';
    return {id,name,title:string(record.title),detail:string(record.detail),openedBefore,openedAfter,consultedViaReply,
      firstMention:mention(note,name),finalMention:mention(final.text,name),
      prompt:`${timing}${consultedViaReply ? ' You also received a stakeholder reply linked to it; that reply may not contain the whole record.' : ''} Explain which detail in ${name || 'this record'} supports or limits your recommendation, and what remains unresolved.`};
  });
  const views = people.map((person,index)=>({
    name:string(person.name),claim:string(person.claim),aim:string(person.aim),source:string(person.source),contacted:asked.has(index),
    response:asked.has(index) ? string(person.answer) : null,
    firstMention:mention(note,string(person.name)),finalMention:mention(final.text,string(person.name)),
    prompt:asked.has(index)
      ? `Compare ${string(person.name)}'s public claim with the reply and ${string(person.source)}. What does each establish, and where does the claim go further?`
      : `You did not ask ${string(person.name)} a question. Compare the public claim and aim with ${string(person.source)}; decide what a follow-up would clarify. Contacting everyone is not a requirement.`
  }));
  const choiceTitle = index => Number.isInteger(index) && index>=0 ? string(choices[index]?.title) || null : null;
  const selected = Number.isInteger(attempt.choice) && attempt.choice>=0 ? choices[attempt.choice] : null;
  const focus = final.hasText ? final : first;
  const mentioned = record=>(final.hasText ? record.finalMention : record.firstMention).status==='detected';
  const recordFocus = records.find(record=>!mentioned(record) && !record.openedBefore && !record.openedAfter && !record.consultedViaReply)
    || records.find(record=>!mentioned(record)) || records[0];
  const nextSteps = [];
  if (!first.hasText && !final.hasText) {
    nextSteps.push('Write a recommendation and explain one supplied fact that informs it. No answer quality can be inferred from blank notes.');
  } else {
    if (recordFocus) nextSteps.push(mentioned(recordFocus)
      ? `Revisit your explanation of ${recordFocus.name}: ${recordFocus.detail} Decide whether the connection to your recommendation needs clarification. Naming the record alone does not establish that connection.`
      : `Use a specific detail from ${recordFocus.name}: ${recordFocus.detail} Explain how it affects the recommendation; naming the record alone does not establish that connection.`);
    const pairedViews = views.slice(0,2);
    if (pairedViews.length===2) nextSteps.push(`Compare ${pairedViews[0].name}'s aim (${pairedViews[0].aim}) with ${pairedViews[1].name}'s aim (${pairedViews[1].aim}). Explain whether their claims cover the same population, measure or commitment. Different aims or disagreement do not establish dishonesty.`);
    const missing = focus.cues.find(cue=>cue.id!=='update' && cue.status==='not detected');
    if (missing) nextSteps.push({tradeoff:'Make the benefit and cost of your recommendation explicit, including who carries the deferred work or risk.',verification:'Name a specific follow-up, its owner and the observation that would change your recommendation.',uncertainty:'State an unresolved assumption and how you would distinguish it from a supplied fact.'}[missing.id]+' This is a writing prompt; a missing phrase match does not establish a missing idea.');
  }
  if (string(c.update)) nextSteps.push('For your final answer, explain what the new evidence changes or why you retain your recommendation. The initial answer is not judged against information revealed later.');
  return {
    version:1,mode:rehearsing ? 'rehearsal' : 'attempt',first,final,original:{note,revision},records,views,
    decision:{firstChoice:choiceTitle(attempt.firstChoice),finalChoice:choiceTitle(attempt.choice),prompt:string(selected?.reflection) || 'Explain the benefits, costs and next decision point for your recommendation. No option is treated as inherently correct.'},
    update:{detail:string(c.update),prompt:'Use this information only when reflecting on the revision or rehearsal. Keeping or changing the recommendation both need an explanation; neither earns a score.'},
    nextSteps,
    scaffold:[
      `My recommendation for “${string(c.question) || 'this case'}” is … because …`,
      `A specific detail in ${records[0]?.name || 'a supplied record'} is … It supports … but does not establish …`,
      `The public stakeholder claims differ in … Their aims are … The fact or follow-up I would use to compare them is …`,
      'The benefit is … The cost or deferred commitment is … I would ask … to verify … by … and revisit the decision if …',
      'For the final answer: the new evidence changes … I would retain/change the recommendation because … The remaining uncertainty is …'
    ],
    limits:[
      'Prepared local coaching, not AI assessment, a grade, a proficiency score or a correctness judgment.',
      'Exact name matching can miss paraphrases and abbreviations. A detected name may be a quotation, rejection or name dropping; it does not prove that the evidence was understood or used.',
      'Wording cues are conservative surface patterns. Negation, alternative explanations and nuanced reasoning are not interpreted or scored; some common negations are skipped. Not detected does not mean absent.',
      'Opening a record records access, not reading or understanding. A linked reply may provide some of the same information; contact timing is not inferred from the question list.',
      'Only public claims and aims inform these prompts. Private incentives are not evidence of dishonesty and are never used to penalize the first answer.',
      ...(rehearsing ? ['The rehearsal is analyzed separately as final text. The original first and final answers are preserved, and no improvement is claimed.'] : [])
    ]
  };
}
