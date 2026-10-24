// SCRUM-37: deterministic, local phrase matching and authored practice cases.
// Matches describe text coverage, never a candidate's ability. No text leaves this module.
export const competencies = [
  {id:'research',label:'User research',terms:['user research','qualitative research','customer discovery','usability testing','user interviews','research synthesis','usability study']},
  {id:'accessibility',label:'Accessibility',terms:['accessibility','accessible design','assistive technology','screen reader','keyboard navigation','inclusive design','wcag']},
  {id:'experimentation',label:'Experimentation',terms:['experimentation','a/b testing','a/b tests','a/b test','experiment design','controlled experiments','funnel analysis','success metrics','conversion optimization','conversion optimisation']},
  {id:'prioritization',label:'Prioritization',terms:['prioritization','prioritisation','prioritize','prioritise','roadmap ownership','roadmap prioritization','roadmap prioritisation','product trade-offs','product tradeoffs','resource allocation','backlog management']},
  {id:'systems',label:'Systems & APIs',terms:['api','apis','system dependencies','systems integration','platform reliability','backward compatibility','backwards compatibility','api strategy','developer experience','data pipelines']},
  {id:'validation',label:'Validation & operating scope',terms:['adas','advanced driver assistance','advanced driver-assistance','driver-assistance','driver assistance','validation evidence','test evidence','operating conditions','operational design domain','validation strategy','test coverage']}
];

const roleProfiles = [
  {id:'ui',label:'UI / UX',terms:['ui','ux','user experience','user interface','interaction design']},
  {id:'adas',label:'ADAS context',terms:['adas','automotive','driver assistance','driver-assistance','vehicle engineering']},
  {id:'platform',label:'Platform / API',terms:['api','apis','platform','developer experience','data pipelines']},
  {id:'growth',label:'Growth',terms:['growth','acquisition funnel','conversion optimization','conversion optimisation']}
];
const roleLabels = {general:'General PM',...Object.fromEntries(roleProfiles.map(r=>[r.id,r.label]))};
const skillFocus = {research:'sample and recruitment choices',accessibility:'task access and verification',experimentation:'metrics and comparison groups',prioritization:'capacity and deferred commitments',systems:'dependencies and migration ownership',validation:'scope limits and review ownership'};
const rolePrompt = {
  ui:focus=>`Apply the case’s ${focus} to a user journey. Which affected users and accessibility constraints would change your investigation?`,
  platform:focus=>`Apply the case’s ${focus} to a shared API. Which consumers, compatibility commitments and reliability owners must be involved?`,
  growth:focus=>`Apply the case’s ${focus} to an acquisition funnel. How would you check whether short-term conversion gains conflict with retention or contribution margin?`,
  adas:focus=>`Apply the case’s ${focus} to an illustrative driver-assistance requirements discussion. Which operating limits would you document, and which qualified owners must assess the evidence? This exercise cannot establish safety approval.`,
  general:focus=>`For the case’s ${focus}, what decision would you own, who must agree, and which trade-off would you make explicit?`
};
const escapeRegExp = text => text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const phrasePattern = term => new RegExp(`\\b${escapeRegExp(term).replaceAll(' ','\\s+')}\\b`,'ig');

function isNegated(clause, index, length) {
  // Deliberately conservative: a negation in the same clause excludes its list.
  const before = clause.slice(0,index).replace(/\bnot (?:only|limited to)\b/ig,'');
  const after = clause.slice(index+length);
  return /\b(?:no|not|never|without|exclude[ds]?|excluding|outside)\b/i.test(before)
    || /^\s*(?:experience\s*)?(?:(?:is|are)\s+)?(?:not required|not needed|not in scope|is excluded|are excluded)\b/i.test(after);
}

function evidenceFor(text, terms) {
  const evidence = [];
  const foundTerms = new Set();
  // Keep exact substrings; contrast conjunctions form independent clauses.
  const clauses = text.split(/(?:[\r\n;.!?]+|\s+(?:but|however|whereas|yet)\s+)/i);
  for (const raw of clauses) {
    const clause = raw.trim();
    for (const term of terms) {
      for (const match of clause.matchAll(phrasePattern(term))) {
        if (isNegated(clause,match.index,match[0].length)) continue;
        foundTerms.add(term);
        // Bound long pasted clauses while retaining the matched source phrase.
        const start = Math.max(0,match.index-70);
        const excerpt = clause.length<=220 ? clause : clause.slice(start,Math.max(start+220,match.index+match[0].length)).trim();
        if (!evidence.includes(excerpt)) evidence.push(excerpt);
      }
    }
  }
  return {evidence:evidence.slice(0,3),score:foundTerms.size};
}

export function analyzeJD(input) {
  const warnings = [];
  if (typeof input !== 'string' || !input.trim()) return {matches:[],roles:[],warnings:['Paste a job description to find supported practice topics.']};
  const text = input.slice(0,20000);
  if (input.length>20000) warnings.push('Only the first 20,000 characters were checked. Shorten the description to review the rest.');
  const matches = competencies.map(({id,label,terms})=>({id,label,...evidenceFor(text,terms)})).filter(m=>m.score>0).sort((a,b)=>b.score-a.score);
  const roles = roleProfiles.map(({id,label,terms})=>({id,label,...evidenceFor(text,terms)})).filter(r=>r.score>0).map(({score,...role})=>role);
  if (!matches.length) warnings.push('No supported competency phrases found. Choose a practice topic yourself; missing requirements remain unknown.');
  if (matches.length && !roles.length) roles.push({id:'general',label:roleLabels.general,evidence:[]});
  if (matches.some(m=>m.id==='validation') || roles.some(r=>r.id==='adas')) warnings.push('Validation content is an illustrative scope exercise. It is not expert ADAS preparation, certification or a safety assessment.');
  warnings.push('Local phrase matches can miss context and negation. Review and correct the selected topics; scores count matched phrases, not proficiency.');
  return {matches,roles,warnings};
}

const person = (name,initial,aim,claim,question,answer,source,privateAim) => ({name,initial,aim,claim,question,answer,source,privateAim});
const evidence = (id,name,kind,title,detail) => ({id,name,kind,title,detail});
const choice = (title,detail,reflection,outcome) => ({title,detail,reflection,outcome});

const templates = {
  research:{
    title:'Six voices.\nWhose problem?',tag:'RESEARCH / SAMPLE',intro:'A team wants to replace account setup after a promising usability study. Sales says the same flow must also serve new customers.',question:'What would you learn before committing to the redesign?',
    people:[
      person('Design lead','D','Make setup easier.','“Five of six people finished. The new flow solves onboarding.”','Who were the six participants?','All six were returning desktop customers recruited from our advisory group. New mobile users were not sampled.','Study notes','Wants the redesign shown at next week’s design review after two quarters of iteration.'),
      person('Sales lead','S','Reduce friction for prospects.','“Every prospect wants assisted setup instead.”','Which prospects requested assistance?','Three large prospects asked for help migrating data. Their requests did not cover ordinary account setup.','Prospect log','Wants this quarter’s three high-value deals prioritized over self-service acquisition.'),
      person('Research lead','R','Make the decision with relevant evidence.','“We need another full research cycle before doing anything.”','What is the smallest missing comparison?','A short study with first-time mobile users could test the key assumption. A full discovery cycle would answer broader questions.','Recruitment plan','Wants approval for a larger discovery programme and is reluctant to narrow its scope.')
    ],
    evidence:[
      evidence('sample','Study notes','RESEARCH','Promising usability; limited population.','Five of six returning desktop customers completed setup unaided. This cannot establish how new mobile users perform.'),
      evidence('prospects','Prospect log','CUSTOMERS','Migration requests are not onboarding evidence.','Three enterprise prospects requested assisted data migration. No self-service prospect interviews are attached.'),
      evidence('recruitment','Recruitment plan','CONSTRAINT','A smaller follow-up is possible.','Four first-time mobile sessions can be recruited this week. A complete discovery programme takes three weeks.')
    ],
    choices:[
      choice('Pilot with returning users','Limit the trial to the group already studied.','How will you keep a narrow finding from becoming a broad launch claim?','The returning-user pilot starts; acquisition work stays unproven and Sales asks for a separate migration commitment.'),
      choice('Test the missing audience','Run a bounded first-time mobile study.','Which observation would justify keeping or changing the flow?','The broad rollout moves back one week; the team uses the available recruitment slots to examine its biggest sample gap.'),
      choice('Fund wider discovery','Revisit setup and migration needs together.','What decision needs three weeks of research, and what can proceed sooner?','The wider programme receives the team’s capacity; both the redesign showcase and the requested migration pilot are deferred.')
    ],
    update:'Separately, an onboarding support review finds that new users often lack the account ID the redesigned first screen requires. The original study participants already had an ID.',
    lesson:'Ask what each piece of evidence actually covers. A small study can be useful without representing every user; a larger study can also exceed the decision’s immediate needs.',
    prompts:{Associate:'How would you distinguish an observation from an assumption in the six-person study?',PM:'Which user group and task would you investigate next, and what decision will the evidence inform?',Senior:'How would you allocate research capacity between acquisition, enterprise deals and long-term discovery, and align the teams on that trade-off?'},
    reveal:'Design wants a visible milestone, Sales wants three deals protected, and Research wants a broader programme. Each preference shaped a recommendation; none establishes that a person lied.'
  },
  accessibility:{
    title:'A cleaner screen.\nA blocked path.',tag:'ACCESSIBILITY / REACH',intro:'A new account-settings screen is visually simpler. The launch checklist and support queue tell different stories about who can finish the task.',question:'What should the team commit to before expanding the new screen?',
    people:[
      person('Design lead','D','Reduce visual clutter.','“The audit passed, so the screen is accessible.”','Which checks passed?','The automated scan found no flagged contrast issues. Keyboard and assistive-technology task checks were not part of that scan.','Audit scope','Wants the simplified design retained for a scheduled showcase.'),
      person('Support lead','S','Help customers complete account changes.','“We have no accessibility complaints, so this can wait.”','Can the support queue identify affected users?','The queue has no accessibility category. Two customers reported being unable to save, but their input methods are unknown.','Support tags','Wants to avoid adding another specialist escalation queue to an understaffed team.'),
      person('Engineering lead','E','Deliver a reliable settings screen.','“Fixing focus means rewriting the whole screen.”','What has actually been investigated?','One focus trap is reproduced in the dialog. The team has not yet estimated a local fix versus a component replacement.','Keyboard walkthrough','Wants the shared component migration funded rather than another local patch.')
    ],
    evidence:[
      evidence('audit','Audit scope','SCOPE','An automated pass has a boundary.','The supplied scan covers selected automated rules. No completed keyboard or assistive-technology task review is attached.'),
      evidence('focus','Keyboard walkthrough','REPRODUCED','The save path can trap keyboard focus.','A keyboard-only walkthrough gets stuck inside a settings dialog before reaching Save. This is a reproduced task blocker.'),
      evidence('queue','Support tags','OPERATIONS','Absence of a tag is weak reassurance.','The support queue cannot segment accessibility issues. Two save failures need follow-up; their cause is not established.')
    ],
    choices:[
      choice('Fix and verify the blocked task','Assign a local fix investigation and verify the whole save path.','Who verifies the repaired task, and which other interaction gaps stay open?','Expansion waits while Engineering investigates the focus trap and arranges a task walkthrough; the showcase loses its original slot.'),
      choice('Keep the previous screen','Use the previous route while comparing repair options.','What evidence supports the fallback, and when will the team revisit it?','The new design is withdrawn for now; Support handles two screen versions while the team checks the fallback and estimates repair.'),
      choice('Fund the component replacement','Prioritize the broader interaction component work.','How will affected users complete the task during the longer replacement?','The shared component project takes the available sprint capacity; the team still owes users an interim route and verification plan.')
    ],
    update:'A separate assisted-technology walkthrough finds that the error message is not announced when saving fails. Its cause is distinct from the reproduced focus trap.',
    lesson:'An automated check, a support count and a reproduced task failure are different evidence. Prioritize access to the task and verify the proposed remedy; no one metric proves accessibility.',
    prompts:{Associate:'What can an automated scan establish, and what task checks remain missing?',PM:'How would you define owners, verification and an interim route for the blocked save task?',Senior:'How would you balance a shared accessibility programme against urgent local fixes, including ownership across product teams?'},
    reveal:'Design protects its showcase, Support protects scarce staff capacity, and Engineering wants a shared migration. These incentives help explain their framing without excusing unsupported conclusions.'
  },
  experimentation:{
    title:'The lift is real.\nIs the conclusion?',tag:'EXPERIMENT / METRICS',intro:'A checkout test shows higher conversion. Finance and Support disagree about whether that makes it ready for wider rollout.',question:'How would you decide what to do with the experiment?',
    people:[
      person('Growth lead','G','Increase completed orders.','“Conversion is up 18%. Roll it out everywhere.”','What population and uncertainty does the result cover?','First-time mobile visitors moved from 10% to 11.8% over seven days. No uncertainty estimate or repeat-customer result is supplied.','Experiment brief','Wants the conversion lift in the quarterly team report before its deadline.'),
      person('Support lead','S','Reduce payment failures.','“Complaints went from 24 to 36. The test is harming users.”','What is the complaint rate per order?','Traffic and completed orders rose too. We have not aligned complaint counts to exposed users or completed orders.','Support counts','Wants a reason to stop the change before another week of queue pressure.'),
      person('Finance lead','F','Protect contribution margin.','“Revenue rose, so the economics are settled.”','Does the revenue view include incentives and refunds?','It excludes the test coupon cost and refunds arriving after the seven-day window.','Revenue note','Wants a revenue win to justify a previously approved acquisition budget.')
    ],
    evidence:[
      evidence('test','Experiment brief','EXPERIMENT','Relative lift in one segment.','First-time mobile conversion: 10.0% control and 11.8% variant over seven days. Assignment checks, statistical uncertainty and repeat-customer results are not supplied.'),
      evidence('support','Support counts','OPERATIONS','Counts without exposure denominators.','Payment complaints rose from 24 to 36 while traffic and orders increased. Counts alone do not identify a change in complaint rate or its cause.'),
      evidence('margin','Revenue note','ECONOMICS','Revenue excludes delayed costs.','The headline omits test coupon costs and later refunds. A holdout can remain while the team aligns guardrail and margin measures.')
    ],
    choices:[
      choice('Expand with a holdout','Keep a comparison group and explicit guardrails.','Which unresolved risks are acceptable, and what would stop expansion?','More first-time mobile users receive the variant; the holdout remains, while Support must staff the larger exposure before guardrail estimates are complete.'),
      choice('Complete the decision measures','Align exposure, uncertainty and margin before expanding.','What minimum evidence and deadline keep this from becoming indefinite analysis?','Expansion waits while Analytics aligns the denominators and Finance estimates costs; Growth cannot claim an all-user rollout this quarter.'),
      choice('Pause the variant','Revert while investigating potential harm.','What evidence would connect the issue to the variant and justify restarting?','The variant’s exposure stops and the team gives up the observed segment lift for now; investigation still needs to distinguish causation from a raw-count increase.')
    ],
    update:'An independent device breakdown shows complaints concentrated on one older mobile browser. The original conversion brief did not separate browser versions.',
    lesson:'Inspect denominator, population, uncertainty and costs before repeating a headline. A chosen rollout policy creates trade-offs; new evidence may justify changing it.',
    prompts:{Associate:'Explain the difference between an 18% relative lift and a 1.8 percentage-point increase.',PM:'Which primary metric, guardrails and decision threshold would you own for the next step?',Senior:'How would you resolve a conflict between a quarterly growth target and longer-term margin and trust across team incentives?'},
    reveal:'Growth wants a reportable win, Support wants queue relief, and Finance wants its earlier budget decision to look sound. Their selective framing is a reason to inspect evidence, not assign a villain.'
  },
  prioritization:{
    title:'Three promises.\nOne delivery slot.',tag:'PRIORITIZATION / COMMITMENTS',intro:'One team has a single two-week delivery slot. A sales request, an operational fix and a strategic initiative all arrive labelled urgent.',question:'Which commitment would you make, and how would you handle the work you defer?',
    people:[
      person('Sales lead','S','Win an enterprise renewal.','“This feature protects all of next quarter’s revenue.”','What is actually committed in the renewal?','One account represents 8% of renewal value. The requested feature is in an email discussion, not a signed condition.','Renewal record','Wants the account counted in a commission period ending this month.'),
      person('Operations lead','O','Reduce manual recovery work.','“The incident work consumes the whole team every week.”','How much effort is recorded?','The last four weeks logged six engineer-hours each. A peak incident used two engineers for one afternoon.','Incident log','Wants a recurring on-call burden removed from the team before rota planning.'),
      person('Strategy lead','T','Open a new customer segment.','“The board has already approved this launch.”','What did the board approve?','The board approved discovery funding. It has not approved a launch date or committed engineering capacity.','Strategy decision','Wants to show progress on a personally sponsored initiative at the next review.')
    ],
    evidence:[
      evidence('renewal','Renewal record','COMMERCIAL','A valuable account; an unconfirmed condition.','The account represents 8% of renewal value. No signed feature obligation or customer-confirmed deadline is attached.'),
      evidence('incidents','Incident log','OPERATIONS','Recurring effort with a measurable baseline.','Six engineer-hours per week over four weeks are logged for recovery. The proposed fix is estimated at the available two-week slot; impact is not yet verified.'),
      evidence('capacity','Strategy decision','CAPACITY','Discovery approval is not delivery capacity.','The team can deliver only one of the three items in the next slot. Strategy has discovery funding, and the other items need an explicit deferral owner.')
    ],
    choices:[
      choice('Prioritize the renewal request','Confirm customer value and take the feature slot.','What threshold makes one account outweigh recurring work and discovery?','The feature receives the slot; Operations retains the recovery burden and Strategy must revise its delivery expectations.'),
      choice('Prioritize the recurring fix','Use the slot to reduce operational burden.','How will you validate saved effort and communicate the commercial risk?','The team works on recovery reduction; Sales must negotiate the renewal without a feature commitment and Strategy continues with discovery only.'),
      choice('Prioritize the new-segment initiative','Make a strategic bet with explicit opportunity costs.','What evidence makes this bet worth the known operational and account costs?','The new-segment work receives delivery capacity; the operational burden continues and the renewal feature remains uncommitted.')
    ],
    update:'A fresh customer call clarifies that the renewal concern is export reliability rather than the proposed dashboard feature. The customer has not yet accepted an alternative commitment.',
    lesson:'Separate requests, obligations, estimates and evidence. A defensible priority includes who owns the deferred work and which new fact would change the order.',
    prompts:{Associate:'Which statements describe confirmed obligations, and which are assumptions or preferences?',PM:'What prioritization criteria and explicit deferral commitments would you use for the two-week slot?',Senior:'How would you change cross-team incentives and decision rights so quarterly promises do not repeatedly exceed shared capacity?'},
    reveal:'Sales has a commission deadline, Operations has rota pressure, and Strategy has a sponsored initiative. All three benefits are plausible; the evidence narrows their public urgency claims.'
  },
  systems:{
    title:'One API change.\nMany downstream owners.',tag:'SYSTEMS / DEPENDENCIES',intro:'A platform team plans a response-format change. A large customer wants it quickly, but existing integrations have different migration constraints.',question:'How would you frame the rollout and migration commitment?',
    people:[
      person('Platform lead','P','Maintain a manageable shared API.','“All consumers are ready for the new response.”','Which consumers are represented in the readiness report?','The report covers three internal applications. Two external integrations have not confirmed readiness.','Consumer register','Wants the legacy response retired before the team’s maintenance review.'),
      person('Account lead','A','Deliver the large customer’s integration.','“We promised this exact format in the contract.”','What wording is actually contractual?','The contract commits to an integration outcome. The exact format is in a proposal email, not the signed specification.','Commitment record','Wants to announce a visible customer milestone this month.'),
      person('Reliability lead','R','Keep dependent services reliable.','“A canary will remove migration risk.”','Does the canary include the external consumers?','The current canary uses internal clients. It does not exercise external parsers or their retry behavior.','Canary plan','Wants to keep the release inside the existing on-call coverage window.')
    ],
    evidence:[
      evidence('consumers','Consumer register','DEPENDENCIES','Internal readiness leaves external gaps.','Three internal applications confirmed readiness. Two external integrations remain unconfirmed and have separate deployment owners.'),
      evidence('contract','Commitment record','COMMERCIAL','Outcome commitment, negotiable mechanism.','The signed specification describes an integration outcome. The exact response format comes from a proposal email that needs confirmation.'),
      evidence('canary','Canary plan','RELIABILITY','A canary only observes its participants.','The current plan covers internal clients. A versioned path is feasible but adds temporary dual-format maintenance; rollback responsibility is not yet agreed.')
    ],
    choices:[
      choice('Offer a versioned migration','Keep the old response while consumers move.','Who owns the retirement criteria and the temporary maintenance cost?','The customer can begin on the new path; Platform carries two formats and must negotiate a retirement date with external owners.'),
      choice('Wait for consumer readiness','Confirm migration and rollback ownership first.','Which consumers are critical, and what bounded evidence is sufficient?','The common format change waits; Account must renegotiate the milestone while the team contacts external deployment owners.'),
      choice('Narrow the customer commitment','Deliver the integration outcome through a smaller change.','What proves the alternative meets the signed need without creating hidden debt?','The original format rollout is deferred; Account takes an alternative proposal to the customer and Engineering spends capacity evaluating its support cost.')
    ],
    update:'An external partner sends a trace showing that its parser rejects unknown response fields. This behavior was absent from the internal canary population.',
    lesson:'Map consumers, ownership and compatibility assumptions before treating a shared change as a single-team release. Monitoring cannot reveal a consumer it never exercises.',
    prompts:{Associate:'What is the difference between an API provider, a consumer and a migration dependency?',PM:'How would you own compatibility, consumer communication and rollback criteria for this change?',Senior:'How would you balance shared-platform maintenance costs against customer-specific commitments across multiple product teams?'},
    reveal:'Platform wants legacy maintenance removed, Account wants a visible milestone, and Reliability wants a manageable coverage window. Their incentives shape the migration proposals; the records define what is known.'
  },
  validation:{
    title:'A green summary.\nA wider promise.',tag:'VALIDATION / SCOPE PREVIEW',intro:'In this fictional driver-assistance discussion, a test summary covers defined conditions. The announcement suggests a broader scope. This is a scope-reasoning preview, not an expert safety assessment.',question:'What scope and ownership questions would you take to the responsible reviewers?',
    people:[
      person('Programme lead','P','Coordinate a clear release proposal.','“The summary is green, so broad availability is ready.”','What scope does green refer to?','The summary covers only the listed test matrix. It does not establish readiness outside those conditions.','Validation summary','Wants the announced milestone retained for a programme review.'),
      person('Validation lead','V','Keep claims tied to evidence.','“Completing the missing test category would settle the release.”','Who determines whether that evidence is sufficient?','The responsible engineering and safety/release reviewers must assess the whole proposal. One added test category cannot substitute for their review.','Review register','Wants a clear endpoint for the current test campaign before resources move elsewhere.'),
      person('Commercial lead','C','Explain the feature to customers.','“Customers will understand the limits from the announcement.”','Was that wording checked with the responsible reviewers?','The current announcement omits the operating limits in the engineering brief. Review of the wording is still open.','Announcement comparison','Wants to retain a short, attractive headline for tomorrow’s campaign.')
    ],
    evidence:[
      evidence('matrix','Validation summary','ILLUSTRATIVE','The summary has a defined boundary.','This fictional summary covers its listed conditions. A wet-road category is excluded. It is neither certification nor a complete safety case.'),
      evidence('wording','Announcement comparison','SCOPE','The message exceeds the described scope.','The engineering brief lists operating limits. The announcement omits them and has not completed the responsible reviewers’ wording review.'),
      evidence('review','Review register','OWNERSHIP','An evidence package needs qualified review.','Engineering, validation and responsible safety/release specialists must judge the defined proposal and remaining dependencies. No release approval is attached.')
    ],
    choices:[
      choice('Propose narrower wording','Take a bounded claim to the responsible reviewers.','Who can establish that the narrower proposal is supported?','Commercial drafts narrower wording; the campaign remains dependent on qualified review, and the original broad headline is removed from the proposal.'),
      choice('Request a focused evidence review','Ask owners to identify gaps and decision authority.','What questions, owners and next decision point make the request actionable?','The review owners receive a specific scope-and-dependency request; Programme must explain that the campaign date does not determine readiness.'),
      choice('Defer the announcement','Avoid the broad claim while the proposal is unresolved.','What communication and next review point keep deferral accountable?','Tomorrow’s campaign is deferred; Commercial needs an updated communication plan while the underlying evidence and scope questions remain open.')
    ],
    update:'A separately received supplier note changes the stated supported configuration. The responsible reviewers have not yet assessed its effect on the proposal.',
    lesson:'A summary is meaningful within its scope. Product coordination can make limits and ownership explicit, but this exercise cannot determine technical safety or release readiness.',
    prompts:{Associate:'Which claims in the summary concern tested conditions, and which claims go beyond them?',PM:'How would you document the proposal’s limits, dependencies and review owners without inventing assurance?',Senior:'How would you handle organizational launch pressure while preserving qualified decision authority and clear accountability for unresolved scope?'},
    reveal:'Programme protects a milestone, Validation wants a campaign endpoint, and Commercial wants a concise headline. Those pressures help explain overbroad recommendations; none gives this exercise authority to judge safety.'
  }
};

export function makeCase(skillId, context={level:'PM',role:'general'}) {
  if (!Object.hasOwn(templates,skillId)) throw new RangeError(`Unsupported practice topic: ${skillId}`);
  const {prompts,...scenario} = structuredClone(templates[skillId]);
  const level = ['Associate','PM','Senior'].find(value=>value.toLowerCase()===String(context?.level||'PM').toLowerCase()) || 'PM';
  const role = Object.hasOwn(roleLabels,context?.role) ? context.role : 'general';
  const skill = competencies.find(item=>item.id===skillId).label;
  return {...scenario,label:`${skill} · ${roleLabels[role]}`,skill,duration:'Short practice',
    interviewQuestions:[prompts[level],rolePrompt[role](skillFocus[skillId]),'Which supplied evidence would you cite to defend your recommendation, and what remains unknown?'],
    next:'Retry a different approach, or choose another topic to practise a new trade-off.'};
}
