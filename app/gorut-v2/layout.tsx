import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';

import { GorutThemeProvider } from '@/components/gorut-v2/gorut-theme-provider';

import './gorut-v2.css';
import './styles/purity.css';
import './styles/desktop-polish.css';
import './styles/penghimpunan-desktop.css';
import './styles/documents-desktop.css';
import './styles/setoran-desktop.css';
import './styles/validation-desktop.css';
import './styles/approval-desktop.css';
import './styles/pc-package-workspace.css';

const roboto = Roboto({
  subsets: ['latin'],
  variable: '--font-gorut',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Dashboard GORUT V2',
  description: 'Dashboard Gerakan Koin NU Kabupaten Garut',
};

export default function GorutV2Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={roboto.variable}>
      <GorutThemeProvider>{children}</GorutThemeProvider>
    </div>
  );
}
