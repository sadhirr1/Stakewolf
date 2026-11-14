# SCRUM-38 saved council attempts

`dist/council-saves.mjs` saves completed councils on the current browser and site origin. It does not resume unfinished councils, sync across devices, create an account or call a service. Refresh still discards an unfinished council. General practice and interview preparation can both create completed council snapshots; the job description and earlier non-council practice sessions are excluded.

Development owns this module, `tests/council-saves.test.mjs` and this contract. Coordination owns attempt identity, rendering, confirmation controls and integration. The separate QA agent owns independent review. Author checks are evidence of bounded behavior, not release acceptance.

## API and stored format

- `STORAGE_KEY` is `stakewolf.councils.v1`; `MAX_SAVED` is 20.
- `createSavedCouncil(state, attempt, {id, completedAt, origin})` returns a deeply frozen, detached JSON-safe snapshot only for a completed debrief. Incomplete or invalid state/metadata returns `null`. Supply one stable ID per attempted council, a canonical UTC ISO timestamp and a short origin such as `general` or `interview`. Replay requires a new ID. IDs accept 1–100 ASCII letters, digits, underscores or hyphens; origin accepts at most 80 characters and defaults to `practice`.
- `loadSavedCouncils(storage)`, `saveCouncil(storage, snapshot)`, `deleteSavedCouncil(storage, id)` and `clearSavedCouncils(storage)` return `{items, error}`. `error` is `null` on success or a readable message on failure. Items are detached and deeply frozen. Supply a storage object with `getItem`, `setItem` and `removeItem`; callers must also catch a denied `window.localStorage` getter before passing it.
- `compareSavedCouncils(older, newer)` returns `{rows:[{label,before,after}], changes:[strings], prompt, limits:[strings], sameSituation, context}` only for different IDs with matching topic and supported case versions. Different situations are explicitly identified; invalid or incompatible inputs return `null`.

The storage envelope is `{schemaVersion:1, items:[...]}`. Each snapshot contains exactly:

```text
schemaVersion: 1
caseVersion: 'council-v1' | 'council-v1:b' | 'council-v1:c'
id, completedAt, origin, topic, title
decision: {id,title}
records: [{id,title}]
promises: [{id,title,cost}]
support: [{id,name,support}]
reserved, used, capacity
fulfilled: [{id,title}]
deferred: [{id,title,detail}]
questionCount
feedback: {sections, rehearsal, limits}
```

`questionCount` means valid retained typed messages from council and aftermath, capped at 60. It excludes debrief, blank, invalid-speaker and oversized messages, and does not add dropped messages. Label it **Retained messages**, not total questions asked. `feedback` is the original `buildCouncilCoaching` output captured once. It includes up to two shortened typed examples, so the UI must disclose this limited personal text retention. The snapshot contains no complete conversation, raw job description, event log or private stakeholder objective.

## Persistence and recovery

Each save reads storage afresh, validates the complete existing envelope, merges by attempt identity and retains the 20 most recent completion timestamps. An identical repeated snapshot is a successful no-op without another write. A different snapshot reusing an existing ID is rejected so the original stays unchanged. The UI captures and saves a completed snapshot once, then reopens that saved snapshot without regenerating it. If an older incoming snapshot would itself be outside the 20-entry limit, save returns an error and leaves history unchanged. The cap may remove the oldest saved council on a successful new save.

Validation bounds strings and arrays, requires unique IDs, supported schema/case versions, valid timestamps and integer costs, and reconstructs public engine facts to reject impossible names, records, support, work or capacity. Feedback is bounded, shape-checked and retained verbatim. It is never recomputed on load or comparison. Changes to authored facts require a case-version policy; this implementation does not migrate unknown versions.

Unreadable JSON, invalid records and unknown versions make the entire history unavailable without deleting or overwriting it. Save and individual delete refuse to modify such data. Only the explicitly confirmed clear action removes it. Storage access, quota and denied-write failures return existing successfully read items with an error; the UI must not claim a failed save/delete succeeded. The storage payload is capped at 1,048,576 JavaScript string characters. The module touches only its own key.

Fresh-read merging reduces stale-tab overwrites; browser local storage has no transaction spanning reads and writes, so simultaneous writes from different tabs are not guaranteed to merge. No cross-tab or cross-device synchronization is claimed. Browser clearing, private browsing, origin changes or unavailable storage can remove/prevent access to saved history.

## Comparison and rendering

Compare situation labels, named records, retained message counts, confirmed approaches, promises, each stakeholder’s closing support, reserved/used capacity, delivered work and deferred work. Explain differences without grading attempts or treating more support, spending, evidence or promises as universally better. Same-situation retries benefit from hindsight. Different situations change facts and bargaining rules, so outcomes are not a like-for-like improvement score. Delivered promises were automatic, while additional response choices were discretionary.

Original saves retain `council-v1` and their original feedback. The two new authored situations use `:b` and `:c`; validation reconstructs each snapshot against its own situation. `savedCouncilVariant` maps those supported versions to engine IDs; unknown versions still fail safely. Re-entering a council consults the newest saved situation when no in-tab choice exists and avoids repeating it. No unfinished attempt is resumed or saved.

All saved strings, including feedback excerpts and externally edited local storage, are untrusted text. Render them through the app’s HTML escaping function. Never insert saved strings as HTML. Immutable saved feedback means the original text is preserved, not that browser storage is authenticated against manual edits.

## Verification and handoff

Run `node --test tests/council-saves.test.mjs` and `node --check dist/council-saves.mjs` in this Site directory. The author suite covers completion gating, both cases and capacity, immutable detached snapshots, privacy, retained counts, round trips, fresh merging and identity deduplication, the 20-item boundary, denied/quota failures, corrupt and future formats, malformed/hostile records, deletion scope, compatible comparisons and verbatim feedback. Independent UI tests, rendered inspection, keyboard/narrow-screen checks and final integration results belong to coordination’s retained evidence.

The author suite passed 16 tests with zero failures on October 25, 2026. That result does not claim independent approval, a hosted deployment or full release acceptance.
