'use client';

import Link from 'next/link';
import { BatteryMedium, ChevronLeft, LogOut, MoreVertical, QrCode, Signal, Wifi } from 'lucide-react';
import type { ReactNode } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MunfiqBottomNavigation } from './munfiq-bottom-navigation';
import { munfiqFont } from './munfiq-font';
import './munfiq-stitch.css';
import './munfiq-pickup-stitch.css';

export function MunfiqPickupShell({ children, onLogout, busy, navigation }: {
  children: ReactNode;
  onLogout: () => void;
  busy?: boolean;
  navigation?: { homeHref: string; pickupsHref: string; accountHref: string };
}) {
  const homeHref = navigation?.homeHref ?? '/gorut-v2/mobile/munfiq';

  return <div className={`mq-shell mq-pickup-shell munfiq-mobile-surface ${munfiqFont.variable}`}>
    <a className="mq-skip-link" href="#mq-pickup-content">Lewati ke konten</a>
    <div className="mq-pickup-flow">
      <header className="mq-pickup-header mq-pickup-enter" style={{ '--mq-enter-delay': '0ms' } as React.CSSProperties}>
        <div className="mq-pickup-statusbar" aria-hidden="true">
          <strong>9:41</strong>
          <span><Signal size={15} /><Wifi size={15} /><BatteryMedium size={17} /></span>
        </div>
        <div className="mq-pickup-toolbar">
          <Link className="mq-pickup-icon-button" href={homeHref} aria-label="Kembali ke Beranda"><ChevronLeft size={22} strokeWidth={2.2} aria-hidden="true" /></Link>
          <div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><button className="mq-pickup-icon-button" type="button" aria-label="Bantuan atau opsi lainnya" disabled={busy}><MoreVertical size={21} aria-hidden="true" /></button></DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={`mq-menu ${munfiqFont.variable}`}>
                <DropdownMenuItem asChild><Link href={`${homeHref}/barcode?from=penjemputan`}><QrCode aria-hidden="true" />Barcode Saya</Link></DropdownMenuItem>
                <DropdownMenuItem onSelect={onLogout}><LogOut aria-hidden="true" />Keluar dari akun</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <main id="mq-pickup-content" className="mq-pickup-main" aria-labelledby="mq-pickup-title" aria-busy={busy || undefined}>
        <div className="mq-pickup-title mq-pickup-enter" style={{ '--mq-enter-delay': '75ms' } as React.CSSProperties}>
          <h1 id="mq-pickup-title">Penjemputan</h1>
          <p>Pantau penjemputan dan perjalanan koin Anda.</p>
        </div>
        {children}
      </main>
    </div>
    <MunfiqBottomNavigation activeKey="pickups" {...navigation} />
  </div>;
}
