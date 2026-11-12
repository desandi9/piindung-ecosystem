import Image from "next/image"
import { Heart } from "lucide-react"
import "./login.css"

function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M12 0c1 7 5 11 12 12-7 1-11 5-12 12-1-7-5-11-12-12 7-1 11-5 12-12Z" fill="currentColor" />
    </svg>
  )
}

function Coin() {
  return (
    <svg viewBox="0 0 40 40" className="h-full w-full drop-shadow-[0_4px_6px_rgba(120,80,0,.35)]" aria-hidden="true">
      <defs>
        <linearGradient id="login-coin-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe9a3" />
          <stop offset=".5" stopColor="#f2c14e" />
          <stop offset="1" stopColor="#d39a1f" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="18.5" fill="url(#login-coin-gold)" stroke="#b9861c" strokeWidth="1.5" />
      <circle cx="20" cy="20" r="13.5" fill="none" stroke="#fff1c2" strokeWidth="1.2" opacity=".85" />
      <path d="m20 11.5 2.5 5.2 5.7.8-4.1 4 1 5.6-5.1-2.7-5.1 2.7 1-5.6-4.1-4 5.7-.8Z" fill="#fff8de" />
    </svg>
  )
}

/** Kaleng koin GORUT — digambar sendiri agar ringan dan tajam di semua ukuran. */
function CoinCan() {
  return (
    <svg viewBox="0 0 100 132" className="h-full w-full drop-shadow-[0_14px_14px_rgba(10,60,35,.28)]" aria-hidden="true">
      <defs>
        <linearGradient id="login-can-body" x1="0" x2="1">
          <stop offset="0" stopColor="#0a5f3b" />
          <stop offset=".38" stopColor="#17a466" />
          <stop offset=".7" stopColor="#0f8a55" />
          <stop offset="1" stopColor="#084f31" />
        </linearGradient>
        <linearGradient id="login-can-lid" x1="0" x2="1">
          <stop offset="0" stopColor="#1bb673" />
          <stop offset="1" stopColor="#0d7a4b" />
        </linearGradient>
      </defs>
      <path d="M8 20v94a42 11 0 0 0 84 0V20Z" fill="url(#login-can-body)" />
      <rect x="8" y="52" width="84" height="36" fill="#fbfdf9" />
      <text x="50" y="69" textAnchor="middle" fontSize="13" fontWeight="800" fill="#0b6b43" letterSpacing=".5">KOIN NU</text>
      <text x="50" y="81" textAnchor="middle" fontSize="6.4" fontWeight="700" fill="#466457" letterSpacing="1">LAZISNU GARUT</text>
      <rect x="15" y="26" width="6" height="86" rx="3" fill="#fff" opacity=".2" />
      <ellipse cx="50" cy="20" rx="42" ry="11" fill="url(#login-can-lid)" />
      <ellipse cx="50" cy="20" rx="42" ry="11" fill="none" stroke="#0a5f3b" strokeWidth="1.5" />
      <rect x="33" y="17" width="34" height="6" rx="3" fill="#04301e" />
    </svg>
  )
}

function Plant() {
  return (
    <svg viewBox="0 0 80 140" className="h-full w-full" aria-hidden="true">
      <path d="M40 100C29 72 27 42 35 8c7 30 9 62 5 92Z" fill="#4caf6e" />
      <path d="M40 100c9-28 17-52 30-74-4 32-14 56-30 74Z" fill="#2f8a57" />
      <path d="M40 100C31 82 18 64 7 46c16 13 27 31 33 54Z" fill="#3d9d63" />
      <path d="M40 100c3-22 6-42 14-64 2 26-2 46-14 64Z" fill="#62c482" />
      <path d="M20 98h40l-5 40H25Z" fill="#eef2ee" />
      <path d="M44 98h16l-5 40H45Z" fill="#d6ddd8" />
      <rect x="17" y="94" width="46" height="8" rx="3" fill="#f8faf8" />
    </svg>
  )
}

/** Adegan ilustrasi halaman masuk: dekoratif sepenuhnya, konten form ada di kartu. */
export function LoginScene() {
  return (
    <div aria-hidden="true" className="relative h-[300px] overflow-hidden sm:h-[360px] md:h-[400px] lg:absolute lg:inset-0 lg:h-auto">
      <div className="absolute inset-0 bg-[linear-gradient(172deg,#f3fbe6_0%,#e1f4c8_42%,#c6e9a6_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(55%_45%_at_18%_8%,rgba(255,255,255,.85),transparent_70%)]" />
      <div className="absolute inset-x-0 bottom-0 h-[27%] bg-[linear-gradient(180deg,#2f8a57,#1b5c39)] [clip-path:polygon(0_40%,100%_6%,100%_100%,0_100%)]" />

      <div className="login-scene-in absolute inset-0 lg:right-[calc(min(460px,38vw)+48px)] xl:right-[calc(min(460px,38vw)+64px)]">
        <div className="relative mx-auto h-full w-full max-w-[1000px]">
        <div className="absolute left-[47%] top-[7%] hidden aspect-square w-[clamp(64px,15%,124px)] place-items-center sm:grid rounded-full border-[5px] border-white/90 bg-white shadow-[0_18px_30px_-12px_rgba(20,70,40,.35)]">
          <Image src="/images/login/lazisnu-emblem.webp" alt="" width={360} height={190} className="h-auto w-[78%]" />
        </div>
        <Sparkle className="login-twinkle absolute left-[41%] top-[9%] w-[2.4%] min-w-2.5 text-[#7cc243]" />
        <Sparkle className="login-twinkle absolute left-[66%] top-[6%] w-[3%] min-w-3 text-white [animation-delay:.8s]" />
        <Sparkle className="login-twinkle absolute left-[63%] top-[22%] w-[2%] min-w-2 text-[#7cc243] [animation-delay:1.5s]" />
        <Sparkle className="login-twinkle absolute left-[8%] top-[14%] w-[2.6%] min-w-2.5 text-white [animation-delay:.4s]" />

        <div className="absolute bottom-[17%] left-[13%] h-[64%]">
          <Image src="/images/login/mascot-wave.webp" alt="" width={560} height={996} priority className="login-mascot h-full w-auto drop-shadow-[0_24px_30px_rgba(20,60,35,.28)]" />
        </div>

        <div className="login-bubble absolute left-[46%] top-[9%] z-20 max-w-[48%] sm:top-[27%] sm:max-w-[42%] lg:top-[28%] lg:max-w-[38%]">
          <div className="login-bubble-float relative rounded-[18px] rounded-bl-[6px] bg-white px-3.5 py-2.5 text-[12px] font-semibold leading-snug text-[#08213b] shadow-[0_16px_30px_-14px_rgba(20,70,40,.45)] sm:px-4 sm:py-3 sm:text-[14px]">
            Assalamu&apos;alaikum! <span className="font-medium text-[#3d5a4b]">Selamat datang di PIINDUNG.</span>
          </div>
        </div>

        <div className="absolute bottom-[7%] left-[5%] h-[17%] w-[58%]">
          <div className="h-[20%] rounded-t-[10px] bg-[linear-gradient(180deg,#2c7a50,#1e5e3c)] shadow-[0_8px_14px_-8px_rgba(0,0,0,.45)]" />
          <div className="relative mx-[3%] flex h-[80%] items-center justify-center rounded-b-[14px] bg-[linear-gradient(180deg,#f7fbf3,#dde9d6)] shadow-[0_20px_30px_-18px_rgba(10,40,25,.55)]">
            <span className="absolute inset-x-0 top-0 h-[12%] bg-[#7cc243]" />
            <span className="absolute inset-y-[22%] left-[22%] w-px bg-[#1e5e3c]/10" />
            <span className="absolute inset-y-[22%] right-[22%] w-px bg-[#1e5e3c]/10" />
            <span className="text-[clamp(7px,1.3vw,12px)] font-extrabold tracking-[.18em] text-[#1e5e3c]">NU CARE–LAZISNU GARUT</span>
          </div>
        </div>

        <div className="absolute bottom-[22.5%] left-[50%] aspect-[100/132] w-[11%]">
          <div className="login-can h-full w-full"><CoinCan /></div>
          {/* Tepi bawah area ini = garis celah kaleng, jadi koin terpotong saat "masuk". */}
          <div className="absolute -inset-x-[40%] bottom-[84.5%] h-[260%] overflow-hidden">
            <div className="login-coin absolute bottom-0 left-1/2 aspect-square w-[24%]"><Coin /></div>
          </div>
          <Heart className="login-heart absolute -top-[18%] left-1/2 h-[26%] w-[26%] fill-[#ef5a6f] text-[#ef5a6f]" />
        </div>

        <div className="absolute bottom-[4%] left-[69%] h-[36%] w-[13%]"><Plant /></div>
        </div>
      </div>
    </div>
  )
}
