/* Direct JSX port of design-references/gorut-stitch-entry/source/stitch_gorut_mobile_ui_design_system/gorut_welcome_screen_interactive_animated/code.html. */
/* eslint-disable @next/next/no-img-element */

type Props = {
  onReplay: () => void
  onLogin: () => void
  onGuest: () => void
  notice: string | null
  dot: number
  setDot: (value: number) => void
  card: string | null
  setCard: (value: string | null) => void
}

export function StitchWelcome({ onReplay, onLogin, onGuest, notice, dot, setDot, card, setCard }: Props) {
  return (<main className="screen-container shadow-2xl relative select-none" data-purpose="mobile-welcome-screen">

<div className="absolute inset-x-0 top-0 h-[520px] z-0 overflow-hidden pointer-events-none" data-purpose="scenic-background">
<img alt="Garut Scenic Landscape" className="w-full h-full object-cover object-[center_top] ken-burns-bg" id="scenicImage" src="/images/gorut/entry/welcome-0.png" />

<div className="absolute inset-0 scenic-gradient-blend"></div>
</div>

<div id="toastNotification" className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 pointer-events-none max-w-[340px] w-[90%] ${notice ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`} role="status" aria-live="polite">
<div className="bg-[#0E2940]/95 backdrop-blur-md text-white text-[13px] font-semibold py-2.5 px-4 rounded-xl stitch-shadow-toast flex items-center justify-between border border-white/10">
<div className="flex items-center space-x-2">
<span className="w-2 h-2 rounded-full bg-[#0BBDA0] animate-pulse"></span>
<span id="toastText" className="">{notice}</span>
</div>
<span className="text-xs text-[#E8F8F4]/80 font-normal">GORUT ID</span>
</div>
</div>

<div className="relative z-30 pt-1.5 px-5 flex justify-end">
<button aria-label="Putar Ulang Animasi" className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold text-[#0E2940]/70 bg-white/80 hover:bg-white active:scale-95 backdrop-blur-md rounded-full border border-white/60 shadow-[0_1px_2px_0_rgb(0_0_0/0.05)] transition-all hover:text-[#0E2940]" id="replayBtn" title="Putar Ulang Animasi" type="button" onClick={onReplay}>
<svg className="w-3.5 h-3.5 text-[#079B78] transition-transform duration-500" fill="none" stroke="currentColor" strokeWidth="2.3" viewBox="0 0 24 24">
<path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round" className=""></path>
</svg>
<span className="">Putar Ulang</span>
</button>
</div>

<header className="relative z-20 flex justify-between items-center px-7 pt-1.5 pb-2 text-[#0E2940]" data-purpose="ios-status-bar">

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


<section className="relative z-20 flex justify-center items-center mt-1 mb-3" data-purpose="brand-logo-header">
<div className="motion-item flex items-center justify-center bg-white/95 backdrop-blur-md px-5 py-2 rounded-full border border-white/90 shadow-[0_1px_2px_0_rgb(0_0_0/0.05)] transition-transform hover:scale-105 active:scale-95 cursor-pointer stitch-cascade" id="animLogo" style={{ animationDelay: "0ms" }}>
<img alt="Logo GORUT" className="h-8 w-auto object-contain" src="/images/gorut/entry/welcome-1.png" />
</div>
</section>


<section className="relative z-20 text-center px-6" data-purpose="hero-copy">
<div className="motion-item stitch-cascade" id="animHeadline" style={{ animationDelay: "150ms" }}>
<h1 className="text-[30px] leading-[1.18] font-extrabold tracking-tight drop-shadow-sm">
<span className="text-[#0E2940] block">Kecil koinnya.</span>
<span className="text-[#079B78] block">Luas manfaatnya.</span>
</h1>
</div>
<div className="motion-item stitch-cascade" id="animSubtext" style={{ animationDelay: "300ms" }}>
<p className="text-[#18252F] text-[13.5px] leading-relaxed max-w-[295px] mx-auto mt-2 font-medium drop-shadow-sm">
      Bersama masyarakat, wujudkan pendidikan, sosial, dan pemberdayaan yang lebih baik untuk Garut.
    </p>
</div>

<div aria-label="Halaman carousel" className="motion-item flex items-center justify-center space-x-2 mt-3.5 mb-1 stitch-cascade" id="animDots" role="tablist" style={{ animationDelay: "420ms" }}>
<button aria-label="Slide 1" data-dot-idx="0" role="tab" type="button" onClick={() => setDot(0)} aria-selected={dot === 0} className={`dot-btn h-2 rounded-full transition-all duration-300 focus:outline-none ${dot === 0 ? "w-5 bg-[#05A987]" : "w-2 bg-[#0E2940]/20 hover:bg-[#0E2940]/40"}`}></button>
<button aria-label="Slide 2" data-dot-idx="1" role="tab" type="button" onClick={() => setDot(1)} aria-selected={dot === 1} className={`dot-btn h-2 rounded-full transition-all duration-300 focus:outline-none ${dot === 1 ? "w-5 bg-[#05A987]" : "w-2 bg-[#0E2940]/20 hover:bg-[#0E2940]/40"}`}></button>
<button aria-label="Slide 3" data-dot-idx="2" role="tab" type="button" onClick={() => setDot(2)} aria-selected={dot === 2} className={`dot-btn h-2 rounded-full transition-all duration-300 focus:outline-none ${dot === 2 ? "w-5 bg-[#05A987]" : "w-2 bg-[#0E2940]/20 hover:bg-[#0E2940]/40"}`}></button>
</div>
</section>


<div className="h-16 sm:h-20 pointer-events-none"></div>

<section className="relative z-20 px-5 space-y-2.5 mt-auto" data-purpose="benefit-cards-list">

<article className="motion-item benefit-card flex items-center p-3.5 bg-white/95 backdrop-blur-md rounded-2xl border border-[#E5EDF0] stitch-shadow-card cursor-pointer group stitch-cascade" data-card="transparan" id="animCard1" style={{ animationDelay: "520ms" }} onClick={() => setCard(card === "transparan" ? null : "transparan")} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setCard(card === "transparan" ? null : "transparan"); } }} role="button" tabIndex={0} aria-pressed={card === "transparan"} data-selected={card === "transparan"}>

<div className="icon-box w-11 h-11 rounded-xl bg-[#E8F8F4] flex items-center justify-center shrink-0 mr-3.5 transition-transform duration-300">
<svg className="w-6 h-6 text-[#05A987]" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
<path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round" className=""></path>
</svg>
</div>

<div className="text-left flex-1">
<div className="flex items-center justify-between">
<h2 className="text-[#0E2940] font-bold text-[15px] leading-tight">Transparan</h2>
<span className="card-check opacity-0 transition-opacity duration-200 text-[#079B78]">
<svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd" className=""></path></svg>
</span>
</div>
<p className="text-[#6C7B87] text-[12.5px] mt-0.5 leading-snug font-medium">Setiap hasil tercatat dengan jelas.</p>
</div>
</article>

<article className="motion-item benefit-card flex items-center p-3.5 bg-white/95 backdrop-blur-md rounded-2xl border border-[#E5EDF0] stitch-shadow-card cursor-pointer group stitch-cascade" data-card="terarah" id="animCard2" style={{ animationDelay: "640ms" }} onClick={() => setCard(card === "terarah" ? null : "terarah")} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setCard(card === "terarah" ? null : "terarah"); } }} role="button" tabIndex={0} aria-pressed={card === "terarah"} data-selected={card === "terarah"}>

<div className="icon-box w-11 h-11 rounded-xl bg-[#E8F8F4] flex items-center justify-center shrink-0 mr-3.5 transition-transform duration-300">
<svg className="w-6 h-6 text-[#05A987]" fill="currentColor" viewBox="0 0 24 24">
<path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z" className=""></path>
</svg>
</div>

<div className="text-left flex-1">
<div className="flex items-center justify-between">
<h2 className="text-[#0E2940] font-bold text-[15px] leading-tight">Terarah</h2>
<span className="card-check opacity-0 transition-opacity duration-200 text-[#079B78]">
<svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd" className=""></path></svg>
</span>
</div>
<p className="text-[#6C7B87] text-[12.5px] mt-0.5 leading-snug font-medium">Disalurkan melalui jaringan yang aman.</p>
</div>
</article>

<article className="motion-item benefit-card flex items-center p-3.5 bg-white/95 backdrop-blur-md rounded-2xl border border-[#E5EDF0] stitch-shadow-card cursor-pointer group stitch-cascade" data-card="berdampak" id="animCard3" style={{ animationDelay: "760ms" }} onClick={() => setCard(card === "berdampak" ? null : "berdampak")} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setCard(card === "berdampak" ? null : "berdampak"); } }} role="button" tabIndex={0} aria-pressed={card === "berdampak"} data-selected={card === "berdampak"}>

<div className="icon-box w-11 h-11 rounded-xl bg-[#E8F8F4] flex items-center justify-center shrink-0 mr-3.5 transition-transform duration-300">
<svg className="w-6 h-6 text-[#05A987]" fill="currentColor" viewBox="0 0 24 24">
<path d="M4 19h4V12H4v7zm6 0h4V5h-4v14zm6 0h4v-9h-4v9zM2 21h20v-2H2v2z" className=""></path>
</svg>
</div>

<div className="text-left flex-1">
<div className="flex items-center justify-between">
<h2 className="text-[#0E2940] font-bold text-[15px] leading-tight">Berdampak Nyata</h2>
<span className="card-check opacity-0 transition-opacity duration-200 text-[#079B78]">
<svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path clipRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fillRule="evenodd" className=""></path></svg>
</span>
</div>
<p className="text-[#6C7B87] text-[12.5px] mt-0.5 leading-snug font-medium">Untuk pendidikan, sosial, dan kesejahteraan masyarakat Garut.</p>
</div>
</article>
</section>


<section className="motion-item relative z-20 px-5 pt-4 pb-2 space-y-2.5 stitch-cascade" data-purpose="cta-actions" id="animCta" style={{ animationDelay: "880ms" }}>

<button className="group-btn w-full h-[52px] rounded-2xl btn-gradient-primary text-white font-bold text-[15px] flex items-center justify-center relative stitch-shadow-btn-primary active:scale-[0.98] transition-transform overflow-hidden cursor-pointer" data-purpose="primary-login-button" id="btnLogin" type="button" onClick={onLogin}>

<div className="shimmer-layer"></div>
<span className="">Masuk ke GORUT</span>

<svg className="arrow-icon w-5 h-5 absolute right-5 stroke-[2.5] transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" className=""></path>
</svg>
</button>

<button className="group-btn w-full h-[50px] rounded-2xl bg-white border border-[#D5DFE6] text-[#0E2940] font-bold text-[15px] flex items-center justify-center relative active:bg-gray-50 active:scale-[0.98] transition-all hover:border-[#079B78]/50 cursor-pointer" data-purpose="secondary-guest-button" id="btnGuest" type="button" onClick={onGuest}>
<span className="">Lanjut sebagai Tamu</span>

<svg className="arrow-icon w-5 h-5 absolute right-5 stroke-[2.5] transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
<path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" className=""></path>
</svg>
</button>
</section>


<footer className="relative z-20 flex justify-center items-center py-2.5 mt-auto" data-purpose="ios-home-indicator">
<div className="w-32 h-1 bg-[#0E2940]/25 rounded-full hover:bg-[#0E2940]/40 transition-colors cursor-pointer"></div>
</footer>

</main>)
}
