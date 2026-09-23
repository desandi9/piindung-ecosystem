import type { Metadata } from 'next';

import '../plpk/plpk-mobile.css';
import './kordes-mobile.css';

export const metadata: Metadata = {
  title: 'Aplikasi Kordes — GORUT',
  description: 'Aplikasi verifikasi penghimpunan untuk Koordinator Desa (Kordes)',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#07965D',
};

export default function KordesMobileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
