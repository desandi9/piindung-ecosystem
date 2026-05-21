import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/components/theme-provider'
import { SystemSettingsProvider } from '@/components/system-settings-provider'
import { MaintenanceGate } from '@/components/maintenance/maintenance-gate'
import { AuthProvider } from '@/lib/auth-context'
import './globals.css'

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'PIINDUNG - Pusat Instalasi dan Informasi Donasi Unggulan Nahdliyyin Garut',
  description: 'Platform digital untuk mengelola donasi dan kegiatan filantropi secara transparan, akuntabel, dan terintegrasi di Kabupaten Garut.',
  generator: 'v0.app',
  keywords: ['donasi', 'zakat', 'infaq', 'sedekah', 'NU Care', 'LAZISNU', 'Garut'],
  icons: {
    icon: [
      {
        url: '/piindung-logo-blue.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/piindung-logo-blue.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/piindung-logo-blue.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f3460',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" className={inter.variable} suppressHydrationWarning data-scroll-behavior="smooth">
      <body suppressHydrationWarning className="font-sans antialiased bg-background text-foreground">
        <ThemeProvider
          attribute="class"
        >
          <SystemSettingsProvider>
            <AuthProvider>
              <MaintenanceGate>{children}</MaintenanceGate>
            </AuthProvider>
          </SystemSettingsProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
