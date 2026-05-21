# PIINDUNG / GORUT Progress Notes

## Current Direction

Fokus utama saat ini adalah membenahi modul `GORUT` sebagai sistem digitalisasi penghimpunan koin infaq berjenjang dari `Munfiq` sampai `PC` tingkat kabupaten, tanpa mengubah tema UI yang sudah dibuat.

Tema UI harus tetap:
- jangan redesign layout
- jangan ubah visual language utama
- perubahan difokuskan ke workflow, role, akses, status, dan mapping menu/halaman

## Business Workflow To Follow

Struktur alur penghimpunan yang harus jadi acuan:

`MUNFIQ -> PLPK -> RANTING -> UPZIS -> PC`

Penjelasan level:
- `Munfiq`: pemberi infaq
- `PLPK`: input penghimpunan, penjemputan, bukti, tanda terima
- `Ranting`: verifikasi tahap 1
- `UPZIS`: verifikasi tahap 2, monitoring kecamatan, rekap, evaluasi ranting
- `PC`: monitoring seluruh wilayah, dashboard besar, rekap akhir kabupaten

Prinsip utama sistem:
- data naik bertahap
- uang naik bertahap
- setiap perpindahan wajib verifikasi
- tidak boleh loncat level

## Workflow Status Target

Status transaksi penghimpunan yang diinginkan:

1. `DRAFT`
2. `INPUT PLPK`
3. `MENUNGGU VERIFIKASI RANTING`
4. `TERVERIFIKASI RANTING`
5. `MENUNGGU VERIFIKASI UPZIS`
6. `DISETUJUI UPZIS`
7. `MASUK REKAP PC`
8. `SELESAI`

## Minimal Transaction Fields

Data transaksi penghimpunan minimal harus punya:
- `kodeTransaksi`
- `munfiq`
- `plpk`
- `ranting`
- `upzis`
- `nominal`
- `metode`
- `tanggal`
- `statusWorkflow`
- `catatan`
- `bukti`
- `riwayatVerifikasi`

## Dashboard UPZIS Target

Dashboard `UPZIS` harus fokus ke:
- total penghimpunan hari ini
- total penghimpunan bulan ini
- pending verifikasi
- total munfiq aktif
- munfiq baru
- munfiq tidak aktif
- grafik penghimpunan
- ranking wilayah
- aktivitas terbaru

## Important Decisions Already Made

- UI theme tidak boleh berubah.
- Sidebar/component UI yang sudah ada tetap dipakai; perubahan dilakukan lewat source-of-truth navigasi dan logic halaman.
- Role operasional scoped per kecamatan harus tetap dijaga.
- `admin_upzis` sedang diarahkan menjadi role operasional kecamatan.
- Import `Munfiq` sekarang mendukung `CSV`, `XLSX`, dan `XLS`.
- Import `Munfiq` sekarang punya alur `upload -> preview -> konfirmasi -> simpan`.
- Untuk role scoped, data import dipaksa ke kecamatan assignment user.

## Latest Implemented Changes

### Navigation
- Navigasi GORUT dirapikan lewat `MODUL GORUT TERBARU/lib/gorut/navigation.ts`.
- Menu duplikat `Laporan` dihapus dari section analytics.
- `Setoran Koin` dihapus dari navigasi aktif.
- `Template WhatsApp` dibatasi ke `super_admin_pc` dan `admin_pc`.

### Admin UPZIS Sidebar
- Sidebar khusus `admin_upzis` sudah disesuaikan mengikuti permintaan atasan tanpa mengubah UI/UX komponen.
- Struktur saat ini untuk `admin_upzis`:
  - `Dashboard`
  - `Penghimpunan`
  - `Master`
  - `Pengaturan`

Mapping menu `admin_upzis` saat ini:
- `Dashboard UPZIS` -> `/gorut/dashboard`
- `Munfiq` -> `/gorut/munfiq`
- `Penghimpunan` -> `/gorut/transaksi`
- `Verifikasi` -> `/gorut/validasi`
- `Rekapitulasi` -> `/gorut/approval`
- `Laporan` -> `/gorut/laporan`
- `Wilayah` -> `/gorut/upzis`
- `PLPK` -> `/gorut/monitoring-plpk`
- `PAC / Ranting` -> `/gorut/ranting`
- `Kategori` -> `/gorut/archive`
- `User & Role` -> `/gorut/profil`
- `Pengaturan` -> `/gorut/pengaturan-akun`

Catatan penting:
- mapping di atas masih mapping sementara ke halaman existing terdekat
- belum semua halaman benar-benar sudah mencerminkan workflow bisnis final

### Munfiq Import
- File: `MODUL GORUT TERBARU/app/gorut/munfiq/page.tsx`
- Mendukung `.csv`, `.xlsx`, `.xls`
- Ada preview import sebelum commit
- Ada konfirmasi import
- Duplicate berdasarkan `id` atau `nik` akan replace data lama

## Known Gaps

- Sistem GORUT saat ini masih campuran antara workflow bisnis final dan halaman admin generik lama.
- Beberapa nama menu sudah disesuaikan, tetapi isi halaman belum semuanya mengikuti makna bisnis baru.
- `Kategori` belum punya halaman kategori murni; sementara diarahkan ke `/gorut/archive`.
- `Rekapitulasi` sementara diarahkan ke `/gorut/approval`, belum tentu final.
- Role `PLPK` dan `Ranting` sebagai workflow level utama belum dipetakan penuh di sistem akses saat ini.
- Dashboard UPZIS belum sepenuhnya mengikuti KPI target yang sudah didefinisikan.

## Recommended Next Steps For Next Session

Urutan kerja yang direkomendasikan:

1. Buat blueprint final `role -> hak akses -> menu -> tindakan` untuk:
   - `PLPK`
   - `Ranting`
   - `UPZIS`
   - `PC`
2. Definisikan state machine workflow transaksi:
   - status valid
   - siapa yang boleh memindahkan status
   - kondisi penolakan / revisi
3. Audit halaman GORUT existing dan mapping ke fungsi bisnis yang benar.
4. Rapikan dashboard `UPZIS` sesuai KPI target tanpa mengubah tema UI.
5. Pisahkan dengan jelas:
   - input penghimpunan
   - verifikasi ranting
   - verifikasi UPZIS
   - rekap PC

## Verification Status

Perubahan terakhir sudah diverifikasi dengan:

`npm run build`

dan hasilnya sukses.
