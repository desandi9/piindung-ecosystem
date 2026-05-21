import Link from "next/link"
import { ArrowLeft, LifeBuoy, ShieldQuestion } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function GorutHelpPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Bantuan GORUT</h1>
        <p className="text-sm text-muted-foreground">
          Halaman bantuan modul GORUT belum memiliki konten khusus. Gunakan shortcut utama untuk kembali ke modul inti.
        </p>
      </div>

      <Card className="border-border/70 bg-card/90 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-primary/10 p-2 text-primary">
              <LifeBuoy className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Pusat Bantuan Sementara</CardTitle>
              <CardDescription>Alias ini disediakan agar navigasi internal modul tetap aman saat fitur bantuan belum tersedia.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Anda bisa kembali ke dashboard utama GORUT atau membuka pusat notifikasi untuk melanjutkan pekerjaan.</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild className="rounded-xl">
              <Link href="/gorut/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali ke Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline" className="rounded-xl">
              <Link href="/gorut/notifikasi">
                <ShieldQuestion className="mr-2 h-4 w-4" />
                Buka Notifikasi
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
