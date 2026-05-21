'use client'

import { useAuth } from '@/lib/auth-context'
import { useUserOperationalScopes } from '@/lib/user-operational-scope'

export function getScopedRoleLabel(role?: string | null, assignedKecamatan?: string | null) {
  if (role === 'admin_upzis' && assignedKecamatan) {
    return `Admin UPZIS - ${assignedKecamatan}`
  }

  if (role === 'admin_kordes' && assignedKecamatan) {
    return `Admin Kordes - ${assignedKecamatan}`
  }

  return null
}

export function useAssignedGorutKecamatan() {
  const { user } = useAuth()
  const scopes = useUserOperationalScopes()
  const currentScope = scopes.find((item) => item.userId === user?.id)

  return {
    role: user?.role,
    assignedKecamatan: currentScope?.gorutKecamatan ?? null,
    isScopedUpzis: user?.role === 'admin_upzis' && Boolean(currentScope?.gorutKecamatan),
    isScopedKordes: user?.role === 'admin_kordes' && Boolean(currentScope?.gorutKecamatan),
    isScopedOperationalRole: (user?.role === 'admin_upzis' || user?.role === 'admin_kordes') && Boolean(currentScope?.gorutKecamatan),
    scopedRoleLabel: getScopedRoleLabel(user?.role, currentScope?.gorutKecamatan),
  }
}
