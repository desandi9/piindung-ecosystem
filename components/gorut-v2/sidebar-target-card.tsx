'use client';

import { ChevronRight, Target } from 'lucide-react';
import Link from 'next/link';

type SidebarTargetCardProps = {
  current: string;
  max: string;
  percentage: number;
  collapsed?: boolean;
};

export function SidebarTargetCard({ current, max, percentage, collapsed = false }: SidebarTargetCardProps) {
  return (
    <section className="gorut-target-card" aria-label="Target penghimpunan" title={collapsed ? `Target penghimpunan: ${percentage}% tercapai` : undefined}>
      <div className="gorut-target-title"><span className="gorut-target-icon"><Target size={13} /></span><span className="gorut-target-label">Target Penghimpunan</span></div>
      <div className="gorut-target-values"><strong>{current}</strong><span>/ {max}</span></div>
      <div className="gorut-progress-track" role="progressbar" aria-valuenow={percentage} aria-valuemin={0} aria-valuemax={100} aria-label="Progress target penghimpunan"><span style={{ width: `${percentage}%` }} /></div>
      <div className="gorut-target-footer"><span>{percentage}% tercapai</span><Link href="/gorut-v2/monitoring">Lihat target <ChevronRight size={12} /></Link></div>
    </section>
  );
}
