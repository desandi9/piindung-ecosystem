"use client"

import { useEffect, useMemo, useState, type ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { ArrowDown, ArrowLeft, ArrowUp, ImageIcon, Pencil, RotateCcw, Upload, X } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { MemberLayout } from "@/components/member-area/member-shell"
import { buildImageOptimizationMessage, uploadOptimizedImage } from "@/lib/upload-image-client"
import { reorderPublicProducts, updatePublicProduct, usePublicProducts, type PublicProduct, type PublicProductCategory, type PublicProductStatus } from "@/lib/public-products"

const categories: PublicProductCategory[] = ["Tata Kelola", "Penghimpunan", "Penyaluran & Pelayanan", "Informasi & Media"]
const statuses: PublicProductStatus[] = ["Aktif", "Segera Hadir"]

export default function PublicProductsEditorPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const products = usePublicProducts()
  const [selected, setSelected] = useState<PublicProduct | null>(null)
  const [form, setForm] = useState<PublicProduct | null>(null)
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const ready = !isLoading && user?.role === "super_admin_pc"
  const ordered = useMemo(() => [...products].sort((a, b) => a.position - b.position), [products])

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login?next=/member-area/konten/produk")
    else if (!isLoading && user?.role !== "super_admin_pc") router.replace("/dashboard")
  }, [isLoading, router, user])
  if (!ready) return <div className="min-h-screen bg-background" />

  const openEditor = (product: PublicProduct) => {
    setSelected(product)
    setForm({ ...product })
    setMessage("")
    setError("")
  }

  const save = async () => {
    if (!selected || !form) return
    setBusy(true); setError(""); setMessage("")
    try {
      await updatePublicProduct(selected.id, {
        name: form.name, shortName: form.shortName, description: form.description, iconUrl: form.iconUrl,
        category: form.category, status: form.status, publicHref: form.publicHref,
        visible: form.visible, featured: form.featured,
      })
      setMessage("Produk publik berhasil diperbarui.")
      setSelected(null); setForm(null)
    } catch (err) { setError(err instanceof Error ? err.message : "Gagal menyimpan produk.") }
    finally { setBusy(false) }
  }

  const move = async (id: PublicProduct["id"], direction: -1 | 1) => {
    const index = ordered.findIndex((item) => item.id === id)
    const target = index + direction
    if (index < 0 || target < 0 || target >= ordered.length) return
    const ids = ordered.map((item) => item.id)
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    setBusy(true); setError(""); setMessage("")
    try { await reorderPublicProducts(ids); setMessage("Urutan produk berhasil diperbarui.") }
    catch (err) { setError(err instanceof Error ? err.message : "Gagal mengubah urutan.") }
    finally { setBusy(false) }
  }

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !form) return
    setUploading(true); setError("")
    try {
      const result = await uploadOptimizedImage(file, "public-products", form.iconUrl)
      setForm({ ...form, iconUrl: result.url })
      setMessage(buildImageOptimizationMessage(result))
    } catch (err) { setError(err instanceof Error ? err.message : "Upload logo gagal.") }
    finally { setUploading(false); event.target.value = "" }
  }

  return <MemberLayout title="Produk Publik" breadcrumb="Member Area / Konten Publik / Produk">
    <div className="space-y-7 overflow-x-hidden">
      <section className="rounded-[28px] border border-border bg-card p-6 shadow-sm sm:p-8">
        <button onClick={() => router.push("/member-area/konten")} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground"><ArrowLeft className="h-4 w-4" /> Kembali</button>
        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.18em] text-[#15945b]">PRODUK PUBLIK</p>
        <h1 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">Kelola Konten Produk</h1>
        <p className="mt-3 text-muted-foreground">Konten publik ini terpisah dari shortcut dan konfigurasi operasional.</p>
      </section>
      {error && <div role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
      {message && <div role="status" className="rounded-xl bg-[#e6f7ee] px-4 py-3 text-sm font-medium text-[#15945b] dark:bg-emerald-500/10">{message}</div>}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {ordered.map((product, index) => <article key={product.id} className="flex flex-col rounded-[22px] border border-border bg-card p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3"><div className="flex h-16 w-24 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">{product.iconUrl ? <Image src={product.iconUrl} alt={product.name} width={96} height={64} className="max-h-14 w-auto object-contain" /> : <span className="px-2 text-center text-xs text-muted-foreground">Logo belum tersedia</span>}</div><span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">#{product.position}</span></div>
          <h2 className="mt-5 text-xl font-bold">{product.name}</h2><p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{product.description}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs"><span className="rounded-full bg-muted px-2 py-1">{product.category}</span><span className="rounded-full bg-muted px-2 py-1">{product.status}</span><span className="rounded-full bg-muted px-2 py-1">{product.visible ? "Terlihat" : "Tersembunyi"}</span></div>
          <div className="mt-5 grid grid-cols-3 gap-2"><button disabled={busy || index === 0} onClick={() => move(product.id, -1)} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border disabled:opacity-40" aria-label="Naik"><ArrowUp className="h-4 w-4" /></button><button disabled={busy || index === ordered.length - 1} onClick={() => move(product.id, 1)} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-border disabled:opacity-40" aria-label="Turun"><ArrowDown className="h-4 w-4" /></button><button onClick={() => openEditor(product)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#15945b] px-3 text-sm font-semibold text-white"><Pencil className="h-4 w-4" /> Edit</button></div>
        </article>)}
      </section>
      {selected && form && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"><div className="max-h-[92vh] w-full overflow-y-auto rounded-t-[24px] bg-card p-6 sm:max-w-2xl sm:rounded-[24px]"><div className="flex justify-between"><div><p className="text-xs font-semibold text-[#15945b]">EDIT PRODUK</p><h2 className="mt-2 text-2xl font-bold">{selected.name}</h2><p className="mt-1 text-xs text-muted-foreground">ID tetap: {selected.id}</p></div><button onClick={() => { setSelected(null); setForm(null) }} className="h-11 w-11 rounded-xl"><X /></button></div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2"><label className="space-y-2"><span className="text-sm font-semibold">Nama publik</span><input value={form.name} onChange={e => setForm({...form,name:e.target.value})} className="h-11 w-full rounded-xl border bg-background px-3" /></label><label className="space-y-2"><span className="text-sm font-semibold">Nama pendek</span><input value={form.shortName} onChange={e => setForm({...form,shortName:e.target.value})} className="h-11 w-full rounded-xl border bg-background px-3" /></label><label className="space-y-2 sm:col-span-2"><span className="text-sm font-semibold">Deskripsi</span><textarea rows={4} value={form.description} onChange={e => setForm({...form,description:e.target.value})} className="w-full rounded-xl border bg-background p-3" /></label><label className="space-y-2"><span className="text-sm font-semibold">Kategori</span><select value={form.category} onChange={e => setForm({...form,category:e.target.value as PublicProductCategory})} className="h-11 w-full rounded-xl border bg-background px-3">{categories.map(v=><option key={v}>{v}</option>)}</select></label><label className="space-y-2"><span className="text-sm font-semibold">Status</span><select value={form.status} onChange={e => setForm({...form,status:e.target.value as PublicProductStatus})} className="h-11 w-full rounded-xl border bg-background px-3">{statuses.map(v=><option key={v}>{v}</option>)}</select></label><label className="space-y-2 sm:col-span-2"><span className="text-sm font-semibold">Route publik</span><select value={form.publicHref} onChange={e => setForm({...form,publicHref:e.target.value})} className="h-11 w-full rounded-xl border bg-background px-3"><option value="">Tidak ada route</option><option value="/gorut">/gorut</option><option value="/produk">/produk</option></select></label><label className="space-y-2 sm:col-span-2"><span className="text-sm font-semibold">Logo URL</span><input value={form.iconUrl} onChange={e => setForm({...form,iconUrl:e.target.value})} className="h-11 w-full rounded-xl border bg-background px-3" /></label><label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border"><Upload className="h-4 w-4" />{uploading ? "Mengunggah..." : "Upload Logo"}<input type="file" accept="image/*" className="sr-only" onChange={upload} disabled={uploading} /></label><div className="flex flex-col gap-3"><label className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={form.visible} onChange={e => setForm({...form,visible:e.target.checked})} /> Tampilkan publik</label><label className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={form.featured} onChange={e => setForm({...form,featured:e.target.checked})} /> Featured</label></div></div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><button onClick={() => setForm({...selected})} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-5"><RotateCcw className="h-4 w-4" /> Reset</button><button onClick={save} disabled={busy || uploading} className="min-h-11 rounded-xl bg-[#15945b] px-5 font-semibold text-white">{busy ? "Menyimpan..." : "Simpan"}</button></div>
      </div></div>}
    </div>
  </MemberLayout>
}
