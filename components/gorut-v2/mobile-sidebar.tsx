'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { icons } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { GorutNavigationItem } from '@/features/gorut-v2/types';
import { GorutThemeControl } from './gorut-theme-control';
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
  const closeButtonRef = useRef<HTMLButtonElement>(null);
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

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onClose, open]);

  return (
    <>
      <div className={`gorut-drawer-backdrop ${open ? 'is-open' : ''}`} onClick={onClose} aria-hidden="true" />
      <aside className={`gorut-mobile-drawer ${open ? 'is-open' : ''}`} aria-label="Menu navigasi mobile" role="dialog" aria-modal={open || undefined} aria-hidden={!open}>
        <div className="gorut-sidebar-brand">
          <Image className="gorut-brand-mark" src="/gorut-logo-icon.png" alt="" width={38} height={40} />
          <div><strong>GoRUT</strong><span>Gerakan Koin NU Garut</span></div>
          <div className="gorut-mobile-drawer-actions"><GorutThemeControl compact /><button ref={closeButtonRef} type="button" className="gorut-icon-button" onClick={onClose} aria-label="Tutup menu"><X size={17} aria-hidden="true" /></button></div>
        </div>
        <nav className="gorut-sidebar-nav">
          <span className="gorut-nav-heading">MENU UTAMA</span>
          {navigation.map((item) => <MobileNavItem key={item.label} item={item} activePath={pathname} onClick={handleItem} onNavigate={onClose} expanded={expanded} onToggleGroup={toggleGroup} />)}
          <span className="gorut-nav-heading">OPERASIONAL</span>
          {secondaryNavigation.map((item) => <MobileNavItem key={item.label} item={item} activePath={pathname} onClick={handleItem} onNavigate={onClose} expanded={expanded} onToggleGroup={toggleGroup} />)}
          <span className="gorut-nav-heading">DATA MASTER</span>
          {masterNavigation.map((item) => <MobileNavItem key={item.label} item={item} activePath={pathname} onClick={handleItem} onNavigate={onClose} expanded={expanded} onToggleGroup={toggleGroup} />)}
        </nav>
        <SidebarTargetCard {...target} />
        <div className="gorut-sidebar-separator" />
        <nav className="gorut-mobile-drawer-bottom" aria-label="Menu bawah">
          {bottomNavigation.map((item) => <MobileNavItem key={item.label} item={item} activePath={pathname} onClick={handleItem} onNavigate={onClose} expanded={expanded} onToggleGroup={toggleGroup} />)}
        </nav>
        {notice ? <div className="gorut-nav-notice" role="status">{notice}</div> : null}
      </aside>
    </>
  );
}

function MobileNavItem({ item, activePath, onClick, onNavigate, isChild, expanded, onToggleGroup }: { item: GorutNavigationItem; activePath: string; onClick: (item: GorutNavigationItem) => void; onNavigate: () => void; isChild?: boolean; expanded: string[]; onToggleGroup: (label: string) => void }) {
  const Icon = icons[item.icon as keyof typeof icons];
  const icon = Icon ? <Icon size={isChild ? 15 : 17} aria-hidden="true" /> : null;
  const isActive = item.matchPrefix
    ? activePath === item.matchPrefix || activePath.startsWith(`${item.matchPrefix}/`)
    : item.href ? activePath === item.href : false;

  if (item.children?.length) {
    const isOpen = expanded.includes(item.label);
    return (
      <>
        <button type="button" className={`gorut-nav-item gorut-nav-parent ${isActive ? 'is-active' : ''}`} onClick={() => onToggleGroup(item.label)} aria-expanded={isOpen}>
          {icon}<span>{item.label}</span>
          <ChevronDown size={13} className={isOpen ? 'gorut-nav-caret is-open' : 'gorut-nav-caret'} aria-hidden="true" />
        </button>
        {isOpen ? <div className="gorut-nav-children">{item.children.map((child) => <MobileNavItem key={child.label} item={child} activePath={activePath} onClick={onClick} onNavigate={onNavigate} isChild expanded={expanded} onToggleGroup={onToggleGroup} />)}</div> : null}
      </>
    );
  }

  const className = `gorut-nav-item ${isChild ? 'gorut-nav-child ' : ''}${isActive ? 'is-active' : ''}`;
  return item.href
    ? <Link href={item.href} className={className} aria-current={isActive ? 'page' : undefined} onClick={onNavigate}>{icon}<span>{item.label}</span></Link>
    : <button type="button" className={className} onClick={() => onClick(item)}>{icon}<span>{item.label}</span></button>;
}
