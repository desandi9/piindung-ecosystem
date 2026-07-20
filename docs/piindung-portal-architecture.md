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
