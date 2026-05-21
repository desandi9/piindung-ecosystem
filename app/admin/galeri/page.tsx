"use client"

import { ChangeEvent, FormEvent, useMemo, useState } from "react"
import Image from "next/image"
import { CalendarDays, Eye, ExternalLink, ImageIcon, Images, MapPin, Pencil, Plus, Tag, Trash2, Upload } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard"
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { addActivityLog } from "@/lib/activity-log"
import { useAuth } from "@/lib/auth-context"
import { buildImageOptimizationMessage, uploadOptimizedImage } from "@/lib/upload-image-client"
import { cn } from "@/lib/utils"
import {
  createGalleryItem,
  deleteGalleryItem,
  getGalleryImages,
  updateGalleryItem,
  useGalleryItems,
  type GalleryCategory,
  type GalleryItem,
} from "@/lib/gallery-content"
import { toast } from "sonner"

const categories: GalleryCategory[] = ["Penyaluran", "Pendidikan", "Kesehatan", "Relawan", "Lingkungan"]

const emptyForm = {
  title: "",
  caption: "",
  category: "Penyaluran" as GalleryCategory,
  date: new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "long", year: "numeric" }).format(new Date()),
  location: "Garut",
  image: "",
  images: [] as string[],
  instagramUrl: "",
}

function buildGalleryImages(primaryImage: string, images: string[]) {
  return Array.from(new Set([primaryImage.trim(), ...images.map((image) => image.trim())].filter(Boolean)))
}

export default function AdminGaleriPage() {
  const galleryItems = useGalleryItems()
  const { user } = useAuth()
  const [dialogMode, setDialogMode] = useState<"add" | "edit" | "preview" | null>(null)
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<GalleryItem | null>(null)
  const [form, setForm] = useState(emptyForm)

  function openAddDialog() {
    setSelectedItem(null)
    setForm(emptyForm)
    setDialogMode("add")
  }

  function openItemDialog(mode: "edit" | "preview", item: GalleryItem) {
    setSelectedItem(item)
    setForm({
      title: item.title,
      caption: item.caption,
      category: item.category,
      date: item.date,
      location: item.location,
      image: item.image,
      images: getGalleryImages(item).slice(1),
      instagramUrl: item.instagramUrl ?? "",
    })
    setDialogMode(mode)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const images = buildGalleryImages(form.image, form.images)
    const payload = {
      title: form.title,
      caption: form.caption,
      category: form.category,
      date: form.date,
      location: form.location,
      image: images[0] ?? form.image,
      images,
      instagramUrl: form.instagramUrl.trim(),
    }

    if (dialogMode === "edit" && selectedItem) {
      updateGalleryItem(selectedItem.id, payload)
      addActivityLog({ userName: user?.name || "Admin", type: "Article/Banner", action: `Memperbarui galeri ${form.title}`, status: "Success" })
    } else {
      createGalleryItem(payload)
      addActivityLog({ userName: user?.name || "Admin", type: "Article/Banner", action: `Menambahkan foto galeri ${form.title}`, status: "Success" })
    }

    setDialogMode(null)
  }

  function handleDelete(item: GalleryItem) {
    setDeleteTarget(item)
  }

  function confirmDelete() {
    if (!deleteTarget) return
    deleteGalleryItem(deleteTarget.id)
    addActivityLog({ userName: user?.name || "Admin", type: "Article/Banner", action: `Menghapus foto galeri ${deleteTarget.title}`, status: "Warning" })
    setDeleteTarget(null)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <ImageIcon className="h-4 w-4 text-primary" />
              Konten Galeri Main Dashboard
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Galeri Kegiatan</h1>
            <p className="text-sm text-muted-foreground mt-1">Kelola foto kegiatan, judul, caption, kategori, dan preview galeri homepage.</p>
          </div>
          <Button onClick={openAddDialog} className="gap-2 rounded-xl bg-primary hover:bg-primary/90 shadow-sm hover:shadow-lg hover:shadow-primary/20">
            <Plus className="h-4 w-4" />
            Upload Foto
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <SummaryCard icon={ImageIcon} title="Total Foto" value={String(galleryItems.length)} />
          <SummaryCard icon={Tag} title="Kategori Aktif" value={String(new Set(galleryItems.map((item) => item.category)).size)} />
          <SummaryCard icon={MapPin} title="Lokasi Tercatat" value={String(new Set(galleryItems.map((item) => item.location)).size)} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {galleryItems.map((item) => (
            <Card key={item.id} className="group overflow-hidden border-border shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md">
              <div className="relative aspect-[4/5] overflow-hidden bg-muted">
                <Image src={item.image} alt={item.title} fill sizes="(max-width: 1280px) 50vw, 33vw" className="object-cover transition-transform duration-300 group-hover:scale-105" />
                <Badge className="absolute left-3 top-3 border-0 bg-card/90 text-primary backdrop-blur-sm hover:bg-card/90">{item.category}</Badge>
                <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                  <Images className="h-3.5 w-3.5" />
                  {getGalleryImages(item).length}
                </div>
              </div>
              <CardContent className="p-4 lg:p-5">
                <h2 className="text-base font-semibold text-foreground line-clamp-1">{item.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{item.caption}</p>
                <div className="mt-4 space-y-2 rounded-xl border border-border bg-background p-3 text-xs text-muted-foreground">
                  <p className="flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5 text-primary" />{item.date}</p>
                  <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-primary" />{item.location}</p>
                  <p className="flex items-center gap-2"><ExternalLink className="h-3.5 w-3.5 text-primary" />{item.instagramUrl ? "Instagram source terpasang" : "Belum ada link Instagram"}</p>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <ActionButton icon={Eye} label="Preview" onClick={() => openItemDialog("preview", item)} />
                  <ActionButton icon={Pencil} label="Edit" onClick={() => openItemDialog("edit", item)} />
                  <ActionButton icon={Trash2} label="Delete" destructive onClick={() => handleDelete(item)} />
                </div>
              </CardContent>
            </Card>
          ))}
          {galleryItems.length === 0 ? (
            <Card className="sm:col-span-2 xl:col-span-3 border-border shadow-sm">
              <CardContent className="p-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <ImageIcon className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-foreground">Belum ada foto galeri</p>
                <p className="mt-1 text-sm text-muted-foreground">Upload dokumentasi pertama untuk mengisi galeri kegiatan.</p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      <GalleryDialog mode={dialogMode} form={form} onFormChange={setForm} onOpenChange={(open) => !open && setDialogMode(null)} onSubmit={handleSubmit} />
      <ConfirmActionDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus Foto Galeri"
        description={deleteTarget ? `Foto galeri \"${deleteTarget.title}\" akan dihapus dari galeri kegiatan.` : ""}
        confirmLabel="Hapus Foto"
        destructive
        onConfirm={confirmDelete}
      />
    </DashboardLayout>
  )
}

function SummaryCard({ title, value, icon: Icon }: { title: string; value: string; icon: typeof ImageIcon }) {
  return (
    <Card className="border-border shadow-sm hover:shadow-md transition-all duration-300">
      <CardContent className="p-4 lg:p-5">
        <div className="mb-3 rounded-xl bg-primary/10 p-2 text-primary w-fit">
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="mt-1 text-sm text-muted-foreground">{title}</p>
      </CardContent>
    </Card>
  )
}

function GalleryDialog({
  mode,
  form,
  onFormChange,
  onOpenChange,
  onSubmit,
}: {
  mode: "add" | "edit" | "preview" | null
  form: typeof emptyForm
  onFormChange: (form: typeof emptyForm) => void
  onOpenChange: (open: boolean) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  const isPreview = mode === "preview"
  const previewImages = useMemo(() => buildGalleryImages(form.image, form.images), [form.image, form.images])

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const uploadedImage = await uploadOptimizedImage(file, "galeri", form.image)
      onFormChange({ ...form, image: uploadedImage.url })
      toast.success(buildImageOptimizationMessage(uploadedImage))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload foto galeri gagal.")
    } finally {
      event.target.value = ""
    }
  }

  async function handleAdditionalImagesUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) return

    try {
      const uploadedImages = await Promise.all(files.map(async (file) => uploadOptimizedImage(file, "galeri")))
      onFormChange({
        ...form,
        images: [...form.images, ...uploadedImages.map((item) => item.url)],
      })
      const totalSavedPercent = Math.round(uploadedImages.reduce((sum, item) => sum + item.savedPercent, 0) / uploadedImages.length)
      toast.success(`Upload ${uploadedImages.length} foto selesai. Rata-rata hemat ${totalSavedPercent}%.`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload foto tambahan gagal.")
    } finally {
      event.target.value = ""
    }
  }

  function handleSetCover(image: string) {
    const nextImages = buildGalleryImages(form.image, form.images)
    const reorderedImages = [image, ...nextImages.filter((item) => item !== image)]
    onFormChange({
      ...form,
      image: reorderedImages[0],
      images: reorderedImages.slice(1),
    })
  }

  return (
    <Dialog open={Boolean(mode)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{mode === "add" ? "Upload Foto Galeri" : mode === "edit" ? "Edit Foto Galeri" : "Preview Foto Galeri"}</DialogTitle>
            <DialogDescription>Perubahan foto galeri akan langsung tersinkron ke Main Dashboard/Homepage.</DialogDescription>
          </DialogHeader>

          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted max-w-[360px] mx-auto">
            {form.image ? <Image src={form.image} alt={form.title || "Preview galeri"} fill sizes="(max-width: 768px) 100vw, 768px" className="object-cover" /> : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Preview foto</div>}
          </div>

          {previewImages.length > 0 ? (
            <div className="space-y-2">
              <Label>Urutan Carousel & Cover</Label>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {previewImages.map((image, index) => (
                  <button
                    key={`${image.slice(0, 24)}-${index}`}
                    type="button"
                    onClick={() => handleSetCover(image)}
                    className={cn(
                      "relative h-24 w-20 shrink-0 overflow-hidden rounded-xl border-2 bg-muted transition-all duration-200",
                      index === 0 ? "border-primary" : "border-transparent hover:border-primary/40"
                    )}
                  >
                    <Image src={image} alt={`Preview ${index + 1}`} fill sizes="80px" className="object-cover" />
                    <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
                      {index === 0 ? "Cover" : `${index + 1}`}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Klik thumbnail untuk menjadikannya cover utama.</p>
            </div>
          ) : null}

          {!isPreview && (
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
              <Input value={form.image} onChange={(event) => onFormChange({ ...form, image: event.target.value })} placeholder="URL gambar" required />
              <Label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-input bg-background px-4 text-sm font-medium hover:bg-accent">
                <Upload className="h-4 w-4" />
                Upload Photo
                <input type="file" accept="image/*" className="sr-only" onChange={handleImageUpload} />
              </Label>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="title">Judul Foto</Label>
              <Input id="title" value={form.title} onChange={(event) => onFormChange({ ...form, title: event.target.value })} disabled={isPreview} required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="caption">Caption</Label>
              <Textarea id="caption" value={form.caption} onChange={(event) => onFormChange({ ...form, caption: event.target.value })} disabled={isPreview} required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Foto Tambahan Carousel</Label>
              <Label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-input bg-background px-4 text-sm font-medium hover:bg-accent w-fit">
                <Upload className="h-4 w-4" />
                Upload Beberapa Foto
                <input type="file" accept="image/*" multiple className="sr-only" onChange={handleAdditionalImagesUpload} />
              </Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Activity Category</Label>
              <select id="category" value={form.category} onChange={(event) => onFormChange({ ...form, category: event.target.value as GalleryCategory })} disabled={isPreview} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition-all duration-200 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 disabled:opacity-50">
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Tanggal</Label>
              <Input id="date" value={form.date} onChange={(event) => onFormChange({ ...form, date: event.target.value })} disabled={isPreview} required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="location">Lokasi</Label>
              <Input id="location" value={form.location} onChange={(event) => onFormChange({ ...form, location: event.target.value })} disabled={isPreview} required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="instagramUrl">Link Instagram Sumber</Label>
              <Input id="instagramUrl" value={form.instagramUrl} onChange={(event) => onFormChange({ ...form, instagramUrl: event.target.value })} disabled={isPreview} placeholder="https://www.instagram.com/p/..." />
            </div>
          </div>

          {!isPreview && (
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
              <Button type="submit">Simpan</Button>
            </DialogFooter>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ActionButton({ icon: Icon, label, destructive, onClick }: { icon: typeof Tag; label: string; destructive?: boolean; onClick: () => void }) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick} className={cn("gap-2 rounded-xl px-2 text-xs hover:border-primary/30 hover:bg-primary/5 hover:text-primary", destructive && "hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive")}>
      <Icon className="h-4 w-4" />
      {label}
    </Button>
  )
}
