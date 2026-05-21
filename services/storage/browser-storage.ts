"use client"

export type BrowserStorageScope = "local" | "session"

function getStorage(scope: BrowserStorageScope) {
  if (typeof window === "undefined") return null
  return scope === "local" ? window.localStorage : window.sessionStorage
}

export function readStoredJson<T>(key: string, fallback: T, scope: BrowserStorageScope = "local") {
  const storage = getStorage(scope)
  if (!storage) return fallback

  try {
    const storedValue = storage.getItem(key)
    return storedValue ? (JSON.parse(storedValue) as T) : fallback
  } catch {
    return fallback
  }
}

export function writeStoredJson<T>(key: string, value: T, scope: BrowserStorageScope = "local") {
  const storage = getStorage(scope)
  if (!storage) return
  storage.setItem(key, JSON.stringify(value))
}

export function removeStoredValue(key: string, scope: BrowserStorageScope = "local") {
  const storage = getStorage(scope)
  if (!storage) return
  storage.removeItem(key)
}
