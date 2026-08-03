'use client';

import { AlertTriangle, Banknote, CalendarDays, CheckCircle2, Clock3, Download, FileQuestion, Info, ListFilter, MapPinned, Rows3, Search, SearchX } from 'lucide-react';
import { useEffect, useState } from 'react';

import { formatRupiah } from '@/features/gorut-v2/formatters';
import { bottomNavigation, mainNavigation, masterDataNavigation, mobileNavigation, operationalNavigation } from '@/features/gorut-v2/navigation';

import { GorutHeader } from './gorut-header';
import { GorutSidebar } from './gorut-sidebar';
import { MobileBottomNav } from './mobile-bottom-nav';
import { MobileSidebar } from './mobile-sidebar';
import { PenghimpunanTabs } from './penghimpunan-tabs';

const target = { current: 'Rp1,42 M', max: 'Rp2 M', percentage: 71 };
const unavailableMessage = 'Belum tersedia karena belum ada data Verifikasi PC.';

export function PcVerificationShell() {
  const [loading, setLoading] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 420);
    return () => window.clearTimeout(timer);
  }, []);

  const triggerNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2500);
  };

  if (loading) {
    return (
      <div className="gorut-viewport">
        <div className="gorut-app">
          <GorutSidebar target={target} />
          <div className="gorut-workspace">
            <GorutHeader title="Penghimpunan" onMenuOpen={() => setMobileMenu(true)} />
            <main className="gorut-main"><div className="gorut-placeholder-skeleton" aria-label="Memuat scaffold Verifikasi PC" aria-busy="true" /></main>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gorut-viewport">
      <div className="gorut-app">
        <GorutSidebar target={target} />

        <div className="gorut-workspace">
          <GorutHeader title="Penghimpunan" onMenuOpen={() => setMobileMenu(true)} />

          <main className="gorut-main gorut-collect-main pc-verification-main">
            <PenghimpunanTabs />

            <section className="gorut-collect-heading" aria-label="Judul halaman">
              <div>
                <p>PENGHIMPUNAN</p>
                <h1>Verifikasi PC</h1>
                <span>Area pemeriksaan akhir penghimpunan tingkat kabupaten setelah rekap UPZIS tersedia.</span>
              </div>
              <span className="pc-verification-availability"><FileQuestion size={14} aria-hidden="true" />Sumber data belum aktif</span>
            </section>

            <section className="pjm-filters pc-verification-filters" aria-label="Filter Verifikasi PC belum tersedia">
              <UnavailableFilter id="pc-period" icon={CalendarDays} label="Periode" options={['Semua Periode', 'Belum Tersedia']} />
              <UnavailableFilter id="pc-upzis" icon={MapPinned} label="Kecamatan / UPZIS" options={['Semua Kecamatan / UPZIS', 'Belum Tersedia']} />
              <UnavailableFilter id="pc-status" icon={ListFilter} label="Status Verifikasi" options={['Semua Status', 'Belum Tersedia']} />
              <UnavailableFilter id="pc-document" icon={FileQuestion} label="Kesiapan Dokumen" options={['Semua Kesiapan Dokumen', 'Belum Tersedia']} />
              <p className="pc-verification-filter-note"><Info size={13} aria-hidden="true" />{unavailableMessage}</p>
            </section>

            <section className="pjm-summary pc-verification-summary" aria-label="Ringkasan Verifikasi PC">
              <EmptyStat icon={Clock3} label="Menunggu Verifikasi PC" />
              <EmptyStat icon={CheckCircle2} label="Terverifikasi PC" />
              <EmptyStat icon={AlertTriangle} label="Perlu Koreksi" />
              <EmptyStat icon={Banknote} label="Total Penghimpunan" value={formatRupiah(0)} highlighted />
            </section>

            <p className="gorut-collect-readonly-note pc-verification-note">
              <Info size={14} aria-hidden="true" />
              Verifikasi PC merupakan pemeriksaan akhir setelah rekap tingkat UPZIS selesai. Sumber data dan alur persetujuan PC belum diaktifkan pada tahap frontend ini.
            </p>

            <section className="pjm-panel gorut-collect-panel pc-verification-panel" aria-label="Tabel Verifikasi PC belum tersedia">
              <header className="pjm-toolbar pc-verification-toolbar">
                <label className="pjm-search pc-verification-disabled-control" title={unavailableMessage}>
                  <Search size={16} aria-hidden="true" />
                  <input type="search" placeholder="Cari UPZIS, wilayah, atau nomor dokumen" aria-label="Pencarian Verifikasi PC belum tersedia" disabled />
                </label>

                <div className="pjm-toolbar-actions">
                  <label className="pjm-page-size pc-verification-disabled-control" title={unavailableMessage}>
                    <Rows3 size={15} aria-hidden="true" />
                    <span>Tampilkan</span>
                    <select defaultValue="10" disabled aria-label="Jumlah baris Verifikasi PC belum tersedia">
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                    </select>
                    <span>baris</span>
                  </label>
                  <button type="button" className="pjm-export" disabled title={unavailableMessage} onClick={() => triggerNotice(unavailableMessage)}>
                    <Download size={15} aria-hidden="true" />Export
                  </button>
                </div>
              </header>

              <div className="pjm-table-wrap pc-verification-table-wrap">
                <table className="pjm-table pc-verification-table">
                  <thead>
                    <tr>
                      <th>UPZIS</th>
                      <th>Wilayah</th>
                      <th>Periode</th>
                      <th>Jumlah Desa</th>
                      <th className="is-amount">Jumlah Kotor</th>
                      <th className="is-amount">Bisyaroh</th>
                      <th className="is-amount">Jumlah Bersih</th>
                      <th>Kesiapan Dokumen</th>
                      <th className="is-status">Status</th>
                      <th className="is-action">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td colSpan={10}>
                        <div className="gorut-collect-empty pc-verification-empty">
                          <SearchX size={28} aria-hidden="true" />
                          <h2>Belum ada data yang siap diverifikasi</h2>
                          <p>Data akan tampil setelah rekap tingkat UPZIS dan sumber data Verifikasi PC tersedia.</p>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <footer className="gorut-collect-pagination pc-verification-pagination">
                <div className="gorut-pagination-info">Menampilkan <strong>0–0</strong> dari <strong>0</strong> data</div>
                <div className="gorut-pagination-controls">
                  <div className="gorut-pagination-buttons">
                    <button type="button" disabled>Awal</button>
                    <button type="button" disabled>Sebelumnya</button>
                    <span className="gorut-pagination-current">Halaman <strong>0</strong> dari <strong>0</strong></span>
                    <button type="button" disabled>Berikutnya</button>
                    <button type="button" disabled>Akhir</button>
                  </div>
                </div>
              </footer>
            </section>
          </main>
        </div>

        <MobileSidebar
          open={mobileMenu}
          onClose={() => setMobileMenu(false)}
          navigation={mainNavigation}
          secondaryNavigation={operationalNavigation}
          masterNavigation={masterDataNavigation}
          bottomNavigation={bottomNavigation}
          target={target}
        />
        <MobileBottomNav navigation={mobileNavigation} onMore={() => setMobileMenu(true)} onUnavailable={(label) => triggerNotice(`${label}: Segera tersedia`)} />
        {notice ? <div className="gorut-mobile-notice" role="status">{notice}</div> : null}
      </div>
    </div>
  );
}

function UnavailableFilter({ id, icon: Icon, label, options }: { id: string; icon: typeof CalendarDays; label: string; options: string[] }) {
  return (
    <div className="pjm-filter pc-verification-disabled-control" title={unavailableMessage}>
      <label className="pjm-filter-label" htmlFor={id}><Icon size={14} aria-hidden="true" />{label}</label>
      <select id={id} defaultValue={options[0]} disabled>{options.map((option) => <option key={option}>{option}</option>)}</select>
    </div>
  );
}

function EmptyStat({ icon: Icon, label, value = '0', highlighted = false }: { icon: typeof Clock3; label: string; value?: string; highlighted?: boolean }) {
  return (
    <article className={highlighted ? 'is-highlighted' : undefined}>
      <div className="pjm-summary-heading"><span><Icon size={15} aria-hidden="true" /></span><p>{label}</p></div>
      <strong>{value}</strong>
      <small>Menunggu sumber data Verifikasi PC</small>
    </article>
  );
}
