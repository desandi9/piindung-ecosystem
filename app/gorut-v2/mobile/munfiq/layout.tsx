import type { Metadata } from 'next';

import './munfiq-mobile.css';

export const metadata: Metadata = {
  title: 'Aplikasi Munfiq | GORUT',
  description: 'Akses mobile Munfiq GORUT',
};

export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#F7FAFB' };

export default function MunfiqMobileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
