# Local answer coaching — SCRUM-37

The debrief now connects a learner's actual activity and written answers to evidence, public stakeholder views and interview preparation prompts. It works for the three general rounds and six JD responsibility modules. No API calls, new packages, model training, browser storage or numerical proficiency score are added.

## What is checked

- Snapshot direct record openings before the first decision, then retain subsequent openings separately. Opening records is not proof of reading, understanding or using them. A contacted stakeholder may supply some related information without the learner opening the source.
- Show the supplied record details and coaching questions. Exact record and stakeholder names found in first/final text are shown with verbatim excerpts. Matching a name never earns reasoning credit; paraphrases and abbreviations may be missed.
- Compare public claims and aims, including the replies actually received. Unasked replies are not included in the coaching. The two-question limit is a deliberate information trade-off, not an automatic error.
- Highlight conservative wording patterns for contrast/cost, verification, uncertainty and responding to an update. These are writing signals only: neither a detected nor undetected pattern establishes reasoning quality. Common negations are skipped. Logical consistency, factual accuracy, persuasion and nuanced paraphrases are not reliably evaluated.
- Offer case-linked next steps, a prompt for the selected recommendation and an interview-answer structure. There is no preferred-option score. Only the final answer is prompted to address the later update; private motives are never used to penalize the initial answer.
- Allow a separate final-answer rehearsal. Rechecking it shows new wording matches without changing the original answers, decisions, evidence history or activity. Blank answers receive no invented assessment. All state clears on refresh.

## Fairness and scope

This is transparent local coaching, not validated grading, semantic AI assessment or a hiring prediction. Learners can reject a suggestion that misreads their wording; there is no stored score to correct. Record access and name matching are useful review aids, not substitutes for a human discussion of the argument. ADAS examples still need qualified domain review before assessment use.

## Ownership

Coordinator: UI/state integration, styling, documentation and browser verification. `answer_feedback`: pure feedback module and engine tests. `answer_qa`: independent review and retained real-handler VM checks; coordinator separately reviews those test changes. Actual verification and resolved findings are recorded in REVIEW.md and Jira. Source lives in the existing SCRUM-37 pull request; the preview retains owner-only access.
