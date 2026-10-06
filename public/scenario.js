export const PEOPLE = [
  {
    "id": "mara",
    "name": "Mara Voss",
    "short": "Mara",
    "role": "Growth lead",
    "initials": "MV",
    "color": "orange",
    "motto": "Momentum matters.",
    "agenda": "Mara tied her promotion case to this launch date. She genuinely believes momentum protects the team, but has presented tentative commitments as promises.",
    "tell": "Watch how often she calls a target a commitment."
  },
  {
    "id": "ishan",
    "name": "Ishan Chen",
    "short": "Ishan",
    "role": "Engineering lead",
    "initials": "IC",
    "color": "blue",
    "motto": "Show me the failure.",
    "agenda": "Ishan wants a reliability pause and is quietly building the case for a platform rewrite. The current defect is real; the rewrite is not the only way to contain it.",
    "tell": "Separate his evidence about this defect from his preferred long-term solution."
  },
  {
    "id": "leah",
    "name": "Leah Okafor",
    "short": "Leah",
    "role": "Trust & legal",
    "initials": "LO",
    "color": "pink",
    "motto": "Who carries the risk?",
    "agenda": "Leah wants a named owner for data decisions after being blamed for an earlier incident. She will support a bounded experiment when responsibility and consent are explicit.",
    "tell": "Ask what would make an experiment acceptable, not simply whether she approves."
  },
  {
    "id": "theo",
    "name": "Theo Bell",
    "short": "Theo",
    "role": "Customer advocate",
    "initials": "TB",
    "color": "lime",
    "motto": "Someone has to listen.",
    "agenda": "Theo is protecting Atlas, an influential customer who gave him his first major win. Its needs are real, but he sometimes treats that one account as the whole market.",
    "tell": "Ask how broadly the customer evidence applies."
  }
];
// R1 dossier excerpts. Access is granted by engine rules, not by opening the
// evidence panel: the launch brief and runbook are available at entry; the
// campaign and reliability records are unlocked by their matching interviews.
export const DOSSIER_ARTIFACTS = [
  { id:'KB-01', title:'Launch brief', source:'Product launch brief', time:'Monday 08:30', reliability:'Authored scenario fact', scope:'A Wednesday launch target and the player’s recommendation role. An agreed date does not prove readiness.', access:'start' },
  { id:'KB-02', title:'Campaign register', source:'Growth operations register', time:'Monday 08:40', reliability:'Dated operations record', scope:'600 teams are waitlisted and 20 are onboarded; placements remain cancellable until Monday evening. Interest is not usage or consent.', access:'campaign' },
  { id:'KB-03', title:'Reliability report', source:'Relay beta test report · build relay-beta-17', time:'Friday 16:20', reliability:'Bounded test sample', scope:'Three of 40 reviewed long meetings missed an action owner; tested short meetings passed. This does not establish a population failure rate or safety on untested formats.', access:'failure' },
  { id:'KB-04', title:'Containment runbook', source:'Engineering runbook', time:'Monday 08:10', reliability:'Proposed control, not an execution receipt', scope:'Risky long-meeting output can be held for human review. The gate is not shown as enabled; operation needs a named reviewer and rollback.', access:'start' },
];
export const ROUNDS = [
  {
    "id": "promise",
    "label": "The promise",
    "time": "MONDAY · 09:00",
    "countdown": "48 HOURS TO LAUNCH",
    "title": "The date is public. The product isn’t ready.",
    "description": "You’ve inherited Relay’s first AI meeting-assistant launch. A campaign goes live in two days. Engineering says the summaries sometimes miss commitments, and nobody agrees on how often. Your CEO wants a launch plan before lunch.",
    "speaker": "Mara · Growth",
    "quote": "We have 600 people on the waitlist. If we blink now, we lose the moment.",
    "question": "What will you commit to?",
    "choices": [
      {
        "id": "pilot",
        "title": "Open a small, gated pilot",
        "description": "Invite 20 teams. Keep the date, limit exposure, and define a stop condition.",
        "commitment": "Ishan will operate the controlled pilot and validate its reliability boundary by the launch review.",
        "delta": {
          "delivery": 5,
          "trust": 5,
          "quality": 9
        },
        "relations": {
          "mara": -3,
          "ishan": 5,
          "leah": 3,
          "theo": 3
        },
        "flags": [
          "pilot"
        ],
        "keywords": [
          "pilot",
          "small",
          "limited",
          "gradual",
          "20",
          "experiment",
          "test",
          "staged"
        ],
        "outcome": "Twenty teams get access, with a rollback owner and a published error threshold. You preserve a date, but Mara must rewrite a campaign that promised everyone access.",
        "headline": "A smaller promise, kept.",
        "reactions": {
          "mara": "I can sell early access. I wish you’d told me before the campaign was booked.",
          "ishan": "A rollback and a clear threshold? I can support that.",
          "leah": "Send me the invitation language before it goes out.",
          "theo": "Let’s choose teams that will tell us when we’re wrong."
        },
        "evidenceBonus": {
          "id": "failure",
          "metric": "quality",
          "amount": 5,
          "reason": "You used the documented failure case to make the pilot’s stop condition specific."
        }
      },
      {
        "id": "launch",
        "title": "Hold the public launch",
        "description": "Honor the campaign and put the team on rapid-response duty.",
        "commitment": "Ishan will contain and validate the reliability boundary after broader exposure begins.",
        "delta": {
          "delivery": 18,
          "trust": -5,
          "quality": -14
        },
        "relations": {
          "mara": 8,
          "ishan": -8,
          "leah": -5,
          "theo": -3
        },
        "flags": [
          "publicLaunch"
        ],
        "keywords": [
          "full",
          "public",
          "ship",
          "launch now",
          "all users",
          "600",
          "release"
        ],
        "outcome": "The campaign stays on schedule. The team moves into incident-response mode before anyone has agreed what counts as an incident. More users will now encounter any unresolved defect.",
        "headline": "The date wins the room.",
        "reactions": {
          "mara": "Thank you. This is the conviction the team needed.",
          "ishan": "We can respond quickly. That isn’t the same as preventing harm.",
          "leah": "I’m recording that we still have open data questions.",
          "theo": "I’ll prepare support. We’re going to need it."
        }
      },
      {
        "id": "delay",
        "title": "Move the launch date",
        "description": "Pause the campaign and finish a reliability review before reopening access.",
        "commitment": "Ishan will reproduce the failure and bring evidence from the pause to the launch review.",
        "delta": {
          "delivery": -14,
          "trust": 4,
          "quality": 18
        },
        "relations": {
          "mara": -10,
          "ishan": 8,
          "leah": 5,
          "theo": 0
        },
        "flags": [
          "delay"
        ],
        "keywords": [
          "delay",
          "postpone",
          "pause",
          "hold back",
          "wait",
          "stop",
          "not launch"
        ],
        "outcome": "You move the launch by a week. Engineering gets time to fix the known failure, while Growth absorbs the campaign cost. Your CEO now wants evidence that the extra week has a clear end.",
        "headline": "You buy time. It isn’t free.",
        "reactions": {
          "mara": "I’ll cancel the campaign. Tell me what changes in seven days.",
          "ishan": "Thank you. I’ll separate the immediate fix from the bigger rewrite.",
          "leah": "Let’s use the extra time to settle data ownership.",
          "theo": "Atlas will stay if we explain the plan directly."
        },
        "evidenceBonus": {
          "id": "campaign",
          "metric": "trust",
          "amount": 4,
          "reason": "Knowing the campaign was still cancellable helped you explain the actual cost of the delay."
        }
      }
    ],
    "conversations": {
      "mara": [
        {
          "id": "campaign",
          "question": "What have we actually promised?",
          "answer": "The email says Wednesday. Paid placements aren’t locked until tonight. I told the CEO we could reach 600 teams, but only 20 have completed onboarding.",
          "title": "Reach is not readiness",
          "evidence": "The campaign is cancellable until tonight. Only 20 of the 600 waitlisted teams are onboarded.",
          "kind": "Operational detail"
        },
        {
          "id": "mara-pressure",
          "question": "What happens if the date moves?",
          "answer": "I’ve spent six weeks getting everyone behind this. The board asked me to demonstrate execution this quarter. A slip will have my name on it.",
          "title": "A personal stake in the date",
          "evidence": "Mara’s own performance narrative depends on this quarter’s execution.",
          "kind": "Stakeholder account"
        }
      ],
      "ishan": [
        {
          "id": "failure",
          "question": "Show me a concrete failure.",
          "answer": "Three of 40 long meetings dropped an action owner. Short meetings passed. We can detect the risky ones and require human review, but that gate isn’t enabled.",
          "title": "A bounded failure mode",
          "evidence": "3 of 40 long-meeting tests dropped an action owner. A human-review gate could contain that failure.",
          "kind": "Test evidence"
        },
        {
          "id": "rewrite",
          "question": "Do we need a rewrite to launch?",
          "answer": "For the platform I want, yes. For a controlled pilot, no. We can turn on the review gate today. I should have separated those two things.",
          "title": "Containment is possible",
          "evidence": "Ishan says a full platform rewrite is unnecessary for a gated pilot.",
          "kind": "Engineering assessment"
        }
      ],
      "leah": [
        {
          "id": "consent-warning",
          "question": "What still needs an owner?",
          "answer": "Transcript retention. Someone changed the default from seven days to indefinite during the beta. I haven’t seen who approved it.",
          "title": "An unowned data default",
          "evidence": "The beta transcript-retention default changed to indefinite without a clear approval owner.",
          "kind": "Unverified concern"
        },
        {
          "id": "safe-pilot",
          "question": "What would make a pilot acceptable?",
          "answer": "Named participants, clear consent, a deletion path, and one person who can stop it. I’m not asking for zero risk. I’m asking for a bounded decision.",
          "title": "Conditions for an acceptable pilot",
          "evidence": "Leah supports bounded access if consent, deletion, and a stop owner are explicit.",
          "kind": "Stakeholder position"
        }
      ],
      "theo": [
        {
          "id": "atlas-need",
          "question": "What do customers need first?",
          "answer": "Atlas keeps asking for reliable action items. They barely mention the polished summaries. I’ve heard similar feedback from two other teams, but I haven’t spoken to the whole waitlist.",
          "title": "Reliability over polish",
          "evidence": "Atlas and two other teams prioritize reliable action items. Broader demand is not yet established.",
          "kind": "Customer sample"
        },
        {
          "id": "pilot-customer",
          "question": "Would customers accept early access?",
          "answer": "Atlas will, if we call it a pilot and give them a way to flag mistakes. They will not appreciate being used as a success story without asking.",
          "title": "A willing, conditional partner",
          "evidence": "Atlas is open to a clearly labeled pilot and wants control over public references.",
          "kind": "Customer position"
        }
      ]
    }
  },
  {
    "id": "consent",
    "label": "The missing checkbox",
    "time": "MONDAY · 16:30",
    "countdown": "32 HOURS TO LAUNCH",
    "title": "The demo works. The permission doesn’t.",
    "description": "A customer spots a saved transcript from a meeting they thought was temporary. The retention checkbox is preselected, and the invitation never explains how long recordings stay. Growth asks you to avoid adding friction this close to launch.",
    "speaker": "Leah · Trust & legal",
    "quote": "A setting can be technically visible and still be a surprise.",
    "question": "How will you handle the data problem?",
    "choices": [
      {
        "id": "explicit",
        "title": "Make consent explicit",
        "description": "Ask teams to opt in, give them a deletion path, and accept slower activation.",
        "delta": {
          "delivery": -7,
          "trust": 11,
          "quality": 9
        },
        "relations": {
          "mara": -5,
          "ishan": 2,
          "leah": 8,
          "theo": 5
        },
        "flags": [
          "explicitConsent"
        ],
        "keywords": [
          "consent",
          "opt in",
          "permission",
          "delete",
          "deletion",
          "transparent",
          "explicit"
        ],
        "outcome": "You explain retention before the next invitation, set a short default, and provide a deletion request path. Fewer teams activate immediately, but participants understand what they are joining.",
        "headline": "A smaller funnel. A clearer agreement.",
        "reactions": {
          "mara": "Activation will take a hit. Let’s measure whether those teams stick around.",
          "ishan": "The change is contained. We can ship this without a rewrite.",
          "leah": "Now there’s a decision I can stand behind.",
          "theo": "I can explain that to Atlas without crossing my fingers."
        },
        "evidenceBonus": {
          "id": "retention-fix",
          "metric": "delivery",
          "amount": 4,
          "reason": "The configuration-only fix let you change retention without waiting for a new application release."
        }
      },
      {
        "id": "quiet",
        "title": "Fix the default quietly",
        "description": "Shorten retention now and leave the current launch messaging unchanged.",
        "delta": {
          "delivery": 7,
          "trust": -7,
          "quality": 4
        },
        "relations": {
          "mara": 4,
          "ishan": 3,
          "leah": -6,
          "theo": -4
        },
        "flags": [
          "quietFix"
        ],
        "keywords": [
          "quiet",
          "default",
          "silently",
          "patch",
          "without announcing",
          "no announcement"
        ],
        "outcome": "New transcripts now expire after seven days. Existing participants still have not been told what happened to earlier recordings, and no one owns follow-up communication.",
        "headline": "The setting changes. The question stays.",
        "reactions": {
          "mara": "Good. We solved it without derailing the invitation.",
          "ishan": "The new default works. Existing data needs a separate job.",
          "leah": "We haven’t answered the customer’s question.",
          "theo": "They asked for an explanation, not just a new setting."
        }
      },
      {
        "id": "exception",
        "title": "Keep an exception for Atlas",
        "description": "Negotiate a special retention agreement with the biggest account.",
        "delta": {
          "delivery": 10,
          "trust": 0,
          "quality": -6
        },
        "relations": {
          "mara": 4,
          "ishan": -4,
          "leah": -3,
          "theo": 5
        },
        "flags": [
          "atlasException"
        ],
        "keywords": [
          "atlas",
          "exception",
          "contract",
          "agreement",
          "enterprise",
          "negotiate"
        ],
        "outcome": "Atlas gets a documented exception and agrees to continue. Supporting two retention policies adds operational complexity, while the rest of the beta still needs a consistent explanation.",
        "headline": "One relationship, two policies.",
        "reactions": {
          "mara": "We kept the reference account. That gives us breathing room.",
          "ishan": "We’re now maintaining an exception before we have a standard.",
          "leah": "I need to see who owns both policies.",
          "theo": "Atlas feels heard. I’ll make sure we don’t promise everyone the same thing."
        },
        "evidenceBonus": {
          "id": "atlas-retention",
          "metric": "quality",
          "amount": 4,
          "reason": "You learned Atlas needs a 30-day window, so the exception was bounded rather than indefinite."
        }
      }
    ],
    "conversations": {
      "mara": [
        {
          "id": "funnel",
          "question": "What would explicit consent cost?",
          "answer": "I don’t know yet. I’m assuming every extra step hurts activation. We haven’t tested this wording, so I can’t give you a conversion number.",
          "title": "An untested funnel assumption",
          "evidence": "There is no measured conversion impact for explicit retention consent.",
          "kind": "Assumption exposed"
        },
        {
          "id": "mara-signoff",
          "question": "Who approved indefinite retention?",
          "answer": "I asked whether more data would help the demo. I didn’t ask for forever. I thought Engineering and Legal had agreed on the setting.",
          "title": "A request became a policy",
          "evidence": "Mara’s request for demo data was interpreted as a retention policy; she assumed others had approved it.",
          "kind": "Stakeholder account"
        }
      ],
      "ishan": [
        {
          "id": "retention-fix",
          "question": "What can we change today?",
          "answer": "The default is a configuration value. We can switch it today. Deleting old data is a separate job; I can own that if someone defines the rule.",
          "title": "A small fix, a separate cleanup",
          "evidence": "New-data retention can change today without a release. Existing data requires a separate cleanup job.",
          "kind": "Implementation detail"
        },
        {
          "id": "data-scope",
          "question": "How much data is affected?",
          "answer": "Twelve teams have retained transcripts. We can list the owners and notify them directly. This is contained if we act now.",
          "title": "A known exposure",
          "evidence": "Twelve beta teams have retained transcripts and can be contacted directly.",
          "kind": "Operational detail"
        }
      ],
      "leah": [
        {
          "id": "data-promise",
          "question": "What did our invitation promise?",
          "answer": "It said temporary processing. We should honor what people reasonably understood, then ask before keeping anything longer. The old invitation is in the evidence folder.",
          "title": "Temporary meant temporary",
          "evidence": "The original beta invitation described temporary processing, not indefinite retention.",
          "kind": "Documented promise"
        },
        {
          "id": "legal-path",
          "question": "Can we keep a bounded exception?",
          "answer": "If the team understands it, chooses it, and can revoke it. A special contract isn’t a substitute for a usable deletion process.",
          "title": "Consent includes an exit",
          "evidence": "A special retention agreement needs an explicit duration and a usable revocation path.",
          "kind": "Stakeholder position"
        }
      ],
      "theo": [
        {
          "id": "atlas-retention",
          "question": "What does Atlas actually need?",
          "answer": "Thirty days, so they can compare follow-ups across a month. Nobody there asked us to keep recordings forever.",
          "title": "Thirty days, not forever",
          "evidence": "Atlas requests 30-day retention, not indefinite storage.",
          "kind": "Customer position"
        },
        {
          "id": "customer-trust",
          "question": "What upset the customer most?",
          "answer": "The surprise. They were fine discussing a longer window. They weren’t fine discovering it after the meeting.",
          "title": "The surprise broke trust",
          "evidence": "The customer’s objection concerns unexpected retention more than retention itself.",
          "kind": "Customer account"
        }
      ]
    }
  },
  {
    "id": "rumor",
    "label": "The room turns",
    "time": "TUESDAY · 09:15",
    "countdown": "23 HOURS TO LAUNCH",
    "title": "An earlier team note has become someone else’s story.",
    "description": "A cropped screenshot from a team planning note written before your first decision is circulating. The caption says Product has lost confidence in Engineering. Two engineers stop posting updates. Mara wants to handle it quietly; Ishan wants the full note shared.",
    "speaker": "A message in #launch",
    "quote": "Apparently Product thinks the team can’t deliver. Good to know.",
    "question": "How do you respond to the rumor?",
    "choices": [
      {
        "id": "open",
        "title": "Put the evidence in the room",
        "description": "Share the full decision context and invite corrections without naming a culprit.",
        "delta": {
          "delivery": -5,
          "trust": 13,
          "quality": 3
        },
        "relations": {
          "mara": -4,
          "ishan": 6,
          "leah": 5,
          "theo": 3
        },
        "flags": [
          "openContext"
        ],
        "keywords": [
          "open",
          "public",
          "evidence",
          "context",
          "transparent",
          "all hands",
          "full thread",
          "share"
        ],
        "outcome": "The team sees the complete exchange and corrects two assumptions. The meeting costs time, but engineers begin posting blockers again. You state what you know and leave the screenshot’s author unaccused.",
        "headline": "Context travels farther than the crop.",
        "reactions": {
          "mara": "That was uncomfortable. I can see why the full context mattered.",
          "ishan": "The team heard that the note was asking for evidence, not assigning blame.",
          "leah": "Thank you for distinguishing a fact from an accusation.",
          "theo": "Support finally knows what to tell people."
        },
        "evidenceBonus": {
          "id": "full-thread",
          "metric": "trust",
          "amount": 4,
          "reason": "The original thread let you correct the specific false impression instead of offering a generic reassurance."
        }
      },
      {
        "id": "broker",
        "title": "Broker a private reset",
        "description": "Meet Growth and Engineering separately, then agree on one short update.",
        "delta": {
          "delivery": 3,
          "trust": 5,
          "quality": 1
        },
        "relations": {
          "mara": 5,
          "ishan": 3,
          "leah": 0,
          "theo": -2
        },
        "flags": [
          "privateReset"
        ],
        "keywords": [
          "private",
          "separately",
          "one on one",
          "mediate",
          "broker",
          "meeting",
          "align"
        ],
        "outcome": "Mara and Ishan agree to a joint update. Leadership tension eases, but some teammates still feel the real conversation happened behind a closed door.",
        "headline": "The leaders align. The room waits.",
        "reactions": {
          "mara": "That gave us space to be honest.",
          "ishan": "We have a working agreement. I’ll need to explain it to the team.",
          "leah": "Write down what was agreed so it doesn’t change in retelling.",
          "theo": "Can the people answering customers see the same update?"
        }
      },
      {
        "id": "ignore",
        "title": "Keep attention on delivery",
        "description": "Decline a debate about screenshots and ask everyone to return to the launch.",
        "delta": {
          "delivery": 9,
          "trust": -14,
          "quality": -5
        },
        "relations": {
          "mara": 3,
          "ishan": -9,
          "leah": -4,
          "theo": -5
        },
        "flags": [
          "ignoredRumor"
        ],
        "keywords": [
          "ignore",
          "focus",
          "delivery",
          "move on",
          "dismiss",
          "not engage",
          "keep working"
        ],
        "outcome": "The meeting ends quickly. The screenshot remains the most widely shared account, and engineers move sensitive updates into private channels.",
        "headline": "Silence becomes an answer.",
        "reactions": {
          "mara": "We kept the day moving. I hope this burns out.",
          "ishan": "They heard that the story doesn’t matter to you.",
          "leah": "An uncorrected claim now shapes everyone’s assumptions.",
          "theo": "I’m still hearing different versions."
        }
      }
    ],
    "conversations": {
      "mara": [
        {
          "id": "screenshot-source",
          "question": "Where did the screenshot come from?",
          "answer": "I shared a crop of the earlier team note with two leads to discuss launch planning. I added ‘Product is nervous.’ I didn’t expect it to go further. That was my interpretation, not your wording.",
          "title": "An interpretation became a quote",
          "evidence": "Mara shared the crop and added her own interpretation. The wider circulation remains unverified.",
          "kind": "Firsthand admission"
        },
        {
          "id": "mara-reset",
          "question": "What would help you correct this?",
          "answer": "Don’t turn it into a public trial. I’ll correct the wording if we can agree what we are actually telling the team.",
          "title": "A possible correction",
          "evidence": "Mara is willing to correct her wording if the response avoids a personal accusation.",
          "kind": "Stakeholder position"
        }
      ],
      "ishan": [
        {
          "id": "full-thread",
          "question": "Show me the full exchange.",
          "answer": "The earlier team note asks, ‘What evidence would make a limited launch safe?’ It predates your first decision. The crop removed ‘limited’ and the sentence about a review gate. It is not a quote from your decision or your typed wording.",
          "title": "The earlier team note, in full",
          "evidence": "A team planning note written before your first decision asked for evidence supporting a limited launch and mentioned a review gate. It records an earlier team discussion, not a statement made by you in this attempt.",
          "kind": "Source document"
        },
        {
          "id": "eng-silence",
          "question": "Why did updates stop?",
          "answer": "Two people think their uncertainty will be used against them. They’re still finding defects. They just stopped reporting them in the big channel.",
          "title": "Silence is not reliability",
          "evidence": "Engineers are finding defects but withholding them from the shared channel.",
          "kind": "Team account"
        }
      ],
      "leah": [
        {
          "id": "rumor-boundary",
          "question": "What can we say with confidence?",
          "answer": "We can show what was written. We can say the crop is incomplete. We can’t prove everyone’s motive, and naming a villain will only produce a second rumor.",
          "title": "Correct the record, not the motive",
          "evidence": "The full text is verifiable; participants’ intentions are not.",
          "kind": "Evidence boundary"
        },
        {
          "id": "decision-log",
          "question": "How do we prevent the next version?",
          "answer": "Keep a short decision log: evidence, choice, owner, and what would change our mind. Give people one source they can point to.",
          "title": "A shared record",
          "evidence": "A visible decision log can reduce ambiguity about ownership and reasoning.",
          "kind": "Proposed action"
        }
      ],
      "theo": [
        {
          "id": "rumor-customer",
          "question": "Has this reached customers?",
          "answer": "Not the screenshot. But Atlas got two different dates from two people. They are starting to think we’re improvising.",
          "title": "Internal ambiguity leaks outward",
          "evidence": "Atlas has received conflicting dates from the team.",
          "kind": "Customer account"
        },
        {
          "id": "theo-context",
          "question": "What does support need now?",
          "answer": "One honest status, a named contact, and permission to say what we don’t know yet. I don’t need everyone’s private messages.",
          "title": "Enough context to act",
          "evidence": "Support needs a consistent status and escalation owner.",
          "kind": "Operational need"
        }
      ]
    }
  },
  {
    "id": "scope",
    "label": "The price of a yes",
    "time": "TUESDAY · 15:00",
    "countdown": "17 HOURS TO LAUNCH",
    "title": "Your biggest customer wants a different product.",
    "description": "Atlas offers to become a paying reference account if Relay adds a custom approval workflow. Engineering can deliver that or harden the shared action-item experience this week. The CEO asks which opportunity you are willing to lose.",
    "speaker": "Theo · Customer advocate",
    "quote": "They’re ready to sign. We just have to make this one thing work.",
    "question": "Where will you spend the remaining capacity?",
    "choices": [
      {
        "id": "core",
        "title": "Protect the shared core",
        "description": "Harden action items for all teams and offer Atlas a temporary manual workflow.",
        "delta": {
          "delivery": -3,
          "trust": 3,
          "quality": 14
        },
        "relations": {
          "mara": -3,
          "ishan": 6,
          "leah": 2,
          "theo": -4
        },
        "flags": [
          "sharedCore"
        ],
        "keywords": [
          "core",
          "shared",
          "manual",
          "reliable",
          "reliability",
          "all teams",
          "focus"
        ],
        "outcome": "The team improves the same workflow for everyone. Atlas accepts a manual workaround for now but postpones the contract. You keep the product coherent and take the revenue uncertainty yourself.",
        "headline": "One product. An uncomfortable no.",
        "reactions": {
          "mara": "We’ll have to tell a slower revenue story.",
          "ishan": "This work compounds. It won’t become a one-customer branch.",
          "leah": "A documented workaround is easier to unwind than a silent exception.",
          "theo": "I’ll hold that relationship, but I need a follow-up date."
        },
        "evidenceBonus": {
          "id": "market-sample",
          "metric": "delivery",
          "amount": 5,
          "reason": "Evidence from other teams helped you preserve demand while declining the custom branch."
        }
      },
      {
        "id": "custom",
        "title": "Build the Atlas workflow",
        "description": "Win the anchor account and accept a separate path to maintain.",
        "delta": {
          "delivery": 14,
          "trust": 2,
          "quality": -10
        },
        "relations": {
          "mara": 6,
          "ishan": -7,
          "leah": -2,
          "theo": 8
        },
        "flags": [
          "customBranch"
        ],
        "keywords": [
          "atlas",
          "custom",
          "enterprise",
          "contract",
          "anchor",
          "paying",
          "workflow"
        ],
        "outcome": "Atlas signs a conditional commitment. The engineers deliver its approval path, deferring hardening for everyone else. Your near-term commercial story improves; the maintenance burden grows.",
        "headline": "A customer win with a carrying cost.",
        "reactions": {
          "mara": "A real commercial signal. We needed that.",
          "ishan": "We have two paths to test now. Please account for that next sprint.",
          "leah": "The exception needs an owner and an expiry review.",
          "theo": "They’re excited. I’ll make sure the commitment is written down."
        },
        "evidenceBonus": {
          "id": "contract-terms",
          "metric": "trust",
          "amount": 4,
          "reason": "You clarified the conditional terms before describing the deal as revenue."
        }
      },
      {
        "id": "both",
        "title": "Split the team across both",
        "description": "Pursue the contract and broad launch improvements in parallel.",
        "delta": {
          "delivery": 6,
          "trust": -6,
          "quality": -7
        },
        "relations": {
          "mara": 4,
          "ishan": -10,
          "leah": -3,
          "theo": 3
        },
        "flags": [
          "splitTeam"
        ],
        "keywords": [
          "both",
          "parallel",
          "split",
          "overtime",
          "everything",
          "two teams"
        ],
        "outcome": "Everyone hears a yes. Two streams compete for the same reviewer, slowing validation on both. A critical handoff is delayed because no one had an unambiguous first priority.",
        "headline": "Two promises. One bottleneck.",
        "reactions": {
          "mara": "The plan looks ambitious. I need an update on what actually clears review.",
          "ishan": "The same two people review both paths. Parallel work didn’t double capacity.",
          "leah": "Who can stop one stream if the other needs help?",
          "theo": "Atlas wants a firm date. I still can’t give them one."
        }
      }
    ],
    "conversations": {
      "mara": [
        {
          "id": "runway",
          "question": "Do we need this deal to survive?",
          "answer": "It helps the quarter. It doesn’t change payroll next month. We have runway. I’ve been calling it critical because it makes the launch story concrete.",
          "title": "Helpful revenue, not an existential deal",
          "evidence": "Atlas helps the quarter, but the company is not depending on it for next month’s payroll.",
          "kind": "Commercial context"
        },
        {
          "id": "mara-market",
          "question": "What signal would convince the board?",
          "answer": "Either a credible paid commitment or evidence that multiple teams keep using the core. We’ve been acting like only the first one counts.",
          "title": "Two forms of evidence",
          "evidence": "The board will consider sustained multi-team use as well as a paid commitment.",
          "kind": "Stakeholder account"
        }
      ],
      "ishan": [
        {
          "id": "review-bottleneck",
          "question": "Can we really do both?",
          "answer": "We can write both. We cannot review both this week. The same two people own integration testing, and there’s no spare reviewer.",
          "title": "The shared bottleneck",
          "evidence": "Both workstreams require the same two integration reviewers.",
          "kind": "Capacity constraint"
        },
        {
          "id": "manual-bridge",
          "question": "Is there a reversible workaround?",
          "answer": "A human can approve the export before it goes to Atlas. It’s clunky, but it buys a week without creating a second product path.",
          "title": "A reversible bridge",
          "evidence": "A manual export approval can serve Atlas temporarily without a custom branch.",
          "kind": "Implementation option"
        }
      ],
      "leah": [
        {
          "id": "exception-cost",
          "question": "What makes an exception manageable?",
          "answer": "A named owner, a bounded duration, and a review date. The risk is not the existence of an exception. It’s forgetting we made one.",
          "title": "An expiry, not an open-ended promise",
          "evidence": "A custom workflow should have an owner and a dated review.",
          "kind": "Operational safeguard"
        },
        {
          "id": "deal-language",
          "question": "Can we call this revenue?",
          "answer": "Not yet. They’ve described a conditional commitment, not a signed unconditional order. Use the precise words.",
          "title": "A conditional commercial signal",
          "evidence": "The proposed commitment depends on delivery of the workflow.",
          "kind": "Commercial boundary"
        }
      ],
      "theo": [
        {
          "id": "market-sample",
          "question": "How many other teams need this?",
          "answer": "I checked yesterday. One other team likes it; eight prefer reliable action items first. Atlas is loud because I’m close to them.",
          "title": "The loudest need is not the broadest",
          "evidence": "Of nine other teams consulted, eight prioritized action-item reliability and one favored approvals.",
          "kind": "Customer sample"
        },
        {
          "id": "contract-terms",
          "question": "What exactly has Atlas offered?",
          "answer": "They’ll sign a commitment conditional on a working approval flow. The reference quote needs separate approval. I should not have called it a done deal.",
          "title": "The deal has conditions",
          "evidence": "The contract depends on a working approval flow; public reference rights require separate approval.",
          "kind": "Customer terms"
        }
      ]
    }
  },
  {
    "id": "accountability",
    "label": "The story you own",
    "time": "WEDNESDAY · 08:30",
    "countdown": "THE LAUNCH REVIEW",
    "title": "The board wants one slide. Reality needs more.",
    "description": "Your CEO wants a clear recommendation. You have adoption signals, unresolved tradeoffs, and a team that remembers how the last two days felt. This is your final call: what do you put on the record, and who owns what happens next?",
    "speaker": "CEO · Launch review",
    "quote": "Tell us what we’ve earned the right to do—and what you need from us.",
    "question": "What will you ask the board to back?",
    "choices": [
      {
        "id": "evidence",
        "title": "Present a bounded recommendation",
        "description": "Show the evidence, name the remaining risks, and define the next decision gate.",
        "delta": {
          "delivery": 1,
          "trust": 10,
          "quality": 5
        },
        "relations": {
          "mara": 0,
          "ishan": 5,
          "leah": 6,
          "theo": 3
        },
        "flags": [
          "evidenceBrief"
        ],
        "keywords": [
          "evidence",
          "risk",
          "gate",
          "honest",
          "transparent",
          "bounded",
          "threshold",
          "recommendation"
        ],
        "outcome": "You separate what happened from what you hope will happen. The board agrees to a measurable next gate. You own the recommendation and make the unresolved work visible.",
        "headline": "A decision others can inspect.",
        "reactions": {
          "mara": "That’s a story I can repeat without rewriting it.",
          "ishan": "We know what has to be true before access expands.",
          "leah": "The risks and the owners are finally in the same place.",
          "theo": "I can tell customers what happens next."
        },
        "evidenceBonus": {
          "id": "gate",
          "metric": "delivery",
          "amount": 4,
          "reason": "You linked your recommendation to the board’s actual release criteria."
        }
      },
      {
        "id": "momentum",
        "title": "Lead with momentum",
        "description": "Ask for broad expansion, emphasize demand, and handle the gaps within the team.",
        "delta": {
          "delivery": 15,
          "trust": -8,
          "quality": -9
        },
        "relations": {
          "mara": 7,
          "ishan": -5,
          "leah": -7,
          "theo": -2
        },
        "flags": [
          "momentumBrief"
        ],
        "keywords": [
          "momentum",
          "expand",
          "scale",
          "growth",
          "bold",
          "broad",
          "positive",
          "demand"
        ],
        "outcome": "The board backs a broader release on the strength of your story. The team now has to close the gap between the public promise and the operating reality you did not fully describe.",
        "headline": "The story accelerates the commitment.",
        "reactions": {
          "mara": "We got the backing. Now we need to deliver it.",
          "ishan": "Our unresolved work didn’t disappear from the queue.",
          "leah": "I wanted the board to understand what it was accepting.",
          "theo": "I’ll be answering questions about those promises."
        }
      },
      {
        "id": "shared",
        "title": "Ask for a joint checkpoint",
        "description": "Bring the leads together, align on release criteria, and accept another short delay.",
        "delta": {
          "delivery": -8,
          "trust": 7,
          "quality": 8
        },
        "relations": {
          "mara": -4,
          "ishan": 4,
          "leah": 4,
          "theo": 4
        },
        "flags": [
          "jointCheckpoint"
        ],
        "keywords": [
          "joint",
          "together",
          "align",
          "checkpoint",
          "consensus",
          "delay",
          "all leads"
        ],
        "outcome": "The leads leave with shared release criteria and named owners. The CEO gives you a short extension, while reminding you that agreement must lead to a decision, not another meeting.",
        "headline": "Shared ownership, with a deadline.",
        "reactions": {
          "mara": "I’ll back it if this checkpoint really is the last one.",
          "ishan": "The reviewers can now plan around one set of criteria.",
          "leah": "Make the owners and deadline visible.",
          "theo": "The customer update finally matches the internal plan."
        },
        "evidenceBonus": {
          "id": "owners",
          "metric": "trust",
          "amount": 4,
          "reason": "The explicit owner list kept shared accountability from becoming nobody’s responsibility."
        }
      }
    ],
    "conversations": {
      "mara": [
        {
          "id": "demand-quality",
          "question": "Which demand numbers can we defend?",
          "answer": "The waitlist is real. It isn’t usage. I can show verified activations separately, and I’ll stop calling every signup a customer.",
          "title": "Demand is not adoption",
          "evidence": "Waitlist signups and verified product use are separate signals.",
          "kind": "Metric definition"
        },
        {
          "id": "mara-reflection",
          "question": "What would you do differently?",
          "answer": "I’d bring you in before turning a target into a public date. I still think urgency helped. I just don’t think surprise did.",
          "title": "Urgency without surprise",
          "evidence": "Mara acknowledges that converting a target into a promise created avoidable pressure.",
          "kind": "Stakeholder reflection"
        }
      ],
      "ishan": [
        {
          "id": "gate",
          "question": "What should the next release gate be?",
          "answer": "No missing action owners in the next 40 reviewed long meetings, plus a tested rollback. It won’t prove perfection. It gives us a concrete reason to expand or stop.",
          "title": "A testable next gate",
          "evidence": "Proposed release gate: zero missing owners in 40 reviewed long meetings, with a tested rollback.",
          "kind": "Proposed acceptance criterion"
        },
        {
          "id": "ishan-reflection",
          "question": "What’s still uncertain?",
          "answer": "How this behaves with unfamiliar meeting formats. We can monitor and expand in steps. Pretending our current tests cover everything would be misleading.",
          "title": "Known limits of the evidence",
          "evidence": "Current tests do not establish reliability across all meeting formats.",
          "kind": "Evidence limitation"
        }
      ],
      "leah": [
        {
          "id": "owners",
          "question": "Who owns each unresolved risk?",
          "answer": "Engineering owns the review gate. I own checking consent language. You own the expansion decision. Growth owns claims, and Support owns the customer notice.",
          "title": "Named decision owners",
          "evidence": "The release gate, consent, expansion, claims, and customer notice each have a named owner.",
          "kind": "Accountability map"
        },
        {
          "id": "leah-reflection",
          "question": "What should the board hear?",
          "answer": "The tradeoff you actually made, not the one that sounds safest in hindsight. If we accepted a risk, say who accepted it and why.",
          "title": "Account for the actual choice",
          "evidence": "Leah asks for an accurate record of the risks accepted along the way.",
          "kind": "Stakeholder position"
        }
      ],
      "theo": [
        {
          "id": "customer-next",
          "question": "What do customers expect next?",
          "answer": "One realistic next step. Tell them what they can use, what they should double-check, and when we’ll follow up.",
          "title": "A usable next promise",
          "evidence": "Customers need a concrete next step, a known limitation, and a follow-up date.",
          "kind": "Customer need"
        },
        {
          "id": "theo-reflection",
          "question": "How can your familiarity with Atlas affect your advice?",
          "answer": "I know Atlas’s team well, so their urgency can feel like everyone’s. That is a bias in my advice, not proof that your decision overfit. Next time I want the wider sample in the room earlier.",
          "title": "Familiarity shaped the signal",
          "evidence": "Theo describes how familiarity with Atlas can narrow his view of demand.",
          "kind": "Stakeholder reflection"
        }
      ]
    }
  }
];

// Authored rule metadata. These records add provenance, not new score tuning.
export const RULES_VERSION = 'launch-room-rules-v1';
export const DELAY_RULES = {
  promise: {
    pilot: { delta: {quality:3}, audience:['ishan','theo'], text:'Your small pilot brings back its first useful failure report. The review gate catches it before a summary reaches a customer.' },
    launch: { delta: {trust:-4,quality:-2}, audience:['mara','ishan','leah','theo'], text:'Your public-launch commitment means the retention surprise reaches more teams. Support escalates it before the next invitation goes out.' },
    delay: { delta: {delivery:4,quality:3}, audience:['ishan'], text:'The time you bought lets Engineering reproduce the long-meeting defect. The campaign is paused, but the review now has a concrete target.' },
  },
  consent: {
    explicit: { delta: {trust:3}, audience:['leah','theo'], text:'The explicit consent notice gives Support a clear answer when the next customer asks about recordings.' },
    quiet: { delta: {trust:-6}, audience:['leah','theo'], text:'The customer notices the changed default and asks why no one explained the earlier recordings. Your quiet fix has become a trust question.' },
    exception: { delta: {quality:-2}, audience:['ishan','leah'], text:'Engineering has started maintaining Atlas’s separate retention policy. That exception now consumes review time.' },
  },
  rumor: {
    open: { delta: {trust:2,quality:3}, audience:['mara','ishan','leah','theo'], text:'After the open correction, an engineer posts a blocker early enough to fix it. The room is sharing inconvenient information again.' },
    broker: { delta: {trust:1}, audience:['mara','ishan','leah','theo'], text:'The joint leadership update reduces speculation, though Support still asks to see the decision record.' },
    ignore: { delta: {trust:-3,quality:-5}, audience:['ishan'], text:'A defect reported privately did not reach the launch checklist. The shared channel is quieter, but the risk has grown.' },
  },
  scope: {
    core: { delta: {quality:5}, audience:['ishan','theo'], text:'The shared action-item fix passes its review. Atlas is still waiting on a contract, but the core experience is stronger for every team.' },
    custom: { delta: {delivery:4,quality:-3}, audience:['mara','ishan','theo'], text:'Atlas confirms the conditional commitment. The custom branch brings a commercial signal and another path to maintain.' },
    both: { delta: {delivery:-6,quality:-4}, audience:['mara','ishan','theo'], text:'Both workstreams reach the same review bottleneck. One slips, and the other goes into the review with incomplete validation.' },
  },
};
export const MEMORY_RULES = [
  {ruleId:'memory:mara:promise',personId:'mara',round:2,originRound:1,text:{
    pilot:'You kept a limited opening rather than the broad launch.',
    launch:'You kept the public date; Growth is carrying that commitment.',
    delay:'You moved the launch date; I need a revised commitment.',
  }},
  {ruleId:'memory:ishan:promise',personId:'ishan',round:2,originRound:1,text:{
    pilot:'You chose containment; the review gate now matters.',
    launch:'You kept the public launch despite the reliability risk.',
    delay:'You gave us review time; the immediate fix and the rewrite remain separate.',
  }},
  {ruleId:'memory:leah:consent',personId:'leah',round:3,originRound:2,text:{
    explicit:'You chose explicit consent, so the customer notice can name the policy.',
    quiet:'You changed the default without explaining the earlier recordings.',
    exception:'You chose a separate Atlas policy; it needs an owner.',
  }},
  {ruleId:'memory:theo:scope',personId:'theo',round:5,originRound:4,requiresDelayed:true,text:{
    core:'You prioritized the shared core; Atlas still needs a follow-up.',
    custom:"You prioritized Atlas's workflow; its commitment remains conditional.",
    both:'You split the work; the review bottleneck has affected the plan.',
  }},
];
