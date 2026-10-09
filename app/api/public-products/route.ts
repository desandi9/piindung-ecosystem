import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/session-token"
import { listRecords, updateRecord, createRecord } from "@/lib/record-store-server"
import { createPublicProduct, DEFAULT_PUBLIC_PRODUCTS, isValidPublicProductRoute, type PublicProduct, type PublicProductCategory, type PublicProductId, type PublicProductStatus } from "@/lib/public-products-data"

const AUTH_SECRET = process.env.AUTH_SECRET ?? "piindung-dev-auth-secret"
const SCOPE_NAME = "public-products"
const VALID_CATEGORIES = ["Tata Kelola", "Penghimpunan", "Penyaluran & Pelayanan", "Informasi & Media", "Layanan Kesehatan", "Dokumentasi & Arsip"] as const
const VALID_STATUSES = ["Aktif", "Segera Hadir"] as const
const SAFE_PRODUCT_ID = /^[a-z0-9][a-z0-9-]{0,79}$/

function invalid(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}

function getProductData(record: { data: Record<string, unknown> }) {
  return record.data as unknown as PublicProduct
}

async function ensureDefaultProductsExist() {
  const records = await listRecords(SCOPE_NAME)
  if (records.length === 0) {
    for (const product of DEFAULT_PUBLIC_PRODUCTS) {
      await createRecord(SCOPE_NAME, product.id, product as unknown as Record<string, unknown>)
    }
    return DEFAULT_PUBLIC_PRODUCTS
  }
  return records.map(getProductData)
}

const validatePublicRoute = isValidPublicProductRoute

function validateProductFields(data: Partial<PublicProduct>) {
  if (data.name !== undefined) {
    if (typeof data.name !== "string" || !data.name.trim()) return "Nama produk wajib diisi."
    if (data.name.length > 100) return "Nama produk tidak boleh lebih dari 100 karakter."
  }
  if (data.shortName !== undefined) {
    if (typeof data.shortName !== "string") return "Nama pendek tidak valid."
    if (data.shortName.length > 40) return "Nama pendek tidak boleh lebih dari 40 karakter."
  }
  if (data.description !== undefined) {
    if (typeof data.description !== "string" || !data.description.trim()) return "Deskripsi wajib diisi."
    if (data.description.length > 300) return "Deskripsi tidak boleh lebih dari 300 karakter."
  }
  if (data.iconUrl !== undefined && typeof data.iconUrl !== "string") return "URL Icon tidak valid."
  if (data.category !== undefined && !(VALID_CATEGORIES as readonly string[]).includes(data.category)) return "Kategori tidak valid."
  if (data.status !== undefined && !VALID_STATUSES.includes(data.status as PublicProductStatus)) return "Status tidak valid."
  if (data.publicHref !== undefined && !validatePublicRoute(data.publicHref)) return "URL atau route publik tidak valid."
  if (data.visible !== undefined && typeof data.visible !== "boolean") return "Visibility harus berupa boolean."
  if (data.featured !== undefined && typeof data.featured !== "boolean") return "Featured harus berupa boolean."
  if (data.position !== undefined && (typeof data.position !== "number" || !Number.isInteger(data.position) || data.position < 1)) return "Posisi tidak valid."
  if (Object.values(data).some((value) => typeof value === "string" && /[\u0000-\u0008\u000b-\u001f\u007f]/.test(value))) return "Mengandung karakter tidak valid."
  return null
}

function requireCreateFields(data: Partial<PublicProduct>) {
  if (data.name === undefined || !data.name.trim()) return "Nama produk wajib diisi."
  if (data.description === undefined || !data.description.trim()) return "Deskripsi wajib diisi."
  const error = validateProductFields(data)
  if (error) return error
  if (data.category === undefined || data.status === undefined || data.visible === undefined || data.featured === undefined || data.position === undefined) {
    return "Data produk belum lengkap."
  }
  return null
}

async function requireProductManager() {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value
  const session = token ? await verifySessionToken(token, AUTH_SECRET) : null
  if (!session || session.role !== "super_admin_pc") return NextResponse.json({ error: "Akses tidak diizinkan." }, { status: 403 })
  return null
}

export async function GET() {
  try {
    const records = await listRecords(SCOPE_NAME)
    const products = records.length > 0 ? records.map(getProductData) : [...DEFAULT_PUBLIC_PRODUCTS]
    products.sort((a, b) => a.position - b.position)
    return NextResponse.json({ products })
  } catch {
    return NextResponse.json({ error: "Gagal mengambil data produk publik." }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const denied = await requireProductManager()
    if (denied) return denied

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id") as PublicProductId
    if (!id || !SAFE_PRODUCT_ID.test(id)) return invalid("ID produk tidak valid.")

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== "object") return invalid("Payload tidak valid.")

    const error = validateProductFields(body)
    if (error) return invalid(error)

    const existingProducts = await ensureDefaultProductsExist()
    const targetProduct = existingProducts.find((product) => product.id === id)
    if (!targetProduct) return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 })

    const updatedProduct = { ...targetProduct, ...body, id }
    const saved = await updateRecord(SCOPE_NAME, id, updatedProduct as unknown as Record<string, unknown>)
    return NextResponse.json({ product: getProductData(saved) })
  } catch {
    return NextResponse.json({ error: "Gagal memperbarui produk publik." }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const denied = await requireProductManager()
    if (denied) return denied

    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== "object") return invalid("Payload tidak valid.")

    const existingProducts = await ensureDefaultProductsExist()

    if (action === "reorder") {
      if (!Array.isArray(body.orderedIds)) return invalid("Payload reorder tidak valid.")
      const orderedIds = body.orderedIds as string[]
      const existingIds = new Set(existingProducts.map((product) => product.id))
      const uniqueIds = new Set(orderedIds)
      if (uniqueIds.size !== orderedIds.length || orderedIds.length !== existingProducts.length || orderedIds.some((id) => !existingIds.has(id))) {
        return invalid("Urutan ID produk tidak valid.")
      }

      const updatedProducts: PublicProduct[] = []
      for (let index = 0; index < orderedIds.length; index++) {
        const id = orderedIds[index]
        const product = existingProducts.find((item) => item.id === id)
        if (!product) continue
        const position = index + 1
        const next = product.position === position ? product : { ...product, position }
        if (next !== product) await updateRecord(SCOPE_NAME, id, next as unknown as Record<string, unknown>)
        updatedProducts.push(next)
      }
      return NextResponse.json({ products: updatedProducts })
    }

    if (action) return invalid("Aksi tidak didukung.")

    const input = body as Partial<PublicProduct>
    const error = requireCreateFields(input)
    if (error) return invalid(error)

    const product = createPublicProduct({
      name: input.name!,
      shortName: input.shortName ?? "",
      description: input.description!,
      iconUrl: input.iconUrl ?? "",
      category: input.category as PublicProductCategory,
      status: input.status as PublicProductStatus,
      publicHref: input.publicHref ?? "",
      visible: input.visible!,
      featured: input.featured!,
      position: input.position!,
    })
    if (!product) return invalid("Nama produk tidak dapat dibuat menjadi ID yang aman.")
    const id = product.id
    if (existingProducts.some((existing) => existing.id === id)) {
      return NextResponse.json({ error: "Produk dengan nama atau ID tersebut sudah ada." }, { status: 409 })
    }

    const orderedIds = [...existingProducts].sort((a, b) => a.position - b.position).map((existing) => existing.id)
    const insertAt = Math.min(Math.max(product.position - 1, 0), orderedIds.length)
    orderedIds.splice(insertAt, 0, id)
    product.position = orderedIds.length

    await createRecord(SCOPE_NAME, id, product as unknown as Record<string, unknown>)
    const productsById = new Map([...existingProducts, product].map((item) => [item.id, item]))
    let created = product
    for (let index = 0; index < orderedIds.length; index++) {
      const productId = orderedIds[index]
      const current = productsById.get(productId)
      if (!current) continue
      const positioned = { ...current, position: index + 1 }
      const saved = await updateRecord(SCOPE_NAME, productId, positioned as unknown as Record<string, unknown>)
      if (productId === id) created = getProductData(saved)
    }

    return NextResponse.json({ product: created }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Gagal menambahkan produk publik." }, { status: 500 })
  }
}
