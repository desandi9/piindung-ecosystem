export type AppRole = "super_admin_pc" | "admin_pc" | "admin_upzis" | "admin_kordes"

export interface AuthUser {
  id: string
  name: string
  email: string
  role: AppRole
  avatar?: string
}

export type AuthSessionPersistence = "persistent" | "session"

export interface AuthSession {
  user: AuthUser
  persistence: AuthSessionPersistence
  loginAt: string
  lastSyncedAt: string
}

export interface LoginCredentials {
  phoneNumber: string
  password: string
  remember?: boolean
}

export interface RoleOption {
  value: AppRole
  label: string
}
