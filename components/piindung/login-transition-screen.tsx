"use client"

import Image from "next/image"
import { useEffect, useState } from "react"

const MESSAGES = [
  "Memverifikasi identitas Anda...",
  "Menyiapkan dashboard...",
  "Memuat data terkini...",
  "Hampir selesai...",
]

export function LoginTransitionScreen() {
  const [msgIdx, setMsgIdx] = useState(0)
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // fade in
    const t0 = setTimeout(() => setVisible(true), 30)

    // progress animation — mencapai ~92% dalam 1.1 detik lalu berhenti
    const start = performance.now()
    const duration = 1100
    let raf: number
    const tick = (now: number) => {
      const elapsed = now - start
      const pct = Math.min(92, (elapsed / duration) * 92)
      setProgress(pct)
      if (pct < 92) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    // pesan berganti tiap 320ms
    const msgTimer = setInterval(() => {
      setMsgIdx((i) => (i + 1) % MESSAGES.length)
    }, 320)

    return () => {
      clearTimeout(t0)
      cancelAnimationFrame(raf)
      clearInterval(msgTimer)
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-[120] overflow-hidden"
      style={{
        opacity: visible ? 1 : 0,
        transition: "opacity 0.35s ease",
        background: "linear-gradient(135deg, #0a1628 0%, #0d2137 40%, #0f3460 70%, #1a4a3a 100%)",
      }}
    >
      {/* Ambient glow blobs */}
      <div
        className="absolute rounded-full"
        style={{
          width: 520,
          height: 520,
          top: -120,
          right: -140,
          background: "radial-gradient(circle, rgba(46,139,87,0.22) 0%, transparent 70%)",
          filter: "blur(40px)",
          animation: "lt-float 4s ease-in-out infinite alternate",
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: 420,
          height: 420,
          bottom: -100,
          left: -80,
          background: "radial-gradient(circle, rgba(15,52,96,0.35) 0%, transparent 70%)",
          filter: "blur(50px)",
          animation: "lt-float 5s ease-in-out infinite alternate-reverse",
        }}
      />

      {/* Floating particles */}
      {[...Array(18)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            width: i % 3 === 0 ? 3 : i % 3 === 1 ? 2 : 1.5,
            height: i % 3 === 0 ? 3 : i % 3 === 1 ? 2 : 1.5,
            left: `${5 + (i * 5.5) % 90}%`,
            bottom: "-8px",
            background:
              i % 2 === 0
                ? "rgba(46,139,87,0.7)"
                : "rgba(255,255,255,0.35)",
            animation: `lt-particle ${3.5 + (i % 5) * 0.7}s ease-in ${(i * 0.23) % 3.5}s infinite`,
          }}
        />
      ))}

      {/* Center card */}
      <div className="relative flex min-h-screen items-center justify-center px-6">
        <div
          className="w-full max-w-sm text-center"
          style={{ animation: "lt-fadein-up 0.45s cubic-bezier(.16,1,.3,1) both" }}
        >
          {/* Logo with ripple rings */}
          <div className="relative mx-auto mb-8 flex h-28 w-28 items-center justify-center">
            {/* Ripple ring 1 */}
            <div
              className="absolute inset-0 rounded-full border border-[#2e8b57]/40"
              style={{ animation: "lt-ripple 1.8s ease-out 0s infinite" }}
            />
            {/* Ripple ring 2 */}
            <div
              className="absolute inset-0 rounded-full border border-[#2e8b57]/25"
              style={{ animation: "lt-ripple 1.8s ease-out 0.6s infinite" }}
            />
            {/* Ripple ring 3 */}
            <div
              className="absolute inset-0 rounded-full border border-[#2e8b57]/15"
              style={{ animation: "lt-ripple 1.8s ease-out 1.2s infinite" }}
            />

            {/* Glow behind logo */}
            <div
              className="absolute inset-2 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(46,139,87,0.4) 0%, transparent 75%)",
                filter: "blur(12px)",
                animation: "lt-pulse-glow 2s ease-in-out infinite",
              }}
            />

            {/* Logo container */}
            <div
              className="relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl"
              style={{
                background: "linear-gradient(145deg, rgba(255,255,255,0.12), rgba(255,255,255,0.05))",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.15)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.3), 0 0 24px rgba(46,139,87,0.2)",
                animation: "lt-logo-pulse 2s ease-in-out infinite",
              }}
            >
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/LOGO%20PIINDUNG%20BIRU.-RwIMUrRjgQyDRv216W7LDokN9BO9L4.png"
                alt="PIINDUNG"
                width={80}
                height={80}
                className="h-auto"
                style={{ width: "3rem", height: "auto", filter: "brightness(1.15)" }}
                priority
              />
            </div>
          </div>

          {/* Brand */}
          <p
            className="mb-1 text-xs font-bold uppercase tracking-[0.35em]"
            style={{ color: "rgba(46,139,87,0.9)", letterSpacing: "0.35em" }}
          >
            PIINDUNG
          </p>
          <h2
            className="mb-2 text-2xl font-semibold"
            style={{ color: "rgba(255,255,255,0.95)" }}
          >
            Menyiapkan Dashboard
          </h2>

          {/* Dynamic message */}
          <p
            key={msgIdx}
            className="mb-10 text-sm"
            style={{
              color: "rgba(255,255,255,0.5)",
              animation: "lt-msg-in 0.28s ease both",
            }}
          >
            {MESSAGES[msgIdx]}
          </p>

          {/* Progress bar */}
          <div
            className="mx-auto w-64 overflow-hidden rounded-full"
            style={{
              height: 4,
              background: "rgba(255,255,255,0.1)",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                borderRadius: 9999,
                background: "linear-gradient(90deg, #2e8b57, #4ade80, #2e8b57)",
                backgroundSize: "200% 100%",
                transition: "width 0.08s linear",
                animation: "lt-shimmer 1.4s linear infinite",
                boxShadow: "0 0 12px rgba(46,139,87,0.7)",
              }}
            />
          </div>

          {/* Dots indicator */}
          <div className="mt-5 flex items-center justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-full"
                style={{
                  width: 5,
                  height: 5,
                  background: "rgba(46,139,87,0.8)",
                  animation: `lt-dot-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes lt-float {
          from { transform: translateY(0) scale(1); }
          to   { transform: translateY(-30px) scale(1.06); }
        }
        @keyframes lt-particle {
          0%   { transform: translateY(0) scale(1); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 0.6; }
          100% { transform: translateY(-110vh) scale(0.4); opacity: 0; }
        }
        @keyframes lt-ripple {
          0%   { transform: scale(1);   opacity: 0.7; }
          100% { transform: scale(2.6); opacity: 0; }
        }
        @keyframes lt-pulse-glow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%      { opacity: 1;   transform: scale(1.15); }
        }
        @keyframes lt-logo-pulse {
          0%, 100% { box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 0 24px rgba(46,139,87,0.2); }
          50%      { box-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 0 40px rgba(46,139,87,0.45); }
        }
        @keyframes lt-fadein-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lt-msg-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes lt-shimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        @keyframes lt-dot-bounce {
          0%, 80%, 100% { transform: scale(0.7); opacity: 0.4; }
          40%            { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
