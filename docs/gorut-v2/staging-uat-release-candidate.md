# GORUT V2 — Staging/UAT Release Candidate

Dokumen ini hanya untuk staging/UAT. Policy fee bukan SOP resmi, tidak membawa metadata persetujuan resmi, dan tidak mengizinkan workflow production.

## Environment contract

Policy `GORUT-PLPK-FEE-V1-PROVISIONAL` aktif hanya jika kedua kondisi berikut benar:

```text
GORUT_DEPLOYMENT_ENV=STAGING
# atau GORUT_DEPLOYMENT_ENV=UAT

GORUT_ENABLE_PROVISIONAL_FEE_POLICY=true
```

Nilai lain, flag yang tidak ada/false, `GORUT_DEPLOYMENT_ENV=PRODUCTION`, atau `VERCEL_ENV=production` harus fail-closed. Jangan simpan nilai `DATABASE_URL`, `AUTH_SECRET`, password, token, atau secret lain di repository.

API dan UI harus menampilkan authority policy persis sebagai `PROVISIONAL_PENDING_SOP_CONFIRMATION`. Istilah finansial canonical:

- Gross / Total Penghimpunan: total authoritative collection sebelum bisyaroh.
- Bisyaroh PLPK: Rp2.500 untuk setiap Munfiq/kaleng dengan aggregate authoritative collected amount per periode lebih besar dari Rp7.000.
- Net / Bersih: Gross dikurangi Bisyaroh PLPK; nominal bersih operasional menuju Cabang dalam contract provisional saat ini.
- `GorutTransaction.totalAmount`: tetap `Jumlah Tercatat`, bukan reinterpretasi gross atau net.

## Data UAT non-production

Fixture idempotent menyediakan satu Kecamatan, tiga Ranting, empat PLPK, dua belas Munfiq, tiga Kordes, empat PLPK actor, dan dua UPZIS actor untuk maker-checker. Fixture tidak membuat collection/transaksi dan tidak mengambil data production.

Jalankan hanya setelah database staging/UAT non-production dikonfirmasi:

```sh
GORUT_DEPLOYMENT_ENV=UAT \
GORUT_ENABLE_PROVISIONAL_FEE_POLICY=true \
GORUT_UAT_FIXTURE_CONFIRM=NON_PRODUCTION_ONLY \
GORUT_UAT_FIXTURE_PASSWORD='<runtime-only-password-minimum-12-chars>' \
npm run uat:seed:gorut-v2
```

Ganti `UAT` dengan `STAGING` bila targetnya staging. Jangan menaruh password aktual pada file atau shell history bersama. Nomor login sintetis dicetak oleh script; password tidak pernah dicetak.

Dataset utama:

- `UAT-KEC-01`
- Ranting `UAT-R01`, `UAT-R02`, `UAT-R03`
- PLPK `UAT-P01`–`UAT-P04`
- Munfiq `UAT-M001`–`UAT-M012`
- Maker `628990010001`; checker `628990010002`
- Financial example `UAT-M001=15.000`, `UAT-M002=12.500`, `UAT-M003=5.000`
- Boundary `UAT-M004=7.000`, `UAT-M005=7.001`; `UAT-M006=9.000`
- Correction `UAT-M007=8.000`, `UAT-M008=6.000`, `UAT-M009=10.000`

## Evidence yang dicatat setiap scenario

- timestamp, actor/member ID, Kecamatan/Ranting/PLPK, package/collection code;
- request/action dan HTTP status atau pesan UI;
- version sebelum/sesudah, source hash sebelum/sesudah;
- gross, Bisyaroh PLPK, net, financial status, available actions, blocking reasons;
- workflow event sequence, actor, previous/resulting state, reason/reason code.

## Scenario 1 — Fee boundary

- [ ] Login sebagai PLPK Boundary (`628990010007`), buat authoritative collection untuk periode UAT baru.
- [ ] Catat `UAT-M004` sebagai `COLLECTED` Rp7.000.
- [ ] Verifikasi snapshot: `eligibleForPlpkFee=false`, `plpkFee=0`, policy version provisional.
- [ ] Catat `UAT-M005` sebagai `COLLECTED` Rp7.001.
- [ ] Verifikasi snapshot: `eligibleForPlpkFee=true`, `plpkFee=2500`, policy version provisional.
- [ ] Verifikasi gross Rp14.001, total Bisyaroh Rp2.500, net Rp11.501, `financialStatus=READY` setelah semua entry selesai.

## Scenario 2 — Garut financial example

- [ ] Login sebagai PLPK Financial (`628990010006`) dan gunakan `UAT-M001`–`UAT-M003`.
- [ ] Catat nominal authoritative: Rp15.000, Rp12.500, Rp5.000.
- [ ] Verifikasi Gross Rp32.500.
- [ ] Verifikasi dua Munfiq eligible dan total Bisyaroh PLPK Rp5.000.
- [ ] Verifikasi Net/Bersih Rp27.500 dan `financialStatus=READY`.
- [ ] Verifikasi label authority `PROVISIONAL_PENDING_SOP_CONFIRMATION` di API/UI.

## Scenario 3 — Happy path minimum Phase 2B

- [ ] PLPK membuat authoritative collection, menyelesaikan semua entry, lalu confirm.
- [ ] Kordes scope yang sesuai melakukan verify; pastikan transaction bridge tercipta dan source hash cocok.
- [ ] Pastikan package berada pada `DRAFT` dengan financial `READY`, coverage resolved, dan `availableActions=[SUBMIT]` untuk UPZIS.
- [ ] Actor A (`628990010001`) melakukan `SUBMIT` dengan version current.
- [ ] Pastikan state `WAITING_UPZIS_VERIFICATION` dan workflow event `SUBMIT` tercatat.
- [ ] Actor B (`628990010002`) melakukan `APPROVE` dengan version current.
- [ ] Pastikan state `WAITING_PC_APPROVAL`, workflow event `APPROVE` tercatat, dan tidak ada PC finalization.

## Scenario 4 — Maker-checker

- [ ] Actor A melakukan `SUBMIT`.
- [ ] Actor A mencoba `APPROVE` pada package yang sama.
- [ ] Verifikasi server menolak dengan maker-checker blocker; state/version tidak berubah dan tidak ada event approval palsu.
- [ ] Actor B pada Kecamatan yang sama membuka ulang canonical detail.
- [ ] Verifikasi `APPROVE` tersedia bila seluruh gate lain terpenuhi, lalu approval berhasil.

## Scenario 5 — Return/correction

- [ ] Pada `WAITING_UPZIS_VERIFICATION`, actor checker melakukan `RETURN` dengan reason code, reason, dan correction target collection/Munfiq yang tepat.
- [ ] Verifikasi state `RETURNED_TO_RANTING`, correction `OPEN`, dan event RETURN lengkap.
- [ ] Login sebagai PLPK Correction (`628990010008`), perbaiki hanya target yang dikembalikan.
- [ ] Verifikasi correction resolved secara traceable, revision bertambah, source hash berubah, dan financial dihitung ulang.
- [ ] Kordes Correction (`628990010004`) melakukan re-verification.
- [ ] Verifikasi transaction/package reconciliation memakai source hash terbaru.
- [ ] Actor UPZIS melakukan resubmit dengan version terbaru.
- [ ] Verifikasi state kembali `WAITING_UPZIS_VERIFICATION`; history lama tidak ditimpa.

## Scenario 6 — Invalid submit

Untuk setiap baris, mulai dari canonical package yang sesuai dan kirim `SUBMIT` dengan expected version eksplisit:

- [ ] financial `BLOCKED` → ditolak.
- [ ] correction masih `OPEN` → ditolak.
- [ ] coverage `UNRESOLVED` → ditolak.
- [ ] source hash drift → ditolak.
- [ ] Kordes verification belum ada → ditolak.
- [ ] actor di luar Kecamatan → ditolak.
- [ ] expected version stale → ditolak.
- [ ] Untuk semua penolakan: state/version tidak berubah dan tidak ada success event.

## Scenario 7 — PC boundary

- [ ] Buka package pada `WAITING_PC_APPROVAL` sebagai PC/read-only consumer.
- [ ] Verifikasi `availableActions=[]`.
- [ ] Verifikasi blocking reason `PC_FINALIZATION_OUT_OF_SCOPE`.
- [ ] Coba command `FINAL_CLOSE` dan `REJECT`; server harus menolak.
- [ ] Coba endpoint mutasi Setoran dan Validasi; server harus menolak sebagai out of scope.
- [ ] Verifikasi F.011 tidak executable dan F.016 tidak diterbitkan.

## Production safety verification

- [ ] `PRODUCTION` + flag `true` → policy tidak aktif.
- [ ] `VERCEL_ENV=production`, sekalipun deployment env `STAGING` + flag `true` → policy tidak aktif.
- [ ] `STAGING` + flag `false` → policy tidak aktif.
- [ ] `UAT` + flag `false` → policy tidak aktif.
- [ ] `STAGING` + flag `true` → policy aktif.
- [ ] `UAT` + flag `true` → policy aktif.

Release candidate ini tidak mengizinkan `FINAL_CLOSE`, `REJECT`, PC finalization, Setoran mutation, Validasi mutation, F.011, F.016, atau production fee enable.
