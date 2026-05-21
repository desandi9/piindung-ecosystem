"use client"

import Link from "next/link"
import Image from "next/image"
import { useMemo, useRef, useState } from "react"
import { ArrowRight, Sparkles } from "lucide-react"
import { BaseCenteredModal } from "@/components/piindung/base-centered-modal"
import { ModalHeader } from "@/components/piindung/modal-header"
import { ModalFooter } from "@/components/piindung/modal-footer"
import { useIntegratedApps, type IntegratedApp } from "@/lib/integrated-apps"
import { cn } from "@/lib/utils"

const READY_MODULES = new Set<IntegratedApp["id"]>(["gorut"])

function getTags(appId: IntegratedApp["id"]) {
  if (appId === "etasyaruf") {
    return [
      { label: "Transparan", color: "text-[#2e8b57]" },
      { label: "Amanah", color: "text-amber-500 dark:text-amber-400" },
      { label: "Tepat Sasaran", color: "text-red-500 dark:text-red-400" },
    ]
  }

  if (appId === "mobisnu") {
    return [
      { label: "Gratis", color: "text-[#2e8b57]" },
      { label: "Cepat", color: "text-[#2e8b57]" },
      { label: "Peduli", color: "text-[#2e8b57]" },
    ]
  }

  if (appId === "arsip") {
    return [
      { label: "Tersimpan", color: "text-foreground" },
      { label: "Aman", color: "text-[#2e8b57]" },
      { label: "Peduli", color: "text-red-500 dark:text-red-400" },
    ]
  }

  return []
}

export function AppCards() {
  const appCards = useIntegratedApps().filter((app) => app.enabled)
  const [pendingModule, setPendingModule] = useState<IntegratedApp | null>(null)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const pendingCopy = useMemo(() => {
    if (!pendingModule) return null

    if (pendingModule.id === "etasyaruf") {
      return {
        title: "E-Tasyaruf Segera Hadir",
        description: "Modul pendataan dan pentasyarufan sedang disiapkan untuk integrasi penuh di dalam ekosistem PIINDUNG.",
      }
    }

    if (pendingModule.id === "mobisnu") {
      return {
        title: "Mobisnu Segera Hadir",
        description: "Layanan Mobil Kesehatan NU sedang dipersiapkan agar bisa dibuka langsung dari dashboard PIINDUNG.",
      }
    }

    return {
      title: "Arsip Segera Hadir",
      description: "Modul arsip digital lembaga sedang dirapikan agar siap dipakai langsung dari launcher PIINDUNG.",
    }
  }, [pendingModule])

  return (
    <>
      <div className="container mx-auto px-4 lg:px-8 py-4">
        <div className="grid md:grid-cols-2 gap-4 lg:gap-6">
          {appCards.map((card) => (
            <AppCard
              key={card.id}
              id={card.id}
              iconUrl={card.iconUrl}
              title={card.name}
              subtitle={card.description}
              tags={getTags(card.id)}
              href={card.link}
              onPendingClick={() => setPendingModule(card)}
            />
          ))}
        </div>
      </div>

      <BaseCenteredModal
        open={Boolean(pendingModule && pendingCopy)}
        onClose={() => setPendingModule(null)}
        labelledBy="module-pending-title"
        initialFocusRef={closeButtonRef}
        widthClassName="max-w-lg"
        zIndexClassName="z-[9998]"
      >
        {pendingModule && pendingCopy ? (
          <>
            <ModalHeader
              titleId="module-pending-title"
              title={pendingCopy.title}
              description={pendingCopy.description}
              onClose={() => setPendingModule(null)}
              closeButtonRef={closeButtonRef}
              icon={<div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-500/10 shadow-[0_0_24px_rgba(46,139,87,0.16)]"><Sparkles className="h-7 w-7 text-emerald-300" /></div>}
            />
            <div className="px-6 py-5 text-sm text-zinc-400">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                Modul <span className="font-semibold text-zinc-100">{pendingModule.name}</span> tetap tampil di launcher, namun akses langsungnya sementara belum dibuka karena integrasi final masih dalam proses penyelesaian.
              </div>
            </div>
            <ModalFooter>
              <button
                type="button"
                onClick={() => setPendingModule(null)}
                className="inline-flex w-full items-center justify-center rounded-xl bg-[#2e8b57] px-4 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-[#236b43] hover:shadow-[0_16px_36px_rgba(46,139,87,0.26)]"
              >
                Mengerti
              </button>
            </ModalFooter>
          </>
        ) : null}
      </BaseCenteredModal>
    </>
  )
}

function AppCard({
  id,
  iconUrl,
  title,
  titleSmall,
  subtitle,
  tags,
  href,
  onPendingClick,
}: {
  id: IntegratedApp["id"]
  iconUrl: string
  title: string
  titleSmall?: string
  subtitle?: string
  tags: { label: string; color: string }[]
  href: string
  onPendingClick: () => void
}) {
  if (!READY_MODULES.has(id)) {
    return (
      <button
        type="button"
        onClick={onPendingClick}
        className={cn(
          "group relative flex w-full items-start gap-4 p-5 text-left lg:p-6",
          "bg-card rounded-2xl border-2 border-[#2e8b57]/20",
          "transition-all duration-300 ease-out cursor-pointer",
          "hover:border-[#2e8b57]/40 hover:-translate-y-1",
          "hover:shadow-xl hover:shadow-[#2e8b57]/10"
        )}
      >
        <div className="shrink-0 w-16 h-16 lg:w-20 lg:h-20 rounded-2xl overflow-hidden transition-transform duration-300 ease-out group-hover:scale-105">
          <Image src={iconUrl} alt={title} width={80} height={80} className="w-full h-full object-cover" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm lg:text-base font-semibold text-foreground leading-tight mb-1">{title}</h3>
          {titleSmall ? <p className="mb-1 text-xs text-muted-foreground">{titleSmall}</p> : null}
          {subtitle ? <p className="mb-2 line-clamp-2 text-xs lg:text-sm text-muted-foreground">{subtitle}</p> : null}
          {tags.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag.label} className={cn("inline-flex items-center gap-1 text-xs font-medium", tag.color)}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {tag.label}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="shrink-0 w-10 h-10 rounded-full bg-[#2e8b57] flex items-center justify-center transition-all duration-300 ease-out group-hover:bg-[#257a4a] group-hover:shadow-lg group-hover:shadow-[#2e8b57]/30 self-center">
          <ArrowRight className="h-5 w-5 text-white transition-transform duration-300 ease-out group-hover:translate-x-0.5" />
        </div>
      </button>
    )
  }

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-start gap-4 p-5 lg:p-6",
        "bg-card rounded-2xl border-2 border-[#2e8b57]/20",
        "transition-all duration-300 ease-out cursor-pointer",
        "hover:border-[#2e8b57]/40 hover:-translate-y-1",
        "hover:shadow-xl hover:shadow-[#2e8b57]/10"
      )}
    >
      {/* Icon */}
      <div className="shrink-0 w-16 h-16 lg:w-20 lg:h-20 rounded-2xl overflow-hidden transition-transform duration-300 ease-out group-hover:scale-105">
        <Image
          src={iconUrl}
          alt={title}
          width={80}
          height={80}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm lg:text-base font-semibold text-foreground leading-tight mb-1">
          {title}
        </h3>
        {titleSmall && (
          <p className="text-xs text-muted-foreground mb-1">
            {titleSmall}
          </p>
        )}
        {subtitle && (
          <p className="text-xs lg:text-sm text-muted-foreground mb-2 line-clamp-2">
            {subtitle}
          </p>
        )}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map((tag) => (
              <span 
                key={tag.label} 
                className={cn(
                  "inline-flex items-center gap-1 text-xs font-medium",
                  tag.color
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {tag.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Arrow */}
      <div className="shrink-0 w-10 h-10 rounded-full bg-[#2e8b57] flex items-center justify-center transition-all duration-300 ease-out group-hover:bg-[#257a4a] group-hover:shadow-lg group-hover:shadow-[#2e8b57]/30 self-center">
        <ArrowRight className="h-5 w-5 text-white transition-transform duration-300 ease-out group-hover:translate-x-0.5" />
      </div>
    </Link>
  )
}
