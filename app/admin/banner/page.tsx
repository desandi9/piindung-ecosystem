"use client"

import { ChangeEvent, FormEvent, useDeferredValue, useState } from "react"
import Image from "next/image"
import {
  ArrowDown,
  ArrowUp,
  Eye,
  ImageIcon,
  LinkIcon,
  Megaphone,
  Pencil,
  Plus,
  Search,
  ToggleLeft,
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
import { Textarea } from "@/components/ui/textarea"
import { addActivityLog } from "@/lib/activity-log"
import { useAuth } from "@/lib/auth-context"
import { buildImageOptimizationMessage, uploadOptimizedImage } from "@/lib/upload-image-client"
import {
  createHomepageContent,
  deleteHomepageContent,
  readHomepageContent,
  sortHomepageContent,
  updateHomepageContent,
  useHomepageContent,
  writeHomepageContent,
  type HomepageContentItem,
} from "@/lib/homepage-content"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const emptyForm = {
  title: "",
  subtitle: "",
  description: "",
  buttonText: "Baca Selengkapnya",
  link: "",
  image: "",
  status: "Published" as "Published" | "Unpublished",
}

function statusClassName(status: string) {
  if (status === "Published") return "bg-primary/10 text-primary hover:bg-primary/10"
  return "bg-muted text-muted-foreground hover:bg-muted"
}

function statusLabel(status: string) {
  return status === "Published" ? "Active" : "Inactive"
}

function moveBanner(id: string, direction: "up" | "down") {
  const items = sortHomepageContent(readHomepageContent())
  const banners = items.filter((item) => item.type === "Banner")
  const currentIndex = banners.findIndex((banner) => banner.id === id)
  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1
  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= banners.length) return

  const currentBanner = banners[currentIndex]
  const targetBanner = banners[targetIndex]
  writeHomepageContent(items.map((item) => {
    if (item.id === currentBanner.id) return { ...item, order: targetBanner.order }
    if (item.id === targetBanner.id) return { ...item, order: currentBanner.order }
    return item
  }))
}

export default function BannerHomepagePage() {
  const contentItems = useHomepageContent()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [dialogMode, setDialogMode] = useState<"add" | "edit" | "preview" | null>(null)
  const [selectedBanner, setSelectedBanner] = useState<HomepageContentItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<HomepageContentItem | null>(null)
  const [form, setForm] = useState(emptyForm)
  const deferredSearch = useDeferredValue(searchQuery)

  const bannerItems = contentItems.filter((item) => item.type === "Banner")
  const filteredBanners = bannerItems.filter((banner) =>
    banner.title.toLowerCase().includes(deferredSearch.toLowerCase())
  )

  function openAddDialog() {
    setSelectedBanner(null)
    setForm(emptyForm)
    setDialogMode("add")
  }

  function openBannerDialog(mode: "edit" | "preview", banner: HomepageContentItem) {
    setSelectedBanner(banner)
    setForm({
      title: banner.title,
      subtitle: banner.subtitle,
      description: banner.description,
      buttonText: banner.buttonText,
      link: banner.link,
      image: banner.image,
      status: banner.status === "Published" ? "Published" : "Unpublished",
    })
    setDialogMode(mode)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const payload = {
      type: "Banner" as const,
      title: form.title,
      subtitle: form.subtitle,
      description: form.description,
      image: form.image,
      link: form.link,
      buttonText: form.buttonText,
      status: form.status,
    }

    if (dialogMode === "edit" && selectedBanner) {
      updateHomepageContent(selectedBanner.id, payload)
      addActivityLog({
        userName: user?.name || "Admin",
        type: "Article/Banner",
        action: `Memperbarui banner ${form.title}`,
        status: "Success",
      })
    } else {
      createHomepageContent(payload)
      addActivityLog({
        userName: user?.name || "Admin",
        type: "Article/Banner",
        action: `Menambahkan banner ${form.title}`,
        status: "Success",
      })
    }

    setDialogMode(null)
  }

  function handleDelete(banner: HomepageContentItem) {
    setDeleteTarget(banner)
  }

  function confirmDelete() {
    if (!deleteTarget) return
    deleteHomepageContent(deleteTarget.id)
    addActivityLog({
      userName: user?.name || "Admin",
      type: "Article/Banner",
      action: `Menghapus banner ${deleteTarget.title}`,
      status: "Warning",
    })
    setDeleteTarget(null)
  }

  function handleToggle(banner: HomepageContentItem) {
    const status = banner.status === "Published" ? "Unpublished" : "Published"
    updateHomepageContent(banner.id, { status })
    addActivityLog({
      userName: user?.name || "Admin",
      type: "Article/Banner",
      action: `${status === "Published" ? "Mengaktifkan" : "Menonaktifkan"} banner ${banner.title}`,
      status: "Success",
    })
  }

  function handleMove(banner: HomepageContentItem, direction: "up" | "down") {
    moveBanner(banner.id, direction)
    addActivityLog({
      userName: user?.name || "Admin",
      type: "Article/Banner",
      action: `Mengubah urutan banner ${banner.title}`,
      status: "Success",
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Megaphone className="h-4 w-4 text-primary" />
              Konten Hero Main Dashboard
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Banner Homepage</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Kelola gambar, judul, tombol, status, dan urutan banner yang tampil di homepage.
            </p>
          </div>
          <Button onClick={openAddDialog} className="gap-2 rounded-xl bg-primary hover:bg-primary/90 shadow-sm hover:shadow-lg hover:shadow-primary/20">
            <Plus className="h-4 w-4" />
            Tambah Banner
          </Button>
        </div>

        <Card className="border-border shadow-sm">
          <CardContent className="p-4 lg:p-5">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Cari judul banner..."
                  className="h-10 rounded-xl bg-muted/50 pl-9"
                />
              </div>
              <Button type="button" variant="outline" onClick={() => filteredBanners[0] ? openBannerDialog("edit", filteredBanners[0]) : openAddDialog()} className="gap-2 rounded-xl">
                <Upload className="h-4 w-4" />
                Upload/Change Image
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard icon={ImageIcon} title="Total Banner" value={String(bannerItems.length)} />
          <SummaryCard icon={Megaphone} title="Banner Aktif" value={String(bannerItems.filter((item) => item.status === "Published").length)} />
          <SummaryCard icon={LinkIcon} title="Hasil Filter" value={String(filteredBanners.length)} />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {filteredBanners.map((banner) => (
            <Card key={banner.id} className="group overflow-hidden border-border shadow-sm hover:shadow-md transition-all duration-300">
              <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                <Image
                  src={banner.image}
                  alt={banner.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f3460]/80 via-[#0f3460]/20 to-transparent" />
                <Badge className={cn("absolute left-3 top-3 border-0", statusClassName(banner.status))}>
                  {statusLabel(banner.status)}
                </Badge>
                <div className="absolute right-3 top-3 rounded-full bg-card/90 px-2.5 py-1 text-xs font-medium text-foreground backdrop-blur-sm border border-border">
                  Posisi #{banner.order}
                </div>
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <p className="text-xs text-white/70 mb-1">Hero Banner</p>
                  <h2 className="text-base font-semibold leading-snug line-clamp-2">{banner.title}</h2>
                </div>
              </div>

              <CardContent className="p-4 lg:p-5">
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{banner.subtitle}</p>

                <div className="space-y-2 rounded-xl border border-border bg-background p-3 mb-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ImageIcon className="h-3.5 w-3.5 text-primary" />
                    Last updated: {banner.updatedAt}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <LinkIcon className="h-3.5 w-3.5 text-primary" />
                    <span className="truncate">{banner.buttonText} - {banner.link}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <ActionButton icon={Eye} label="Preview" onClick={() => openBannerDialog("preview", banner)} />
                  <ActionButton icon={Pencil} label="Edit" onClick={() => openBannerDialog("edit", banner)} />
                  <ActionButton icon={ToggleLeft} label={banner.status === "Published" ? "Deactivate" : "Activate"} onClick={() => handleToggle(banner)} />
                  <ActionButton icon={Trash2} label="Delete" onClick={() => handleDelete(banner)} destructive />
                  <ActionButton icon={ArrowUp} label="Naik" onClick={() => handleMove(banner, "up")} />
                  <ActionButton icon={ArrowDown} label="Turun" onClick={() => handleMove(banner, "down")} />
                </div>
              </CardContent>
            </Card>
          ))}
          {filteredBanners.length === 0 ? (
            <Card className="lg:col-span-3 border-border shadow-sm">
              <CardContent className="p-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <ImageIcon className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-foreground">Banner tidak ditemukan</p>
                <p className="mt-1 text-sm text-muted-foreground">Tambah banner baru atau ubah pencarian untuk melihat banner lainnya.</p>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <Card className="overflow-hidden border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Ringkasan Banner</CardTitle>
            <CardDescription>Daftar banner berdasarkan urutan tampil di homepage</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-y border-border bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium">Banner</th>
                    <th className="px-5 py-3 text-left font-medium">Button</th>
                    <th className="px-5 py-3 text-left font-medium">Status</th>
                    <th className="px-5 py-3 text-left font-medium">Order</th>
                    <th className="px-5 py-3 text-left font-medium">Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBanners.map((banner) => (
                    <tr key={banner.id} className="border-b border-border transition-colors hover:bg-muted/40">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-20 overflow-hidden rounded-xl bg-muted shrink-0">
                            <Image src={banner.image} alt={banner.title} fill sizes="80px" className="object-cover" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground line-clamp-1">{banner.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{banner.subtitle}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">{banner.buttonText}</td>
                      <td className="px-5 py-4">
                        <Badge className={cn("border-0", statusClassName(banner.status))}>{statusLabel(banner.status)}</Badge>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">#{banner.order}</td>
                      <td className="px-5 py-4 text-muted-foreground">{banner.updatedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <BannerDialog
        mode={dialogMode}
        form={form}
        onFormChange={setForm}
        onOpenChange={(open) => !open && setDialogMode(null)}
        onSubmit={handleSubmit}
      />
      <ConfirmActionDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus Banner"
        description={deleteTarget ? `Banner \"${deleteTarget.title}\" akan dihapus dari homepage.` : ""}
        confirmLabel="Hapus Banner"
        destructive
        onConfirm={confirmDelete}
      />
    </DashboardLayout>
  )
}

function SummaryCard({ icon: Icon, title, value }: { icon: typeof ImageIcon; title: string; value: string }) {
  return (
    <Card className="border-border shadow-sm hover:shadow-md transition-all duration-300">
      <CardContent className="p-4 lg:p-5">
        <div className="mb-3 rounded-xl bg-primary/10 p-2 text-primary w-fit">
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground mt-1">{title}</p>
      </CardContent>
    </Card>
  )
}

function BannerDialog({
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

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const uploadedImage = await uploadOptimizedImage(file, "banner", form.image)
      onFormChange({ ...form, image: uploadedImage.url })
      toast.success(buildImageOptimizationMessage(uploadedImage))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload gambar banner gagal.")
    } finally {
      event.target.value = ""
    }
  }

  return (
    <Dialog open={Boolean(mode)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{mode === "add" ? "Tambah Banner" : mode === "edit" ? "Edit Banner" : "Preview Banner"}</DialogTitle>
            <DialogDescription>Gambar, judul, tombol, link, dan status banner langsung tersinkron ke homepage.</DialogDescription>
          </DialogHeader>

          <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-muted">
            {form.image ? (
              <Image src={form.image} alt={form.title || "Preview banner"} fill sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Preview gambar banner</div>
            )}
          </div>

          {!isPreview && (
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
              <Input value={form.image} onChange={(event) => onFormChange({ ...form, image: event.target.value })} placeholder="URL gambar" />
              <Label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-input bg-background px-4 text-sm font-medium hover:bg-accent">
                <Upload className="h-4 w-4" />
                Upload Image
                <input type="file" accept="image/*" className="sr-only" onChange={handleImageUpload} />
              </Label>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="title">Judul</Label>
              <Input id="title" value={form.title} onChange={(event) => onFormChange({ ...form, title: event.target.value })} disabled={isPreview} required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input id="subtitle" value={form.subtitle} onChange={(event) => onFormChange({ ...form, subtitle: event.target.value })} disabled={isPreview} required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea id="description" value={form.description} onChange={(event) => onFormChange({ ...form, description: event.target.value })} disabled={isPreview} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="buttonText">Teks Tombol</Label>
              <Input id="buttonText" value={form.buttonText} onChange={(event) => onFormChange({ ...form, buttonText: event.target.value })} disabled={isPreview} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link">Link URL</Label>
              <Input id="link" value={form.link} onChange={(event) => onFormChange({ ...form, link: event.target.value })} disabled={isPreview} required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={form.status}
                onChange={(event) => onFormChange({ ...form, status: event.target.value as "Published" | "Unpublished" })}
                disabled={isPreview}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition-all duration-200 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 disabled:opacity-50"
              >
                <option value="Published">Active</option>
                <option value="Unpublished">Inactive</option>
              </select>
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

function ActionButton({
  icon: Icon,
  label,
  destructive,
  onClick,
}: {
  icon: typeof Eye
  label: string
  destructive?: boolean
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      className={cn(
        "gap-2 rounded-xl hover:border-primary/30 hover:bg-primary/5 hover:text-primary",
        destructive && "hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Button>
  )
}
