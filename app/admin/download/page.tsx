"use client"

import { ChangeEvent, FormEvent, useState } from "react"
import { Archive, Download, ExternalLink, FileArchive, FileImage, FileText, Pencil, Plus, Trash2, Upload } from "lucide-react"
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
  categoryLabel,
  createDownloadItem,
  deleteDownloadItem,
  updateDownloadItem,
  useDownloadItems,
  type DownloadCategory,
  type DownloadItem,
} from "@/lib/download-center"
import { toast } from "sonner"

const categories: DownloadCategory[] = ["logo", "template", "document", "media asset"]

const emptyForm = {
  name: "",
  description: "",
  category: "document" as DownloadCategory,
  fileName: "",
  link: "",
}

function categoryIcon(category: DownloadCategory) {
  if (category === "logo") return FileImage
  if (category === "media asset") return FileArchive
  return FileText
}

export default function AdminDownloadPage() {
  const downloadItems = useDownloadItems()
  const { user } = useAuth()
  const [dialogMode, setDialogMode] = useState<"add" | "edit" | null>(null)
  const [selectedItem, setSelectedItem] = useState<DownloadItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DownloadItem | null>(null)
  const [form, setForm] = useState(emptyForm)

  function openAddDialog() {
    setSelectedItem(null)
    setForm(emptyForm)
    setDialogMode("add")
  }

  function openEditDialog(item: DownloadItem) {
    setSelectedItem(item)
    setForm({
      name: item.name,
      description: item.description,
      category: item.category,
      fileName: item.fileName,
      link: item.link,
    })
    setDialogMode("edit")
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (dialogMode === "edit" && selectedItem) {
      updateDownloadItem(selectedItem.id, form)
      addActivityLog({ userName: user?.name || "Admin", type: "Settings", action: `Memperbarui file download ${form.name}`, status: "Success" })
    } else {
      createDownloadItem(form)
      addActivityLog({ userName: user?.name || "Admin", type: "Settings", action: `Menambahkan file download ${form.name}`, status: "Success" })
    }

    setDialogMode(null)
  }

  function handleDelete(item: DownloadItem) {
    setDeleteTarget(item)
  }

  function confirmDelete() {
    if (!deleteTarget) return
    deleteDownloadItem(deleteTarget.id)
    addActivityLog({ userName: user?.name || "Admin", type: "Settings", action: `Menghapus file download ${deleteTarget.name}`, status: "Warning" })
    setDeleteTarget(null)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Download className="h-4 w-4 text-primary" />
              File Publik Main Dashboard
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Download Center</h1>
            <p className="text-sm text-muted-foreground mt-1">Kelola logo, template, dokumen, dan media asset yang tampil di halaman Download Center.</p>
          </div>
          <Button onClick={openAddDialog} className="gap-2 rounded-xl bg-primary hover:bg-primary/90 shadow-sm hover:shadow-lg hover:shadow-primary/20">
            <Plus className="h-4 w-4" />
            Upload File
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <SummaryCard icon={Download} title="Total File" value={String(downloadItems.length)} />
          <SummaryCard icon={FileText} title="Dokumen" value={String(downloadItems.filter((item) => item.category === "document").length)} />
          <SummaryCard icon={FileImage} title="Logo & Asset" value={String(downloadItems.filter((item) => item.category === "logo" || item.category === "media asset").length)} />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {downloadItems.map((item) => {
            const Icon = categoryIcon(item.category)

            return (
              <Card key={item.id} className="group overflow-hidden border-border shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md">
                <div className="border-b border-border bg-gradient-to-r from-primary/10 to-primary/5 p-4 lg:p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold text-foreground">{item.name}</h2>
                        <p className="text-xs text-muted-foreground">Updated {item.updatedAt}</p>
                      </div>
                    </div>
                    <Badge className="border-0 bg-primary/10 text-primary hover:bg-primary/10">{categoryLabel(item.category)}</Badge>
                  </div>
                </div>
                <CardContent className="p-4 lg:p-5">
                  <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                  <div className="mt-4 space-y-2 rounded-xl border border-border bg-background p-3 text-xs text-muted-foreground">
                    <p className="flex items-center gap-2"><Archive className="h-3.5 w-3.5 text-primary" /> <span className="truncate">{item.fileName}</span></p>
                    <p className="flex items-center gap-2"><ExternalLink className="h-3.5 w-3.5 text-primary" /> <span className="truncate">{item.link}</span></p>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <Button asChild type="button" variant="outline" size="sm" className="gap-2 rounded-xl px-2 text-xs hover:border-primary/30 hover:bg-primary/5 hover:text-primary">
                      <a href={item.link} download={item.fileName}>
                        <Download className="h-4 w-4" />
                        Download
                      </a>
                    </Button>
                    <ActionButton icon={Pencil} label="Edit" onClick={() => openEditDialog(item)} />
                    <ActionButton icon={Trash2} label="Delete" destructive onClick={() => handleDelete(item)} />
                  </div>
                </CardContent>
              </Card>
            )
          })}
          {downloadItems.length === 0 ? (
            <Card className="md:col-span-2 border-border shadow-sm">
              <CardContent className="p-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <Download className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-foreground">Belum ada file download</p>
                <p className="mt-1 text-sm text-muted-foreground">Upload file publik pertama untuk mengisi Download Center.</p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      <DownloadDialog mode={dialogMode} form={form} onFormChange={setForm} onOpenChange={(open) => !open && setDialogMode(null)} onSubmit={handleSubmit} />
      <ConfirmActionDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus File Download"
        description={deleteTarget ? `File \"${deleteTarget.name}\" akan dihapus dari Download Center.` : ""}
        confirmLabel="Hapus File"
        destructive
        onConfirm={confirmDelete}
      />
    </DashboardLayout>
  )
}

function SummaryCard({ icon: Icon, title, value }: { icon: typeof Download; title: string; value: string }) {
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

function DownloadDialog({
  mode,
  form,
  onFormChange,
  onOpenChange,
  onSubmit,
}: {
  mode: "add" | "edit" | null
  form: typeof emptyForm
  onFormChange: (form: typeof emptyForm) => void
  onOpenChange: (open: boolean) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const isImageUpload = file.type === "image/jpeg" || file.type === "image/jpg" || file.type === "image/png"
      const uploadedImage = isImageUpload ? await uploadOptimizedImage(file, `download-${form.category}`) : null
      const link = uploadedImage?.url ?? await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(String(reader.result))
            reader.onerror = () => reject(new Error("Gagal membaca file download."))
            reader.readAsDataURL(file)
          })

      onFormChange({
        ...form,
        fileName: file.name,
        link,
        name: form.name || file.name.replace(/\.[^.]+$/, ""),
      })
      if (uploadedImage) {
        toast.success(buildImageOptimizationMessage(uploadedImage))
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload file gagal.")
    } finally {
      event.target.value = ""
    }
  }

  return (
    <Dialog open={Boolean(mode)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{mode === "add" ? "Upload File Download" : "Edit File Download"}</DialogTitle>
            <DialogDescription>File, nama, kategori, dan link download langsung tersinkron ke halaman Download Center.</DialogDescription>
          </DialogHeader>

          <div className="rounded-2xl border border-border bg-muted/40 p-4">
            <div className="grid gap-3 md:grid-cols-[48px_minmax(0,1fr)_auto] md:items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Archive className="h-6 w-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{form.fileName || "Belum ada file dipilih"}</p>
                <p className="max-h-16 overflow-y-auto break-all text-xs text-muted-foreground">{form.link || "Upload file atau isi download link manual"}</p>
              </div>
              <Label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-input bg-background px-4 text-sm font-medium hover:bg-accent">
                <Upload className="h-4 w-4" />
                Upload File
                <input type="file" className="sr-only" onChange={handleFileUpload} />
              </Label>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nama File</Label>
              <Input id="name" value={form.name} onChange={(event) => onFormChange({ ...form, name: event.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <select id="category" value={form.category} onChange={(event) => onFormChange({ ...form, category: event.target.value as DownloadCategory })} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition-all duration-200 focus:border-primary/50 focus:ring-2 focus:ring-primary/10">
                {categories.map((category) => <option key={category} value={category}>{categoryLabel(category)}</option>)}
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Textarea id="description" value={form.description} onChange={(event) => onFormChange({ ...form, description: event.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fileName">Nama File Download</Label>
              <Input id="fileName" value={form.fileName} onChange={(event) => onFormChange({ ...form, fileName: event.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link">Download Link</Label>
              <Input id="link" value={form.link} onChange={(event) => onFormChange({ ...form, link: event.target.value })} required />
            </div>
          </div>

          <DialogFooter className="sticky bottom-0 bg-background pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button type="submit">Simpan</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ActionButton({ icon: Icon, label, destructive, onClick }: { icon: typeof Pencil; label: string; destructive?: boolean; onClick: () => void }) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick} className={cn("gap-2 rounded-xl px-2 text-xs hover:border-primary/30 hover:bg-primary/5 hover:text-primary", destructive && "hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive")}>
      <Icon className="h-4 w-4" />
      {label}
    </Button>
  )
}
