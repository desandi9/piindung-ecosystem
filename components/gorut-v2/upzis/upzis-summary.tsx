'use client';

import { Coins, HandCoins, MapPinned, UsersRound } from 'lucide-react';

import type { UpzisVillageRecap } from '@/features/gorut-v2/types';
import { formatNumber, formatRupiah, formatRupiahCompact } from '@/features/gorut-v2/formatters';
import { formatPeriodLabel } from '@/features/gorut-v2/pengambilan-options';
import { isRecapDone } from '@/features/gorut-v2/upzis-options';

export function UpzisSummary({ recaps, period }: { recaps: UpzisVillageRecap[]; period: string }) {
  const monthRecaps = recaps.filter((recap) => recap.period === period);
  const doneCount = monthRecaps.filter((recap) => isRecapDone(recap.status)).length;
  const totalCoin = monthRecaps.reduce((sum, recap) => sum + recap.totalCollected, 0);
  const munfiqCount = monthRecaps.reduce((sum, recap) => sum + recap.munfiqCount, 0);
  const totalFee = monthRecaps.reduce((sum, recap) => sum + recap.totalPlpkFee, 0);

  const values = [
    { label: 'Desa Sudah Direkap', value: `${formatNumber(doneCount)}/${formatNumber(monthRecaps.length)}`, detail: formatPeriodLabel(period), icon: MapPinned },
    { label: 'Total Penghimpunan', value: formatRupiahCompact(totalCoin), detail: `${formatNumber(monthRecaps.length)} desa tercatat`, icon: Coins },
    { label: 'Jumlah Munfiq', value: formatNumber(munfiqCount), detail: 'tercatat pada periode ini', icon: UsersRound },
    { label: 'Total Upah PLPK', value: formatRupiah(totalFee), detail: 'akumulasi seluruh desa', icon: HandCoins },
  ];

  return <section className="gorut-collect-summary" aria-label="Ringkasan rekap UPZIS">{values.map(({ label, value, detail, icon: Icon }, index) => <article key={label} style={{ '--item-delay': `${index * 40}ms` } as React.CSSProperties}><div><span className="gorut-icon-box"><Icon size={14} /></span><span>{label}</span></div><strong>{value}</strong><small>{detail}</small></article>)}</section>;
}
