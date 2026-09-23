'use client';

import { AlertTriangle, CheckCircle2, Download, Eye, Info, PackageCheck, RefreshCw, Rows3, Search, SearchX, ShieldCheck } from 'lucide-react';
import { useDeferredValue, useMemo, useRef, useState } from 'react';

import { bottomNavigation, mainNavigation, masterDataNavigation, mobileNavigation, operationalNavigation } from '@/features/gorut-v2/navigation';
import type { GorutPackageAction, GorutPackageState, PackageTransitionCommand } from '@/features/gorut-v2/package-api-client';
import { packageActionLabels, packageBlockingReasonLabel, packageFinancialLabel, packageStateLabel, packageStateLabels, packageStatusTone } from '@/features/gorut-v2/package-api-view-model';
import { usePackageApi } from '@/features/gorut-v2/use-package-api';
import { GorutHeader } from '../gorut-header';
import { GorutSidebar } from '../gorut-sidebar';
import { MobileBottomNav } from '../mobile-bottom-nav';
import { MobileSidebar } from '../mobile-sidebar';
import { PenghimpunanPageHeader } from '../penghimpunan-page-header';
import { PenghimpunanTabs } from '../penghimpunan-tabs';
import { UpzisPackageDetail } from './upzis-package-detail';
import { UpzisSkeleton } from './upzis-skeleton';

const target = { current: 'Rp1,42 M', max: 'Rp2 M', percentage: 71 };

export function UpzisPackageShell() {
  const [query, setQuery] = useState('');
  const [period, setPeriod] = useState('');
  const [state, setState] = useState<GorutPackageState | ''>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [feedback, setFeedback] = useState('');
  const detailTriggerRef = useRef<HTMLElement | null>(null);
  const deferredQuery = useDeferredValue(query.trim());
  const api = usePackageApi({ page, pageSize, search: deferredQuery || undefined, period: period || undefined, state: state || undefined });
  const pageCount = Math.max(1, Math.ceil(api.total / pageSize));
  const readyCount = api.packages.filter((item) => item.financial.status === 'READY').length;
  const actionableCount = api.packages.filter((item) => item.workflow.availableActions.length > 0).length;
  const blockedCount = api.packages.filter((item) => item.financial.status !== 'READY' || item.workflow.blockingReasons.length > 0).length;
  const selectedPendingAction = useMemo<GorutPackageAction | null>(() => {
    if (!selectedCode) return null;
    return (['SUBMIT', 'APPROVE', 'RETURN'] as const).find((action) => api.isPending(`package:${selectedCode}:${action}`)) ?? null;
  }, [api, selectedCode]);

  const openDetail = async (packageCode: string, trigger?: HTMLElement) => {
    detailTriggerRef.current = trigger ?? null;
    setSelectedCode(packageCode);
    api.clearDetail();
    await api.loadDetail(packageCode).catch(() => undefined);
  };

  const closeDetail = () => {
    if (selectedPendingAction) return;
    setSelectedCode(null);
    api.clearDetail();
    window.requestAnimationFrame(() => detailTriggerRef.current?.focus());
  };

  const executeTransition = async (command: PackageTransitionCommand) => {
    if (!selectedCode) return;
    const canonical = await api.executeTransition(selectedCode, command);
    const message = command.action === 'APPROVE'
      ? 'Package diteruskan ke proses PC berdasarkan state canonical server.'
      : command.action === 'RETURN'
        ? 'Package dikembalikan secara targeted untuk koreksi Ranting/collection.'
        : canonical.workflow.currentState === 'WAITING_UPZIS_VERIFICATION'
          ? 'Package berhasil dikirim untuk verifikasi UPZIS.'
          : 'Transition SUBMIT selesai dan package canonical telah dimuat ulang.';
    setFeedback(message);
  };

  const resetFilters = () => { setQuery(''); setPeriod(''); setState(''); setPage(1); };

  return (
    <div className="gorut-viewport"><div className="gorut-app">
      <GorutSidebar />
      <div className="gorut-workspace">
        <GorutHeader title="Penghimpunan" onMenuOpen={() => setMobileMenu(true)} />
        <main className="gorut-main gorut-collect-main gorut-collection-workspace">
          <PenghimpunanPageHeader title="Verifikasi UPZIS" description="Periksa package authoritative Kecamatan, lakukan maker-checker, dan teruskan hasil factual ke proses PC." />
          <PenghimpunanTabs />

          <section className="pjm-filters upzis-verification-filters" aria-label="Filter package UPZIS">
            <div className="pjm-filter upzis-package-search-filter"><label className="pjm-filter-label" htmlFor="upzis-package-search"><Search size={14} />Cari package</label><input id="upzis-package-search" type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Kode package atau Kecamatan" /></div>
            <div className="pjm-filter"><label className="pjm-filter-label" htmlFor="upzis-package-period">Periode</label><input id="upzis-package-period" type="month" value={period} onChange={(event) => { setPeriod(event.target.value); setPage(1); }} /></div>
            <div className="pjm-filter"><label className="pjm-filter-label" htmlFor="upzis-package-state">State workflow</label><select id="upzis-package-state" value={state} onChange={(event) => { setState(event.target.value as GorutPackageState | ''); setPage(1); }}><option value="">Semua state</option>{(Object.keys(packageStateLabels) as GorutPackageState[]).map((value) => <option key={value} value={value}>{packageStateLabels[value]}</option>)}</select></div>
            <div className="upzis-verification-filter-footer"><span>Operational mode · Package API authoritative</span><button type="button" className="gorut-collect-reset" onClick={resetFilters} disabled={!query && !period && !state}><RefreshCw size={13} />Reset</button></div>
          </section>

          <section className="pjm-summary upzis-verification-summary" aria-label="Ringkasan package UPZIS">
            <SummaryCard icon={PackageCheck} label="Package pada halaman" value={String(api.packages.length)} detail={`${api.total} package ditemukan server`} />
            <SummaryCard icon={CheckCircle2} label="Financial READY" value={String(readyCount)} detail="canonical financial snapshot" />
            <SummaryCard icon={ShieldCheck} label="Dapat ditindak" value={String(actionableCount)} detail="berdasarkan availableActions server" />
            <SummaryCard icon={AlertTriangle} label="Perlu perhatian" value={String(blockedCount)} detail="financial atau workflow blocker" highlighted />
          </section>

          <p className="gorut-collect-readonly-note upzis-verification-note"><Info size={14} />Total Penghimpunan, Bisyaroh PLPK, Jumlah Bersih, roster, state, timestamp, dan seluruh aksi berasal dari server. Halaman ini tidak menjalankan proses PC atau Setoran.</p>
          {api.notice ? <div className="upzis-package-notice" role="status"><Info size={15} />{api.notice}</div> : null}
          {feedback ? <div className="upzis-package-notice is-success" role="status"><CheckCircle2 size={15} />{feedback}<button type="button" onClick={() => setFeedback('')} aria-label="Tutup pemberitahuan">×</button></div> : null}
          {api.error ? <div className="upzis-package-notice is-error" role="alert"><AlertTriangle size={15} /><span>{api.error}</span><button type="button" onClick={() => void api.reload()} disabled={api.loading}>Coba lagi</button></div> : null}

          <section className="pjm-panel gorut-collect-panel upzis-verification-panel" aria-busy={api.loading}>
            <header className="pjm-toolbar upzis-verification-toolbar"><div className="pjm-toolbar-primary"><div className="pjm-toolbar-heading"><h2>Package Kecamatan / periode</h2><p>Server canonical · {api.total} package</p></div></div><div className="pjm-toolbar-actions upzis-verification-toolbar-actions"><label className="pjm-page-size"><Rows3 size={15} /><span>Tampilkan</span><select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}><option value={10}>10</option><option value={20}>20</option><option value={50}>50</option></select><span>baris</span></label><button type="button" className="pjm-export" disabled aria-label="Export tidak termasuk scope Phase 2C.4"><Download size={15} />Export</button></div></header>

            {api.loading && !api.packages.length ? <UpzisSkeleton /> : !api.packages.length ? <div className="gorut-collect-empty"><SearchX size={28} /><h2>Belum ada package yang cocok</h2><p>Ubah filter atau coba lagi setelah Kordes menyelesaikan verifikasi dan technical reconciliation.</p><button type="button" className="gorut-button gorut-secondary-button" onClick={resetFilters}>Reset Filter</button></div> : <>
              <PackageTable packages={api.packages} onDetail={openDetail} />
              <PackageCards packages={api.packages} onDetail={openDetail} />
              <footer className="gorut-collect-pagination"><div className="gorut-pagination-info">Halaman <strong>{page}</strong> dari <strong>{pageCount}</strong> · <strong>{api.total}</strong> package</div><div className="gorut-pagination-buttons"><button type="button" disabled={page === 1 || api.loading} onClick={() => setPage(1)}>Awal</button><button type="button" disabled={page === 1 || api.loading} onClick={() => setPage((current) => current - 1)}>Sebelumnya</button><span className="gorut-pagination-current">Halaman <strong>{page}</strong></span><button type="button" disabled={page >= pageCount || api.loading} onClick={() => setPage((current) => current + 1)}>Berikutnya</button><button type="button" disabled={page >= pageCount || api.loading} onClick={() => setPage(pageCount)}>Akhir</button></div></footer>
            </>}
          </section>
        </main>
      </div>
      <MobileSidebar open={mobileMenu} onClose={() => setMobileMenu(false)} navigation={mainNavigation} secondaryNavigation={operationalNavigation} masterNavigation={masterDataNavigation} bottomNavigation={bottomNavigation} target={target} />
      <MobileBottomNav navigation={mobileNavigation} onMore={() => setMobileMenu(true)} onUnavailable={(label) => setFeedback(`${label}: belum tersedia pada fase ini.`)} />
      <UpzisPackageDetail open={Boolean(selectedCode)} detail={api.detail?.identity.packageCode === selectedCode ? api.detail : null} loading={api.detailLoading} pendingAction={selectedPendingAction} onClose={closeDetail} onRetry={() => { if (selectedCode) void api.loadDetail(selectedCode); }} onTransition={executeTransition} />
    </div></div>
  );
}

type PackageRows = ReturnType<typeof usePackageApi>['packages'];

function PackageTable({ packages, onDetail }: { packages: PackageRows; onDetail: (code: string, trigger?: HTMLElement) => Promise<void> }) {
  return <div className="pjm-table-wrap upzis-verification-table-wrap"><table className="pjm-table upzis-verification-table upzis-package-table"><thead><tr><th>Package / Periode</th><th>Kecamatan / Coverage</th><th>PLPK / Munfiq</th><th className="is-amount">Jumlah Tercatat</th><th className="is-amount">Total Penghimpunan</th><th className="is-amount">Bisyaroh PLPK</th><th className="is-amount">Jumlah Bersih</th><th className="is-status">State</th><th>Action server</th><th className="is-action">Aksi</th></tr></thead><tbody>{packages.map((item) => <tr key={item.identity.packageCode} className={item.financial.status !== 'READY' ? 'is-incomplete' : undefined}>
    <td><strong>{item.identity.packageCode}</strong><small>{item.period.label} · rev {item.identity.revision}</small></td>
    <td><strong>{item.region.kecamatan.name}</strong><small>{item.coverage.included} included · {item.coverage.excluded} excluded · {item.coverage.unresolved} unresolved</small></td>
    <td>{item.transactions.plpkCount} PLPK<small>{item.transactions.munfiqCount} Munfiq · {item.transactions.count} transaksi</small></td>
    <td className="is-amount">{packageFinancialLabel(item, 'recordedAmount')}</td><td className="is-amount">{packageFinancialLabel(item, 'grossAmount')}</td><td className="is-amount">{packageFinancialLabel(item, 'totalPlpkFee')}</td><td className="is-amount"><strong>{packageFinancialLabel(item, 'netAmount')}</strong>{item.financial.status !== 'READY' ? <small>Belum siap</small> : null}</td>
    <td className="is-status"><span className={`pjm-badge upzis-verification-badge ${packageStatusTone(item.workflow.currentState, item.financial.status)}`}>{packageStateLabel(item.workflow.currentState)}</span>{item.workflow.blockingReasons[0] ? <small title={item.workflow.blockingReasons.map(packageBlockingReasonLabel).join('\n')}>{packageBlockingReasonLabel(item.workflow.blockingReasons[0])}</small> : null}</td>
    <td><div className="upzis-package-action-summary">{item.workflow.availableActions.length ? item.workflow.availableActions.map((action) => <span key={action}>{packageActionLabels[action]}</span>) : <small>Tidak ada aksi tersedia</small>}</div></td>
    <td><button type="button" className="upzis-verification-action" onClick={(event) => void onDetail(item.identity.packageCode, event.currentTarget)}><Eye size={13} />Detail</button></td>
  </tr>)}</tbody></table></div>;
}

function PackageCards({ packages, onDetail }: { packages: PackageRows; onDetail: (code: string, trigger?: HTMLElement) => Promise<void> }) {
  return <div className="gorut-collect-mobile-list upzis-package-mobile-list">{packages.map((item) => <article key={item.identity.packageCode}><div className="gorut-collect-card-top"><button type="button" className="gorut-upzis-card-button" onClick={(event) => void onDetail(item.identity.packageCode, event.currentTarget)}><strong>{item.identity.packageCode}</strong><small>{item.period.label} · {item.region.kecamatan.name}</small></button><button type="button" className="gorut-icon-button" onClick={(event) => void onDetail(item.identity.packageCode, event.currentTarget)} aria-label={`Detail ${item.identity.packageCode}`}><Eye size={16} /></button></div><div className="gorut-munfiq-card-middle"><span className={`gorut-upzis-status ${packageStatusTone(item.workflow.currentState, item.financial.status)}`}>{packageStateLabel(item.workflow.currentState)}</span><span className="gorut-collect-amount">{packageFinancialLabel(item, 'netAmount')}</span></div><dl><div><dt>Coverage</dt><dd>{item.coverage.included} included · {item.coverage.unresolved} unresolved</dd></div><div><dt>PLPK / Munfiq</dt><dd>{item.transactions.plpkCount} / {item.transactions.munfiqCount}</dd></div><div><dt>Total Penghimpunan</dt><dd>{packageFinancialLabel(item, 'grossAmount')}</dd></div><div><dt>Bisyaroh PLPK</dt><dd>{packageFinancialLabel(item, 'totalPlpkFee')}</dd></div><div><dt>Action server</dt><dd>{item.workflow.availableActions.map((action) => packageActionLabels[action]).join(', ') || 'Tidak ada'}</dd></div></dl></article>)}</div>;
}

function SummaryCard({ icon: Icon, label, value, detail, highlighted = false }: { icon: typeof PackageCheck; label: string; value: string; detail: string; highlighted?: boolean }) {
  return <article className={highlighted ? 'is-highlighted' : undefined}><div className="pjm-summary-heading"><span><Icon size={17} strokeWidth={1.8} /></span><p>{label}</p></div><strong>{value}</strong><small>{detail}</small></article>;
}
