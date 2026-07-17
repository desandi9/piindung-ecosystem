"use client"

import { createCollectionClient } from "@/services/api/record-client"
import type { UserRole } from "@/lib/auth-context"

export interface UserOperationalScope {
  id: string
  userId: string
  role: UserRole
  gorutKecamatan?: string
  gorutWilayahLabel?: string
}

export const USER_OPERATIONAL_SCOPE_EVENT = "user-operational-scope-updated"

export const gorutScopedOperationalRoles: UserRole[] = ["admin_upzis", "admin_kordes"]

export type OperationalScopeStatus = "Lengkap" | "Belum Ditentukan" | "Tidak Diperlukan"

export function formatUserOperationalScope(role: UserRole, scope?: Pick<UserOperationalScope, "gorutKecamatan" | "gorutWilayahLabel"> | null) {
  const gorutKecamatan = scope?.gorutKecamatan?.trim()
  const gorutWilayahLabel = scope?.gorutWilayahLabel?.trim()

  if (role === "super_admin_pc" || role === "admin_pc") return "Seluruh Wilayah"
  if (role === "admin_upzis") return gorutWilayahLabel || (gorutKecamatan ? `UPZIS Kecamatan ${gorutKecamatan}` : "Belum Ditentukan")
  if (role === "admin_kordes") return gorutWilayahLabel || (gorutKecamatan ? `Kecamatan ${gorutKecamatan}` : "Belum Ditentukan")

  return gorutWilayahLabel || gorutKecamatan || "Belum Ditentukan"
}

export function getUserOperationalScopeStatus(role: UserRole, scope?: Pick<UserOperationalScope, "gorutKecamatan" | "gorutWilayahLabel"> | null): OperationalScopeStatus {
  if (role === "super_admin_pc" || role === "admin_pc") return "Tidak Diperlukan"
  if (gorutScopedOperationalRoles.includes(role)) return scope?.gorutKecamatan?.trim() ? "Lengkap" : "Belum Ditentukan"

  return "Belum Ditentukan"
}

export function operationalScopeStatusClass(status: OperationalScopeStatus) {
  if (status === "Lengkap") return "bg-[#e6f7ee] text-[#15945b] dark:bg-emerald-500/10 dark:text-emerald-400"
  if (status === "Tidak Diperlukan") return "bg-muted text-muted-foreground"
  return "bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300"
}

const userOperationalScopeClient = createCollectionClient<UserOperationalScope>({
  scope: "user-operational-scope",
  defaultItems: [],
  eventName: USER_OPERATIONAL_SCOPE_EVENT,
  sort: (items) => [...items].sort((a, b) => a.userId.localeCompare(b.userId)),
})

export function useUserOperationalScopes() {
  return userOperationalScopeClient.useItems()
}

export function readUserOperationalScopes() {
  return userOperationalScopeClient.readItemsSync()
}

export async function upsertUserOperationalScope(scope: Omit<UserOperationalScope, "id">) {
  const existing = readUserOperationalScopes().find((item) => item.userId === scope.userId)
  if (existing) {
    return userOperationalScopeClient.updateItem(existing.id, {
      ...existing,
      ...scope,
    })
  }

  return userOperationalScopeClient.createItem({
    id: `user-scope-${scope.userId}`,
    ...scope,
  })
}
