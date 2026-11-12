import { BadgeCheck, Bell, CircleCheckBig, ClipboardCheck, HandCoins, HeartHandshake, House, IdCard, LifeBuoy, PackageCheck, PanelsTopLeft, ShieldCheck, Truck, UserRoundCog, type LucideIcon } from "lucide-react"
import type { DashboardIcon } from "@/lib/portal-dashboard"

export const portalIcons: Record<DashboardIcon, LucideIcon> = {
  deposit: HandCoins,
  validate: BadgeCheck,
  approve: CircleCheckBig,
  package: PackageCheck,
  verify: ClipboardCheck,
  pickup: Truck,
  home: House,
  program: HeartHandshake,
  bell: Bell,
  website: PanelsTopLeft,
  admin: ShieldCheck,
  identity: IdCard,
  settings: UserRoundCog,
  help: LifeBuoy,
}
