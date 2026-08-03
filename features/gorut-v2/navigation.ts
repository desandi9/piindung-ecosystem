import type { GorutNavigationItem } from './types';

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
  { label: 'Laporan', href: '/gorut-v2/laporan', icon: 'BarChart3', isAvailable: true },
];

export const operationalNavigation: GorutNavigationItem[] = [
  { label: 'Setoran', icon: 'WalletCards', isAvailable: false },
  { label: 'Validasi', icon: 'BadgeCheck', isAvailable: false },
  { label: 'Approval', icon: 'CheckCircle2', isAvailable: false },
];

export const masterDataNavigation: GorutNavigationItem[] = [
  { label: 'Kecamatan', icon: 'MapPinned', isAvailable: false },
  { label: 'UPZIS', icon: 'Building2', isAvailable: false },
  { label: 'PLPK', icon: 'Landmark', isAvailable: false },
];

export const bottomNavigation: GorutNavigationItem[] = [
  { label: 'Pengaturan', icon: 'Settings', isAvailable: false },
  { label: 'Pusat Bantuan', icon: 'CircleHelp', isAvailable: false },
  { label: 'Kembali ke PIINDUNG', href: '/dashboard', icon: 'ArrowLeft', isAvailable: true },
];

export const mobileNavigation: GorutNavigationItem[] = [
  { label: 'Beranda', href: '/gorut-v2/dashboard', icon: 'LayoutDashboard', isAvailable: true },
  { label: 'Munfiq', href: '/gorut-v2/munfiq', icon: 'Users', isAvailable: true },
  { label: 'Penghimpunan', href: '/gorut-v2/penghimpunan/penjemputan-plpk', icon: 'HandCoins', isAvailable: true, matchPrefix: '/gorut-v2/penghimpunan' },
  { label: 'Dokumen', href: '/gorut-v2/dokumen-administrasi', icon: 'FileText', isAvailable: true },
  { label: 'Lainnya', icon: 'MoreHorizontal', isAvailable: false },
];
