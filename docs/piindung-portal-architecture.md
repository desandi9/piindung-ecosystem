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

## Self-Service Profile and Account Settings

PIINDUNG self-service profile and account settings own authenticated profile presentation, safe profile updates (name, normalized email, phone), password verification and change, audit of personal changes, and accurate session behavior (cookie removal) after password change.

- **Editable Fields:** Authenticated users may update `name`, `email`, and `phone` via a strict allowlist GET/PATCH `/api/account/profile`.
- **Rejected Fields:** Attempts to update `id`, `memberId`, `role`, `status`, `permissions`, `modules`, `grants`, `passwordHash`, or operational scope return `400`.
- **Avatar Upload:** Since no secure, sandboxed application asset storage exists, custom avatar upload is deferred. The UI presents initials fallback or reads from existing safe `/uploads/` URLs.
- **Password Verification:** Password updates must verify the current password using `bcrypt` and verify minimum policy constraints (8+ characters) before updating the hash.
- **Session Behavior:** Changing password clears the current session cookie (`piindung-session`) immediately. Other device sessions remain active.
- **Server Audit:** Profile and password mutations are audited to `portal-user-audit` scope in transactions without logging credentials.
- **Authority:** Self-service pages read directly from `/api/account/profile` instead of admin-scoped `managed-users`.

## PIINDUNG User Management and Module Assignment Boundary

PIINDUNG secara eksklusif memiliki data identitas pengguna terpusat, autentikasi sesi, organisasi role global, status keaktifan akun, metadata unit organisasi pendukung, dan izin masuk modul (*module-entry permissions*).

Sistem menerapkan aturan perlindungan dan pembatasan berikut:
- **Soft Deactivation & Deny-by-Default:** Pengguna yang dinonaktifkan (`status !== "Aktif"`) secara otomatis diblokir dari autentikasi maupun akses masuk ke seluruh portal dan modul operasional. Akun tidak pernah dihapus secara permanen (*no hard deletion*) untuk menjaga integritas riwayat transaksi dan audit.
- **Last-Super-Admin Invariant:** Mutasi yang menyebabkan jumlah Super Admin PC aktif bernilai kurang dari satu akan ditolak. Super Admin juga dilarang menurunkan perannya sendiri (*self-demotion*) atau menonaktifkan akun sendiri (*self-deactivation*).
- **Module Assignment Boundary:** Assignment modul (seperti pintu masuk ke GORUT) dikonfigurasi menggunakan *portal-module-grants* yang diakses melalui hak akses. Grant ini hanya memvalidasi pintu masuk pertama. Modul GORUT mempertahankan peran, wilayah cakupan kerja operasional, dan alur validasi transaksi secara internal tanpa mencampuri data portal terpusat.
- **Audit Trails:** Seluruh aksi pembuatan pengguna, pengubahan status/role, serta pemberian grant dicatat secara aman dalam scope audit server-side (`portal-user-audit` dan `portal-access-audit`) yang tidak dapat dimutasi dari API publik.

## Identitas Anggota dan Verifikasi Publik

- PIINDUNG menerbitkan `memberId` pusat yang unik, stabil, tidak dapat diubah melalui API pengguna, dan tidak dipakai ulang. Migrasi menambahkan kolom unik ini serta membackfill seluruh akun yang telah ada tanpa mereset tabel User.
- QR identitas hanya berisi URL verifikasi publik kanonis `/verify/{memberId}`; QR tidak memuat token, email, telepon, peran operasional, grant modul, atau data operasional.
- Halaman verifikasi publik hanya menampilkan nama, member ID, label role organisasi, status akun, organisasi, dan waktu pemeriksaan. Status akun tetap bersumber dari database: `Aktif`, `Menunggu`, atau `Nonaktif`.
- Verifikasi adalah pemeriksaan pendaftaran identitas PIINDUNG, bukan sertifikasi identitas pemerintah atau pernyataan legal.
- Tidak ada direktori anggota publik, pencarian anggota publik, atau data operasional GORUT pada halaman verifikasi.
- URL QR menggunakan `SITE_URL` or `NEXT_PUBLIC_SITE_URL`. Konfigurasi produksi wajib memakai origin HTTPS tepercaya; fallback localhost hanya berlaku pada development.

## PIINDUNG Portal Notifications and Auditing (Batch 4F)

Sistem notifikasi portal, peninjau audit, dan aktivitas akun diimplementasikan dengan pemisahan batas data yang jelas antara portal PIINDUNG dan modul operasional GORUT:

- **Portal Notification Ownership:** Portal memiliki kendali atas pengiriman notifikasi bertipe `general`, `security`, `account`, `access`, dan `system`. Notifikasi operasional (transaksi, nominal, persetujuan detail, dll.) dikelola penuh secara internal oleh modul masing-masing.
- **Audience Types:** Notifikasi dikirimkan dengan model target `all` (semua pengguna aktif), `role` (satu peran tertentu), dan `user` (satu pengguna tertentu). Sistem menghindari duplikasi record per pengguna saat menyiarkan notifikasi umum.
- **Auditing and Account Activity:** Aktivitas akun (`/member-area/aktivitas`) menyajikan riwayat log aman yang difilter di sisi database berdasarkan ID target pengguna. Log ini menampilkan label dan deskripsi ringkas tanpa memuat data sensitif (password, email lama/baru lengkap, session token, atau payload mentah JSON).
- **Super Admin Notification Management & Audit Viewer:** Super Admin memiliki kontrol penuh (`notifications.manage` dan `/member-area/notifikasi`) untuk menerbitkan notifikasi portal baru, mengatur kedaluwarsa, dan melakukan penarikan (*withdrawal*) tanpa hard delete. Halaman audit (`/member-area/audit`) menyajikan agregasi log audit portal secara terpusat dengan filtrasi terarah.
- **Persistence & Protected Scopes:** Data disimpan menggunakan model database Prisma `PortalNotification` dan `PortalNotificationReceipt` terindeks. Scope internal sensitif seperti `portal-user-audit`, `portal-access-audit`, dan `portal-notification-audit` terlindungi secara mutlak dari API generic records generik.
- **No Real-Time Infrastructure:** Batch 4F tidak menyertakan WebSockets atau real-time polling server agresif. UI notifikasi memuat data saat halaman dimuat atau dimutasi.
- **Navigation Safety:** Menu navigasi utama tetap dipertahankan sebanyak empat tujuan awal tanpa perubahan. Rute khusus seperti notifikasi, aktivitas, dan audit diakses melalui sub-link sekunder atau dashboard widget.
