import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { getPrismaClient } from "@/lib/prisma"
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/session-token"
import { deleteRecord, createRecord, listRecords, updateRecord } from "@/lib/record-store-server"
import { gorutKecamatanOptions } from "@/lib/gorut-kecamatan"
import { globalOperationalRoles, gorutScopedOperationalRoles } from "@/lib/user-operational-scope-rules"
import type { AppRole } from "@/types/auth"

const AUTH_SECRET = process.env.AUTH_SECRET ?? "piindung-dev-auth-secret"
const SCOPE_NAME = "user-operational-scope"

type ScopePayload = {
  userId?: unknown
  role?: unknown
  gorutKecamatan?: unknown
  gorutWilayahLabel?: unknown
  clearStaleLocalScope?: unknown
  confirmStaleScope?: unknown
}

type StoredScope = {
  id?: unknown
  userId?: unknown
  role?: unknown
  gorutKecamatan?: unknown
  gorutWilayahLabel?: unknown
}

function isSupportedRole(role: unknown): role is AppRole {
  return typeof role === "string" && [...globalOperationalRoles, ...gorutScopedOperationalRoles].includes(role as AppRole)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

function hasLocalScope(scope: StoredScope) {
  return isNonEmptyString(scope.gorutKecamatan) || isNonEmptyString(scope.gorutWilayahLabel)
}

function invalid(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}

function conflict(message: string) {
  return NextResponse.json({ error: message }, { status: 409 })
}

function getScopeData(record: { data: Record<string, unknown> }) {
  return record.data as StoredScope
}

function resolveScopeId(scope: StoredScope | null, userId: string) {
  return isNonEmptyString(scope?.id) ? scope.id.trim() : `user-scope-${userId}`
}

export async function POST(request: Request) {
  try {
    const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value
    const session = token ? await verifySessionToken(token, AUTH_SECRET) : null
    if (!session) return NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 401 })
    if (session.role !== "super_admin_pc") return NextResponse.json({ error: "Akses tidak diizinkan." }, { status: 403 })

    const prisma = getPrismaClient()
    const currentUsers = await prisma.$queryRaw<Array<{ role: string }>>`SELECT role FROM "User" WHERE id = ${session.sub} LIMIT 1`
    if (currentUsers[0]?.role !== "super_admin_pc") return NextResponse.json({ error: "Akses tidak diizinkan." }, { status: 403 })

    let body: ScopePayload
    try {
      body = (await request.json()) as ScopePayload
    } catch {
      return invalid("Payload penempatan tidak valid.")
    }

    if (!body || typeof body !== "object" || typeof body.userId !== "string" || !body.userId.trim() || !isSupportedRole(body.role)) {
      return invalid("User dan role penempatan wajib valid.")
    }

    const userId = body.userId.trim()
    const role = body.role
    if (body.clearStaleLocalScope !== undefined && typeof body.clearStaleLocalScope !== "boolean") return invalid("Flag pembersihan scope tidak valid.")
    if (body.confirmStaleScope !== undefined && typeof body.confirmStaleScope !== "boolean") return invalid("Konfirmasi scope tidak valid.")

    const targetUsers = await prisma.$queryRaw<Array<{ id: string; role: string }>>`SELECT id, role FROM "User" WHERE id = ${userId} LIMIT 1`
    const targetUser = targetUsers[0]
    if (!targetUser) return NextResponse.json({ error: "Pengguna tujuan tidak ditemukan." }, { status: 404 })
    if (targetUser.role !== role) return conflict("Role pengguna berubah. Muat ulang data sebelum mengatur penempatan.")

    const records = await listRecords(SCOPE_NAME)
    const targetRecords = records.filter((record) => getScopeData(record).userId === userId)
    if (targetRecords.some((record) => getScopeData(record).role !== targetUser.role)) {
      return conflict("Role scope tersimpan tidak sesuai dengan role pengguna. Tinjau assignment terlebih dahulu.")
    }
    if (targetRecords.length > 1) return conflict("Terdapat lebih dari satu scope untuk pengguna ini. Tinjau assignment terlebih dahulu.")

    const existingRecord = targetRecords[0]
    const existingScope = existingRecord ? getScopeData(existingRecord) : null
    const isGlobalRole = globalOperationalRoles.includes(role)
    const isScopedRole = gorutScopedOperationalRoles.includes(role)
    const kecamatan = body.gorutKecamatan === undefined || body.gorutKecamatan === null ? undefined : body.gorutKecamatan
    const wilayahLabel = body.gorutWilayahLabel === undefined || body.gorutWilayahLabel === null ? undefined : body.gorutWilayahLabel

    if (kecamatan !== undefined && typeof kecamatan !== "string") return invalid("Kecamatan tidak valid.")
    if (wilayahLabel !== undefined && typeof wilayahLabel !== "string") return invalid("Label wilayah/unit tidak valid.")
    if (typeof wilayahLabel === "string" && !wilayahLabel.trim()) return invalid("Label wilayah/unit tidak boleh kosong.")
    if (typeof wilayahLabel === "string" && wilayahLabel.trim().length > 160) return invalid("Label wilayah/unit terlalu panjang.")
    if (typeof wilayahLabel === "string" && /[\u0000-\u001f\u007f]/.test(wilayahLabel)) return invalid("Label wilayah/unit tidak valid.")
    if (typeof kecamatan === "string" && kecamatan.trim() && !gorutKecamatanOptions.includes(kecamatan.trim() as (typeof gorutKecamatanOptions)[number])) return invalid("Kecamatan tidak terdaftar.")

    if (isGlobalRole) {
      if ((typeof kecamatan === "string" && kecamatan.trim()) || (typeof wilayahLabel === "string" && wilayahLabel.trim())) return invalid("Role global tidak dapat menerima scope lokal.")
      if (existingScope && hasLocalScope(existingScope)) {
        if (body.clearStaleLocalScope !== true || body.confirmStaleScope !== true) return conflict("Scope lokal lama memerlukan konfirmasi eksplisit untuk dihapus.")
        await deleteRecord(SCOPE_NAME, existingRecord.key)
        return NextResponse.json({ scope: null })
      }
      const scope = { id: resolveScopeId(existingScope, userId), userId, role }
      const saved = existingRecord ? await updateRecord(SCOPE_NAME, existingRecord.key, scope) : await createRecord(SCOPE_NAME, scope.id, scope)
      return NextResponse.json({ scope: saved?.data ?? scope })
    }

    if (!isScopedRole) return invalid("Role penempatan tidak didukung.")
    if (typeof kecamatan !== "string" || !kecamatan.trim()) return invalid("Kecamatan wajib diisi.")
    if (role === "admin_kordes" && (typeof wilayahLabel !== "string" || !wilayahLabel.trim())) return invalid("Desa/Kelurahan atau Unit wajib diisi.")

    const scope = {
      id: resolveScopeId(existingScope, userId),
      userId,
      role,
      gorutKecamatan: kecamatan.trim(),
      ...(typeof wilayahLabel === "string" && wilayahLabel.trim() ? { gorutWilayahLabel: wilayahLabel.trim() } : {}),
    }
    const saved = existingRecord ? await updateRecord(SCOPE_NAME, existingRecord.key, scope) : await createRecord(SCOPE_NAME, scope.id, scope)
    return NextResponse.json({ scope: saved?.data ?? scope })
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan penempatan operasional." }, { status: 500 })
  }
}
