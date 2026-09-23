# Munfiq history 500 — focused resume, 2026-09-15

Direct requests on the existing Preview reproduced auth 200, notifications 200, own history 500, own detail 500, and foreign detail 500. Account: the existing active link for `UAT-M001`. Own code: `GORUT-COL-UAT-P01-202609`. Foreign code: `GORUT-COL-UAT-P03-202609`.

Original Preview: `dpl_7iNpj798iPoQmr6LGyXYqd6L6EGR`. Diagnostic Preview: `dpl_2Y9tLnER99pf9pLqn4WLBziSVs8D`. The user explicitly approved the diagnostic Preview and subsequently approved deploying the tested fix to Preview. No stage, commit, push, production change, or Preview migration was performed.

## Exact root cause

The route awaited `syncGorutMunfiqMilestoneNotifications()` before its transparency read model. That service opened an interactive Prisma transaction without explicit timeouts, loaded collection/workflow facts, and attempted deduplication claims via `tx.appRecord.createMany()`. Preview round trips exceeded Prisma's default 5000 ms transaction timeout. The history and both detail requests failed before the read model could return data or reject the foreign code.

Actual server exceptions were `PrismaClientKnownRequestError`, code `P2028`, model `AppRecord`, at 5210 ms (history), 5213 ms (own detail), and 5214 ms (foreign detail):

```text
Invalid `prisma.appRecord.createMany()` invocation:
Transaction API error: Transaction already closed: A query cannot be executed on an expired transaction.
The timeout for this transaction was 5000 ms, however 5210 ms passed since the start of the transaction.
    at async (.next/server/chunks/[root-of-the-server]__0-9e18x._.js:1:18820)
    at async C (.next/server/chunks/[root-of-the-server]__0-9e18x._.js:1:22053)
    at async u (.next/server/chunks/[root-of-the-server]__0-9e18x._.js:1:25561)
```

[All three exact server stacks and request IDs](evidence/munfiq-history-exceptions-2026-09-15.json).

The deployed transparency service, notification service, Prisma schema, and lockfile SHA-1 hashes matched local files. Local service and HTTP calls against the same Preview database succeeded; the timing-sensitive failure required the diagnostic Preview to expose the swallowed exception. The Python archive helper was unrelated and was not debugged.

## Fix and verification

- Notification transaction now has `maxWait: 10000` and `timeout: 60000`, retaining atomic notification creation and deduplication claims.
- Detail performs the owner-filtered transparency query first and returns 404 immediately when unavailable, before notification sync.
- Both routes retain generic public errors and record unexpected server exceptions.
- Mobile empty states require successfully loaded data and no active error. Failed initial loads stop displaying indefinite summary skeletons. Reopening detail clears its previous error.
- PostgreSQL regression suite: 8/8 pass. Covers ownership isolation, personal amount, factual timeline, concurrent notification idempotency, rollback after injected notification-write failure, and a 5200 ms in-transaction delay.
- The new delay regression was run against the original notification service as a negative control: it failed with P2028 at 5202 ms, while the patched service passed.
- Targeted ESLint and TypeScript (`tsc --noEmit --incremental false`) pass.
- Local direct HTTP after fix: auth 200, notifications 200, history 200, own detail 200, foreign detail 404.
- Browser: Rp15.000, five factual milestones through `Sudah diteruskan ke PC`, five matching notifications. Injected history HTTP 500 shows alert/retry with no empty state; injected empty HTTP 200 shows `Belum ada riwayat` with no alert; recovery restores Rp15.000 without an error overlay.

The existing UAT package is still waiting for PC approval; no final milestone is invented and no package transition was made. The prior final-approval proof used a separate temporary fixture that had been cleaned up.

## Final Preview proof

PASS on `dpl_5qRz5RY1a99seUNpQ6Z3ugFu2LcT` (READY):
https://piindung-ecosystem-8cgt-fd5cyi7lm-dsndihrdynsh-4735s-projects.vercel.app

Direct GET results: auth **200**, notifications **200**, own history **200**, own detail **200**, foreign detail **404**. History and detail contain the same personal amount `15000.00` and the same five factual milestones. Notifications fetched again after history/detail remain byte-equivalent as parsed JSON to the initial five notifications: no duplicate or read-state mutation. Retrieved final server logs contain no 500/error records.

All four deployed runtime/UI fix files match the reviewed workspace SHA-256 hashes. The remote build passed; local TypeScript checking was separately run because the existing build configuration skips type errors. No stage, commit, push, production mutation, Preview migration, workflow transition, or account modification occurred.

[Final HTTP payloads, server logs, and verification assertions](evidence/munfiq-history-fixed-preview-2026-09-15.json).

**SAFE TO RESUME FIELD GATE: YES**, using the fixed Preview above. This is readiness to resume the field gate, not a claim that the field gate itself has been run.

Temporary Preview env, request-cookie headers, and browser auth state were removed after verification; the QA browser and local dev server were closed. Application env files and persistent CLI authentication were preserved. Disposable regression database: `gorut_munfiq_history_debug` on local PostgreSQL.
