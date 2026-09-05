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
  const safePercentage = Math.min(100, Math.max(0, percentage));

  return (
    <section className="gorut-target-card" aria-label="Target penghimpunan" title={collapsed ? `Target penghimpunan: ${safePercentage}% tercapai` : undefined}>
      <div className="gorut-target-title"><span className="gorut-target-icon"><Target size={14} aria-hidden="true" /></span><span className="gorut-target-label">Target Penghimpunan</span></div>
      <div className="gorut-target-values"><strong>{current}</strong><span>/ {max}</span></div>
      <div className="gorut-progress-track" role="progressbar" aria-valuenow={safePercentage} aria-valuemin={0} aria-valuemax={100} aria-label="Progress target penghimpunan"><span style={{ width: `${safePercentage}%` }} /></div>
      <div className="gorut-target-footer"><span>{safePercentage}% tercapai</span><Link href="/gorut-v2/monitoring">Lihat target <ChevronRight size={12} aria-hidden="true" /></Link></div>
    </section>
  );
}
