"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function FinalCTA() {
  return (
    <section className="section-night relative py-28 lg:py-36 overflow-hidden">
      {/* Large accent glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-[var(--safe-accent)] opacity-10 rounded-full blur-[150px] pointer-events-none" />
      <div className="landing-grain absolute inset-0 pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <p className="font-sans italic text-2xl md:text-3xl text-[var(--safe-sage)] mb-6">
            Prêt à moderniser votre cabinet ?
          </p>
          <h2 className="font-sans text-4xl md:text-5xl text-[var(--safe-white)] mb-8 leading-[1.08] tracking-tight">
            Commencez dès aujourd&apos;hui.
          </h2>
          <p className="text-xl text-[var(--safe-text-muted)] mb-12 max-w-2xl mx-auto font-sans leading-relaxed">
            Réservez un appel découverte gratuit de 30 minutes avec notre équipe pour
            évaluer vos besoins et voir SAFE en action.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/demo"
              className="group inline-flex items-center gap-2 px-10 py-5 bg-[var(--safe-accent)] text-[var(--safe-lightest)] text-lg font-semibold rounded-full hover:bg-[var(--safe-sage)] hover:text-[var(--safe-darkest)] transition-all duration-300 shadow-2xl shadow-[var(--safe-accent)]/20 font-sans"
            >
              Réserver ma démo
              <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/audit-gratuit"
              className="inline-flex items-center gap-2 px-8 py-4 text-base font-medium rounded-full border border-[var(--safe-sage)]/30 text-[var(--safe-sage)] hover:border-[var(--safe-sage)]/60 hover:bg-[var(--safe-sage)]/5 transition-all duration-300 font-sans"
            >
              Faire mon audit gratuit
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
