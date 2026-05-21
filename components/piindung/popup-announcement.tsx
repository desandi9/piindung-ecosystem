"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { X } from "lucide-react"
import { BaseCenteredModal } from "@/components/piindung/base-centered-modal"
import { ModalFooter } from "@/components/piindung/modal-footer"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { useIsMobile } from "@/hooks/use-mobile"
import { useLockBodyScroll } from "@/hooks/use-lock-body-scroll"
import { getActivePopup, usePopupAnnouncements } from "@/lib/popup-announcements"
import { cn } from "@/lib/utils"

function popupSessionStorageKey(id: string) {
  return `piindung-popup-session-dismissed:${id}`
}

function popupDailyStorageKey(id: string) {
  return `piindung-popup-daily-dismissed:${id}`
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

export function PopupAnnouncement() {
  const popups = usePopupAnnouncements()
  const activePopup = getActivePopup(popups)
  const isMobile = useIsMobile()
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [rememberToday, setRememberToday] = useState(false)
  const [mounted, setMounted] = useState(false)

  useLockBodyScroll(isOpen && isMobile)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    setIsOpen(false)
    setRememberToday(false)
  }, [activePopup?.id])

  useEffect(() => {
    if (!activePopup) return

    const dismissedForSession = window.sessionStorage.getItem(popupSessionStorageKey(activePopup.id)) === "1"
    const dismissedForToday = window.localStorage.getItem(popupDailyStorageKey(activePopup.id)) === todayKey()

    if (dismissedForSession || dismissedForToday) return

    const timeout = window.setTimeout(() => {
      setIsOpen(true)
    }, 4000)

    return () => window.clearTimeout(timeout)
  }, [activePopup])

  function dismissPopup() {
    if (!activePopup) return

    window.sessionStorage.setItem(popupSessionStorageKey(activePopup.id), "1")
    if (rememberToday) {
      window.localStorage.setItem(popupDailyStorageKey(activePopup.id), todayKey())
    }
    setIsOpen(false)
  }

  if (!activePopup || !isOpen || !mounted) return null

  const content = (
    <>
      {activePopup.image ? (
        <div className="relative aspect-[16/9] overflow-hidden bg-muted">
          <Image src={activePopup.image} alt={activePopup.title} fill sizes="(max-width: 640px) 100vw, 540px" className="object-cover" priority unoptimized />
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent" />
        </div>
      ) : null}

      <button
        ref={closeButtonRef}
        type="button"
        onClick={dismissPopup}
        className="absolute right-5 top-5 rounded-2xl border border-white/10 bg-zinc-900/92 p-2 text-zinc-400 shadow-sm backdrop-blur-[2px] transition-colors hover:bg-zinc-800 hover:text-white"
        aria-label="Close popup"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="bg-zinc-950/95 p-5 text-zinc-50 lg:p-6">
        <div className="mb-3 inline-flex rounded-full bg-[#2e8b57]/10 px-3 py-1 text-xs font-medium text-[#2e8b57]">Pengumuman</div>
        <h2 className="text-lg font-semibold text-white lg:text-xl">{activePopup.title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">{activePopup.message}</p>

        <div className="modal-card mt-5 flex items-start gap-3 rounded-2xl p-3">
          <Checkbox
            id={`popup-remember-${activePopup.id}`}
            checked={rememberToday}
            onCheckedChange={(checked) => setRememberToday(Boolean(checked))}
            className="mt-0.5 data-[state=checked]:bg-[#2e8b57] data-[state=checked]:border-[#2e8b57]"
          />
          <label htmlFor={`popup-remember-${activePopup.id}`} className="cursor-pointer text-sm text-zinc-400">
            Jangan tampilkan lagi hari ini
          </label>
        </div>

        <ModalFooter className="mt-5 flex flex-col gap-3 sm:flex-row border-t-0 bg-transparent p-0">
          {activePopup.buttonText && activePopup.buttonLink ? (
            <Button asChild className="w-full rounded-xl bg-[#2e8b57] hover:bg-[#236b43]">
              <Link href={activePopup.buttonLink} onClick={dismissPopup}>{activePopup.buttonText}</Link>
            </Button>
          ) : null}
          <Button type="button" variant="outline" className="w-full rounded-xl" onClick={dismissPopup}>
            Tutup
          </Button>
        </ModalFooter>
      </div>
    </>
  )

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={(open) => { if (!open) dismissPopup() }}>
        <DrawerContent overlayClassName="bg-black/50 backdrop-blur-[1px]" className="rounded-t-[28px] border-t border-white/10 bg-zinc-950/95 px-0 pb-2 text-zinc-50 supports-[backdrop-filter]:bg-zinc-950/92">
          <DrawerHeader className="sr-only">
            <DrawerTitle>{activePopup.title}</DrawerTitle>
            <DrawerDescription>{activePopup.message}</DrawerDescription>
          </DrawerHeader>
          <div className={cn("relative overflow-hidden rounded-t-[28px] bg-zinc-950/95", "animate-in slide-in-from-bottom-6 fade-in-0 duration-500") }>
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  return mounted ? (
      <BaseCenteredModal
      open={isOpen}
      onClose={dismissPopup}
      labelledBy="popup-announcement-title"
      initialFocusRef={closeButtonRef}
      widthClassName="max-w-xl"
      panelClassName="popup-floating-card pointer-events-auto relative"
      wrapperClassName="pointer-events-none"
      overlayClassName="bg-black/50 backdrop-blur-[1px]"
      zIndexClassName="z-[99998]"
      closeOnOverlayClick={false}
    >
      {content}
    </BaseCenteredModal>
  ) : null
}
