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

export const defaultAccountProfile: AccountProfileState = {
  name: 'Super Admin GORUT',
  role: 'Super Admin',
  email: 'admin@gorut.id',
  phone: '0812-3456-7890',
  avatarSrc: '/gorut-logo.png',
  twoFactor: true,
  loginAlert: true,
}

export function loadAccountProfile() {
  if (typeof window === 'undefined') return defaultAccountProfile

  try {
    const raw = window.localStorage.getItem(ACCOUNT_PROFILE_STORAGE_KEY)
    if (!raw) return defaultAccountProfile
    return { ...defaultAccountProfile, ...(JSON.parse(raw) as Partial<AccountProfileState>) }
  } catch {
    return defaultAccountProfile
  }
}

export function saveAccountProfile(value: AccountProfileState) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(ACCOUNT_PROFILE_STORAGE_KEY, JSON.stringify(value))
}
