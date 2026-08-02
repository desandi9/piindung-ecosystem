'use client';

import { Calculator01Icon, CharityIcon, HandHeartIcon, Mosque01Icon, ZakatIcon } from '@hugeicons/core-free-icons';
import { Info } from 'lucide-react';
import { useState } from 'react';

import { MobileServiceIcon } from './mobile-service-icon';
import { MobilePageHeader, MobileSectionHeader, MobileServiceTile } from './mobile-ui';

export function PlpkZiswafScreen({ onBack }: { onBack: () => void }) {
  const services = [
    { icon: ZakatIcon, title: 'Zakat', description: 'Informasi jenis dan ketentuan umum zakat.', detail: 'Zakat merupakan kewajiban atas harta yang telah memenuhi ketentuan nisab dan haul. Konsultasikan jenis zakat dengan petugas resmi.' },
    { icon: HandHeartIcon, title: 'Infak', description: 'Kenali peran infak dalam program sosial.', detail: 'Infak mendukung program sosial secara sukarela tanpa batas nominal tertentu.' },
    { icon: CharityIcon, title: 'Sedekah', description: 'Informasi sedekah dan manfaatnya.', detail: 'Sedekah dapat diberikan dalam bentuk materi maupun nonmateri untuk menghadirkan manfaat bagi sesama.' },
    { icon: Mosque01Icon, title: 'Wakaf', description: 'Pengantar wakaf untuk kemaslahatan umat.', detail: 'Wakaf menjaga manfaat aset atau dana secara berkelanjutan sesuai peruntukan yang ditetapkan.' },
    { icon: Calculator01Icon, title: 'Kalkulator Zakat', description: 'Fitur perhitungan sedang dipersiapkan.', detail: 'Kalkulator zakat belum aktif pada prototipe ini. Tidak ada hasil hitung atau transaksi yang disimulasikan.' },
  ];
  const [selectedTitle, setSelectedTitle] = useState('Zakat');
  const selected = services.find((service) => service.title === selectedTitle) ?? services[0];
  return (
    <>
      <MobilePageHeader title="e-ZISWAF" subtitle="Pusat informasi dana sosial Islam" onBack={onBack} />
      <div className="plpk-scroll">
        <section className="plpk-info-hero">
          <span className="plpk-service-icon"><MobileServiceIcon icon={Mosque01Icon} label="e-ZISWAF" size={24} /></span>
          <div><span className="plpk-service-badge">Informasi</span><h1>Layanan informatif e-ZISWAF</h1><p>Pelajari layanan zakat, infak, sedekah, dan wakaf. Transaksi digital belum tersedia pada prototipe ini.</p></div>
        </section>
        <div className="plpk-callout"><Info size={17} aria-hidden="true" /><span><strong>Belum melayani transaksi</strong>Tidak ada pembayaran atau payment gateway aktif pada halaman ini.</span></div>
        <MobileSectionHeader title="Pilih Informasi" description="Materi dasar layanan e-ZISWAF" />
        <div className="plpk-service-list">
          {services.map((service) => <MobileServiceTile key={service.title} {...service} badge={service.title === 'Kalkulator Zakat' ? 'Disiapkan' : undefined} onClick={() => setSelectedTitle(service.title)} />)}
        </div>
        <section className="plpk-ziswaf-detail" aria-live="polite"><strong>{selected.title}</strong><p>{selected.detail}</p></section>
      </div>
    </>
  );
}
