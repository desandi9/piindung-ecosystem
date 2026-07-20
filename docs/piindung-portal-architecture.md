# Arsitektur Portal PIINDUNG

## Batas sistem

PIINDUNG adalah portal pusat dan penghubung ekosistem. Portal menyediakan identitas akun serta titik masuk yang aman, bukan tempat menjalankan proses operasional modul.

## Tanggung jawab Portal PIINDUNG

- profil publik dan landing page
- autentikasi
- identitas pengguna
- status akun
- verifikasi
- notifikasi umum
- aktivitas akun terbaru
- bantuan dan kontak
- profil
- Member Area
- launcher akses modul

Konten publik tetap dikelola dan ditampilkan pada rute publiknya. Konten tersebut bukan bagian dari dashboard pengguna yang telah masuk.

## Tanggung jawab modul operasional

Setiap modul operasional memiliki dan melindungi:

- transaksi
- validasi
- persetujuan
- pelaporan
- catatan operasional
- cakupan wilayah khusus modul
- izin khusus modul
- alur kerja khusus modul

GORUT tetap menangani operasi pengumpulan koin di dalam rute dan batas otorisasinya sendiri. PIINDUNG hanya menyediakan launcher presentasional untuk modul nyata yang aktif. Rute modul tetap menjadi batas otorisasi operasional. Hibah modul per pengguna yang lebih terperinci ditunda ke Batch 4B. Tidak ada implementasi E-Tasyaruf atau modul masa depan yang dinyatakan tersedia oleh arsitektur ini.

## Lapisan akses

### PIINDUNG

Sebelum memberi akses ke portal atau launcher, PIINDUNG memvalidasi:

1. sesi pengguna telah terautentikasi;
2. akun pengguna aktif;
3. pengguna memiliki izin untuk memasuki modul yang dituju.

Menyembunyikan tautan atau kartu bukan mekanisme otorisasi.

### Modul operasional

Setelah pengguna memasuki modul, modul tersebut tetap memvalidasi:

1. peran operasional;
2. izin operasional;
3. wilayah atau cakupan yang ditetapkan;
4. data yang boleh dilihat;
5. tindakan yang boleh dilakukan.

Validasi portal tidak menggantikan validasi server-side dan pembatasan data milik modul.

## Member Area

Member Area memisahkan launcher modul dari alat pengelolaan PIINDUNG. Semua pengguna aktif dapat membuka landing Member Area, tetapi subrute dan kartu pengelolaan tetap dibatasi untuk Super Admin pada Batch 4A. Detail Hak Akses, termasuk akses artikel untuk Admin PC, ditunda ke Batch 4B.

## PIINDUNG Portal Permission Matrix

Berikut adalah matriks hak akses/izin untuk setiap peran pengguna di portal PIINDUNG:

| Izin / Fitur | Super Admin PC (`super_admin_pc`) | Admin PC (`admin_pc`) | Admin UPZIS (`admin_upzis`) | Admin Kordes (`admin_kordes`) |
| :--- | :---: | :---: | :---: | :---: |
| `dashboard.view` | Ya | Ya | Ya | Ya |
| `member_area.view` | Ya | Ya | Ya | Ya |
| `profile.view` | Ya | Ya | Ya | Ya |
| `help.view` | Ya | Ya | Ya | Ya |
| `notifications.view` | Ya | Ya | Ya | Ya |
| `articles.manage` | Ya | Ya | Tidak | Tidak |
| `users.manage` | Ya | Tidak | Tidak | Tidak |
| `access.manage` | Ya | Tidak | Tidak | Tidak |
| `settings.manage` | Ya | Tidak | Tidak | Tidak |
| `audit.view` | Ya | Tidak | Tidak | Tidak |
| *PIINDUNG Management Permissions (homepage, products, impact, gallery, downloads, help_content, contact, branding)* | Ya | Tidak | Tidak | Tidak |

### Admin PC Article-Management Boundary

Admin PC (`admin_pc`) memiliki akses khusus ke `articles.manage` untuk mengelola artikel publik. Namun, Admin PC dibatasi dan **tidak** menerima izin pengelolaan portal sistem lainnya seperti `users.manage`, `access.manage`, `settings.manage`, atau `audit.view`.

### Per-User Module-Entry Grants

Akses masuk ke modul operasional (seperti GORUT) dikonfigurasi per pengguna:
- **Super Admin PC** secara default selalu memiliki akses masuk (`modules.gorut.enter`).
- **Peran Lain (Admin PC, UPZIS, Kordes)** memerlukan persetujuan eksplisit berupa *module entry grant* yang diaktifkan secara per-user oleh administrator melalui pengelolaan hak akses.
- Jika pengguna dinonaktifkan (`status !== "Aktif"`), seluruh akses portal maupun modul diblokir secara mutlak.
- PIINDUNG grant hanya mengatur pintu masuk modul (module entry). GORUT dan modul operasional lain mempertahankan peran operasional, cakupan data (scope), dan otorisasi tindakan secara internal dan independen.

### Proteksi Generic Record Scopes & Deny-by-Default

- Semua *scopes* data sensitif portal seperti `portal-module-grants` dan `portal-access-audit` ditolak secara eksplisit dari API generik `app/api/records/[scope]/route.ts` dan `app/api/records/[scope]/[key]/route.ts`. Segala bentuk akses mutasi atau pembacaan harus melalui endpoint aman terdedikasi yaitu `/api/portal-access/me` dan `/api/portal-access/grants`.
- Sistem menerapkan kebijakan *deny-by-default* untuk rute portal:
  - Rute `/member-area` hanya mengizinkan peran terdaftar yang aktif.
  - Rute `/member-area/konten/artikel` dan subrutenya hanya mengizinkan peran dengan izin `articles.manage` atau peran Super Admin.
  - Rute `/member-area/hak-akses` memerlukan `access.manage`.
  - Rute `/member-area/pengguna` memerlukan `users.manage`.
  - Rute `/member-area/**` lain yang tidak dikenali atau tidak memiliki pemetaan kebijakan otorisasi akan otomatis ditolak.
