"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { HeroVideo } from "@/components/landing/HeroVideo";
import { Button } from "@/components/ui/Button";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] as const },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.11, delayChildren: 0.06 } },
};

export function Hero() {
  return (
    <section className="relative flex min-h-[min(100dvh,920px)] items-center justify-center overflow-hidden pt-20 pb-16 md:pt-24">
      {/* Fond vidéo HLS/MP4 (optionnel) */}
      <HeroVideo />

      {/* Subtle radial glow for depth */}
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(255,255,255,0.08),transparent_60%)]"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_100%_60%_at_50%_-10%,rgba(218,119,86,0.1),transparent_55%)]"
        aria-hidden
      />

      {/* Grille Linear */}
      <div className="absolute inset-0 landing-grid pointer-events-none opacity-[0.15]" />

      {/* Blobs mesh */}
      <div className="absolute inset-0 overflow-hidden landing-grain">
        <div className="landing-blob landing-blob-1 opacity-[0.2]" />
        <div className="landing-blob landing-blob-2 opacity-[0.18]" />
        <div className="landing-blob landing-blob-3 opacity-[0.15]" />
        <div className="landing-blob landing-blob-4 opacity-[0.12]" />
      </div>

      {/* Inner ring */}
      <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/[0.06]" aria-hidden />

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="space-y-8"
        >
          {/* Badge glassmorphism */}
          <motion.div variants={fadeUp} className="flex justify-center">
            <div className="landing-badge inline-flex items-center gap-3 rounded-full px-1.5 py-1.5 pl-2">
              <span className="rounded-full bg-gold-600 px-3 py-0.5 font-sans text-xs font-semibold uppercase tracking-wider text-white shadow-sm">
                Nouveau
              </span>
              <span className="pr-3 font-sans text-sm text-white/75">
                Dites bonjour &agrave; SAFE v3.2
              </span>
              <Sparkles className="mr-1 h-3.5 w-3.5 text-gold-400" aria-hidden />
            </div>
          </motion.div>

          {/* Titre */}
          <motion.h1
            variants={fadeUp}
            className="font-sans text-4xl font-semibold leading-[1.08] tracking-[-0.04em] text-white sm:text-5xl lg:text-5xl"
          >
            Vos r&eacute;seaux.
            <br />
            <span className="font-sans text-base font-normal italic text-gold-400">
              Une interface rapide.
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mx-auto max-w-xl font-sans text-base leading-relaxed text-white/60 sm:text-lg"
          >
            SAFE unifie le cycle comptable de votre cabinet &mdash; temps, facturation,
            fid&eacute;icommis et Loi 25 &mdash; dans une seule exp&eacute;rience claire et rapide.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeUp}
            className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
          >
            <Link href="#tarifs" tabIndex={-1}>
              <Button variant="landing-primary" className="h-12 min-w-[200px] text-sm px-7">
                R&eacute;server une d&eacute;mo gratuite
              </Button>
            </Link>
            <Link href="/connexion?tab=signup" tabIndex={-1}>
              <Button variant="landing-secondary" className="h-12 min-w-[200px] text-sm px-7">
                Commencer maintenant
              </Button>
            </Link>
          </motion.div>

          {/* Caption */}
          <motion.p variants={fadeUp} className="font-sans text-xs text-white/35">
            Aucune carte requise &middot; H&eacute;bergement au Canada
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
