"use client"

import Image from "next/image"
import { MessageCircleHeart, Quote } from "lucide-react"
import { motion, useAnimationControls, useReducedMotion } from "motion/react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { LandingCard, LandingReveal } from "@/components/piindung/landing-motion"
import type { ImpactTestimonialItem, ImpactTestimonialSection } from "@/lib/impact-content"

function TestimonialCard({
  testimonial,
  index,
  hovered,
  isHovered,
}: {
  testimonial: ImpactTestimonialItem
  index: number
  hovered: boolean
  isHovered: boolean
}) {
  return (
    <LandingCard
      as="article"
      revealIndex={index}
      revealColumns={3}
      className={[
        "flex h-full min-h-[250px] w-[min(84vw,360px)] shrink-0 snap-center flex-col rounded-[20px] border border-[#d9e5df] bg-[#f7faf8] p-6 shadow-[0_10px_28px_rgba(9,43,32,.05)] dark:border-white/10 dark:bg-white/[.035]",
        "transition-[transform,opacity,box-shadow,border-color] duration-300 ease-[cubic-bezier(.22,1,.36,1)]",
        hovered && !isHovered ? "opacity-50" : "",
        isHovered
          ? "-translate-y-1 scale-[1.018] border-[#07965d]/30 shadow-[0_14px_36px_rgba(7,150,93,.12)] dark:border-emerald-400/25 dark:shadow-[0_14px_36px_rgba(7,150,93,.08)]"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Quote className="h-6 w-6 text-[#07965d]/70" aria-hidden="true" />
      <p className="mt-4 text-sm leading-7 text-[#08213b] dark:text-slate-200">
        &ldquo;{testimonial.quote}&rdquo;
      </p>
      <div className="mt-auto flex items-center gap-3 pt-5">
        {testimonial.avatar && (
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border bg-muted">
            <Image
              src={testimonial.avatar.path}
              alt={testimonial.name}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-[#08213b] dark:text-white">{testimonial.name}</p>
          <p className="text-xs text-[#87948c] dark:text-slate-400">{testimonial.role}</p>
          <div
            className="mt-1 flex gap-0.5 text-[10px] text-amber-500"
            aria-label={`Rating ${testimonial.rating} dari 5`}
          >
            {Array.from({ length: testimonial.rating }).map((_, i) => (
              <span key={i} aria-hidden="true">
                ★
              </span>
            ))}
          </div>
        </div>
      </div>
    </LandingCard>
  )
}

export function ImpactTestimonials({ content }: { content?: ImpactTestimonialSection }) {
  const eyebrow = content?.eyebrow || "Apa Kata Mereka?"
  const title = content?.title || "Suara pengurus dan mitra layanan"
  const description = content?.description || ""
  const items = useMemo(
    () =>
      [...(content?.items ?? [])]
        .filter((item) => item.visible)
        .sort((a, b) => a.position - b.position)
        .slice(0, 6),
    [content?.items],
  )
  const reduced = useReducedMotion()
  const hasTestimonials = items.length > 0
  const many = items.length > 1

  const controls = useAnimationControls()
  const containerRef = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const anyHovered = hoveredIdx !== null

  const trackWidth = items.length * 380
  const animDuration = Math.min(40, Math.max(25, items.length * 5))

  const startAnimation = useCallback(() => {
    if (!many || reduced) return
    controls.start({
      x: -trackWidth,
      transition: { duration: animDuration, ease: "linear", repeat: Infinity, repeatType: "loop" },
    })
  }, [controls, many, reduced, trackWidth, animDuration])

  useEffect(() => {
    if (reduced || !many) return
    startAnimation()
  }, [startAnimation, reduced, many])

  const pause = useCallback(() => {
    if (!many || reduced) return
    setPaused(true)
    controls.stop()
  }, [controls, many, reduced])

  const resume = useCallback(() => {
    if (!many || reduced) return
    setPaused(false)
    startAnimation()
  }, [many, reduced, startAnimation])

  const handleCardEnter = useCallback((idx: number) => {
    setHoveredIdx(idx)
  }, [])

  const handleCardLeave = useCallback(() => {
    setHoveredIdx(null)
  }, [])

  const handleContainerFocus = useCallback(() => {
    pause()
  }, [pause])

  const handleContainerBlur = useCallback(
    (e: React.FocusEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.relatedTarget)) {
        setHoveredIdx(null)
        resume()
      }
    },
    [resume],
  )

  const duplicated = useMemo(() => [...items, ...(many ? items : [])], [items, many])

  return (
    <section
      className="scroll-mt-[calc(72px+1rem)] bg-white px-5 py-20 dark:bg-[#07131f] sm:px-8 sm:py-24 lg:scroll-mt-[calc(78px+1rem)]"
      aria-labelledby="impact-testimonials-heading"
    >
      <div className="mx-auto max-w-[1180px]">
        <LandingReveal className="mx-auto max-w-[680px] text-center">
          <p className="text-[10px] font-bold uppercase tracking-[.22em] text-[#07965d]">
            {eyebrow}
          </p>
          <h2
            id="impact-testimonials-heading"
            className="mt-4 text-[clamp(1.9rem,3.4vw,2.75rem)] font-bold leading-tight tracking-[-.045em] text-[#08213b] dark:text-white"
          >
            {title}
          </h2>
          {description && (
            <p className="mx-auto mt-4 max-w-[560px] text-[15px] leading-7 text-[#6c7a89] dark:text-slate-300">
              {description}
            </p>
          )}
        </LandingReveal>
        {hasTestimonials ? (
          <div
            ref={containerRef}
            className={`relative mt-12 overflow-x-clip overflow-y-visible ${many ? "" : "flex justify-center"}`}
            onMouseEnter={many ? pause : undefined}
            onMouseLeave={many ? resume : undefined}
            onFocus={many ? handleContainerFocus : undefined}
            onBlur={many ? handleContainerBlur : undefined}
            role="region"
            aria-roledescription="carousel"
            aria-label="Testimoni"
          >
            {many && (
              <>
                <div
                  className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 sm:w-24"
                  style={{
                    background:
                      "linear-gradient(to right, var(--edge-fade-bg, #fff) 0%, transparent 100%)",
                  }}
                  aria-hidden="true"
                />
                <div
                  className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 sm:w-24"
                  style={{
                    background:
                      "linear-gradient(to left, var(--edge-fade-bg, #fff) 0%, transparent 100%)",
                  }}
                  aria-hidden="true"
                />
                <style>{`
                  :root { --edge-fade-bg: #fff; }
                  .dark { --edge-fade-bg: #07131f; }
                `}</style>
              </>
            )}
            <motion.div
              className={`flex w-max gap-5 py-4 ${many ? "" : "w-auto"}`}
              initial={many && !reduced ? { x: 0 } : undefined}
              animate={controls}
              drag={many ? "x" : false}
              dragConstraints={{ left: -trackWidth, right: 0 }}
              onDragStart={pause}
              onDragEnd={resume}
              aria-live={paused ? "polite" : "off"}
            >
              {duplicated.map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  tabIndex={index < items.length ? 0 : -1}
                  onMouseEnter={() => handleCardEnter(index)}
                  onMouseLeave={handleCardLeave}
                  onFocus={() => handleCardEnter(index)}
                  onBlur={handleCardLeave}
                  className="outline-none focus-visible:ring-2 focus-visible:ring-[#07965d]/40 focus-visible:ring-offset-4 dark:focus-visible:ring-offset-[#07131f]"
                >
                  <TestimonialCard
                    testimonial={item}
                    index={index}
                    hovered={anyHovered}
                    isHovered={hoveredIdx === index}
                  />
                </div>
              ))}
            </motion.div>
          </div>
        ) : (
          <LandingReveal className="mx-auto mt-12 max-w-[560px] rounded-[22px] border border-dashed border-[#d9e5df] bg-[#f7faf8] p-10 text-center dark:border-white/15 dark:bg-white/[.03]">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#e6f7ef] text-[#07965d] dark:bg-emerald-400/10 dark:text-emerald-300">
              <MessageCircleHeart className="h-6 w-6" aria-hidden="true" />
            </span>
            <p className="mt-5 text-base font-semibold text-[#08213b] dark:text-white">
              Testimoni resmi sedang dihimpun
            </p>
            <p className="mx-auto mt-2 max-w-[420px] text-sm leading-6 text-[#6c7a89] dark:text-slate-300">
              Bagian ini akan menampilkan kutipan dari pengurus dan mitra layanan setelah testimoni
              resmi tersedia dan diverifikasi.
            </p>
          </LandingReveal>
        )}
      </div>
    </section>
  )
}
