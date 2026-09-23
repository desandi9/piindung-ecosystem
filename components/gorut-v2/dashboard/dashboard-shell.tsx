'use client';

import {
  Activity,
  BarChart3,
  Building2,
  ClipboardCheck,
  FileText,
  Landmark,
  Truck,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { GorutAppShell } from '@/components/gorut-v2/gorut-app-shell';
import { buildDashboardControl } from '@/features/gorut-v2/dashboard-control';
import { gorutMunfiqData } from '@/features/gorut-v2/munfiq-mock-data';
import { mobileNavigation } from '@/features/gorut-v2/navigation';
import { useCollectionBatches } from '@/features/gorut-v2/plpk-mobile-data';
import { gorutUpzisRecaps } from '@/features/gorut-v2/upzis-mock-data';

import { DashboardHealth } from './dashboard-health';
import { DashboardSupportingPanels, type DashboardShortcut } from './dashboard-supporting-panels';
import { DashboardTrend } from './dashboard-trend';

const shortcuts = [
  { href: '/gorut-v2/penghimpunan/penjemputan-plpk', label: 'Penjemputan PLPK', detail: 'Pantau hasil penjemputan', icon: Truck },
  { href: '/gorut-v2/penghimpunan/verifikasi-kordes', label: 'Verifikasi Kordes', detail: 'Antrean verifikasi dan koreksi', icon: ClipboardCheck },
  { href: '/gorut-v2/penghimpunan/verifikasi-upzis', label: 'Verifikasi UPZIS', detail: 'Rekap desa dan ranting', icon: Building2 },
  { href: '/gorut-v2/penghimpunan/verifikasi-pc', label: 'Verifikasi PC', detail: 'Tahap belum aktif', icon: Landmark },
  { href: '/gorut-v2/dokumen-administrasi', label: 'Dokumen Administrasi', detail: 'Preview dokumen operasional', icon: FileText },
  { href: '/gorut-v2/monitoring', label: 'Monitoring', detail: 'Kendali operasional lengkap', icon: Activity },
  { href: '/gorut-v2/laporan', label: 'Laporan', detail: 'Ringkasan hasil penghimpunan', icon: BarChart3 },
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
      <GorutAppShell title="Dashboard" loading mobileNavigation={mobileNavigation}>
        <div className="gorut-command-dashboard" aria-label="Memuat pusat kendali GoRUT">
          <div className="gorut-command-loading-head gorut-state-skeleton" />
          <div className="gorut-command-loading-priority gorut-state-skeleton" />
          <div className="gorut-command-loading-grid"><div className="gorut-state-skeleton" /><div className="gorut-state-skeleton" /></div>
        </div>
      </GorutAppShell>
    );
  }

  return (
    <GorutAppShell title="Dashboard" mobileNavigation={mobileNavigation}>
      <div className="gorut-command-dashboard">
        <DashboardHealth kpi={control.kpi} statuses={control.statuses} statusTotal={control.statusTotal} />
        <div className="gorut-dashboard-insights">
          <DashboardTrend data={control.trend} />
          <DashboardSupportingPanels regions={control.regions} shortcuts={shortcuts} />
        </div>
      </div>
    </GorutAppShell>
  );
}
