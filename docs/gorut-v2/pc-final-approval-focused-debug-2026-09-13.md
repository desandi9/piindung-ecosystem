# PC final approval focused debug — 2026-09-13

## Failed guard and trace

`PC_FINALIZATION_OUT_OF_SCOPE` unconditionally blocked PC finalization in HEAD `9fc7eba55ccef0023a0ce062b5bea0ced2529aa0`:

- `lib/gorut-package-workflow-pure.ts:145`: available actions at `WAITING_PC_APPROVAL` were always empty.
- `lib/gorut-package-workflow-server.ts:696`: workflow readiness was always BLOCKED.
- `phase2bTargetState` had no PC APPROVE target; transition scope accepted only UPZIS.

The UI already calls `executeTransition` with `APPROVE` and the canonical expected version. `POST /api/gorut/packages/[packageCode]/transition` already delegates to `executeGorutPackageTransition`; the service boundary, rather than a disconnected HTTP route, was the cause. Phase 2D readiness, settlement/validation models, final-approval serializers, and service integration scenarios already existed.

At session entry the working tree already contained the final-approval wiring and tests. This task audited that implementation, retained it, and added real HTTP regression and a reusable isolated QA fixture with scoped cleanup. No unrelated working changes were reverted.

## Fix and invariant checks

The existing APPROVE action now maps `WAITING_PC_APPROVAL` to `FINAL_APPROVED`. No enum, request/response shape, action list, schema, or state/action contract was added or changed.

The service loads current settlement and validation facts and evaluates the existing Phase 2D readiness predicate inside the transaction. It checks financial READY and source reconciliation, current settlement, current MATCHED validation, exact Decimal difference zero, revision and amount snapshots, factual validator assignment/time, no open corrections, nonhistorical source, and an active canonical PC assignment with an active account. Availability uses a RepeatableRead snapshot; writes use Serializable isolation with bounded retry and the existing 60-second transaction window.

Final approval creates one PC workflow event with the referenced validation/evidence codes and before/after version metadata, then advances the package version by one. Package revision and all settlement/validation fields remain unchanged. Same-key concurrent commands and replay resolve to the original event; distinct competing keys cannot create a second final event. Assignment checks precede replay and production policy is checked before entering the transaction.

The transition route retains strict body parsing and adds the existing JSON mutation security checks. Database diagnostics contain only Prisma error codes.

## Verification

- Focused pure tests: **17/17 PASS** (workflow, settlement, validation).
- PostgreSQL service integration: **23/23 PASS** (workflow/collection reconciliation, settlement, validation). Includes pickup, bank evidence, concurrent final approval, immutable settlement/validation, mismatch → correction → revalidation, and existing transaction latency regressions.
- Real Next production-server HTTP suite: **6/6 PASS**. Covers concurrent same-key and distinct-key approval; successful read-model exposure; replay; stale version and changed-command conflict; absent/stale settlement; financial/historical/source/correction gates; mismatch at +/- Rp0.01; validation revision/amount/actor drift; canonical assignment and account revocation; authentication; malformed/forged bodies; origin/content type; unsupported actions; and production fail-closed for both new approval and replay despite UAT flags.
- TypeScript, explicit `--noEmit --incremental false`: **PASS**. This is independent of Next's configured `ignoreBuildErrors`.
- Focused ESLint: **PASS**, no diagnostics.
- Application ESLint (`app components hooks lib scripts types`): **0 errors**, 40 existing warnings.
- Full `npm run lint`: **FAIL**, 15 existing `no-require-imports` errors in `.agents/skills` scripts (358 diagnostics including warnings). Those unrelated skill files were not changed.
- Local `npm run build`: **PASS**. Initial sandboxed build stalled; the normal network-enabled build passed.
- `git diff --check`: **PASS**.

The first HTTP attempts exposed QA harness mistakes: phone storage needed the existing local `08...` format, APPROVE idempotency keys cannot contain `:`, and impossible corrupt rows are rejected by existing PostgreSQL CHECK constraints. The harness was corrected to respect those contracts; no application guard or database constraint was weakened.

Local PostgreSQL is dedicated to this task, port 55629. HTTP fixture cleanup runs after the suite and selects only fresh `QA-PC-FINAL-*` scopes. Real login is tested locally; staging uses the existing application session signer to avoid `ensureDefaultUsers()` modifying unrelated accounts.

## Staging retest

Retest completed successfully on 2026-09-14; see the final proof below. Canonical project: `prj_ndtzHGjeAHNXT5w1d2de4GKztRr1`, Preview branch `feature/gorut-ui-redesign`.

Deployment snapshot is HEAD plus only seven runtime files: the transition, settlement and validation routes; their three services; and workflow pure logic. No source was staged, committed or pushed. No migration runs during build. The first remote build failed because the temporary upload filter omitted `MODUL GORUT TERBARU`, which the existing app imports; the filter was corrected without changing application code.

A subsequent Preview was READY but returned `503 PACKAGE_PROVISIONAL_POLICY_DISABLED`: CLI upload from an isolated source directory did not inherit the branch-scoped secret flags from Git metadata alone. A new Preview applies `GORUT_DEPLOYMENT_ENV=UAT` and `GORUT_ENABLE_PROVISIONAL_FEE_POLICY=true` as deployment-scoped runtime overrides. Project environment settings and production remain unchanged. The blocked attempt cleaned its QA fixture and restored all 20 model counts and SHA-256 row digests.

Evidence directory: `/private/tmp/gorut-final-debug`.

### Resume inspection — 2026-09-14

Historical inspection status, superseded by the successful final staging proof below.

The original evidence directory and `staging-run.log` are absent in this session. No replacement staging result was found in the workspace or the session temporary directory. The verification results above remain historical report evidence; the local suites were not rerun.

Read-only Vercel inspection confirms the latest existing Preview, `dpl_7iNpj798iPoQmr6LGyXYqd6L6EGR`, is READY on `feature/gorut-ui-redesign`:
https://piindung-ecosystem-8cgt-7k3lxvrcp-dsndihrdynsh-4735s-projects.vercel.app

Its creation follows the ERROR and READY attempts described above. This chronology is consistent with the override deployment, but build readiness does not establish successful runtime flags or final approval. A deployment-scoped runtime-log query from 2026-09-13 returned no rows. Existing CLI authentication received HTTP 403 when reading project environment metadata, so staging database access and an authenticated rerun could not be established. The workspace database configuration points to localhost and was not used as a staging substitute.

Staging retest completion is **UNVERIFIED**, not a confirmed failure or pass. Exactly one final PC event, final package state/version, immutable settlement/validation evidence, and restoration of the latest attempt's fixtures cannot be certified from the remaining evidence. The earlier blocked attempt's 20-model restoration is historical evidence for that attempt only.

- EXACTLY ONE FINAL EVENT: **NO — not verified for staging**; the historical local HTTP suite reported PASS.
- SAFE TO RESUME MUNFIQ UAT: **NO — staging final-approval verification remains unresolved**.
- No local tests, deployment, migration, or staging mutations were performed during this resume inspection. No files were staged, committed, or pushed.
- No staging temporary credential file was found in the inspected task/session locations, and none was created. In particular, the original `staging.env` location is absent. This confirms present absence, not when or by whom earlier credentials were removed. Existing application `.env` files and persistent CLI authentication were preserved.

Resume only the missing staging evidence/retest when the original artifacts or working canonical staging access become available; do not repeat local debugging.

### Final staging proof — 2026-09-14

**PASS**, completed at `2026-09-14T08:39:27.856Z` (15:39:27 WIB), on the existing canonical Preview `dpl_7iNpj798iPoQmr6LGyXYqd6L6EGR`. Vercel inspection confirms READY, non-production target, and branch `feature/gorut-ui-redesign`. No deployment, project environment change, migration, domain/state/action contract edit, staging, commit, or push was performed. Production was not touched.

Exact guard: `resolveGorutProvisionalFeeRuntime()` reads `GORUT_DEPLOYMENT_ENV` and the exact string `GORUT_ENABLE_PROVISIONAL_FEE_POLICY=true`; `assertGorutProvisionalFeePolicyAllowed()` requires UAT or STAGING and rejects a production host. `VERCEL_ENV=production` takes precedence over the explicit deployment environment. The workflow service maps rejection to `PACKAGE_PROVISIONAL_POLICY_DISABLED`. Branch-scoped Preview settings were pulled through the existing authenticated CLI. Sensitive flag values were not readable; successful authenticated settlement, validation, readiness, and APPROVE requests prove the deployed guard allows this non-production runtime. The prior deployment report records its UAT overrides.

The existing CLI authentication worked, restoring Preview/database access without changing credentials for existing UAT accounts. The official `createFinalApprovalQaFixture()` created a fresh scope `QA-PC-FINAL-PROOF-1789374999626` and temporary PC account. The existing application session signer issued its short-lived session, and `/api/auth/me` returned HTTP 200 with the exact fixture account ID. This verifies authenticated staging access; the login form was not retested because its `ensureDefaultUsers()` call can modify unrelated accounts.

Authenticated HTTP sequence on temporary package `GORUT-QA-PC-FINAL-PROOF-1789374999626-202609`:

- Settlement POST: **200**.
- Validation POST: **200**, **MATCHED**; final readiness READY and available actions `[APPROVE]`.
- APPROVE POST: **200**, database and response state **FINAL_APPROVED**, version **5 → 6**, revision unchanged.
- Exactly **one** PC final event; total package workflow events **2 → 3**.
- Settlement and validation rows remained deeply equal before and after final approval.
- Identical APPROVE replay: **200**, `idempotentReplay=true`; the entire package, event, settlement, and validation snapshot remained equal.
- Final GET: **200**, `FINAL_APPROVED`, `approved=true`, and no further available actions.

The official scoped cleanup removed the entire temporary fixture. Counts and SHA-256 digests for all **20 models** (User and all GORUT models) match the baseline exactly. Main package `GORUT-UAT-KEC-01-202609` remains **WAITING_PC_APPROVAL**, version **5**, revision **4**, with its full-row digest unchanged. Its status is intentionally preserved; FINAL_APPROVED above refers to the temporary QA package before cleanup.

Temporary `staging.env` was deleted after successful verification. Session/header and request files were deleted by the runner; no deployment env file remained. No secret was printed or copied into repository evidence.

Durable non-secret evidence, including HTTP statuses, version/event assertions, and all before/after model digests: [pc-final-approval-staging-2026-09-14.json](evidence/pc-final-approval-staging-2026-09-14.json). Runner and temporary non-secret artifacts: `/private/tmp/gorut-final-proof-6e6jp7qp`.

- PROVISIONAL FLAG: **PASS**
- AUTH ACCESS: **PASS**
- FINAL APPROVE HTTP: **PASS**
- FINAL STATE: **FINAL_APPROVED**
- EXACTLY ONE FINAL EVENT: **YES**
- REPLAY IDEMPOTENT: **YES**
- EXISTING DATA PRESERVED: **YES**
- SAFE TO RESUME MUNFIQ UAT: **YES**

## Boundary

This task enables and verifies PC final approval only. Munfiq UAT was not executed. Production was not deployed or mutated.
