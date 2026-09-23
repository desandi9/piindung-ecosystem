# Role Access Matrix GORUT

## 1. Definisi Role

| Role | Scope Wilayah | Keterangan |
|---|---|---|
| `super_admin_pc` | Seluruh kabupaten | Akses penuh, konfigurasi, koreksi administratif, tidak boleh hapus riwayat verifikasi |
| `admin_pc` | Seluruh kabupaten | Verifikasi tingkat PC, penjadwalan, pelaporan, tidak boleh koreksi administratif setelah verifikasi |
| `admin_upzis` | Kecamatan sendiri | Verifikasi tingkat UPZIS, rekap F.010, F.016, tidak boleh melihat wilayah kecamatan lain |
| `admin_kordes` | Desa/Ranting sendiri | Verifikasi tingkat Kordes, F.009, F.015, tidak boleh melihat wilayah desa lain |
| `plpk` | Desa/Ranting, Munfiq milik sendiri | Input hasil Penjemputan, F.009 milik sendiri, tidak boleh memverifikasi data sendiri |

**Catatan `plpk`:** PLPK saat ini dicatat sebagai role target walaupun belum menjadi role central aktif. Dibutuhkan implementasi lanjutan pada auth. Jangan mengubah sistem auth yang ada.

## 2. Aturan Umum Akses

- **Pembatasan wilayah:** `admin_upzis` hanya melihat data kecamatannya; `admin_kordes` hanya melihat desanya; `plpk` hanya melihat Munfiq dan batch miliknya.
- **Pemisahan input dan verifikasi:** Aktor yang menginput tidak boleh memverifikasi data yang sama.
- **Dokumen terverifikasi:** Tidak boleh diedit langsung. Revisi harus membuat riwayat versi baru.
- **Audit trail:** Semua aksi penting mencatat aktor, waktu, aksi, dan nilai sebelum/sesudah.
- **Koreksi setelah verifikasi:** Hanya `super_admin_pc` dengan alasan dan catatan yang tersimpan permanen.

## 3. Matriks Akses per Halaman

### 3.1 Dashboard

| Aksi | `super_admin_pc` | `admin_pc` | `admin_upzis` | `admin_kordes` | `plpk` |
|---|---|---|---|---|---|
| Lihat | ✓ (seluruh kabupaten) | ✓ (seluruh kabupaten) | ✓ (kecamatan sendiri) | ✓ (desa sendiri) | ✓ (milik sendiri) |
| Lihat Semua Wilayah | ✓ | ✓ | ✗ | ✗ | ✗ |

### 3.2 Munfiq

| Aksi | `super_admin_pc` | `admin_pc` | `admin_upzis` | `admin_kordes` | `plpk` |
|---|---|---|---|---|---|
| Lihat | ✓ (semua) | ✓ (semua) | ✓ (kecamatan) | ✓ (desa) | ✓ (milik sendiri) |
| Buat | ✓ | ✓ | ✓ | ✓ | ✗ |
| Ubah Draft | ✓ | ✓ | ✓ | ✓ | ✗ |
| Verifikasi | N/A | N/A | N/A | N/A | ✗ |
| Tolak/Kembalikan | N/A | N/A | N/A | N/A | ✗ |
| Unduh Dokumen | N/A | N/A | N/A | N/A | N/A |
| Cetak | ✗ | ✗ | ✗ | ✗ | ✗ |
| Lihat Semua Wilayah | ✓ | ✓ | ✗ | ✗ | ✗ |
| Koreksi Setelah Verifikasi | ✓ (dengan audit) | ✗ | ✗ | ✗ | ✗ |

### 3.3 Penjemputan PLPK

| Aksi | `super_admin_pc` | `admin_pc` | `admin_upzis` | `admin_kordes` | `plpk` |
|---|---|---|---|---|---|
| Lihat | ✓ (semua) | ✓ (semua) | ✓ (kecamatan) | ✓ (desa) | ✓ (milik sendiri) |
| Buat | ✓ | ✓ | ✓ | ✓ | ✓ (milik sendiri) |
| Ubah Draft | ✓ | ✓ | ✓ | ✓ | ✓ (milik sendiri, sebelum diserahkan) |
| Verifikasi | ✗ | ✗ | ✗ | ✗ | ✗ (tidak boleh verifikasi sendiri) |
| Tolak/Kembalikan | ✗ | ✗ | ✗ | ✗ | ✗ |
| Unduh Dokumen | ✓ (F.009) | ✓ (F.009) | ✓ (F.009) | ✓ (F.009) | ✓ (F.009 milik sendiri) |
| Cetak | ✓ | ✓ | ✓ | ✓ | ✓ (milik sendiri) |
| Lihat Semua Wilayah | ✓ | ✓ | ✗ | ✗ | ✗ |
| Koreksi Setelah Verifikasi | ✓ (dengan audit) | ✗ | ✗ | ✗ | ✗ |

**Aturan `plpk`:** PLPK hanya melihat dan menginput batch miliknya. Tidak boleh mengubah batch yang sudah diserahkan ke Kordes.

### 3.4 Verifikasi Kordes

| Aksi | `super_admin_pc` | `admin_pc` | `admin_upzis` | `admin_kordes` | `plpk` |
|---|---|---|---|---|---|
| Lihat | ✓ (semua) | ✓ (semua) | ✓ (kecamatan) | ✓ (desa) | ✗ |
| Buat (F.015) | ✓ | ✓ | ✓ | ✓ (untuk desanya) | ✗ |
| Ubah Draft | ✗ (dokumen terverifikasi tidak diedit) | ✗ | ✗ | ✗ | ✗ |
| Verifikasi | ✗ | ✗ | ✗ | ✓ (untuk desanya) | ✗ |
| Tolak/Kembalikan | ✓ (eskalasi) | ✓ (eskalasi) | ✓ (eskalasi) | ✓ (desa sendiri, ke PLPK) | ✗ |
| Unduh Dokumen | ✓ (F.009, F.015) | ✓ (F.009, F.015) | ✓ (F.009, F.015) | ✓ (F.009, F.015 desanya) | ✓ (F.009 milik sendiri) |
| Cetak | ✓ | ✓ | ✓ | ✓ | ✓ (F.009 milik sendiri) |
| Lihat Semua Wilayah | ✓ | ✓ | ✗ | ✗ | ✗ |
| Koreksi Setelah Verifikasi | ✓ (dengan audit, khusus F.009) | ✗ | ✗ | ✗ | ✗ |

**Catatan:** Kordes menginput F.009 diverifikasi, bukan mengubah isi F.009. F.015 terbentuk dari F.009 yang sudah diverifikasi.

### 3.5 Verifikasi UPZIS

| Aksi | `super_admin_pc` | `admin_pc` | `admin_upzis` | `admin_kordes` | `plpk` |
|---|---|---|---|---|---|
| Lihat | ✓ (semua) | ✓ (semua) | ✓ (kecamatan) | ✗ | ✗ |
| Buat (F.010, F.016) | ✓ | ✓ | ✓ (kecamatannya) | ✗ | ✗ |
| Ubah Draft | ✗ (dokumen terverifikasi tidak diedit) | ✗ | ✗ | ✗ | ✗ |
| Verifikasi | ✗ | ✗ | ✓ (kecamatannya) | ✗ | ✗ |
| Tolak/Kembalikan | ✓ (eskalasi) | ✓ (eskalasi) | ✓ (kecamatan, ke Kordes) | ✗ | ✗ |
| Unduh Dokumen | ✓ (F.010, F.015, F.016) | ✓ (F.010, F.015, F.016) | ✓ (F.010, F.015, F.016 kecamatannya) | ✓ (F.015 desanya) | ✗ |
| Cetak | ✓ | ✓ | ✓ | ✗ | ✗ |
| Lihat Semua Wilayah | ✓ | ✓ | ✗ | ✗ | ✗ |
| Koreksi Setelah Verifikasi | ✓ (dengan audit, khusus F.010) | ✗ | ✗ | ✗ | ✗ |

**Catatan:** F.010 terbentuk otomatis dari F.015 yang diverifikasi. Admin UPZIS memvalidasi F.010 dan menghasilkan F.016.

### 3.6 Penjemputan dan Verifikasi PC

| Aksi | `super_admin_pc` | `admin_pc` | `admin_upzis` | `admin_kordes` | `plpk` |
|---|---|---|---|---|---|
| Lihat | ✓ (semua) | ✓ (semua) | ✓ (kecamatannya, F.016 yang diajukan) | ✗ | ✗ |
| Buat | ✓ | ✓ | ✗ | ✗ | ✗ |
| Ubah Draft | ✗ (dokumen terverifikasi tidak diedit) | ✗ | ✗ | ✗ | ✗ |
| Verifikasi | ✓ | ✓ (terbatas, hanya verifikasi F.016) | ✗ | ✗ | ✗ |
| Tolak/Kembalikan | ✓ | ✓ (ke UPZIS) | ✗ | ✗ | ✗ |
| Unduh Dokumen | ✓ (semua) | ✓ (semua) | ✓ (F.016 kecamatannya) | ✓ (F.015 desanya) | ✗ |
| Cetak | ✓ | ✓ | ✓ | ✗ | ✗ |
| Lihat Semua Wilayah | ✓ | ✓ | ✗ | ✗ | ✗ |
| Koreksi Setelah Verifikasi | ✓ (dengan audit) | ✗ | ✗ | ✗ | ✗ |

**Catatan:** Admin PC menjadwalkan petugas, memverifikasi uang fisik dan F.016. Super Admin PC dapat melakukan koreksi administratif dengan audit trail permanen.

### 3.7 Dokumen Administrasi

| Aksi | `super_admin_pc` | `admin_pc` | `admin_upzis` | `admin_kordes` | `plpk` |
|---|---|---|---|---|---|
| Lihat | ✓ (semua) | ✓ (semua) | ✓ (kecamatan) | ✓ (desa) | ✓ (F.009 milik sendiri) |
| Unduh Dokumen | ✓ (semua) | ✓ (semua) | ✓ (kecamatan) | ✓ (desa) | ✓ (F.009 milik sendiri) |
| Cetak | ✓ (semua) | ✓ (semua) | ✓ (kecamatan) | ✓ (desa) | ✓ (F.009 milik sendiri) |
| Lihat Semua Wilayah | ✓ | ✓ | ✗ | ✗ | ✗ |

Halaman ini murni arsip: tidak ada aksi Buat, Ubah, Verifikasi, Tolak, atau Koreksi.

### 3.8 Monitoring

| Aksi | `super_admin_pc` | `admin_pc` | `admin_upzis` | `admin_kordes` | `plpk` |
|---|---|---|---|---|---|
| Lihat | ✓ (semua) | ✓ (semua) | ✓ (kecamatan) | ✗ | ✗ |
| Unduh Dokumen | ✓ | ✓ | ✓ | ✗ | ✗ |
| Lihat Semua Wilayah | ✓ | ✓ | ✗ | ✗ | ✗ |

Halaman ini read-only: tidak ada aksi Buat, Ubah, Verifikasi, Tolak, atau Koreksi.

### 3.9 Laporan

| Aksi | `super_admin_pc` | `admin_pc` | `admin_upzis` | `admin_kordes` | `plpk` |
|---|---|---|---|---|---|
| Lihat | ✓ (semua) | ✓ (semua) | ✓ (kecamatan) | ✗ | ✗ |
| Unduh Dokumen | ✓ | ✓ | ✓ | ✗ | ✗ |
| Cetak | ✓ | ✓ | ✓ | ✗ | ✗ |
| Lihat Semua Wilayah | ✓ | ✓ | ✗ | ✗ | ✗ |

Halaman ini read-only: tidak ada aksi Buat, Ubah, Verifikasi, Tolak, atau Koreksi.

## 4. Ringkasan: Pemisahan Input dan Verifikasi

| Tahap | Input oleh | Diverifikasi oleh | Tidak boleh diverifikasi oleh |
|---|---|---|---|
| F.009 | PLPK / admin_kordes | admin_kordes | PLPK (tidak boleh verifikasi sendiri) |
| F.015 | admin_kordes (dari F.009) | admin_upzis | admin_kordes (tidak boleh verifikasi sendiri) |
| F.010 | admin_upzis (dari F.015) | admin_upzis (validasi), admin_pc (final di F.016) | — |
| F.016 | admin_upzis (dari F.010) | admin_pc / super_admin_pc | admin_upzis (tidak boleh verifikasi sendiri) |

## 5. Aturan Khusus

### 5.1 Pembatasan Wilayah

- Setiap role yang terikat wilayah (UPZIS, Kordes, PLPK) hanya melihat data pada scope wilayahnya.
- `admin_pc` dan `super_admin_pc` melihat seluruh kabupaten.
- Dashboard dan laporan menerapkan filter wilayah otomatis berdasarkan role.

### 5.2 Dokumen Terverifikasi

- Dokumen dengan status `Terverifikasi` di tingkat mana pun tidak boleh diedit langsung oleh siapa pun.
- `super_admin_pc` dapat melakukan koreksi administratif, namun:
  - Koreksi menghasilkan versi baru dokumen.
  - Versi lama tetap tersimpan dan tidak terhapus.
  - Audit trail mencatat aktor, waktu, alasan, dan seluruh perubahan nilai.
  - Riwayat verifikasi tidak boleh dihapus.

### 5.3 Koreksi Setelah Verifikasi oleh Super Admin PC

- Hanya `super_admin_pc`.
- Memerlukan alasan wajib yang tersimpan permanen.
- Semua perubahan nilai tercatat dalam audit log.
- Dokumen yang sudah `Selesai` memerlukan pembukaan kembali (re-open) dengan catatan.

### 5.4 Riwayat Versi

Setiap perubahan data penting (nominal, status, Selisih) pada dokumen yang sudah diverifikasi menciptakan baris riwayat versi baru yang memuat:

- Aktor
- Waktu
- Field yang diubah
- Nilai sebelum
- Nilai sesudah
- Alasan

### 5.5 Delegetion untuk Role `plpk`

PLPK adalah role target implementasi lanjutan. Sampai role PLPK menjadi role central aktif:

- Input Penjemputan dilakukan oleh `admin_kordes` atas nama PLPK.
- Aplikasi tetap mencatat ID PLPK pada F.009.
- F.009 tetap menampilkan nama dan ID PLPK sebagai penjemput.

## 6. Hal yang Perlu Dikonfirmasi

- Mekanisme eskalasi: apakah `super_admin_pc` dan `admin_pc` dapat mengembalikan F.016 langsung ke Kordes (melewati UPZIS) atau harus melalui UPZIS.
- Batas waktu pengembalian dokumen (timeout untuk `Dikembalikan` sebelum otomatis naik).
- Apakah PLPK dapat mengakses dashboard dan monitoring (saat ini dimatikan; diusulkan read-only milik sendiri setelah PLPK menjadi role aktif).
- Format penomoran unik (`No. Berkas`, `No. Dokumen`, `No. Surat`, `No. Berita Acara`) — perlu konvensi penomoran definitif.

## 7. Batasan

Matriks ini tidak mengubah source code, auth, Prisma, database, API, atau komponen aplikasi yang sudah ada.
