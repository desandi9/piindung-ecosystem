export type PlatformModuleId = "piindung-core" | "super-admin" | "admin-pc" | "gorut" | "e-tasyaruf"
export type PlatformModuleStatus = "active" | "planned"

export interface PlatformModuleDefinition {
  id: PlatformModuleId
  label: string
  description: string
  status: PlatformModuleStatus
  ownerArea: "core" | "admin" | "operations"
  routeNamespace: string
}

export const platformModules: PlatformModuleDefinition[] = [
  {
    id: "piindung-core",
    label: "PIINDUNG Core",
    description: "Portal publik, autentikasi admin, branding, dan reusable system foundation.",
    status: "active",
    ownerArea: "core",
    routeNamespace: "/",
  },
  {
    id: "super-admin",
    label: "Super Admin",
    description: "Pusat kendali konfigurasi, governance, audit, dan maintenance ekosistem PIINDUNG.",
    status: "active",
    ownerArea: "admin",
    routeNamespace: "/admin",
  },
  {
    id: "admin-pc",
    label: "Admin PC",
    description: "Operasional portal dan konten untuk tim admin tingkat PC.",
    status: "active",
    ownerArea: "admin",
    routeNamespace: "/admin",
  },
  {
    id: "gorut",
    label: "GORUT",
    description: "Modul operasional aktif untuk workflow, monitoring, dan pelaporan Gerakan Koin Infak NU Garut.",
    status: "active",
    ownerArea: "operations",
    routeNamespace: "/gorut",
  },
  {
    id: "e-tasyaruf",
    label: "E-Tasyaruf Module",
    description: "Future operational module untuk pengelolaan penyaluran, approval, dan histori tasyaruf.",
    status: "planned",
    ownerArea: "operations",
    routeNamespace: "/e-tasyaruf",
  },
]
