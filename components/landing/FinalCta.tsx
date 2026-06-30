"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from './ui/Button';
import { motion } from 'framer-motion';

export function FinalCta() {
  const ease = [0.16, 1, 0.3, 1] as const;

  return (
    <section className="bg-canvas border-t border-[0.5px] border-border py-[80px] px-6 text-center w-full flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease }}
        className="inline-flex items-center gap-2 px-3 py-1 bg-surface border border-[0.5px] border-border rounded-full mb-8"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-warning" />
        <span className="text-[12px] font-sans tracking-[0.02em] text-text-body">
          5 places fondatrices · tarif verrouillé à vie
        </span>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, delay: 0.1, ease }}
        className="font-serif text-[48px] leading-[1.05] tracking-[-0.02em] text-text-primary max-w-2xl mb-6"
      >
        Sachez où vous en êtes, <span className="italic text-forest-600">avant que votre Barreau ne le découvre.</span>
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, delay: 0.2, ease }}
        className="text-[16px] text-text-body max-w-[620px] font-sans leading-[1.65] mb-6 italic"
      >
        Vous recevez un diagnostic complet : votre fidéicommis passé en revue point par point, et le portrait clair de la trésorerie immobilisée entre le travail livré et le paiement. Vous y trouvez votre situation actuelle et les corrections à prioriser pour vous remettre à jour d&apos;ici 30 jours.
      </motion.p>

      <motion.p
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, delay: 0.25, ease }}
        className="text-[15px] text-text-body/80 max-w-[540px] font-sans leading-[1.6] mb-10"
      >
        Évaluez gratuitement la situation de votre cabinet. Vous recevez un rapport confidentiel dans les 24 heures, sans aucun engagement.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, delay: 0.3, ease }}
        className="flex items-center justify-center mb-16"
      >
        <Link href="/audit-gratuit" className="block">
          <Button variant="primary" size="lg" className="px-8">Faire mon audit gratuit &rarr;</Button>
        </Link>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.5 }}
        className="flex items-center gap-6 text-[12px] text-text-body/60 font-sans uppercase tracking-[0.1em]"
      >
        <span>30 jours remboursé</span>
        <span className="w-1 h-1 rounded-full bg-border" />
        <span>Migration assistée</span>
        <span className="w-1 h-1 rounded-full bg-border" />
        <span>Hébergé au Canada</span>
      </motion.div>
    </section>
  );
}
