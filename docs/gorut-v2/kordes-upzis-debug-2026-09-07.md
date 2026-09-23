# Kordes → UPZIS focused debug — 7 September 2026

Target collection: `GORUT-COL-UAT-P01-202609`.
Target package: `GORUT-UAT-KEC-01-202609`.
Canonical deployment: `dpl_9v738CfYDZ1zkb5HQy9z3nGX53xC`.

**Later update:** roster coverage was completed through the user-authorized R02/R03 collection flows. UPZIS SUBMIT and Checker APPROVE passed; package is now WAITING_PC_APPROVAL. See [completion evidence](uat-roster-completion-2026-09-07.md). The earlier NO below describes the original checkpoint.

## Prior session evidence retained; PASS work not rerun

- Initial failed boundary B: collection was `VERIFIED_BY_KORDES / READY`, revision/version 7. `TRX-GORUT-COL-UAT-P01-202609` existed, but package and membership did not. Collection source hash matched its transaction source hash. UPZIS list returned HTTP 200 with `items:[]`, `total:0`.
- Materializer rollback diagnostic found no data/policy blocker. Historical VERIFY exception was unavailable in Vercel logs.
- Isolated PostgreSQL regression reproduced Prisma `P2028`: transaction elapsed 5,103 ms exceeded the default 5,000 ms window. This proves a code failure mode consistent with staging, but does not conclusively identify the historical staging exception.
- Existing local fix: materializer Serializable transaction uses `maxWait: 10_000`, `timeout: 60_000`. Verification and bridge commit independently of package materialization, so a materializer failure can leave factual verification and the bridge intact.
- Focused PostgreSQL suite: 9/9 PASS, including latency >5 seconds, concurrent/idempotent reconciliation, period isolation, fail-closed gates, factual verification preservation, correction, and maker-checker. TypeScript, scoped ESLint and diff check PASS. Three PC tests accidentally selected by an earlier filter failed; they were outside this focused scope and were not fixed or relabeled PASS.
- At 14:55 WIB, canonical `reconcileVerifiedCollection` using the local fix returned bridge `EXISTING`, package `CREATED`, financial `READY`, no blockers. Replay returned `EXISTING / EXISTING`, `idempotentReplay:true`. No collection facts changed. Package origin `COLLECTION_BRIDGE`, DRAFT, version/revision 1, one membership, no workflow events. Gross 32500.00, fee 5000.00, net 27500.00.

## Resume session: previously pending staging HTTP checks

At 21:00:21 WIB (2026-09-07T14:00:21.845Z), using a real UPZIS Maker login on the same canonical deployment:

- `GET /api/auth/me`: HTTP 200, `[UAT] UPZIS Maker`, role `admin_upzis`.
- `GET /api/gorut/packages?page=1&pageSize=10`: HTTP 200, `total:1`; target package is present, period `2026-09`, Kecamatan `UAT-KEC-01`, origin `COLLECTION_BRIDGE`, `DRAFT / READY`, version/revision 1, one transaction, three Munfiq, gross 32500.00, fee 5000.00, net 27500.00. Financial blockers empty; formula and region consistency true.
- `GET /api/gorut/packages/GORUT-UAT-KEC-01-202609`: HTTP 200 at 21:01:00 WIB. Source collection remains verified, revision 7, reconciliation READY, collection source hash equals transaction source hash, financial source revision matches, workflow history empty.

Package visibility is now PASS. UPZIS SUBMIT is still blocked:

```json
{"currentState":"DRAFT","version":1,"availableActions":[],"blockingReasons":["ROSTER_COVERAGE_INCOMPLETE"]}
```

Detail contains only included coverage `UAT-R01`; no exclusions, no frozen roster. Workflow eligibility compares coverage rows with all active Rantings in the Kecamatan (`lib/gorut-package-workflow-server.ts`). Summary `unresolved:0` counts existing UNRESOLVED rows and does not prove that all active Rantings are covered (`completenessEvaluated:false`). Missing coverage must be resolved through legitimate collection/coverage workflow with documented exclusion reasons where applicable. No synthetic coverage or package was created in this resume session.

## Outcome and limits

SAFE TO RESUME UPZIS UAT: **NO** for the submission flow until roster coverage is resolved. Package list/detail inspection is available.

The timeout fix remains local and undeployed. The earlier staging reconciliation used that local fix; the deployed VERIFY path has not been retested with the fix. This resume session ran no migration, seed, redeploy, stage, commit, push, reconciliation mutation, or package transition. PC/Munfiq UAT was not continued.

Cleanup completed: logout HTTP 200, retest browser closed, all eight saved `gorut-uat-*` authentication profiles deleted, ten GORUT browser metadata files removed, retest Chrome profile and current temporary directory removed. Prior `/private/tmp/gorut-package-debug.IDn54v` (including `canonical.env`) and `/private/tmp/gorut-staging-uat.env` were already absent and were confirmed absent. No temporary credentials were retained in this evidence document.
