# PC validation focused debug — 2026-09-13

## Failed guard and root cause

`POST /api/gorut/packages/[packageCode]/validations` authenticated the actor and then unconditionally returned `503 PHASE_2B_MUTATION_OUT_OF_SCOPE`. The existing Phase 2D `validateGorutPackageSettlement` service was never called. The settlement route was already wired by the preceding focused fix.

## Fix

The validation route now authenticates the operational context, validates the public package code, applies existing JSON mutation security and strict body parsing, calls the existing validation service, and maps domain errors to HTTP status codes. Prisma diagnostics log only the error code.

A PostgreSQL latency regression reproduced `P2028`: the default 5,000 ms transaction expired after a 5,200 ms delayed read. The validation transaction now uses the existing settlement window (`maxWait: 10000`, `timeout: 60000`), preserving Serializable isolation and three bounded attempts. The regression passes with the fix.

No amount comparison, assignment guard, revision logic, workflow transition, package calculation, schema, or Munfiq implementation changed. MATCHED/MISMATCH is derived from stored Decimal amounts with zero tolerance. Client authority fields are rejected. Validation increments the package version; it does not change the workflow state or source revision.

## Local verification

- Focused pure tests: 9/9 PASS (settlement and validation).
- PostgreSQL service integration: 11/11 PASS (settlement and validation, including latency regression).
- Real Next production-server HTTP suite with isolated PostgreSQL and fixture login: 6/6 PASS. Covers Rp64,000 MATCHED, +/- Rp0.01 MISMATCH, correction and stale replay, parallel identical requests, idempotency conflict, stale version, duplicate validation, missing evidence, canonical PC assignment and revocation, inactive account, malformed/forged input, origin/content type, state/financial/historical gates, and production fail-closed for both new commands and replay.
- `VERCEL_ENV=production` returns `503 VALIDATION_PROVISIONAL_POLICY_DISABLED` despite UAT and enable flags; tested locally without touching production.
- TypeScript (`npx tsc --noEmit --incremental false`): PASS.
- Scoped ESLint (validation route, service, service integration test, HTTP integration test): PASS.
- `npm run build`: PASS. Initial sandboxed build stalled; rerun with network access succeeded using normal font fetching.
- `git diff --check`: PASS.

The dedicated local PostgreSQL server uses port 55628. The HTTP suite initially exhausted its default 100 connections because the existing production Prisma factory creates clients per call. Increasing only the disposable test server's capacity to 500 allowed all six groups to pass. The application Prisma factory was not changed in this task. Test databases: `gorut_validation_route_full` (service suite) and `gorut_validation_route_green` (successful HTTP suite).

## Staging retest

PASS on temporary QA package `QA-PC-VALIDATION-20260913` at `2026-09-13T08:51:20.812Z`. Canonical project: `prj_ndtzHGjeAHNXT5w1d2de4GKztRr1`, Preview branch `feature/gorut-ui-redesign`.

The isolated deployment source is HEAD `9fc7eba55ccef0023a0ce062b5bea0ced2529aa0` plus only the existing settlement route/service fix and this validation route/service fix. Unrelated local modifications are excluded. No source is staged, committed, or pushed.

Preview: https://piindung-ecosystem-8cgt-1xfv2rwjg-dsndihrdynsh-4735s-projects.vercel.app

Deployment: `dpl_5Ecxih1jauUkd3bdaehCHGgYyJjN`, target `preview`, status `READY`; remote build PASS.

- Temporary QA PC session signed using the existing application signer; `/api/auth/me` 200. This is an authenticated HTTP endpoint retest, not a staging login-form test. The login endpoint was avoided because `ensureDefaultUsers()` rewrites unrelated default accounts. Real login is covered in the local HTTP suite.
- Settlement POST 200; expected/actual `64000.00`; identical settlement replay 200.
- Validation POST 200; `CURRENT`, `MATCHED`, expected/actual `64000.00`, difference `0.00`, factual finalApprovalReadiness `READY`.
- Validation replay 200 with the same validation code and `idempotentReplay: true`.
- Changed command using the same key: 409 `VALIDATION_IDEMPOTENCY_CONFLICT`; stale version with a new key: 409 `VALIDATION_VERSION_CONFLICT`.
- Exactly one QA settlement, one validation, zero QA workflow events; QA package remains `WAITING_PC_APPROVAL`, version 7, revision 4.
- Package detail GET 200 confirms MATCHED and existing `PC_FINALIZATION_OUT_OF_SCOPE`, with no APPROVE action.
- Existing `GORUT-UAT-KEC-01-202609` full row unchanged: `WAITING_PC_APPROVAL`, version 5, revision 4, net `64000.00`. Its settlement/validation remain unexecuted.
- Logout 200. QA package, settlement, validation, users and assignments removed. Full-row SHA-256 digests and row counts for all 19 GORUT models plus User (20 models) match the pre-test baseline. Cleanup initially hit a transient connection initialization failure; retry succeeded.

Non-secret evidence: `/private/tmp/gorut-validation-debug.c6rAD8/staging-result.json`.

## Final approval boundary

`calculateGorutPackageAvailableActions` still returns `PC_FINALIZATION_OUT_OF_SCOPE` at `WAITING_PC_APPROVAL`; `phase2bTargetState` has no PC final APPROVE transition. A MATCHED validation can make factual settlement readiness READY, but it does not enable final approval. This existing boundary remains unchanged as requested. Final approval and Munfiq UAT are not authorized by this fix.
