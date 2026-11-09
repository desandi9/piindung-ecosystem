/* Direct JSX port of design-references/gorut-stitch-entry/source/stitch_gorut_mobile_ui_design_system/gorut_splash_screen_interactive_animated/code.html. */
/* eslint-disable @next/next/no-img-element */

export function StitchSplash() {
  return (<main className="relative w-full max-w-[390px] h-[884px] max-h-[844px] flex flex-col justify-between overflow-hidden bg-sky-100 shadow-2xl transition-all duration-700 ease-out" data-purpose="splash-screen-root" id="splash-stage">

<div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" data-purpose="scenic-background">
<img alt="Pemandangan Alam Garut" className="w-full h-full object-cover object-bottom anim-bg" id="bg-img" src="/images/gorut/entry/splash-0.png" />

<div className="absolute inset-0 bg-linear-to-b from-white/35 via-white/10 to-white/95 z-[1]"></div>
<div className="absolute inset-x-0 bottom-0 h-52 bg-linear-to-t from-white via-white/85 to-transparent z-[2]"></div>
</div>


<div className="relative z-30 flex flex-col w-full">

<header className="safe-top px-7 pt-3 flex justify-between items-center text-slate-900 text-[14px] font-semibold tracking-tight" data-purpose="ios-status-bar">
<span className="tracking-normal font-medium">9:41</span>
<div className="flex items-center space-x-1.5" data-purpose="status-icons">

<svg className="w-4 h-3.5 fill-current" viewBox="0 0 17 12">
<rect height="3" rx="0.5" width="2.5" x="0" y="9" className=""></rect>
<rect height="6" rx="0.5" width="2.5" x="4" y="6" className=""></rect>
<rect height="9" rx="0.5" width="2.5" x="8" y="3" className=""></rect>
<rect height="12" rx="0.5" width="2.5" x="12" y="0" className=""></rect>
</svg>

<svg className="w-4 h-3.5 fill-current" viewBox="0 0 16 12">
<path d="M8 2.5C10.7 2.5 13.1 3.6 14.8 5.4L16 4.1C13.9 2 11.1 0.7 8 0.7C4.9 0.7 2.1 2 0 4.1L1.2 5.4C2.9 3.6 5.3 2.5 8 2.5ZM8 6C9.8 6 11.4 6.7 12.6 7.9L13.8 6.6C12.3 5.2 10.3 4.2 8 4.2C5.7 4.2 3.7 5.2 2.2 6.6L3.4 7.9C4.6 6.7 6.2 6 8 6ZM8 9.5C8.9 9.5 9.7 9.9 10.3 10.5L8 12.8L5.7 10.5C6.3 9.9 7.1 9.5 8 9.5Z" className=""></path>
</svg>

<div className="flex items-center">
<div className="w-5 h-2.5 border-[1.5px] border-slate-900 rounded-[3.5px] p-[1px] flex items-center">
<div className="h-full w-full bg-slate-900 rounded-[1px]"></div>
</div>
<div className="w-0.5 h-1 bg-slate-900 rounded-r-[1px] ml-[0.5px]"></div>
</div>
</div>
</header>

</div>


<section className="relative z-20 flex-1 flex flex-col items-center justify-center px-6 -mt-4" data-purpose="center-branding-block">
<div className="relative flex flex-col items-center">

<div className="relative w-28 h-28 mb-4 anim-icon flex items-center justify-center" id="brand-icon-wrap">

<div className="absolute -inset-2 bg-linear-to-tr from-[#05A987]/30 to-[#82f8cf]/40 rounded-[32px] blur-xl anim-glow -z-10 pointer-events-none"></div>
<img alt="GORUT Icon" className="w-full h-full object-contain filter drop-shadow-[0_12px_22px_rgba(7,155,120,0.28)]" src="/images/gorut/entry/splash-1.png" />
</div>

<h1 className="text-[#0E2940] text-[34px] font-extrabold tracking-[-0.02em] leading-none text-center mb-2.5 anim-title" id="brand-title">
        GORUT
      </h1>

<p className="text-center text-[15px] leading-snug font-semibold text-[#18252F] max-w-[260px] drop-shadow-sm anim-tagline" id="brand-tagline">Kolaborasi untuk Garut<br className="" /><span className="text-[#079B78]">yang Lebih Baik</span></p>
</div>
</section>


<footer className="relative z-20 safe-bottom flex flex-col items-center pb-2 w-full px-6" data-purpose="bottom-status-and-partners">

<div className="flex flex-col items-center w-full mb-6 anim-loader" data-purpose="progress-container" id="loader-block">

<div className="w-36 h-1.5 bg-slate-200/90 rounded-full overflow-hidden relative shadow-inner">

<div className="h-full bg-linear-to-r from-[#079B78] to-[#0BBDA0] rounded-full relative overflow-hidden anim-progress-fill shadow-[0_0_10px_rgba(11,189,160,0.65)]" id="progress-bar-fill">

<div className="absolute inset-y-0 w-12 bg-linear-to-r from-transparent via-white/80 to-transparent skew-x-[-20deg] anim-sheen"></div>
</div>
</div>

<p className="mt-2.5 text-[12.5px] font-medium text-[#55636E] tracking-tight flex items-center">
<span className="">Memuat kebaikan untuk Garut</span>
<span className="inline-flex w-4 ml-0.5 font-bold tracking-widest text-[#079B78]">
<span className="animate-[pulse_1.2s_infinite]">.</span>
<span className="animate-[pulse_1.2s_infinite_200ms]">.</span>
<span className="animate-[pulse_1.2s_infinite_400ms]">.</span>
</span>
</p>
</div>

<div className="flex flex-col items-center mb-3 anim-footer" data-purpose="institutional-endorsement" id="endorsement-block">
<span className="text-[11px] font-medium text-[#7A8790] tracking-wider mb-2">
        Didukung oleh
      </span>

<div className="flex items-center justify-center space-x-4">

<div className="flex items-center hover:opacity-90 transition-opacity" data-purpose="partner-piindung">
<img alt="PIINDUNG - Pusat Instalasi dan Informasi Donasi Unggulan Nahdliyyin Garut" className="h-6 w-auto object-contain" src="/images/gorut/entry/splash-2.png" />
</div>
<span aria-hidden="true" className="h-5 w-[1px] bg-slate-300"></span>

<div className="flex items-center hover:opacity-90 transition-opacity" data-purpose="partner-lazisnu">
<img alt="NU CARE-LAZISNU Kabupaten Garut" className="h-7 w-auto object-contain" src="/images/gorut/entry/splash-3.png" />
</div>
</div>
</div>

<div aria-hidden="true" className="w-32 h-1 bg-slate-900/30 rounded-full mt-2" data-purpose="home-indicator"></div>
</footer>




</main>)
}
