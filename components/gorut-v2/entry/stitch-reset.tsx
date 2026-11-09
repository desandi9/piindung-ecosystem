/* Direct JSX port of design-references/gorut-stitch-entry/source/stitch_gorut_mobile_ui_design_system/gorut_reset_password_screen_interactive_animated/code.html. */
/* eslint-disable @next/next/no-img-element */
import type { FormEvent } from "react"
import { ArrowLeft, ArrowRight, RotateCw, UserRound, ContactRound, MapPin, MessageSquare } from "lucide-react"

type Props = {
  onReplay: () => void
  onBack: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  notice: string | null
  busy: boolean
  error: string | null
  nik: string
  setNik: (value: string) => void
}

export function StitchReset({ onReplay, onBack, onSubmit, notice, busy, error, nik, setNik }: Props) {
  return (<main className="screen-container select-none text-[#18252F] shadow-2xl pb-6">

<div id="toastNotification" className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 pointer-events-none max-w-[340px] w-[90%] ${notice ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`} role="status" aria-live="polite">
<div className="bg-[#0E2940]/95 backdrop-blur-md text-white text-[13px] font-semibold py-2.5 px-4 rounded-xl shadow-lg flex items-center justify-between border border-white/10">
<div className="flex items-center space-x-2">
<span className="w-2 h-2 rounded-full bg-[#05A987] animate-pulse"></span>
<span id="toastText" className="">{notice}</span>
</div>
<span className="text-[11px] text-emerald-300 font-normal">GORUT Helpdesk</span>
</div>
</div>

<div className="absolute bottom-0 inset-x-0 h-48 z-0 pointer-events-none overflow-hidden bg-linear-to-t from-[#E8F8F4]/60 via-[#F9FBFC]/30 to-transparent"></div>

<header className="relative z-20 pt-2 px-5">

<div className="flex justify-between items-center text-[#0E2940] text-xs font-semibold py-1 mb-1">
<span className="text-[14px] font-bold tracking-tight">9:41</span>
<div className="flex items-center space-x-1.5">

<svg className="w-4 h-3 fill-current" viewBox="0 0 17 12">
<rect height="4" rx="0.8" width="3" x="0" y="8" className=""></rect>
<rect height="6.5" rx="0.8" width="3" x="4.5" y="5.5" className=""></rect>
<rect height="9" rx="0.8" width="3" x="9" y="3" className=""></rect>
<rect height="11.5" rx="0.8" width="3" x="13.5" y="0.5" className=""></rect>
</svg>

<svg className="w-3.5 h-3 fill-current" viewBox="0 0 16 12">
<path d="M8 2.6c2.6 0 5 1 6.8 2.8l-1.5 1.5C11.9 5.5 10 4.7 8 4.7c-2 0-3.9.8-5.3 2.2L1.2 5.4C3 3.6 5.4 2.6 8 2.6zm0 4.2c1.4 0 2.8.6 3.8 1.6l-1.5 1.5c-.6-.6-1.4-.9-2.3-.9s-1.7.3-2.3.9L4.2 8.4c1-1 2.4-1.6 3.8-1.6zm0 4.3a1.4 1.4 0 1 1 0-2.8 1.4 1.4 0 0 1 0 2.8z" className=""></path>
</svg>

<div className="w-5 h-2.5 border border-current rounded-[3px] p-0.5 flex items-center relative">
<div className="h-full bg-current rounded-[1px] w-full"></div>
</div>
</div>
</div>

<div className="flex items-center justify-between mt-2.5">

<button aria-label="Kembali" className="w-10 h-10 rounded-full bg-white border border-[#E5EDF0] flex items-center justify-center text-[#0E2940] shadow-[0_1px_2px_0_rgb(0_0_0/0.05)] hover:bg-[#F3F6F8] active:scale-95 transition-all" id="btnBack" type="button" onClick={onBack}>
<ArrowLeft aria-hidden="true" className="stitch-material-icon text-[20px]" />
</button>

<div className="flex items-center space-x-2.5">
<button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 hover:bg-white text-[#079B78] border border-[#079B78]/30 shadow-xs text-xs font-semibold active:scale-95 transition-all cursor-pointer" id="btnReplay" type="button" onClick={onReplay}>
<RotateCw aria-hidden="true" className="stitch-material-icon text-[15px] transition-transform duration-300" />
<span className="">Putar Ulang</span>
</button>
<img alt="Logo GORUT" className="h-7 w-auto object-contain drop-shadow-xs" src="/images/gorut/entry/reset_password-0.png" />
</div>
</div>
</header>

<div className="relative z-20 px-5 pt-4 flex-1 flex flex-col justify-start">

<div className="mb-5 text-left motion-item stitch-cascade" id="animHeadline" style={{ animationDelay: "40ms" }}>
<h1 className="text-2xl font-bold text-[#0E2940] tracking-tight">Reset Kata Sandi</h1>
<p className="text-sm text-[#55636E] leading-relaxed mt-2">
        Lengkapi data identitas di bawah ini untuk verifikasi dan pemulihan akun oleh Admin GORUT via WhatsApp.
      </p>
</div>

<form className="space-y-4" id="resetForm" onSubmit={onSubmit} aria-busy={busy}>{error ? <p role="alert" className="stitch-form-error">{error}</p> : null}

<div className="motion-item stitch-cascade" id="field1" style={{ animationDelay: "100ms" }}>
<label className="block text-xs font-semibold text-[#18252F] uppercase tracking-wider mb-1.5 ml-0.5" htmlFor="inputName">Nama Lengkap</label>
<div className="field-container bg-white rounded-2xl border border-gray-200 p-3.5 flex items-center gap-3 focus-within:border-[#079B78] focus-within:ring-2 focus-within:ring-[#079B78]/20 transition-all duration-200 shadow-[0_1px_2px_0_rgb(0_0_0/0.05)]">
<UserRound aria-hidden="true" className="stitch-material-icon field-icon text-[#7A8790] text-[20px] shrink-0 transition-colors pointer-events-none" />
<input className="w-full bg-transparent p-0 text-[14px] text-[#18252F] border-0 focus:ring-0 placeholder:text-[#9AA8B4] focus:outline-none" id="inputName" placeholder="Masukkan nama lengkap" required type="text" name="fullName" autoComplete="name" />
</div>
</div>

<div className="motion-item stitch-cascade" id="field2" style={{ animationDelay: "160ms" }}>
<div className="flex items-center justify-between mb-1.5 ml-0.5">
<label className="block text-xs font-semibold text-[#18252F] uppercase tracking-wider" htmlFor="inputNIK">NIK (Nomor Induk Kependudukan)</label>
<span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${nik.length === 16 ? "text-emerald-800 bg-emerald-200" : "text-[#079B78] bg-[#E8F8F4]"}`} id="nikCounter">{nik.length}/16 digit</span>
</div>
<div className="field-container bg-white rounded-2xl border border-gray-200 p-3.5 flex items-center gap-3 focus-within:border-[#079B78] focus-within:ring-2 focus-within:ring-[#079B78]/20 transition-all duration-200 shadow-[0_1px_2px_0_rgb(0_0_0/0.05)]">
<ContactRound aria-hidden="true" className="stitch-material-icon field-icon text-[#7A8790] text-[20px] shrink-0 transition-colors pointer-events-none" />
<input className="w-full bg-transparent p-0 text-[14px] text-[#18252F] border-0 focus:ring-0 placeholder:text-[#9AA8B4] focus:outline-none tracking-wide" id="inputNIK" inputMode="numeric" maxLength={16} pattern="[0-9]{16}" placeholder="Masukkan 16 digit NIK" required type="text" name="nik" value={nik} onChange={(event) => setNik(event.target.value.replace(/\D/g, "").slice(0, 16))} aria-describedby="nikCounter" />
</div>
<p className="text-xs text-[#7A8790] mt-1 ml-0.5">Pastikan 16 digit sesuai e-KTP Anda.</p>
</div>

<div className="motion-item stitch-cascade" id="field3" style={{ animationDelay: "220ms" }}>
<label className="block text-xs font-semibold text-[#18252F] uppercase tracking-wider mb-1.5 ml-0.5" htmlFor="inputAddress">Alamat Domisili</label>
<div className="field-container bg-white rounded-2xl border border-gray-200 p-3.5 flex items-center gap-3 focus-within:border-[#079B78] focus-within:ring-2 focus-within:ring-[#079B78]/20 transition-all duration-200 shadow-[0_1px_2px_0_rgb(0_0_0/0.05)]">
<MapPin aria-hidden="true" className="stitch-material-icon field-icon text-[#7A8790] text-[20px] shrink-0 transition-colors pointer-events-none" />
<input className="w-full bg-transparent p-0 text-[14px] text-[#18252F] border-0 focus:ring-0 placeholder:text-[#9AA8B4] focus:outline-none" id="inputAddress" placeholder="Masukkan alamat lengkap (Kecamatan / Desa)" required type="text" name="address" autoComplete="street-address" />
</div>
</div>

<div className="motion-item stitch-cascade" id="field4" style={{ animationDelay: "280ms" }}>
<label className="block text-xs font-semibold text-[#18252F] uppercase tracking-wider mb-1.5 ml-0.5" htmlFor="inputPhone">No. WhatsApp / HP</label>
<div className="field-container bg-white rounded-2xl border border-gray-200 p-3.5 flex items-center gap-3 focus-within:border-[#079B78] focus-within:ring-2 focus-within:ring-[#079B78]/20 transition-all duration-200 shadow-[0_1px_2px_0_rgb(0_0_0/0.05)]">
<MessageSquare aria-hidden="true" className="stitch-material-icon field-icon text-[#7A8790] text-[20px] shrink-0 transition-colors pointer-events-none" />
<input className="w-full bg-transparent p-0 text-[14px] text-[#18252F] border-0 focus:ring-0 placeholder:text-[#9AA8B4] focus:outline-none" id="inputPhone" inputMode="tel" placeholder="Contoh: 08123456789" required type="tel" name="phone" autoComplete="tel" />
</div>
</div>

<div className="pt-2 motion-item stitch-cascade" id="fieldCTA" style={{ animationDelay: "340ms" }}>
<button className="w-full bg-linear-to-r from-[#079B78] to-[#05A987] rounded-2xl p-4 flex items-center justify-between text-white font-semibold shadow-lg shadow-emerald-700/20 active:scale-[0.98] transition-all cursor-pointer relative overflow-hidden group" id="btnSubmitWhatsApp" type="submit" disabled={busy}>
<div className="flex items-center gap-2.5">

<svg className="w-5 h-5 fill-current shrink-0" id="whatsappIcon" viewBox="0 0 24 24">
<path d="M12.031 2C6.5 2 2 6.484 2 12.016c0 1.954.557 3.782 1.524 5.331L2 22l4.821-1.488A9.97 9.97 0 0012.031 22C17.562 22 22 17.516 22 12.016 22 6.484 17.562 2 12.031 2zm5.727 14.167c-.237.669-1.378 1.28-1.921 1.339-.508.056-1.169.083-1.896-.15-3.083-.986-5.078-4.148-5.234-4.356-.151-.208-1.244-1.657-1.244-3.161s.786-2.247 1.066-2.553c.279-.307.61-.384.814-.384.203 0 .406.002.585.011.189.009.441-.072.69.525.254.611.865 2.112.94 2.268.077.155.127.337.025.543-.101.206-.153.334-.304.512-.152.179-.32.399-.458.536-.152.152-.31.317-.133.623.178.305.79 1.302 1.696 2.109 1.165 1.037 2.147 1.358 2.452 1.511.305.153.483.127.661-.076.178-.204.763-.889.966-1.194.204-.305.407-.254.686-.152.28.102 1.776.837 2.081.99.305.152.508.229.585.356.076.127.076.737-.161 1.406z" className=""></path>
</svg>
<span className="text-[14.5px]" id="btnText">{busy ? "Membuka WhatsApp…" : "Hubungi Admin via WhatsApp"}</span>
</div>
<ArrowRight aria-hidden="true" className="stitch-material-icon text-[20px] transition-transform group-hover:translate-x-1" />
</button>
</div>
</form>

<div className="text-center mt-4 mb-2 motion-item stitch-cascade" id="fieldBackLink" style={{ animationDelay: "380ms" }}>
<p className="text-[13px] text-[#55636E] font-medium">
        Sudah ingat kata sandi? <button className="underline text-[#079B78] font-semibold cursor-pointer ml-1 hover:text-emerald-700 transition-colors" id="linkBackLogin" type="button" onClick={onBack}>Masuk kembali</button>
</p>
</div>
</div>

<footer className="relative z-20 px-6 pt-1 pb-1 text-center">
<div className="flex justify-center items-center py-2">
<div className="w-32 h-1 bg-[#0E2940]/20 rounded-full"></div>
</div>
</footer>
</main>)
}
