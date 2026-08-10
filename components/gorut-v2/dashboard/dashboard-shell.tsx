'use client';

import {
  Activity,
  ArrowUpRight,
  Building2,
  ClipboardCheck,
  FileText,
  Landmark,
  MonitorCheck,
  Truck,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { GorutAppShell } from '@/components/gorut-v2/gorut-app-shell';
import { buildDashboardControl } from '@/features/gorut-v2/dashboard-control';
import { gorutMunfiqData } from '@/features/gorut-v2/munfiq-mock-data';
import { mobileNavigation } from '@/features/gorut-v2/navigation';
import { formatPeriodLabel } from '@/features/gorut-v2/pengambilan-options';
import { useCollectionBatches } from '@/features/gorut-v2/plpk-mobile-data';
import { gorutUpzisRecaps } from '@/features/gorut-v2/upzis-mock-data';

import { DashboardHealth } from './dashboard-health';
import { DashboardPriorityQueue } from './dashboard-priority-queue';
import { DashboardSupportingPanels, type DashboardShortcut } from './dashboard-supporting-panels';
import { DashboardTrend } from './dashboard-trend';
import { DashboardWorkflow } from './dashboard-workflow';

const target = { current: 'Rp1,42 M', max: 'Rp2 M', percentage: 71 };

const shortcuts = [
  { href: '/gorut-v2/munfiq', label: 'Munfiq', detail: 'Direktori donatur aktif', icon: Users },
  { href: '/gorut-v2/penghimpunan/penjemputan-plpk', label: 'Penjemputan PLPK', detail: 'Pantau hasil penjemputan', icon: Truck },
  { href: '/gorut-v2/penghimpunan/verifikasi-kordes', label: 'Verifikasi Kordes', detail: 'Antrean verifikasi dan koreksi', icon: ClipboardCheck },
  { href: '/gorut-v2/penghimpunan/verifikasi-upzis', label: 'Verifikasi UPZIS', detail: 'Rekap desa dan ranting', icon: Building2 },
  { href: '/gorut-v2/penghimpunan/verifikasi-pc', label: 'Verifikasi PC', detail: 'Tahap belum aktif', icon: Landmark },
  { href: '/gorut-v2/dokumen-administrasi', label: 'Dokumen Administrasi', detail: 'Preview dokumen operasional', icon: FileText },
  { href: '/gorut-v2/monitoring', label: 'Monitoring', detail: 'Kendali operasional lengkap', icon: Activity },
] as const satisfies readonly DashboardShortcut[];

export function DashboardShell() {
  const [loading, setLoading] = useState(true);
  const batches = useCollectionBatches();

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 420);
    return () => window.clearTimeout(timer);
  }, []);

  const control = useMemo(
    () => buildDashboardControl(batches, gorutMunfiqData, gorutUpzisRecaps),
    [batches],
  );

  if (loading) {
    return (
      <GorutAppShell title="Dashboard" target={target} loading mobileNavigation={mobileNavigation}>
        <div className="gorut-command-dashboard" aria-label="Memuat pusat kendali GoRUT">
          <div className="gorut-command-loading-head gorut-state-skeleton" />
          <div className="gorut-command-loading-priority gorut-state-skeleton" />
          <div className="gorut-command-loading-grid"><div className="gorut-state-skeleton" /><div className="gorut-state-skeleton" /></div>
        </div>
      </GorutAppShell>
    );
  }

  return (
    <GorutAppShell title="Dashboard" target={target} mobileNavigation={mobileNavigation}>
      <div className="gorut-command-dashboard">
        <header className="gorut-command-intro gorut-motion-enter">
          <div>
            <h1>Pusat kendali penghimpunan</h1>
            <p>Lihat hambatan, tindak lanjut, dan pergerakan dana GoRUT dalam satu alur kerja.</p>
          </div>
          <div className="gorut-command-intro-actions">
            <div className="gorut-command-period"><MonitorCheck size={17} aria-hidden="true" /><span><small>Periode aktif</small><strong>{formatPeriodLabel(control.activePeriod)}</strong></span></div>
            <Link href="/gorut-v2/monitoring">Buka monitoring <ArrowUpRight size={15} aria-hidden="true" /></Link>
          </div>
        </header>

        <DashboardPriorityQueue items={control.attention} />
        <DashboardHealth kpi={control.kpi} statuses={control.statuses} statusTotal={control.statusTotal} />
        <DashboardTrend data={control.trend} />
        <DashboardWorkflow steps={control.flow} />
        <DashboardSupportingPanels regions={control.regions} shortcuts={shortcuts} />
      </div>
    </GorutAppShell>
  );
}
