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
