'use client';

import { Analytics02Icon, CharityIcon, Mosque01Icon, News01Icon, Notification02Icon, SmartPhone01Icon, UserGroupIcon, UserMultipleIcon } from '@hugeicons/core-free-icons';

import type { KordesSubScreen } from '@/features/gorut-v2/kordes-mobile-navigation';

import { MobilePageHeader, MobileSectionHeader, MobileServiceTile } from '../plpk-mobile/mobile-ui';

export function KordesServicesTab({ unreadCount, onOpen }: { unreadCount: number; onOpen: (screen: KordesSubScreen) => void }) {
  return <><MobilePageHeader title="Layanan" subtitle="Pusat operasional dan informasi Kordes" /><div className="plpk-scroll plpk-services-screen">
    <section><MobileSectionHeader title="Operasional" description="Data dalam ranting Anda" /><div className="plpk-service-list"><MobileServiceTile icon={UserGroupIcon} title="PLPK" description="Petugas dalam binaan Kordes" onClick={() => onOpen('plpk')} /><MobileServiceTile icon={UserMultipleIcon} title="Munfiq" description="Seluruh Munfiq dalam ranting" onClick={() => onOpen('munfiq')} /><MobileServiceTile icon={Analytics02Icon} title="Rekap Ranting" description="Ringkasan perolehan seluruh PLPK" onClick={() => onOpen('recap')} /><MobileServiceTile icon={Notification02Icon} title="Notifikasi" description="Pemberitahuan operasional" badge={unreadCount ? `${unreadCount} baru` : undefined} onClick={() => onOpen('notifications')} /></div></section>
    <section><MobileSectionHeader title="Informasi" description="Kabar program dan penyaluran" /><div className="plpk-service-list"><MobileServiceTile icon={News01Icon} title="Berita" description="Kabar terbaru NU Care-LAZISNU" onClick={() => onOpen('news')} /><MobileServiceTile icon={CharityIcon} title="Pentasyarufan" description="Informasi manfaat yang tersalurkan" onClick={() => onOpen('distribution')} /></div></section>
    <section><MobileSectionHeader title="Digital" description="Informasi layanan yang dikembangkan" /><div className="plpk-service-list"><MobileServiceTile icon={Mosque01Icon} title="e-ZISWAF" description="Panduan zakat, infak, sedekah, dan wakaf" badge="Informasi" onClick={() => onOpen('ziswaf')} /><MobileServiceTile icon={SmartPhone01Icon} title="PPOB" description="Persiapan layanan kebutuhan digital" badge="Segera Hadir" onClick={() => onOpen('ppob')} /></div></section>
  </div></>;
}
