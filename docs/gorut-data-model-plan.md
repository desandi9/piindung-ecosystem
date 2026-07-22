# GORUT Data Model Discovery and Migration Plan

## 1. Current State Findings

### 1.1 Prisma Schema

The active `prisma/schema.prisma` is small and serves central PIINDUNG requirements rather than structured GORUT data.

**Current Models:**
- `User`: Identity/auth table holding member ID, phone, email, bcrypt hash, free-form `role`, and free-form `status`.
- `PortalNotification` / `PortalNotificationReceipt`: Typed notification history system with `actionPath` and complex audiences.
- `AppRecord`: Generic `(scope, key, data)` JSON store used heavily for configurations, audit logs, portal access grants, and legacy GORUT state.

**Limitations:**
- No GORUT-specific relational models exist.
- Operational roles (`admin_upzis`, `admin_kordes`, etc.) are untyped strings in the `User` table, with assignment logic layered on top via `AppRecord` scope `user-operational-scope`.
- All financial numbers currently persisted via `AppRecord` are serialized as untyped JSON arrays or integers.

### 1.2 Legacy GORUT Data in AppRecord

The `AppRecord` table contains several scopes starting with `gorut-`, acting as a mock persistence layer for the current UI iteration. These records date from July 10, 2026:

| Scope | Source count | Classification | Valid | Unresolved | Malformed | Conflict | Normalized destination | Current disposition |
|---|---:|---|---:|---:|---:|---:|---|---|
| `gorut-announcements` | 7 | Legacy GORUT presentation content | 0 | 7 | 0 | 0 | None | Preserved; not operational authority |
| `gorut-kordes-upzis` | 4 | Potential legacy GORUT wilayah summary | 4 | 0 | 0 | 0 | `GorutKecamatan`/`GorutRanting` | Source preserved; hierarchy only where deterministic |
| `gorut-munfiq` | 10 | Potential legacy GORUT Munfiq | 0 | 10 | 0 | 0 | `GorutMunfiq` | Not imported; authoritative PLPK relationship unavailable |
| `gorut-munfiq-plpk` | 5 | Potential legacy GORUT Munfiq/PLPK relation | 0 | 5 | 0 | 0 | `GorutMunfiq` | Not imported; relationship identity unresolved |
| `gorut-penghimpunan-verification` | 1 | Legacy GORUT verification compatibility state | 0 | 1 | 0 | 0 | `GorutWorkflowEvent` | Not imported; no transaction authority |
| `gorut-plpk-kordes` | 5 | Potential legacy GORUT PLPK hierarchy | 5 | 0 | 0 | 0 | `GorutPlpk` | Imported idempotently |
| **Total** | **32** |  | **9** | **23** | **0** | **0** |  |  |

The table intentionally excludes `user-operational-scope` because it is shared assignment infrastructure rather than one of the six discovered `gorut-*` scopes. Its single record was inspected during backfill but not imported because its current assignment shape does not satisfy the normalized role/scope contract.

The `gorut-munfiq`, `gorut-munfiq-plpk`, `gorut-plpk-kordes`, and `gorut-kordes-upzis` scopes contain presentation-level strings and mock financial figures. For instance, `gorut-munfiq` contains an object mapping `plpk` explicitly by name rather than ID.

### 1.3 Browser Storage Findings

Two keys are actively used by GORUT application code:

1. **`gorut-dashboard-entry`** (`sessionStorage`)
   - **Classification:** Harmless UI transition state.
   - **Action:** Retain. Coordinates a 1.4s dashboard welcome animation.

2. **`gorut-account-profile`** (`localStorage`)
   - **Classification:** Duplicate profile authority with misleading security flags (`twoFactor`, `loginAlert`).
   - **Action:** Retain only as explicitly non-authoritative demo persistence. Remove the implication that security settings configured here apply to the PIINDUNG backend. Replace identity persistence with the server session/user context in Batch 5B-2.

---

## 2. Proposed Entity Relationship Structure

GORUT requires a relational model tracking the geographic hierarchy (Wilayah), personnel assignments (Roles), donors (Munfiq), and financial transactions.

### 2.1 Proposed Prisma Models

```prisma
model GorutWilayah {
  id         String   @id @default(cuid())
  type       String   // "kecamatan", "desa_ranting"
  name       String
  parentId   String?  // References GorutWilayah(id) for desa -> kecamatan
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  parent     GorutWilayah?  @relation("WilayahHierarchy", fields: [parentId], references: [id], onDelete: Restrict)
  children   GorutWilayah[] @relation("WilayahHierarchy")

  // Relations to assignments and transactions will exist here
  @@unique([type, name])
  @@index([parentId])
}

model GorutPlpk {
  id         String   @id @default(cuid())
  code       String   @unique // e.g. "PG-Q030001"
  name       String
  phone      String
  wilayahId  String   // References GorutWilayah(id) for the Ranting/Desa
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  wilayah    GorutWilayah @relation(fields: [wilayahId], references: [id], onDelete: Restrict)

  @@index([wilayahId])
}

model GorutMunfiq {
  id            String   @id @default(cuid())
  code          String   @unique // e.g. "GK00100001"
  nik           String   @unique
  name          String
  phone         String
  address       String
  gender        String   // "L" or "P"
  birthDate     DateTime?
  wilayahId     String   // References Ranting
  plpkId        String   // References GorutPlpk
  isActive      Boolean  @default(true)
  joinedAt      DateTime @default(now())
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  wilayah       GorutWilayah @relation(fields: [wilayahId], references: [id], onDelete: Restrict)
  plpk          GorutPlpk    @relation(fields: [plpkId], references: [id], onDelete: Restrict)

  @@index([wilayahId])
  @@index([plpkId])
}

model GorutTransaction {
  id              String   @id @default(cuid())
  code            String   @unique // e.g. "TRX-..."
  transactionDate DateTime // Stripped to Date
  totalAmount     Decimal  @db.Decimal(19, 2)
  sourceChannel   String   // "tunai", "transfer", "qris"
  notes           String?
  currentState    String   // Workflow enum state
  wilayahId       String   // Ranting context
  plpkId          String   // PLPK context
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  wilayah         GorutWilayah @relation(fields: [wilayahId], references: [id], onDelete: Restrict)
  plpk            GorutPlpk    @relation(fields: [plpkId], references: [id], onDelete: Restrict)

  items           GorutTransactionItem[]
  history         GorutWorkflowEvent[]

  @@index([currentState, transactionDate])
  @@index([wilayahId])
  @@index([plpkId])
}

model GorutTransactionItem {
  id            String   @id @default(cuid())
  transactionId String
  munfiqId      String
  amount        Decimal  @db.Decimal(19, 2)
  periodLabel   String?  // Optional target period
  notes         String?

  transaction   GorutTransaction @relation(fields: [transactionId], references: [id], onDelete: Cascade)
  munfiq        GorutMunfiq      @relation(fields: [munfiqId], references: [id], onDelete: Restrict)

  @@index([transactionId])
  @@index([munfiqId])
}

model GorutWorkflowEvent {
  id            String   @id @default(cuid())
  transactionId String
  action        String   // "submit", "approve", "return", "reject", "final_close"
  stage         String   // "plpk", "ranting", "upzis", "pc"
  status        String   // "approved", "rejected", "pending"
  notes         String?
  actorId       String   // References User.id
  actorRole     String
  timestamp     DateTime @default(now())

  transaction   GorutTransaction @relation(fields: [transactionId], references: [id], onDelete: Cascade)
  // Actor relation intentionally soft to allow preserving history if User is archived
  @@index([transactionId])
}
```

### 2.2 Schema Definitions and Justifications

- **Financial Precision:** Using `Decimal(19, 2)` instead of `Float` to prevent precision loss during financial aggregation.
- **Hierarchical Wilayah:** Solves the current issue of duplicated text labels ("Pakuwon", "Garut Kota") by linking `GorutMunfiq`, `GorutPlpk`, and `GorutTransaction` to a canonical `GorutWilayah`.
- **Workflow History Append-Only:** `GorutWorkflowEvent` preserves the actor and notes at each validation gate, regardless of subsequent returns or edits.

---

## 3. Role and Scope Matrix

The GORUT module separates the global identity role (`AppRole`) from the specific geographic constraint.

**Global Roles:**
- `super_admin_pc`, `admin_pc`: Bypass scope filters. See all Wilayah.

**Scoped Roles:**
- `admin_upzis`: Constrained to a specific Kecamatan string (stored in `AppRecord` as `user-operational-scope`).
- `admin_kordes`: Constrained to a specific Desa/Ranting string within a Kecamatan.
- `plpk`: A specialized UI perspective. PLPK access represents a user whose credentials match a `GorutPlpk` record's phone/identity constraints.

**Fail-Closed Behavior:**
Any scoped role accessing a GORUT route without an active `user-operational-scope` assignment will receive a `403 Forbidden` response.

---

## 4. Transaction State Machine

The transaction lifecycle follows sequential validation barriers:

| Source State | Action | Resulting State | Required Scope | Notes |
|---|---|---|---|---|
| `DRAFT` | `submit` | `WAITING_RANTING` | `plpk` | Transition from draft entry |
| `WAITING_RANTING` | `approve` | `WAITING_UPZIS` | `admin_kordes` | Validation by Ranting/Kordes |
| `WAITING_RANTING` | `return` | `RETURNED` | `admin_kordes` | Requires notes; goes back to PLPK |
| `WAITING_UPZIS` | `approve` | `WAITING_PC` | `admin_upzis` | Validation by UPZIS |
| `WAITING_UPZIS` | `return` | `WAITING_RANTING` | `admin_upzis` | Returns to previous stage |
| `WAITING_PC` | `final_close` | `FINAL_APPROVED` | `admin_pc` | Enters reporting totals |
| (Any WAITING) | `reject` | `REJECTED` | Scope owner | Requires reason; terminal |
| `RETURNED` | `submit` | `WAITING_RANTING` | `plpk` | Re-submission after correction |

Only `FINAL_APPROVED` records contribute to the `GorutRekapDana` financial totals.

---

## 5. Reporting and Monitoring Authority

**Values Derived from Database Transactions:**
- Total final-approved amount (filtered by `FINAL_APPROVED` and date range)
- Pending by stage counts (grouping `currentState`)
- Monthly comparison targets
- Top contributors (Munfiq grouping)

**Unsupported Infrastructure Metrics:**
Currently, `monitoring/page.tsx` displays metrics such as Response Time, Uptime, Replication Lag, Connection Pool, and WhatsApp Gateway status. These values are currently hardcoded UI state. Because there is no existing system gathering real database telemetry or WhatsApp gateway metrics, these fields must be explicitly documented as `unavailable` or removed entirely from the UI during server integration to prevent fabrication.

---

## 6. Migration and Backfill Sequence

When the database model is implemented (Batch 5C), the legacy UI data must be migrated in the following order:

1. **Seed Reference Tables:** Create `GorutWilayah` for the 44 Kecamatan and known Ranting.
2. **Migrate PLPKs:** Map `gorut-plpk-kordes` JSON records into the `GorutPlpk` table.
3. **Migrate Munfiq:** Map `gorut-munfiq` JSON records to `GorutMunfiq`, linking them to the matched `GorutPlpk` and `GorutWilayah`.
4. **Migrate Transactions:** Generate `GorutTransaction` and `GorutTransactionItem` records from `gorut-transaksi`, parsing `totalAmount` to Decimal. Map string statuses to the new enum format.
5. **Generate Workflow History:** Create synthetic `GorutWorkflowEvent` entries denoting the historical creation/approval of the migrated transactions to satisfy append-only history requirements.
6. **Switch-Over:** Modify `app/api/gorut/*` routes to point to Prisma CRUD operations rather than `AppRecord`.

_Invalid records missing critical links (e.g., unknown Wilayah) will be quarantined rather than silently dropped._

---

## 7. Future API Contracts

The following root API endpoints will be created in Batch 5B:

1. **`GET /api/gorut/dashboard`**
   - **Scope:** Inherits authenticated user's assignment.
   - **Response:** Aggregated dashboard totals, recent activities.
2. **`GET /api/gorut/plpk-dashboard`**
   - **Scope:** `plpk` constraints only.
   - **Response:** `PlpkDashboardPayload` (munfiq array, transaction list).
3. **`GET /api/gorut/munfiq`**
   - **Scope:** Inherits user's assignment.
   - **Params:** `page`, `pageSize`, `search`, `status`.
   - **Response:** Paginated array of `GorutMunfiq` serialized safely.
4. **`GET /api/gorut/transactions`** (and `POST/PATCH` for drafts)
   - **Scope:** Inherits user's assignment.
   - **Params:** Pagination, `status` filter, `search`.
5. **`GET /api/gorut/monitoring`**
   - **Scope:** PC / Dashboard.
   - **Response:** Pending stats, distribution, empty infrastructure metrics.
6. **`GET /api/gorut/reports`**
   - **Scope:** Inherits user's assignment.
   - **Params:** `month`, `kecamatan`.
   - **Response:** Aggregated hierarchical groupings.

**Universal Constraints:** All endpoints require an active PIINDUNG session, return `403 Forbidden` if scope resolution fails, and include `Cache-Control: private, no-store`.

---

## 8. Batch 5B-1 Implementation Record

- Migration: `20260722193143_add_normalized_gorut_schema` (additive: four PostgreSQL enums and eight normalized GORUT tables).
- Implemented enums: `GorutOperationalRole`, `GorutTransactionState`, `GorutWorkflowStage`, and `GorutWorkflowAction`.
- Implemented models: `GorutKecamatan`, `GorutRanting`, `GorutPlpk`, `GorutOperationalAssignment`, `GorutMunfiq`, `GorutTransaction`, `GorutTransactionItem`, and `GorutWorkflowEvent`.
- Financial fields use `Decimal(19,2)`; parent and historical relations use `Restrict`, including transaction items and workflow events.
- Legacy idempotency uses nullable `legacyScope` / `legacyKey` unique pairs for imported PLPK, Munfiq, and transaction records. The current local source has no legacy normalized transaction scope, so no financial rows were created.
- Backfill command: `node scripts/backfill-gorut-normalized.mjs`; write mode requires `GORUT_BACKFILL_ACK=local-development node scripts/backfill-gorut-normalized.mjs --apply` and rejects non-local database hosts.
- Dry-run results: 5 valid PLPK source rows; 10 Munfiq, 5 Munfiq-PLPK, and 1 verification source record unresolved because their legacy payloads do not provide authoritative relational identifiers. No source records were changed.
- First local apply: 1 kecamatan, 5 ranting, and 5 PLPK records created; no transactions, items, workflow events, Munfiq, or assignments were fabricated.
- Second local apply: zero inserts and five unchanged PLPK records; AppRecord source count remained 32.
- Follow-up hardening migration: `20260722194748_harden_gorut_assignment_constraints`. It adds a role/scope `CHECK` constraint and a partial expression unique index for active assignments without changing the already-applied normalized-schema migration.
- Assignment contract: PC has no scope foreign key; UPZIS requires only `kecamatanId`; RANTING requires only `rantingId`; PLPK requires only `plpkId`.
- Migration reality: the normalized-schema and hardening migrations were applied only to the local development database. No pre-existing AppRecord row was updated or deleted.
- Sixteen operational legacy records remain unresolved: 10 Munfiq, 5 Munfiq-PLPK relationship rows, and 1 verification record. No Munfiq, transaction, item, assignment, or workflow record was guessed.
- Current normalized counts: 1 kecamatan, 5 ranting, 5 PLPK, and zero Munfiq, transaction, item, assignment, or workflow records.
- Safety limitations before Batch 5B-2: normalized reads must fail closed for missing assignments; unresolved legacy data cannot become operational authority; transactions must be created only through validated server mutations; and AppRecord must not be used for financial aggregation.
- Compatibility: AppRecord stays intact and remains only a migration source. API and client migration remain Batch 5B-2 work.

## 9. Next Steps (Batch 5B-2 Checklist)

- [ ] Create `lib/gorut-api-server.ts` implementing `requireGorutSession` and `pageParams`.
- [ ] Create `lib/gorut-data-server.ts` providing scoped reads from the existing `AppRecord` legacy data as a transitionary step.
- [ ] Implement `GET /api/gorut/dashboard` and `/plpk-dashboard`.
- [ ] Implement paginated `/api/gorut/munfiq` and `/api/gorut/transactions`.
- [ ] Implement `GET /api/gorut/monitoring` (omitting fabricated infrastructure stats).
- [ ] Implement `GET /api/gorut/reports` with server-side hierarchical grouping.
- [ ] Write integration test cases verifying role boundary enforcement.
