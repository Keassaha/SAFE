"use client";

import React from 'react';
import { motion } from 'framer-motion';

type Card = {
  stat: string;
  eyebrow: string;
  eyebrowColor?: string;
  title: string;
  body: string;
  source: string;
};

export function ProblemSection() {
  const ease = [0.16, 1, 0.3, 1] as const;

  const cards: Card[] = [
    {
      stat: "60\u00A0%",
      eyebrow: "du temps perdu",
      title: "L\u2019admin vole vos heures facturables.",
      body: "Facturation, r\u00E9conciliation, relances, classement. Sur 8 heures, vous n\u2019en facturez que 3.",
      source: "Clio Legal Trends Report 2024",
    },
    {
      stat: "B-1 r.5",
      eyebrow: "R\u00E8glement obligatoire",
      eyebrowColor: "text-forest-600",
      title: "Une inspection peut arriver demain.",
      body: "Fid\u00E9icommis, registres, piste d\u2019audit. Si vos livres ne sont pas conformes, les cons\u00E9quences sont imm\u00E9diates.",
      source: "Barreau du Qu\u00E9bec",
    },
    {
      stat: "30\u00A0%",
      eyebrow: "revenus perdus",
      title: "Une partie de votre travail ne g\u00E9n\u00E8re rien.",
      body: "Temps non consign\u00E9, factures oubli\u00E9es, erreurs de saisie. Le manque d\u2019outils vous co\u00FBte cher.",
      source: "Bloomberg Law 2024",
    },
  ];

  return (
    <section className="py-[100px] px-6 max-w-5xl mx-auto" id="probleme">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease }}
        className="mb-16 text-center flex flex-col items-center"
      >
        <span className="text-[12px] font-sans uppercase tracking-[0.15em] text-forest-600 font-medium block mb-4">
          Le problème
        </span>
        <h2 className="font-serif text-[38px] leading-[1.1] tracking-[-0.02em] text-text-primary max-w-xl">
          Vous êtes avocat. <span className="italic text-forest-600">Pas comptable.</span>
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((c, i) => (
          <ProblemCard key={c.title} card={c} index={i} ease={ease} />
        ))}
      </div>
    </section>
  );
}

function ProblemCard({
  card,
  index,
  ease,
}: {
  card: Card;
  index: number;
  ease: readonly [number, number, number, number];
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, delay: 0.1 + index * 0.1, ease }}
      whileHover="hover"
      className="group relative flex flex-col p-7 bg-surface border border-[0.5px] border-border rounded-[10px] overflow-hidden transition-[border-color,box-shadow,transform] duration-500 hover:border-forest-600/50 hover:shadow-[0_30px_80px_-40px_rgba(31,58,46,0.35)] hover:-translate-y-1"
    >
      {/* Halo radial vert */}
      <motion.span
        aria-hidden
        className="pointer-events-none absolute -inset-px rounded-[10px]"
        initial={{ opacity: 0 }}
        variants={{ hover: { opacity: 1 } }}
        transition={{ duration: 0.6, ease }}
        style={{
          background:
            "radial-gradient(600px circle at 50% 0%, rgba(31,58,46,0.08), transparent 55%)",
        }}
      />

      {/* Trait vert supérieur */}
      <motion.span
        aria-hidden
        className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-forest-600 via-forest-600/80 to-transparent origin-left"
        initial={{ scaleX: 0 }}
        variants={{ hover: { scaleX: 1 } }}
        transition={{ duration: 0.9, ease }}
      />

      {/* Statistique */}
      <div className="flex flex-col items-start mb-6 relative z-10">
        <motion.span
          className="font-serif text-[52px] leading-[1] tabular-nums tracking-[-0.02em] text-text-primary"
          variants={{ hover: { x: 4 } }}
          transition={{ duration: 0.5, ease }}
        >
          {card.stat}
        </motion.span>
        <motion.span
          className={`text-[11px] font-sans uppercase tracking-[0.12em] mt-3 ${
            card.eyebrowColor ?? "text-text-muted"
          }`}
          variants={{ hover: { color: "#1F3A2E" } }}
          transition={{ duration: 0.4 }}
        >
          {card.eyebrow}
        </motion.span>
      </div>

      {/* Titre */}
      <motion.h3
        className="font-serif text-[17px] leading-[1.3] text-text-primary mb-3 relative z-10"
        variants={{ hover: { x: 2 } }}
        transition={{ duration: 0.5, ease }}
      >
        {card.title}
      </motion.h3>

      {/* Body */}
      <p className="text-[13.5px] text-text-body font-sans leading-[1.6] mb-6 flex-1 relative z-10">
        {card.body}
      </p>

      {/* Footer source avec trait qui grandit au hover */}
      <div className="mt-auto relative z-10 flex items-center gap-2 pt-5">
        <motion.span
          aria-hidden
          className="h-px bg-forest-600/60 origin-left"
          initial={{ width: 12 }}
          variants={{ hover: { width: 28 } }}
          transition={{ duration: 0.6, ease }}
        />
        <span className="font-serif italic text-[12.5px] text-text-subtle">
          {card.source}
        </span>
      </div>
    </motion.article>
  );
}
