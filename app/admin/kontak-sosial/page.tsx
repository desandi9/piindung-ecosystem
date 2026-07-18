"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard"

export default function KontakRetiredPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace("/member-area/konten/kontak")
  }, [router])

  return (
    <DashboardLayout>
      <div className="flex h-[400px] items-center justify-center text-sm text-muted-foreground">
        Mengalihkan ke Kontak & Footer Member Area...
      </div>
    </DashboardLayout>
  )
}
