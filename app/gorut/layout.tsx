import { redirect } from "next/navigation"
import GorutLayout from "../../MODUL GORUT TERBARU/app/gorut/layout"
import { resolveCurrentPortalAccess } from "@/lib/portal-access-server"

export default async function ProtectedGorutLayout({ children }: { children: React.ReactNode }) {
  const access = await resolveCurrentPortalAccess()
  if (access.kind === "unauthenticated") redirect("/login?next=/gorut")
  if (access.kind === "inactive" || !access.modules.some((module) => module.key === "gorut")) {
    redirect("/dashboard?access=gorut")
  }
  return <GorutLayout>{children}</GorutLayout>
}
