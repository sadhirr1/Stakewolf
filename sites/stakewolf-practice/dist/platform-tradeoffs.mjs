// SCRUM-38: public decision guidance and exact replay comparisons, never a score.
import {councilOpportunityCosts} from './council-opportunity-costs.mjs';

const lenses = {
  original: {
    versioned:['A customer pilot can move while existing consumers keep their current route.','Two formats need ongoing maintenance; a pilot alone does not complete migration.','What consumer-owned evidence and operating coverage would let you retire the old route?'],
    readiness:['Existing integrations keep a stable route while you establish migration readiness.','The customer milestone slips, and waiting alone does not resolve a compatibility gap.','What specific readiness evidence would end the wait, and what can you offer the customer meanwhile?'],
    narrow:['A smaller adapter may deliver the integration outcome with a smaller shared-platform change.','Acceptance and ongoing adapter support remain open; legacy maintenance continues.','What customer acceptance and support owner would justify committing to this adapter?']
  },
  b: {
    versioned:['Isolated pilot callbacks let the customer explore the new path without changing live processing.','Two callback paths need operating coverage; an isolated demonstration does not prove safe retries.','What retry evidence and operating owner would let you connect the pilot to live callbacks?'],
    readiness:['The common path stays stable while external retry responsibilities are agreed.','The demonstration slips, and agreeing ownership alone does not test retry behavior.','What observed retry behavior would end the wait, and what limited demonstration is still useful?'],
    narrow:['An adapter could bound the callback outcome without immediately replacing the common path.','Customer acceptance, retry behavior and permanent adapter ownership remain unresolved.','What retry check, customer agreement and permanent owner would justify taking on this adapter?']
  },
  c: {
    versioned:['An isolated acceptance pilot advances the requested response version while retaining the old route.','Both routes need support; the pilot does not establish decimal accuracy.','What numeric evidence and recovery plan would justify moving beyond the acceptance pilot?'],
    readiness:['The common change waits while you establish the partners’ numeric requirements.','The acceptance date must move; waiting and collecting requirements do not prove accurate values.','What decimal checks would end the wait, and who must agree the revised acceptance date?'],
    narrow:['An adapter proposal tests whether a smaller scope could serve the customer.','It opens a scope negotiation and retains legacy work; the proposal is not an accepted replacement.','What written scope agreement and numeric checks would make this alternative defensible?']
  }
};

// These interpretations are shown ONLY after the corresponding record was opened.
const evidenceMeaning = {
  original: {
    consumers:'Three internal confirmations cannot stand in for the two independent external owners. Distinguish a pilot’s boundary from permission to migrate everyone.',
    contract:'The signed obligation is an integration outcome; the format is in a proposal email. There is room to negotiate a route, but no evidence the customer has accepted an alternative.',
    canary:'Internal-only canary coverage leaves external parsers and retries unknown. Rollback ownership and compatibility testing address different risks.'
  },
  b: {
    consumers:'Both partners can parse the response, but one has not demonstrated safe retries. Format readiness and end-to-end readiness need different evidence.',
    contract:'The signed milestone is a callback outcome by a date. An adapter is a possible route, conditional on customer acceptance of its operating limits.',
    canary:'The external canary sent each callback only once. Its success provides no retry coverage; a rollback drill alone would not establish safe redelivery.'
  },
  c: {
    consumers:'Both partners signed off parsing using whole-number fixtures. That supports schema compatibility, not decimal correctness or immediate retirement.',
    contract:'This signed specification names the response version. An adapter needs a written amendment; a delay needs a revised date. Neither agreement has been established by your proposal.',
    canary:'Whole-number external samples found no schema rejection, but do not establish decimal accuracy. Numeric recovery and rollback ownership still need rehearsal.'
  }
};
const unknownChecks = {
  consumers:'Readiness scope remains uninspected. Ask which consumers and behaviors a sign-off actually covers; avoid assuming universal readiness.',
  contract:'The commitment record remains uninspected. Verify what was agreed before claiming that your route satisfies the customer obligation.',
  canary:'Test coverage remains uninspected. Ask what the canary exercises and what a rollback can recover; do not generalize from the public claim.'
};

export function platformDecisionLens(view) {
  if (view.topic !== 'systems') return null;
  const selected = view.proposals.find(p=>p.selected);
  if (!selected) return null;
  const id = view.variantId ?? 'original';
  const [protects,cost,reconsider] = lenses[id][selected.id];
  return {protects,cost,reconsider,evidence:view.records.map(r=>({
    recordId:r.id,title:r.title,opened:r.opened,
    detail:r.opened ? evidenceMeaning[id][r.id] : unknownChecks[r.id]
  }))};
}

export function platformOpportunityCosts(state) { return state.topic==='systems' ? councilOpportunityCosts(state) : null; }
