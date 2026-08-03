'use client';

import { usePathname } from 'next/navigation';
import { Building2, Landmark, Truck, UserCog } from 'lucide-react';

const tabs = [
  { href: '/gorut-v2/penghimpunan/penjemputan-plpk', label: 'Penjemputan PLPK', icon: Truck },
  { href: '/gorut-v2/penghimpunan/verifikasi-kordes', label: 'Verifikasi Kordes', icon: UserCog },
  { href: '/gorut-v2/penghimpunan/verifikasi-upzis', label: 'Verifikasi UPZIS', icon: Building2 },
  { href: '/gorut-v2/penghimpunan/verifikasi-pc', label: 'Verifikasi PC', icon: Landmark },
];

export function PenghimpunanTabs() {
  const pathname = usePathname();
  return (
    <nav className="gorut-seg" aria-label="Tingkat penghimpunan">
      {tabs.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href;
        return (
          <a key={href} href={href} className={isActive ? 'is-active' : undefined} aria-current={isActive ? 'page' : undefined}>
            <Icon size={14} />{label}
          </a>
        );
      })}
    </nav>
  );
}
