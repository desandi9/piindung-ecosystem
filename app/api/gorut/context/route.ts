import { json, requireGorutContext } from "@/lib/gorut/server"

export const dynamic = "force-dynamic"

/**
 * Peran operasional GORUT milik sesi saat ini, untuk menyusun pintasan dashboard PIINDUNG.
 * Baca-saja dan memakai gerbang yang sama dengan seluruh API GORUT: 401 tanpa sesi,
 * 403 bila tidak ada penugasan aktif yang valid. Tidak membuka akses baru.
 */
export async function GET() {
  const auth = await requireGorutContext()
  if ("response" in auth) return auth.response
  return json({ operationalRole: auth.context.operationalRole })
}
