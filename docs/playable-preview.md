# Stakewolf playable preview — SCRUM-30

This checkpoint combines the R3 rumor and R4 shared-capacity gameplay from PRs 14/15 with a decision impact desk. It is a reviewed development preview, not a release acceptance decision.

## Run the current local game

In PowerShell, open `C:\Users\sadhi\Project_work\Stakewolf`, run `node server.mjs`, then open `http://127.0.0.1:4173/`. Keep that terminal open. If the server is already running, reload the page to receive the updated files. Refresh starts a new attempt; progress is held only in the current page.

The session's isolated preview runs at `http://127.0.0.1:4175/` while its terminal remains open. Both previews use the same application files after the reviewed local integration.

## What to try

1. Start the case and question stakeholders before choosing an approach. Facts enter the case only when your player acquires them.
2. Select a prepared approach and read its impact before confirming. A preview does not commit the decision.
3. Use **Carried work** to inspect the owner, origin, customer explanation, cleanup and follow-up for promises inherited from earlier rounds.
4. In round 3, compare the cropped message with the available accounts. The earlier explanation deadline can now remain visibly met or missed.
5. In round 4, inspect the shared review window. Choosing core, custom or both schedules, defers or blocks the one shared review bundle; both carried obligations remain active. Scheduling never counts as a successful test.
6. In round 5, read the pending-work brief derived from your own earlier decisions, then complete the case and inspect the evidence behind the debrief.
7. Try a typed decision. Its proposed interpretation and impact remain reviewable before confirmation, including when you choose a different interpretation.

## Delivery and remaining work

The source continues the unmerged PR15 head `22b248647ee458a78e6f7d77830c2e8c87193b95`. The PR14 → PR15 → SCRUM-30 chain must be integrated in order before calling it the default GitHub version. Local integration preserves the previous public folder in `.tmp-root-before-SCRUM-30` rather than resetting unrelated edits.

See `docs/evidence/scrum30-case-desk.md` for actual verification and independent review. Test success does not establish full accessibility, all browser/device support, or release readiness. The scoped R5 synthetic validation/rollback work is still pending; this checkpoint cannot fabricate test receipts or cleanup completion.

The owner set aside the concept art. User-supplied images remain available as reference, with no new artwork applied here. Work-session and scrum automations remain canceled. Current planning targets remain November 6 for the playable candidate and November 13 for the first-case release decision.
