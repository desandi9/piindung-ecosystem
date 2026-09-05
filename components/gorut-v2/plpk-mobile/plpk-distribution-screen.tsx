'use client';

import { CharityIcon, Coins01Icon, UserGroupIcon } from '@hugeicons/core-free-icons';

import { formatDateShort, formatNumber, formatRupiah } from '@/features/gorut-v2/formatters';
import { plpkDistributionPrograms } from '@/features/gorut-v2/plpk-mobile-content';

import { MobilePageHeader, MobileSectionHeader, MobileStatCard } from './mobile-ui';

export function PlpkDistributionScreen({ onBack }: { onBack: () => void }) {
  const beneficiaries = plpkDistributionPrograms.reduce((total, item) => total + item.beneficiaries, 0);
  const amount = plpkDistributionPrograms.reduce((total, item) => total + item.amount, 0);

  return (
    <>
      <MobilePageHeader title="Pentasyarufan" subtitle="Informasi penyaluran program" onBack={onBack} />
      <div className="plpk-scroll">
        <div className="plpk-distribution-summary">
          <MobileStatCard icon={CharityIcon} label="Total Program" value={formatNumber(plpkDistributionPrograms.length)} />
          <MobileStatCard icon={UserGroupIcon} label="Penerima Manfaat" value={formatNumber(beneficiaries)} />
          <MobileStatCard icon={Coins01Icon} label="Nominal Tersalurkan" value={formatRupiah(amount)} />
        </div>
        <MobileSectionHeader title="Program Terbaru" description="Data bersifat read-only" />
        <div className="plpk-program-list">
          {plpkDistributionPrograms.map((program) => (
            <article key={program.id} className="plpk-program-card">
              <div className={`plpk-program-visual is-${program.category.toLowerCase()}`} aria-label={`Dokumentasi placeholder ${program.title}`}><span>{program.category}</span></div>
              <div className="plpk-program-content">
                <span className="plpk-news-meta">{program.category} · {formatDateShort(program.date)}</span>
                <h2>{program.title}</h2>
                <p>{program.description}</p>
                <dl>
                  <div><dt>Lokasi</dt><dd>{program.location}</dd></div>
                  <div><dt>Penerima manfaat</dt><dd>{formatNumber(program.beneficiaries)} orang</dd></div>
                  <div><dt>Nominal</dt><dd>{formatRupiah(program.amount)}</dd></div>
                </dl>
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
