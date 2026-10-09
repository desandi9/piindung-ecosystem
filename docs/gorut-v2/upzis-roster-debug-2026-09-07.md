# UPZIS roster coverage debug — 7 September 2026

Target: `GORUT-UAT-KEC-01-202609`, Kecamatan `UAT-KEC-01`, September 2026.

**Subsequently resolved at 21:20 WIB:** the user authorized R02/R03 collection processing. All three Rantings are covered; SUBMIT became available; Maker SUBMIT and Checker APPROVE passed. Current package state is WAITING_PC_APPROVAL. See [completion evidence](uat-roster-completion-2026-09-07.md). Findings below preserve the earlier audit state.

## Read-only staging DB evidence

Audit timestamp: 2026-09-07T14:07:33.452Z (21:07 WIB). Database URL was retrieved from explicit canonical Vercel Preview project `prj_ndtzHGjeAHNXT5w1d2de4GKztRr1`, branch `feature/gorut-ui-redesign`. Queries ran in a PostgreSQL `READ ONLY` transaction. Vercel masks the deployment policy flags on env pull; they were not overwritten.

| Ranting | Active | Active PLPK | Munfiq | Active Kordes assignment | September collections / transactions | Package coverage |
| --- | --- | --- | --- | --- | --- | --- |
| UAT-R01 — Ranting Boundary | Yes | UAT-P01, UAT-P02 | 6 | Present | One VERIFIED/READY collection; one authoritative bridge transaction | INCLUDED |
| UAT-R02 — Ranting Correction | Yes | UAT-P03 | 3 | Present | None / none | Missing |
| UAT-R03 — Ranting Scope | Yes | UAT-P04 | 3 | Present | None / none | Missing |

Expected active Rantings: `UAT-R01`, `UAT-R02`, `UAT-R03`.
Current coverage: `UAT-R01` only, INCLUDED; no EXCLUDED rows.
Exact missing: `UAT-R02`, `UAT-R03`.

Package remains DRAFT, financial READY, version/revision 1, gross 32500.00, fee 5000.00, net 27500.00, one membership, no workflow events, unfrozen roster. Its sole source is `GORUT-COL-UAT-P01-202609` via `TRX-GORUT-COL-UAT-P01-202609`.

## Root cause

The evidence does **not** support either an incomplete seed hierarchy or a materializer omission. All three intended Rantings, their PLPK/Munfiq hierarchy and Kordes assignments exist. Neither missing Ranting has a September collection or transaction for the materializer to include. The materializer correctly derives INCLUDED coverage from eligible verified collection transactions. The workflow gate correctly requires every active Ranting to have valid coverage before SUBMIT.

The UAT process has completed only the R01 collection path. The happy-path runbook previously jumped from verifying one PLPK collection to expecting SUBMIT without explaining the other active Rantings. That runbook gap has been corrected in `staging-uat-release-candidate.md`.

Absence of a collection does not prove a Ranting did not operate. Seed planned amounts and scenario names are not confirmation of collection facts or an exclusion decision. No source, zero-amount collection, automatic exclusion, hierarchy deactivation, or weakened gate was created to make the test pass.

## Verification

At 2026-09-07T14:10:09.338Z, the existing canonical `getGorutPackageWorkflowAvailability` service was evaluated against staging data within a READ ONLY transaction using the real active UPZIS Maker assignment and explicit UAT test policy. This checks local server logic against DB facts; it is not a new authenticated HTTP retest and does not change deployed runtime policy.

Assertions passed:

```json
{"availableActions":[],"blockingReasons":["ROSTER_COVERAGE_INCOMPLETE"]}
```

The previously completed timeout regression and staging package visibility PASS results were not rerun. No new seed/materializer code fix is warranted by this evidence; no new code regression is claimed. No migration, seed, redeploy, stage, commit, push, package transition, PC UAT or Munfiq UAT was performed.

## Required operational input

For each of `UAT-R02` and `UAT-R03`, the user must establish whether to execute the actual approved UAT collection facts through PLPK → Kordes or whether a legitimate package exclusion applies. An exclusion requires its real operational reason and decision/reference. This clarification was requested; no answer has been assumed.

UPZIS RETEST: **FAIL** against the requested READY + SUBMIT acceptance criterion; financial READY already holds, SUBMIT remains unavailable.

SAFE TO RESUME UPZIS UAT: **NO** until those roster facts are resolved through the existing authoritative workflow.

Cleanup: temporary audit scripts, audit JSON, and the pulled credential environment were deleted; the temporary directory was confirmed absent. Durable evidence above contains no credential values.
