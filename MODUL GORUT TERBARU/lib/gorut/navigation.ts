import type { LucideIcon } from 'lucide-react'
import type { AppRole } from '@/types/auth'
import {
  Activity,
  Archive,
  BarChart3,
  Bell,
  Building2,
  Calendar,
  CheckCircle2,
  Cog,
  Coins,
  Database,
  FileText,
  GitBranch,
  LayoutDashboard,
  Lock,
  MapPin,
  Megaphone,
  MessageSquare,
  Shield,
  Smartphone,
  Target,
  UserCheck,
  Users,
  Wallet,
} from 'lucide-react'

export interface GorutNavItem {
  title: string
  href: string
  icon: LucideIcon
  badge?: number
  roles?: AppRole[]
  submenu?: Array<{ title: string; href: string }>
}

export interface GorutNavGroup {
  title: string
  items: GorutNavItem[]
}

const gorutOperationalRoles: AppRole[] = ['super_admin_pc', 'admin_pc', 'admin_upzis', 'admin_kordes']
const gorutSuperAdminOnlyRoles: AppRole[] = ['super_admin_pc']
const gorutSuperAndPcRoles: AppRole[] = ['super_admin_pc', 'admin_pc']
const gorutUpzisRoles: AppRole[] = ['super_admin_pc', 'admin_pc', 'admin_upzis']
const gorutKordesRoles: AppRole[] = ['super_admin_pc', 'admin_pc', 'admin_kordes']

export const gorutNavGroups: GorutNavGroup[] = [
  {
    title: 'Dashboard',
    items: [{ title: 'Dashboard', href: '/gorut/dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'Operasional',
    items: [
      { title: 'Data Munfiq', href: '/gorut/munfiq', icon: Users, roles: gorutOperationalRoles },
      {
        title: 'Alur Penghimpunan',
        href: '/gorut/transaksi',
        icon: Coins,
        roles: gorutOperationalRoles,
        submenu: [
          { title: 'Tahap Munfiq ke PLPK', href: '/gorut/transaksi' },
          { title: 'Tahap PLPK ke Kordes', href: '/gorut/monitoring-plpk' },
          { title: 'Tahap Kordes ke UPZIS', href: '/gorut/ranting' },
        ],
      },
      { title: 'Verifikasi Penghimpunan', href: '/gorut/validasi', icon: CheckCircle2, badge: 8, roles: gorutOperationalRoles },
    ],
  },
  {
    title: 'Analytics',
    items: [
      { title: 'Analytics', href: '/gorut/analytics', icon: BarChart3, roles: gorutSuperAndPcRoles },
      { title: 'Target & Performance', href: '/gorut/performance', icon: Target, roles: gorutSuperAndPcRoles },
      { title: 'Dashboard Keuangan', href: '/gorut/keuangan', icon: Wallet, roles: gorutSuperAndPcRoles },
    ],
  },
  {
    title: 'Wilayah',
    items: [
      { title: 'Referensi Wilayah', href: '/gorut/kecamatan', icon: Building2, roles: gorutSuperAndPcRoles },
    ],
  },
  {
    title: 'Laporan',
    items: [
      { title: 'Statistik', href: '/gorut/statistik', icon: BarChart3, roles: gorutSuperAndPcRoles },
      { title: 'Laporan & Export', href: '/gorut/laporan', icon: FileText, roles: gorutOperationalRoles },
      { title: 'Digital Archive', href: '/gorut/archive', icon: Archive, roles: gorutSuperAndPcRoles },
      { title: 'Rekap Bulanan', href: '/gorut/rekap', icon: Calendar, roles: gorutSuperAdminOnlyRoles },
    ],
  },
  {
    title: 'Komunikasi',
    items: [
      { title: 'Announcement Center', href: '/gorut/announcement', icon: Megaphone, roles: gorutSuperAndPcRoles },
      { title: 'Template WhatsApp', href: '/gorut/whatsapp', icon: MessageSquare, roles: gorutSuperAndPcRoles },
      { title: 'Notifikasi', href: '/gorut/notifikasi', icon: Bell, badge: 5, roles: gorutOperationalRoles },
    ],
  },
  {
    title: 'Mobile',
    items: [{ title: 'Mobile Ecosystem', href: '/gorut/mobile', icon: Smartphone, roles: gorutSuperAdminOnlyRoles }],
  },
  {
    title: 'Sistem',
    items: [
      { title: 'System Monitoring', href: '/gorut/monitoring', icon: Activity, roles: gorutSuperAdminOnlyRoles },
      { title: 'Audit Center', href: '/gorut/audit', icon: Lock, roles: gorutSuperAdminOnlyRoles },
      { title: 'Activity Log', href: '/gorut/activity', icon: Activity, roles: gorutSuperAdminOnlyRoles },
      { title: 'Hak Akses', href: '/gorut/akses', icon: Shield, roles: gorutSuperAdminOnlyRoles },
      { title: 'Backup Data', href: '/gorut/backup', icon: Database, roles: gorutSuperAdminOnlyRoles },
      { title: 'Pengaturan', href: '/gorut/settings', icon: Cog, roles: gorutSuperAdminOnlyRoles },
    ],
  },
]

const gorutUpzisNavGroups: GorutNavGroup[] = [
  {
    title: 'Dashboard',
    items: [{ title: 'Dashboard UPZIS', href: '/gorut/dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'Penghimpunan',
    items: [
      { title: 'Data Munfiq', href: '/gorut/munfiq', icon: Users },
      {
        title: 'Alur Penghimpunan',
        href: '/gorut/transaksi',
        icon: Coins,
        submenu: [
          { title: 'Tahap Munfiq ke PLPK', href: '/gorut/transaksi' },
          { title: 'Tahap PLPK ke Kordes', href: '/gorut/monitoring-plpk' },
          { title: 'Tahap Kordes ke UPZIS', href: '/gorut/ranting' },
        ],
      },
      { title: 'Verifikasi Penghimpunan', href: '/gorut/validasi', icon: CheckCircle2, badge: 8 },
      { title: 'Rekapitulasi', href: '/gorut/approval', icon: Calendar, badge: 4 },
      { title: 'Laporan', href: '/gorut/laporan', icon: FileText },
    ],
  },
  {
    title: 'Master',
    items: [
      { title: 'Wilayah', href: '/gorut/kecamatan', icon: MapPin },
      { title: 'Kategori', href: '/gorut/archive', icon: Archive },
    ],
  },
  {
    title: 'Pengaturan',
    items: [
      { title: 'User & Role', href: '/gorut/profil', icon: Shield },
      { title: 'Pengaturan', href: '/gorut/pengaturan-akun', icon: Cog },
    ],
  },
]

export function getGorutNavGroupsForRole(role?: AppRole | null) {
  if (role === 'admin_upzis') {
    return gorutUpzisNavGroups
  }

  return gorutNavGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.roles || !role || item.roles.includes(role)),
    }))
    .filter((group) => group.items.length > 0)
}

export function isGorutPathActive(pathname: string, href: string) {
  return pathname === href || (href !== '/gorut' && pathname.startsWith(`${href}/`))
}

export function getGorutActiveItemKey(pathname: string, role?: AppRole | null) {
  for (const group of getGorutNavGroupsForRole(role)) {
    for (const item of group.items) {
      if (isGorutPathActive(pathname, item.href)) {
        return `${group.title}:${item.title}`
      }
    }
  }

  return null
}

export function getGorutCurrentPage(pathname: string, role?: AppRole | null) {
  const activeKey = getGorutActiveItemKey(pathname, role)

  if (activeKey) {
    for (const group of getGorutNavGroupsForRole(role)) {
      for (const item of group.items) {
        if (`${group.title}:${item.title}` === activeKey) {
          return item.title
        }
      }
    }
  }

  const standalonePages: Record<string, string> = {
    '/gorut': 'Welcome',
    '/gorut/profil': 'Profil',
    '/gorut/pengaturan-akun': 'Pengaturan Akun',
    '/gorut/aktivitas-log': 'Activity Log',
    '/gorut/help': 'Bantuan',
  }

  return standalonePages[pathname] || 'Dashboard'
}

export function getGorutMobileNavItems(role?: AppRole | null) {
  return [
    { title: 'Welcome', href: '/gorut' },
    ...getGorutNavGroupsForRole(role).flatMap((group) => group.items.map(({ title, href }) => ({ title, href }))),
    { title: 'Profil', href: '/gorut/profil' },
    { title: 'Pengaturan Akun', href: '/gorut/pengaturan-akun' },
    { title: 'Bantuan', href: '/gorut/help' },
  ]
}

export function canAccessGorutPath(role: AppRole | null | undefined, pathname: string) {
  const normalizedPath = pathname === '/gorut' ? '/gorut/dashboard' : pathname

  if (role === 'super_admin_pc') {
    return true
  }

  if (role === 'admin_pc') {
    const allowedPrefixes = [
      '/gorut',
      '/gorut/dashboard',
      '/gorut/munfiq',
      '/gorut/transaksi',
      '/gorut/approval',
      '/gorut/validasi',
      '/gorut/analytics',
      '/gorut/performance',
      '/gorut/keuangan',
      '/gorut/kecamatan',
      '/gorut/upzis',
      '/gorut/ranting',
      '/gorut/monitoring-plpk',
      '/gorut/laporan',
      '/gorut/statistik',
      '/gorut/archive',
      '/gorut/announcement',
      '/gorut/notifikasi',
      '/gorut/profil',
      '/gorut/pengaturan-akun',
      '/gorut/help',
    ]

    return allowedPrefixes.some((prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`))
  }

  if (role === 'admin_upzis') {
    const allowedPrefixes = [
      '/gorut',
      '/gorut/dashboard',
      '/gorut/munfiq',
      '/gorut/transaksi',
      '/gorut/approval',
      '/gorut/validasi',
      '/gorut/upzis',
      '/gorut/monitoring-plpk',
      '/gorut/ranting',
      '/gorut/archive',
      '/gorut/laporan',
      '/gorut/notifikasi',
      '/gorut/profil',
      '/gorut/pengaturan-akun',
      '/gorut/help',
    ]

    return allowedPrefixes.some((prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`))
  }

  if (role === 'admin_kordes') {
    const allowedPrefixes = [
      '/gorut',
      '/gorut/dashboard',
      '/gorut/munfiq',
      '/gorut/transaksi',
      '/gorut/approval',
      '/gorut/validasi',
      '/gorut/monitoring-plpk',
      '/gorut/laporan',
      '/gorut/notifikasi',
      '/gorut/profil',
      '/gorut/pengaturan-akun',
      '/gorut/help',
    ]

    return allowedPrefixes.some((prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`))
  }

  return false
}
