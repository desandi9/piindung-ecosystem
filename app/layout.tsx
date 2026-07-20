import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/components/theme-provider"
import { SystemSettingsProvider } from "@/components/system-settings-provider"
import { MaintenanceGate } from "@/components/maintenance/maintenance-gate"
import { AuthProvider } from "@/lib/auth-context"
import { readSiteBranding } from "@/lib/site-branding-server"
import "./globals.css"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" })

export async function generateMetadata(): Promise<Metadata> {
  const branding = await readSiteBranding()
  return {
    title: { default: branding.socialPreview.defaultOgTitle, template: `%s | ${branding.identity.shortName}` },
    description: branding.socialPreview.defaultOgDescription || branding.identity.tagline,
    keywords: ["donasi", "zakat", "infaq", "sedekah", "NU Care", "LAZISNU", "Garut"],
    icons: { icon: [{ url: branding.icons.favicon.path, type: branding.icons.favicon.mimeType }, { url: "/icon.svg", type: "image/svg+xml" }], apple: [{ url: branding.icons.appleTouchIcon.path, type: branding.icons.appleTouchIcon.mimeType }] },
    openGraph: { type: "website", siteName: branding.identity.organizationName, title: branding.socialPreview.defaultOgTitle, description: branding.socialPreview.defaultOgDescription, images: [{ url: branding.socialPreview.defaultOgImage.path, width: branding.socialPreview.defaultOgImage.width, height: branding.socialPreview.defaultOgImage.height, alt: branding.socialPreview.defaultOgAlt }] },
    twitter: { card: "summary_large_image", title: branding.socialPreview.defaultOgTitle, description: branding.socialPreview.defaultOgDescription, images: [{ url: branding.socialPreview.defaultOgImage.path, alt: branding.socialPreview.defaultOgAlt }] },
  }
}

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0f3460" }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id" className={inter.variable} suppressHydrationWarning data-scroll-behavior="smooth"><body suppressHydrationWarning className="font-sans antialiased bg-background text-foreground"><ThemeProvider attribute="class"><SystemSettingsProvider><AuthProvider><MaintenanceGate>{children}</MaintenanceGate></AuthProvider></SystemSettingsProvider></ThemeProvider>{process.env.NODE_ENV === "production" && <Analytics />}</body></html>
}
