'use client';

import {
  ArrowRight,
  BookOpen,
  Building2,
  CircleHelp,
  FileText,
  HandCoins,
  Headphones,
  Landmark,
  MapPinned,
  Search,
  ShieldCheck,
  Truck,
  UserRoundCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { GorutAppShell } from '@/components/gorut-v2/gorut-app-shell';
import { OperationPageHeader } from '@/components/gorut-v2/operations/operation-page-header';

const flow = [
  { id: 'plpk', label: 'PLPK', description: 'Mencatat hasil kunjungan dan mengirim batch penghimpunan.', icon: Truck },
  { id: 'kordes', label: 'Kordes', description: 'Memeriksa kelengkapan, kesesuaian nominal, dan penerimaan uang.', icon: UserRoundCheck },
  { id: 'upzis', label: 'UPZIS', description: 'Menyusun rekap desa/ranting dan berita acara yang tersedia.', icon: Building2 },
  { id: 'pc', label: 'PC', description: 'Melakukan pemeriksaan akhir ketika source tahap PC sudah aktif.', icon: Landmark },
];

const guides = [
  { id: 'cara-kerja', title: 'Cara Kerja GORUT', description: 'Pahami hubungan data Munfiq, penjemputan, verifikasi, dokumen, monitoring, dan laporan.', icon: BookOpen, steps: ['Mulai dari data Munfiq dan penugasan PLPK.', 'Catat hasil kunjungan tanpa mengisi nominal untuk kunjungan yang tidak menghasilkan penghimpunan.', 'Ikuti antrean verifikasi sesuai tingkat operasional.', 'Gunakan Monitoring dan Laporan sebagai tampilan read-only lintas proses.'] },
  { id: 'penjemputan', title: 'Panduan Penjemputan', description: 'Urutan kerja PLPK dari daftar kunjungan sampai pengiriman batch.', icon: HandCoins, steps: ['Pilih periode dan wilayah kerja.', 'Catat hasil kunjungan setiap Munfiq sesuai kondisi sebenarnya.', 'Periksa ringkasan jumlah kotor, bisyaroh, dan jumlah bersih yang dihitung source existing.', 'Konfirmasi batch hanya setelah semua data yang wajib sudah lengkap.'] },
  { id: 'verifikasi', title: 'Panduan Verifikasi', description: 'Pemeriksaan Kordes dan UPZIS tanpa melewati status yang tersedia.', icon: ShieldCheck, steps: ['Buka detail batch yang berada pada antrean tahap Anda.', 'Bandingkan nominal dan daftar Munfiq dengan dokumen pendukung.', 'Gunakan catatan koreksi hanya pada alur yang memang menyediakan action.', 'Jangan memproses ulang data yang sudah terverifikasi.'] },
  { id: 'dokumen', title: 'Dokumen Administrasi', description: 'Membaca kesiapan F.009, F.010, F.015, dan F.016 berdasarkan data existing.', icon: FileText, steps: ['Gunakan filter periode dan wilayah untuk menemukan dokumen.', 'Status Siap berarti preview tersedia dari source dokumen.', 'Status Menunggu Data menandakan prasyarat belum lengkap.', 'PDF tidak dapat disimpan ketika pipeline belum menyediakan dokumen.'] },
];

const faqs = [
  { question: 'Mengapa tombol validasi tidak aktif?', answer: 'Action hanya diaktifkan ketika endpoint workflow dan source datanya benar-benar tersedia. Halaman Validasi V2 saat ini menjaga antrean transaksi produksi tetap read-only.' },
  { question: 'Mengapa jumlah kotor, bisyaroh, dan neto tidak muncul di Setoran?', answer: 'Read model transaksi produksi saat ini hanya menyediakan satu nilai total. GORUT tidak menurunkan atau menebak nominal lain tanpa source resmi.' },
  { question: 'Apa arti Menunggu PC?', answer: 'Status tersebut berasal dari state transaksi WAITING_PC_APPROVAL. Ia menandakan data berada pada antrean tahap PC, bukan berarti action approval di halaman V2 sudah tersedia.' },
  { question: 'Di mana melihat dokumen administrasi?', answer: 'Buka menu Dokumen Administrasi untuk memeriksa kesiapan dan preview F.009, F.010, F.015, atau F.016 sesuai data yang tersedia.' },
  { question: 'Bagaimana kembali ke sistem utama?', answer: 'Gunakan menu Kembali ke PIINDUNG di bagian bawah sidebar GORUT.' },
];

export function HelpShell() {
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLocaleLowerCase('id-ID');
  const filteredGuides = useMemo(() => guides.filter((guide) => !normalizedQuery || [guide.title, guide.description, ...guide.steps].join(' ').toLocaleLowerCase('id-ID').includes(normalizedQuery)), [normalizedQuery]);
  const filteredFaqs = useMemo(() => faqs.filter((item) => !normalizedQuery || `${item.question} ${item.answer}`.toLocaleLowerCase('id-ID').includes(normalizedQuery)), [normalizedQuery]);

  return (
    <GorutAppShell title="Pusat Bantuan">
      <div className="gorut-munfiq-workspace gorut-admin-workspace gorut-help-workspace">
        <OperationPageHeader
          eyebrow="Panduan"
          title="Pusat Bantuan GORUT"
          description="Panduan operasional singkat untuk memahami alur kerja dan menggunakan halaman GORUT V2 dengan aman."
          meta={<span className="gorut-admin-source-pill"><CircleHelp size={14} aria-hidden="true" />Panduan frontend</span>}
        />

        <section className="gorut-help-search" aria-label="Pencarian bantuan">
          <Search size={18} aria-hidden="true" />
          <label><span className="sr-only">Cari panduan atau pertanyaan</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cari panduan, alur, dokumen, atau pertanyaan…" /></label>
          <small>{filteredGuides.length + filteredFaqs.length} hasil</small>
        </section>

        {!normalizedQuery ? (
          <section className="gorut-help-flow" aria-labelledby="gorut-help-flow-title">
            <header><span><MapPinned size={18} aria-hidden="true" /></span><div><h2 id="gorut-help-flow-title">Alur PLPK → Kordes → UPZIS → PC</h2><p>Setiap tahap hanya bekerja pada data dan action yang tersedia untuk tingkatnya.</p></div></header>
            <ol>{flow.map((item, index) => { const Icon = item.icon; return <li key={item.id}><span className="gorut-help-flow-index">{index + 1}</span><span className="gorut-help-flow-icon"><Icon size={19} aria-hidden="true" /></span><div><strong>{item.label}</strong><p>{item.description}</p></div>{index < flow.length - 1 ? <ArrowRight className="gorut-help-flow-arrow" size={16} aria-hidden="true" /> : null}</li>; })}</ol>
          </section>
        ) : null}

        <section className="gorut-help-section" aria-labelledby="gorut-help-guides-title">
          <header><h2 id="gorut-help-guides-title">Panduan Utama</h2><p>Langkah ringkas berdasarkan alur GORUT yang sudah tersedia.</p></header>
          {filteredGuides.length ? <div className="gorut-help-guide-grid">{filteredGuides.map((guide) => { const Icon = guide.icon; return <article key={guide.id}><header><span><Icon size={19} aria-hidden="true" /></span><div><h3>{guide.title}</h3><p>{guide.description}</p></div></header><ol>{guide.steps.map((step) => <li key={step}>{step}</li>)}</ol></article>; })}</div> : <div className="gorut-help-no-results">Tidak ada panduan yang cocok dengan pencarian.</div>}
        </section>

        <section className="gorut-help-section gorut-help-faq" aria-labelledby="gorut-help-faq-title">
          <header><h2 id="gorut-help-faq-title">FAQ</h2><p>Jawaban untuk pertanyaan yang paling sering muncul pada alur operasional.</p></header>
          {filteredFaqs.length ? <div>{filteredFaqs.map((item, index) => <details key={item.question} open={!normalizedQuery && index === 0}><summary><span>{item.question}</span><CircleHelp size={16} aria-hidden="true" /></summary><p>{item.answer}</p></details>)}</div> : <div className="gorut-help-no-results">Tidak ada FAQ yang cocok dengan pencarian.</div>}
        </section>

        <section className="gorut-help-contact" aria-labelledby="gorut-help-contact-title">
          <span><Headphones size={22} aria-hidden="true" /></span>
          <div><h2 id="gorut-help-contact-title">Masih Membutuhkan Bantuan?</h2><p>Hubungi tim NU Care–LAZISNU Garut melalui kanal kontak resmi PIINDUNG.</p></div>
          <Link href="/kontak">Buka Kontak Bantuan<ArrowRight size={15} aria-hidden="true" /></Link>
        </section>
      </div>
    </GorutAppShell>
  );
}
