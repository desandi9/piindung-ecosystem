"use client"

import { useEffect, useRef, type ReactNode, type RefObject } from "react"
import { createPortal } from "react-dom"
import { useLockBodyScroll } from "@/hooks/use-lock-body-scroll"
import { cn } from "@/lib/utils"

interface BaseCenteredModalProps {
  open: boolean
  onClose: () => void
  labelledBy: string
  children: ReactNode
  initialFocusRef?: RefObject<HTMLElement | null>
  widthClassName?: string
  panelClassName?: string
  wrapperClassName?: string
  overlayClassName?: string
  zIndexClassName?: string
  closeOnOverlayClick?: boolean
}

function getPanelZIndexClass(zIndexClassName: string) {
  const match = zIndexClassName.match(/^z-\[(\d+)\]$/)
  if (!match) return 12001

  const zIndex = Number.parseInt(match[1], 10)
  if (Number.isNaN(zIndex)) return 12001

  return zIndex + 1
}

export function BaseCenteredModal({
  open,
  onClose,
  labelledBy,
  children,
  initialFocusRef,
  widthClassName,
  panelClassName,
  wrapperClassName,
  overlayClassName,
  zIndexClassName = "z-[12000]",
  closeOnOverlayClick = true,
}: BaseCenteredModalProps) {
  useLockBodyScroll(open)
  const panelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return

    const panel = panelRef.current
    const previousActiveElement = document.activeElement instanceof HTMLElement ? document.activeElement : null

    function getFocusableElements() {
      if (!panel) return [] as HTMLElement[]

      return Array.from(
        panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true")
    }

    const focusableElements = getFocusableElements()
    const initialFocusTarget = initialFocusRef?.current ?? focusableElements[0] ?? panel
    initialFocusTarget?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose()
        return
      }

      if (event.key !== "Tab") return

      const currentFocusableElements = getFocusableElements()
      if (currentFocusableElements.length === 0) {
        event.preventDefault()
        panel?.focus()
        return
      }

      const firstElement = currentFocusableElements[0]
      const lastElement = currentFocusableElements[currentFocusableElements.length - 1]
      const activeElement = document.activeElement

      if (event.shiftKey) {
        if (activeElement === firstElement || activeElement === panel) {
          event.preventDefault()
          lastElement.focus()
        }
        return
      }

      if (activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      previousActiveElement?.focus()
    }
  }, [initialFocusRef, open, onClose])

  if (!open || typeof document === "undefined") return null

  return createPortal(
    <>
      <div
        className={cn(
          "fixed inset-0 bg-black/65 backdrop-blur-[2px] animate-in fade-in-0 duration-300",
          zIndexClassName,
          overlayClassName,
        )}
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        className={cn(
          "fixed inset-0 flex items-center justify-center p-3 sm:p-5 lg:p-6 animate-in fade-in-0 duration-300",
          wrapperClassName,
        )}
        style={{ zIndex: getPanelZIndexClass(zIndexClassName) }}
        onClick={closeOnOverlayClick ? onClose : undefined}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
      >
        <div
          ref={panelRef}
          className={cn(
            "modal-surface animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 w-full overflow-hidden rounded-[24px] sm:rounded-[28px] border border-white/10 bg-zinc-950/95 text-zinc-50 duration-300 supports-[backdrop-filter]:bg-zinc-950/92",
            widthClassName,
            panelClassName,
          )}
          onClick={(event) => event.stopPropagation()}
          tabIndex={-1}
        >
          {children}
        </div>
      </div>
    </>,
    document.body,
  )
}
