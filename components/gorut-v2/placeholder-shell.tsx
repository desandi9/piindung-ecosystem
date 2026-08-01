'use client';

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { bottomNavigation, mainNavigation, masterDataNavigation, mobileNavigation, operationalNavigation } from '@/features/gorut-v2/navigation';
import { GorutSidebar } from './gorut-sidebar';
import { GorutHeader } from './gorut-header';
import { MobileSidebar } from './mobile-sidebar';
import { MobileBottomNav } from './mobile-bottom-nav';

type PlaceholderShellProps = { title: string; description?: string; children?: ReactNode };

const target = { current: 'Rp1,42 M', max: 'Rp2 M', percentage: 71 };

export function PlaceholderShell({ title, description, children }: PlaceholderShellProps) {
  const [loading, setLoading] = useState(true);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 420);
    return () => window.clearTimeout(timer);
  }, []);

  const triggerNotice = (label: string) => {
    setNotice(`${label}: Segera tersedia`);
    window.setTimeout(() => setNotice(''), 1800);
  };

  return (
    <div className="gorut-viewport">
      {loading ? (
        <div className="gorut-app">
          <GorutSidebar target={target} />
          <div className="gorut-workspace">
            <GorutHeader title={title} onMenuOpen={() => setMobileMenu(true)} />
            <main className="gorut-main">
              <div className="gorut-placeholder-skeleton" />
            </main>
          </div>
        </div>
      ) : (
        <div className="gorut-app">
          <GorutSidebar target={target} />
          <div className="gorut-workspace">
            <GorutHeader title={title} onMenuOpen={() => setMobileMenu(true)} />
            <main className="gorut-main gorut-collect-main">
              <section className="gorut-collect-heading" aria-label="Judul halaman">
                <div>
                  <p>GORUT V2</p>
                  <h1>{title}</h1>
                  {description ? <span>{description}</span> : null}
                </div>
              </section>
              {children}
            </main>
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
          <MobileBottomNav navigation={mobileNavigation} onMore={() => setMobileMenu(true)} onUnavailable={(label) => triggerNotice(label)} />
          {notice ? <div className="gorut-mobile-notice" role="status">{notice}</div> : null}
        </div>
      )}
    </div>
  );
}
