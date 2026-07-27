"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Section, fadeUp, LivePulse, INK, MUTED, SURFACE } from "./kit";

// 09 CTA final — un geste simple après la démonstration. Aligné à gauche (§09).
export function CtaFinalPreview() {
  return (
    <Section id="cta" className="py-[120px]">
      <div className="max-w-[760px]">
        <motion.div {...fadeUp(0)} className="mb-8 inline-flex items-center gap-2">
          <LivePulse />
          <span className="font-sans text-[12px] uppercase tracking-[0.1em] text-text-muted">
            5 places fondatrices · première année à tarif fondateur
          </span>
        </motion.div>

        <motion.h2
          {...fadeUp(0.05)}
          className="font-serif text-[40px] leading-[1.05] tracking-[-0.02em] text-text-primary sm:text-[52px]"
        >
          Sachez où vous en êtes,{" "}
          <span className="italic text-forest-600">avant qu&apos;on vous le demande.</span>
        </motion.h2>

        <motion.p {...fadeUp(0.1)} className="mt-6 max-w-[560px] font-sans text-[16px] leading-[1.65] text-text-body">
          Évaluez gratuitement la situation de votre cabinet. Vous recevez un diagnostic confidentiel
          dans les 24 heures : votre fidéicommis passé en revue et le portrait clair de la trésorerie
          immobilisée. Sans aucun engagement.
        </motion.p>

        <motion.div {...fadeUp(0.15)} className="mt-9 flex flex-wrap items-center gap-4">
          <Link
            href="/audit-gratuit"
            className="inline-flex h-11 items-center rounded-[8px] px-6 font-sans text-[15px] font-medium transition-transform duration-200 hover:-translate-y-0.5"
            style={{ background: INK, color: SURFACE }}
          >
            Faire mon audit gratuit &rarr;
          </Link>
          <span className="font-sans text-[13px]" style={{ color: MUTED }}>
            Sans engagement, sans carte de crédit
          </span>
        </motion.div>

        <motion.div
          {...fadeUp(0.2)}
          className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-2 font-sans text-[12px] uppercase tracking-[0.1em] text-text-body/60"
        >
          <span>Diagnostic sous 24 h</span>
          <span aria-hidden className="text-border">
            ·
          </span>
          <span>Migration assistée</span>
          <span aria-hidden className="text-border">
            ·
          </span>
          <span>Hébergé au Canada</span>
        </motion.div>
      </div>
    </Section>
  );
}
