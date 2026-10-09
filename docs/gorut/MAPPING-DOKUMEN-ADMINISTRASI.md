# Mapping Dokumen Administrasi GORUT

## 1. Konteks

Mapping ini mencakup dokumen administratif wajib pada alur Penghimpunan koin NU. Setiap dokumen dihubungkan dengan aktor, tahapan, status verifikasi, dan aset resmi.

Aset resmi (tidak boleh diubah, dipotong, digambar ulang, diberi filter, atau diubah warnanya):

- Header: `/logo untuk berkas gorut.png` (path filesystem `public/logo untuk berkas gorut.png`)
- Watermark: `/logo koin nu.png` (path filesystem `public/logo koin nu.png`)

## 2. Identitas Dokumen: Kode Berkas vs Nomor Unik

Setiap dokumen memiliki dua lapis identitas:

| Lapis | Sifat | Posisi | Contoh |
|---|---|---|---|
| **Kode Berkas / Kode Formulir** | Tetap per jenis dokumen, tertera di template kosong | Tengah bawah logo | `F.009`, `F.010`, `F.015`, `F.016` |
| **Nomor Unik** | Sekali pakai per penerbitan dokumen | Pojok kanan atas | `No. Berkas`, `No. Dokumen`, `No. Surat`, `No. Berita Acara` |

Kode berkas bukan nomor surat dan bukan nomor dokumen. Nomor unik ditempatkan kecil di pojok kanan atas dan mengikuti jenis dokumen:

- **F.009** (Lembar Penerimaan Koin NU): `No. Berkas` dan `No. Dokumen`
- **F.015** (Berita Acara Serah Terima Donasi Koin NU Tingkat Desa): `No. Berita Acara` dan `No. Surat`
- **F.010** (Rekap Data Penerimaan Donasi Koin NU Tingkat Kecamatan): `No. Dokumen`
- **F.016** (Berita Acara Serah Terima Donasi Koin NU Tingkat Kecamatan): `No. Berita Acara` dan `No. Surat`

## 3. Dokumen F.009 — Lembar Penerimaan Koin NU (PLPK → Kordes)

### 3.1 Tujuan

Mencatat Penjemputan PLPK, menghitung nilai Penghimpunan, dan menjadi alat Serah Terima dari PLPK kepada Kordes. Dokumen ini wajib diisi sebelum diverifikasi Kordes.

### 3.2 Header

| Elemen | Posisi | Nilai |
|---|---|---|
| Logo header | Atas | `/logo untuk berkas gorut.png` |
| Judul | Tengah | **LEMBAR PENERIMAAN KOIN NU** |
| Kode Berkas | Tengah bawah logo | `F.009` |
| No. Berkas | Pojok kanan atas | Nomor unik berkas |
| No. Dokumen | Pojok kanan atas | Nomor unik dokumen |

### 3.3 Informasi Wilayah dan Personel

| Field | Tipe | Keterangan |
|---|---|---|
| Nama PLPK | Teks | Nama personel penjemput |
| ID PLPK | Teks | Kode unik PLPK dari sistem |
| Periode | Tanggal atau Label | Periode penghimpunan yang tercakup |
| Kecamatan | Teks | Wilayah Kecamatan |
| Ranting/Desa | Teks | Wilayah Ranting atau Desa |
| Nama Kordes | Teks | Nama Koordinator Desa yang memverifikasi |

### 3.4 Daftar Munfiq

| Field | Tipe | Keterangan |
|---|---|---|
| ID Munfiq | Teks | Kode unik Munfiq |
| Nama Munfiq | Teks | Nama |
| Nomor Kaleng | Teks | Identitas kaleng |
| Status Kunjungan | Enum | `Kaleng Terjemput`, `Munfiq Tidak Ditemukan`, `Munfiq Menolak`, `Menunggu Konfirmasi`, `Dijadwalkan Ulang`, `Belum Dikunjungi` |
| Nominal | Angka (IDR) | Nominal penghimpunan yang diserahkan Munfiq atau dihitung saat Penjemputan |
| Upah PLPK | Angka (IDR) | Per Munfiq: `> Rp7.000 = Rp2.500`, selebihnya `Rp0` |

### 3.5 Ringkasan Penghimpunan

| Field | Formula | Keterangan |
|---|---|---|
| Kaleng Aktif | Hitung | Jumlah Munfiq dengan kaleng aktif tercatat |
| Kaleng Terjemput | Hitung | Jumlah Munfiq dengan status kunjungan `Kaleng Terjemput` |
| Jumlah Kotor | Σ Nominal Munfiq | Total nominal seluruh Munfiq |
| Upah PLPK | Σ Upah PLPK per Munfiq | Total kompensasi PLPK |
| Jumlah Bersih | Jumlah Kotor - Upah PLPK | Dana setelah pengurangan upah |
| Jumlah Menurut Sistem | Input | Angka pembanding dari sistem aplikasi |
| Uang Diterima Kordes | Input | Jumlah uang fisik yang diterima Kordes saat Serah Terima |
| Selisih | Uang Diterima Kordes - Jumlah Bersih | Perbedaan antara terima fisik dan nilai dokumen |

### 3.6 Verifikasi dan Pengesahan

| Field | Tipe | Keterangan |
|---|---|---|
| Status Verifikasi | Enum | `Terverifikasi`, `Terverifikasi Bersyarat`, `Dikembalikan` |
| Selisih Ditemukan | Boolean/Angka | Apakah Selisih terjadi dan nilainya |
| Catatan | Teks | Penjelasan Selisih, koreksi, alasan verifikasi, catatan lapangan |

### 3.7 Tanda Tangan

| Pihak | Keterangan |
|---|---|
| PLPK | Penjemput dan pencatat |
| Kordes | Penerima dan verifikator tahap awal |

### 3.8 Watermark

- Watermark: `/logo koin nu.png`
- Posisi: latar belakang, opasitas rendah

## 4. Dokumen F.015 — Berita Acara Serah Terima Donasi Koin NU Tingkat Desa (Kordes → UPZIS)

### 4.1 Tujuan

Dokumen Serah Terima dan verifikasi dari Kordes ke UPZIS. Menghimpun hasil dari seluruh PLPK di bawah koordinasi Kordes yang sama untuk diverifikasi ulang di tingkat UPZIS.

### 4.2 Header

| Elemen | Posisi | Nilai |
|---|---|---|
| Logo header | Atas | `/logo untuk berkas gorut.png` |
| Judul | Tengah | **BERITA ACARA SERAH TERIMA DONASI KOIN NU TINGKAT DESA** |
| Kode Berkas | Tengah bawah logo | `F.015` |
| No. Berita Acara | Pojok kanan atas | Nomor unik berita acara |
| No. Surat | Pojok kanan atas | Nomor unik surat |

### 4.3 Informasi Serah Terima

| Field | Tipe | Keterangan |
|---|---|---|
| No. Berita Acara | Teks | Nomor unik berita acara |
| Tanggal Serah Terima | Tanggal | Tanggal pelaksanaan Serah Terima |
| Periode | Label | Periode penghimpunan |
| Nama Kordes | Teks | Pihak yang menyerahkan |
| Nama Petugas UPZIS | Teks | Pihak penerima |
| Kecamatan | Teks | Wilayah Kecamatan |
| Desa/Ranting | Teks | Wilayah Desa atau Ranting |

### 4.4 Ringkasan Donasi

| Field | Formula | Keterangan |
|---|---|---|
| Total Kaleng Aktif | Hitung | Jumlah seluruh kaleng aktif di wilayah |
| Jumlah PLPK yang Menjemput | Hitung | PLPK yang melakukan Penjemputan |
| Kaleng Terjemput | Hitung | Kaleng yang berhasil dijemput |
| Kaleng Tidak Terjemput | Hitung | Kaleng yang belum/tidak berhasil dijemput |
| Total Nominal Bersih | Jumlah Kotor - Total Upah PLPK | Total dana yang diserahkan |
| Nominal Terbilang | Teks | Terbilang dalam huruf |

### 4.5 Verifikasi dan Pengesahan

| Field | Tipe | Keterangan |
|---|---|---|
| Status Verifikasi | Enum | `Menunggu verifikasi UPZIS`, `Data penerimaan terverifikasi`, `Ada selisih`, `Dikembalikan untuk perbaikan` |
| Catatan Selisih | Teks | Rincian Selisih, penyebab, tindakan, dan status penyelesaian |

### 4.6 Tanda Tangan

| Pihak | Keterangan |
|---|---|
| Kordes | Pihak yang menyerahkan |
| Petugas UPZIS | Pihak penerima dan verifikator |

### 4.7 Watermark

- Watermark: `/logo koin nu.png`
- Posisi: latar belakang, opasitas rendah

## 5. Dokumen F.010 — Rekap Data Penerimaan Donasi Koin NU Tingkat Kecamatan

### 5.1 Fungsi

F.010 digunakan oleh UPZIS untuk merangkum hasil Penghimpunan dari setiap Ranting/Desa dalam satu Kecamatan. Data bersumber dari hasil verifikasi Kordes dan F.015 setiap desa. F.010 menjadi dasar angka untuk F.016 UPZIS → PC.

### 5.2 Identitas dan Header

F.010 adalah kode berkas, bukan nomor dokumen. Nomor unik dokumen ditempatkan kecil di pojok kanan atas. Kode `F.010` tetap di tengah mengikuti desain template.

| Elemen | Posisi | Nilai |
|---|---|---|
| Logo header | Atas | `/logo untuk berkas gorut.png` |
| Judul | Tengah | **REKAP DATA PENERIMAAN DONASI KOIN NU TINGKAT KECAMATAN** |
| Kode Berkas | Tengah mengikuti template | `F.010` |
| No. Dokumen | Pojok kanan atas | Nomor unik dokumen |

### 5.3 Tabel Rekap per Ranting/Desa

Satu baris tabel mewakili satu Ranting/Desa.

| Field | Tipe/Formula | Keterangan |
|---|---|---|
| Nomor Urut | Angka | Urutan baris |
| Nama Ranting/Desa | Teks | Nama wilayah desa/ranting |
| Nama Kordes | Teks | Kordes penanggung jawab |
| Jumlah PLPK | Hitung | Jumlah PLPK yang tercatat untuk desa/ranting |
| Jumlah Munfiq atau Kaleng Aktif | Hitung | Total Munfiq atau kaleng aktif |
| Kaleng Terjemput | Hitung | Kaleng yang berhasil dijemput |
| Kaleng Tidak Terjemput | Hitung | Kaleng aktif dikurangi kaleng terjemput |
| Jumlah Kotor | Σ Nominal | Total nominal sebelum upah PLPK |
| Total Upah PLPK | Σ Upah PLPK | Total upah PLPK dari seluruh PLPK pada desa/ranting |
| Jumlah Bersih | Jumlah Kotor - Total Upah PLPK | Dana bersih yang diterima UPZIS |
| Nomor BA F.015 | Teks | Nomor Berita Acara F.015 sumber |
| Tanggal Diterima UPZIS | Tanggal | Tanggal F.015 diterima UPZIS |
| Status Verifikasi | Enum | Status baris rekap |
| Catatan Selisih | Teks | Selisih, penyebab, tindak lanjut, dan status penyelesaian |

### 5.4 Ringkasan Kecamatan

| Field | Formula/Keterangan |
|---|---|
| Jumlah Desa/Ranting | Hitung baris desa/ranting |
| Jumlah Kordes | Hitung Kordes unik |
| Jumlah PLPK | Σ Jumlah PLPK |
| Jumlah Kaleng Aktif | Σ Jumlah Munfiq atau Kaleng Aktif |
| Jumlah Kaleng Terjemput | Σ Kaleng Terjemput |
| Jumlah Tidak Terjemput | Σ Kaleng Tidak Terjemput |
| Total Jumlah Kotor | Σ Jumlah Kotor |
| Total Upah PLPK | Σ Total Upah PLPK |
| Total Jumlah Bersih | Total Jumlah Kotor - Total Upah PLPK |

Formula utama:

```text
Jumlah Bersih = Jumlah Kotor - Total Upah PLPK
```

### 5.5 Status

Status F.010:

- `Belum Lengkap`
- `Menunggu Verifikasi UPZIS`
- `Ada Selisih`
- `Terverifikasi UPZIS`
- `Siap Dibuatkan F.016`

### 5.6 Watermark

- Watermark: `/logo koin nu.png`
- Posisi: latar belakang, opasitas rendah

## 6. Dokumen F.016 — Berita Acara Serah Terima Donasi Koin NU Tingkat Kecamatan (UPZIS → PC)

### 6.1 Tujuan

Dokumen akhir untuk Serah Terima Penghimpunan dari UPZIS ke PC. F.016 menggunakan angka dari F.010 dan menjadi arsip final tingkat kecamatan yang diterima PC.

### 6.2 Header

| Elemen | Posisi | Nilai |
|---|---|---|
| Logo header | Atas | `/logo untuk berkas gorut.png` |
| Judul | Tengah | **BERITA ACARA SERAH TERIMA DONASI KOIN NU TINGKAT KECAMATAN** |
| Kode Berkas | Tengah bawah logo | `F.016` |
| No. Berita Acara | Pojok kanan atas | Nomor unik berita acara |
| No. Surat | Pojok kanan atas | Nomor unik surat |

### 6.3 Elemen yang Diperlukan

- **Identitas UPZIS**: nama kecamatan, nama dan ID verifikator.
- **Periode**: sama dengan F.010.
- **Sumber angka**: F.010 yang berstatus `Siap Dibuatkan F.016`.
- **Daftar Kordes/desa**: seluruh Kordes dan desa/ranting yang direkap pada F.010.
- **Rekapitulasi final**: `Total Jumlah Kotor`, `Total Upah PLPK`, `Total Jumlah Bersih`.
- **Selisih total**: catatan terbuka, terselesaikan, dan rujukan dokumen pendukung.
- **Pengesahan PC**: `Diterima Terverifikasi`, `Terverifikasi Bersyarat`, `Dikembalikan ke UPZIS`.
- **Tanda tangan**: UPZIS dan pejabat/verifikator PC.
- **Lokasi dan tanggal**: tempat dan waktu Serah Terima.
- **Watermark**: `/logo koin nu.png`.

## 7. Pemetaan Final Dokumen

| Kode Berkas | Fungsi | Tahap |
|---|---|---|
| `F.009` | Rincian PLPK → Kordes | PLPK menyerahkan hasil Penjemputan kepada Kordes |
| `F.015` | BA desa Kordes → UPZIS | Kordes menyerahkan hasil tingkat desa/ranting kepada UPZIS |
| `F.010` | Rekap seluruh desa oleh UPZIS | UPZIS merangkum F.015 dari seluruh desa/ranting satu kecamatan |
| `F.016` | BA kecamatan UPZIS → PC | UPZIS menyerahkan hasil tingkat kecamatan kepada PC |

```text
F.009 (PLPK→Kordes) → F.015 (Kordes→UPZIS) → F.010 (Rekap UPZIS) → F.016 (UPZIS→PC) → Selesai
```

Setiap dokumen wajib memelihara ketertelusuran `Selisih` dari tahap awal sampai penutupan PC. Tidak boleh ada perubahan nilai sumber tanpa catatan dan persetujuan.

## 8. Batasan

Mapping ini tidak mencakup generator PDF dan tidak mengusulkan perubahan pada source code, API, Prisma, database, atau komponen aplikasi.
