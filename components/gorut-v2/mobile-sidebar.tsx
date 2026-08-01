'use client';

import { useState } from 'react';
import { ChevronDown, LayoutDashboard, X } from 'lucide-react';
import { icons } from 'lucide-react';
import { usePathname } from 'next/navigation';
import type { GorutNavigationItem } from '@/features/gorut-v2/types';
import { SidebarTargetCard } from './sidebar-target-card';

type MobileSidebarProps = {
  open: boolean;
  onClose: () => void;
  navigation: GorutNavigationItem[];
  secondaryNavigation: GorutNavigationItem[];
  masterNavigation: GorutNavigationItem[];
  bottomNavigation: GorutNavigationItem[];
  target: { current: string; max: string; percentage: number };
};

export function MobileSidebar({ open, onClose, navigation, secondaryNavigation, masterNavigation, bottomNavigation, target }: MobileSidebarProps) {
  const [notice, setNotice] = useState('');
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<string[]>(() => {
    const groups = [...navigation, ...secondaryNavigation, ...masterNavigation].filter((item) => item.children?.length);
    const openGroups = groups.filter((item) => item.matchPrefix && pathname.startsWith(item.matchPrefix)).map((item) => item.label);
    return openGroups;
  });
  const toggleGroup = (label: string) => setExpanded((previous) => (previous.includes(label) ? previous.filter((item) => item !== label) : [...previous, label]));
  const handleItem = (item: GorutNavigationItem) => {
    if (!item.isAvailable) {
      setNotice(`${item.label}: Segera tersedia`);
      window.setTimeout(() => setNotice(''), 1800);
    }
  };

  return (
    <>
      <div className={`gorut-drawer-backdrop ${open ? 'is-open' : ''}`} onClick={onClose} aria-hidden="true" />
      <aside className={`gorut-mobile-drawer ${open ? 'is-open' : ''}`} aria-label="Menu navigasi mobile">
        <div className="gorut-sidebar-brand">
          <div className="gorut-brand-mark"><LayoutDashboard size={16} /></div>
          <div><strong>GORUT</strong><span>Gerakan Koin NU</span></div>
          <button type="button" className="gorut-icon-button" onClick={onClose} aria-label="Tutup menu"><X size={16} /></button>
        </div>
        <nav className="gorut-sidebar-nav">
          <span className="gorut-nav-heading">MENU UTAMA</span>
          {navigation.map((item) => <MobileNavItem key={item.label} item={item} activePath={pathname} onClick={handleItem} expanded={expanded} onToggleGroup={toggleGroup} />)}
          <span className="gorut-nav-heading">OPERASIONAL</span>
          {secondaryNavigation.map((item) => <MobileNavItem key={item.label} item={item} activePath={pathname} onClick={handleItem} expanded={expanded} onToggleGroup={toggleGroup} />)}
          <span className="gorut-nav-heading">DATA MASTER</span>
          {masterNavigation.map((item) => <MobileNavItem key={item.label} item={item} activePath={pathname} onClick={handleItem} expanded={expanded} onToggleGroup={toggleGroup} />)}
        </nav>
        <SidebarTargetCard {...target} />
        <div className="gorut-sidebar-separator" />
        <nav className="gorut-mobile-drawer-bottom" aria-label="Menu bawah">
          {bottomNavigation.map((item) => <MobileNavItem key={item.label} item={item} activePath={pathname} onClick={handleItem} expanded={expanded} onToggleGroup={toggleGroup} />)}
        </nav>
        {notice ? <div className="gorut-nav-notice" role="status">{notice}</div> : null}
      </aside>
    </>
  );
}

function MobileNavItem({ item, activePath, onClick, isChild, expanded, onToggleGroup }: { item: GorutNavigationItem; activePath: string; onClick: (item: GorutNavigationItem) => void; isChild?: boolean; expanded: string[]; onToggleGroup: (label: string) => void }) {
  const Icon = icons[item.icon as keyof typeof icons];
  const icon = Icon ? <Icon size={isChild ? 14 : 16} /> : null;
  const isActive = item.matchPrefix
    ? activePath === item.matchPrefix || activePath.startsWith(`${item.matchPrefix}/`)
    : item.href ? activePath === item.href : false;

  if (item.children?.length) {
    const isOpen = expanded.includes(item.label);
    return (
      <>
        <button type="button" className={`gorut-nav-item gorut-nav-parent ${isActive ? 'is-active' : ''}`} onClick={() => onToggleGroup(item.label)} aria-expanded={isOpen}>
          {icon}<span>{item.label}</span>
          <ChevronDown size={13} className={isOpen ? 'gorut-nav-caret is-open' : 'gorut-nav-caret'} />
        </button>
        {isOpen ? <div className="gorut-nav-children">{item.children.map((child) => <MobileNavItem key={child.label} item={child} activePath={activePath} onClick={onClick} isChild expanded={expanded} onToggleGroup={onToggleGroup} />)}</div> : null}
      </>
    );
  }

  const className = `gorut-nav-item ${isChild ? 'gorut-nav-child ' : ''}${isActive ? 'is-active' : ''}`;
  return item.href
    ? <a href={item.href} className={className} aria-current={isActive ? 'page' : undefined}>{icon}<span>{item.label}</span></a>
    : <button type="button" className={className} onClick={() => onClick(item)}>{icon}<span>{item.label}</span></button>;
}
