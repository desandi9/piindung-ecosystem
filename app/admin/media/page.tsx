"use client"

import { useDeferredValue, useMemo, useRef, useState, type ChangeEvent } from "react"
import type { LucideIcon } from "lucide-react"
import {
  Copy,
  Download,
  FileArchive,
  FileText,
  Filter,
  FolderOpen,
  ImageIcon,
  Pencil,
  Search,
  Trash2,
  Upload,
} from "lucide-react"
import { DashboardLayout } from "@/components/dashboard"
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { addActivityLog } from "@/lib/activity-log"
import { useAuth } from "@/lib/auth-context"
import { buildImageOptimizationMessage, uploadOptimizedImage, type UploadedImagePayload } from "@/lib/upload-image-client"
import {
  readStoredMediaItems,
  useStoredMediaItems,
  writeStoredMediaItems,
  type MediaItem,
  type MediaType,
} from "@/lib/media-library"
import { toast } from "sonner"

const mediaTypes = ["Semua", "logo", "banner", "article thumbnail", "document", "gallery image"]

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`
  return `${Math.max(1, Math.round(size / 1024))} KB`
}

function typeIcon(type: MediaType) {
  if (type === "document") return FileText
  if (type === "logo") return FileArchive
  return ImageIcon
}

export default function MediaManagerPage() {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const media = useStoredMediaItems()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState("Semua")
  const [uploadType, setUploadType] = useState<MediaType>("gallery image")
  const [notice, setNotice] = useState("")
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null)
  const [form, setForm] = useState<MediaItem | null>(null)
  const deferredSearch = useDeferredValue(searchQuery)

  function writeMedia(nextMedia: MediaItem[]) {
    writeStoredMediaItems(nextMedia)
  }

  function showNotice(message: string) {
    setNotice(message)
    window.setTimeout(() => setNotice(""), 2400)
  }

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      let url: string
      let mimeType = file.type || "application/octet-stream"
      let sizeLabel = formatFileSize(file.size)
      let uploadedImageResult: UploadedImagePayload | null = null

      if (file.type === "image/jpeg" || file.type === "image/jpg" || file.type === "image/png") {
        const uploadedImage = await uploadOptimizedImage(file, `media-${uploadType.replace(/\s+/g, "-")}`)
        uploadedImageResult = uploadedImage
        url = uploadedImage.url
        mimeType = uploadedImage.mimeType
        sizeLabel = formatFileSize(uploadedImage.size)
      } else {
        url = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(String(reader.result))
          reader.onerror = () => reject(new Error("Gagal membaca file media."))
          reader.readAsDataURL(file)
        })
      }

      const nextItem: MediaItem = {
        id: `media-${Date.now()}`,
        name: file.name,
        type: uploadType,
        mimeType,
        size: sizeLabel,
        url,
        uploadedAt: formatDateTime(new Date()),
      }

      writeMedia([nextItem, ...readStoredMediaItems()])
      addActivityLog({
        userName: user?.name || "Admin",
        type: "System",
        action: `Upload media ${file.name}`,
        status: "Success",
      })
      showNotice(uploadedImageResult ? buildImageOptimizationMessage(uploadedImageResult) : "Media berhasil diupload")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload media gagal.")
    } finally {
      event.target.value = ""
    }
  }

  function copyUrl(url: string) {
    navigator.clipboard?.writeText(url)
    addActivityLog({
      userName: user?.name || "Admin",
      type: "System",
      action: "Menyalin URL media",
      status: "Success",
    })
    showNotice("File URL berhasil disalin")
  }

  function downloadMedia(item: MediaItem) {
    const link = document.createElement("a")
    link.href = item.url
    link.download = item.name
    link.click()
  }

  function deleteMedia(item: MediaItem) {
    setDeleteTarget(item)
  }

  function confirmDeleteMedia() {
    if (!deleteTarget) return

    writeMedia(media.filter((mediaItem) => mediaItem.id !== deleteTarget.id))
    addActivityLog({
      userName: user?.name || "Admin",
      type: "System",
      action: `Menghapus media ${deleteTarget.name}`,
      status: "Warning",
    })
    showNotice("Media berhasil dihapus")
    setDeleteTarget(null)
  }

  function openEditDialog(item: MediaItem) {
    setSelectedItem(item)
    setForm(item)
  }

  function handleEditSubmit() {
    if (!selectedItem || !form) return

    writeMedia(media.map((item) => (item.id === selectedItem.id ? form : item)))
    addActivityLog({
      userName: user?.name || "Admin",
      type: "System",
      action: `Memperbarui detail media ${form.name}`,
      status: "Success",
    })
    showNotice("Detail media berhasil diperbarui")
    setSelectedItem(null)
    setForm(null)
  }

  const filteredMedia = useMemo(() => {
    return media.filter((item) => {
      const matchesSearch = `${item.name} ${item.type} ${item.mimeType}`.toLowerCase().includes(deferredSearch.toLowerCase())
      const matchesType = selectedType === "Semua" || item.type === selectedType

      return matchesSearch && matchesType
    })
  }, [media, deferredSearch, selectedType])

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <FolderOpen className="h-4 w-4 text-primary" />
              Uploaded Assets
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Media Manager</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Kelola logo, banner, thumbnail artikel, dokumen, dan gallery image yang digunakan sistem.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select value={uploadType} onValueChange={(value) => setUploadType(value as MediaType)}>
              <SelectTrigger className="h-10 w-full rounded-xl bg-muted/50 sm:w-[190px]">
                <SelectValue placeholder="Tipe upload" />
              </SelectTrigger>
              <SelectContent>
                {mediaTypes.filter((type) => type !== "Semua").map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
              </SelectContent>
            </Select>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} />
            <Button className="gap-2 rounded-xl bg-primary hover:bg-primary/90 shadow-sm hover:shadow-lg hover:shadow-primary/20" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4" />
              Upload Media
            </Button>
          </div>
        </div>

        {notice && (
          <Card className="border-primary/20 bg-primary/5 shadow-sm">
            <CardContent className="p-3 text-sm font-medium text-primary">{notice}</CardContent>
          </Card>
        )}

        <Card className="border-border shadow-sm">
          <CardContent className="p-4 lg:p-5">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Cari nama file, tipe, mime..."
                  className="h-10 rounded-xl bg-muted/50 pl-9"
                />
              </div>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="h-10 w-full rounded-xl bg-muted/50">
                  <Filter className="h-4 w-4" />
                  <SelectValue placeholder="Filter tipe" />
                </SelectTrigger>
                <SelectContent>
                  {mediaTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {filteredMedia.map((item) => (
            <MediaCard key={item.id} item={item} onCopy={copyUrl} onDelete={deleteMedia} onDownload={downloadMedia} onEdit={openEditDialog} />
          ))}
        </div>

        {filteredMedia.length === 0 && (
          <Card className="border-border shadow-sm">
            <CardContent className="p-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <FolderOpen className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">Media tidak ditemukan</p>
              <p className="text-sm text-muted-foreground mt-1">Upload media baru atau ubah filter pencarian.</p>
            </CardContent>
          </Card>
        )}

        <Dialog open={Boolean(selectedItem && form)} onOpenChange={(open) => !open && (setSelectedItem(null), setForm(null))}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Detail Media</DialogTitle>
              <DialogDescription>Perbarui nama, tipe, mime type, ukuran, dan URL file media.</DialogDescription>
            </DialogHeader>

            {form ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="media-name">Nama File</Label>
                  <Input id="media-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="media-type">Tipe</Label>
                  <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value as MediaType })}>
                    <SelectTrigger id="media-type" className="h-10 rounded-xl bg-muted/50">
                      <SelectValue placeholder="Tipe media" />
                    </SelectTrigger>
                    <SelectContent>
                      {mediaTypes.filter((type) => type !== "Semua").map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="media-size">Ukuran</Label>
                  <Input id="media-size" value={form.size} onChange={(event) => setForm({ ...form, size: event.target.value })} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="media-mime">MIME Type</Label>
                  <Input id="media-mime" value={form.mimeType} onChange={(event) => setForm({ ...form, mimeType: event.target.value })} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="media-url">URL Media</Label>
                  <Input id="media-url" value={form.url} onChange={(event) => setForm({ ...form, url: event.target.value })} />
                </div>
              </div>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setSelectedItem(null); setForm(null) }}>Batal</Button>
              <Button type="button" onClick={handleEditSubmit}>Simpan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <ConfirmActionDialog
          open={Boolean(deleteTarget)}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
          title="Hapus Media"
          description={deleteTarget ? `Media \"${deleteTarget.name}\" akan dihapus dari library.` : ""}
          confirmLabel="Hapus Media"
          destructive
          onConfirm={confirmDeleteMedia}
        />
      </div>
    </DashboardLayout>
  )
}

function MediaCard({
  item,
  onCopy,
  onDelete,
  onDownload,
  onEdit,
}: {
  item: MediaItem
  onCopy: (url: string) => void
  onDelete: (item: MediaItem) => void
  onDownload: (item: MediaItem) => void
  onEdit: (item: MediaItem) => void
}) {
  const Icon = typeIcon(item.type)
  const isImage = item.mimeType.startsWith("image/") || item.url.startsWith("http")

  return (
    <Card className="group overflow-hidden border-border shadow-sm hover:shadow-md transition-all duration-300">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {isImage ? (
          <img src={item.url} alt={item.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Icon className="h-12 w-12" />
          </div>
        )}
        <Badge className="absolute left-3 top-3 border-0 bg-primary/10 text-primary hover:bg-primary/10 capitalize">{item.type}</Badge>
      </div>
      <CardContent className="p-4">
        <div className="mb-4 min-w-0">
          <h2 className="truncate text-sm font-semibold text-foreground">{item.name}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{item.size} • {item.uploadedAt}</p>
        </div>
        <div className="mb-4 rounded-xl border border-border bg-background p-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Icon className="h-3.5 w-3.5 text-primary" />
            <span className="truncate">{item.mimeType}</span>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <ActionButton icon={Copy} label="Copy" onClick={() => onCopy(item.url)} />
          <ActionButton icon={Download} label="Download" onClick={() => onDownload(item)} />
          <ActionButton icon={Pencil} label="Edit" onClick={() => onEdit(item)} />
          <ActionButton icon={Trash2} label="Delete" destructive onClick={() => onDelete(item)} />
        </div>
      </CardContent>
    </Card>
  )
}

function ActionButton({ icon: Icon, label, destructive, onClick }: { icon: LucideIcon; label: string; destructive?: boolean; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn(
        "gap-1 rounded-xl px-2 text-xs hover:border-primary/30 hover:bg-primary/5 hover:text-primary",
        destructive && "hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
      )}
      onClick={onClick}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Button>
  )
}
