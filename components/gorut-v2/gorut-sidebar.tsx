'use client';

import { useState } from 'react';
import { ChevronsLeft, ChevronDown, LayoutDashboard } from 'lucide-react';
import { icons } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { bottomNavigation, mainNavigation, masterDataNavigation, operationalNavigation } from '@/features/gorut-v2/navigation';
import type { GorutNavigationItem } from '@/features/gorut-v2/types';
import { SidebarTargetCard } from './sidebar-target-card';

type GorutSidebarProps = { target: { current: string; max: string; percentage: number } };

export function GorutSidebar({ target }: GorutSidebarProps) {
  const [notice, setNotice] = useState('');
  const pathname = usePathname();
  const notify = (item: GorutNavigationItem) => { if (!item.isAvailable) { setNotice(`${item.label}: Segera tersedia`); window.setTimeout(() => setNotice(''), 1800); } };
  return <aside className="gorut-sidebar gorut-entrance-sidebar">
    <div className="gorut-sidebar-brand"><div className="gorut-brand-mark"><LayoutDashboard size={16} /></div><div><strong>GORUT</strong><span>Gerakan Koin NU</span></div><button className="gorut-collapse-button" type="button" aria-label="Ciutkan sidebar" title="Ciutkan sidebar"><ChevronsLeft size={15} /></button></div>
    <button type="button" className="gorut-account-switcher"><span className="gorut-avatar">AP</span><span><strong>Admin PC</strong><small>PC LAZISNU Garut</small></span><ChevronDown size={14} /></button>
    <nav className="gorut-sidebar-nav" aria-label="Navigasi utama"><SidebarList items={mainNavigation} activePath={pathname} onUnavailable={notify} /><span className="gorut-nav-heading">OPERASIONAL</span><SidebarList items={operationalNavigation} activePath={pathname} onUnavailable={notify} /><span className="gorut-nav-heading">DATA MASTER</span><SidebarList items={masterDataNavigation} activePath={pathname} onUnavailable={notify} /></nav>
    <div className="gorut-sidebar-footer"><SidebarTargetCard {...target} /><div className="gorut-sidebar-separator" /><SidebarList items={bottomNavigation} activePath={pathname} onUnavailable={notify} /></div>
    {notice ? <div className="gorut-nav-notice" role="status">{notice}</div> : null}
  </aside>;
}

function SidebarList({ items, activePath, onUnavailable }: { items: GorutNavigationItem[]; activePath: string; onUnavailable: (item: GorutNavigationItem) => void }) {
  return <>{items.map((item) => { const Icon = icons[item.icon as keyof typeof icons]; const content = <>{Icon ? <Icon size={16} /> : null}<span>{item.label}</span></>; const isActive = item.href ? activePath === item.href : false; return item.href ? <a key={item.label} href={item.href} className={`gorut-nav-item ${isActive ? 'is-active' : ''}`} aria-current={isActive ? 'page' : undefined}>{content}</a> : <button key={item.label} className="gorut-nav-item" type="button" onClick={() => onUnavailable(item)}>{content}</button>; })}</>;
}
