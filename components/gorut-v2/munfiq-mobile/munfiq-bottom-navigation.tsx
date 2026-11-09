'use client';

import Link from 'next/link';
import { Bell, Bookmark, House, Truck, UserRound } from 'lucide-react';
import { munfiqFont } from './munfiq-font';
import './munfiq-navigation.css';

export type MunfiqNavigationKey = 'home' | 'pickups' | 'program' | 'notifications' | 'account';
export function MunfiqBottomNavigation({ activeKey, homeHref = '/gorut-v2/mobile/munfiq', pickupsHref = `${homeHref}/penjemputan`, accountHref = `${homeHref}/akun`, showNotificationDot = false, onNavigate }: {
  activeKey?: MunfiqNavigationKey; homeHref?: string; pickupsHref?: string; accountHref?: string; showNotificationDot?: boolean;
  onNavigate?: (key: MunfiqNavigationKey) => void;
}) {
  const items = [
    { key: 'home', label: 'Beranda', icon: House, href: homeHref },
    { key: 'pickups', label: 'Penjemputan', icon: Truck, href: pickupsHref },
    { key: 'program', label: 'Program', icon: Bookmark, href: `${homeHref}/program` },
    { key: 'notifications', label: 'Notifikasi', icon: Bell, href: `${homeHref}/notifikasi` },
    { key: 'account', label: 'Akun', icon: UserRound, href: accountHref },
  ] as const;
  return <nav className={`munfiq-mobile-nav ${munfiqFont.variable}`} aria-label="Menu utama Munfiq">
    {items.map(({ key, label, icon: Icon, href }) => {
      const content = <><span className="munfiq-mobile-nav-icon"><Icon size={22} strokeWidth={activeKey === key ? 2 : 1.8} aria-hidden="true" />{showNotificationDot && key === 'notifications' ? <b aria-hidden="true" /> : null}</span><span>{label}</span><i aria-hidden="true" /></>;
      return onNavigate ? <button key={key} type="button" aria-current={activeKey === key ? 'page' : undefined} onClick={() => onNavigate(key)}>{content}</button>
        : <Link key={key} href={href} prefetch={false} aria-current={activeKey === key ? 'page' : undefined}>{content}</Link>;
    })}
  </nav>;
}
