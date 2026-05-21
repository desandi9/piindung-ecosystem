export function normalizePhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "")
  if (digits.startsWith("62")) return `0${digits.slice(2)}`
  return digits
}

export function isValidPhoneNumber(value: string) {
  const normalized = normalizePhoneNumber(value)
  return /^08\d{8,13}$/.test(normalized)
}
