import type { GorutNavigationItem } from './types';

export const mainNavigation: GorutNavigationItem[] = [
  { label: 'Dashboard', href: '/gorut-v2/dashboard', icon: 'LayoutDashboard', isAvailable: true },
  { label: 'Munfiq', href: '/gorut-v2/munfiq', icon: 'Users', isAvailable: true },
  { label: 'Transaksi', icon: 'ReceiptText', isAvailable: false },
  { label: 'Kalender', icon: 'CalendarDays', isAvailable: false },
  { label: 'Monitoring', icon: 'Activity', isAvailable: false },
  { label: 'Laporan', icon: 'FileText', isAvailable: false },
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
  { label: 'Transaksi', icon: 'ReceiptText', isAvailable: false },
  { label: 'Setoran', icon: 'WalletCards', isAvailable: false },
  { label: 'Lainnya', icon: 'MoreHorizontal', isAvailable: false },
];
