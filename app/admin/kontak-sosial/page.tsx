"use client"

import { FormEvent, useEffect, useState } from "react"
import { Clock, Facebook, Instagram, Mail, MapPin, MessageCircle, Music2, Save } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { addActivityLog } from "@/lib/activity-log"
import { useAuth } from "@/lib/auth-context"
import { useContactSocialSettings, writeContactSocialSettings, whatsappHref, type ContactSocialSettings } from "@/lib/contact-social"

export default function KontakSosialPage() {
  const settings = useContactSocialSettings()
  const { user } = useAuth()
  const [form, setForm] = useState<ContactSocialSettings>(settings)

  useEffect(() => {
    setForm(settings)
  }, [settings])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    writeContactSocialSettings(form)
    addActivityLog({ userName: user?.name || "Admin", type: "Settings", action: "Memperbarui Kontak & Sosial Media", status: "Success" })
  }

  return (
    <DashboardLayout>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <MessageCircle className="h-4 w-4 text-primary" />
              Kontak Publik Portal
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Kontak & Sosial Media</h1>
            <p className="text-sm text-muted-foreground mt-1">Kelola nomor WhatsApp, email, alamat, maps, sosial media, dan jam layanan homepage.</p>
          </div>
          <Button type="submit" className="gap-2 rounded-xl bg-primary hover:bg-primary/90 shadow-sm hover:shadow-lg hover:shadow-primary/20">
            <Save className="h-4 w-4" />
            Simpan Perubahan
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Informasi Kontak</CardTitle>
              <CardDescription>Data ini tampil di halaman kontak, footer, dan tombol sosial media.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field icon={MessageCircle} label="WhatsApp Number" htmlFor="whatsapp">
                <Input id="whatsapp" value={form.whatsapp} onChange={(event) => setForm({ ...form, whatsapp: event.target.value })} required />
              </Field>
              <Field icon={Mail} label="Email" htmlFor="email">
                <Input id="email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
              </Field>
              <Field icon={MapPin} label="Address" htmlFor="address" className="sm:col-span-2">
                <Textarea id="address" value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} required />
              </Field>
              <Field icon={MapPin} label="Google Maps Link" htmlFor="maps-link" className="sm:col-span-2">
                <Input id="maps-link" value={form.googleMapsLink} onChange={(event) => setForm({ ...form, googleMapsLink: event.target.value })} required />
              </Field>
              <Field icon={MapPin} label="Google Maps Embed URL" htmlFor="maps-embed" className="sm:col-span-2">
                <Input id="maps-embed" value={form.googleMapsEmbed} onChange={(event) => setForm({ ...form, googleMapsEmbed: event.target.value })} required />
              </Field>
              <Field icon={Clock} label="Office Hours" htmlFor="office-hours" className="sm:col-span-2">
                <Textarea id="office-hours" value={form.officeHours} onChange={(event) => setForm({ ...form, officeHours: event.target.value })} required />
              </Field>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Sosial Media</CardTitle>
                <CardDescription>Link tombol sosial media homepage/footer.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Field icon={Instagram} label="Instagram" htmlFor="instagram"><Input id="instagram" value={form.instagram} onChange={(event) => setForm({ ...form, instagram: event.target.value })} /></Field>
                <Field icon={Music2} label="TikTok" htmlFor="tiktok"><Input id="tiktok" value={form.tiktok} onChange={(event) => setForm({ ...form, tiktok: event.target.value })} /></Field>
                <Field icon={Facebook} label="Facebook" htmlFor="facebook"><Input id="facebook" value={form.facebook} onChange={(event) => setForm({ ...form, facebook: event.target.value })} /></Field>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-border shadow-sm transition-all duration-300 hover:border-primary/30 hover:shadow-md">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
                <CardTitle className="text-lg">Live Preview</CardTitle>
                <CardDescription>Preview kontak yang akan tampil setelah disimpan.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 p-4 text-sm text-muted-foreground">
                <p className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-primary" />{form.whatsapp}</p>
                <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" />{form.email}</p>
                <p className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 text-primary" /><span>{form.address}</span></p>
                <a href={whatsappHref(form.whatsapp)} target="_blank" rel="noopener noreferrer" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                  <MessageCircle className="h-4 w-4" />
                  Test WhatsApp Link
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </DashboardLayout>
  )
}

function Field({ icon: Icon, label, htmlFor, className, children }: { icon: typeof Mail; label: string; htmlFor: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor} className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        {label}
      </Label>
      {children}
    </div>
  )
}
