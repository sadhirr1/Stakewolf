# JD-driven local practice — SCRUM-37

The owner accepted the homepage and requested actual JD adaptation with role-specific questions and conflicting stakeholder views. This increment preserves the visual design and browser-local privacy model.

## How adaptation works

- `analyzeJD` recognises specific responsibility phrases, keeps supporting clauses, and ranks six supported skill modules. Unsupported input leaves the selection empty rather than silently assuming UI or ADAS.
- The user confirms role context and can add/remove responsibilities. Suggested questions and practice rounds follow these selections. Senior/PM/Associate change question framing; there is no calibrated difficulty or hiring score.
- Each responsibility has its own three-stakeholder exercise, source records, questions and private incentives. Role context frames the interview questions; it does not turn every module into a domain-specific simulation.
- The learner can question two of three stakeholders, inspect records, commit to an approach, see that approach's authored consequence plus new evidence, and revise or hold the recommendation.
- Debrief reveals each stakeholder's private incentive. Confident claims are not proof of deception, and no character is automatically labelled a liar. Written notes receive transparent local coaching, with no grade; see FEEDBACK.md. Private incentives do not become hindsight criteria for the first answer.

This is deterministic selection/composition from authored modules, not semantic AI interpretation or employer-question prediction. It cannot understand every JD, ambiguous negation or every specialty. Correcting the matches is part of the flow. The same confirmed inputs reproduce the same exercise; there are no randomly generated agendas.

## Privacy and cost

The JD and answer text stay in tab memory and clear on refresh. No inference API, training, external information feed, account persistence or analytics is added. All private scenario motives are shipped to the browser, so they are hidden from normal play but not protected against source inspection. ADAS/technical examples are practice material requiring subject-matter review before use for assessment.

## Review gate

Authoring is split between coordinator (interface/integration) and jd_engine specialist (content/matcher/tests). Independent review is by practice_flow_qa. Actual results are recorded in REVIEW.md and Jira. Neither a successful deployment nor passing functional tests establishes educational validity.
