"use client";

import { motion } from "framer-motion";
import { useRef } from "react";
import {
  ArrowRight,
  Sparkles,
  BadgeCheck,
  MapPin,
} from "lucide-react";
import Link from "next/link";

/* ═══════════════════════════════════════════════
   HERO — bold type, soft entrance, premium dark feel
   ═══════════════════════════════════════════════ */

const ease = [0.16, 1, 0.3, 1] as const;
// Le CTA "Réserver un appel" pointe vers la page de contact —
// le formulaire envoie directement à jeremie@safecabinet.ca.
const BOOK_CALL_HREF = "/contact";

export function Hero() {
  const sectionRef = useRef<HTMLElement>(null);

  return (
    <section
      ref={sectionRef}
      className="section-night relative min-h-[100dvh] flex items-center justify-center overflow-hidden"
    >
      {/* Grain texture */}
      <div className="landing-grain absolute inset-0 z-10 pointer-events-none" />

      {/* Gradient mesh blobs — muted on dark bg */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] lg:w-[800px] lg:h-[800px] rounded-full bg-[#8EB69B] opacity-[0.08] blur-[120px] will-change-transform" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#235347] opacity-[0.06] blur-[100px] will-change-transform" />
        <div className="absolute top-[30%] left-[20%] w-[400px] h-[400px] rounded-full bg-[#DAF1DE] opacity-[0.05] blur-[100px] will-change-transform" />
      </div>

      <div className="relative z-20 mx-auto max-w-5xl px-6 sm:px-8 lg:px-12 py-32 sm:py-40 lg:py-48">
        <div className="max-w-4xl mx-auto text-center">
          {/* Double-pill Barreau badge — warm gold, proéminent */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease }}
            className="inline-flex items-center gap-0 rounded-full mb-10 sm:mb-14 overflow-hidden bg-[rgba(142,182,155,0.08)] border border-[rgba(142,182,155,0.3)] text-[var(--safe-sage)] shadow-[0_0_20px_rgba(142,182,155,0.15)]"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2.5">
              <BadgeCheck className="w-4 h-4 shrink-0" />
              <span className="text-sm font-semibold font-sans tracking-wide">
                Conforme Barreau du Qu&eacute;bec
              </span>
            </span>
            <span
              aria-hidden
              className="h-5 w-px bg-[rgba(142,182,155,0.35)]"
            />
            <span className="inline-flex items-center gap-2 px-4 py-2.5">
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="text-sm font-medium font-sans tracking-wide">
                Donn&eacute;es h&eacute;berg&eacute;es au Canada
              </span>
            </span>
          </motion.div>

          {/* Headline — 92px on desktop, bold, tight tracking */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.1, ease }}
            className="font-sans font-bold text-4xl sm:text-5xl md:text-6xl lg:text-[5.5rem] xl:text-[5.75rem] leading-[1.04] tracking-[-0.03em] text-[var(--safe-white)] mb-8 sm:mb-10"
          >
            Votre cabinet,{" "}
            <span className="italic text-[var(--safe-sage)]">simplifi&eacute;.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.22, ease }}
            className="text-base sm:text-lg lg:text-xl text-[var(--safe-text-muted)] max-w-2xl mx-auto mb-4 leading-relaxed font-sans"
          >
            On comprend votre r&eacute;alit&eacute;. On &eacute;limine ce qui vous ralentit.
            Vous gagnez du temps et de l&apos;argent.
          </motion.p>

          {/* CTAs — warm gold primary, ghost secondary */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.35, ease }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-14"
          >
            <Link
              href="/audit-gratuit"
              className="btn-sage group relative flex items-center gap-2.5 px-8 py-4 sm:px-10 sm:py-5 text-base sm:text-lg rounded-full font-sans active:scale-[0.98]"
            >
              Faire mon audit gratuit
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href={BOOK_CALL_HREF}
              className="group flex items-center gap-2.5 px-8 py-4 sm:px-10 sm:py-5 text-base sm:text-lg font-medium rounded-full border border-[var(--safe-sage)]/25 text-[var(--safe-sage)] transition-all duration-300 hover:border-[var(--safe-sage)]/50 hover:bg-[var(--safe-sage)]/5 hover:scale-[1.02] active:scale-[0.98] font-sans"
            >
              <Sparkles className="w-5 h-5" />
              R&eacute;server un appel
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
