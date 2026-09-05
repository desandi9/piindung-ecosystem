'use client';

import { motion, useReducedMotion } from 'motion/react';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import {
  bottomNavigation,
  mainNavigation,
  masterDataNavigation,
  mobileNavigation as defaultMobileNavigation,
  operationalNavigation,
} from '@/features/gorut-v2/navigation';
import { GORUT_ENTRY_SOURCE_KEY, GORUT_ENTRY_SOURCE_PIINDUNG, gorutPageVariants, type GorutEntranceState } from '@/features/gorut-v2/motion';
import type { GorutNavigationItem } from '@/features/gorut-v2/types';

import { GorutHeader } from './gorut-header';
import { GorutSidebar } from './gorut-sidebar';
import { useGorutTheme } from './gorut-theme-provider';
import { MobileBottomNav } from './mobile-bottom-nav';
import { MobileSidebar } from './mobile-sidebar';

export type GorutShellTarget = {
  current: string;
  max: string;
  percentage: number;
};

type GorutAppShellProps = {
  title: string;
  target?: GorutShellTarget;
  children: ReactNode;
  loading?: boolean;
  mobileNavigation?: GorutNavigationItem[];
  onUnavailable?: (label: string) => void;
};

export function GorutAppShell({
  title,
  target = { current: '', max: '', percentage: 0 },
  children,
  loading = false,
  mobileNavigation = defaultMobileNavigation,
  onUnavailable,
}: GorutAppShellProps) {
  const { resolvedTheme } = useGorutTheme();
  const pathname = usePathname();
  const initialPath = useRef(pathname);
  const entranceResolved = useRef(false);
  const reduced = useReducedMotion();
  const pageVariants = useMemo(() => gorutPageVariants(Boolean(reduced)), [reduced]);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notice, setNotice] = useState('');
  const [initialEntrance, setInitialEntrance] = useState<GorutEntranceState>('hidden');

  useEffect(() => {
    if (entranceResolved.current) return;
    entranceResolved.current = true;
    const source = window.sessionStorage.getItem(GORUT_ENTRY_SOURCE_KEY);
    window.sessionStorage.removeItem(GORUT_ENTRY_SOURCE_KEY);
    setInitialEntrance(source === GORUT_ENTRY_SOURCE_PIINDUNG ? 'portal' : 'internal');
  }, []);

  const entranceState: GorutEntranceState = pathname === initialPath.current ? initialEntrance : 'internal';

  const handleUnavailable = (label: string) => {
    if (onUnavailable) {
      onUnavailable(label);
      return;
    }

    setNotice(`${label}: Segera tersedia`);
    window.setTimeout(() => setNotice(''), 2200);
  };

  return (
    <div className={`gorut-viewport gorut-theme-${resolvedTheme}`}>
      <a className="gorut-skip-link" href="#gorut-main-content">Lewati ke konten utama</a>
      <div className="gorut-app">
        <GorutSidebar target={target} entranceState={entranceState} />
        <div className="gorut-workspace">
          <GorutHeader title={title} entranceState={entranceState} onMenuOpen={() => setMobileMenu(true)} />
          <motion.main key={pathname} id="gorut-main-content" className="gorut-main" aria-busy={loading || undefined} initial="hidden" animate={entranceState} variants={pageVariants}>
            {children}
          </motion.main>
        </div>
      </div>
      <MobileSidebar
        open={mobileMenu}
        onClose={() => setMobileMenu(false)}
        navigation={mainNavigation}
        secondaryNavigation={operationalNavigation}
        masterNavigation={masterDataNavigation}
        bottomNavigation={bottomNavigation}
        target={target}
      />
      {mobileNavigation.length ? (
        <MobileBottomNav
          navigation={mobileNavigation}
          onMore={() => setMobileMenu(true)}
          onUnavailable={handleUnavailable}
        />
      ) : null}
      {notice ? <div className="gorut-mobile-notice" role="status">{notice}</div> : null}
    </div>
  );
}
