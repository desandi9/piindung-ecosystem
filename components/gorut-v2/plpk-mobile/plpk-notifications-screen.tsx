'use client';

import { Notification02Icon } from '@hugeicons/core-free-icons';

import { plpkNotifications } from '@/features/gorut-v2/plpk-mobile-content';

import { MobileServiceIcon } from './mobile-service-icon';
import { MobilePageHeader } from './mobile-ui';

export function PlpkNotificationsScreen({ onBack }: { onBack: () => void }) {
  return (
    <>
      <MobilePageHeader title="Notifikasi" subtitle="Pembaruan untuk pekerjaan Anda" onBack={onBack} />
      <div className="plpk-scroll">
        <div className="plpk-notification-list">
          {plpkNotifications.map((item) => (
            <article key={item.id} className={item.unread ? 'is-unread' : undefined}>
              <span><MobileServiceIcon icon={Notification02Icon} label="Notifikasi" size={19} /></span>
              <div><div><strong>{item.title}</strong><small>{item.time}</small></div><p>{item.message}</p></div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
