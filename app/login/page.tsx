"use client"

import { LoginForm } from "@/components/piindung/login-form"
import { PromoPanel } from "@/components/piindung/promo-panel"
import { LoginTransitionScreen } from "@/components/piindung/login-transition-screen"
import { useState } from "react"

export default function LoginPage() {
  const [isTransitioning, setIsTransitioning] = useState(false)

  return (
    <>
      {isTransitioning && <LoginTransitionScreen />}
      <main className="min-h-screen flex">
        {/* Left Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-white">
          <LoginForm onTransitionStart={() => setIsTransitioning(true)} />
        </div>

        {/* Right Side - Promotional Panel */}
        <div className="hidden lg:block lg:w-1/2">
          <PromoPanel />
        </div>
      </main>
    </>
  )
}
