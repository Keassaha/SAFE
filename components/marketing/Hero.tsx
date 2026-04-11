"use client";

import { motion } from "framer-motion";
import { useRef } from "react";
import {
  Shield,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

/* ═══════════════════════════════════════════════
   HERO COMPONENT — clean, fast, no scroll gimmicks
   ═══════════════════════════════════════════════ */
export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      ref={sectionRef}
      className="section-morning relative min-h-[100vh] flex items-center justify-center overflow-hidden"
    >
      {/* Grain texture */}
      <div className="landing-grain absolute inset-0 z-10 pointer-events-none" />

      {/* Gradient mesh blobs — static, no parallax, GPU-friendly */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] lg:w-[800px] lg:h-[800px] rounded-full bg-[#8EB69B] opacity-15 blur-[80px] will-change-transform" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#235347] opacity-8 blur-[60px] will-change-transform" />
        <div className="absolute top-[30%] left-[20%] w-[400px] h-[400px] rounded-full bg-[#DAF1DE] opacity-30 blur-[60px] will-change-transform" />
      </div>

      <div className="relative z-20 mx-auto max-w-7xl px-4 sm:px-6 lg:px-10 pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pt-40 lg:pb-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Compliance badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full landing-badge mb-8"
          >
            <Shield className="w-4 h-4 text-[var(--safe-sage)]" />
            <span className="text-sm text-[var(--safe-sage)] font-medium font-sans">
              Conforme au Règlement B-1 r.5 et à la Loi 25
            </span>
          </motion.div>

          {/* Pain point hook — tension immediate */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="text-base sm:text-lg text-[var(--safe-text-muted)] max-w-2xl mx-auto mb-4 sm:mb-5 font-sans"
          >
            10h récupérées par mois. Fidéicommis réconcilié en 1 clic. Inspection prête en permanence.
          </motion.p>

          {/* Headline — fully visible on load, simple fade-in */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="font-sans text-3xl sm:text-4xl md:text-5xl lg:text-7xl leading-[1.08] tracking-[-0.02em] text-[var(--safe-white)] mb-6 sm:mb-8"
          >
            Passez l&apos;inspection du Barreau{" "}
            <span className="italic text-[var(--safe-sage)]">
              les yeux fermés.
            </span>
          </motion.h1>

          {/* Subtitle — solution with specificity */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="text-base sm:text-lg lg:text-xl text-[var(--safe-text-muted)] max-w-2xl mx-auto mb-3 leading-relaxed font-sans"
          >
            Facturation, fidéicommis et conformité au Barreau automatisés.
            Vous pratiquez le droit, SAFE s&apos;occupe du reste.
          </motion.p>

          {/* Social proof micro-line */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-sm text-[var(--safe-sage)]/60 mb-8 sm:mb-12 font-sans"
          >
            Conforme B-1 r.5 · Hébergé au Canada · Compatible Québec et Ontario
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/audit-gratuit"
              className="group flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base font-semibold rounded-full bg-[var(--safe-accent)] text-[var(--safe-lightest)] hover:bg-[var(--safe-sage)] hover:text-[var(--safe-darkest)] transition-all duration-300 shadow-xl shadow-[var(--safe-accent)]/25 font-sans"
            >
              Faire mon audit gratuit
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/demo"
              className="group flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base font-medium rounded-full border border-[var(--safe-sage)]/30 text-[var(--safe-sage)] hover:border-[var(--safe-sage)]/60 hover:bg-[var(--safe-sage)]/5 transition-all duration-300 font-sans"
            >
              <Sparkles className="w-4 h-4" />
              Réserver une démo
            </Link>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 1 }}
            className="mt-20 flex flex-col items-center gap-2"
          >
            <span className="text-xs text-[var(--safe-sage)]/50 font-sans">Défiler</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              className="w-5 h-8 rounded-full border border-[var(--safe-sage)]/20 flex items-start justify-center p-1"
            >
              <motion.div className="w-1 h-2 rounded-full bg-[var(--safe-sage)]/40" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
