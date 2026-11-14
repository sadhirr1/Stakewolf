// SCRUM-38: scenario-specific guidance from public facts and inspected sources.
const lenses = {
  original: {
    repair:['A bounded focus repair concentrates effort on the save task while expansion is paused.','The original showcase slot is lost and shared component work waits; a prepared repair still needs task verification.','What observed save-task checks would justify expansion, and what finding would make a local repair insufficient?'],
    fallback:['Withdrawing the new screen creates room to inspect the previous route and compare repair options.','The previous route’s accessibility remains unverified; withdrawing the new design alone does not establish a usable alternative.','What task evidence would justify relying on the fallback, and when would you reconsider the new screen?'],
    replace:['Beginning shared component work creates a route to change the underlying interaction component.','Completion needs another cycle, the showcase waits and users still need an interim route.','What evidence would justify the larger scope, and how will users complete the task before it is finished?']
  },
  b: {
    repair:['A local warning and draft-recovery change preserves the fresh-session layout while addressing longer sessions.','Expansion stays paused, longer-session checks remain necessary and shared session ownership is unresolved.','What expiry-and-recovery task evidence would justify expansion, and who would own remaining session failures?'],
    fallback:['Returning to the longer-session route buys room to inspect its recovery behavior.','Users lose the new layout; a longer timeout alone does not establish successful recovery.','What recovery evidence would make the fallback useful, and what would justify returning to the redesigned screen?'],
    replace:['Shared session work can give the redesigned layout a reusable warning and recovery approach.','It will not finish this cycle. Ownership remains open and users need an interim recovery route.','What cross-product need justifies shared work, and who will provide and verify recovery while it remains unfinished?']
  },
  c: {
    repair:['A bounded layout repair keeps one primary screen and targets the enlarged-layout save task.','Expansion stays paused and regressions still need checking; a prepared layout change is not broad task coverage.','What enlarged-layout and regression checks would justify expansion, and what result would favor another route?'],
    fallback:['The previous route offers a way to restore access within its recorded browser and task-check scope.','The new layout is withdrawn; useful evidence for one task and browser does not establish wider compatibility.','What conditions fall outside the recorded checks, and what evidence would justify widening use or returning to the new layout?'],
    replace:['Shared responsive-layout work begins a reusable approach for the affected interaction.','Completion needs another cycle and displaces component maintenance; interim access is still necessary.','What shared need justifies displacing maintenance, and how will you verify interim access until completion?']
  }
};

const evidenceMeaning = {
  original: {
    audit:'The scan found no flagged contrast issues, but has no completed keyboard or assistive-technology task check. A clean scan does not establish that people can save.',
    focus:'The walkthrough establishes a keyboard focus trap before Save. It does not establish that a full rewrite is necessary; compare a bounded repair with replacement.',
    queue:'There is no accessibility category, and the two save failures have unknown causes and input methods. Neither zero barriers nor a confirmed cause follows from these tags.'
  },
  b: {
    audit:'There is positive evidence for a fresh-session keyboard save. It does not cover longer sessions, expiry or recovery, so preserve that distinction when deciding what to keep.',
    focus:'The timed walkthrough loses entered values at expiry. A warning and draft recovery are bounded repair candidates; the longer-timeout fallback still lacks checked recovery.',
    queue:'Five repeat contacts describe disappearing edits and two customers use keyboards. The tag already exists; dismissing these contacts as training questions is unsupported.'
  },
  c: {
    audit:'The previous route passed the recorded keyboard and 400% zoom save task in one browser; the new screen clips Save at that zoom. This supports a bounded fallback, not universal accessibility.',
    focus:'The enlarged new layout clips Save outside reachable scrolling. A bounded repair is feasible for a trial; no cross-screen regression is demonstrated and replacement also needs task checks.',
    queue:'Eight tagged contacts reproduce the enlarged-layout problem; six know the previous route. Confusion for every customer is unsupported, while a clear routing guide is still needed.'
  }
};
const unknownChecks = {
  audit:'The scope of the recorded checks remains uninspected. Ask which tasks, input methods and conditions were checked before generalizing a pass.',
  focus:'The walkthrough remains uninspected. Ask where the task fails and what repair evidence would justify a local change or larger replacement.',
  queue:'The support sample remains uninspected. Check how reports were collected and classified before interpreting their count or cause.'
};

export function accessibilityDecisionLens(view) {
  if (view.topic !== 'accessibility') return null;
  const selected = view.proposals.find(p=>p.selected);
  if (!selected) return null;
  const id = view.variantId ?? 'original';
  const [protects,cost,reconsider] = lenses[id][selected.id];
  return {protects,cost,reconsider,evidence:view.records.map(r=>({
    recordId:r.id,title:r.title,opened:r.opened,
    detail:r.opened ? evidenceMeaning[id][r.id] : unknownChecks[r.id]
  }))};
}
