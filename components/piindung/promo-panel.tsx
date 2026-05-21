"use client"

import Image from "next/image"
import Link from "next/link"

// Social media icon components
function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  )
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  )
}

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
    </svg>
  )
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  )
}

const socialLinks = [
  { 
    href: "https://www.instagram.com/lazisnu_garut", 
    icon: InstagramIcon, 
    label: "Instagram" 
  },
  { 
    href: "https://www.facebook.com/share/19DfHJXcBV/?mibextid=wwXIfr", 
    icon: FacebookIcon, 
    label: "Facebook" 
  },
  { 
    href: "https://www.tiktok.com/@nucare.lazisnu.garut", 
    icon: TikTokIcon, 
    label: "TikTok" 
  },
  { 
    href: "https://wa.me/6285600335066", 
    icon: WhatsAppIcon, 
    label: "WhatsApp" 
  },
]

export function PromoPanel() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-[#0f3460] via-[#16213e] to-[#0a1628] flex flex-col justify-between p-8 lg:p-12">
      {/* Wave Pattern Background */}
      <div className="absolute inset-0 pointer-events-none">
        <svg 
          className="absolute bottom-0 left-0 w-full h-64" 
          viewBox="0 0 1440 320" 
          preserveAspectRatio="none"
        >
          <path 
            fill="white" 
            fillOpacity="0.05" 
            d="M0,160L48,170.7C96,181,192,203,288,192C384,181,480,139,576,128C672,117,768,139,864,165.3C960,192,1056,224,1152,213.3C1248,203,1344,149,1392,122.7L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>
        <svg 
          className="absolute bottom-0 left-0 w-full h-48" 
          viewBox="0 0 1440 320" 
          preserveAspectRatio="none"
        >
          <path 
            fill="white" 
            fillOpacity="0.03" 
            d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,218.7C672,235,768,245,864,234.7C960,224,1056,192,1152,181.3C1248,171,1344,181,1392,186.7L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>
        {/* Additional subtle wave layers */}
        <svg 
          className="absolute top-1/3 left-0 w-full h-32 opacity-50" 
          viewBox="0 0 1440 100" 
          preserveAspectRatio="none"
        >
          <path 
            fill="none"
            stroke="white" 
            strokeOpacity="0.08" 
            strokeWidth="1"
            d="M0,50 Q360,30 720,50 T1440,50"
          />
        </svg>
        <svg 
          className="absolute top-1/2 left-0 w-full h-32 opacity-40" 
          viewBox="0 0 1440 100" 
          preserveAspectRatio="none"
        >
          <path 
            fill="none"
            stroke="white" 
            strokeOpacity="0.06" 
            strokeWidth="1"
            d="M0,50 Q360,70 720,50 T1440,50"
          />
        </svg>
      </div>

      {/* Top - NU Care Logo */}
      <div className="relative z-10 flex justify-end">
        <Image
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo%20lazisnu-JxqxvRKWCesa1Jpn7vKWzkEUJI6LH1.png"
          alt="NU Care-LAZISNU Kabupaten Garut"
          width={180}
          height={80}
          className="h-auto w-36 lg:w-44"
        />
      </div>

      {/* Middle - Main Content */}
      <div className="relative z-10 flex-1 flex flex-col justify-center">
        <h1 className="text-5xl lg:text-6xl font-bold text-white tracking-tight mb-6">
          PIINDUNG
        </h1>
        
        <div className="w-16 h-1 bg-[#2e8b57] mb-6" />
        
        <h2 className="text-xl lg:text-2xl text-white/90 font-medium leading-relaxed mb-4">
          Pusat Instalasi dan Informasi<br />
          Donasi Unggulan Nahdliyyin Garut
        </h2>

        <p className="text-lg lg:text-xl text-[#2e8b57] italic font-medium mb-8">
          {'"Amanah Terkelola, Manfaat Tersampaikan."'}
        </p>

        <p className="text-base lg:text-lg text-white/80 leading-relaxed max-w-lg">
          Platform digital untuk mengelola donasi dan kegiatan
          filantropi secara transparan, akuntabel, dan terintegrasi
          di Kabupaten Garut.
        </p>
      </div>

      {/* Bottom - Social Icons with Premium Hover Effects */}
      <div className="relative z-10 flex justify-end">
        <div className="flex items-center gap-4">
          {socialLinks.map((social) => (
            <Link
              key={social.label}
              href={social.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.label}
              className="group relative flex items-center justify-center w-11 h-11 rounded-full bg-white/5 border border-white/10 transition-all duration-300 ease-out hover:-translate-y-1 hover:bg-white/10 hover:border-white/20 hover:shadow-lg hover:shadow-white/5"
            >
              <social.icon className="w-5 h-5 text-white/70 transition-all duration-300 ease-out group-hover:text-white group-hover:scale-110" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
