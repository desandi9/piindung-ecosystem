'use client';

import { CharityIcon, Mosque01Icon, News01Icon, Notification02Icon, SmartPhone01Icon, UserGroupIcon } from '@hugeicons/core-free-icons';

import type { PlpkServiceScreen } from '@/features/gorut-v2/plpk-mobile-content';

import { MobilePageHeader, MobileSectionHeader, MobileServiceTile } from './mobile-ui';

export function PlpkServicesTab({ unreadCount, onOpen }: { unreadCount: number; onOpen: (screen: PlpkServiceScreen) => void }) {
  return (
    <>
      <MobilePageHeader title="Layanan" subtitle="Pusat fitur dan informasi PLPK" />
      <div className="plpk-scroll plpk-services-screen">
        <section>
          <MobileSectionHeader title="Operasional" description="Pendukung pekerjaan lapangan" />
          <div className="plpk-service-list">
            <MobileServiceTile icon={UserGroupIcon} title="Munfiq" description="Data Munfiq di wilayah tugas" onClick={() => onOpen('munfiq')} />
            <MobileServiceTile icon={Notification02Icon} title="Notifikasi" description="Pemberitahuan kegiatan dan periode" badge={unreadCount ? `${unreadCount} baru` : undefined} onClick={() => onOpen('notifications')} />
          </div>
        </section>
        <section>
          <MobileSectionHeader title="Informasi" description="Kabar program dan penyaluran" />
          <div className="plpk-service-list">
            <MobileServiceTile icon={News01Icon} title="Berita" description="Kabar terbaru NU Care-LAZISNU" onClick={() => onOpen('news')} />
            <MobileServiceTile icon={CharityIcon} title="Pentasyarufan" description="Informasi manfaat yang tersalurkan" onClick={() => onOpen('distribution')} />
          </div>
        </section>
        <section>
          <MobileSectionHeader title="Layanan Digital" description="Informasi layanan yang dikembangkan" />
          <div className="plpk-service-list">
            <MobileServiceTile icon={Mosque01Icon} title="e-ZISWAF" description="Panduan zakat, infak, sedekah, dan wakaf" badge="Informasi" onClick={() => onOpen('ziswaf')} />
            <MobileServiceTile icon={SmartPhone01Icon} title="PPOB" description="Persiapan layanan kebutuhan digital" badge="Segera Hadir" onClick={() => onOpen('ppob')} />
          </div>
        </section>
      </div>
    </>
  );
}
