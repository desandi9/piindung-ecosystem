'use client'

import { useEffect, useState } from 'react'

export const ACCOUNT_PROFILE_STORAGE_KEY = 'gorut-account-profile'

export type AccountProfileState = {
  name: string
  role: string
  email: string
  phone: string
  avatarSrc: string
  twoFactor: boolean
  loginAlert: boolean
}

type CanonicalAccountProfileResponse = {
  profile: {
    name: string
    role: string
    email: string
    phone: string
    avatar: string | null
  }
}

export const defaultAccountProfile: AccountProfileState = {
  name: 'Super Admin GORUT',
  role: 'Super Admin',
  email: 'admin@gorut.id',
  phone: '0812-3456-7890',
  avatarSrc: '/gorut-logo.png',
  twoFactor: true,
  loginAlert: true,
}

let accountProfileCache: AccountProfileState = defaultAccountProfile

function normalizeAccountProfile(payload: CanonicalAccountProfileResponse): AccountProfileState {
  return {
    ...defaultAccountProfile,
    name: payload.profile.name,
    role: payload.profile.role,
    email: payload.profile.email,
    phone: payload.profile.phone,
    avatarSrc: payload.profile.avatar ?? defaultAccountProfile.avatarSrc,
  }
}

async function readAccountProfile(signal?: AbortSignal) {
  const response = await fetch('/api/account/profile', { cache: 'no-store', signal })
  const body = await response.json().catch(() => null)
  if (!response.ok) throw new Error(body?.error ?? 'Profil belum dapat dimuat.')
  accountProfileCache = normalizeAccountProfile(body as CanonicalAccountProfileResponse)
  return accountProfileCache
}

export function loadAccountProfile() {
  return accountProfileCache
}

export function useGorutAccountProfile() {
  const [profile, setProfile] = useState<AccountProfileState>(accountProfileCache)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    void readAccountProfile(controller.signal)
      .then(setProfile)
      .catch((cause) => { if ((cause as Error).name !== 'AbortError') setError(cause instanceof Error ? cause.message : 'Profil belum dapat dimuat.') })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [])

  return { profile, setProfile, loading, error }
}

export function saveAccountProfile(_: AccountProfileState) {
  throw new Error('Perubahan profil dinonaktifkan: profil bersumber dari akun autentikasi.')
}
