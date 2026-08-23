import type { Metadata } from 'next';

import '../plpk/plpk-mobile.css';

export const metadata: Metadata = {
  title: 'Aplikasi Munfiq — GORUT',
  description: 'Akses mobile Munfiq GORUT',
};

export const viewport = { width: 'device-width', initialScale: 1, maximumScale: 1, themeColor: '#07965D' };

export default function MunfiqMobileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
