'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useLayoutEffect, useMemo, useState, type ReactElement } from 'react';
import { ChevronsLeft, ChevronsRight, ChevronDown } from 'lucide-react';
import { icons } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { bottomNavigation, mainNavigation, masterDataNavigation, operationalNavigation, resolveGorutNavigationTone } from '@/features/gorut-v2/navigation';
import { gorutShellSidebarVariants, gorutSidebarIndicatorTransition, type GorutEntranceState } from '@/features/gorut-v2/motion';
import type { GorutNavigationItem } from '@/features/gorut-v2/types';
import { GORUT_SIDEBAR_STORAGE_KEY, GORUT_SIDEBAR_TABLET_QUERY, resolveSidebarCollapsed } from './gorut-sidebar-state';

type GorutSidebarProps = { entranceState?: GorutEntranceState; target?: { current: string; max: string; percentage: number } };

/** Induk aktif kalau pathname persis href-nya, atau berada di bawah matchPrefix-nya. */
function isItemActive(item: GorutNavigationItem, pathname: string) {
  if (item.matchPrefix) return pathname === item.matchPrefix || pathname.startsWith(`${item.matchPrefix}/`);
  return item.href ? pathname === item.href : false;
}

export function GorutSidebar({ entranceState = 'internal' }: GorutSidebarProps) {
  const reduced = useReducedMotion();
  const entranceVariants = useMemo(() => gorutShellSidebarVariants(Boolean(reduced)), [reduced]);
  const [notice, setNotice] = useState('');
  const [collapsed, setCollapsed] = useState<boolean | null>(null);
  const pathname = usePathname();
  const notify = (item: GorutNavigationItem) => { if (!item.isAvailable) { setNotice(`${item.label}: Segera tersedia`); window.setTimeout(() => setNotice(''), 1800); } };
  const isCollapsed = collapsed ?? false;

  useLayoutEffect(() => {
    const initial = resolveSidebarCollapsed(window.localStorage.getItem(GORUT_SIDEBAR_STORAGE_KEY), window.matchMedia(GORUT_SIDEBAR_TABLET_QUERY).matches);
    document.documentElement.dataset.gorutSidebar = initial ? 'collapsed' : 'expanded';
    setCollapsed(initial);
  }, []);

  const setSidebarCollapsed = (nextCollapsed: boolean) => {
    window.localStorage.setItem(GORUT_SIDEBAR_STORAGE_KEY, String(nextCollapsed));
    document.documentElement.dataset.gorutSidebar = nextCollapsed ? 'collapsed' : 'expanded';
    setCollapsed(nextCollapsed);
  };

  return <aside className={`gorut-sidebar ${isCollapsed ? 'is-collapsed' : ''}`} data-collapse-ready={collapsed !== null}>
    <motion.div className="gorut-sidebar-motion-content" initial="hidden" animate={entranceState} variants={entranceVariants}>
      <div className="gorut-sidebar-brand"><Image className="gorut-brand-mark" src="/gorut-logo-icon.png" alt="" width={38} height={40} priority /><div className="gorut-brand-copy"><strong>GORUT</strong><span>Gerakan Koin NU Kab. Garut</span></div><button className="gorut-collapse-button" type="button" onClick={() => setSidebarCollapsed(!isCollapsed)} aria-label={isCollapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'} aria-expanded={!isCollapsed} title={isCollapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}>{isCollapsed ? <ChevronsRight size={17} aria-hidden="true" /> : <ChevronsLeft size={17} aria-hidden="true" />}</button></div>
      <button type="button" className="gorut-account-switcher" title={isCollapsed ? 'Admin PC · pergantian akun belum tersedia' : 'Pergantian akun belum tersedia'} aria-label="Admin PC, pergantian akun belum tersedia" disabled><span className="gorut-avatar">AP</span><span className="gorut-account-copy"><strong>Admin PC</strong><small>PC LAZISNU Garut</small></span><ChevronDown className="gorut-account-caret" size={14} /></button>
      <nav className="gorut-sidebar-nav" aria-label="Navigasi utama"><SidebarList items={mainNavigation} activePath={pathname} collapsed={isCollapsed} onExpand={() => setSidebarCollapsed(false)} onUnavailable={notify} /><span className="gorut-nav-heading">OPERASIONAL</span><SidebarList items={operationalNavigation} activePath={pathname} collapsed={isCollapsed} onExpand={() => setSidebarCollapsed(false)} onUnavailable={notify} /><span className="gorut-nav-heading">DATA MASTER</span><SidebarList items={masterDataNavigation} activePath={pathname} collapsed={isCollapsed} onExpand={() => setSidebarCollapsed(false)} onUnavailable={notify} /></nav>
      <div className="gorut-sidebar-footer"><SidebarList items={bottomNavigation} activePath={pathname} collapsed={isCollapsed} onExpand={() => setSidebarCollapsed(false)} onUnavailable={notify} /></div>
      {notice ? <div className="gorut-nav-notice" role="status">{notice}</div> : null}
    </motion.div>
  </aside>;
}

function SidebarList({ items, activePath, collapsed, onExpand, onUnavailable }: { items: GorutNavigationItem[]; activePath: string; collapsed: boolean; onExpand: () => void; onUnavailable: (item: GorutNavigationItem) => void }) {
  return <>{items.map((item) => {
    if (item.children?.length) return <SidebarGroup key={item.label} item={item} activePath={activePath} collapsed={collapsed} onExpand={onExpand} onUnavailable={onUnavailable} />;
    const Icon = icons[item.icon as keyof typeof icons];
    const content = <>{Icon ? <Icon size={17} aria-hidden="true" /> : null}<span>{item.label}</span></>;
    const isActive = isItemActive(item, activePath);
    const navigationData = { 'data-nav-tone': resolveGorutNavigationTone(item), 'data-nav-available': item.isAvailable ? 'true' : 'false' };
    const control = item.href ? <Link href={item.href} className={`gorut-nav-item ${isActive ? 'is-active' : ''}`} aria-current={isActive ? 'page' : undefined} {...navigationData}>{content}{isActive ? <motion.span className="gorut-nav-active-indicator" layoutId="gorut-sidebar-active-indicator" transition={gorutSidebarIndicatorTransition} aria-hidden="true" /> : null}</Link> : <button className="gorut-nav-item" type="button" onClick={() => onUnavailable(item)} {...navigationData}>{content}</button>;
    return <CollapsedTooltip key={item.label} collapsed={collapsed} label={item.label}>{control}</CollapsedTooltip>;
  })}</>;
}

function SidebarGroup({ item, activePath, collapsed, onExpand, onUnavailable }: { item: GorutNavigationItem; activePath: string; collapsed: boolean; onExpand: () => void; onUnavailable: (item: GorutNavigationItem) => void }) {
  const parentActive = isItemActive(item, activePath);
  // Terbuka otomatis saat salah satu child sedang dibuka; setelah itu ikut kendali pengguna.
  const [open, setOpen] = useState(parentActive);
  const Icon = icons[item.icon as keyof typeof icons];
  const groupId = `nav-group-${item.label.toLowerCase().replace(/[^a-z]/g, '-')}`;

  return (
    <>
      <CollapsedTooltip collapsed={collapsed} label={item.label}>
        <button type="button" className={`gorut-nav-item gorut-nav-parent ${parentActive ? 'is-active' : ''}`} data-nav-tone={resolveGorutNavigationTone(item)} data-nav-available={item.isAvailable ? 'true' : 'false'} onClick={() => { if (collapsed) { onExpand(); setOpen(true); } else { setOpen((value) => !value); } }} aria-expanded={!collapsed && open} aria-controls={groupId}>
          {Icon ? <Icon size={17} aria-hidden="true" /> : null}
          <span>{item.label}</span>
          <ChevronDown size={13} className={open ? 'gorut-nav-caret is-open' : 'gorut-nav-caret'} aria-hidden="true" />
        </button>
      </CollapsedTooltip>
      <div id={groupId} className="gorut-nav-children" hidden={!open}>
        {item.children?.map((child) => {
          const ChildIcon = icons[child.icon as keyof typeof icons];
          const childActive = isItemActive(child, activePath);
          const content = <>{ChildIcon ? <ChildIcon size={15} aria-hidden="true" /> : null}<span>{child.label}</span></>;
          return child.href
            ? <Link key={child.label} href={child.href} className={`gorut-nav-item gorut-nav-child ${childActive ? 'is-active' : ''}`} data-nav-tone={resolveGorutNavigationTone(child)} data-nav-available={child.isAvailable ? 'true' : 'false'} aria-current={childActive ? 'page' : undefined}>{content}{childActive ? <motion.span className="gorut-nav-active-indicator" layoutId="gorut-sidebar-active-indicator" transition={gorutSidebarIndicatorTransition} aria-hidden="true" /> : null}</Link>
            : <button key={child.label} type="button" className="gorut-nav-item gorut-nav-child" data-nav-tone={resolveGorutNavigationTone(child)} data-nav-available={child.isAvailable ? 'true' : 'false'} onClick={() => onUnavailable(child)}>{content}</button>;
        })}
      </div>
    </>
  );
}

function CollapsedTooltip({ collapsed, label, children }: { collapsed: boolean; label: string; children: ReactElement }) {
  if (!collapsed) return children;
  return <Tooltip><TooltipTrigger asChild>{children}</TooltipTrigger><TooltipContent side="right" sideOffset={10} className="gorut-sidebar-tooltip">{label}</TooltipContent></Tooltip>;
}
