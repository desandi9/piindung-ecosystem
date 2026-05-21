"use client"

import { ChangeEvent, FormEvent, useState } from "react"
import Image from "next/image"
import { CalendarDays, Eye, ImageIcon, Megaphone, Pencil, Plus, Save, ToggleLeft, Trash2, Upload } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard"
import { ConfirmActionDialog } from "@/components/admin/confirm-action-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { addActivityLog } from "@/lib/activity-log"
import { useAuth } from "@/lib/auth-context"
import { buildImageOptimizationMessage, uploadOptimizedImage } from "@/lib/upload-image-client"
import { cn } from "@/lib/utils"
import {
  createPopupAnnouncement,
  deletePopupAnnouncement,
  updatePopupAnnouncement,
  usePopupAnnouncements,
  type PopupAnnouncement,
} from "@/lib/popup-announcements"
import { toast } from "sonner"

const emptyForm = {
  title: "",
  message: "",
  image: "",
  buttonText: "Buka",
  buttonLink: "/dashboard",
  active: true,
  scheduleDate: new Date().toISOString().slice(0, 10),
}

export default function PopupPengumumanPage() {
  const popups = usePopupAnnouncements()
  const { user } = useAuth()
  const [dialogMode, setDialogMode] = useState<"add" | "edit" | "preview" | null>(null)
  const [selectedPopup, setSelectedPopup] = useState<PopupAnnouncement | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PopupAnnouncement | null>(null)
  const [form, setForm] = useState(emptyForm)

  function openAddDialog() {
    setSelectedPopup(null)
    setForm(emptyForm)
    setDialogMode("add")
  }

  function openPopupDialog(mode: "edit" | "preview", popup: PopupAnnouncement) {
    setSelectedPopup(popup)
    setForm({
      title: popup.title,
      message: popup.message,
      image: popup.image,
      buttonText: popup.buttonText,
      buttonLink: popup.buttonLink,
      active: popup.active,
      scheduleDate: popup.scheduleDate,
    })
    setDialogMode(mode)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (dialogMode === "edit" && selectedPopup) {
      updatePopupAnnouncement(selectedPopup.id, form)
      addActivityLog({ userName: user?.name || "Admin", type: "Settings", action: `Memperbarui popup ${form.title}`, status: "Success" })
    } else {
      createPopupAnnouncement(form)
      addActivityLog({ userName: user?.name || "Admin", type: "Settings", action: `Menambahkan popup ${form.title}`, status: "Success" })
    }
    setDialogMode(null)
  }

  function handleToggle(popup: PopupAnnouncement, active: boolean) {
    updatePopupAnnouncement(popup.id, { active })
    addActivityLog({ userName: user?.name || "Admin", type: "Settings", action: `${active ? "Mengaktifkan" : "Menonaktifkan"} popup ${popup.title}`, status: "Success" })
  }

  function handleDelete(popup: PopupAnnouncement) {
    setDeleteTarget(popup)
  }

  function confirmDelete() {
    if (!deleteTarget) return
    deletePopupAnnouncement(deleteTarget.id)
    addActivityLog({ userName: user?.name || "Admin", type: "Settings", action: `Menghapus popup ${deleteTarget.title}`, status: "Warning" })
    setDeleteTarget(null)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Megaphone className="h-4 w-4 text-primary" />
              Pengumuman Main Dashboard
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Popup & Pengumuman</h1>
            <p className="text-sm text-muted-foreground mt-1">Kelola popup pengumuman yang tampil di Main Dashboard/Homepage.</p>
          </div>
          <Button onClick={openAddDialog} className="gap-2 rounded-xl bg-primary hover:bg-primary/90 shadow-sm hover:shadow-lg hover:shadow-primary/20">
            <Plus className="h-4 w-4" />
            Tambah Popup
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <SummaryCard icon={Megaphone} title="Total Popup" value={String(popups.length)} />
          <SummaryCard icon={ToggleLeft} title="Popup Aktif" value={String(popups.filter((item) => item.active).length)} />
          <SummaryCard icon={CalendarDays} title="Terjadwal" value={String(popups.filter((item) => Boolean(item.scheduleDate)).length)} />
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {popups.map((popup) => (
            <Card key={popup.id} className="group overflow-hidden border-border shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md">
              <div className="relative aspect-[16/9] bg-muted">
                {popup.image ? <Image src={popup.image} alt={popup.title} fill sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover transition-transform duration-300 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Tanpa banner</div>}
                <Badge className={cn("absolute left-3 top-3 border-0", popup.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>{popup.active ? "Active" : "Inactive"}</Badge>
              </div>
              <CardContent className="p-4 lg:p-5">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-foreground line-clamp-1">{popup.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{popup.message}</p>
                  </div>
                  <Switch checked={popup.active} onCheckedChange={(checked) => handleToggle(popup, checked)} />
                </div>
                <div className="space-y-2 rounded-xl border border-border bg-background p-3 text-xs text-muted-foreground">
                  <p className="flex items-center gap-2"><CalendarDays className="h-3.5 w-3.5 text-primary" />{popup.scheduleDate || "Tanpa jadwal"}</p>
                  <p className="truncate">{popup.buttonText} - {popup.buttonLink}</p>
                </div>
                <div className="mt-4 grid grid-cols-4 gap-2">
                  <ActionButton icon={Eye} label="Preview" onClick={() => openPopupDialog("preview", popup)} />
                  <ActionButton icon={Pencil} label="Edit" onClick={() => openPopupDialog("edit", popup)} />
                  <ActionButton icon={ToggleLeft} label={popup.active ? "Off" : "On"} onClick={() => handleToggle(popup, !popup.active)} />
                  <ActionButton icon={Trash2} label="Delete" destructive onClick={() => handleDelete(popup)} />
                </div>
              </CardContent>
            </Card>
          ))}
          {popups.length === 0 ? (
            <Card className="lg:col-span-3 border-border shadow-sm">
              <CardContent className="p-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <Megaphone className="h-6 w-6" />
                </div>
                <p className="text-sm font-semibold text-foreground">Belum ada popup</p>
                <p className="mt-1 text-sm text-muted-foreground">Tambahkan popup baru untuk pengumuman yang tampil di homepage.</p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      <PopupDialog mode={dialogMode} form={form} onFormChange={setForm} onOpenChange={(open) => !open && setDialogMode(null)} onSubmit={handleSubmit} />
      <ConfirmActionDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Hapus Popup"
        description={deleteTarget ? `Popup \"${deleteTarget.title}\" akan dihapus dari daftar pengumuman.` : ""}
        confirmLabel="Hapus Popup"
        destructive
        onConfirm={confirmDelete}
      />
    </DashboardLayout>
  )
}

function SummaryCard({ icon: Icon, title, value }: { icon: typeof Megaphone; title: string; value: string }) {
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

function PopupDialog({ mode, form, onFormChange, onOpenChange, onSubmit }: { mode: "add" | "edit" | "preview" | null; form: typeof emptyForm; onFormChange: (form: typeof emptyForm) => void; onOpenChange: (open: boolean) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const isPreview = mode === "preview"

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const uploadedImage = await uploadOptimizedImage(file, "popup", form.image)
      onFormChange({ ...form, image: uploadedImage.url })
      toast.success(buildImageOptimizationMessage(uploadedImage))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload gambar popup gagal.")
    } finally {
      event.target.value = ""
    }
  }

  return (
    <Dialog open={Boolean(mode)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{mode === "add" ? "Tambah Popup" : mode === "edit" ? "Edit Popup" : "Preview Popup"}</DialogTitle>
            <DialogDescription>Popup aktif sesuai jadwal akan langsung tampil di Main Dashboard/Homepage.</DialogDescription>
          </DialogHeader>

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            {form.image && <div className="relative aspect-[16/9] bg-muted"><Image src={form.image} alt={form.title || "Preview popup"} fill sizes="(max-width: 768px) 100vw, 768px" className="object-cover" /></div>}
            <div className="p-5">
              <Badge className="mb-3 border-0 bg-primary/10 text-primary">Preview Pengumuman</Badge>
              <h3 className="text-lg font-semibold text-foreground">{form.title || "Judul Popup"}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{form.message || "Pesan singkat popup akan tampil di sini."}</p>
              <Button type="button" className="mt-4 rounded-xl">{form.buttonText || "Buka"}</Button>
            </div>
          </div>

          {!isPreview && (
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
              <Input value={form.image} onChange={(event) => onFormChange({ ...form, image: event.target.value })} placeholder="URL image/banner optional" />
              <Label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-input bg-background px-4 text-sm font-medium hover:bg-accent">
                <Upload className="h-4 w-4" />
                Upload Image
                <input type="file" accept="image/*" className="sr-only" onChange={handleImageUpload} />
              </Label>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Popup Title" htmlFor="title" className="sm:col-span-2"><Input id="title" value={form.title} onChange={(event) => onFormChange({ ...form, title: event.target.value })} disabled={isPreview} required /></Field>
            <Field label="Short Message" htmlFor="message" className="sm:col-span-2"><Textarea id="message" value={form.message} onChange={(event) => onFormChange({ ...form, message: event.target.value })} disabled={isPreview} required /></Field>
            <Field label="Button Text" htmlFor="buttonText"><Input id="buttonText" value={form.buttonText} onChange={(event) => onFormChange({ ...form, buttonText: event.target.value })} disabled={isPreview} /></Field>
            <Field label="Button Link" htmlFor="buttonLink"><Input id="buttonLink" value={form.buttonLink} onChange={(event) => onFormChange({ ...form, buttonLink: event.target.value })} disabled={isPreview} /></Field>
            <Field label="Schedule Date" htmlFor="scheduleDate"><Input id="scheduleDate" type="date" value={form.scheduleDate} onChange={(event) => onFormChange({ ...form, scheduleDate: event.target.value })} disabled={isPreview} /></Field>
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="flex h-10 items-center gap-3 rounded-xl border border-input px-3">
                <Switch checked={form.active} onCheckedChange={(checked) => onFormChange({ ...form, active: checked })} disabled={isPreview} />
                <span className="text-sm text-muted-foreground">{form.active ? "Active" : "Inactive"}</span>
              </div>
            </div>
          </div>

          {!isPreview && <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button><Button type="submit" className="gap-2"><Save className="h-4 w-4" />Simpan</Button></DialogFooter>}
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, htmlFor, className, children }: { label: string; htmlFor: string; className?: string; children: React.ReactNode }) {
  return <div className={className}><Label htmlFor={htmlFor} className="mb-2">{label}</Label>{children}</div>
}

function ActionButton({ icon: Icon, label, destructive, onClick }: { icon: typeof ImageIcon; label: string; destructive?: boolean; onClick: () => void }) {
  return <Button type="button" variant="outline" size="sm" onClick={onClick} className={cn("gap-2 rounded-xl px-2 text-xs hover:border-primary/30 hover:bg-primary/5 hover:text-primary", destructive && "hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive")}><Icon className="h-4 w-4" />{label}</Button>
}
