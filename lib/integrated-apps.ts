"use client"

import { createCollectionClient } from "@/services/api/record-client"

export interface IntegratedApp {
  id: "gorut" | "etasyaruf" | "mobisnu" | "arsip"
  name: string
  description: string
  iconUrl: string
  link: string
  enabled: boolean
  position: number
}

export const INTEGRATED_APPS_STORAGE_KEY = "piindung-integrated-apps"
export const INTEGRATED_APPS_EVENT = "piindung-integrated-apps-updated"

export const DEFAULT_INTEGRATED_APPS: IntegratedApp[] = [
  {
    id: "gorut",
    name: "Gorut",
    description: "Digitalisasi Kotak Infaq NU",
    iconUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ICON%20GORUT%20%28KOIN%29-PuI8bKYRsYavejAiAnpcf2KYBYxvCG.png",
    link: "/gorut",
    enabled: true,
    position: 1,
  },
  {
    id: "etasyaruf",
    name: "E-Tasyaruf",
    description: "Pendataan & Pentasyarufan",
    iconUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ICON%20PENTASYARUFAN-3d1ESgFGdHDSsVyGwM4bA8f00UZulq.png",
    link: "/etasyaruf",
    enabled: true,
    position: 2,
  },
  {
    id: "mobisnu",
    name: "Mobisnu",
    description: "Layanan Mobil Kesehatan NU",
    iconUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/icon%20mobisnu.PNG-PTAlyAtc2gSG1E6t9lumYCrjcxZbQs.png",
    link: "/mobisnu",
    enabled: true,
    position: 3,
  },
  {
    id: "arsip",
    name: "Arsip",
    description: "Arsip Digital Lembaga",
    iconUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/icon%20arsip.PNG-ICoMCGSDzrJxP8skMbkxCesujkv4Rc.png",
    link: "/arsip",
    enabled: true,
    position: 4,
  },
]

const integratedAppsClient = createCollectionClient<IntegratedApp>({
  scope: "integrated-apps",
  defaultItems: DEFAULT_INTEGRATED_APPS,
  eventName: INTEGRATED_APPS_EVENT,
  sort: sortIntegratedApps,
})

function dispatchIntegratedAppsEvent(apps: IntegratedApp[]) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent<IntegratedApp[]>(INTEGRATED_APPS_EVENT, { detail: apps }))
}

export function sortIntegratedApps(apps: IntegratedApp[]) {
  return [...apps].sort((first, second) => first.position - second.position)
}

export function readIntegratedApps() {
  return integratedAppsClient.readItemsSync()
}

export function writeIntegratedApps(apps: IntegratedApp[]) {
  void integratedAppsClient.writeItems(sortIntegratedApps(apps).map((app, index) => ({ ...app, position: index + 1 })))
}

export function updateIntegratedApp(id: IntegratedApp["id"], updates: Partial<Omit<IntegratedApp, "id">>) {
  const apps = readIntegratedApps().map((app) => (app.id === id ? { ...app, ...updates } : app))
  writeIntegratedApps(apps)
  return apps.find((app) => app.id === id)
}

export function moveIntegratedApp(id: IntegratedApp["id"], direction: "up" | "down") {
  const apps = sortIntegratedApps(readIntegratedApps())
  const currentIndex = apps.findIndex((app) => app.id === id)
  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= apps.length) return apps

  const nextApps = [...apps]
  const currentApp = nextApps[currentIndex]
  nextApps[currentIndex] = nextApps[targetIndex]
  nextApps[targetIndex] = currentApp
  writeIntegratedApps(nextApps)
  return nextApps
}

export function useIntegratedApps() {
  return integratedAppsClient.useItems()
}
