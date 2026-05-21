"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/piindung/navbar"
import { HeroBanner } from "@/components/piindung/hero-banner"
import { AppCards } from "@/components/piindung/app-cards"
import { QuickActions } from "@/components/piindung/quick-actions"
import { InfoSection } from "@/components/piindung/info-section"
import { Footer } from "@/components/piindung/footer"
import { PopupAnnouncement } from "@/components/piindung/popup-announcement"

function RevealBlock({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <div className={`dashboard-reveal ${className}`.trim()} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

export default function DashboardPage() {
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsReady(true))
    return () => window.cancelAnimationFrame(frame)
  }, [])

  return (
    <div className="dashboard-shell min-h-screen flex flex-col bg-background data-[ready=true]:dashboard-shell-ready" data-ready={isReady}>
      <RevealBlock delay={80} className="dashboard-reveal-nav">
        <Navbar />
      </RevealBlock>
      <main className="flex-1">
        <RevealBlock delay={160}>
          <HeroBanner />
        </RevealBlock>
        <RevealBlock delay={250}>
          <QuickActions />
        </RevealBlock>
        <RevealBlock delay={340}>
          <AppCards />
        </RevealBlock>
        <RevealBlock delay={430}>
          <InfoSection />
        </RevealBlock>
      </main>
      <RevealBlock delay={500}>
        <Footer />
      </RevealBlock>
      <PopupAnnouncement />
    </div>
  )
}
