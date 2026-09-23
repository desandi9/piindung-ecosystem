'use client';

import { BankIcon, Building02Icon, DeliveryTruck01Icon, UserSettings01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import { usePathname } from 'next/navigation';

const tabs: Array<{ href: string; label: string; icon: IconSvgElement }> = [
  { href: '/gorut-v2/penghimpunan/penjemputan-plpk', label: 'Penjemputan PLPK', icon: DeliveryTruck01Icon },
  { href: '/gorut-v2/penghimpunan/verifikasi-kordes', label: 'Verifikasi Kordes', icon: UserSettings01Icon },
  { href: '/gorut-v2/penghimpunan/verifikasi-upzis', label: 'Verifikasi UPZIS', icon: Building02Icon },
  { href: '/gorut-v2/penghimpunan/verifikasi-pc', label: 'Verifikasi PC', icon: BankIcon },
];

export function PenghimpunanTabs() {
  const pathname = usePathname();
  return (
    <nav className="gorut-seg" aria-label="Tingkat penghimpunan">
      {tabs.map(({ href, label, icon }) => {
        const isActive = pathname === href;
        return (
          <a key={href} href={href} className={isActive ? 'is-active' : undefined} aria-current={isActive ? 'page' : undefined}>
            <HugeiconsIcon icon={icon} size={15} strokeWidth={1.8} aria-hidden="true" />{label}
          </a>
        );
      })}
    </nav>
  );
}
