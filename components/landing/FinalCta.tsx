"use client";

import React from 'react';
import { Button } from './ui/Button';
import { motion } from 'framer-motion';

export function FinalCta() {
  const ease = [0.16, 1, 0.3, 1] as const;

  return (
    <section className="bg-[#0A0A0A] py-[80px] px-6 text-center w-full flex flex-col items-center">
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease }}
        className="inline-flex items-center gap-2 px-3 py-1 bg-[#1A1A1A] border border-[#27272A] rounded-full mb-8"
      >
        <div className="w-1.5 h-1.5 rounded-full bg-warning" />
        <span className="text-[12px] font-sans tracking-[0.02em] text-[#D4D4D4]">
          50 places fondatrices · tarif verrouillé à vie
        </span>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, delay: 0.1, ease }}
        className="font-serif text-[48px] leading-[1.05] tracking-[-0.02em] text-surface max-w-2xl mb-6"
      >
        Votre cabinet ne manque peut-être pas d&apos;effort. <span className="italic text-forest-600">Il manque peut-être d&apos;ordre.</span>
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, delay: 0.2, ease }}
        className="text-[16px] text-[#C8C8C8] max-w-[620px] font-sans leading-[1.65] mb-6 italic"
      >
        Imaginez un vendredi où vous fermez votre cabinet à 17 h en sachant que la facturation de la semaine est partie, que le fidéicommis est concilié, et qu&apos;aucun délai ne traîne dans une boîte mail. C&apos;est ce que SAFE rend ordinaire.
      </motion.p>

      <motion.p
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, delay: 0.25, ease }}
        className="text-[15px] text-[#A1A1A1] max-w-[540px] font-sans leading-[1.6] mb-10"
      >
        Commencez par l&apos;audit gratuit. Rapport clair sous un jour ouvrable. Aucun engagement.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, delay: 0.3, ease }}
        className="flex items-center justify-center mb-16"
      >
        <Button variant="dark" size="lg" className="px-8">Faire mon audit gratuit &rarr;</Button>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.5 }}
        className="flex items-center gap-6 text-[12px] text-[#52525B] font-sans uppercase tracking-[0.1em]"
      >
        <span>30 jours remboursé</span>
        <span className="w-1 h-1 rounded-full bg-[#27272A]" />
        <span>Migration assistée</span>
        <span className="w-1 h-1 rounded-full bg-[#27272A]" />
        <span>Hébergé au Canada</span>
      </motion.div>
    </section>
  );
}
