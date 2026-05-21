"use client"

import type { ReactNode, RefObject } from "react"
import { X } from "lucide-react"

interface ModalHeaderProps {
  titleId: string
  title: string
  description?: string
  onClose: () => void
  icon: ReactNode
  meta?: ReactNode
  className?: string
  closeButtonRef?: RefObject<HTMLButtonElement | null>
}

export function ModalHeader({
  titleId,
  title,
  description,
  onClose,
  icon,
  meta,
  className,
  closeButtonRef,
}: ModalHeaderProps) {
  return (
    <div className={className ?? "relative border-b border-white/10 bg-[linear-gradient(135deg,rgba(9,9,11,0.96),rgba(24,24,27,0.98),rgba(4,120,87,0.22))] px-6 py-6"}>
      <button
        type="button"
        ref={closeButtonRef}
        onClick={onClose}
        className="absolute right-4 top-4 rounded-xl p-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
        aria-label="Close"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="flex items-center gap-4 pr-10">
        {icon}
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className="text-lg font-semibold text-white">
            {title}
          </h2>
          {meta ? <div className="mt-0.5">{meta}</div> : null}
        </div>
      </div>

      {description ? <p className="mt-4 text-sm leading-relaxed text-zinc-400">{description}</p> : null}
    </div>
  )
}
