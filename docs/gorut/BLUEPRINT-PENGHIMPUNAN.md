# Blueprint Penghimpunan GORUT

## 1. Tujuan dan Batasan

Blueprint ini menetapkan alur administrasi penghimpunan koin NU dari Munfiq sampai penyelesaian di tingkat PC. Dokumen ini bersifat blueprint operasional dan tidak mengubah source code, API, Prisma, atau database aplikasi.

## 2. Alur Utama

```text
Munfiq
  → Penjemputan oleh PLPK
  → Verifikasi Kordes
  → Verifikasi UPZIS
  → Penjemputan dan Verifikasi PC
  → Selesai
```

Istilah wajib:

- **Penjemputan:** pengambilan kaleng dan/atau uang dari titik yang tercatat.
- **Penghimpunan:** rangkaian pencatatan nominal Munfiq, penggabungan `Jumlah Kotor`, pengurangan `Upah PLPK`, dan pelaporan.
- **Serah Terima:** perpindahan fisik uang, kaleng, atau dokumen dari satu aktor kepada aktor berikutnya.
- **Verifikasi:** pemeriksaan kesesuaian data, fisik, nominal, dan tanda tangan sebelum tahap dilanjutkan.
- **Jumlah Kotor:** total nominal seluruh Munfiq sebelum pengurangan upah PLPK.
- **Upah PLPK:** total kompensasi PLPK yang dihitung berdasarkan ketentuan nominal Munfiq.
- **Jumlah Bersih:** dana setelah `Jumlah Kotor` dikurangi `Upah PLPK`.
- **Selisih:** perbedaan antara nilai pembanding, terutama `Jumlah Kotor` atau `Jumlah Bersih` menurut dokumen, sistem, dan uang yang diterima.

## 3. Identitas Dokumen

- `F.009`, `F.010`, `F.015`, dan `F.016` adalah kode berkas/kode formulir, bukan nomor surat atau nomor dokumen.
- Kode berkas mengikuti posisi desain template, biasanya di tengah bawah logo atau posisi tengah yang ditentukan template.
- Nomor unik dokumen ditempatkan kecil di pojok kanan atas sebagai `No. Berkas`, `No. Dokumen`, `No. Surat`, atau `No. Berita Acara`.

## 4. Ketentuan Perhitungan

Untuk setiap Munfiq:

- Nominal `> Rp7.000` menghasilkan `Upah PLPK = Rp2.500`.
- Nominal `<= Rp7.000` menghasilkan `Upah PLPK = Rp0`.

Formula penghimpunan:

```text
Jumlah Kotor = Σ nominal per Munfiq
Total Upah PLPK = Σ upah PLPK per Munfiq
Jumlah Bersih = Jumlah Kotor - Total Upah PLPK
Selisih = nilai menurut pembanding - nilai yang diterima atau dicatat
```

Jika terdapat pembulatan, koreksi, atau nilai yang tidak dapat dibuktikan, transaksi ditahan pada tahap berjalan sampai ada catatan dan pengesahan pihak terkait.

## 5. Tahapan dan Kendali Administrasi

### 5.1 Munfiq

| Elemen | Ketentuan |
|---|---|
| Aktor | Munfiq sebagai pemilik kaleng dan sumber nominal penghimpunan |
| Data input | Identitas Munfiq, wilayah, periode, kaleng aktif, dan nominal yang diserahkan |
| Proses | Menyerahkan kaleng atau uang kepada PLPK serta mengonfirmasi nominal jika diperlukan |
| Pihak verifikator | Munfiq melakukan konfirmasi awal; PLPK memeriksa penerimaan lapangan |
| Dokumen yang dihasilkan | Catatan kunjungan dan baris daftar Munfiq untuk F.009 |
| Status | `Menunggu Penjemputan`, lalu `Diserahkan ke PLPK` |
| Penanganan selisih | Nominal yang diperdebatkan dicatat sebagai `Selisih`, tidak dihapus, dan dikonfirmasi ulang kepada Munfiq |
| Output ke tahap berikutnya | Kaleng/uang, nominal per Munfiq, status kunjungan, dan bukti konfirmasi |

### 5.2 Penjemputan oleh PLPK

| Elemen | Ketentuan |
|---|---|
| Aktor | PLPK |
| Data input | Daftar Munfiq, ID PLPK, periode, Kecamatan, Ranting/Desa, kaleng aktif, dan jadwal kunjungan |
| Proses | Melakukan Penjemputan, menghitung nominal per Munfiq, mencatat kaleng terjemput, menghitung `Jumlah Kotor`, `Upah PLPK`, dan `Jumlah Bersih`, lalu melakukan Serah Terima kepada Kordes |
| Pihak verifikator | Kordes pada saat Serah Terima; Munfiq sebagai konfirmasi sumber bila diperlukan |
| Dokumen yang dihasilkan | F.009 — Lembar Penerimaan Koin NU untuk tahap PLPK → Kordes |
| Status | `Dijemput PLPK`, `Siap Verifikasi Kordes`, atau `Dikembalikan untuk Perbaikan` |
| Penanganan selisih | Bandingkan jumlah kaleng, nominal per Munfiq, uang fisik, dan sistem. Catat `Selisih`, alasan, pihak yang hadir, dan tindakan koreksi; Kordes tidak menyetujui dokumen tanpa penyelesaian atau penerimaan bersyarat yang terdokumentasi |
| Output ke tahap berikutnya | F.009 bertanda tangan PLPK, uang/kaleng hasil Penjemputan, rincian per Munfiq, dan nilai bersih untuk Verifikasi Kordes |

### 5.3 Verifikasi Kordes

| Elemen | Ketentuan |
|---|---|
| Aktor | Kordes |
| Data input | F.009, uang dan kaleng hasil Serah Terima, serta data menurut sistem |
| Proses | Memeriksa identitas PLPK, wilayah, daftar Munfiq, kaleng terjemput, nominal, formula upah, `Jumlah Kotor`, `Jumlah Bersih`, dan uang yang diterima Kordes |
| Pihak verifikator | Kordes sebagai pemeriksa dan penandatangan; PLPK sebagai pihak yang menjelaskan data |
| Dokumen yang dihasilkan | F.009 terverifikasi Kordes dan catatan Selisih/koreksi bila ada |
| Status | `Terverifikasi Kordes`, `Terverifikasi Bersyarat`, atau `Dikembalikan ke PLPK` |
| Penanganan selisih | Kordes mencocokkan ulang dokumen, uang, kaleng, dan sistem. Selisih wajib diberi catatan, bukti, nilai final, serta tanda tangan pihak terkait sebelum diteruskan |
| Output ke tahap berikutnya | Dokumen terverifikasi, uang/kaleng, nilai final, dan F.015 — Berita Acara Serah Terima Donasi Koin NU Tingkat Desa (Kordes → UPZIS) |

### 5.4 Verifikasi UPZIS

| Elemen | Ketentuan |
|---|---|
| Aktor | UPZIS |
| Data input | Dokumen terverifikasi Kordes, rekap wilayah, uang/kaleng, dan data menurut sistem |
| Proses | Mengonsolidasikan F.015 dari setiap Ranting/Desa ke F.010, memeriksa kelengkapan dan konsistensi nilai, memvalidasi Selisih, lalu membuat F.016 untuk Serah Terima ke PC |
| Pihak verifikator | UPZIS sebagai pemeriksa tingkat kecamatan; Kordes dan PLPK sebagai sumber klarifikasi |
| Dokumen yang dihasilkan | F.010 — Rekap Data Penerimaan Donasi Koin NU Tingkat Kecamatan, lalu F.016 — Berita Acara Serah Terima Donasi Koin NU Tingkat Kecamatan |
| Status | `Belum Lengkap`, `Menunggu Verifikasi UPZIS`, `Ada Selisih`, `Terverifikasi UPZIS`, atau `Siap Dibuatkan F.016` |
| Penanganan selisih | Pisahkan Selisih per Kordes, Ranting/Desa, Munfiq, periode, dan jenisnya. Selisih yang belum selesai tetap terbuka dan ditandai pada F.010; jangan mengubah nilai sumber tanpa jejak koreksi |
| Output ke tahap berikutnya | F.010 yang siap dibuatkan F.016, F.016, dokumen pendukung, nilai bersih terverifikasi, dan uang/kaleng untuk PC |

### 5.5 Penjemputan dan Verifikasi PC

| Elemen | Ketentuan |
|---|---|
| Aktor | PC sebagai penerima akhir dan pemeriksa tingkat kabupaten |
| Data input | Rekap UPZIS, dokumen Kordes, dokumen Serah Terima, uang/kaleng, dan data menurut sistem |
| Proses | Melakukan Penjemputan dari UPZIS, mencocokkan dokumen dan fisik, memeriksa formula serta seluruh Selisih, mengesahkan penerimaan, dan menutup periode |
| Pihak verifikator | Pejabat/verifikator PC yang ditunjuk; UPZIS menjadi pihak Serah Terima |
| Dokumen yang dihasilkan | F.016 — Berita Acara Serah Terima Donasi Koin NU Tingkat Kecamatan, rekap final PC, dan daftar Selisih terbuka/terselesaikan |
| Status | `Diterima PC`, `Selesai`, atau `Dikembalikan ke UPZIS` |
| Penanganan selisih | Selisih diselesaikan melalui pemeriksaan berjenjang dan berita acara koreksi. Jika belum selesai, status periode tetap `Terverifikasi Bersyarat`, bukan `Selesai` |
| Output ke tahap berikutnya | Tidak ada tahap operasional berikutnya; menghasilkan arsip final dan laporan penghimpunan |

## 6. Kriteria Selesai

Alur hanya berstatus `Selesai` jika:

- seluruh dokumen dari PLPK, Kordes, dan UPZIS tersedia, termasuk F.009 untuk PLPK → Kordes, F.015 untuk Kordes → UPZIS, F.010 sebagai rekap UPZIS, dan F.016 untuk UPZIS → PC;
- Serah Terima fisik di setiap perpindahan memiliki pihak, waktu, nilai, dan tanda tangan;
- `Jumlah Kotor`, `Upah PLPK`, dan `Jumlah Bersih` dapat ditelusuri sampai daftar Munfiq;
- `Selisih` sudah diselesaikan atau memiliki keputusan final PC;
- PC mengesahkan penerimaan dan menutup periode.

## 7. Aset Resmi Dokumen

Aset resmi yang digunakan tanpa modifikasi:

- Header: `/logo untuk berkas gorut.png` (`public/logo untuk berkas gorut.png`)
- Watermark: `/logo koin nu.png` (`public/logo koin nu.png`)

Logo tidak boleh diubah, dipotong, digambar ulang, diberi filter, atau diubah warnanya.

## 8. Batasan Implementasi

Blueprint ini tidak mencakup generator PDF dan tidak mengusulkan perubahan pada source code, API, Prisma, atau database aplikasi.
