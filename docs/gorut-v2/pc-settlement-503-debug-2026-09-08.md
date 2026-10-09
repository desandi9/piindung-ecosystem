# PC settlement 503 focused debug — 2026-09-08

## Result

Settlement HTTP regression passes on dedicated Neon Preview staging. No source files were staged, committed, or pushed. Production was not deployed or mutated. Validation, final approval, and Munfiq UAT were not executed.

Preview: https://piindung-ecosystem-8cgt-pbydn4ikl-dsndihrdynsh-4735s-projects.vercel.app

Deployment: `dpl_GPHyUZXNqLTT5DdgrkJgkjtyke17`, target `preview`, project `prj_ndtzHGjeAHNXT5w1d2de4GKztRr1`.

## Root cause and fix

`POST /api/gorut/packages/[packageCode]/settlements` authenticated the operational actor, then unconditionally returned `503 PHASE_2B_MUTATION_OUT_OF_SCOPE`. The Phase 2D settlement service existed but was never called. This was a route stub, not a PC assignment or feature flag failure.

The route now calls the existing parser and `recordGorutPackageSettlement` service after operational authentication and JSON mutation security checks. Existing actor/scope, state, financial readiness, historical-data, version, idempotency, and provisional-policy gates remain intact. Database failures log only the Prisma error code.

The first wired-route Preview then returned 500. Diagnostic Preview logs confirmed Prisma `P2028`; a regression test reproduced expiration of the default five-second interactive transaction by delaying an in-transaction package read by 5.2 seconds. Settlement transactions now retain Serializable isolation and bounded retries with `maxWait: 10000` and `timeout: 60000`. No workflow transition logic changed.

The Preview was built from HEAD `9fc7eba55ccef0023a0ce062b5bea0ced2529aa0` plus only the settlement route and settlement service changes. Unrelated local changes were excluded. The earlier Preview URL continues to serve its previous deployment; use the URL above for this fix.

## Verification

- Isolated PostgreSQL on local port 55627, disposable database `gorut_settlement_route_final`, all migrations applied.
- Four settlement pure tests and four service integration tests: 8/8 PASS, including concurrency, idempotency, actor/scope rules, production policy, and the new latency regression (RED before timeout fix, GREEN after).
- Real Next HTTP with fixture login and isolated PostgreSQL: 5/5 PASS. Covers PC pickup 200 with expected 64000, replay, stale/conflicting requests, session/assignment/role/scope rejection, inactive actor, malformed/forged input, content type, cross-origin requests, state/financial/historical gates, and production fail-closed.
- `VERCEL_ENV=production` returns `503 SETTLEMENT_PROVISIONAL_POLICY_DISABLED` even with UAT and enable flags. Verified locally; production was not accessed.
- `npx tsc --noEmit --incremental false`: PASS.
- Scoped ESLint on both application files and both test files: PASS.
- `git diff --check`: PASS.
- Optimized local build: PASS using cached actual Google font files after network fetch timeouts. Vercel Preview build with normal font fetching: PASS.

## Staging HTTP and preservation evidence

Completed at `2026-09-08T15:10:38.004Z` using the official PC account and password from the secure local fixture environment. No credentials are recorded here.

- Login: 200; logout: 200.
- Temporary QA package `QA-SETTLEMENT-HTTP-20260908`, synthetic handover clearly labeled as no real funds.
- Settlement POST: 200; expected and actual both `64000.00`; state remains `WAITING_PC_APPROVAL`, QA version moves 5 → 6, validation remains `NOT_VALIDATED`.
- Identical replay: 200, same evidence code; exactly one settlement evidence, zero workflow events, zero validations.
- Temporary QA package, evidence, assignment, user, and kecamatan removed afterward.
- All 19 GORUT model row counts and full-row SHA-256 digests match the baseline after cleanup.
- Existing `GORUT-UAT-KEC-01-202609` remains fully identical: `WAITING_PC_APPROVAL`, version 5, revision 4, financial READY, net `64000.00`. No real UAT settlement was recorded.

Non-secret run result: `/private/tmp/gorut-settlement-route.h9M7wL/staging-result.json`.

Settlement UAT can resume on this Preview. The full PC approval flow is not cleared: `/validations` still contains its Phase 2B 503 stub and was deliberately left outside this fix.
