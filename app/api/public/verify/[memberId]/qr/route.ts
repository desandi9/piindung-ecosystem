import QRCode from "qrcode"
import { findPublicMember } from "@/lib/member-identity-server"
import { isMemberId, verificationUrl } from "@/lib/member-identity"

export async function GET(_: Request, { params }: { params: Promise<{ memberId: string }> }) {
  try {
    const { memberId } = await params
    if (!isMemberId(memberId) || !(await findPublicMember(memberId))) return Response.json({ error: "Identitas tidak ditemukan." }, { status: 404 })
    const payload = verificationUrl(memberId)
    const svg = await QRCode.toString(payload, { type: "svg", errorCorrectionLevel: "H", margin: 2, width: 320 })
    return new Response(svg, { headers: { "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": "public, max-age=86400, immutable", "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'", "X-Content-Type-Options": "nosniff" } })
  } catch {
    return Response.json({ error: "QR identitas belum dapat dibuat." }, { status: 500 })
  }
}
