import type { GorutNavigationItem } from './types';

export type GorutNavigationTone = 'teal' | 'cyan' | 'amber' | 'violet' | 'sky' | 'indigo' | 'emerald' | 'slate';

const navigationToneByLabel: Record<string, GorutNavigationTone> = {
  Dashboard: 'teal',
  Beranda: 'teal',
  Munfiq: 'cyan',
  Penghimpunan: 'amber',
  'Penjemputan PLPK': 'amber',
  'Verifikasi Kordes': 'sky',
  'Verifikasi UPZIS': 'emerald',
  'Verifikasi PC': 'indigo',
  'Dokumen Administrasi': 'violet',
  Dokumen: 'violet',
  Monitoring: 'sky',
  Laporan: 'indigo',
  Setoran: 'emerald',
  Validasi: 'emerald',
  Approval: 'amber',
  Kecamatan: 'sky',
  UPZIS: 'emerald',
  PLPK: 'indigo',
  Pengaturan: 'slate',
  'Pusat Bantuan': 'emerald',
  'Kembali ke PIINDUNG': 'slate',
  Lainnya: 'slate',
};

export function resolveGorutNavigationTone(item: Pick<GorutNavigationItem, 'label'>): GorutNavigationTone {
  return navigationToneByLabel[item.label] ?? 'teal';
}

export const mainNavigation: GorutNavigationItem[] = [
  { label: 'Dashboard', href: '/gorut-v2/dashboard', icon: 'LayoutDashboard', isAvailable: true },
  { label: 'Munfiq', href: '/gorut-v2/munfiq', icon: 'Users', isAvailable: true },
  {
    label: 'Penghimpunan',
    icon: 'HandCoins',
    isAvailable: true,
    matchPrefix: '/gorut-v2/penghimpunan',
    children: [
      { label: 'Penjemputan PLPK', href: '/gorut-v2/penghimpunan/penjemputan-plpk', icon: 'Truck', isAvailable: true },
      { label: 'Verifikasi Kordes', href: '/gorut-v2/penghimpunan/verifikasi-kordes', icon: 'UserCog', isAvailable: true },
      { label: 'Verifikasi UPZIS', href: '/gorut-v2/penghimpunan/verifikasi-upzis', icon: 'Building2', isAvailable: true },
      { label: 'Verifikasi PC', href: '/gorut-v2/penghimpunan/verifikasi-pc', icon: 'Landmark', isAvailable: true },
    ],
  },
  { label: 'Dokumen Administrasi', href: '/gorut-v2/dokumen-administrasi', icon: 'FileText', isAvailable: true },
  { label: 'Monitoring', href: '/gorut-v2/monitoring', icon: 'Activity', isAvailable: true },
  { label: 'Laporan', href: '/gorut-v2/laporan', icon: 'ChartBar', isAvailable: true },
];

export const operationalNavigation: GorutNavigationItem[] = [
  { label: 'Setoran', href: '/gorut-v2/setoran', icon: 'WalletCards', isAvailable: true },
  { label: 'Validasi', href: '/gorut-v2/validasi', icon: 'BadgeCheck', isAvailable: true },
  { label: 'Approval', href: '/gorut-v2/approval', icon: 'CircleCheckBig', isAvailable: true },
];

export const masterDataNavigation: GorutNavigationItem[] = [
  { label: 'Kecamatan', href: '/gorut-v2/kecamatan', icon: 'MapPinned', isAvailable: true },
  { label: 'UPZIS', href: '/gorut-v2/upzis', icon: 'Building2', isAvailable: true },
  { label: 'PLPK', href: '/gorut-v2/plpk', icon: 'Landmark', isAvailable: true },
];

export const bottomNavigation: GorutNavigationItem[] = [
  { label: 'Pengaturan', href: '/gorut-v2/pengaturan', icon: 'Settings', isAvailable: true },
  { label: 'Pusat Bantuan', href: '/gorut-v2/bantuan', icon: 'CircleQuestionMark', isAvailable: true },
  { label: 'Kembali ke PIINDUNG', href: '/dashboard', icon: 'ArrowLeft', isAvailable: true },
];

export const mobileNavigation: GorutNavigationItem[] = [
  { label: 'Beranda', href: '/gorut-v2/dashboard', icon: 'LayoutDashboard', isAvailable: true },
  { label: 'Munfiq', href: '/gorut-v2/munfiq', icon: 'Users', isAvailable: true },
  { label: 'Penghimpunan', href: '/gorut-v2/penghimpunan/penjemputan-plpk', icon: 'HandCoins', isAvailable: true, matchPrefix: '/gorut-v2/penghimpunan' },
  { label: 'Dokumen', href: '/gorut-v2/dokumen-administrasi', icon: 'FileText', isAvailable: true },
  { label: 'Lainnya', icon: 'Ellipsis', isAvailable: false },
];
