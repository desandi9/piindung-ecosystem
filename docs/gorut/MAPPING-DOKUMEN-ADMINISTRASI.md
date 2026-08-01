# Mapping Dokumen Administrasi GORUT

## 1. Konteks

Mapping ini mencakup dokumen administratif wajib pada alur Penghimpunan koin NU. Setiap dokumen dihubungkan dengan aktor, tahapan, status verifikasi, dan aset resmi.

Aset resmi (tidak boleh diubah, dipotong, digambar ulang, diberi filter, atau diubah warnanya):

- Header: `/logo untuk berkas gorut.png` (path filesystem `public/logo untuk berkas gorut.png`)
- Watermark: `/logo koin nu.png` (path filesystem `public/logo koin nu.png`)

## 2. Dokumen F.009 — Lembar Penerimaan Koin NU (PLPK → Kordes)

### 2.1 Tujuan

Mencatat Penjemputan PLPK, menghitung nilai Penghimpunan, dan menjadi alat Serah Terima dari PLPK kepada Kordes. Dokumen ini wajib diisi sebelum diverifikasi Kordes.

### 2.2 Header

- Logo header: `/logo untuk berkas gorut.png`
- Judul: **LEMBAR PENERIMAAN KOIN NU**
- Kode: **F.009**

### 2.3 Informasi Wilayah dan Personel

| Field | Tipe | Keterangan |
|---|---|---|
| Nama PLPK | Teks | Nama personel penjemput |
| ID PLPK | Teks | Kode unik PLPK dari sistem |
| Periode | Tanggal atau Label | Periode penghimpunan yang tercakup |
| Kecamatan | Teks | Wilayah Kecamatan |
| Ranting/Desa | Teks | Wilayah Ranting atau Desa |
| Nama Kordes | Teks | Nama Koordinator Desa yang memverifikasi |

### 2.4 Daftar Munfiq

Setiap baris daftar Munfiq memuat kolom berikut:

| Field | Tipe | Keterangan |
|---|---|---|
| ID Munfiq | Teks | Kode unik Munfiq |
| Nama Munfiq | Teks | Nama |
| Nomor Kaleng | Teks | Identitas kaleng |
| Status Kunjungan | Enum | `Kaleng Terjemput`, `Munfiq Tidak Ditemukan`, `Munfiq Menolak`, `Menunggu Konfirmasi`, `Dijadwalkan Ulang`, `Belum Dikunjungi` |
| Nominal | Angka (IDR) | Nominal penghimpunan yang diserahkan Munfiq atau dihitung saat Penjemputan |
| Upah PLPK | Angka (IDR) | Dihitung per Munfiq (`> Rp7.000 = Rp2.500`, selebihnya `Rp0`) |

### 2.5 Ringkasan Penghimpunan

| Field | Formula | Keterangan |
|---|---|---|
| Kaleng Aktif | Hitung manual | Jumlah Munfiq dengan kaleng aktif tercatat |
| Kaleng Terjemput | Hitung | Jumlah Munfiq dengan status kunjungan `Kaleng Terjemput` |
| Jumlah Kotor | Σ Nominal Munfiq | Total sebelum upah |
| Upah PLPK | Σ Upah PLPK per Munfiq | Total kompensasi PLPK |
| Jumlah Bersih | Jumlah Kotor - Upah PLPK | Dana setelah pengurangan upah |
| Jumlah Menurut Sistem | Input | Angka pembanding dari sistem aplikasi |
| Uang Diterima Kordes | Input | Jumlah uang yang diterima fisik oleh Kordes saat Serah Terima |
| Selisih | Uang Diterima Kordes - Jumlah Bersih | Perbedaan antara nilai terima fisik dan nilai dokumen |

### 2.6 Verifikasi dan Pengesahan

| Field | Tipe | Keterangan |
|---|---|---|
| Status Verifikasi | Enum | `Terverifikasi`, `Terverifikasi Bersyarat`, `Dikembalikan` |
| Selisih Ditemukan | Boolean atau Angka | Apakah Selisih terjadi dan dalam jumlah berapa |
| Catatan | Teks | Penjelasan Selisih, koreksi, alasan status verifikasi, atau catatan lapangan lainnya |

### 2.7 Tanda Tangan

| Pihak | Keterangan |
|---|---|
| PLPK | Tanda tangan penjemput dan pencatat |
| Kordes | Tanda tangan penerima dan verifikator tahap awal |

### 2.8 Watermark

- Watermark: `/logo koin nu.png`
- Posisi: latar belakang, opasitas rendah

## 3. Placeholder — Dokumen Kordes → UPZIS

### 3.1 Tujuan

Dokumen Serah Terima dan verifikasi dari Kordes ke UPZIS. Menghimpun F.009 dari seluruh PLPK di bawah koordinasi Kordes yang sama untuk diverifikasi ulang di tingkat UPZIS.

### 3.2 Elemen yang Diperlukan

- **Identitas Kordes**: nama, ID, kecamatan.
- **Periode**: rentang waktu penghimpunan.
- **Daftar PLPK**: seluruh PLPK yang dokumen F.009-nya disertakan.
- **Rekapitulasi**: `Jumlah Kotor`, `Upah PLPK`, `Jumlah Bersih` per PLPK dan total Kordes.
- **Selisih**: catatan per PLPK dan status penyelesaian.
- **Verifikasi UPZIS**: status (`Terverifikasi`, `Terverifikasi Bersyarat`, `Dikembalikan`), catatan, waktu.
- **Tanda tangan**: Kordes dan verifikator UPZIS.
- **Watermark**: `/logo koin nu.png`.

### 3.3 Kode Dokumen

Menunggu penetapan kode resmi (sebut sementara **F.010 — Kordes → UPZIS**).

## 4. Placeholder — Dokumen UPZIS → PC

### 4.1 Tujuan

Dokumen akhir untuk Serah Terima Penghimpunan dari UPZIS ke PC. Mencakup konsolidasi seluruh Kordes di satu kecamatan dan menjadi arsip final yang ditutup.

### 4.2 Elemen yang Diperlukan

- **Identitas UPZIS**: nama kecamatan, nama dan ID verifikator.
- **Periode**: sama dengan dokumen sebelumnya.
- **Daftar Kordes**: seluruh Kordes yang dokumennya dilampirkan.
- **Rekapitulasi per Kordes**: `Jumlah Kotor`, `Upah PLPK`, `Jumlah Bersih`.
- **Selisih total**: catatan terbuka, terselesaikan, dan rujukan dokumen pendukung.
- **Pengesahan PC**: `Diterima Terverifikasi`, `Terverifikasi Bersyarat`, `Dikembalikan ke UPZIS`.
- **Tanda tangan**: UPZIS dan pejabat/verifikator PC.
- **Lokasi dan tanggal**: tempat dan waktu Serah Terima.
- **Watermark**: `/logo koin nu.png`.

### 4.3 Kode Dokumen

Menunggu penetapan kode resmi (sebut sementara **F.011 — UPZIS → PC**).

## 5. Keterkaitan Dokumen

```text
F.009 (PLPK→Kordes) → F.010 placeholder (Kordes→UPZIS) → F.011 placeholder (UPZIS→PC) → Selesai
```

Setiap dokumen wajib memelihara ketertelusuran `Selisih` dari tahap awal sampai penutupan PC. Tidak boleh ada perubahan nilai sumber tanpa catatan dan persetujuan.

## 6. Batasan

Mapping ini tidak mencakup generator PDF dan tidak mengusulkan perubahan pada source code, API, Prisma, atau database aplikasi.
