import { ArrowUpRight, MapPinned, type LucideIcon } from 'lucide-react';
import Link from 'next/link';

import type { DashboardRegionProgress } from '@/features/gorut-v2/dashboard-control';
import { formatRupiah } from '@/features/gorut-v2/formatters';

export type DashboardShortcut = {
  href: string;
  label: string;
  detail: string;
  icon: LucideIcon;
};

export function DashboardSupportingPanels({ regions, shortcuts }: { regions: DashboardRegionProgress[]; shortcuts: readonly DashboardShortcut[] }) {
  return (
    <div className="gorut-command-supporting">
      <section className="gorut-command-regions" aria-labelledby="gorut-regions-title">
        <header className="gorut-command-section-head"><div><h2 id="gorut-regions-title">Progress wilayah</h2><p>Wilayah dengan penyelesaian batch terendah muncul lebih dulu.</p></div><MapPinned size={18} aria-hidden="true" /></header>
        {regions.length ? <ul>{regions.map((region) => (
          <li key={region.id}>
            <div><strong>{region.village}</strong><span>{region.kecamatan} · {region.plpkCount} PLPK</span></div>
            <div className="gorut-command-region-progress"><span><i style={{ width: `${region.progress}%` }} /></span><strong>{region.progress}%</strong></div>
            <div><small>{region.completedBatch}/{region.totalBatch} batch selesai</small><b>{formatRupiah(region.netAmount)}</b></div>
          </li>
        ))}</ul> : <div className="gorut-state-empty"><h2>Belum ada wilayah</h2><p>Data wilayah untuk periode aktif belum tersedia.</p></div>}
      </section>

      <section className="gorut-command-shortcuts" aria-labelledby="gorut-shortcuts-title">
        <header className="gorut-command-section-head"><div><h2 id="gorut-shortcuts-title">Akses operasional</h2><p>Pindah langsung ke pekerjaan yang dibutuhkan.</p></div></header>
        <nav aria-label="Akses cepat GoRUT">
          {shortcuts.map((item) => {
            const Icon = item.icon;
            return <Link key={item.href} href={item.href}><span><Icon size={17} aria-hidden="true" /></span><div><strong>{item.label}</strong><small>{item.detail}</small></div><ArrowUpRight size={15} aria-hidden="true" /></Link>;
          })}
        </nav>
      </section>
    </div>
  );
}
