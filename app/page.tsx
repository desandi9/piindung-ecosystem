import { Plus_Jakarta_Sans } from "next/font/google"
import { HomeLanding } from "@/components/piindung/home/home-landing"

// Plus Jakarta Sans juga dipakai layar masuk GORUT V2, sehingga landing dan aplikasi terasa satu keluarga.
const homeFont = Plus_Jakarta_Sans({ subsets: ["latin"], display: "swap" })

export default function Home() {
  return (
    <div className={`${homeFont.className} min-h-screen bg-white text-[#08213b] antialiased`}>
      <HomeLanding />
    </div>
  )
}
