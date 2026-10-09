"use client"

import { useEffect, useRef, useState } from "react"
import { Loader2, Minus, Plus, UploadCloud } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"

// Ukuran area crop di layar dan ukuran output tersimpan (persegi).
const VIEWPORT = 288
const OUTPUT_SIZE = 512
const MIN_ZOOM = 1
const MAX_ZOOM = 3

type Point = { x: number; y: number }

export function AvatarCropper({
  file,
  open,
  busy = false,
  onCancel,
  onConfirm,
}: {
  file: File | null
  open: boolean
  busy?: boolean
  onCancel: () => void
  onConfirm: (file: File) => void
}) {
  const [url, setUrl] = useState<string | null>(null)
  const [natural, setNatural] = useState<{ width: number; height: number } | null>(null)
  const [zoom, setZoom] = useState(MIN_ZOOM)
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 })
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)

  useEffect(() => {
    if (!file) {
      setUrl(null)
      return
    }
    const objectUrl = URL.createObjectURL(file)
    setUrl(objectUrl)
    setNatural(null)
    setZoom(MIN_ZOOM)
    setOffset({ x: 0, y: 0 })
    return () => URL.revokeObjectURL(objectUrl)
  }, [file])

  const baseScale = natural ? Math.max(VIEWPORT / natural.width, VIEWPORT / natural.height) : 1
  const displayScale = baseScale * zoom
  const displayWidth = natural ? natural.width * displayScale : VIEWPORT
  const displayHeight = natural ? natural.height * displayScale : VIEWPORT

  // Jaga agar gambar selalu menutupi seluruh area crop (tidak ada celah kosong).
  function clampOffset(next: Point, scale: number): Point {
    if (!natural) return { x: 0, y: 0 }
    const width = natural.width * scale
    const height = natural.height * scale
    return {
      x: Math.min(0, Math.max(VIEWPORT - width, next.x)),
      y: Math.min(0, Math.max(VIEWPORT - height, next.y)),
    }
  }

  function handleImageLoad(event: React.SyntheticEvent<HTMLImageElement>) {
    const image = event.currentTarget
    const width = image.naturalWidth
    const height = image.naturalHeight
    const base = Math.max(VIEWPORT / width, VIEWPORT / height)
    setNatural({ width, height })
    setZoom(MIN_ZOOM)
    setOffset({ x: (VIEWPORT - width * base) / 2, y: (VIEWPORT - height * base) / 2 })
  }

  function handleZoomChange(nextZoom: number) {
    if (!natural) {
      setZoom(nextZoom)
      return
    }
    const prevScale = baseScale * zoom
    const nextScale = baseScale * nextZoom
    // Perbesar/perkecil dengan titik tengah area crop sebagai jangkar.
    const centerX = (VIEWPORT / 2 - offset.x) / prevScale
    const centerY = (VIEWPORT / 2 - offset.y) / prevScale
    const nextOffset = {
      x: VIEWPORT / 2 - centerX * nextScale,
      y: VIEWPORT / 2 - centerY * nextScale,
    }
    setZoom(nextZoom)
    setOffset(clampOffset(nextOffset, nextScale))
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!natural) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y }
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current
    if (!drag) return
    const nextOffset = {
      x: drag.ox + (event.clientX - drag.x),
      y: drag.oy + (event.clientY - drag.y),
    }
    setOffset(clampOffset(nextOffset, displayScale))
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    dragRef.current = null
  }

  async function handleConfirm() {
    if (!natural || !url) return
    const scale = baseScale * zoom
    const sourceX = -offset.x / scale
    const sourceY = -offset.y / scale
    const sourceSize = VIEWPORT / scale

    const image = new window.Image()
    image.src = url
    await image.decode()

    const canvas = document.createElement("canvas")
    canvas.width = OUTPUT_SIZE
    canvas.height = OUTPUT_SIZE
    const context = canvas.getContext("2d")
    if (!context) return
    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = "high"
    context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE)

    const type = file?.type === "image/png" ? "image/png" : "image/jpeg"
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.92))
    if (!blob) return

    const extension = type === "image/png" ? "png" : "jpg"
    onConfirm(new File([blob], `avatar.${extension}`, { type }))
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (!next && !busy ? onCancel() : undefined)}>
      <DialogContent
        showCloseButton={!busy}
        className="border-[#dce8e2] bg-white text-[#08213b] dark:border-white/10 dark:bg-[#0d1e2d] dark:text-white"
      >
        <DialogHeader>
          <DialogTitle className="text-[#08213b] dark:text-white">Sesuaikan Foto Profil</DialogTitle>
          <DialogDescription className="text-[#6c7a89] dark:text-slate-400">
            Geser untuk menggeser posisi dan atur perbesaran hingga pas di dalam lingkaran.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-5">
          <div
            className="relative overflow-hidden rounded-full border border-[#dce8e2] bg-[#f4f9f6] shadow-inner dark:border-white/10 dark:bg-white/5"
            style={{ width: VIEWPORT, height: VIEWPORT, touchAction: "none", cursor: natural ? "grab" : "default" }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt="Pratinjau foto profil"
                draggable={false}
                onLoad={handleImageLoad}
                className="pointer-events-none max-w-none select-none"
                style={{
                  position: "absolute",
                  left: offset.x,
                  top: offset.y,
                  width: displayWidth,
                  height: displayHeight,
                }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[#6c7a89] dark:text-slate-500">
                <UploadCloud className="h-8 w-8" aria-hidden="true" />
              </div>
            )}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/60 dark:ring-black/40"
            />
          </div>

          <div className="flex w-full max-w-xs items-center gap-3">
            <button
              type="button"
              onClick={() => handleZoomChange(Math.max(MIN_ZOOM, Math.round((zoom - 0.1) * 100) / 100))}
              disabled={!natural || zoom <= MIN_ZOOM || busy}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#dce8e2] text-[#08213b] transition hover:bg-[#e7f7ef] disabled:opacity-40 dark:border-white/10 dark:text-white dark:hover:bg-white/10"
              aria-label="Perkecil"
            >
              <Minus className="h-4 w-4" aria-hidden="true" />
            </button>
            <Slider
              value={[zoom]}
              min={MIN_ZOOM}
              max={MAX_ZOOM}
              step={0.01}
              disabled={!natural || busy}
              onValueChange={(value) => handleZoomChange(value[0] ?? MIN_ZOOM)}
              aria-label="Perbesaran foto"
            />
            <button
              type="button"
              onClick={() => handleZoomChange(Math.min(MAX_ZOOM, Math.round((zoom + 0.1) * 100) / 100))}
              disabled={!natural || zoom >= MAX_ZOOM || busy}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#dce8e2] text-[#08213b] transition hover:bg-[#e7f7ef] disabled:opacity-40 dark:border-white/10 dark:text-white dark:hover:bg-white/10"
              aria-label="Perbesar"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <DialogFooter className="mt-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#dce8e2] bg-white px-5 text-sm font-semibold text-[#08213b] transition hover:bg-[#f4f9f6] disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={!natural || busy}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#07965d] to-[#0bbf78] px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(7,150,93,0.24)] transition-all duration-300 hover:shadow-[0_14px_30px_rgba(7,150,93,0.36)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Mengunggah...
              </>
            ) : (
              "Simpan Foto"
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
