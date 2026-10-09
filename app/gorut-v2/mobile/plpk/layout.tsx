import type { Metadata } from 'next';

import './plpk-mobile.css';

export const metadata: Metadata = {
  title: 'Aplikasi PLPK — GORUT',
  description: 'Aplikasi penjemputan koin untuk Petugas Lapangan Penghimpun Koin (PLPK)',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#07965D',
};

export default function PlpkMobileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
