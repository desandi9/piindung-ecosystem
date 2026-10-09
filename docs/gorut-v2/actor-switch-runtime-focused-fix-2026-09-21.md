# Actor switching: focused runtime fix

Scope: Munfiq → logout → PLPK → logout → Munfiq. No server authorization changes, stage, commit, push, or deployment. Existing workspace changes were retained.

## Exact reproduction

Preview: `piindung-ecosystem-8cgt-fd5cyi7lm-dsndihrdynsh-4735s-projects.vercel.app`.

The focused reproduction produced exactly six unhandled promise rejections. Every rejected request began and completed in the same actor phase. They were fresh requests from mount/login effects, not responses proven to originate from the previous actor. They had no cancellation or rejection owner.

| Step | Request responsible for the unhandled rejection | Status | Client source |
| --- | --- | --- | --- |
| Initial Munfiq login | `PATCH /api/records/maintenance-mode/singleton` | 401 | `createSingletonClient.readValue → void writeValue → requestJson` |
| Initial Munfiq login | `PATCH /api/records/activity-log/log-2` | 403 | `AuthProvider.login → addActivityLog → writeActivityLogs → persistItems`, `Promise.all` index 2 |
| PLPK login | `PATCH /api/records/maintenance-mode/singleton` | 401 | `createSingletonClient.readValue → void writeValue → requestJson` |
| PLPK login | `PATCH /api/records/activity-log/log-1789994948039` | 403 | Same activity-log chain, `Promise.all` index 0 |
| Returning Munfiq | `PATCH /api/records/maintenance-mode/singleton` | 401 | Same singleton chain |
| Returning Munfiq | `PATCH /api/records/activity-log/log-1` | 403 | Same activity-log chain, `Promise.all` index 1 |

All stacks begin at bundle `0d5eh_7_obff1.js:1:11392` (`requestJson`). Singleton writes continue at `1:13433` (`writeValue`); activity batches continue at `1:11676` (`persistItems`). The other requests in each activity batch also returned 403, but `Promise.all` produced one unhandled rejection per batch. Its first failing index varies with response ordering.

Exact stacks and request timing: [before evidence](evidence/actor-switch-runtime-before-2026-09-21.json).

## Fix

- Reads now return defaults without seeding records. Loading the public maintenance settings no longer attempts an unauthorized write.
- Login activity logging appends one event instead of rewriting cached events and four demo records. Typed 401/403 rejections and canceled writes are explicitly handled; unexpected failures still surface. No global console or rejection suppression was added.
- Session changes abort outstanding actor requests, clear actor caches and pending collection intents, and invalidate response ownership. Late success or failure cannot restore a previous actor's data or optimistic rollback.
- Authentication synchronization cannot overwrite a newer session or clear its pending state. Failed logout retains the authenticated session and reports failure.
- Munfiq reads/detail requests abort on logout/unmount. PLPK requests use the same session ownership. Both actors use the shared logout lifecycle; Munfiq now has a visible logout button.
- Public system/maintenance configuration reads are explicitly independent of actor identity; their writes still participate in cancellation. This preserves public settings across login without retaining actor data.

## Verification

Verification uses the changed local application at `http://localhost:3038` against the existing preview database. The deployed preview is unchanged.

- Three complete switching cycles: identity, history, notifications, logout, cross-account denials, and absence of overlays.
- A browser race check holds the history response at the response stage, logs out, confirms `net::ERR_ABORTED`, releases the late response, and checks subsequent actor identities and foreign-detail denial.
- Focused regression tests cover empty reads without writes, 401/403 preservation, cancellation, ignored late responses, optimistic rollback isolation, public settings isolation, existing logout semantics, and Collection API response contracts.

Final results: 67/67 switching checks across three cycles, 13/13 race checks, 19/19 focused tests, TypeScript and scoped ESLint PASS. Zero unhandled exceptions, console errors, server 5xx responses, or error overlays. Direct probes of the original PATCH endpoints still returned 401 without a session and 403 for Munfiq.

Final measured results are recorded in [after evidence](evidence/actor-switch-runtime-after-2026-09-21.json).

Field readiness of the deployed preview remains pending deployment of this client fix and a focused preview retest. No server authorization change is required.
