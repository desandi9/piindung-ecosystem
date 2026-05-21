"use client"

import { type FormEvent, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/piindung/navbar"
import { SimpleFooter } from "@/components/piindung/simple-footer"
import { cn } from "@/lib/utils"
import { addInboxMessage } from "@/lib/admin-inbox"
import { useHelpFaqCategories, type HelpFaqCategory, type HelpFaqIconKey } from "@/lib/faq-manager"
import {
  ChevronLeft,
  ChevronDown,
  HelpCircle,
  MessageCircle,
  Mail,
  Phone,
  FileText,
  Users,
  Shield,
  CreditCard,
  Settings,
  ExternalLink,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

// Quick Help Cards Data
const quickHelpCards = [
  {
    title: "Panduan Pengguna",
    description: "Pelajari cara menggunakan fitur-fitur PIINDUNG",
    icon: FileText,
    href: "#faq-bantuan",
  },
  {
    title: "Video Tutorial",
    description: "Tonton video panduan langkah demi langkah",
    icon: HelpCircle,
    href: "#bantuan-langsung",
  },
  {
    title: "FAQ Lengkap",
    description: "Temukan jawaban pertanyaan umum",
    icon: MessageCircle,
    href: "#faq-bantuan",
  },
]

export default function BantuanPage() {
  const router = useRouter()
  const faqCategories = useHelpFaqCategories()
  const [openFaq, setOpenFaq] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" })
  const [formError, setFormError] = useState<string | null>(null)
  const [submitState, setSubmitState] = useState<"idle" | "success">("idle")

  const toggleFaq = (id: string) => {
    setOpenFaq(openFaq === id ? null : id)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!form.email.trim() && !form.phone.trim()) {
      setFormError("Isi email atau nomor WhatsApp agar tim support dapat membalas.")
      return
    }

    addInboxMessage({
      source: "Bantuan",
      title: `Permintaan bantuan dari ${form.name.trim()}`,
      senderName: form.name.trim(),
      senderEmail: form.email.trim(),
      senderPhone: form.phone.trim(),
      message: form.message.trim(),
    })

    setForm({ name: "", email: "", phone: "", message: "" })
    setFormError(null)
    setSubmitState("success")
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      
      <main className="container mx-auto max-w-5xl flex-1 px-4 py-6 lg:py-8">
        {/* Back Navigation */}
        <Button
          variant="ghost"
          size="sm"
          className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
          onClick={() => router.back()}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Kembali
        </Button>

        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold">Pusat Bantuan</h1>
          <p className="text-muted-foreground mt-1">Temukan jawaban dan hubungi tim support kami</p>
        </div>

        <div className="space-y-6">
          {/* Quick Help Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickHelpCards.map((card) => (
              <Link key={card.title} href={card.href} className="block">
                <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer group">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                        <card.icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                          {card.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {card.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Contact Admin Section */}
          <Card id="bantuan-langsung" className="shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-[#2e8b57] to-[#3da06a] p-6 lg:p-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="text-white">
                  <h2 className="text-xl lg:text-2xl font-bold mb-2">Butuh Bantuan Langsung?</h2>
                  <p className="text-white/80 text-sm lg:text-base">
                    Tim support kami siap membantu Anda 24/7
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {/* WhatsApp Button */}
                  <Button 
                    asChild
                    className="bg-white text-[#25D366] hover:bg-white/90 font-semibold gap-2"
                  >
                    <a 
                      href="https://wa.me/6281234567890?text=Halo,%20saya%20butuh%20bantuan%20terkait%20PIINDUNG" 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      WhatsApp
                    </a>
                  </Button>
                  
                  {/* Email Button */}
                  <Button 
                    asChild
                    variant="outline"
                    className="bg-white/10 border-white/30 text-white hover:bg-white/20 font-semibold gap-2"
                  >
                    <a href="mailto:support@piindung.id">
                      <Mail className="h-5 w-5" />
                      Email Support
                    </a>
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Contact Details */}
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Telepon</p>
                    <p className="font-medium">+62 812-3456-7890</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">support@piindung.id</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl">
                  <div className="p-2 rounded-lg bg-[#25D366]/10 text-[#25D366]">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">WhatsApp</p>
                    <p className="font-medium">+62 812-3456-7890</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FAQ Section */}
          <Card id="faq-bantuan" className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                Pertanyaan yang Sering Diajukan (FAQ)
              </CardTitle>
              <CardDescription>Temukan jawaban cepat untuk pertanyaan umum</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {faqCategories.map((category) => (
                <div key={category.id} className="border border-border rounded-xl overflow-hidden">
                  {(() => {
                    const CategoryIcon = categoryIcon(category.iconKey)

                    return (
                      <>
                  {/* Category Header */}
                  <div className="flex items-center gap-3 p-4 bg-muted/30">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <CategoryIcon className="h-4 w-4" />
                    </div>
                    <h3 className="font-semibold">{category.title}</h3>
                  </div>
                  
                  {/* Questions */}
                  <div className="divide-y divide-border">
                    {category.questions.map((faq, idx) => {
                      const faqId = `${category.id}-${idx}`
                      const isOpen = openFaq === faqId
                      
                      return (
                        <div key={faqId}>
                          <button
                            onClick={() => toggleFaq(faqId)}
                            className="w-full flex items-center justify-between p-4 text-left hover:bg-accent/50 transition-colors"
                          >
                            <span className="font-medium text-sm pr-4">{faq.q}</span>
                            <ChevronDown 
                              className={cn(
                                "h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200",
                                isOpen && "rotate-180"
                              )} 
                            />
                          </button>
                          <div 
                            className={cn(
                              "overflow-hidden transition-all duration-200",
                              isOpen ? "max-h-40" : "max-h-0"
                            )}
                          >
                            <p className="px-4 pb-4 text-sm text-muted-foreground">
                              {faq.a}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                      </>
                    )
                  })()}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Additional Support */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Masih Butuh Bantuan?</CardTitle>
              <CardDescription>Hubungi administrator untuk masalah yang lebih kompleks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild className="flex-1 gap-2 bg-[#2e8b57] hover:bg-[#256b45]">
                  <a 
                    href="https://wa.me/6281234567890?text=Halo,%20saya%20butuh%20bantuan%20terkait%20PIINDUNG" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Chat via WhatsApp
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
                <Button asChild variant="outline" className="flex-1 gap-2">
                  <a href="mailto:support@piindung.id">
                    <Mail className="h-4 w-4" />
                    Kirim Email
                  </a>
                </Button>
                <Button asChild variant="outline" className="flex-1 gap-2">
                  <a href="tel:+6281234567890">
                    <Phone className="h-4 w-4" />
                    Telepon
                  </a>
                </Button>
              </div>

              <div className="mt-6 border-t border-border pt-6">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-foreground">Kirim Pesan ke Tim Support</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Pesan bantuan akan otomatis masuk ke inbox Admin Dashboard.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Input
                      value={form.name}
                      onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                      placeholder="Nama lengkap"
                      required
                      className="rounded-xl"
                    />
                    <Input
                      value={form.email}
                      onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                      placeholder="Email aktif"
                      type="email"
                      className="rounded-xl"
                    />
                  </div>

                  <Input
                    value={form.phone}
                    onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                    placeholder="Nomor WhatsApp"
                    className="rounded-xl"
                  />

                  <Textarea
                    value={form.message}
                    onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
                    placeholder="Jelaskan kendala atau pertanyaan Anda"
                    required
                    className="min-h-32 rounded-xl"
                  />

                  {formError ? <p className="text-xs text-destructive">{formError}</p> : null}
                  {submitState === "success" ? (
                    <p className="text-xs text-[#2e8b57]">Pesan bantuan berhasil dikirim ke admin.</p>
                  ) : null}

                  <div className="flex justify-end">
                    <Button type="submit" className="gap-2 rounded-xl bg-[#2e8b57] hover:bg-[#256b45]">
                      <MessageCircle className="h-4 w-4" />
                      Kirim ke Admin
                    </Button>
                  </div>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <SimpleFooter />
    </div>
  )
}

function categoryIcon(iconKey: HelpFaqIconKey) {
  if (iconKey === "credit-card") return CreditCard
  if (iconKey === "shield") return Shield
  if (iconKey === "settings") return Settings
  return Users
}
