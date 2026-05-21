"use client"

import { readStoredJson, removeStoredValue, writeStoredJson } from "@/services/storage/browser-storage"
import type { AuthSession, AuthUser } from "@/types/auth"

export const AUTH_SESSION_STORAGE_KEY = "piindung-auth-session"
export const LEGACY_AUTH_STORAGE_KEY = "piindung_user"

function createSession(user: AuthUser, remember = true): AuthSession {
  const now = new Date().toISOString()

  return {
    user,
    persistence: remember ? "persistent" : "session",
    loginAt: now,
    lastSyncedAt: now,
  }
}

export function readAuthSession() {
  const persistentSession = readStoredJson<AuthSession | null>(AUTH_SESSION_STORAGE_KEY, null, "local")
  if (persistentSession) return persistentSession

  const temporarySession = readStoredJson<AuthSession | null>(AUTH_SESSION_STORAGE_KEY, null, "session")
  if (temporarySession) return temporarySession

  const legacyUser = readStoredJson<AuthUser | null>(LEGACY_AUTH_STORAGE_KEY, null, "local")
  if (legacyUser) return createSession(legacyUser, true)

  return null
}

export function writeAuthSession(user: AuthUser, remember = true) {
  clearAuthSession()
  const nextSession = createSession(user, remember)
  writeStoredJson(AUTH_SESSION_STORAGE_KEY, nextSession, remember ? "local" : "session")
  return nextSession
}

export function syncAuthSessionUser(user: AuthUser) {
  const currentSession = readAuthSession()
  if (!currentSession) return writeAuthSession(user, true)

  const nextSession: AuthSession = {
    ...currentSession,
    user,
    lastSyncedAt: new Date().toISOString(),
  }

  clearAuthSession()
  writeStoredJson(AUTH_SESSION_STORAGE_KEY, nextSession, currentSession.persistence === "persistent" ? "local" : "session")
  return nextSession
}

export function clearAuthSession() {
  removeStoredValue(AUTH_SESSION_STORAGE_KEY, "local")
  removeStoredValue(AUTH_SESSION_STORAGE_KEY, "session")
  removeStoredValue(LEGACY_AUTH_STORAGE_KEY, "local")
}
