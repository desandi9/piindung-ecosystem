import type { GorutOperationalRole } from "@prisma/client"

export const munfiqPresentationPath = "/gorut-v2/mobile/ruang-munfiq"

export type SwitchableOperationalPersona = {
  role: "KORDES" | "UPZIS" | "PC"
  label: "Kordes" | "UPZIS" | "PC"
  href: string
}

export function resolveSwitchableOperationalPersona(role: GorutOperationalRole): SwitchableOperationalPersona | null {
  if (role === "RANTING") return { role: "KORDES", label: "Kordes", href: "/gorut-v2/mobile/kordes" }
  if (role === "UPZIS") return { role: "UPZIS", label: "UPZIS", href: "/gorut-v2/mobile/upzis" }
  if (role === "PC") return { role: "PC", label: "PC", href: "/gorut-v2/mobile/pc" }
  return null
}
