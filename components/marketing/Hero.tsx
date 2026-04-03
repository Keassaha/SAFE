"use client";

import { motion, useInView } from "framer-motion";
import {
  Shield,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

/* ═══════════════════════════════════════════════
   HERO COMPONENT
   ═══════════════════════════════════════════════ */
export function Hero() {

  return (
    <section className="section-morning relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Grain texture */}
      <div className="landing-grain absolute inset-0 z-10 pointer-events-none" />

      {/* Gradient mesh blobs — soft greens on light background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] rounded-full bg-[#8EB69B] opacity-15 blur-[120px] animate-[blob-drift-1_18s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#235347] opacity-8 blur-[100px] animate-[blob-drift-2_22s_ease-in-out_infinite]" />
        <div className="absolute top-[30%] left-[20%] w-[400px] h-[400px] rounded-full bg-[#DAF1DE] opacity-30 blur-[80px] animate-[blob-drift-3_15s_ease-in-out_infinite]" />
      </div>

      {/* Subtle grid overlay */}
      <div className="absolute inset-0 landing-grid opacity-30 pointer-events-none" />

      <div className="relative z-20 mx-auto max-w-7xl px-6 lg:px-10 pt-32 pb-20 lg:pt-40 lg:pb-32">
        <div className="max-w-4xl mx-auto text-center">
          {/* Compliance badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full landing-badge mb-8"
          >
            <Shield className="w-4 h-4 text-[var(--safe-sage)]" />
            <span className="text-sm text-[var(--safe-sage)] font-medium font-jakarta">
              Conforme au Règlement B-1 r.5 et à la Loi 25
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-instrument text-5xl md:text-7xl lg:text-[5.5rem] leading-[1.05] tracking-[-0.02em] text-[var(--safe-white)] mb-8"
          >
            Le logiciel de gestion conçu pour les{" "}
            <span className="italic text-[var(--safe-sage)]">
              avocats en droit familial
            </span>{" "}
            au Québec
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg lg:text-xl text-[var(--safe-text-muted)] max-w-2xl mx-auto mb-12 leading-relaxed font-jakarta"
          >
            Facturation conforme, comptes en fidéicommis, échéanciers — tout dans une seule
            plateforme pensée pour votre pratique.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/demo"
              className="group flex items-center gap-2 px-8 py-4 text-base font-semibold rounded-full bg-[var(--safe-accent)] text-[var(--safe-lightest)] hover:bg-[var(--safe-sage)] hover:text-[var(--safe-darkest)] transition-all duration-300 shadow-xl shadow-[var(--safe-accent)]/25 font-jakarta"
            >
              Réserver une démo
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/audit-gratuit"
              className="flex items-center gap-2 px-8 py-4 text-base font-medium rounded-full border border-[var(--safe-sage)]/30 text-[var(--safe-sage)] hover:border-[var(--safe-sage)]/60 hover:bg-[var(--safe-sage)]/5 transition-all duration-300 font-jakarta"
            >
              Audit gratuit
            </Link>
          </motion.div>
        </div>

        {/* ═══ SPACE FOR ANIMATED BACKGROUND (user-created) ═══ */}
        <div className="mt-20 lg:mt-28 max-w-5xl mx-auto" />
      </div>
    </section>
  );
}
