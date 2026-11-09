/* Direct JSX port of design-references/gorut-stitch-entry/source/stitch_gorut_mobile_ui_design_system/gorut_login_screen_interactive_animated/code.html. */
/* eslint-disable @next/next/no-img-element */
import type { FormEvent } from "react"

type Props = {
  onBack: () => void
  onHelp: () => void
  onReset: () => void
  onGuest: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  notice: string | null
  busy: boolean
  error: string | null
  identifier: string
  setIdentifier: (value: string) => void
  password: string
  setPassword: (value: string) => void
  visible: boolean
  setVisible: (value: boolean) => void
  remember: boolean
  setRemember: (value: boolean) => void
  status: string
}

export function StitchLogin({ onBack, onHelp, onReset, onGuest, onSubmit, notice, busy, error, identifier, setIdentifier, password, setPassword, visible, setVisible, remember, setRemember, status }: Props) {
  return (<main className="mobile-screen shadow-[0_20px_25px_-5px_rgb(0_0_0/0.1),0_8px_10px_-6px_rgb(0_0_0/0.1)] relative select-none play-anim" data-purpose="gorut-login-screen" id="appScreen">

<div id="toastNotification" className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 pointer-events-none max-w-[340px] w-[90%] ${notice ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`} role="status" aria-live="polite">
<div className="bg-[#0E2940]/95 backdrop-blur-md text-white text-[13px] font-semibold py-2.5 px-4 rounded-xl stitch-shadow-toast flex items-center justify-between border border-white/10">
<div className="flex items-center space-x-2">
<span className="w-2 h-2 rounded-full bg-[#05A987] animate-pulse"></span>
<span id="toastText" className="">{notice}</span>
</div>
<span className="text-[11px] text-white/60 font-medium">GORUT</span>
</div>
</div>

<header className="relative z-30 flex justify-between items-center px-7 pt-3 pb-2 text-[#0E2940] entrance-node anim-topbar" data-purpose="ios-status-bar">
<span className="text-[15px] font-bold tracking-tight">9:41</span>
<div aria-label="System status icons" className="flex items-center space-x-1.5">

<svg className="w-4 h-3.5 fill-current" viewBox="0 0 17 12">
<rect height="4" rx="0.8" width="3" x="0" y="8" className=""></rect>
<rect height="6.5" rx="0.8" width="3" x="4.5" y="5.5" className=""></rect>
<rect height="9" rx="0.8" width="3" x="9" y="3" className=""></rect>
<rect height="11.5" rx="0.8" width="3" x="13.5" y="0.5" className=""></rect>
</svg>

<svg className="w-4 h-3.5 fill-current" viewBox="0 0 16 12">
<path d="M8 2.6c2.6 0 5 1 6.8 2.8l-1.5 1.5C11.9 5.5 10 4.7 8 4.7c-2 0-3.9.8-5.3 2.2L1.2 5.4C3 3.6 5.4 2.6 8 2.6zm0 4.2c1.4 0 2.8.6 3.8 1.6l-1.5 1.5c-.6-.6-1.4-.9-2.3-.9s-1.7.3-2.3.9L4.2 8.4c1-1 2.4-1.6 3.8-1.6zm0 4.3a1.4 1.4 0 1 1 0-2.8 1.4 1.4 0 0 1 0 2.8z" className=""></path>
</svg>

<div className="w-6 h-3 border border-current rounded-[4px] p-0.5 flex items-center relative">
<div className="h-full bg-current rounded-[2px] w-full"></div>
<div className="w-0.5 h-1.5 bg-current rounded-r-sm absolute -right-1 top-0.5"></div>
</div>
</div>
</header>

<nav className="relative z-30 flex items-center justify-between px-6 pt-1 pb-1 entrance-node anim-topbar" data-purpose="screen-header">
<button aria-label="Kembali" className="w-10 h-10 -ml-1 rounded-full flex items-center justify-center text-[#0E2940] hover:bg-slate-100 active:scale-90 transition-all focus:outline-none" id="btnBack" type="button" onClick={onBack}>
<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.3" viewBox="0 0 24 24">
<path d="M19 12H5m7 7l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" className=""></path>
</svg>
</button>

<div className="flex items-center space-x-2">

<button aria-label="Bantuan dan Pusat Informasi" className="w-9 h-9 rounded-full border border-slate-200/90 flex items-center justify-center text-[#0E2940] hover:bg-slate-100 active:scale-90 transition-all focus:outline-none" id="btnHelp" type="button" onClick={onHelp}>
<span className="text-[15px] font-bold text-[#0E2940]">?</span>
</button>
</div>
</nav>

<section className="relative z-20 flex flex-col items-center justify-center pt-2 pb-3 entrance-node anim-logo" data-purpose="brand-icon-header">
<div className="flex items-center justify-center w-full px-6 py-2">
<img alt="GORUT Gerakan Koin NU Garut" className="h-16 max-w-[210px] w-auto object-contain cursor-pointer active:scale-95 transition-transform drop-shadow-sm" id="appIcon" src="/images/gorut/entry/login-0.png" />
</div>
</section>

<section className="relative z-20 px-6 text-center" data-purpose="headline-section">
<h1 className="text-[25px] leading-tight font-extrabold text-[#0E2940] tracking-tight entrance-node anim-title">
      Masuk ke akun Anda
    </h1>
<p className="text-[12.5px] leading-relaxed text-[#7A8790] max-w-[285px] mx-auto mt-1.5 font-medium entrance-node anim-subtitle">
      Lanjutkan untuk berkontribusi bersama <span className="font-semibold text-slate-700">GERAKAN KOIN NU · GARUT</span>
</p>
</section>

<form className="relative z-20 px-6 mt-6 space-y-4" data-purpose="login-form" id="loginForm" onSubmit={onSubmit} aria-busy={busy}>{error ? <p role="alert" className="stitch-form-error">{error}</p> : null}

<div className="space-y-1 entrance-node anim-input-1">
<div className="relative flex items-center input-field-group bg-white rounded-2xl border border-[#D5DFE6] stitch-shadow-input transition-all">
<span className="absolute left-4 text-slate-400 pointer-events-none flex items-center">

<svg className="w-5 h-5 text-[#8898A5] input-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
<path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round" className=""></path>
</svg>
</span>
<input className="w-full h-[52px] pl-12 pr-4 bg-transparent text-[#0E2940] text-[14px] font-medium placeholder-[#9AA6AF] border-0 rounded-2xl focus:ring-0 focus:outline-none" id="phoneInput" name="phone" placeholder="Masukkan no HP" required type="text" autoComplete="username" aria-label="Nomor HP / Username" value={identifier} onChange={(event) => setIdentifier(event.target.value)} />
</div>
</div>

<div className="space-y-1 entrance-node anim-input-2">
<div className="relative flex items-center input-field-group bg-white rounded-2xl border border-[#D5DFE6] stitch-shadow-input transition-all">
<span className="absolute left-4 text-slate-400 pointer-events-none flex items-center">

<svg className="w-5 h-5 text-[#8898A5] input-icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
<rect height="11" rx="2" ry="2" width="18" x="3" y="11" className=""></rect>
<path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round" strokeLinejoin="round" className=""></path>
</svg>
</span>
<input autoComplete="current-password" className="w-full h-[52px] pl-12 pr-12 bg-transparent text-[#0E2940] text-[14px] font-medium placeholder-[#9AA6AF] border-0 rounded-2xl focus:ring-0 focus:outline-none" id="passwordInput" name="password" placeholder="Masukkan password" required aria-label="Password" type={visible ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} />

<button aria-label="Tampilkan atau sembunyikan kata sandi" className="absolute right-3.5 p-1.5 text-[#8898A5] hover:text-[#0E2940] active:scale-90 transition-all focus:outline-none" id="togglePassword" type="button" onClick={() => setVisible(!visible)} aria-pressed={visible}>

<svg fill="none" id="eyeIcon" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className={visible ? "hidden" : "w-5 h-5 transition-transform duration-200"}>
<path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" className=""></path>
<path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" strokeLinecap="round" strokeLinejoin="round" className=""></path>
</svg>

<svg fill="none" id="eyeOffIcon" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" className={visible ? "w-5 h-5 transition-transform duration-200" : "hidden"}>
<path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" strokeLinecap="round" strokeLinejoin="round" className=""></path>
</svg>
</button>
</div>
</div>

<div className="flex items-center justify-between pt-0.5 px-0.5 entrance-node anim-aux" data-purpose="form-auxiliary">
<label className="inline-flex items-center cursor-pointer select-none group">
<div className="relative flex items-center justify-center">
<input className="sr-only peer" id="rememberMe" type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} />
<div className="w-4 h-4 rounded bg-[#079B78] peer-checked:bg-[#079B78] border border-[#079B78] peer-checked:border-[#079B78] checkbox-spring flex items-center justify-center shadow-xs peer-not-checked:bg-white peer-not-checked:border-[#CAD4DC]">
<svg fill="none" id="checkIconSvg" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24" className={`w-2.5 h-2.5 text-white transition-transform duration-200 ${remember ? "scale-100" : "scale-0"}`}>
<path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" className=""></path>
</svg>
</div>
</div>
<span className="ml-2 text-[13px] font-medium text-[#0E2940] group-hover:text-black transition-colors">Ingat saya</span>
</label>
<button className="text-[13px] font-semibold text-[#079B78] hover:text-[#058a6a] active:opacity-70 transition-colors focus:outline-none" id="btnForgot" type="button" onClick={onReset}>
        Lupa Password? <span className="underline underline-offset-2">Reset</span>
</button>
</div>

<div className="pt-2 entrance-node anim-btn-submit">
<button className="btn-tap w-full h-[52px] rounded-full btn-gradient-primary text-white font-bold text-[15px] flex items-center justify-center relative stitch-shadow-btn-primary animate-pulse-glow cursor-pointer focus:outline-none group overflow-hidden" id="btnSubmit" type="submit" disabled={busy || status === "success"}>
<span className="transition-opacity duration-200 flex items-center justify-center space-x-1.5" id="btnSubmitText" aria-live="polite">{status === "success" ? <svg className="w-5 h-5 text-white animate-bounce" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> : null}{busy ? "" : status === "success" ? "Berhasil!" : "Masuk"}</span>

<span id="btnSpinner" className={busy ? "flex items-center justify-center absolute inset-0" : "hidden"}>
<svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
<path className="opacity-75" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" fill="currentColor"></path>
</svg>
</span>

<svg className="w-5 h-5 absolute right-5 stroke-[2.5] arrow-icon" fill="none" id="btnSubmitArrow" stroke="currentColor" viewBox="0 0 24 24" style={{ opacity: busy ? 0 : 1 }}>
<path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" className=""></path>
</svg>
</button>
</div>

<div className="relative flex py-2 items-center justify-center entrance-node anim-divider">
<div className="grow border-t border-[#E5ECF0]"></div>
<span className="shrink mx-4 text-[#8C9BA5] text-[13px] font-normal">atau</span>
<div className="grow border-t border-[#E5ECF0]"></div>
</div>

<div className="entrance-node anim-btn-guest">
<button className="btn-tap w-full h-[50px] rounded-full bg-white border border-[#D5DFE6] text-[#0E2940] font-bold text-[15px] flex items-center justify-center relative stitch-shadow-btn-secondary hover:border-[#079B78]/60 cursor-pointer focus:outline-none" id="btnGuest" type="button" onClick={onGuest}>
<span className="">Lanjut sebagai Tamu</span>

<svg className="w-5 h-5 absolute right-5 stroke-[2.5] text-[#0E2940] guest-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" className=""></path>
</svg>
</button>
</div>
</form>

<div className="flex-1 min-h-[32px]"></div>

<section className="relative z-10 mt-auto overflow-hidden" data-purpose="scenic-footer">

<div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
<div className="ambient-dot absolute bottom-24 left-10 w-2 h-2 rounded-full bg-[#05A987]/30 blur-[1px]"></div>
<div className="ambient-dot absolute bottom-16 right-12 w-2.5 h-2.5 rounded-full bg-[#079B78]/25 blur-[1px]" style={{"animationDelay": "1.5s"}}></div>
<div className="ambient-dot absolute bottom-32 right-1/3 w-1.5 h-1.5 rounded-full bg-[#0E2940]/20 blur-[0.5px]" style={{"animationDelay": "2.3s"}}></div>
</div>

<div className="relative z-20 text-center px-6 pt-2 pb-2 entrance-node anim-quote">
<p className="text-[13px] italic font-medium text-[#0E2940]/85 drop-shadow-sm tracking-wide">
        “Kebaikan kecil, bisa mengubah banyak hal.”
      </p>
</div>

<div className="relative h-[145px] w-full overflow-hidden pointer-events-none entrance-node anim-scenic">
<img alt="Garut Landscape Scenic Bottom" className="w-full h-full object-cover object-bottom" src="/images/gorut/entry/login-1.png" />

<div className="absolute inset-0 scenic-bottom-gradient"></div>
</div>
</section>

<footer className="relative z-20 flex justify-center items-center py-2 bg-transparent" data-purpose="ios-home-indicator">
<div className="w-32 h-1 bg-[#0E2940]/30 rounded-full hover:bg-[#0E2940]/50 transition-colors cursor-pointer"></div>
</footer>
</main>)
}
