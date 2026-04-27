"use client";

import React from 'react';
import { Button } from './ui/Button';
import { motion } from 'framer-motion';
import Link from 'next/link';

export function Hero() {
  const ease = [0.16, 1, 0.3, 1] as const;

  return (
    <section className="pt-[144px] pb-[80px] px-6 text-center max-w-5xl mx-auto flex flex-col items-center overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease }}
        className="inline-flex items-center gap-2 px-3 py-1 bg-surface border border-[0.5px] border-border-strong rounded-full mb-8 z-10 relative"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-forest-600" />
        <span className="text-[12px] font-sans tracking-[0.02em] text-text-body font-medium uppercase letter-spacing-[0.1em]">
          Conforme Barreau du Québec · Règlement B-1, r.5
        </span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.1, ease }}
        className="font-serif text-[56px] leading-[1.02] tracking-[-0.035em] text-text-primary max-w-3xl mb-4 z-10 relative"
      >
        La plateforme financière pour les cabinets <br/><span className="italic text-forest-600">d&apos;avocats modernes.</span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease }}
        className="text-[17px] text-text-body max-w-[540px] font-sans leading-[1.6] mb-10 z-10 relative"
      >
        Facturation, fidéicommis, conformité. Pensé pour le Québec. Construit par quelqu&apos;un qui a tenu vos livres.
      </motion.p>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease }}
        className="flex flex-col sm:flex-row items-center gap-4 mb-20 z-10 relative"
      >
        <Link href="/audit-gratuit">
          <Button variant="primary" size="lg">Faire mon audit gratuit &rarr;</Button>
        </Link>
        <Button variant="primary" size="lg">Voir la démo</Button>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.4, ease }}
        className="flex items-center justify-center divide-x divide-border w-full max-w-[600px] border-y border-[0.5px] border-border py-6 z-10 relative"
      >
        <div className="flex flex-col items-center flex-1">
          <span className="font-serif text-3xl tabular-nums tracking-[-0.02em] text-text-primary">Quotidien</span>
          <span className="text-[13px] text-text-subtle font-sans mt-1">Rapprochement fidéicommis</span>
        </div>
        <div className="flex flex-col items-center flex-1">
          <span className="font-serif text-3xl tabular-nums tracking-[-0.02em] text-text-primary">8&nbsp;h&nbsp;/&nbsp;sem</span>
          <span className="text-[13px] text-text-subtle font-sans mt-1">Temps économisé</span>
        </div>
        <div className="flex flex-col items-center flex-1">
          <span className="font-serif text-3xl font-medium tabular-nums tracking-[-0.02em] text-forest-600">B-1&nbsp;r.5</span>
          <span className="text-[13px] text-text-subtle font-sans mt-1">Conforme par défaut</span>
        </div>
      </motion.div>
    </section>
  );
}
