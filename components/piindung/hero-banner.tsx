"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import NextImage from "next/image"
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useHomepageContent } from "@/lib/homepage-content"
import { cn } from "@/lib/utils"

const SLIDE_INTERVAL_MS = 5000

export function HeroBanner() {
  const bannerSlides = useHomepageContent().filter((item) => item.type === "Banner" && item.status === "Published")
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Clamp slide index when slide count changes
  useEffect(() => {
    setCurrentSlide((current) => Math.min(current, Math.max(bannerSlides.length - 1, 0)))
  }, [bannerSlides.length])

  const nextSlide = useCallback(() => {
    if (bannerSlides.length === 0) return
    setCurrentSlide((prev) => (prev + 1) % bannerSlides.length)
  }, [bannerSlides.length])

  const prevSlide = useCallback(() => {
    if (bannerSlides.length === 0) return
    setCurrentSlide((prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length)
  }, [bannerSlides.length])

  // Auto-advance
  useEffect(() => {
    if (bannerSlides.length <= 1 || isPaused) return
    intervalRef.current = setInterval(nextSlide, SLIDE_INTERVAL_MS)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [bannerSlides.length, isPaused, nextSlide])

  // Keyboard navigation
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowLeft") prevSlide()
      if (e.key === "ArrowRight") nextSlide()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [nextSlide, prevSlide])

  const slide = bannerSlides[currentSlide]
  if (!slide) return null

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <div
        className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#0f3460] to-[#16213e]"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        aria-roledescription="carousel"
        aria-label="Banner utama"
      >
        {/* Background Image — cross-fade via key */}
        <div key={slide.id} className="absolute inset-0 animate-in fade-in duration-700">
          <NextImage
            src={slide.image}
            alt=""
            fill
            priority
            className="object-cover opacity-25"
            sizes="100vw"
          />
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f3460]/95 via-[#0f3460]/75 to-transparent pointer-events-none" />

        {/* Content */}
        <div
          className="relative z-10 flex items-center min-h-[280px] md:min-h-[360px] lg:min-h-[380px] px-6 sm:px-10 lg:px-16 py-12"
          aria-live="polite"
          aria-atomic="true"
        >
          {/* Prev Button */}
          {bannerSlides.length > 1 && (
            <button
              onClick={prevSlide}
              className={cn(
                "absolute left-3 sm:left-4 top-1/2 -translate-y-1/2",
                "w-9 h-9 sm:w-10 sm:h-10 rounded-full",
                "bg-white/10 hover:bg-white/25 active:bg-white/30",
                "flex items-center justify-center text-white",
                "transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              )}
              aria-label="Slide sebelumnya"
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          )}

          {/* Text Content */}
          <div className="max-w-2xl pl-6 sm:pl-0">
            <span className="inline-flex items-center px-3 py-1 text-xs font-semibold bg-[#2e8b57] text-white rounded-full mb-4 tracking-wide">
              {slide.type === "Banner" ? "BERITA TERKINI" : slide.type.toUpperCase()}
            </span>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white leading-tight mb-3 text-balance">
              {slide.title}
            </h2>

            <p className="text-white/75 text-sm lg:text-base leading-relaxed mb-6 max-w-xl line-clamp-3">
              {slide.description || slide.subtitle}
            </p>

            <Button
              asChild
              className={cn(
                "group bg-[#2e8b57] hover:bg-[#257a4a] text-white rounded-full",
                "px-6 h-11 font-medium",
                "transition-all duration-300",
                "hover:shadow-lg hover:shadow-[#2e8b57]/30 hover:-translate-y-0.5",
                "focus-visible:ring-2 focus-visible:ring-white/60"
              )}
            >
              <Link href={slide.link || "/dashboard"}>
                {slide.buttonText}
                <ArrowRight className="h-4 w-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>

          {/* Next Button */}
          {bannerSlides.length > 1 && (
            <button
              onClick={nextSlide}
              className={cn(
                "absolute right-3 sm:right-4 top-1/2 -translate-y-1/2",
                "w-9 h-9 sm:w-10 sm:h-10 rounded-full",
                "bg-white/10 hover:bg-white/25 active:bg-white/30",
                "flex items-center justify-center text-white",
                "transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              )}
              aria-label="Slide berikutnya"
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
          )}
        </div>

        {/* Dots Indicator */}
        {bannerSlides.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5" role="tablist" aria-label="Slide navigator">
            {bannerSlides.map((banner, index) => (
              <button
                key={banner.id}
                role="tab"
                aria-selected={index === currentSlide}
                onClick={() => setCurrentSlide(index)}
                aria-label={`Slide ${index + 1} dari ${bannerSlides.length}`}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  index === currentSlide
                    ? "bg-white w-6"
                    : "bg-white/40 hover:bg-white/70 w-2"
                )}
              />
            ))}
          </div>
        )}

        {/* Auto-advance progress bar */}
        {bannerSlides.length > 1 && !isPaused && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 overflow-hidden pointer-events-none">
            <div
              key={`progress-${currentSlide}`}
              className="h-full bg-[#2e8b57]/70 animate-[slideProgress_5s_linear_forwards]"
              style={{ width: "100%" }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
