'use client';

import { usePathname } from 'next/navigation';
import { icons } from 'lucide-react';
import type { GorutNavigationItem } from '@/features/gorut-v2/types';

type MobileBottomNavProps = { navigation: GorutNavigationItem[]; onUnavailable: (label: string) => void };

export function MobileBottomNav({ navigation, onUnavailable }: MobileBottomNavProps) {
  const pathname = usePathname();
  return <nav className="gorut-mobile-bottom-nav" aria-label="Navigasi bawah mobile">
    {navigation.map((item) => {
      const Icon = icons[item.icon as keyof typeof icons];
      const isActive = item.href ? pathname === item.href : false;
      const content = <><span className="gorut-bottom-icon">{Icon ? <Icon size={19} strokeWidth={isActive ? 2.2 : 1.8} /> : null}</span><span>{item.label}</span></>;
      return item.href ? <a key={item.label} href={item.href} className={isActive ? 'is-active' : ''}>{content}</a> : <button key={item.label} type="button" onClick={() => onUnavailable(item.label)}>{content}</button>;
    })}
  </nav>;
}
