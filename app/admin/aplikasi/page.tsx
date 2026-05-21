"use client"

import { ChangeEvent, FormEvent, useState } from "react"
import Image from "next/image"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ExternalLink,
  ImageIcon,
  LinkIcon,
  Pencil,
  Power,
  Smartphone,
  Upload,
} from "lucide-react"
import { DashboardLayout } from "@/components/dashboard"
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
import { moveIntegratedApp, updateIntegratedApp, useIntegratedApps, type IntegratedApp } from "@/lib/integrated-apps"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const emptyForm = {
  name: "",
  description: "",
  iconUrl: "",
  link: "",
  enabled: true,
}

function statusClassName(enabled: boolean) {
  if (enabled) return "bg-primary/10 text-primary hover:bg-primary/10"
  return "bg-muted text-muted-foreground hover:bg-muted"
}

export default function AplikasiTerintegrasiPage() {
  const apps = useIntegratedApps()
  const { user } = useAuth()
  const [selectedApp, setSelectedApp] = useState<IntegratedApp | null>(null)
  const [form, setForm] = useState(emptyForm)

  function openEditDialog(app: IntegratedApp) {
    setSelectedApp(app)
    setForm({
      name: app.name,
      description: app.description,
      iconUrl: app.iconUrl,
      link: app.link,
      enabled: app.enabled,
    })
  }

  function handleToggle(app: IntegratedApp) {
    updateIntegratedApp(app.id, { enabled: !app.enabled })
    addActivityLog({
      userName: user?.name || "Admin",
      type: "Settings",
      action: `${app.enabled ? "Menonaktifkan" : "Mengaktifkan"} aplikasi ${app.name}`,
      status: "Success",
    })
  }

  function handleMove(app: IntegratedApp, direction: "up" | "down") {
    moveIntegratedApp(app.id, direction)
    addActivityLog({
      userName: user?.name || "Admin",
      type: "Settings",
      action: `Mengubah urutan aplikasi ${app.name}`,
      status: "Success",
    })
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedApp) return

    updateIntegratedApp(selectedApp.id, form)
    addActivityLog({
      userName: user?.name || "Admin",
      type: "Settings",
      action: `Memperbarui aplikasi ${form.name}`,
      status: "Success",
    })
    setSelectedApp(null)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Smartphone className="h-4 w-4 text-primary" />
              Shortcut Main Dashboard
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Aplikasi Terintegrasi</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Kelola shortcut aplikasi yang tampil di Main Dashboard secara sederhana.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard icon={Smartphone} title="Total Aplikasi" value={String(apps.length)} />
          <SummaryCard icon={Power} title="Aplikasi Aktif" value={String(apps.filter((app) => app.enabled).length)} />
          <SummaryCard icon={ArrowUpDown} title="Urutan Terkelola" value={String(apps.length)} />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {apps.map((app) => (
            <Card key={app.id} className="group overflow-hidden border-border shadow-sm hover:shadow-md transition-all duration-300">
              <CardContent className="p-4 lg:p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="h-16 w-16 overflow-hidden rounded-2xl border border-border bg-muted transition-transform duration-300 group-hover:scale-105">
                    <Image src={app.iconUrl} alt={app.name} width={64} height={64} className="h-full w-full object-cover" />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={cn("border-0", statusClassName(app.enabled))}>{app.enabled ? "Active" : "Inactive"}</Badge>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      Posisi #{app.position}
                    </span>
                  </div>
                </div>

                <h2 className="text-base font-semibold text-foreground">{app.name}</h2>
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{app.description}</p>

                <div className="mt-4 rounded-xl border border-border bg-background p-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <LinkIcon className="h-3.5 w-3.5 text-primary" />
                    <span className="truncate">{app.link}</span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <ActionButton icon={Pencil} label="Edit App" onClick={() => openEditDialog(app)} />
                  <ActionButton icon={Power} label={app.enabled ? "Disable" : "Enable"} onClick={() => handleToggle(app)} />
                  <ActionButton icon={ImageIcon} label="Change Icon" onClick={() => openEditDialog(app)} />
                  <ActionButton icon={ExternalLink} label="Update Link" onClick={() => openEditDialog(app)} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Urutan Shortcut</CardTitle>
            <CardDescription>Atur posisi aplikasi sesuai urutan tampil di Main Dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {apps.map((app) => (
                <div key={app.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-all duration-300 hover:border-primary/30 hover:shadow-md">
                  <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                  <Image src={app.iconUrl} alt={app.name} width={36} height={36} className="h-9 w-9 rounded-xl object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{app.name}</p>
                    <p className="text-xs text-muted-foreground">{app.description}</p>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">#{app.position}</span>
                  <Button type="button" variant="outline" size="icon" className="h-8 w-8 rounded-xl" onClick={() => handleMove(app, "up")}>
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="outline" size="icon" className="h-8 w-8 rounded-xl" onClick={() => handleMove(app, "down")}>
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <AppDialog
        app={selectedApp}
        form={form}
        onFormChange={setForm}
        onOpenChange={(open) => !open && setSelectedApp(null)}
        onSubmit={handleSubmit}
      />
    </DashboardLayout>
  )
}

function SummaryCard({ icon: Icon, title, value }: { icon: typeof Pencil; title: string; value: string }) {
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

function AppDialog({
  app,
  form,
  onFormChange,
  onOpenChange,
  onSubmit,
}: {
  app: IntegratedApp | null
  form: typeof emptyForm
  onFormChange: (form: typeof emptyForm) => void
  onOpenChange: (open: boolean) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}) {
  async function handleIconUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const uploadedImage = await uploadOptimizedImage(file, "aplikasi", form.iconUrl)
      onFormChange({ ...form, iconUrl: uploadedImage.url })
      toast.success(buildImageOptimizationMessage(uploadedImage))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload icon aplikasi gagal.")
    } finally {
      event.target.value = ""
    }
  }

  return (
    <Dialog open={Boolean(app)} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <form onSubmit={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Edit Aplikasi {app?.name}</DialogTitle>
            <DialogDescription>Perubahan nama, deskripsi, icon, link, status, dan urutan langsung tersinkron ke Main Dashboard.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-[120px_minmax(0,1fr)]">
            <div className="space-y-2">
              <Label>Preview Icon</Label>
              <div className="relative h-24 w-24 overflow-hidden rounded-2xl border border-border bg-muted">
                {form.iconUrl ? (
                  <Image src={form.iconUrl} alt={form.name || "Icon aplikasi"} fill sizes="96px" className="object-cover" />
                ) : null}
              </div>
            </div>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Aplikasi</Label>
                <Input id="name" value={form.name} onChange={(event) => onFormChange({ ...form, name: event.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea id="description" value={form.description} onChange={(event) => onFormChange({ ...form, description: event.target.value })} required />
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
            <div className="space-y-2">
              <Label htmlFor="iconUrl">Icon/Logo URL</Label>
              <Input id="iconUrl" value={form.iconUrl} onChange={(event) => onFormChange({ ...form, iconUrl: event.target.value })} required />
            </div>
            <Label className="mt-auto inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-input bg-background px-4 text-sm font-medium hover:bg-accent">
              <Upload className="h-4 w-4" />
              Upload Icon
              <input type="file" accept="image/*" className="sr-only" onChange={handleIconUpload} />
            </Label>
          </div>

          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_160px]">
            <div className="space-y-2">
              <Label htmlFor="link">Link URL</Label>
              <Input id="link" value={form.link} onChange={(event) => onFormChange({ ...form, link: event.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="enabled">Status</Label>
              <select
                id="enabled"
                value={form.enabled ? "active" : "inactive"}
                onChange={(event) => onFormChange({ ...form, enabled: event.target.value === "active" })}
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm text-foreground outline-none transition-all duration-200 focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Batal</Button>
            <Button type="submit">Simpan</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ActionButton({ icon: Icon, label, onClick }: { icon: typeof Pencil; label: string; onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onClick}
      className="gap-2 rounded-xl px-2 text-xs hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
    >
      <Icon className="h-4 w-4" />
      {label}
    </Button>
  )
}
