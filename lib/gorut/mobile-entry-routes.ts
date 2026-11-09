const entryPaths = new Set([
  "/gorut-v2/mobile",
  "/gorut-v2/mobile/login",
  "/gorut-v2/mobile/reset-password",
])

/** Only entry screens are public. Actor pages and APIs retain their authorization. */
export function isMobileEntryPath(pathname: string) {
  return entryPaths.has(pathname)
}

export function safeMobileDestination(raw: string | null | undefined) {
  if (!raw || !/^\/gorut-v2\/mobile\/(munfiq|plpk|kordes|upzis|pc)(?:\/[^?#\\]*)?(?:\?[^#\\]*)?$/.test(raw)) return null
  if (/%|(?:^|\/)\.{1,2}(?:\/|\?|$)/.test(raw)) return null
  return raw
}

export function mobileLoginPath(destination: string) {
  const safe = safeMobileDestination(destination)
  return safe ? `/gorut-v2/mobile/login?next=${encodeURIComponent(safe)}` : "/gorut-v2/mobile/login"
}
