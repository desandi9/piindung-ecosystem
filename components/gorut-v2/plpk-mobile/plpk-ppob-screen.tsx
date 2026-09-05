'use client';

import { ElectricHome01Icon, GridViewIcon, HealthIcon, ReceiptTextIcon, SmartPhone01Icon, WaterEnergyIcon } from '@hugeicons/core-free-icons';

import { MobilePageHeader, MobileSectionHeader } from './mobile-ui';
import { MobileServiceIcon } from './mobile-service-icon';

export function PlpkPpobScreen({ onBack }: { onBack: () => void }) {
  const categories = [
    { title: 'Pulsa', icon: SmartPhone01Icon },
    { title: 'Paket Data', icon: GridViewIcon },
    { title: 'Token Listrik', icon: ElectricHome01Icon },
    { title: 'Tagihan Listrik', icon: ReceiptTextIcon },
    { title: 'PDAM', icon: WaterEnergyIcon },
    { title: 'BPJS', icon: HealthIcon },
    { title: 'Voucher Digital', icon: ReceiptTextIcon },
  ];
  return (
    <>
      <MobilePageHeader title="PPOB" subtitle="Persiapan layanan pembayaran digital" onBack={onBack} />
      <div className="plpk-scroll">
        <section className="plpk-coming-hero"><span className="plpk-service-badge">Segera Hadir</span><h1>Layanan harian dalam satu aplikasi</h1><p>Kategori PPOB sedang dipersiapkan. Belum ada saldo, checkout, pembayaran, atau transaksi yang aktif.</p></section>
        <MobileSectionHeader title="Kategori Layanan" description="Pratinjau layanan yang direncanakan" />
        <div className="plpk-ppob-grid">
          {categories.map((item) => <article key={item.title}><span><MobileServiceIcon icon={item.icon} label={item.title} /></span><strong>{item.title}</strong><small>Segera Hadir</small></article>)}
        </div>
      </div>
    </>
  );
}
