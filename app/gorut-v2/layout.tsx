import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';

import './gorut-v2.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-gorut',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Dashboard GORUT V2',
  description: 'Dashboard Gerakan Koin NU Kabupaten Garut',
};

export default function GorutV2Layout({ children }: { children: React.ReactNode }) {
  return <div className={manrope.variable}>{children}</div>;
}
