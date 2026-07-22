export const protectedInternalRecordScopes = new Set(["portal-module-grants", "portal-access-audit", "portal-user-audit", "portal-notification-audit"])

export function isProtectedInternalRecordScope(scope: string) {
  return protectedInternalRecordScopes.has(scope)
}
