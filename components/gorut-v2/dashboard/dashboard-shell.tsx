'use client';

import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Banknote,
  Building2,
  ClipboardCheck,
  FileText,
  HandCoins,
  Landmark,
  MonitorCheck,
  Truck,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { buildDashboardControl, type DashboardTrendPoint } from '@/features/gorut-v2/dashboard-control';
import { formatNumber, formatRupiah, formatRupiahCompact } from '@/features/gorut-v2/formatters';
import { gorutMunfiqData } from '@/features/gorut-v2/munfiq-mock-data';
import { bottomNavigation, mainNavigation, masterDataNavigation, mobileNavigation, operationalNavigation } from '@/features/gorut-v2/navigation';
import { formatPeriodLabel } from '@/features/gorut-v2/pengambilan-options';
import { useCollectionBatches } from '@/features/gorut-v2/plpk-mobile-data';
import { gorutUpzisRecaps } from '@/features/gorut-v2/upzis-mock-data';

import { GorutHeader } from '../gorut-header';
import { GorutSidebar } from '../gorut-sidebar';
import { MobileBottomNav } from '../mobile-bottom-nav';
import { MobileSidebar } from '../mobile-sidebar';

const target = { current: 'Rp1,42 M', max: 'Rp2 M', percentage: 71 };

const shortcuts = [
  { href: '/gorut-v2/munfiq', label: 'Munfiq', detail: 'Direktori donatur aktif', icon: Users },
  { href: '/gorut-v2/penghimpunan/penjemputan-plpk', label: 'Penjemputan PLPK', detail: 'Pantau hasil penjemputan', icon: Truck },
  { href: '/gorut-v2/penghimpunan/verifikasi-kordes', label: 'Verifikasi Kordes', detail: 'Antrean verifikasi & koreksi', icon: ClipboardCheck },
  { href: '/gorut-v2/penghimpunan/verifikasi-upzis', label: 'Verifikasi UPZIS', detail: 'Rekap desa/ranting', icon: Building2 },
  { href: '/gorut-v2/penghimpunan/verifikasi-pc', label: 'Verifikasi PC', detail: 'Belum aktif', icon: Landmark },
  { href: '/gorut-v2/dokumen-administrasi', label: 'Dokumen Administrasi', detail: 'Preview dokumen operasional', icon: FileText },
  { href: '/gorut-v2/monitoring', label: 'Monitoring', detail: 'Control room operasional', icon: Activity },
] as const;

const statusColors = {
  incomplete: '#94A3B8',
  waiting: '#3B82F6',
  correction: '#F59E0B',
  verified: '#07965D',
} as const;

const attentionLabels = { critical: 'Koreksi', warning: 'Menunggu', info: 'Perhatian' } as const;

function chartPoints(data: DashboardTrendPoint[], key: keyof Pick<DashboardTrendPoint, 'grossAmount' | 'totalPlpkFee' | 'netAmount'>, max: number) {
  const width = 720;
  const left = 34;
  const right = 18;
  const top = 22;
  const bottom = 206;
  return data.map((item, index) => ({
    x: left + (index * (width - left - right)) / Math.max(data.length - 1, 1),
    y: bottom - (item[key] / Math.max(max, 1)) * (bottom - top),
    item,
  }));
}

function pathFrom(points: ReturnType<typeof chartPoints>) {
  return points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
}

function CollectionTrend({ data }: { data: DashboardTrendPoint[] }) {
  const [mode, setMode] = useState<'line' | 'bar'>('line');
  const max = Math.max(...data.map((item) => item.netAmount), 1);
  const net = chartPoints(data, 'netAmount', max);
  const area = net.length ? `${pathFrom(net)} L ${net.at(-1)?.x} 206 L ${net[0].x} 206 Z` : '';
  const groupWidth = 668 / Math.max(data.length, 1);
  const barWidth = Math.min(38, groupWidth / 2);
  const totalNet = data.reduce((sum, item) => sum + item.netAmount, 0);

  return (
    <section className="gorut-dashboard-chart" aria-label="Perkembangan penghimpunan">
      <header className="gorut-dashboard-section-head">
        <div><h2>Perkembangan Penghimpunan</h2><p>Agregasi batch per periode yang tersedia.</p></div>
        <div className="gorut-dashboard-chart-tools">
          <div className="gorut-dashboard-chart-switch" role="group" aria-label="Mode grafik">
            <button type="button" className={mode === 'line' ? 'is-active' : undefined} aria-pressed={mode === 'line'} onClick={() => setMode('line')}>Garis</button>
            <button type="button" className={mode === 'bar' ? 'is-active' : undefined} aria-pressed={mode === 'bar'} onClick={() => setMode('bar')}>Batang</button>
          </div>
          <div className="gorut-dashboard-chart-legend" aria-label="Legenda grafik">
            <span className="is-net">Jumlah Bersih</span>
          </div>
        </div>
      </header>
      <div className="gorut-dashboard-chart-totals">
        <div className="is-net"><span>Total Jumlah Bersih</span><strong>{formatRupiahCompact(totalNet)}</strong></div>
      </div>
      {data.length ? (
        <div className="gorut-dashboard-chart-stage">
          <svg viewBox="0 0 720 244" role="img" aria-label={`Grafik ${mode === 'line' ? 'garis' : 'batang'} jumlah bersih per periode`}>
            <defs><linearGradient id="gorut-net-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#07965D" stopOpacity=".2" /><stop offset="1" stopColor="#07965D" stopOpacity="0" /></linearGradient></defs>
            {[22, 68, 114, 160, 206].map((y) => <line key={y} className="gorut-dashboard-chart-grid" x1="34" x2="702" y1={y} y2={y} />)}
            {mode === 'line' ? (
              <>
                <path className="gorut-dashboard-chart-area" d={area} />
                <path className="gorut-dashboard-chart-line is-net" d={pathFrom(net)} />
                {net.map((point) => <circle key={`net-${point.item.period}`} className="gorut-dashboard-chart-dot is-net" cx={point.x} cy={point.y} r="4"><title>{`${formatPeriodLabel(point.item.period)} · Bersih ${formatRupiah(point.item.netAmount)}`}</title></circle>)}
              </>
            ) : data.map((item, index) => {
              const center = 34 + groupWidth * index + groupWidth / 2;
              const netHeight = (item.netAmount / max) * 184;
              return (
                <g key={`bars-${item.period}`} className="gorut-dashboard-chart-bars">
                  <rect className="is-net" x={center - barWidth / 2} y={206 - netHeight} width={barWidth} height={netHeight} rx="6"><title>{`${formatPeriodLabel(item.period)} · Bersih ${formatRupiah(item.netAmount)}`}</title></rect>
                </g>
              );
            })}
            {net.map((point) => <text key={`label-${point.item.period}`} className="gorut-dashboard-chart-label" x={point.x} y="232" textAnchor="middle">{formatPeriodLabel(point.item.period).split(' ')[0].slice(0, 3)}</text>)}
          </svg>
        </div>
      ) : <div className="gorut-dashboard-empty">Belum ada batch untuk divisualisasikan.</div>}
    </section>
  );
}

export function DashboardShell() {
  const [loading, setLoading] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notice, setNotice] = useState('');
  const batches = useCollectionBatches();

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 420);
    return () => window.clearTimeout(timer);
  }, []);

  const control = useMemo(() => buildDashboardControl(batches, gorutMunfiqData, gorutUpzisRecaps), [batches]);
  const donut = useMemo(() => {
    let offset = 0;
    const parts = control.statuses.map((item) => {
      const start = offset;
      offset += item.percentage;
      return `${statusColors[item.id]} ${start}% ${offset}%`;
    });
    return `conic-gradient(${parts.join(',')})`;
  }, [control.statuses]);

  const triggerNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2200);
  };

  if (loading) {
    return <div className="gorut-viewport"><div className="gorut-app"><GorutSidebar target={target} /><div className="gorut-workspace"><GorutHeader title="Dashboard" onMenuOpen={() => setMobileMenu(true)} /><main className="gorut-main"><div className="gorut-placeholder-skeleton" aria-busy="true" aria-label="Memuat dashboard" /></main></div></div></div>;
  }

  return (
    <div className="gorut-viewport">
      <div className="gorut-app">
        <GorutSidebar target={target} />
        <div className="gorut-workspace">
          <GorutHeader title="Dashboard" onMenuOpen={() => setMobileMenu(true)} />
          <main className="gorut-main gorut-dashboard-main">
            <section className="gorut-dashboard-heading">
              <div><p>OPERASIONAL</p><h1>Dashboard GORUT</h1><span>Kondisi penghimpunan dan tindakan prioritas berdasarkan data operasional saat ini.</span></div>
              <div className="gorut-dashboard-period"><MonitorCheck size={17} /><div><small>Periode aktif</small><strong>{formatPeriodLabel(control.activePeriod)}</strong></div></div>
            </section>

            <section className="gorut-dashboard-kpis" aria-label="KPI utama">
              <article className="is-main"><div className="gorut-dashboard-kpi-icon"><Banknote size={18} /></div><span>Jumlah Bersih Periode Ini</span><strong>{formatRupiah(control.kpi.netAmount)}</strong><small>Kotor {formatRupiahCompact(control.kpi.grossAmount)} dikurangi bisyaroh PLPK</small><div className="gorut-dashboard-kpi-track"><i style={{ width: `${control.kpi.grossAmount ? Math.round((control.kpi.netAmount / control.kpi.grossAmount) * 100) : 0}%` }} /></div></article>
              <article><div className="gorut-dashboard-kpi-icon"><Users size={17} /></div><span>Munfiq Aktif</span><strong>{formatNumber(control.kpi.munfiqActive)}</strong><small>dari {formatNumber(control.kpi.munfiqTotal)} Munfiq</small><div className="gorut-dashboard-kpi-track"><i style={{ width: `${control.kpi.munfiqTotal ? Math.round((control.kpi.munfiqActive / control.kpi.munfiqTotal) * 100) : 0}%` }} /></div></article>
              <article><div className="gorut-dashboard-kpi-icon"><HandCoins size={17} /></div><span>Batch Berjalan</span><strong>{formatNumber(control.kpi.batchRunning)}</strong><small>dari {formatNumber(control.kpi.batchTotal)} batch periode aktif</small><div className="gorut-dashboard-kpi-track"><i style={{ width: `${control.kpi.batchTotal ? Math.round((control.kpi.batchRunning / control.kpi.batchTotal) * 100) : 0}%` }} /></div></article>
              <article className="is-warning"><div className="gorut-dashboard-kpi-icon"><AlertTriangle size={17} /></div><span>Menunggu Kordes</span><strong>{formatNumber(control.kpi.waitingKordes)}</strong><small>batch perlu diverifikasi</small></article>
            </section>

            <div className="gorut-dashboard-visuals">
              <CollectionTrend data={control.trend} />
              <section className="gorut-dashboard-composition">
                <header className="gorut-dashboard-section-head"><div><h2>Komposisi Status</h2><p>Seluruh batch existing.</p></div></header>
                <div className="gorut-dashboard-donut" style={{ background: donut }} role="img" aria-label={`Komposisi ${control.statusTotal} batch`}><div><strong>{formatNumber(control.statusTotal)}</strong><span>Total Batch</span></div></div>
                <ul>{control.statuses.map((item) => <li key={item.id}><i style={{ background: statusColors[item.id] }} /><span>{item.label}</span><strong>{formatNumber(item.count)}</strong><small>{item.percentage}%</small></li>)}</ul>
              </section>
            </div>

            <section className="gorut-dashboard-workflow">
              <header className="gorut-dashboard-section-head"><div><h2>Alur Operasional</h2><p>PLPK → Kordes → UPZIS → PC</p></div></header>
              <div className="gorut-dashboard-workflow-grid">{control.flow.map((step) => <article key={step.id} className={`is-${step.tone}${step.bottleneck ? ' is-bottleneck' : ''}`}><div className="gorut-dashboard-workflow-head"><span>{step.label}</span>{step.bottleneck ? <b>Bottleneck</b> : null}</div><strong>{formatNumber(step.count)}</strong><small>{step.countLabel}</small><span className="gorut-dashboard-workflow-status">{step.status}</span>{step.progress == null ? <em>Progress belum tersedia</em> : <><div className="gorut-dashboard-progress"><i style={{ width: `${step.progress}%` }} /></div><em>{step.done}/{step.total} selesai · {step.progress}%</em></>}<Link href={step.href}>Lihat detail<ArrowRight size={13} /></Link></article>)}</div>
            </section>

            <div className="gorut-dashboard-operations">
              <section className="gorut-dashboard-attention">
                <header className="gorut-dashboard-section-head"><div><h2>Perlu Perhatian</h2><p>Enam prioritas teratas.</p></div></header>
                {control.attention.length ? <ul>{control.attention.map((item) => <li key={item.id} className={`is-${item.priority}`}><span className="gorut-dashboard-priority">{attentionLabels[item.priority]}</span><div><strong>{item.title}</strong><small>{item.detail}</small></div><Link href={item.href}>{item.hrefLabel}<ArrowRight size={13} /></Link></li>)}</ul> : <div className="gorut-dashboard-empty">Tidak ada item yang membutuhkan tindakan segera.</div>}
              </section>

              <section className="gorut-dashboard-regions">
                <header className="gorut-dashboard-section-head"><div><h2>Progress Wilayah</h2><p>Batch selesai dibanding total batch periode aktif.</p></div></header>
                {control.regions.length ? <ul>{control.regions.map((region) => <li key={region.id}><div className="gorut-dashboard-region-head"><div><strong>{region.village}</strong><span>{region.kecamatan} · {region.plpkCount} PLPK</span></div><b>{region.progress}%</b></div><div className="gorut-dashboard-region-track"><i style={{ width: `${region.progress}%` }} /></div><div className="gorut-dashboard-region-foot"><span>{region.completedBatch}/{region.totalBatch} batch selesai</span><strong>{formatRupiah(region.netAmount)}</strong></div></li>)}</ul> : <div className="gorut-dashboard-empty">Belum ada wilayah pada periode aktif.</div>}
              </section>
            </div>

            <section className="gorut-dashboard-shortcuts">
              <header className="gorut-dashboard-section-head"><div><h2>Shortcut Operasional</h2><p>Akses cepat ke workflow utama.</p></div></header>
              <div className="gorut-dashboard-shortcut-grid">{shortcuts.map((item) => { const Icon = item.icon; return <Link key={item.href} href={item.href} className="gorut-dashboard-shortcut"><span className="gorut-dashboard-shortcut-icon"><Icon size={17} /></span><span><strong>{item.label}</strong><small>{item.detail}</small></span><ArrowRight size={15} /></Link>; })}</div>
            </section>
          </main>
        </div>
        <MobileSidebar open={mobileMenu} onClose={() => setMobileMenu(false)} navigation={mainNavigation} secondaryNavigation={operationalNavigation} masterNavigation={masterDataNavigation} bottomNavigation={bottomNavigation} target={target} />
        <MobileBottomNav navigation={mobileNavigation} onMore={() => setMobileMenu(true)} onUnavailable={(label) => triggerNotice(`${label}: Segera tersedia`)} />
        {notice ? <div className="gorut-mobile-notice" role="status">{notice}</div> : null}
      </div>
    </div>
  );
}
