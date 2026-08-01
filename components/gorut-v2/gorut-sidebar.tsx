'use client';

import { useState } from 'react';
import { ChevronsLeft, ChevronDown, LayoutDashboard } from 'lucide-react';
import { icons } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { bottomNavigation, mainNavigation, masterDataNavigation, operationalNavigation } from '@/features/gorut-v2/navigation';
import type { GorutNavigationItem } from '@/features/gorut-v2/types';
import { SidebarTargetCard } from './sidebar-target-card';

type GorutSidebarProps = { target: { current: string; max: string; percentage: number } };

/** Induk aktif kalau pathname persis href-nya, atau berada di bawah matchPrefix-nya. */
function isItemActive(item: GorutNavigationItem, pathname: string) {
  if (item.matchPrefix) return pathname === item.matchPrefix || pathname.startsWith(`${item.matchPrefix}/`);
  return item.href ? pathname === item.href : false;
}

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
  return <>{items.map((item) => {
    if (item.children?.length) return <SidebarGroup key={item.label} item={item} activePath={activePath} onUnavailable={onUnavailable} />;
    const Icon = icons[item.icon as keyof typeof icons];
    const content = <>{Icon ? <Icon size={16} /> : null}<span>{item.label}</span></>;
    const isActive = isItemActive(item, activePath);
    return item.href ? <a key={item.label} href={item.href} className={`gorut-nav-item ${isActive ? 'is-active' : ''}`} aria-current={isActive ? 'page' : undefined}>{content}</a> : <button key={item.label} className="gorut-nav-item" type="button" onClick={() => onUnavailable(item)}>{content}</button>;
  })}</>;
}

function SidebarGroup({ item, activePath, onUnavailable }: { item: GorutNavigationItem; activePath: string; onUnavailable: (item: GorutNavigationItem) => void }) {
  const parentActive = isItemActive(item, activePath);
  // Terbuka otomatis saat salah satu child sedang dibuka; setelah itu ikut kendali pengguna.
  const [open, setOpen] = useState(parentActive);
  const Icon = icons[item.icon as keyof typeof icons];
  const groupId = `nav-group-${item.label.toLowerCase().replace(/[^a-z]/g, '-')}`;

  return (
    <>
      <button type="button" className={`gorut-nav-item gorut-nav-parent ${parentActive ? 'is-active' : ''}`} onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls={groupId}>
        {Icon ? <Icon size={16} /> : null}
        <span>{item.label}</span>
        <ChevronDown size={13} className={open ? 'gorut-nav-caret is-open' : 'gorut-nav-caret'} />
      </button>
      <div id={groupId} className="gorut-nav-children" hidden={!open}>
        {item.children?.map((child) => {
          const ChildIcon = icons[child.icon as keyof typeof icons];
          const childActive = isItemActive(child, activePath);
          const content = <>{ChildIcon ? <ChildIcon size={14} /> : null}<span>{child.label}</span></>;
          return child.href
            ? <a key={child.label} href={child.href} className={`gorut-nav-item gorut-nav-child ${childActive ? 'is-active' : ''}`} aria-current={childActive ? 'page' : undefined}>{content}</a>
            : <button key={child.label} type="button" className="gorut-nav-item gorut-nav-child" onClick={() => onUnavailable(child)}>{content}</button>;
        })}
      </div>
    </>
  );
}
