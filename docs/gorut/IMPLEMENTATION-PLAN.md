# Rencana Implementasi Final GORUT

## 1. Acuan

- [BLUEPRINT-PENGHIMPUNAN.md](./BLUEPRINT-PENGHIMPUNAN.md)
- [MAPPING-DOKUMEN-ADMINISTRASI.md](./MAPPING-DOKUMEN-ADMINISTRASI.md)

## 2. Alur Data Dokumen

```text
F.009 per PLPK (rincian per Munfiq)
  → diverifikasi Kordes
  → menjadi sumber F.015 per desa
  → seluruh desa direkap menjadi F.010 oleh UPZIS
  → F.010 menjadi dasar F.016
  → F.016 diverifikasi PC
  → Selesai
```

## 3. Formula Kunci

Untuk setiap Munfiq:

- Nominal `> Rp7.000` → `Upah PLPK = Rp2.500`
- Nominal `<= Rp7.000` → `Upah PLPK = Rp0`

```text
Jumlah Kotor     = Σ nominal per Munfiq
Total Upah PLPK  = Σ upah PLPK per Munfiq
Jumlah Bersih    = Jumlah Kotor - Total Upah PLPK
Selisih          = nilai pembanding - nilai yang diterima/dicatat
```

Uang fisik selalu dibandingkan dengan `Jumlah Bersih` sistem. Selisih wajib memiliki: `nominal selisih`, `jenis selisih`, `alasan`, dan `tindakan penyelesaian`.

## 4. Spesifikasi Halaman

### 4.1 Dashboard

| Elemen | Ketentuan |
|---|---|
| Tujuan | Ringkasan status penghimpunan sesuai scope role |
| Role | Semua role |
| Data input | Pemilih periode, filter wilayah |
| Data ditampilkan | Status ringkasan: Munfiq aktif, kaleng terjemput, kaleng belum terjemput, jumlah dokumen per tahap, status per desa/kecamatan |
| Aksi utama | Navigasi ke halaman operasional terkait |
| Validasi | Scope wilayah role |
| Status masuk | N/A |
| Status keluar | N/A |
| Penanganan selisih | Highlight Selisih terbuka dan tindakan tertunda |
| Dokumen dibuat | Tidak ada |
| Dokumen diverifikasi | Tidak ada |
| Notifikasi | Batch PLPK belum terserahkan, Selisih > N hari, status dokumen berubah |
| Riwayat audit | Tidak ada |
| Kondisi selesai | N/A |

### 4.2 Munfiq

| Elemen | Ketentuan |
|---|---|
| Tujuan | Mengelola data Munfiq, kaleng, dan penugasan PLPK |
| Role | `admin_kordes`, `admin_upzis`, `admin_pc`, `super_admin_pc` |
| Data input | NIK, nama, alamat, gender, tanggal lahir, wilayah, kaleng aktif, PLPK penanggung jawab |
| Data ditampilkan | Tabel Munfiq, filter wilayah, status kaleng, riwayat Penjemputan |
| Aksi utama | Tambah/ubah/nonaktifkan Munfiq, alokasikan PLPK, ekspor data |
| Validasi | NIK unik, wilayah valid, PLPK tersedia dalam ranting/desa yang sama |
| Status masuk | N/A |
| Status keluar | `Munfiq Aktif`, `Munfiq Non-Aktif`, `Menunggu Penjemputan` |
| Penanganan selisih | Tidak ada |
| Dokumen dibuat | Tidak langsung; baris Munfiq menjadi bagian F.009 |
| Dokumen diverifikasi | Tidak ada |
| Notifikasi | Munfiq baru ditugaskan ke PLPK |
| Riwayat audit | Perubahan status Munfiq, perubahan alokasi PLPK |
| Kondisi selesai | Data Munfiq lengkap dan PLPK teralokasi |

### 4.3 Penjemputan PLPK

| Elemen | Ketentuan |
|---|---|
| Tujuan | Input hasil kunjungan PLPK ke Munfiq, menghasilkan F.009 |
| Role | `plpk` (target impl. lanjutan), `admin_kordes` |
| Data input | ID PLPK, periode, daftar Munfiq, status kunjungan, nominal per Munfiq, kaleng |
| Data ditampilkan | Daftar Munfiq milik PLPK, status kunjungan, nominal, kalkulasi otomatis `Jumlah Kotor`, `Upah PLPK`, `Jumlah Bersih` |
| Aksi utama | Ubah status kunjungan, input nominal, hitung ringkasan, serahkan ke Kordes |
| Validasi | Nominal ≥ 0, status kunjungan tidak boleh kosong, `Jumlah Kotor` dan `Jumlah Bersih` dicocokkan |
| Status masuk | `Dijadwalkan`, `Dijemput PLPK` |
| Status keluar | `Siap Verifikasi Kordes` |
| Penanganan selisih | PLPK mencatat `Selisih` jika ada perbedaan nominal yang diperdebatkan Munfiq; data tidak boleh dihapus |
| Dokumen dibuat | F.009 — Lembar Penerimaan Koin NU |
| Dokumen diverifikasi | Tidak pada tahap ini |
| Notifikasi | Batch terserahkan ke Kordes, PLPK menyelesaikan penugasan |
| Riwayat audit | Perubahan status kunjungan, nominal yang diubah, waktu penyerahan |
| Kondisi selesai | Seluruh Munfiq dalam batch memiliki status kunjungan final dan F.009 diserahkan ke Kordes |

### 4.4 Verifikasi Kordes

| Elemen | Ketentuan |
|---|---|
| Tujuan | Memverifikasi F.009 dari PLPK, mencocokkan uang fisik dan dokumen |
| Role | `admin_kordes` |
| Data input | F.009 dari PLPK, uang fisik, kaleng |
| Data ditampilkan | Daftar F.009 masuk, rincian per Munfiq, kalkulasi, Selisih, status per PLPK |
| Aksi utama | Cocokkan uang, verifikasi, terima bersyarat, kembalikan ke PLPK |
| Validasi | Uang fisik vs `Jumlah Bersih` dokumen vs sistem, kaleng terjemput vs daftar |
| Status masuk | `Siap Verifikasi Kordes` |
| Status keluar | `Terverifikasi Kordes`, `Terverifikasi Bersyarat`, `Dikembalikan ke PLPK` |
| Penanganan selisih | Catat Selisih, penyebab, bukti, jenis selisih, nilai final; tanda tangan pihak terkait; tidak boleh mengubah dokumen sumber tanpa jejak |
| Dokumen dibuat | F.009 terverifikasi (penandaan status), F.015 — Berita Acara Serah Terima Tingkat Desa |
| Dokumen diverifikasi | F.009 dari PLPK |
| Notifikasi | Kepada PLPK jika F.009 dikembalikan; ke UPZIS jika F.015 siap |
| Riwayat audit | Waktu verifikasi, aktor, keputusan, Selisih, koreksi |
| Kondisi selesai | Seluruh F.009 dari PLPK diverifikasi dan F.015 diserahkan kepada UPZIS |

### 4.5 Verifikasi UPZIS

| Elemen | Ketentuan |
|---|---|
| Tujuan | Memverifikasi F.015 dari Kordes, merangkum menjadi F.010, mempersiapkan F.016 |
| Role | `admin_upzis` |
| Data input | F.015 dari Kordes, uang fisik, kaleng |
| Data ditampilkan | Daftar desa/ranting, F.015 masuk, tabel rekap live F.010, Selisih per desa |
| Aksi utama | Verifikasi F.015, catat Selisih di F.010, buat F.016, ajukan penjemputan PC |
| Validasi | Uang fisik vs `Jumlah Bersih` F.010, kelengkapan seluruh desa, seluruh F.015 |
| Status masuk | `Menunggu Verifikasi UPZIS` (F.015) |
| Status keluar | `Belum Lengkap`, `Menunggu Verifikasi UPZIS`, `Ada Selisih`, `Terverifikasi UPZIS`, `Siap Dibuatkan F.016` |
| Penanganan selisih | Selisih dipisahkan per Kordes, desa, Munfiq, dan jenis; Selisih terbuka tetap tercatat dan tidak boleh dihapus; nilai sumber tidak diubah tanpa jejak |
| Dokumen dibuat | F.010 — Rekap Data Penerimaan Donasi Koin NU Tingkat Kecamatan; F.016 — Berita Acara Serah Terima Tingkat Kecamatan |
| Dokumen diverifikasi | F.015 dari Kordes |
| Notifikasi | Kepada Kordes jika F.015 dikembalikan; ke PC jika F.016 siap dan pengajuan penjemputan dikirim |
| Riwayat audit | Waktu, aktor, data F.015, kalkulasi F.010, Selisih, koreksi |
| Kondisi selesai | F.010 berstatus `Siap Dibuatkan F.016`, F.016 terbentuk, dan uang/kaleng siap diterima PC |

### 4.6 Penjemputan dan Verifikasi PC

| Elemen | Ketentuan |
|---|---|
| Tujuan | Menerima dan memverifikasi F.016 dan uang dari UPZIS, menutup periode |
| Role | `admin_pc`, `super_admin_pc` |
| Data input | F.016, uang fisik, kaleng, permintaan penjemputan |
| Data ditampilkan | Daftar kecamatan, F.016 masuk, tabel rekap seluruh kecamatan, Selisih per kecamatan |
| Aksi utama | Jadwalkan petugas penjemput, verifikasi uang dan F.016, terima bersyarat, kembalikan ke UPZIS |
| Validasi | Uang fisik vs `Total Jumlah Bersih` F.016, kelengkapan seluruh kecamatan, seluruh F.016 |
| Status masuk | `Siap Dibuatkan F.016`, `Menunggu Penjemputan PC` |
| Status keluar | `Diterima PC`, `Selesai`, `Terverifikasi Bersyarat`, `Dikembalikan ke UPZIS` |
| Penanganan selisih | Selisih diselesaikan melalui pemeriksaan berjenjang dan berita acara koreksi; Selisih belum selesai → status `Terverifikasi Bersyarat`, bukan `Selesai` |
| Dokumen dibuat | Rekap final PC, daftar Selisih terbuka/terselesaikan |
| Dokumen diverifikasi | F.016 dari UPZIS |
| Notifikasi | Kepada UPZIS jika dikembalikan; notifikasi penutupan periode |
| Riwayat audit | Jadwal penjemputan, petugas, waktu, aktor, keputusan, Selisih, koreksi final |
| Kondisi selesai | PC mengesahkan penerimaan, seluruh Selisih selesai atau mendapat keputusan final, dan periode tertutup |

### 4.7 Dokumen Administrasi

| Elemen | Ketentuan |
|---|---|
| Tujuan | Melihat, mengunduh, dan mengelola dokumen arsip (F.009, F.015, F.010, F.016) |
| Role | `admin_kordes`, `admin_upzis`, `admin_pc`, `super_admin_pc` |
| Data input | Nomor dokumen, periode, filter wilayah |
| Data ditampilkan | Daftar dokumen per kode berkas, status, wilayah, tanggal, nilai, Selisih |
| Aksi utama | Lihat pratinjau, unduh, cetak, lacak status mengambang |
| Validasi | Scope wilayah role; `plpk` hanya melihat F.009 miliknya |
| Status masuk | N/A |
| Status keluar | Tersedia sebagai arsip |
| Penanganan selisih | Menampilkan Selisih dari dokumen sumber |
| Dokumen dibuat | Tidak; halaman hanya menampilkan arsip |
| Dokumen diverifikasi | Tidak |
| Notifikasi | Dokumen baru tersedia |
| Riwayat audit | Log akses dokumen |
| Kondisi selesai | N/A |

### 4.8 Monitoring

| Elemen | Ketentuan |
|---|---|
| Tujuan | Live tracking posisi batch dan dokumen dalam alur penghimpunan |
| Role | `admin_upzis`, `admin_pc`, `super_admin_pc` |
| Data input | Periode, kecamatan, desa |
| Data ditampilkan | Status per desa (Munfiq → PLPK → Kordes → UPZIS → PC), dokumen mengambang, Selisih terbuka |
| Aksi utama | Drill-down ke batch/dokumen, ekspor status |
| Validasi | Scope wilayah role |
| Status masuk | N/A |
| Status keluar | Diperbarui berdasar perubahan status batch dan dokumen |
| Penanganan selisih | Highlight Selisih terbuka, umur Selisih, dan penanggung jawab |
| Dokumen dibuat | Tidak |
| Dokumen diverifikasi | Tidak |
| Notifikasi | Batch mengambang > N hari tanpa progres |
| Riwayat audit | Tidak langsung; data bersumber dari riwayat audit di tahap terkait |
| Kondisi selesai | N/A |

### 4.9 Laporan

| Elemen | Ketentuan |
|---|---|
| Tujuan | Rekapitulasi penghimpunan per periode, wilayah, dan dokumen |
| Role | `admin_upzis`, `admin_pc`, `super_admin_pc` |
| Data input | Periode, filter wilayah |
| Data ditampilkan | Total kaleng, Munfiq, PLPK, Jumlah Kotor, Upah PLPK, Jumlah Bersih, Selisih; breakdown per desa dan per kecamatan |
| Aksi utama | Ekspor ringkasan, unduh arsip dokumen batch |
| Validasi | Scope wilayah role |
| Status masuk | N/A |
| Status keluar | Laporan final |
| Penanganan selisih | Tabel Selisih per periode, jenis, desa, dan status penyelesaian |
| Dokumen dibuat | Tidak |
| Dokumen diverifikasi | Tidak |
| Notifikasi | Tidak |
| Riwayat audit | Tidak |
| Kondisi selesai | Laporan periode final tersedia |

## 5. Hubungan Data

```text
Munfiq (data induk)
  → batch PLPK (1 PLPK = banyak Munfiq)
    → F.009 (rincian batch PLPK)
      → F.015 (wadah F.009 per desa, Kordes → UPZIS)
        → F.010 (wadah F.015 per kecamatan, rekap UPZIS)
          → F.016 (wadah F.010, UPZIS → PC)
            → Selesai
```

Setiap dokumen di tingkat atas mereferensi dokumen di tingkat bawahnya:

- F.015 mencatat nomor F.009 sumber
- F.010 mencatat nomor F.015 sumber tiap baris desa
- F.016 mencatat nomor F.010 sumber

## 6. Fase Pengerjaan

### Fase 1 — Penjemputan PLPK dan F.009

| Elemen | Ketentuan |
|---|---|
| Scope | Halaman Penjemputan PLPK, manajemen Munfiq, pembuatan F.009, perhitungan otomatis `Jumlah Kotor`, `Upah PLPK`, `Jumlah Bersih` |
| Dependency | Data Munfiq dan PLPK tersedia |
| Acceptance criteria | PLPK dapat melihat daftar Munfiq wilayah tugasnya, menginput status kunjungan dan nominal, F.009 terbentuk dengan kalkulasi benar, batch terserahkan ke Kordes |
| Belum dikerjakan | Verifikasi Kordes, F.015, F.010, F.016, monitoring, laporan |

### Fase 2 — Verifikasi Kordes dan F.015

| Elemen | Ketentuan |
|---|---|
| Scope | Halaman Verifikasi Kordes, pencocokan uang fisik vs sistem, penanganan Selisih, pembuatan F.015, pengembalian ke PLPK |
| Dependency | Fase 1 selesai (F.009 terserahkan) |
| Acceptance criteria | Kordes dapat melihat F.009, mencocokkan uang dan kaleng, mencatat Selisih, memverifikasi atau mengembalikan, F.015 terbentuk, batch diteruskan ke UPZIS |
| Belum dikerjakan | Verifikasi UPZIS, F.010, F.016, monitoring, laporan |

### Fase 3 — Verifikasi UPZIS dan F.010

| Elemen | Ketentuan |
|---|---|
| Scope | Halaman Verifikasi UPZIS, rekap F.015 menjadi F.010, penanganan Selisih tingkat kecamatan, pengajuan penjemputan PC |
| Dependency | Fase 2 selesai (F.015 terserahkan ke UPZIS) |
| Acceptance criteria | UPZIS dapat melihat F.015 dari seluruh desa, F.010 terbentuk otomatis, Selisih tercatat per desa, status `Siap Dibuatkan F.016` tercapai, pengajuan penjemputan PC dikirim |
| Belum dikerjakan | Verifikasi PC, F.016, monitoring, laporan |

### Fase 4 — Penjemputan PC dan F.016

| Elemen | Ketentuan |
|---|---|
| Scope | Halaman Penjemputan dan Verifikasi PC, penjadwalan petugas, verifikasi F.016 dan uang, penanganan Selisih, penutupan periode |
| Dependency | Fase 3 selesai (F.010 siap, F.016 dibuat, pengajuan dikirim) |
| Acceptance criteria | PC dapat menjadwalkan petugas, memverifikasi uang dan F.016, menyelesaikan atau mencatat Selisih, menutup periode, laporan final tersedia |
| Belum dikerjakan | Monitoring real-time, laporan lintas-periode |

### Fase 5 — Dokumen, Monitoring, Laporan, dan Audit

| Elemen | Ketentuan |
|---|---|
| Scope | Halaman Dokumen Administrasi (arsip), Monitoring (live tracking), Laporan (rekapitulasi), dan Audit trail (riwayat lengkap) |
| Dependency | Fase 1–4 selesai (data mengalir) |
| Acceptance criteria | Semua dokumen dapat diunduh/dicetak, monitoring live seluruh alur, laporan lintas-periode lengkap, setiap aksi tercatat dalam audit trail |
| Belum dikerjakan | Tidak ada; ini fase final |

## 7. Status dan Alur

Status per batch:

```text
Batch dibuat
  → Dijadwalkan
  → Dijemput PLPK
  → Siap Verifikasi Kordes
  → Dikembalikan ke PLPK (opsional, loop)
  → Terverifikasi Kordes
  → Terverifikasi Bersyarat (Kordes)
  → Menunggu Verifikasi UPZIS
  → Dikembalikan ke Kordes (opsional, loop)
  → Terverifikasi UPZIS
  → Siap Dibuatkan F.016
  → Menunggu Penjemputan PC
  → Dikembalikan ke UPZIS (opsional, loop)
  → Diterima PC
  → Selesai
```

## 8. Batasan Implementasi

Rencana ini tidak mencakup generator PDF dan tidak mengusulkan perubahan pada source code, API, Prisma, database, autentikasi, atau komponen aplikasi yang sudah ada.
