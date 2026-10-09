# PC operational access — focused debug, 8 September 2026

Canonical Preview project: `prj_ndtzHGjeAHNXT5w1d2de4GKztRr1`, branch `feature/gorut-ui-redesign`.
Deployment: `dpl_9v738CfYDZ1zkb5HQy9z3nGX53xC`.
Target: `GORUT-UAT-KEC-01-202609`.

## Account and failed boundary

Read-only staging audit at 11:45:50 WIB:

- PC user: `[UAT] PC Final Approval`, public memberId `PID-DDDDDDDDA234`.
- Login: documented `628990010010`, stored canonical phone `08990010010`.
- User status: `Aktif`; AppRole: `super_admin_pc`; GORUT module grant: enabled.
- Last login recorded: `2026-09-07T19:41:32.194Z` (8 September, 02:41:32 WIB).
- Operational assignments: **zero**, including inactive assignments.
- Failed boundary: **no assignment**, not inactive/expired, role mismatch, duplicate, or package query scope.

`requireGorutContext()` in `lib/gorut/server.ts` verifies the session, looks up its User, requires active account status, and queries up to two active operational assignments. `resolveOperationalContext()` in `lib/gorut/server-pure.ts` requires exactly one assignment. Zero rows therefore yield the reported 403, `Akses operasional GORUT tidak tersedia.` AppRole is not an authorization fallback here.

For PC, canonical assignment validity means role `PC` and all three scope IDs null. The assignment schema has `isActive` and creation/update timestamps; it has no validity-start/expiry fields. Once resolved, `packageReadScopeWhere()` permits PC's cross-Kecamatan package read scope.

## Root cause and minimal fix

`scripts/seed-gorut-v2-uat.mjs` defined the PC login actor with operational `role: null`. `upsertAssignment()` skipped it, and auth fixture verification also skipped its operational checks. The seed counted an active AppRole account as PC readiness without proving operational access.

Local fix defines PC operational role explicitly, inserts/reactivates its all-null scope assignment, counts `pcAssignmentCount`, and requires exactly one active canonical PC assignment during fixture auth verification. Guard, package queries, workflow, and AppRole remain unchanged.

At 11:49:38 WIB, a targeted Serializable staging transaction created only the missing PC assignment (`cmts6x7g30002o02yzermp97i`). It checked exact user identity, expected account role/status, absence of conflicting assignments, and full package equality before/after. No full seed, password change, collection/package mutation, migration, or redeployment was performed on staging.

## Tests and verification

- RED: isolated PostgreSQL regression reproduced zero PC assignments with the previous seed.
- GREEN: PostgreSQL integration suite passed with canonical PC assignment, rollback/idempotence, missing/inactive/wrong-role/ambiguous active assignment rejection, and reactivation without duplication.
- Fixture guard/unit tests: 7/7 passed.
- Existing operational guard/scope unit tests: 5/5 passed.
- Total: 13/13 tests passed, none skipped in the final runs. Scoped ESLint and `git diff --check` passed.

At 11:52:51 WIB, the actual staging assignment resolved to PC and `listGorutPackages()` returned `total: 1`, with the target `WAITING_PC_APPROVAL`, version 5, revision 4, financial READY, three included Rantings, three transactions, nine Munfiq, gross 79000.00 / fee 15000.00 / net 64000.00. Full package row remained equal to the baseline. This used local canonical services inside a PostgreSQL READ ONLY transaction; nested read snapshots reused that transaction. It is **not an authenticated staging HTTP retest**. Pulled sensitive policy values remain placeholders, so local action-availability policy blockers are not evidence about deployed policy configuration.

STAGING RETEST: service read PASS; authenticated `GET /api/gorut/packages` HTTP 200 **pending**. No PC password/session is available locally. User was asked for a local credential-file path or permission to use a temporary PC-only password and restore the original hash. Neither answer has arrived. A temporary retest script is prepared with account checks, real login, `/api/auth/me`, package GET, original password restoration, logout, and credential-file cleanup, but has not run.

SAFE TO RESUME PC UAT: **NO**, pending the requested authenticated HTTP acceptance check. This is a verification hold; the missing assignment has been repaired. No settlement/Munfiq continuation, stage, commit, or push was performed.

Cleanup: isolated PostgreSQL test server stopped; pulled Preview credential file deleted. No password/session credentials were generated or retained. The prepared retest script contains no secret and requires fresh Preview environment retrieval before execution.
