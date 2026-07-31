"use client"

import { useEffect, useMemo, useState, type ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ChevronRight,
  ExternalLink,
  ImageIcon,
  Loader2,
  Plus,
  Save,
  Upload,
  X,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { MemberLayout } from "@/components/landing-page/member-shell"
import { buildImageOptimizationMessage, uploadOptimizedImage } from "@/lib/upload-image-client"
import {
  isValidPublicProductRoute,
  reorderPublicProducts,
  updatePublicProduct,
  usePublicProducts,
  type PublicProduct,
  type PublicProductCategory,
  type PublicProductStatus,
} from "@/lib/public-products"

const categories: PublicProductCategory[] = ["Tata Kelola", "Penghimpunan", "Penyaluran & Pelayanan", "Informasi & Media", "Layanan Kesehatan", "Dokumentasi & Arsip"]
const statuses: PublicProductStatus[] = ["Aktif", "Segera Hadir"]

function newProduct(position: number): PublicProduct {
  return {
    id: "",
    name: "",
    shortName: "",
    description: "",
    iconUrl: "",
    category: "Tata Kelola",
    status: "Segera Hadir",
    publicHref: "",
    visible: true,
    featured: false,
    position,
  }
}

export default function PublicProductsEditorPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const products = usePublicProducts()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<PublicProduct | null>(null)
  const [errors, setErrors] = useState<{ name?: string; description?: string; publicHref?: string }>({})
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const ready = !isLoading && user?.role === "super_admin_pc"
  const ordered = useMemo(() => [...products].sort((a, b) => a.position - b.position), [products])

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login?next=/dashboard/landing-page/produk")
    else if (!isLoading && user?.role !== "super_admin_pc") router.replace("/dashboard")
  }, [isLoading, router, user])
  if (!ready) return <div className="min-h-screen bg-background" />

  function openEditor(product: PublicProduct) {
    setCreating(false)
    setEditingId(product.id)
    setForm({ ...product })
    setErrors({})
    setMessage(null)
  }

  function openCreateEditor() {
    setEditingId(null)
    setCreating(true)
    setForm(newProduct(ordered.length + 1))
    setErrors({})
    setMessage(null)
  }

  function closeEditor() {
    setEditingId(null)
    setCreating(false)
    setForm(null)
    setErrors({})
  }

  async function save() {
    if ((!editingId && !creating) || !form) return

    const newErrors: { name?: string; description?: string; publicHref?: string } = {}
    if (!form.name.trim()) newErrors.name = "Nama produk wajib diisi."
    if (!form.description.trim()) newErrors.description = "Deskripsi wajib diisi."
    if (!isValidPublicProductRoute(form.publicHref)) {
      newErrors.publicHref = "Tautan harus berupa internal path aman (mulai dengan /) atau URL http/https valid."
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setMessage({ type: "error", text: "Silakan perbaiki kesalahan pada form." })
      return
    }

    setBusy(true)
    setMessage(null)
    try {
      if (creating) {
        const response = await fetch("/api/public-products", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            shortName: form.shortName,
            description: form.description,
            iconUrl: form.iconUrl,
            category: form.category,
            status: form.status,
            publicHref: form.publicHref,
            visible: form.visible,
            featured: form.featured,
            position: form.position,
          }),
        })
        const payload = await response.json().catch(() => null) as { product?: PublicProduct; error?: string } | null
        if (!response.ok) throw new Error(payload?.error || "Gagal menambahkan produk.")
        await refreshProducts()
        setMessage({ type: "success", text: `${form.name} berhasil ditambahkan.` })
      } else {
        await updatePublicProduct(form.id, {
          name: form.name,
          shortName: form.shortName,
          description: form.description,
          iconUrl: form.iconUrl,
          category: form.category,
          status: form.status,
          publicHref: form.publicHref,
          visible: form.visible,
          featured: form.featured,
        })
        setMessage({ type: "success", text: `${form.name} berhasil diperbarui.` })
      }
      closeEditor()
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Gagal menyimpan produk." })
    } finally {
      setBusy(false)
    }
  }

  async function refreshProducts() {
    const { refreshPublicProducts } = await import("@/lib/public-products")
    await refreshPublicProducts()
  }

  async function move(id: PublicProduct["id"], direction: -1 | 1) {
    const index = ordered.findIndex((item) => item.id === id)
    const target = index + direction
    if (index < 0 || target < 0 || target >= ordered.length) return
    const ids = ordered.map((item) => item.id)
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    setBusy(true)
    setMessage(null)
    try {
      await reorderPublicProducts(ids)
      setMessage({ type: "success", text: "Urutan produk berhasil diperbarui." })
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Gagal mengubah urutan." })
    } finally {
      setBusy(false)
    }
  }

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file || !form) return
    setUploading(true)
    setMessage(null)
    try {
      const result = await uploadOptimizedImage(file, "public-products", form.iconUrl)
      setForm({ ...form, iconUrl: result.url })
      setMessage({ type: "success", text: buildImageOptimizationMessage(result) })
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Upload logo gagal." })
    } finally {
      setUploading(false)
      event.target.value = ""
    }
  }

  function renderEditorForm(isCreate: boolean) {
    if (!form) return null
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-sm font-medium">Nama <span className="text-red-500">*</span></span>
          <input
            value={form.name}
            onChange={(e) => {
              setForm({ ...form, name: e.target.value })
              if (errors.name) setErrors({ ...errors, name: undefined })
            }}
            className={`h-10 w-full rounded-md border bg-background px-3 text-sm ${errors.name ? "border-red-500" : ""}`}
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium">Nama pendek</span>
          <input
            value={form.shortName}
            onChange={(e) => setForm({ ...form, shortName: e.target.value })}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          />
        </label>
        <label className="space-y-1.5 sm:col-span-2">
          <span className="text-sm font-medium">Deskripsi <span className="text-red-500">*</span></span>
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => {
              setForm({ ...form, description: e.target.value })
              if (errors.description) setErrors({ ...errors, description: undefined })
            }}
            className={`w-full rounded-md border bg-background p-3 text-sm ${errors.description ? "border-red-500" : ""}`}
          />
          {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium">Status</span>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as PublicProductStatus })}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            {statuses.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium">Kategori</span>
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value as PublicProductCategory })}
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          >
            {categories.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="text-sm font-medium">Tautan publik / Route</span>
          <input
            value={form.publicHref}
            placeholder="Kosong, /gorut, atau https://..."
            onChange={(e) => {
              setForm({ ...form, publicHref: e.target.value })
              if (errors.publicHref) setErrors({ ...errors, publicHref: undefined })
            }}
            className={`h-10 w-full rounded-md border bg-background px-3 text-sm ${errors.publicHref ? "border-red-500" : ""}`}
          />
          {errors.publicHref && <p className="text-xs text-red-500">{errors.publicHref}</p>}
        </label>
        <div className="flex items-end gap-6">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.visible}
              onChange={(e) => setForm({ ...form, visible: e.target.checked })}
            />
            Tampilkan
          </label>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
            />
            Unggulan
          </label>
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <span className="text-sm font-medium">Logo</span>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg border bg-muted">
              {form.iconUrl ? (
                <Image
                  src={form.iconUrl}
                  alt={form.name}
                  width={64}
                  height={64}
                  className="h-14 w-14 object-contain"
                />
              ) : (
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-accent">
              <Upload className="h-4 w-4" />
              {uploading ? "Mengunggah..." : "Unggah logo"}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={upload}
                className="hidden"
                disabled={uploading}
              />
            </label>
            {form.iconUrl && (
              <button
                type="button"
                onClick={() => setForm({ ...form, iconUrl: "" })}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Hapus logo
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-col-reverse gap-3 border-t pt-4 sm:col-span-2 sm:flex-row sm:justify-end">
          <button
            onClick={closeEditor}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border px-4 text-sm font-medium hover:bg-accent"
          >
            Batal
          </button>
          <button
            onClick={save}
            disabled={busy || uploading}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#15945b] px-4 text-sm font-semibold text-white hover:bg-[#12804d] disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isCreate ? "Simpan Produk" : "Simpan"}
          </button>
        </div>
      </div>
    )
  }

  return (
    <MemberLayout title="Kelola Produk" breadcrumb="Kelola Landing Page / Produk">
      <div className="mx-auto max-w-5xl space-y-6 pb-20">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <button
            onClick={() => router.push("/dashboard/landing-page")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke Kelola Landing Page
          </button>
          <a
            href="/produk"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-md border bg-background px-4 py-2 text-sm font-semibold hover:bg-accent"
          >
            <ExternalLink className="h-4 w-4" /> Preview Produk
          </a>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Atur produk yang ditampilkan pada Ekosistem PIINDUNG.
          </p>
          <button
            type="button"
            onClick={openCreateEditor}
            className="inline-flex h-9 items-center gap-2 rounded-md bg-[#15945b] px-3 text-sm font-semibold text-white hover:bg-[#12804d]"
          >
            <Plus className="h-4 w-4" /> Tambah Produk
          </button>
        </div>

        {message && (
          <div
            className={`rounded-md border p-4 text-sm font-medium ${
              message.type === "success"
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="space-y-3">
          {creating && form && (
            <div className="rounded-lg border border-[#15945b]/40 bg-card shadow-sm">
              <div className="border-b px-4 py-3 sm:px-5">
                <p className="font-semibold">Tambah Produk Baru</p>
                <p className="mt-1 text-xs text-muted-foreground">Isi data produk existing. ID dibuat otomatis dari nama.</p>
              </div>
              <div className="px-4 py-5 sm:px-5">
                {renderEditorForm(true)}
              </div>
            </div>
          )}

          {ordered.length === 0 && !creating && (
            <div className="rounded-lg border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
              Belum ada produk. Gunakan tombol Tambah Produk untuk membuat produk pertama.
            </div>
          )}

          {ordered.map((product, index) => {
            const isEditing = editingId === product.id && !creating

            return (
              <div
                key={product.id}
                className="group rounded-lg border bg-card shadow-sm transition-colors hover:border-[#15945b]/40"
              >
                <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                    {product.iconUrl ? (
                      <Image
                        src={product.iconUrl}
                        alt={product.name}
                        width={48}
                        height={48}
                        className="h-10 w-10 object-contain"
                      />
                    ) : (
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate font-semibold leading-none">{product.name}</p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">{product.description}</p>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            product.status === "Aktif"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                          }`}
                        >
                          {product.status}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            product.visible
                              ? "bg-muted text-muted-foreground"
                              : "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300"
                          }`}
                        >
                          {product.visible ? "Ditampilkan" : "Sembunyi"}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>Urutan: {product.position}</span>
                      <span>•</span>
                      <span>{product.publicHref || "Belum ada tautan"}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap items-center gap-1 sm:flex-nowrap">
                    <button
                      disabled={busy || index === 0}
                      onClick={() => move(product.id, -1)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-accent disabled:pointer-events-none disabled:opacity-20"
                      aria-label={`Naikkan urutan ${product.name}`}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      disabled={busy || index === ordered.length - 1}
                      onClick={() => move(product.id, 1)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-accent disabled:pointer-events-none disabled:opacity-20"
                      aria-label={`Turunkan urutan ${product.name}`}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => (isEditing ? closeEditor() : openEditor(product))}
                      className="ml-1 inline-flex h-8 items-center gap-1.5 rounded-md bg-[#15945b] px-3 text-xs font-semibold text-white hover:bg-[#12804d]"
                    >
                      {isEditing ? (
                        <>
                          <X className="h-3.5 w-3.5" /> Tutup
                        </>
                      ) : (
                        <>
                          <span className="relative h-3.5 w-3.5">
                            <ChevronRight className="absolute inset-0 h-3.5 w-3.5" />
                          </span>
                          Kelola
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {isEditing && form && (
                  <div className="border-t px-4 py-5 sm:px-5">
                    {renderEditorForm(false)}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </MemberLayout>
  )
}
