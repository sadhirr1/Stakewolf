// SCRUM-38 authored situation packs. IDs and costs come from the original cases;
// every changed fact is carried through promises, work and consequences below.
const rows = (base, authored, fields) => base.map((row,i)=>({...row,...Object.fromEntries(fields.map((key,j)=>[key,authored[i][j]]))}));
function pack(base, data) {
  return {...base,title:data.title,intro:data.intro,
    stakeholders:rows(base.stakeholders,data.people,['claim','objective']),
    records:rows(base.records,data.records,['title','text']),
    proposals:base.proposals.map((p,i)=>{
      const [title,detail,workTitle,workDetail,summary]=data.proposals[i];
      return {...p,title,detail,work:{...p.work,title:workTitle,detail:workDetail},summary};
    }),
    commitments:rows(base.commitments,data.commitments,['title','detail','outcome']),
    update:data.update,
    responses:Object.fromEntries(Object.entries(base.responses).map(([id,list])=>[id,rows(list,data.responses[id],['title','detail','consequence','outcome'])]))
  };
}

export function buildCouncilVariants(cases) {
  return {
    accessibility:{
      original:cases.accessibility,
      b:pack(cases.accessibility,{
        title:'A completed form. A session that expires.',
        intro:'The redesigned settings screen has passed a fresh-session keyboard walkthrough. People taking longer to complete it report lost edits. Negotiate a route, inspect at most two records and reserve next-round work. Support reflects interests, not a score.',
        people:[
          ['The task check passed, so the new layout is ready for everyone.','Establish the redesigned layout as the shared pattern before another team chooses a different one.'],
          ['Those repeat tickets are training questions, not access failures.','Reduce repeated contacts from customers whose edits disappear at session expiry.'],
          ['The previous route is the only safe way to avoid a shared session rewrite.','Keep cross-product session management out of the screen team’s ongoing ownership.']
        ],
        records:[
          ['Task-check scope','A fresh-session keyboard check reached Save successfully. It did not test longer completion times, session expiry or recovery of entered values. The layout has some direct task evidence; timeout accessibility remains unknown.'],
          ['Timed keyboard walkthrough','Focus reaches Save, but at ten minutes the session expires and entered values are lost. A warning plus temporary draft recovery is a bounded repair candidate; a shared session rewrite has not been shown necessary. The previous route has a longer timeout, but its recovery has not been checked.'],
          ['Repeat-contact sample','Five repeat contacts describe edits disappearing after long sessions. Two customers use keyboard navigation. The temporary access tag already exists; there is no evidence these contacts are merely training questions.']
        ],
        proposals:[
          ['Repair session warning and recovery','Reserve 2 units for a local timeout warning and draft recovery while expansion is paused. The fresh-session layout remains; shared session ownership is unresolved.','Local session repair','Prepare the local warning and draft-recovery change; longer-session task checks remain separate.','A local timeout warning and draft recovery are prepared. Expansion stays paused and shared session ownership remains unresolved.'],
          ['Return to the previous screen','Reserve 2 units to restore the longer-session route and inspect its recovery. Users lose the new layout; fallback recovery is still unverified.','Restore and inspect the previous route','Restore the older screen and inspect its longer-session behavior without claiming verified recovery.','The older screen is restored with a longer timeout. Recovery remains unverified and two sets of guidance need coordination.'],
          ['Start shared session replacement','Reserve 2 units to begin shared session handling. The redesigned layout can later reuse it, but completion needs another cycle.','Begin shared session work','Begin shared warning and recovery behavior; the cross-product ownership decision remains open.','Shared session work begins without completing this cycle. The redesigned layout waits and users still need an interim recovery route.']
        ],
        commitments:[
          ['Give Design a limited showcase','Reserve 1 unit to demonstrate the checked fresh-session path and disclose the unresolved longer-session behavior.','A limited fresh-session demonstration is prepared with the timeout and recovery limits stated.'],
          ['Fund timeout and recovery checks','Reserve 2 units for keyboard and assistive-technology checks across session expiry; record unresolved failures.','Independent timeout and recovery checks are run. Remaining failures are recorded; fresh-session success is not generalized.'],
          ['Give Support a repeat-contact plan','Reserve 1 unit to follow up the five repeat contacts and publish a safe recovery script using the existing access tag.','Support follows up the five repeat contacts and publishes a recovery script with unresolved limits.']
        ],
        update:'A longer-session assistive-technology check finds that the expiry warning is not announced. The original fresh-session check never exercised it. Recovery work alone does not make the warning perceivable.',
        responses:{
          repair:[
            ['Repair and check the expiry announcement','Make the timeout warning perceivable and check the recovery sequence.','The timeout warning remains unannounced for assistive-technology users; expansion stays paused.','The expiry warning is announced and the recovery sequence is checked; broader session coverage remains open.'],
            ['Provide a checked assisted recovery route','Verify and explain a temporary recovery route for customers who still lose edits.','Customers with lost edits have no checked assisted recovery route.','A temporary assisted recovery route is checked and communicated; shared session ownership remains open.']
          ],
          fallback:[
            ['Verify and explain fallback recovery','Check expiry and recovery on the older route and update both sets of guidance.','Fallback recovery remains unverified and conflicting guidance continues.','The older route receives expiry and recovery checks, with one route-back explanation and failures tracked.'],
            ['Prepare the new warning announcement','Repair and check the redesigned screen’s unannounced timeout warning before its return.','The redesigned screen retains an unannounced expiry warning and is not ready to return.','The redesigned screen’s expiry warning is repaired and checked; its return still needs wider recovery review.']
          ],
          replace:[
            ['Provide an interim recovery route','Check a temporary recovery path while shared session work continues.','Users have no checked interim recovery route during shared session replacement.','An interim recovery route is checked and communicated while shared session replacement continues.'],
            ['Add checked warnings to shared session work','Add announcement and recovery regression checks to the unfinished shared behavior.','Shared session work still lacks demonstrated announcement coverage.','The shared session work gains checked warning announcements; completion and ownership still need another cycle.']
          ]
        }
      }),
      c:pack(cases.accessibility,{
        title:'A visible Save button. Until the page is enlarged.',
        intro:'The new settings screen works in its recorded keyboard test, but enlarged layouts tell a different story. A previous route has narrower, useful task evidence. Inspect two records, negotiate promises and decide where scarce capacity should go.',
        people:[
          ['Keyboard testing passed, so enlarging the screen should work too.','Keep responsibility for the enlarged-layout fix within Design rather than transfer it to a component program.'],
          ['Returning to the old screen would confuse every customer.','Keep one support guide in use during the next training cycle.'],
          ['Every local breakpoint fix will break another screen.','Avoid committing the component team to another migration before the current maintenance cycle closes.']
        ],
        records:[
          ['Comparison task checks','The new screen passed keyboard checks at standard size. At 400% zoom Save is clipped. The previous route passed the same keyboard and 400% zoom save task in the recorded browser; neither result establishes universal accessibility.'],
          ['Enlarged-layout walkthrough','Focus reaches Save, but the enlarged new layout clips it outside the reachable scroll area. A bounded layout repair is feasible for a trial; no cross-screen regression has yet been demonstrated. A shared replacement would still need full task checks.'],
          ['Support routing sample','Eight tagged contacts reproduce the enlarged-layout save problem. Six already know the previous route. Confusion for every customer is unsupported; route changes still need a single clear guide.']
        ],
        proposals:[
          ['Repair the enlarged layout','Reserve 2 units for a local layout repair while expansion is paused. Keep one primary screen; regressions still need checking.','Local enlarged-layout repair','Prepare a bounded layout repair so Save can remain visible at the tested zoom level.','The local enlarged-layout repair is prepared. One primary screen remains, with regression checking still required.'],
          ['Use the checked previous route','Reserve 2 units to restore routing to the previous screen within its tested browser and task scope. Withdraw the new layout for now.','Restore the checked previous route','Restore routing and state the limits of the previous route’s recorded keyboard and zoom checks.','The previous route is restored within its recorded task-check scope. The new layout is withdrawn; wider compatibility remains unverified.'],
          ['Start shared layout replacement','Reserve 2 units to begin shared responsive-layout work. Completion needs another cycle and competes with component maintenance.','Begin shared layout work','Start shared layout replacement while retaining an interim route; completion remains beyond this cycle.','Shared layout replacement begins and component maintenance is displaced. Completion needs another cycle; interim access remains necessary.']
        ],
        commitments:[
          ['Give Design a revised showcase','Reserve 1 unit for a limited enlargement demonstration and revised review date; state its tested scope.','Design receives a limited enlargement demonstration and review date with tested scope stated.'],
          ['Fund zoom and keyboard regression checks','Reserve 2 units to check keyboard tasks and enlarged layouts across the selected route’s supported states.','Keyboard and enlarged-layout regression checks are performed; failures and untested combinations remain explicit.'],
          ['Give Support one routing guide','Reserve 1 unit to follow up the eight contacts and consolidate route instructions into a single guide.','Support follows up the eight contacts and publishes a single routing guide with scope limits.']
        ],
        update:'A translated-label check now shows that longer error text covers the recovery action on the new layout. This is separate from the clipped Save control; the previous route has not been checked in this language.',
        responses:{
          repair:[
            ['Repair and check long error text','Reflow longer error text and check that its recovery action stays reachable.','Long error text still covers recovery on the new layout; translated rollout stays paused.','Long error text is reflowed and recovery is checked in the reported language; other languages remain outside this evidence.'],
            ['Provide a checked translated interim route','Check an interim save-and-recovery route in the reported language and explain it.','Users in the reported language lack a checked interim recovery route.','An interim save-and-recovery route is checked and communicated in the reported language.']
          ],
          fallback:[
            ['Check the fallback in the reported language','Extend the previous route’s evidence to translated error recovery and communicate its scope.','The fallback retains its recorded keyboard and zoom evidence, but translated recovery remains unverified.','The previous route gains checks for translated error recovery in the reported language; broader language coverage remains open.'],
            ['Prepare the new layout’s text repair','Repair the long-error overlap before reconsidering the new layout.','The new layout still has the long-error overlap and cannot return for translated use on current evidence.','The new layout’s long-error overlap is repaired and checked; its return still requires wider layout regression review.']
          ],
          replace:[
            ['Check a translated interim route','Check recovery in the reported language while shared layout work continues.','Translated recovery has no checked interim route during replacement.','An interim route gains translated recovery checks while shared layout work continues.'],
            ['Add long-label regression coverage','Check longer error text and reachable recovery in the shared layout in progress.','The shared replacement lacks demonstrated long-label recovery coverage.','The shared layout gains long-label recovery checks; it still needs another cycle to complete.']
          ]
        }
      })
    },
    systems:{
      original:cases.systems,
      b:pack(cases.systems,{
        title:'A parsed response. A duplicated callback.',
        intro:'External partners can parse the proposed response, but retry behavior may repeat work. A customer demonstration is approaching. Inspect at most two records, negotiate a route and preserve capacity for the next finding.',
        people:[
          ['Both partners parse the new fields, so migration is ready.','Avoid permanent ownership of a bespoke customer adapter.'],
          ['The signed deadline requires this exact response shape.','Demonstrate a complete customer callback without a manual cleanup step.'],
          ['The external staging canary means retries are covered.','Prevent duplicate callbacks from becoming a recurring on-call reconciliation job.']
        ],
        records:[
          ['Partner readiness register','Both external owners confirmed that they parse the new response fields. One has not demonstrated safe callback retry behavior; format readiness does not establish end-to-end readiness.'],
          ['Signed delivery scope','The signed milestone requires a callback outcome by the agreed date, not this response shape. An adapter could meet that outcome, but the customer must accept its operational limits.'],
          ['External staging canary','The canary includes both external parsers but sends each callback only once. It has no retry or duplicate-delivery test. A separate version can isolate pilot callbacks; rollback ownership remains unassigned.']
        ],
        proposals:[
          ['Offer an isolated versioned pilot','Reserve 2 units for a new response version with isolated pilot callbacks. Retain the old route and two sets of operating work.','Open an isolated callback pilot','Prepare the versioned pilot with callbacks isolated from live customer processing.','An isolated versioned pilot is prepared. Live consumers retain the old route and Platform carries two operating paths.'],
          ['Wait for callback readiness','Reserve 2 units to agree retry responsibilities with the external owners. The common change waits and the demonstration slips.','Confirm callback retry ownership','Agree external retry responsibilities before allowing the common response change.','The common change waits for callback retry readiness. The old route remains and the customer demonstration slips.'],
          ['Evaluate a callback adapter','Reserve 2 units for a smaller adapter proposal with duplicate-delivery handling. Acceptance and permanent support ownership remain open.','Evaluate the callback adapter','Prepare an adapter proposal for the callback outcome; demonstrate neither acceptance nor safe retries yet.','A callback adapter proposal is prepared. Its retry behavior, customer acceptance and permanent support ownership remain open.']
        ],
        commitments:[
          ['Agree retirement and handoff criteria','Reserve 1 unit to name owners and exit criteria for parallel routes or an adapter; no route is retired automatically.','Owners and exit criteria are published for the selected path; no route retires without its criteria being met.'],
          ['Fund rollback ownership and a drill','Reserve 2 units for rollback ownership and a drill; duplicate callback recovery remains separate.','An owner rehearses rollback. The drill does not establish safe retries or undo duplicated external work.'],
          ['Renegotiate the callback milestone','Reserve 1 unit to discuss the callback outcome, demonstration limits and unresolved acceptance with the customer.','The callback milestone and demonstration limits are discussed; customer acceptance is not presumed.']
        ],
        update:'A retry trace now shows the partner executing the same callback twice because redelivery loses the deduplication token. Parsing the new fields was successful; the failure is duplicate execution.',
        responses:{
          versioned:[
            ['Build and check a retry fixture','Exercise redelivery and deduplication before connecting this partner’s pilot callbacks to live processing.','The partner’s pilot callbacks must remain isolated; safe redelivery is still unverified.','A retry fixture checks deduplication for this partner; other retry patterns still need evidence.'],
            ['Staff both callback paths','Assign operating ownership for the old route and isolated pilot next cycle.','Two callback paths lack dedicated operating coverage next cycle.','Both callback paths receive explicit operating coverage; migration readiness remains conditional.']
          ],
          readiness:[
            ['Resolve and check callback deduplication','Work with the partner to retain deduplication identity across redelivery.','Duplicate callback execution remains a readiness blocker and the common change stays on hold.','The reported duplicate-delivery path is checked; other retry patterns still need readiness evidence.'],
            ['Prepare an isolated customer demonstration','Prepare a demonstration that cannot execute live customer callbacks and state its acceptance limits.','The customer has no working demonstration during the readiness wait.','An isolated callback demonstration is prepared; it does not establish production retry safety.']
          ],
          narrow:[
            ['Check the adapter’s duplicate handling','Exercise the adapter against the duplicate trace and record customer acceptance questions.','The adapter remains untested against duplicate delivery and customer acceptance remains open.','The adapter is checked against the duplicate trace; customer acceptance and broader retry coverage remain open.'],
            ['Assign legacy operations and retry coverage','Assign legacy ownership and capture duplicate callbacks in regression checks.','Legacy operations have no dedicated new owner and the duplicate trace remains outside regression checks.','Legacy operations gain an owner and a duplicate-delivery regression fixture; permanent adapter ownership stays unresolved.']
          ]
        }
      }),
      c:pack(cases.systems,{
        title:'An agreed format. An unchecked decimal value.',
        intro:'The customer signed for a particular response version and both external partners report parsing it. Numeric behavior has narrower evidence. Inspect two records, negotiate the migration path and leave room to respond to what a partner actually observes.',
        people:[
          ['Both partners signed off parsing, so the old route can close now.','Avoid operating two response versions through the next maintenance cycle.'],
          ['A smaller adapter is interchangeable with the signed deliverable.','Keep the promised response version in the customer’s acceptance review without reopening scope.'],
          ['The external canary passed, so it proves amount accuracy.','Keep silently changed numeric values out of the customer’s reconciliation workflow.']
        ],
        records:[
          ['Partner sign-off register','Both external partners signed off response parsing. Their fixtures contain whole-number amounts only. Decimal precision is not confirmed, so parsing sign-off alone does not authorize closing the old route.'],
          ['Signed version requirement','The signed specification explicitly names the new response version. A smaller adapter requires a written amendment; the customer has not accepted that amendment. A delay also needs a revised acceptance date.'],
          ['External canary samples','The canary exercises both external parsers with whole-number amounts and no decimal values. It found no schema rejection. Rollback is feasible, but ownership and numeric recovery steps have not been rehearsed.']
        ],
        proposals:[
          ['Offer a versioned acceptance pilot','Reserve 2 units for the contracted version in an isolated acceptance pilot. Keep the old route; decimal behavior is not yet verified.','Open the contracted-version pilot','Prepare an isolated acceptance pilot of the signed response version while retaining the old route.','The contracted version has an isolated acceptance pilot. Decimal behavior remains unverified and Platform maintains both routes.'],
          ['Wait for numeric readiness','Reserve 2 units to confirm decimal handling with both partners before the common change. The signed acceptance date must move.','Confirm numeric migration needs','Obtain decimal-handling requirements before the common route changes.','The common change waits for decimal-handling evidence. The old route remains and a revised customer acceptance date is needed.'],
          ['Propose an amended adapter scope','Reserve 2 units to evaluate a smaller adapter and draft a scope amendment. It cannot satisfy the signed version requirement without customer agreement.','Evaluate an adapter scope amendment','Prepare an adapter and amendment proposal with support cost and numerical behavior still open.','An adapter and scope amendment are proposed. Neither customer acceptance nor the signed version obligation is satisfied; legacy maintenance continues.']
        ],
        commitments:[
          ['Agree evidence-based retirement criteria','Reserve 1 unit to require partner numeric checks and named sign-off before retiring the old route.','Retirement criteria require numeric checks and partner sign-off; the old route has not been retired.'],
          ['Fund rollback and recovery ownership','Reserve 2 units to assign an owner and rehearse rollback plus recovery responsibilities; numeric correctness requires separate checks.','An owner rehearses rollback and recovery responsibilities; decimal correctness is not thereby established.'],
          ['Renegotiate acceptance with the customer','Reserve 1 unit to discuss the signed version, any amendment or revised date, and record open acceptance.','The signed version and any proposed amendment or revised date are discussed; no customer agreement is invented.']
        ],
        update:'A partner sandbox trace now shows decimal amounts silently rounded to whole values. The schema parses successfully. The immediate concern is preserving numeric meaning, not an unknown-field rejection.',
        responses:{
          versioned:[
            ['Build and check a decimal-value fixture','Check the reported rounding path before the partner’s pilot processes live amounts.','The partner’s pilot must stay isolated from live amounts because decimal accuracy remains unverified.','A decimal-value fixture checks the reported rounding path; broader numeric coverage and customer acceptance remain open.'],
            ['Staff both versions through acceptance','Assign explicit maintenance for both response versions during the unresolved acceptance period.','Both response versions lack dedicated maintenance coverage through acceptance.','Both response versions receive maintenance coverage for the acceptance period; retirement remains conditional.']
          ],
          readiness:[
            ['Resolve and verify decimal handling','Work with the partner to preserve decimal meaning and check the reported values.','Silent rounding remains a readiness blocker; the common change stays on hold.','The reported decimal path is checked; the second partner and broader numeric inputs still need evidence.'],
            ['Prepare a bounded acceptance pilot','Prepare an isolated pilot of the contracted version with numeric acceptance questions explicit.','The customer has no working acceptance pilot while the common route waits.','An isolated contracted-version pilot is prepared; it cannot authorize live numeric processing or the common change.']
          ],
          narrow:[
            ['Check adapter values and amendment questions','Test the adapter’s numeric behavior and record the customer’s unresolved scope-amendment questions.','Adapter numeric behavior remains untested and the scope amendment remains unaccepted.','Adapter numeric behavior is checked against the reported values; the customer’s scope amendment is still unaccepted.'],
            ['Assign legacy support and decimal regression','Assign legacy maintenance and capture the rounding trace in regression checks.','Legacy maintenance has no dedicated new coverage and decimal rounding remains outside regression checks.','Legacy support gains an owner and decimal regression coverage; the signed version obligation remains unresolved.']
          ]
        }
      })
    }
  };
}

// Each variant has a distinct bargaining structure, authored with its evidence.
// Public conditions state what to negotiate; the private objective stays in data.
export function variantStanding(s,id) {
  const has = key=>s.commitmentIds.includes(key), read = key=>s.opened.includes(key), p=s.proposalId;
  const result = (yes,opposed,met,needed)=>({support:yes?'supports':opposed?'opposes':'conditional',condition:yes?met:needed});
  if (s.topic==='accessibility' && s.variantId==='b') {
    if (id==='design') return result(p==='replace' ? has('verification')&&read('audit') : has('showcase')&&read(p==='repair'?'audit':'focus'),p==='fallback','The evidence scope and funded review make this route workable for Design.','For shared replacement, open the task-check scope and fund recovery checks. For local repair, open that scope and promise a limited showcase; for the fallback, open the timed walkthrough and promise the showcase.');
    if (id==='support') return result(has('triage')&&(p==='repair'||read('queue')),p==='replace','The repeat-contact plan gives Support a bounded recovery response.','Promise the repeat-contact plan. For a fallback or replacement, also inspect the repeat-contact sample before changing our guidance.');
    return result(p==='fallback' ? read('focus') : read('focus')&&has('verification')&&(p!=='replace'||has('triage')),p==='replace','The timed walkthrough and the agreed scope give Engineering a workable boundary.','For the fallback, inspect the timed walkthrough. For local repair, also fund recovery checks; shared replacement additionally needs the repeat-contact plan.');
  }
  if (s.topic==='accessibility' && s.variantId==='c') {
    if (id==='design') return result(p==='replace' ? has('showcase')&&read('audit') : has('verification')&&read(p==='repair'?'focus':'audit'),p==='replace','The funded checks and stated demonstration scope make the design trade-off defensible.','For local repair, inspect the enlarged-layout walkthrough and fund regression checks. For the fallback, inspect comparison checks and fund regression checks; for replacement, inspect comparison checks and promise a revised showcase.');
    if (id==='support') return result(has('triage')&&(p==='repair'||(p==='fallback'?has('verification'):read('queue'))),p==='fallback','One routing guide with the agreed check scope gives Support a manageable handoff.','Promise one routing guide. A fallback also needs funded regression checks; replacement needs the support routing sample opened.');
    return result(p==='fallback' ? read('audit') : p==='repair' ? has('showcase')&&read('focus') : has('verification')&&read('audit'),p==='replace','The recorded scope and bounded delivery plan give Engineering a route it can back.','For the fallback, open comparison checks. For local repair, inspect the enlarged-layout walkthrough and promise a revised showcase; replacement needs comparison checks and funded regression checks.');
  }
  if (s.topic==='systems' && s.variantId==='b') {
    if (id==='platform') return result(has('retirement')&&read(p==='narrow'?'contract':'canary'),p==='narrow','The operating handoff and exit criteria make this path supportable.','Promise retirement and handoff criteria. For an adapter, open signed delivery scope; for either broader route, inspect the staging canary.');
    if (id==='account') return result(has('customer')&&read(p==='narrow'?'contract':'consumers'),p==='readiness','The customer discussion and the relevant readiness evidence give me a defensible callback milestone.','Promise a callback milestone discussion. For an adapter, inspect signed delivery scope; for either broader path, inspect partner readiness.');
    return result(has('rollback')&&(p==='readiness'||read(p==='versioned'?'consumers':'canary')),p==='versioned','The rollback owner and explicit retry boundary make this operating plan supportable.','Promise rollback ownership and a drill. A versioned pilot also needs partner readiness opened; an adapter needs the staging canary opened.');
  }
  if (id==='platform') return result(has('retirement')&&(p==='readiness'||(p==='narrow'&&read('contract'))),p==='versioned','The evidence-based exit criteria give the old route an accountable next decision.','Promise evidence-based retirement criteria. I back the readiness wait on that basis, or an adapter after the signed version requirement is opened; a parallel-version pilot still leaves my operating concern unresolved.');
  if (id==='account') return result(has('customer')&&read('contract')&&(p!=='narrow'||has('rollback')),p==='narrow','The customer discussion acknowledges the signed version and the chosen path’s remaining obligations.','Open the signed version requirement and promise an acceptance discussion. An adapter also needs funded rollback and recovery ownership before I back taking its amendment forward.');
  return result(has('rollback')&&read(p==='narrow'?'canary':'consumers'),p==='versioned','The funded recovery owner and explicit numeric evidence boundary make this plan supportable.','Fund rollback and recovery ownership. For an adapter, inspect canary samples; for either broader route, inspect partner sign-off before relying on its numeric coverage.');
}
