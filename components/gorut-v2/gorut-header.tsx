'use client';

import { motion, useReducedMotion } from 'motion/react';
import { Bell, LayoutDashboard, Menu, MoreHorizontal, Search } from 'lucide-react';
import { useMemo } from 'react';

import { gorutShellHeaderVariants, type GorutEntranceState } from '@/features/gorut-v2/motion';

import { GorutThemeControl } from './gorut-theme-control';

type GorutHeaderProps = { entranceState?: GorutEntranceState; onMenuOpen: () => void; title?: string };

export function GorutHeader({ entranceState = 'internal', onMenuOpen, title = 'Dashboard' }: GorutHeaderProps) {
  const reduced = useReducedMotion();
  const variants = useMemo(() => gorutShellHeaderVariants(Boolean(reduced)), [reduced]);
  return <motion.header className="gorut-header" initial="hidden" animate={entranceState} variants={variants}><div className="gorut-header-title"><button type="button" className="gorut-mobile-menu-button" onClick={onMenuOpen} aria-label="Buka menu"><Menu size={18} /></button><LayoutDashboard className="gorut-header-page-icon" size={16} aria-hidden="true" /><span className="gorut-header-page-copy"><strong>{title}</strong></span></div><div className="gorut-header-actions"><label className="gorut-search is-unavailable" title="Pencarian global belum tersedia"><Search size={14} aria-hidden="true" /><input disabled placeholder="Ketik di sini..." aria-label="Pencarian global belum tersedia" /></label><button type="button" className="gorut-mobile-search-button gorut-icon-button" aria-label="Pencarian belum tersedia" title="Pencarian global belum tersedia" disabled><Search size={16} aria-hidden="true" /></button><button type="button" className="gorut-icon-button gorut-notification-button" aria-label="Notifikasi belum tersedia" title="Notifikasi belum tersedia" disabled><Bell size={16} aria-hidden="true" /></button><GorutThemeControl /><button type="button" className="gorut-mobile-overflow-button gorut-icon-button" aria-label="Menu lainnya belum tersedia" title="Menu lainnya belum tersedia" disabled><MoreHorizontal size={17} aria-hidden="true" /></button><span className="gorut-header-divider" /><span className="gorut-header-user"><span className="gorut-avatar">AP</span><span><strong>Admin PC</strong><small>Garut</small></span></span></div></motion.header>;
}
