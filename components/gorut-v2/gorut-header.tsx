'use client';

import { Bell, LayoutDashboard, Menu, MoreHorizontal, Search } from 'lucide-react';

type GorutHeaderProps = { onMenuOpen: () => void; title?: string };

export function GorutHeader({ onMenuOpen, title = 'Dashboard' }: GorutHeaderProps) {
  return <header className="gorut-header gorut-entrance-header"><div className="gorut-header-title"><button type="button" className="gorut-mobile-menu-button" onClick={onMenuOpen} aria-label="Buka menu"><Menu size={18} /></button><LayoutDashboard size={16} /><strong>{title}</strong></div><div className="gorut-header-actions"><label className="gorut-search is-unavailable" title="Pencarian global belum tersedia"><Search size={14} /><input disabled placeholder="Pencarian belum tersedia" aria-label="Pencarian global belum tersedia" /><kbd>N/A</kbd></label><button type="button" className="gorut-mobile-search-button gorut-icon-button" aria-label="Pencarian belum tersedia" title="Pencarian global belum tersedia" disabled><Search size={16} /></button><button type="button" className="gorut-icon-button gorut-notification-button" aria-label="Notifikasi belum tersedia" title="Notifikasi belum tersedia" disabled><Bell size={16} /></button><button type="button" className="gorut-mobile-overflow-button gorut-icon-button" aria-label="Menu lainnya belum tersedia" title="Menu lainnya belum tersedia" disabled><MoreHorizontal size={17} /></button><span className="gorut-header-divider" /><span className="gorut-header-user"><span className="gorut-avatar">AP</span><span><strong>Admin PC</strong><small>Garut</small></span></span></div></header>;
}
