import { getPrismaClient } from "@/lib/prisma"
import { getGorutPackageDetail } from "@/lib/gorut-package-server"
import { errorResponse, json, requireGorutContext } from "@/lib/gorut/server"

export const dynamic = "force-dynamic"

export async function GET(_: Request, { params }: { params: Promise<{ packageCode: string }> | { packageCode: string } }) {
  const auth = await requireGorutContext()
  if ("response" in auth) return auth.response

  const { packageCode: rawPackageCode } = await Promise.resolve(params)
  const packageCode = rawPackageCode.trim()
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/.test(packageCode)) return json({ error: "Kode package tidak valid." }, 400)

  try {
    const result = await getGorutPackageDetail(getPrismaClient(), auth.context, packageCode)
    if (result === null) return json({ error: "Akses package GORUT tidak tersedia untuk role ini." }, 403)
    if (!result) return json({ error: "Package GORUT tidak ditemukan." }, 404)
    return json(result)
  } catch {
    return errorResponse()
  }
}
