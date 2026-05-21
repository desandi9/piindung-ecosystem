'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface DashboardAmbientBackgroundProps {
  active?: boolean
}

export function DashboardAmbientBackground({ active = false }: DashboardAmbientBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!active) return

    const glowElement = glowRef.current
    if (!glowElement) return

    let animationFrame = 0
    let currentX = window.innerWidth * 0.58
    let currentY = window.innerHeight * 0.2
    let targetX = currentX
    let targetY = currentY

    const animate = () => {
      currentX += (targetX - currentX) * 0.08
      currentY += (targetY - currentY) * 0.08
      glowElement.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`
      animationFrame = window.requestAnimationFrame(animate)
    }

    const handlePointerMove = (event: PointerEvent) => {
      targetX = event.clientX
      targetY = event.clientY
    }

    animationFrame = window.requestAnimationFrame(animate)
    window.addEventListener('pointermove', handlePointerMove, { passive: true })

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.cancelAnimationFrame(animationFrame)
    }
  }, [active])

  return (
    <div ref={containerRef} className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.08),transparent_32%),linear-gradient(180deg,rgba(2,6,23,0.18),transparent_24%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_24%,rgba(16,185,129,0.06),transparent_22%),radial-gradient(circle_at_82%_18%,rgba(34,197,94,0.05),transparent_18%)]" />
      <div
        ref={glowRef}
        className={cn(
          'absolute left-0 top-0 h-[28rem] w-[28rem] rounded-full bg-emerald-400/[0.07] blur-[120px] transition-opacity duration-700 ease-out',
          active ? 'opacity-100' : 'opacity-0'
        )}
        style={{ transform: 'translate3d(58vw, 20vh, 0) translate(-50%, -50%)' }}
      />
    </div>
  )
}
