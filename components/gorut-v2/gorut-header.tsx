'use client';

import { Bell, ChevronDown, LayoutDashboard, Menu, MoreHorizontal, Search } from 'lucide-react';
import { useState } from 'react';

type GorutHeaderProps = { onMenuOpen: () => void; title?: string };

export function GorutHeader({ onMenuOpen, title = 'Dashboard' }: GorutHeaderProps) {
  const [search, setSearch] = useState('');
  return <header className="gorut-header gorut-entrance-header"><div className="gorut-header-title"><button type="button" className="gorut-mobile-menu-button" onClick={onMenuOpen} aria-label="Buka menu"><Menu size={18} /></button><LayoutDashboard size={16} /><strong>{title}</strong></div><div className="gorut-header-actions"><label className="gorut-search"><Search size={14} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari data GORUT" aria-label="Cari data GORUT" /><kbd>⌘ K</kbd></label><button type="button" className="gorut-mobile-search-button gorut-icon-button" aria-label="Cari"><Search size={16} /></button><button type="button" className="gorut-icon-button gorut-notification-button" aria-label="Notifikasi"><Bell size={16} /><i /></button><button type="button" className="gorut-mobile-overflow-button gorut-icon-button" aria-label="Menu lainnya"><MoreHorizontal size={17} /></button><span className="gorut-header-divider" /><span className="gorut-header-user"><span className="gorut-avatar">AP</span><span><strong>Admin PC</strong><small>Garut</small></span><ChevronDown size={14} /></span></div></header>;
}
