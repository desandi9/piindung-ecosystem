'use client';

import { useState, type ReactNode } from 'react';

import {
  bottomNavigation,
  mainNavigation,
  masterDataNavigation,
  mobileNavigation as defaultMobileNavigation,
  operationalNavigation,
} from '@/features/gorut-v2/navigation';
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
  target: GorutShellTarget;
  children: ReactNode;
  loading?: boolean;
  mobileNavigation?: GorutNavigationItem[];
  onUnavailable?: (label: string) => void;
};

export function GorutAppShell({
  title,
  target,
  children,
  loading = false,
  mobileNavigation = defaultMobileNavigation,
  onUnavailable,
}: GorutAppShellProps) {
  const { resolvedTheme } = useGorutTheme();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notice, setNotice] = useState('');

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
        <GorutSidebar target={target} />
        <div className="gorut-workspace">
          <GorutHeader title={title} onMenuOpen={() => setMobileMenu(true)} />
          <main id="gorut-main-content" className="gorut-main" aria-busy={loading || undefined}>
            {children}
          </main>
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
