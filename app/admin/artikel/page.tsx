"use client"

import { ChangeEvent, FormEvent, useDeferredValue, useState } from "react"
import Image from "next/image"
import {
  ArrowDown,
  ArrowUp,
  Eye,
  FileText,
  Globe2,
  ImageIcon,
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
  type HomepageContentStatus,
  type HomepageContentType,
} from "@/lib/homepage-content"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const filters: ("Semua" | HomepageContentType)[] = ["Semua", "Banner", "Artikel", "Berita"]
const statuses: HomepageContentStatus[] = ["Published", "Draft", "Unpublished"]

const emptyForm = {
  type: "Artikel" as HomepageContentType,
  title: "",
  subtitle: "",
  description: "",
  image: "",
  link: "",
  buttonText: "Buka Tautan",
  status: "Draft" as HomepageContentStatus,
}

function statusClassName(status: string) {
  if (status === "Published") return "bg-primary/10 text-primary hover:bg-primary/10"
  if (status === "Draft") return "bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
  return "bg-muted text-muted-foreground hover:bg-muted"
}

function typeIcon(type: string) {
  if (type === "Banner") return ImageIcon
  if (type === "Artikel") return FileText
  return Megaphone
}

function moveContentWithinType(itemId: string, type: HomepageContentType, direction: "up" | "down") {
  const items = sortHomepageContent(readHomepageContent())
  const scopedItems = items.filter((item) => item.type === type)
  const currentIndex = scopedItems.findIndex((item) => item.id === itemId)
  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1

  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= scopedItems.length) return items

  const currentItem = scopedItems[currentIndex]
  const targetItem = scopedItems[targetIndex]
  const nextItems = items.map((item) => {
    if (item.id === currentItem.id) return { ...item, order: targetItem.order }
    if (item.id === targetItem.id) return { ...item, order: currentItem.order }
    return item
  })

  writeHomepageContent(nextItems)
  return nextItems
}

export default function ArtikelBeritaPage() {
  const contentItems = useHomepageContent()
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilter, setSelectedFilter] = useState<(typeof filters)[number]>("Semua")
  const [dialogMode, setDialogMode] = useState<"add" | "edit" | "preview" | null>(null)
  const [selectedItem, setSelectedItem] = useState<HomepageContentItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<HomepageContentItem | null>(null)
  const [form, setForm] = useState(emptyForm)
  const deferredSearch = useDeferredValue(searchQuery)

  const filteredItems = contentItems.filter((item) => {
    const query = deferredSearch.toLowerCase()
    const matchesSearch = item.title.toLowerCase().includes(query) || item.description.toLowerCase().includes(query)
    const matchesFilter = selectedFilter === "Semua" || item.type === selectedFilter

    return matchesSearch && matchesFilter
  })

  function openAddDialog() {
    setSelectedItem(null)
    setForm(emptyForm)
    setDialogMode("add")
  }

  function openItemDialog(mode: "edit" | "preview", item: HomepageContentItem) {
    setSelectedItem(item)
    setForm({
      type: item.type,
      title: item.title,
      subtitle: item.subtitle,
      description: item.description,
      image: item.image,
      link: item.link,
      buttonText: item.buttonText,
      status: item.status,
    })
    setDialogMode(mode)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (dialogMode === "edit" && selectedItem) {
      updateHomepageContent(selectedItem.id, form)
      addActivityLog({
        userName: user?.name || "Admin",
        type: "Article/Banner",
        action: `Memperbarui konten ${form.title}`,
        status: "Success",
      })
    } else {
      createHomepageContent(form)
      addActivityLog({
        userName: user?.name || "Admin",
        type: "Article/Banner",
        action: `Menambahkan konten ${form.title}`,
        status: "Success",
      })
    }

    setDialogMode(null)
  }

  function handleDelete(item: HomepageContentItem) {
    setDeleteTarget(item)
  }

  function confirmDelete() {
    if (!deleteTarget) return
    deleteHomepageContent(deleteTarget.id)
    addActivityLog({
      userName: user?.name || "Admin",
      type: "Article/Banner",
      action: `Menghapus konten ${deleteTarget.title}`,
      status: "Warning",
    })
    setDeleteTarget(null)
  }

  function handleTogglePublish(item: HomepageContentItem) {
    const status = item.status === "Published" ? "Unpublished" : "Published"
    updateHomepageContent(item.id, { status })
    addActivityLog({
      userName: user?.name || "Admin",
      type: "Article/Banner",
      action: `${status === "Published" ? "Mempublikasikan" : "Menonaktifkan"} konten ${item.title}`,
      status: "Success",
    })
  }

  function handleMove(item: HomepageContentItem, direction: "up" | "down") {
    moveContentWithinType(item.id, item.type, direction)
    addActivityLog({
      userName: user?.name || "Admin",
      type: "Article/Banner",
      action: `Mengubah urutan konten ${item.title}`,
      status: "Success",
    })
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Globe2 className="h-4 w-4 text-primary" />
              Konten Main Dashboard / Homepage
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Artikel & Berita</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Kelola banner, artikel, berita, thumbnail, dan tautan publikasi homepage.
            </p>
          </div>
          <Button onClick={openAddDialog} className="gap-2 rounded-xl bg-primary hover:bg-primary/90 shadow-sm hover:shadow-lg hover:shadow-primary/20">
            <Plus className="h-4 w-4" />
            Tambah Artikel/Banner
          </Button>
        </div>

        <Card className="border-border shadow-sm">
          <CardContent className="p-4 lg:p-5">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Cari judul artikel, berita, atau banner..."
                  className="h-10 rounded-xl bg-muted/50 pl-9"
                />
              </div>
              <select
                value={selectedFilter}
                onChange={(event) => setSelectedFilter(event.target.value as (typeof filters)[number])}
                className="h-10 rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition-all duration-200 focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
              >
                {filters.map((filter) => (
                  <option key={filter} value={filter}>{filter}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard icon={FileText} title="Total Konten" value={String(contentItems.length)} />
          <SummaryCard icon={Megaphone} title="Published" value={String(contentItems.filter((item) => item.status === "Published").length)} />
          <SummaryCard icon={ImageIcon} title="Banner Aktif" value={String(contentItems.filter((item) => item.type === "Banner" && item.status === "Published").length)} />
        </div>

        <Card className="overflow-hidden border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Daftar Konten</CardTitle>
            <CardDescription>{filteredItems.length} konten ditampilkan</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="hidden xl:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-y border-border bg-muted/40 text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3 text-left font-medium">Konten</th>
                    <th className="px-5 py-3 text-left font-medium">Tipe</th>
                    <th className="px-5 py-3 text-left font-medium">Status</th>
                    <th className="px-5 py-3 text-left font-medium">Urutan</th>
                    <th className="px-5 py-3 text-left font-medium">Last Updated</th>
                    <th className="px-5 py-3 text-right font-medium">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => {
                    const Icon = typeIcon(item.type)

                    return (
                      <tr key={item.id} className="border-b border-border transition-colors hover:bg-muted/40">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative h-14 w-20 overflow-hidden rounded-xl bg-muted shrink-0">
                              <Image src={item.image} alt={item.title} fill sizes="80px" className="object-cover" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground line-clamp-1">{item.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Icon className="h-4 w-4 text-primary" />
                            {item.type}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <Badge className={cn("border-0", statusClassName(item.status))}>{item.status}</Badge>
                        </td>
                        <td className="px-5 py-4 text-muted-foreground">#{item.order}</td>
                        <td className="px-5 py-4 text-muted-foreground">{item.updatedAt}</td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <ActionButton icon={Eye} label="Preview" onClick={() => openItemDialog("preview", item)} />
                            <ActionButton icon={Pencil} label="Edit" onClick={() => openItemDialog("edit", item)} />
                            <ActionButton icon={ToggleLeft} label={item.status === "Published" ? "Unpublish" : "Publish"} onClick={() => handleTogglePublish(item)} />
                            <ActionButton icon={ArrowUp} label="Naik" onClick={() => handleMove(item, "up")} />
                            <ActionButton icon={ArrowDown} label="Turun" onClick={() => handleMove(item, "down")} />
                            <ActionButton icon={Trash2} label="Delete" onClick={() => handleDelete(item)} destructive />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center">
                        <div className="mx-auto max-w-md rounded-2xl border border-dashed border-border bg-muted/20 p-6">
                          <p className="text-sm font-semibold text-foreground">Tidak ada konten yang cocok</p>
                          <p className="mt-2 text-xs text-muted-foreground">Ubah pencarian atau filter untuk melihat artikel, berita, dan banner lainnya.</p>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 p-4 xl:hidden">
              {filteredItems.map((item) => {
                const Icon = typeIcon(item.type)

                return (
                  <article key={item.id} className="overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-md">
                    <div className="relative aspect-[16/9] bg-muted">
                      <Image src={item.image} alt={item.title} fill sizes="100vw" className="object-cover" />
                      <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-card/90 px-2.5 py-1 text-xs font-medium text-primary backdrop-blur-sm">
                        <Icon className="h-3.5 w-3.5" />
                        {item.type}
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <Badge className={cn("border-0", statusClassName(item.status))}>{item.status}</Badge>
                        <span className="text-xs text-muted-foreground">#{item.order}</span>
                      </div>
                      <h3 className="font-semibold text-foreground line-clamp-2">{item.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                      <p className="mt-2 text-xs text-muted-foreground line-clamp-1">{item.link}</p>
                      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <ActionButton icon={Eye} label="Preview" compact onClick={() => openItemDialog("preview", item)} />
                        <ActionButton icon={Pencil} label="Edit" compact onClick={() => openItemDialog("edit", item)} />
                        <ActionButton icon={ToggleLeft} label={item.status === "Published" ? "Unpublish" : "Publish"} compact onClick={() => handleTogglePublish(item)} />
                        <ActionButton icon={Trash2} label="Delete" compact onClick={() => handleDelete(item)} destructive />
                        <ActionButton icon={ArrowUp} label="Naik" compact onClick={() => handleMove(item, "up")} />
                        <ActionButton icon={ArrowDown} label="Turun" compact onClick={() => handleMove(item, "down")} />
                      </div>
                    </div>
                  </article>
                )
              })}
              {filteredItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-5 text-center">
                  <p className="text-sm font-semibold text-foreground">Tidak ada konten yang cocok</p>
                  <p className="mt-2 text-xs text-muted-foreground">Coba kata kunci lain atau reset filter.</p>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <ContentDialog
        mode={dialogMode}
        form={form}
        onFormChange={setForm}
        onOpenChange={(open) => !open && setDialogMode(null)}
        onSubmit={handleSubmit}
      />
      <ConfirmActionDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus Konten"
        description={deleteTarget ? `Konten \"${deleteTarget.title}\" akan dihapus permanen dari daftar homepage.` : ""}
        confirmLabel="Hapus Konten"
        destructive
        onConfirm={confirmDelete}
      />
    </DashboardLayout>
  )
}

function SummaryCard({ icon: Icon, title, value }: { icon: typeof FileText; title: string; value: string }) {
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

function ContentDialog({
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
      const uploadedImage = await uploadOptimizedImage(file, "artikel", form.image)
      onFormChange({ ...form, image: uploadedImage.url })
      toast.success(buildImageOptimizationMessage(uploadedImage))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload gambar konten gagal.")
    } finally {
      event.target.value = ""
    }
  }

  return (
    <Dialog open={Boolean(mode)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{mode === "add" ? "Tambah Artikel/Banner" : mode === "edit" ? "Edit Konten" : "Preview Konten"}</DialogTitle>
            <DialogDescription>Perubahan konten akan langsung tampil di Main Dashboard/Homepage setelah disimpan.</DialogDescription>
          </DialogHeader>

          <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-muted">
            {form.image ? (
              <Image src={form.image} alt={form.title || "Preview konten"} fill sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Preview gambar</div>
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
            <div className="space-y-2">
              <Label htmlFor="type">Tipe</Label>
              <select
                id="type"
                value={form.type}
                onChange={(event) => onFormChange({ ...form, type: event.target.value as HomepageContentType })}
                disabled={isPreview}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition-all duration-200 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 disabled:opacity-50"
              >
                {filters.filter((filter) => filter !== "Semua").map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={form.status}
                onChange={(event) => onFormChange({ ...form, status: event.target.value as HomepageContentStatus })}
                disabled={isPreview}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition-all duration-200 focus:border-primary/50 focus:ring-2 focus:ring-primary/10 disabled:opacity-50"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
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
  compact,
  destructive,
  onClick,
}: {
  icon: typeof Eye
  label: string
  compact?: boolean
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
        destructive && "hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive",
        compact && "w-full px-2 text-xs"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Button>
  )
}
