"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { SimpleFooter } from "@/components/piindung/simple-footer"
import { Navbar } from "@/components/piindung/navbar"
import { RekeningDonationContent } from "@/components/piindung/rekening-donation-content"

export default function RekeningDonasiPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="container mx-auto flex-1 px-4 lg:px-8 py-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke Beranda
        </Link>

        <div className="mb-6">
          <h1 className="text-xl lg:text-2xl font-semibold text-foreground">
            Rekening Donasi
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pilih rekening resmi NU Care-LAZISNU PCNU Kabupaten Garut
          </p>
        </div>

        <RekeningDonationContent />
      </main>
      <SimpleFooter />
    </div>
  )
}
