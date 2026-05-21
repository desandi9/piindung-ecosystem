"use client"

import { createSingletonClient } from "@/services/api/record-client"
import type { UserRole } from "@/lib/auth-context"

export type ManagedAdminRole = "super_admin_pc" | "admin_pc"

export type PermissionId =
  | "dashboard"
  | "kelola-pengguna"
  | "artikel-berita"
  | "banner-homepage"
  | "galeri-kegiatan"
  | "download-center"
  | "kontak-sosial"
  | "popup-pengumuman"
  | "faq-manager"
  | "pesan-masuk"
  | "media-manager"
  | "aplikasi-terintegrasi"
  | "notifikasi"
  | "pengaturan-sistem"
  | "system-health"
  | "activity-log"
  | "audit-trail"
  | "backup-restore"

export interface PermissionItem {
  id: PermissionId
  label: string
  description: string
}

export interface PermissionGroup {
  id: string
  title: string
  description: string
  permissions: PermissionItem[]
}

export type RolePermissions = Record<ManagedAdminRole, Record<PermissionId, boolean>>

export const ACCESS_PERMISSIONS_STORAGE_KEY = "piindung-access-permissions"
export const ACCESS_PERMISSIONS_EVENT = "piindung-access-permissions-updated"

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: "dashboard",
    title: "Dashboard Access",
    description: "Akses halaman utama panel admin PIINDUNG.",
    permissions: [
      { id: "dashboard", label: "Dashboard", description: "Melihat ringkasan dan quick access admin." },
    ],
  },
  {
    id: "content",
    title: "Article & Banner Access",
    description: "Kelola konten publik dan homepage.",
    permissions: [
      { id: "artikel-berita", label: "Artikel / Berita", description: "Mengelola artikel, berita, dan informasi." },
      { id: "banner-homepage", label: "Banner Homepage", description: "Mengelola banner utama homepage." },
      { id: "galeri-kegiatan", label: "Galeri Kegiatan", description: "Mengelola foto galeri kegiatan homepage." },
        { id: "download-center", label: "Download Center", description: "Mengelola file unduhan publik." },
        { id: "kontak-sosial", label: "Kontak & Sosial Media", description: "Mengelola kontak, alamat, maps, dan sosial media." },
        { id: "popup-pengumuman", label: "Popup & Pengumuman", description: "Mengelola popup pengumuman homepage." },
        { id: "faq-manager", label: "FAQ Manager", description: "Mengelola FAQ dan konten bantuan publik." },
        { id: "pesan-masuk", label: "Pesan Masuk", description: "Mengelola inbox pesan dari halaman publik." },
        { id: "media-manager", label: "Media Manager", description: "Mengelola media dan aset upload sistem." },
      ],
    },
  {
    id: "management",
    title: "Management Menus",
    description: "Menu pengelolaan portal dan dashboard.",
    permissions: [
      { id: "kelola-pengguna", label: "Kelola Pengguna", description: "Mengelola akun dan akses pengguna." },
      { id: "aplikasi-terintegrasi", label: "Aplikasi Terintegrasi", description: "Mengelola shortcut aplikasi dashboard." },
      { id: "notifikasi", label: "Notifikasi", description: "Mengelola notifikasi dashboard." },
    ],
  },
  {
    id: "system",
    title: "Settings & System Access",
    description: "Akses konfigurasi dan audit sistem.",
    permissions: [
      { id: "pengaturan-sistem", label: "Pengaturan Sistem", description: "Mengelola theme, identitas, kontak, dan preferensi." },
      { id: "system-health", label: "System Health", description: "Memantau kesehatan database, backup, media, dan status sistem." },
      { id: "activity-log", label: "Activity Log", description: "Melihat dan mengelola riwayat aktivitas." },
      { id: "audit-trail", label: "Audit Trail", description: "Melihat jejak perubahan konten, pengguna, dan sistem secara terstruktur." },
      { id: "backup-restore", label: "Backup & Restore", description: "Membuat backup dan restore data sistem." },
    ],
  },
]

export const DEFAULT_ROLE_PERMISSIONS: RolePermissions = {
  super_admin_pc: {
    dashboard: true,
    "kelola-pengguna": true,
    "artikel-berita": true,
    "banner-homepage": true,
    "galeri-kegiatan": true,
    "download-center": true,
    "kontak-sosial": true,
    "popup-pengumuman": true,
    "faq-manager": true,
    "pesan-masuk": true,
    "media-manager": true,
    "aplikasi-terintegrasi": true,
    notifikasi: true,
    "pengaturan-sistem": true,
    "system-health": true,
    "activity-log": true,
    "audit-trail": true,
    "backup-restore": true,
  },
  admin_pc: {
    dashboard: true,
    "kelola-pengguna": false,
    "artikel-berita": true,
    "banner-homepage": true,
    "galeri-kegiatan": true,
    "download-center": true,
    "kontak-sosial": true,
    "popup-pengumuman": true,
    "faq-manager": true,
    "pesan-masuk": true,
    "media-manager": false,
    "aplikasi-terintegrasi": false,
    notifikasi: true,
    "pengaturan-sistem": false,
    "system-health": false,
    "activity-log": true,
    "audit-trail": false,
    "backup-restore": false,
  },
}

const permissionsClient = createSingletonClient<RolePermissions>({
  scope: "access-permissions",
  defaultValue: DEFAULT_ROLE_PERMISSIONS,
  eventName: ACCESS_PERMISSIONS_EVENT,
})

function dispatchPermissionsEvent(permissions: RolePermissions) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent<RolePermissions>(ACCESS_PERMISSIONS_EVENT, { detail: permissions }))
}

export function readRolePermissions() {
  return permissionsClient.readValueSync()
}

export function writeRolePermissions(permissions: RolePermissions) {
  void permissionsClient.writeValue(permissions)
}

export function updateRolePermission(role: ManagedAdminRole, permissionId: PermissionId, enabled: boolean) {
  const currentPermissions = readRolePermissions()
  const nextPermissions: RolePermissions = {
    ...currentPermissions,
    [role]: {
      ...currentPermissions[role],
      [permissionId]: enabled,
    },
  }

  writeRolePermissions(nextPermissions)
  return nextPermissions
}

export function canAccessMenu(role: UserRole, menuId: string, permissions: RolePermissions) {
  if (menuId === "hak-akses" && role === "super_admin_pc") return true
  if (role !== "super_admin_pc" && role !== "admin_pc") return true
  if (!(menuId in permissions[role])) return true

  return permissions[role][menuId as PermissionId]
}

export function useRolePermissions() {
  return permissionsClient.useValue()
}
