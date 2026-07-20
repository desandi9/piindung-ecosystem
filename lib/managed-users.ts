"use client"

import { useEffect, useState } from "react"
import type { User, UserRole } from "@/lib/auth-context"
import { isValidPhoneNumber, normalizePhoneNumber } from "@/lib/phone"

export type UserStatus = "Aktif" | "Nonaktif" | "Menunggu"
export interface ManagedUser { id: string; name: string; email: string; phone?: string; role: UserRole; status: UserStatus; lastLogin?: string; lastLoginAt?: string | null; avatar?: string | null; createdAt?: string; updatedAt?: string; password?: string; passwordUpdatedAt?: string; modules?: Array<{ key: string; name: string }> }
export const MANAGED_USERS_EVENT = "piindung-managed-users-updated"
let managedUsersCache: ManagedUser[] = []

export function normalizeManagedUserPhone(phone: string) { return normalizePhoneNumber(phone) }
export function formatManagedUserPhone(phone?: string) { return phone ? normalizeManagedUserPhone(phone) : "-" }
export function isValidManagedUserPhone(phone: string) { return isValidPhoneNumber(normalizeManagedUserPhone(phone)) }
export function isManagedUserPhoneTaken(phone: string, excludeUserId?: string) { const normalized = normalizeManagedUserPhone(phone); return managedUsersCache.some((user) => user.id !== excludeUserId && user.phone && normalizeManagedUserPhone(user.phone) === normalized) }
function dispatch(users: ManagedUser[]) { if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent<ManagedUser[]>(MANAGED_USERS_EVENT, { detail: users })) }
async function fetchManagedUsers() { const response = await fetch("/api/users", { credentials: "include" }); if (!response.ok) throw new Error("Gagal memuat pengguna."); const data = await response.json() as { users: ManagedUser[] }; managedUsersCache = data.users; dispatch(managedUsersCache); return managedUsersCache }
export function readManagedUsers() { return managedUsersCache }
export async function refreshManagedUsers() { return fetchManagedUsers() }
export async function createManagedUser(user: Omit<ManagedUser, "id" | "lastLogin" | "lastLoginAt" | "createdAt" | "updatedAt" | "modules"> & { password: string }) { const response = await fetch("/api/users", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(user) }); const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error || "Gagal membuat pengguna."); await fetchManagedUsers(); return data.user as ManagedUser }
export async function updateManagedUser(id: string, updates: Partial<Omit<ManagedUser, "id">> & { password?: string }) { const body = { ...updates }; delete (body as { password?: string }).password; const response = await fetch(`/api/users/${id}`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error || "Gagal memperbarui pengguna."); await fetchManagedUsers(); return data.user as ManagedUser }
export async function deleteManagedUser(id: string) { const response = await fetch(`/api/users/${id}`, { method: "DELETE", credentials: "include" }); if (!response.ok) throw new Error("Gagal menghapus pengguna."); await fetchManagedUsers() }
export function resetManagedUserPassword(id: string, password: string) { return updateManagedUser(id, { password }) }
export function toAuthUser(user: ManagedUser): User { return { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar ?? "" } }
export function useManagedUsers() { const [users, setUsers] = useState<ManagedUser[]>([]); useEffect(() => { let mounted = true; void fetchManagedUsers().then((next) => { if (mounted) setUsers(next) }).catch(() => { if (mounted) setUsers([]) }); const handler = (event: Event) => setUsers((event as CustomEvent<ManagedUser[]>).detail ?? []); window.addEventListener(MANAGED_USERS_EVENT, handler); return () => { mounted = false; window.removeEventListener(MANAGED_USERS_EVENT, handler) } }, []); return users }
