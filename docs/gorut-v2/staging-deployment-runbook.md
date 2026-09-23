# GORUT V2 — Staging Deployment Runbook

Runbook ini hanya untuk staging/UAT. Runbook ini tidak mengesahkan policy provisional sebagai SOP resmi dan tidak memberi izin deployment atau migration production.

## Build dan migration contract

RC1 sebelumnya mempunyai chain berikut:

```text
Vercel Preview build
→ npm run build
→ prisma migrate deploy
→ prisma generate
→ next build
```

Dengan chain tersebut, setiap Vercel Preview yang memakai build command default dapat menjalankan mutation migration segera setelah `DATABASE_URL` tersedia. Tidak ada guard yang membuktikan target tersebut non-production sebelum migration dimulai.

Contract staging yang berlaku setelah hardening:

```text
npm run build
→ prisma generate
→ next build
```

Build tidak menjalankan migration dan tidak boleh digunakan sebagai migration hook. Migration adalah langkah deployment terkontrol yang terpisah:

```text
npm run gorut:staging:migrate
→ fail-closed staging/UAT guard
→ prisma migrate deploy

npm run gorut:staging:migrate:status
→ fail-closed staging/UAT guard
→ prisma migrate status
```

Jangan menggunakan `prisma db push`, `prisma migrate dev`, atau `prisma migrate reset` pada staging/UAT.

## Keputusan manusia yang wajib sebelum deployment

Owner harus menetapkan tepat satu `CANONICAL_GORUT_STAGING_PROJECT`. Nama ini adalah keputusan deployment yang dicatat dalam evidence, bukan nilai yang boleh ditebak oleh script.

Candidate saat ini:

- `piindung-ecosystem-8cgt`
- `piindung-ecosystem`

Jangan disconnect atau menghapus salah satu project tanpa approval manusia. Sebelum lanjut, checklist berikut harus lengkap:

- [ ] canonical Vercel staging project dikonfirmasi;
- [ ] environment yang dipakai adalah Preview/non-production;
- [ ] branch mapping `feature/gorut-ui-redesign` dikonfirmasi;
- [ ] exact commit deployment dikonfirmasi;
- [ ] production project diidentifikasi terpisah dan tidak menjadi target;
- [ ] tidak ada automatic promotion ke production.

## Database staging/UAT contract

Database harus memenuhi seluruh syarat berikut:

- dedicated PostgreSQL staging/UAT;
- bukan production database;
- bukan writable replica atau write target production;
- mempunyai identity database yang terpisah dan dicatat secara redacted pada deployment evidence;
- Prisma migration diterapkan secara eksplisit setelah verifikasi manusia;
- fixture hanya boleh dijalankan setelah verifikasi non-production selesai.

Prisma schema repo ini hanya membaca `DATABASE_URL`; tidak ada `DIRECT_URL` atau env Prisma lain yang diwajibkan oleh schema saat ini.

Required Preview environment:

```text
GORUT_DEPLOYMENT_ENV=STAGING
GORUT_ENABLE_PROVISIONAL_FEE_POLICY=true
DATABASE_URL=<staging secret>
```

Controlled migration juga memerlukan acknowledgement non-secret berikut, yang hanya boleh dipasang setelah owner memverifikasi target DB:

```text
GORUT_NON_PRODUCTION_DB_CONFIRMED=true
```

Acknowledgement tersebut bukan bukti otomatis bahwa database aman; nilainya hanya merekam konfirmasi eksplisit operator setelah pemeriksaan target dilakukan di luar script. Guard tidak menebak keamanan database dari hostname dan tidak mem-parse URL untuk menentukan production/non-production.

Guard akan fail closed jika environment bukan `STAGING`/`UAT`, `VERCEL_ENV=production`, `DATABASE_URL` tidak tersedia, atau acknowledgement verifikasi belum tepat. Credential dan URL database tidak boleh dicetak atau disimpan di repository. `GORUT_ENABLE_PROVISIONAL_FEE_POLICY=true` tetap diperlukan oleh runtime RC staging/UAT, tetapi bukan permission gate migration agar database safety tidak terikat permanen pada satu business feature.

## Preview Authentication

Vercel Authentication tetap aktif. UAT internal dilakukan melalui protected Preview dan setiap tester harus mempunyai authorized access ke project/Preview yang canonical. Jangan menambahkan bypass secret, token, atau credential ke repository.

## Urutan deployment

1. Konfirmasi satu canonical Vercel project dari dua candidate dan catat keputusan owner.
2. Konfirmasi dedicated database non-production; catat environment, host class/provider, dan database identity secara redacted. Jangan lanjut jika target masih ambigu.
3. Konfigurasikan Preview env pada project canonical. Pastikan production env tidak diubah.
4. Hanya pada controlled migration command/environment, set `GORUT_NON_PRODUCTION_DB_CONFIRMED=true` setelah verifikasi manusia, lalu dari exact RC commit yang bersih jalankan `npm run gorut:staging:migrate`.
5. Jalankan `npm run gorut:staging:migrate:status` dengan guard yang sama; simpan hasil bahwa seluruh migration sudah applied.
6. Deploy/redeploy exact commit ke Preview project canonical tanpa promotion production.
7. Jika database memang khusus UAT, jalankan guarded fixture sesuai `staging-uat-release-candidate.md` dan verifikasi idempotency.
8. Login ke protected Preview menggunakan akun Vercel yang authorized.
9. Jalankan post-deploy smoke test aplikasi, API/read model, provisional fee, financial, workflow, maker-checker, PC boundary, RETURN/correction, dan invalid gates.
10. Eksekusi seluruh human UAT checklist di `staging-uat-release-candidate.md` dan catat `PASS`, `FAIL`, `BLOCKED`, atau `NEEDS BUSINESS REVIEW`.

## Evidence minimum

Catat tanpa membocorkan secret:

- canonical project dan Preview deployment identifier/URL;
- branch dan exact commit;
- deployment timestamp dan actor;
- redacted database identity serta bukti keputusan non-production;
- migration deploy/status result;
- fixture result dan idempotency result;
- Preview environment contract;
- smoke dan human UAT result;
- konfirmasi bahwa production tidak disentuh.
