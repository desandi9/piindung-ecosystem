import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { getPrismaClient } from "@/lib/prisma"
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/session-token"
import { listRecords, updateRecord, createRecord } from "@/lib/record-store-server"
import { DEFAULT_PUBLIC_PRODUCTS, type PublicProduct, type PublicProductId, type PublicProductCategory, type PublicProductStatus } from "@/lib/public-products-data"

const AUTH_SECRET = process.env.AUTH_SECRET ?? "piindung-dev-auth-secret"
const SCOPE_NAME = "public-products"

const ALLOWED_PUBLIC_ROUTES = ["/gorut", "/produk"]
const VALID_CATEGORIES = ["Tata Kelola", "Penghimpunan", "Penyaluran & Pelayanan", "Informasi & Media"] as const
const VALID_STATUSES = ["Aktif", "Segera Hadir"] as const
const VALID_IDS = DEFAULT_PUBLIC_PRODUCTS.map((p) => p.id)

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

function validatePublicRoute(href: unknown) {
  if (href === "" || href === null || href === undefined) return true
  if (typeof href !== "string") return false
  const trimmed = href.trim()
  if (trimmed === "") return true
  return ALLOWED_PUBLIC_ROUTES.includes(trimmed)
}

function validateProductFields(data: Partial<PublicProduct>) {
  if (data.name !== undefined && (typeof data.name !== "string" || !data.name.trim() || data.name.length > 100)) return "Nama produk tidak valid."
  if (data.shortName !== undefined && (typeof data.shortName !== "string" || data.shortName.length > 40)) return "Nama pendek tidak valid."
  if (data.description !== undefined && (typeof data.description !== "string" || !data.description.trim() || data.description.length > 300)) return "Deskripsi tidak valid."
  if (data.iconUrl !== undefined && typeof data.iconUrl !== "string") return "URL Icon tidak valid."
  if (data.category !== undefined && !VALID_CATEGORIES.includes(data.category as PublicProductCategory)) return "Kategori tidak valid."
  if (data.status !== undefined && !VALID_STATUSES.includes(data.status as PublicProductStatus)) return "Status tidak valid."
  if (data.publicHref !== undefined && !validatePublicRoute(data.publicHref)) return "URL publik tidak diizinkan atau tidak valid."
  if (data.visible !== undefined && typeof data.visible !== "boolean") return "Visibility harus berupa boolean."
  if (data.featured !== undefined && typeof data.featured !== "boolean") return "Featured harus berupa boolean."
  if (data.position !== undefined && (typeof data.position !== "number" || !Number.isInteger(data.position) || data.position < 1)) return "Posisi tidak valid."

  if (Object.values(data).some(v => typeof v === "string" && /[\u0000-\u0008\u000b-\u001f\u007f]/.test(v))) {
    return "Mengandung karakter tidak valid."
  }
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
    const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value
    const session = token ? await verifySessionToken(token, AUTH_SECRET) : null
    if (!session || session.role !== "super_admin_pc") return NextResponse.json({ error: "Akses tidak diizinkan." }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id") as PublicProductId
    if (!id || !VALID_IDS.includes(id)) return invalid("ID produk tidak valid.")

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== "object") return invalid("Payload tidak valid.")

    const error = validateProductFields(body)
    if (error) return invalid(error)

    const existingProducts = await ensureDefaultProductsExist()
    const targetProduct = existingProducts.find((p) => p.id === id)
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
    const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value
    const session = token ? await verifySessionToken(token, AUTH_SECRET) : null
    if (!session || session.role !== "super_admin_pc") return NextResponse.json({ error: "Akses tidak diizinkan." }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const action = searchParams.get("action")
    if (action !== "reorder") return invalid("Aksi tidak didukung.")

    const body = await request.json().catch(() => null)
    if (!body || !Array.isArray(body.orderedIds)) return invalid("Payload reorder tidak valid.")
    const orderedIds = body.orderedIds as string[]

    const uniqueIds = new Set(orderedIds)
    if (uniqueIds.size !== orderedIds.length || orderedIds.some((id) => !VALID_IDS.includes(id as PublicProductId)) || orderedIds.length !== VALID_IDS.length) {
      return invalid("Urutan ID produk tidak valid.")
    }

    const existingProducts = await ensureDefaultProductsExist()
    const updatedProducts: PublicProduct[] = []

    for (let index = 0; index < orderedIds.length; index++) {
      const id = orderedIds[index]
      const product = existingProducts.find((p) => p.id === id)
      if (product) {
        const nextPosition = index + 1
        if (product.position !== nextPosition) {
          const updated = { ...product, position: nextPosition }
          await updateRecord(SCOPE_NAME, id, updated as unknown as Record<string, unknown>)
          updatedProducts.push(updated)
        } else {
          updatedProducts.push(product)
        }
      }
    }

    return NextResponse.json({ products: updatedProducts.sort((a, b) => a.position - b.position) })
  } catch {
    return NextResponse.json({ error: "Gagal memproses reorder produk." }, { status: 500 })
  }
}
