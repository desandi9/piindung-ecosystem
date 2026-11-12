"use client"

import { useEffect, useState } from "react"
import { PublicThemeDefault } from "@/components/piindung/public-theme-default"
import { DEFAULT_SITE_BRANDING, type SiteBranding } from "@/lib/site-branding"
import { useLandingApps } from "./home-apps"
import { HomeCatalog } from "./home-catalog"
import { HomeFooter } from "./home-footer"
import { HomeHelp, HomeSteps, useSiteContact } from "./home-guide"
import { HomeHero, HomeHighlights } from "./home-hero"
import { HomeNavbar } from "./home-navbar"

function useSiteBranding() {
  const [branding, setBranding] = useState<SiteBranding>(DEFAULT_SITE_BRANDING)
  useEffect(() => {
    fetch("/api/site-branding")
      .then((res) => res.json())
      .then((data) => data.branding && setBranding(data.branding))
      .catch(() => undefined)
  }, [])
  return branding
}

/** Landing publik PIINDUNG di "/". Data branding, kontak, dan katalog diambil sekali di sini. */
export function HomeLanding() {
  const apps = useLandingApps()
  const branding = useSiteBranding()
  const contact = useSiteContact()

  return (
    <>
      <PublicThemeDefault />
      <HomeNavbar branding={branding} />
      <main className="overflow-x-clip">
        <HomeHero apps={apps} />
        <HomeHighlights />
        <HomeCatalog apps={apps} />
        <HomeSteps />
        <HomeHelp contact={contact} />
      </main>
      <HomeFooter branding={branding} contact={contact} />
    </>
  )
}
