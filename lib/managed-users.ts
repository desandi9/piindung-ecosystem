"use client"

import { useEffect, useState } from "react"
import type { User, UserRole } from "@/lib/auth-context"
import { isValidPhoneNumber, normalizePhoneNumber } from "@/lib/phone"

export type UserStatus = "Aktif" | "Nonaktif" | "Menunggu"

export interface ManagedUser {
  id: string
  name: string
  email: string
  phone?: string
  role: UserRole
  status: UserStatus
  lastLogin: string
  avatar: string
  password: string
  passwordUpdatedAt?: string
}

export const MANAGED_USERS_STORAGE_KEY = "piindung-managed-users"
export const MANAGED_USERS_EVENT = "piindung-managed-users-updated"

const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=160&q=80"

let managedUsersCache: ManagedUser[] = []

function formatPasswordUpdatedAt() {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date())
}

export function normalizeManagedUserPhone(phone: string) {
  return normalizePhoneNumber(phone)
}

export function formatManagedUserPhone(phone?: string) {
  if (!phone) return "-"

  const normalizedPhone = normalizeManagedUserPhone(phone)
  if (normalizedPhone.length < 10) return normalizedPhone

  const first = normalizedPhone.slice(0, 4)
  const middle = normalizedPhone.slice(4, 8)
  const rest = normalizedPhone.slice(8)

  return [first, middle, rest].filter(Boolean).join("-")
}

export function isValidManagedUserPhone(phone: string) {
  return isValidPhoneNumber(phone)
}

export function isManagedUserPhoneTaken(phone: string, excludeUserId?: string) {
  const normalizedPhone = normalizeManagedUserPhone(phone)

  return managedUsersCache.some((user) => {
    if (excludeUserId && user.id === excludeUserId) return false
    if (!user.phone) return false
    return normalizeManagedUserPhone(user.phone) === normalizedPhone
  })
}

export const DEFAULT_MANAGED_USERS: ManagedUser[] = [
  {
    id: "super-admin-desandi",
    name: "Desandi",
    email: "superadmin@lazisnu.id",
    phone: "081461230523",
    role: "super_admin_pc",
    status: "Aktif",
    lastLogin: "Belum pernah login",
    avatar: DEFAULT_AVATAR,
    password: "admin123",
  },
  {
    id: "1",
    name: "Desandi Herdiansyah",
    email: "desandi@lazisnu.garut",
    phone: "081234567890",
    role: "super_admin_pc",
    status: "Aktif",
    lastLogin: "Hari ini, 09:24",
    avatar: DEFAULT_AVATAR,
    password: "admin123",
  },
  {
    id: "2",
    name: "Siti Nurhaliza",
    email: "siti@lazisnu.garut",
    phone: "081234567891",
    role: "admin_pc",
    status: "Aktif",
    lastLogin: "Kemarin, 16:10",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&q=80",
    password: "admin123",
  },
  {
    id: "3",
    name: "Muhammad Iqbal",
    email: "iqbal@lazisnu.garut",
    phone: "081234567892",
    role: "admin_upzis",
    status: "Menunggu",
    lastLogin: "12 Mei 2026",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&q=80",
    password: "admin123",
  },
  {
    id: "4",
    name: "Dewi Anggraeni",
    email: "dewi@lazisnu.garut",
    phone: "081234567893",
    role: "admin_kordes",
    status: "Aktif",
    lastLogin: "10 Mei 2026",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=160&q=80",
    password: "admin123",
  },
  {
    id: "5",
    name: "H. Abdul Karim",
    email: "karim@lazisnu.garut",
    phone: "081234567894",
    role: "admin_upzis",
    status: "Nonaktif",
    lastLogin: "3 Mei 2026",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&q=80",
    password: "admin123",
  },
]

managedUsersCache = DEFAULT_MANAGED_USERS

function dispatchManagedUsersEvent(users: ManagedUser[]) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent<ManagedUser[]>(MANAGED_USERS_EVENT, { detail: users }))
}

async function fetchManagedUsers() {
  const response = await fetch("/api/users", { credentials: "include" })
  if (!response.ok) throw new Error("Failed to fetch users")

  const payload = (await response.json()) as { users: ManagedUser[] }
  managedUsersCache = payload.users
  dispatchManagedUsersEvent(managedUsersCache)
  return managedUsersCache
}

export async function refreshManagedUsers() {
  return fetchManagedUsers()
}

export function readManagedUsers() {
  return managedUsersCache
}

export async function writeManagedUsers(users: ManagedUser[]) {
  managedUsersCache = users
  dispatchManagedUsersEvent(users)
}

export async function createManagedUser(user: Omit<ManagedUser, "id" | "lastLogin" | "passwordUpdatedAt">) {
  const nextUser: ManagedUser = {
    id: `user-${Date.now()}`,
    ...user,
    phone: normalizeManagedUserPhone(user.phone ?? ""),
    lastLogin: "Belum pernah login",
    avatar: user.avatar || DEFAULT_AVATAR,
    password: user.password,
  }

  const response = await fetch("/api/users", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(nextUser),
  })

  if (!response.ok) throw new Error("Failed to create user")

  const payload = (await response.json()) as { user: ManagedUser }
  await fetchManagedUsers()
  return payload.user
}

export async function updateManagedUser(id: string, updates: Partial<Omit<ManagedUser, "id">>) {
  const currentUser = managedUsersCache.find((user) => user.id === id)
  const users = managedUsersCache.map((user) => {
    if (user.id !== id) return user

    const passwordChanged = updates.password !== undefined && updates.password !== user.password

    return {
      ...user,
      ...updates,
      phone: updates.phone !== undefined ? normalizeManagedUserPhone(updates.phone) : user.phone,
      passwordUpdatedAt: updates.passwordUpdatedAt !== undefined
        ? updates.passwordUpdatedAt
        : passwordChanged
          ? formatPasswordUpdatedAt()
          : user.passwordUpdatedAt,
    }
  })

  const response = await fetch(`/api/users/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...updates,
      phone: updates.phone !== undefined ? normalizeManagedUserPhone(updates.phone) : currentUser?.phone,
    }),
  })

  if (!response.ok) throw new Error("Failed to update user")

  const payload = (await response.json()) as { user: ManagedUser }
  await fetchManagedUsers()
  return payload.user
}

export async function deleteManagedUser(id: string) {
  const response = await fetch(`/api/users/${id}`, {
    method: "DELETE",
    credentials: "include",
  })

  if (!response.ok) throw new Error("Failed to delete user")

  await fetchManagedUsers()
}

export function resetManagedUserPassword(id: string, password: string) {
  return updateManagedUser(id, { password })
}

export function toAuthUser(user: ManagedUser): User {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
  }
}

export function useManagedUsers() {
  const [users, setUsers] = useState<ManagedUser[]>(DEFAULT_MANAGED_USERS)

  useEffect(() => {
    let isMounted = true

    void fetchManagedUsers()
      .then((nextUsers) => {
        if (isMounted) setUsers(nextUsers)
      })
      .catch(() => {
        if (isMounted) setUsers(managedUsersCache)
      })

    function handleUsersUpdated(event: Event) {
      const customEvent = event as CustomEvent<ManagedUser[]>
      setUsers(customEvent.detail ?? managedUsersCache)
    }

    window.addEventListener(MANAGED_USERS_EVENT, handleUsersUpdated)

    return () => {
      isMounted = false
      window.removeEventListener(MANAGED_USERS_EVENT, handleUsersUpdated)
    }
  }, [])

  return users
}
