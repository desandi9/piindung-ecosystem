# UAT roster completion — 7 September 2026

Target package: `GORUT-UAT-KEC-01-202609`.

The user authorized completion of September collections for UAT-R02 and UAT-R03 through PLPK input → confirm/submit → Kordes verification, followed by UPZIS UAT if SUBMIT became available. Existing fixture scenario amounts were used. Collection and Kordes notes explicitly identify these as UAT simulations.

Execution used existing canonical server commands against the dedicated canonical Preview database, with existing active actor assignments and module grants validated from DB. The local command used explicit UAT provisional-policy runtime; no remote configuration, workflow logic or gate was changed. This is server/service UAT, not a new authenticated browser/HTTP test; temporary login credentials had already been deleted in the prior session.

## Collection evidence

| Ranting | Collection | PLPK actor | Kordes actor | Entry amounts | Gross | PLPK fee | Net | Result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| R01 | GORUT-COL-UAT-P01-202609 | Existing prior evidence | Existing prior evidence | 15000 / 12500 / 5000 | 32500 | 5000 | 27500 | PASS; existing collection facts unchanged |
| R02 | GORUT-COL-UAT-P03-202609 | PID-CCCCCCCCD234 | PID-BBBBBBBBC234 | M007=8000 / M008=6000 / M009=10000 | 24000 | 5000 | 19000 | PASS at 21:17:33 WIB |
| R03 | GORUT-COL-UAT-P04-202609 | PID-CCCCCCCCE234 | PID-BBBBBBBBD234 | M010=4000 / M011=7500 / M012=11000 | 22500 | 5000 | 17500 | PASS at 21:19:01 WIB |

Each new collection followed the canonical seven-revision sequence: CREATE; three RECORD_ENTRY revisions; CONFIRM_AND_SUBMIT; VERIFY_BY_KORDES; BRIDGE_TRANSACTION. Both are VERIFIED_BY_KORDES / READY at version 7, with matching collection/transaction source hashes and the expected PLPK/Kordes actors. Each verification created its transaction bridge and updated the same target package with no reconciliation blockers. No exclusion, fake zero collection, manual package insertion, or hierarchy change was used.

R03 first encountered a transient DB connection failure during actor lookup, before any mutation. Retrying the same command succeeded; no completed collection step was duplicated.

## Roster and SUBMIT acceptance

At 21:19:25 WIB, the canonical package list and detail services, evaluated for the actual UPZIS Maker assignment, confirmed:

```json
{
  "packageCode": "GORUT-UAT-KEC-01-202609",
  "version": 3,
  "state": "DRAFT",
  "financialStatus": "READY",
  "includedRantings": ["UAT-R01", "UAT-R02", "UAT-R03"],
  "transactionCount": 3,
  "munfiqCount": 9,
  "grossAmount": "79000.00",
  "totalPlpkFee": "15000.00",
  "netAmount": "64000.00",
  "availableActions": ["SUBMIT"],
  "blockingReasons": []
}
```

All roster completion acceptance assertions passed. The prior materializer timeout fix remains local and was used by these canonical reconciliation commands; no redeploy was performed.

## UPZIS continuation

- 21:19:48 WIB: Maker `PID-AAAAAAAAB234` SUBMIT succeeded, package version 3 → 4, revision 4, state `WAITING_UPZIS_VERIFICATION`. Roster frozen with all three included Rantings active at cutoff.
- 21:19:50 WIB: the same Maker's APPROVE attempt was rejected with `PACKAGE_MAKER_CHECKER_VIOLATION`. Version remained 4, state unchanged, workflow event count remained one.
- 21:19:55 WIB: distinct Checker `PID-AAAAAAAAC234` APPROVE succeeded, version 4 → 5, state `WAITING_PC_APPROVAL`, financial READY.
- 21:20:00 WIB: canonical detail verified three INCLUDED Rantings, three memberships, unchanged totals 79000.00 / 15000.00 / 64000.00, and exactly two events in the UPZIS stage: SUBMIT, APPROVE. R01 collection facts remained unchanged.

R01 PASS; R02 PASS; R03 PASS; ROSTER COMPLETE YES; UPZIS SUBMIT AVAILABLE YES at the pre-submit checkpoint; SAFE TO RESUME UPZIS UAT YES, and the authorized UPZIS happy path has now completed.

The current state is `WAITING_PC_APPROVAL`, so SUBMIT is no longer available after its successful execution. PC and Munfiq UAT were not run; there was no settlement, validation, or finalization action.

No workflow/gate edits, migration, seed, redeploy, stage, commit, or push were performed. Previously passed regression work was not repeated; verification consisted of the newly requested server actions and canonical DB/read-model assertions.

Cleanup completed: the pulled credential environment, temporary command script, baseline snapshot and raw audit outputs were deleted. Their temporary directory was confirmed absent. This document retains only non-secret evidence.
