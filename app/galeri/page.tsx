"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowLeft,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MapPin,
  X,
} from "lucide-react"
import { SimpleFooter } from "@/components/piindung/simple-footer"
import { Navbar } from "@/components/piindung/navbar"
import { getGalleryImages, useGalleryItems, type GalleryItem } from "@/lib/gallery-content"
import { cn } from "@/lib/utils"

export default function GaleriPage() {
  const galleryItems = useGalleryItems()
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)

  function openGalleryItem(item: GalleryItem) {
    setSelectedImage(item)
    setSelectedIndex(0)
  }

  const selectedImages = selectedImage ? getGalleryImages(selectedImage) : []

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
            Galeri Kegiatan
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Dokumentasi kegiatan NU Care-LAZISNU PCNU Kabupaten Garut
          </p>
        </div>

        <div className="grid gap-3 lg:gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {galleryItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => openGalleryItem(item)}
              className={cn(
                "group overflow-hidden bg-card rounded-xl border border-border text-left",
                "hover:border-[#2e8b57]/30 hover:shadow-md transition-all duration-300"
              )}
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  unoptimized
                />
                <div className="absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                  {getGalleryImages(item).length} foto
                </div>
              </div>
              <div className="p-4 lg:p-5">
                <h3 className="text-sm font-semibold text-foreground mb-1">{item.title}</h3>
                <p className="mb-2 text-xs text-muted-foreground line-clamp-2">{item.caption}</p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <CalendarDays className="h-3.5 w-3.5 text-[#2e8b57]" />
                    {item.date}
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-[#2e8b57]" />
                    {item.location}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </main>
      <SimpleFooter />

      {selectedImage && (
        <>
          <div
            className="fixed inset-0 z-[9998] bg-black/65 backdrop-blur-[2px] transition-opacity duration-300"
            onClick={() => setSelectedImage(null)}
            aria-hidden="true"
          />
          <div className="fixed inset-x-4 top-1/2 z-[9999] -translate-y-1/2 sm:left-1/2 sm:right-auto sm:w-full sm:max-w-4xl sm:-translate-x-1/2">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
              <div className="relative aspect-[4/5] bg-muted sm:max-h-[80vh]">
                <Image
                  src={selectedImages[selectedIndex] ?? selectedImage.image}
                  alt={selectedImage.title}
                  fill
                  sizes="100vw"
                  className="object-contain bg-black"
                  priority
                  unoptimized
                />
                {selectedImages.length > 1 ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setSelectedIndex((current) => (current - 1 + selectedImages.length) % selectedImages.length)}
                      className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70"
                      aria-label="Foto sebelumnya"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedIndex((current) => (current + 1) % selectedImages.length)}
                      className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm hover:bg-black/70"
                      aria-label="Foto berikutnya"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/45 px-3 py-1.5 backdrop-blur-sm">
                      {selectedImages.map((_, index) => (
                        <span key={`${selectedImage.id}-${index}`} className={cn("h-2 w-2 rounded-full", index === selectedIndex ? "bg-white" : "bg-white/40")} />
                      ))}
                    </div>
                  </>
                ) : null}
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="absolute right-4 top-4 rounded-xl bg-card/90 p-2 text-muted-foreground backdrop-blur-sm hover:bg-card hover:text-foreground"
                  aria-label="Close preview"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-4 lg:p-5">
                <h2 className="text-base font-semibold text-foreground">{selectedImage.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedImage.date} - {selectedImage.location}
                </p>
                <p className="text-sm text-muted-foreground mt-2">{selectedImage.caption}</p>
                {selectedImage.instagramUrl ? (
                  <a
                    href={selectedImage.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#2e8b57] px-4 py-3 text-sm font-medium text-white hover:bg-[#236b43] hover:shadow-lg hover:shadow-[#2e8b57]/20"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Buka Sumber Instagram
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
