"use client"

import { startTransition, useRef, useState } from "react"
import Link from "next/link"
import NextImage from "next/image"
import { useRouter } from "next/navigation"
import { 
  Sparkles, 
  Archive,
  Newspaper, 
  Image as ImageIcon, 
  Download, 
  Phone,
  ExternalLink,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileText,
  Info,
  MapPin,
  FileArchive,
  FileImage,
  Heart,
  GraduationCap,
  Stethoscope,
  Handshake,
  ArrowRight
  ,X
} from "lucide-react"
import { BaseCenteredModal } from "@/components/piindung/base-centered-modal"
import { ModalFooter } from "@/components/piindung/modal-footer"
import { ModalHeader } from "@/components/piindung/modal-header"
import { cn } from "@/lib/utils"
import { useHomepageContent, type HomepageContentItem } from "@/lib/homepage-content"
import { getGalleryImages, useGalleryItems, type GalleryItem } from "@/lib/gallery-content"
import { categoryLabel, useDownloadItems, type DownloadCategory, type DownloadItem } from "@/lib/download-center"

const infoItems = [
  {
    icon: Sparkles,
    title: "Program Unggulan",
    description: "Lihat program dan kegiatan kami",
    href: "/program",
    action: "program",
    color: "text-[#2e8b57]",
  },
  {
    icon: Newspaper,
    title: "Berita & Artikel",
    description: "Informasi terbaru seputar kegiatan LAZISNU Garut",
    href: "#berita-artikel",
    action: "berita",
    color: "text-[#2e8b57]",
  },
  {
    icon: ImageIcon,
    title: "Galeri Kegiatan",
    description: "Dokumentasi kegiatan dan penyaluran donasi",
    href: "/galeri",
    action: "galeri",
    color: "text-[#2e8b57]",
  },
  {
    icon: Download,
    title: "Download Center",
    description: "Unduh dokumen, laporan, dan materi publikasi",
    href: "/download",
    action: "download",
    color: "text-[#2e8b57]",
  },
  {
    icon: Phone,
    title: "Kontak Kami",
    description: "Hubungi kami untuk informasi lebih lanjut",
    href: "/kontak",
    color: "text-[#2e8b57]",
  },
]

const featuredProgramPreview = [
  {
    icon: Heart,
    title: "NU Care",
    description: "Program sosial dan kemanusiaan untuk masyarakat luas.",
  },
  {
    icon: GraduationCap,
    title: "Pendidikan",
    description: "Beasiswa, pendampingan santri, dan penguatan literasi umat.",
  },
  {
    icon: Stethoscope,
    title: "Kesehatan",
    description: "Layanan kesehatan dan dukungan kesejahteraan keluarga.",
  },
  {
    icon: Handshake,
    title: "UMKM Umat",
    description: "Pemberdayaan ekonomi produktif berbasis komunitas.",
  },
  {
    icon: Sparkles,
    title: "Digitalisasi Layanan",
    description: "Akses donasi dan layanan publik yang lebih cepat dan rapi.",
  },
] as const

export function InfoSection() {
  const router = useRouter()
  const highlightItems = useHomepageContent().filter((item) => item.status === "Published" && item.type !== "Banner")
  const galleryItems = useGalleryItems().slice(0, 6)
  const downloadItems = useDownloadItems().slice(0, 4)
  const [isBeritaOpen, setIsBeritaOpen] = useState(false)
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const [isDownloadOpen, setIsDownloadOpen] = useState(false)
  const [isProgramOpen, setIsProgramOpen] = useState(false)

  const goToProgram = () => {
    startTransition(() => {
      router.push("/program")
    })
  }

  return (
    <>
      <div className="container mx-auto px-4 lg:px-8 py-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          Informasi & Layanan Lainnya
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
          {infoItems.map((item) => (
            <InfoCard
              key={item.title}
              {...item}
               onProgramClick={() => setIsProgramOpen(true)}
              onBeritaClick={() => setIsBeritaOpen(true)}
              onGalleryClick={() => setIsGalleryOpen(true)}
              onDownloadClick={() => setIsDownloadOpen(true)}
            />
          ))}
        </div>
      </div>

      <BeritaArtikelModal
        isOpen={isBeritaOpen}
        onClose={() => setIsBeritaOpen(false)}
        items={highlightItems}
      />
      <ProgramPreviewModal
        isOpen={isProgramOpen}
        onClose={() => setIsProgramOpen(false)}
        onViewMore={() => {
          setIsProgramOpen(false)
          goToProgram()
        }}
      />
      <GalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        items={galleryItems}
      />
      <DownloadCenterModal
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        items={downloadItems}
      />
    </>
  )
}

function ProgramPreviewModal({
  isOpen,
  onClose,
  onViewMore,
}: {
  isOpen: boolean
  onClose: () => void
  onViewMore: () => void
}) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)

  return (
    <BaseCenteredModal open={isOpen} onClose={onClose} labelledBy="program-preview-title" initialFocusRef={closeButtonRef} widthClassName="max-w-[720px]" zIndexClassName="z-[9998]">
      <ModalHeader
        titleId="program-preview-title"
        title="Program Unggulan"
        description="Program unggulan LAZISNU Garut dalam bidang sosial, pendidikan, kesehatan, dan pemberdayaan umat."
        onClose={onClose}
        closeButtonRef={closeButtonRef}
        icon={<div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-500/10 shadow-[0_0_24px_rgba(46,139,87,0.16)]"><Sparkles className="h-7 w-7 text-emerald-300" /></div>}
      />

          <div className="px-6 py-6 sm:px-7">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProgramPreview.map((program, index) => (
                <div
                  key={program.title}
                  className={cn(
                    "modal-card modal-card-hover rounded-2xl p-4",
                    "animate-in fade-in-0 slide-in-from-bottom-2 duration-500"
                  )}
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300 shadow-[0_0_18px_rgba(46,139,87,0.12)]">
                    <program.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-100">{program.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-400">{program.description}</p>
                </div>
              ))}
            </div>

            <ModalFooter className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end border-t-0 bg-transparent p-0">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/10 hover:text-white"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={onViewMore}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2e8b57] px-4 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-[#236b43] hover:shadow-[0_16px_36px_rgba(46,139,87,0.26)]"
              >
                Lihat Selengkapnya
                <ArrowRight className="h-4 w-4" />
              </button>
            </ModalFooter>
          </div>
    </BaseCenteredModal>
  )
}

function InfoCard({
  icon: Icon,
  title,
  description,
  href,
  color,
  action,
  onProgramClick,
  onBeritaClick,
  onGalleryClick,
  onDownloadClick,
}: {
  icon: typeof Sparkles
  title: string
  description: string
  href: string
  color: string
  action?: string
  onProgramClick: () => void
  onBeritaClick: () => void
  onGalleryClick: () => void
  onDownloadClick: () => void
}) {
  if (action === "program" || action === "berita" || action === "galeri" || action === "download") {
    const onClick = action === "program" ? onProgramClick : action === "berita" ? onBeritaClick : action === "galeri" ? onGalleryClick : onDownloadClick

    return (
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex flex-col p-4 lg:p-5 bg-card rounded-xl border border-border text-left",
          "hover:border-[#2e8b57]/30 hover:shadow-md transition-all duration-300 group"
        )}
      >
        <div className={cn(
          "w-10 h-10 rounded-lg bg-[#2e8b57]/10 flex items-center justify-center mb-3",
          "group-hover:bg-[#2e8b57]/20 transition-colors"
        )}>
          <Icon className={cn("h-5 w-5", color)} />
        </div>
        <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
      </button>
    )
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col p-4 lg:p-5 bg-card rounded-xl border border-border",
        "hover:border-[#2e8b57]/30 hover:shadow-md transition-all duration-300 group"
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-lg bg-[#2e8b57]/10 flex items-center justify-center mb-3",
        "group-hover:bg-[#2e8b57]/20 transition-colors"
      )}>
        <Icon className={cn("h-5 w-5", color)} />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground line-clamp-2">{description}</p>
    </Link>
  )
}

function BeritaArtikelModal({
  isOpen,
  onClose,
  items,
}: {
  isOpen: boolean
  onClose: () => void
  items: HomepageContentItem[]
}) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)

  return (
    <BaseCenteredModal open={isOpen} onClose={onClose} labelledBy="berita-artikel-title" initialFocusRef={closeButtonRef} widthClassName="max-w-[760px] max-h-[min(88vh,820px)] flex flex-col" zIndexClassName="z-[9998]">
      <ModalHeader
        titleId="berita-artikel-title"
        title="Berita & Artikel"
        description="Akses berita, artikel, dan informasi terbaru dari NU Care-LAZISNU melalui tautan resmi."
        onClose={onClose}
        closeButtonRef={closeButtonRef}
        icon={<div className="w-14 h-14 rounded-full bg-[#2e8b57]/20 border-2 border-[#2e8b57]/30 flex items-center justify-center"><Newspaper className="h-7 w-7 text-[#2e8b57]" /></div>}
        meta={<div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" /><span className="text-sm font-medium text-emerald-300">Highlight Informasi</span></div>}
      />

          <div className="flex-1 overflow-y-auto px-6 py-5 sm:px-7">
            <div className="space-y-4">
              {items.map((item) => {
                const Icon = item.type === "Artikel" ? FileText : item.type === "Berita" ? Newspaper : Info

                return (
                  <article
                    key={item.id}
                    className={cn(
                      "modal-card modal-card-hover group overflow-hidden rounded-2xl",
                      "transition-all duration-300"
                    )}
                  >
                    <div className="grid gap-0 md:grid-cols-[220px_minmax(0,1fr)]">
                      <div className="relative min-h-[180px] overflow-hidden bg-muted md:min-h-full">
                        <NextImage
                          src={item.image}
                          alt={item.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 220px"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute left-3 top-3 rounded-full border border-emerald-400/20 bg-zinc-900/90 px-2.5 py-1 text-xs font-medium text-emerald-300 backdrop-blur-[2px]">
                          {item.type}
                        </div>
                      </div>

                      <div className="flex flex-col justify-between p-5">
                        <div>
                          <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                              <Icon className="h-3.5 w-3.5 text-emerald-300" />
                              {item.type}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarDays className="h-3.5 w-3.5 text-emerald-300" />
                              {item.updatedAt}
                            </span>
                          </div>

                          <h3 className="text-base font-semibold leading-snug text-zinc-100 sm:text-lg">
                            {item.title}
                          </h3>
                          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-zinc-400">
                            {item.description}
                          </p>
                        </div>

                        <div className="mt-5 flex justify-start">
                          <a
                            href={item.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={cn(
                              "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5",
                              "bg-[#2e8b57] text-sm font-medium text-white hover:bg-[#236b43]",
                              "transition-all duration-200 hover:shadow-lg hover:shadow-[#2e8b57]/20"
                            )}
                          >
                            Buka Tautan
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
    </BaseCenteredModal>
  )
}

function downloadIcon(category: DownloadCategory) {
  if (category === "logo") return FileImage
  if (category === "media asset") return FileArchive
  return FileText
}

function isDownloadImage(item: DownloadItem) {
  const fileName = item.fileName.toLowerCase()
  const link = item.link.toLowerCase()
  return item.category === "logo" || /\.(png|jpe?g|webp|svg|gif)$/.test(fileName) || link.startsWith("data:image/")
}

function previewAccentClass(category: DownloadCategory) {
  if (category === "logo") return "bg-emerald-500/10 text-emerald-300 border-emerald-400/20"
  if (category === "template") return "bg-sky-500/10 text-sky-300 border-sky-400/20"
  if (category === "document") return "bg-amber-500/10 text-amber-300 border-amber-400/20"
  return "bg-violet-500/10 text-violet-300 border-violet-400/20"
}

function GalleryModal({
  isOpen,
  onClose,
  items,
}: {
  isOpen: boolean
  onClose: () => void
  items: GalleryItem[]
}) {
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)
  const selectedImages = selectedItem ? getGalleryImages(selectedItem) : []

  function openItem(item: GalleryItem) {
    setSelectedItem(item)
    setSelectedIndex(0)
  }

  return (
    <BaseCenteredModal open={isOpen} onClose={() => { setSelectedItem(null); onClose() }} labelledBy={selectedItem ? "gallery-preview-title" : "gallery-title"} initialFocusRef={closeButtonRef} widthClassName={selectedItem ? "max-w-4xl" : "max-w-5xl max-h-[min(90vh,860px)] flex flex-col"} zIndexClassName="z-[9998]">
      {selectedItem ? (
        <div className="grid overflow-hidden rounded-2xl lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="relative aspect-[4/5] bg-muted sm:max-h-[80vh]">
            <NextImage src={selectedImages[selectedIndex] ?? selectedItem.image} alt={selectedItem.title} fill sizes="100vw" className="object-contain bg-black" unoptimized />
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
                    <span key={`${selectedItem.id}-${index}`} className={cn("h-2 w-2 rounded-full", index === selectedIndex ? "bg-white" : "bg-white/40")} />
                  ))}
                </div>
              </>
            ) : null}
          </div>

          <div className="border-t border-white/10 bg-[linear-gradient(180deg,rgba(9,9,11,0.98),rgba(24,24,27,0.98))] p-5 lg:border-l lg:border-t-0 lg:p-6">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-zinc-500">Galeri Kegiatan</p>
                <h2 id="gallery-preview-title" className="mt-1 text-xl font-semibold text-zinc-100">{selectedItem.title}</h2>
              </div>
              <button
                type="button"
                ref={closeButtonRef}
                onClick={() => setSelectedItem(null)}
                className="rounded-xl p-2 text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
                aria-label="Tutup preview"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2.5 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-300">
              <div className="flex items-center gap-2 text-zinc-400">
                <CalendarDays className="h-4 w-4 text-emerald-300" />
                <span>{selectedItem.date}</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-400">
                <MapPin className="h-4 w-4 text-emerald-300" />
                <span>{selectedItem.location}</span>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">Caption</p>
              <p className="mt-2 text-sm leading-7 text-zinc-300">{selectedItem.caption}</p>
            </div>

            <div className="mt-4">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">Sumber</p>
              {selectedItem.instagramUrl ? (
                <a href={selectedItem.instagramUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#2e8b57] px-4 py-3 text-sm font-medium text-white transition-all duration-200 hover:bg-[#236b43] hover:shadow-lg hover:shadow-[#2e8b57]/20">
                  Lihat Postingan Asli
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : (
                <p className="mt-2 text-sm text-zinc-400">Belum ada link sosial media untuk kegiatan ini.</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          <ModalHeader
            titleId="gallery-title"
            title="Galeri Kegiatan"
            description="Dokumentasi kegiatan terbaru NU Care-LAZISNU Garut"
            onClose={onClose}
            closeButtonRef={closeButtonRef}
            icon={<div className="w-14 h-14 rounded-full bg-[#2e8b57]/20 border-2 border-[#2e8b57]/30 flex items-center justify-center"><ImageIcon className="h-7 w-7 text-[#2e8b57]" /></div>}
          />

          <div className="flex-1 overflow-y-auto p-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openItem(item)}
                  className={cn(
                      "modal-card modal-card-hover group overflow-hidden rounded-2xl text-left",
                    "hover:border-[#2e8b57]/30 hover:shadow-md transition-all duration-300"
                  )}
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                    <NextImage src={item.image} alt={item.title} fill sizes="(max-width: 1024px) 50vw, 33vw" className="object-cover transition-transform duration-300 group-hover:scale-105" unoptimized />
                    <div className="absolute left-3 top-3 rounded-full border border-border bg-card/90 px-2.5 py-1 text-xs font-medium text-[#2e8b57] backdrop-blur-sm">{item.category}</div>
                    <div className="absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">{getGalleryImages(item).length} foto</div>
                  </div>
                  <div className="p-4">
                    <h3 className="line-clamp-1 text-sm font-semibold text-zinc-100">{item.title}</h3>
                    <p className="mt-1 line-clamp-2 text-xs text-zinc-400">{item.caption}</p>
                    <div className="mt-3 space-y-1 text-xs text-zinc-400">
                      <p className="flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5 text-[#2e8b57]" />{item.date}</p>
                      <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-[#2e8b57]" />{item.location}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </BaseCenteredModal>
  )
}

function DownloadCenterModal({
  isOpen,
  onClose,
  items,
}: {
  isOpen: boolean
  onClose: () => void
  items: DownloadItem[]
}) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null)

  return (
    <BaseCenteredModal open={isOpen} onClose={onClose} labelledBy="download-center-title" initialFocusRef={closeButtonRef} widthClassName="max-w-4xl max-h-[min(90vh,820px)] flex flex-col" zIndexClassName="z-[9998]">
      <ModalHeader
        titleId="download-center-title"
        title="Download Center"
        description="Logo, template, dokumen, dan media asset resmi"
        onClose={onClose}
        closeButtonRef={closeButtonRef}
        icon={<div className="w-14 h-14 rounded-full bg-[#2e8b57]/20 border-2 border-[#2e8b57]/30 flex items-center justify-center"><Download className="h-7 w-7 text-[#2e8b57]" /></div>}
      />

          <div className="flex-1 overflow-y-auto p-5">
            <div className="grid gap-4 md:grid-cols-2">
              {items.map((item) => {
                const Icon = downloadIcon(item.category)

                return (
                  <article key={item.id} className="modal-card modal-card-hover group overflow-hidden rounded-2xl transition-all duration-300">
                    <div className="border-b border-border bg-gradient-to-r from-[#2e8b57]/10 to-[#2e8b57]/5 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border", previewAccentClass(item.category))}>
                            {isDownloadImage(item) ? (
                              <NextImage src={item.link} alt={item.name} width={56} height={56} className="h-full w-full object-cover" unoptimized />
                            ) : (
                              <Icon className="h-6 w-6" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-zinc-100">{item.name}</h3>
                            <p className="mt-1 line-clamp-2 text-xs text-zinc-400">{item.description}</p>
                          </div>
                        </div>
                        <span className="rounded-full bg-[#2e8b57]/10 px-2.5 py-1 text-xs font-medium text-[#2e8b57]">{categoryLabel(item.category)}</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="modal-card mt-4 flex items-center gap-3 rounded-xl p-3">
                        <Archive className="h-4 w-4 shrink-0 text-[#2e8b57]" />
                        <span className="min-w-0 flex-1 truncate text-xs text-zinc-400">{item.fileName}</span>
                      </div>
                      <a href={item.link} download={item.fileName} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2e8b57] py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-[#236b43] hover:shadow-lg hover:shadow-[#2e8b57]/20">
                        <Download className="h-4 w-4" />
                        Download
                      </a>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
    </BaseCenteredModal>
  )
}
