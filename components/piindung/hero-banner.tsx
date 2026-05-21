"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useHomepageContent } from "@/lib/homepage-content"
import { cn } from "@/lib/utils"

export function HeroBanner() {
  const bannerSlides = useHomepageContent().filter((item) => item.type === "Banner" && item.status === "Published")
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    setCurrentSlide((current) => Math.min(current, Math.max(bannerSlides.length - 1, 0)))
  }, [bannerSlides.length])

  const nextSlide = () => {
    if (bannerSlides.length === 0) return
    setCurrentSlide((prev) => (prev + 1) % bannerSlides.length)
  }

  const prevSlide = () => {
    if (bannerSlides.length === 0) return
    setCurrentSlide((prev) => (prev - 1 + bannerSlides.length) % bannerSlides.length)
  }

  const slide = bannerSlides[currentSlide]

  if (!slide) return null

  return (
    <div className="container mx-auto px-4 lg:px-8 py-6">
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-[#0f3460] to-[#16213e]">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-30 transition-all duration-500"
          style={{ backgroundImage: `url(${slide.image})` }}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f3460]/95 via-[#0f3460]/80 to-transparent" />

        {/* Content */}
        <div className="relative z-10 flex items-center min-h-[280px] lg:min-h-[340px] px-8 lg:px-16 py-12">
          {/* Prev Button */}
          <button 
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          {/* Text Content */}
          <div className="max-w-2xl">
            <span className="inline-block px-3 py-1 text-xs font-semibold bg-[#2e8b57] text-white rounded-full mb-4">
              {slide.type === "Banner" ? "BERITA TERKINI" : slide.type.toUpperCase()}
            </span>
            
            <h2 className="text-2xl lg:text-4xl font-bold text-white leading-tight mb-4 text-balance">
              {slide.title}
            </h2>
            
            <p className="text-white/80 text-sm lg:text-base leading-relaxed mb-6 max-w-xl">
              {slide.description || slide.subtitle}
            </p>
            
            <Button asChild className="bg-[#2e8b57] hover:bg-[#257a4a] text-white rounded-full px-6 h-11 font-medium">
              <Link href={slide.link || "/dashboard"}>
              {slide.buttonText}
              <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>

          {/* Next Button */}
          <button 
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>

        {/* Dots Indicator */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {bannerSlides.map((banner, index) => (
            <button
              key={banner.id}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === currentSlide 
                  ? "bg-white w-6" 
                  : "bg-white/40 hover:bg-white/60"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
