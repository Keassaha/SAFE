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
      stat: "Sans préavis",
      eyebrow: "La conformité",
      eyebrowColor: "text-forest-600",
      title: "La conformité ne s'improvise pas.",
      body: "Le Barreau inspecte de façon aléatoire, quand il veut. Le jour où l'avis arrive, il est trop tard pour tout remettre en ordre.",
      source: "Inspection du Barreau",
    },
    {
      stat: "1 écart",
      eyebrow: "Le fidéicommis",
      title: "Un casse-tête strict, chaque mois.",
      body: "Journal, grand livre et banque doivent concorder au sou près. Un seul écart peut suffire à déclencher une mesure du Barreau.",
      source: "Comptes en fidéicommis",
    },
    {
      stat: "30 j",
      eyebrow: "La facturation",
      title: "Longue à faire, dure à suivre.",
      body: "Des semaines entre le travail livré et le paiement. Des heures non facturées, une trésorerie qui attend.",
      source: "Cycle de facturation",
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
          L&apos;enjeu
        </span>
        <h2 className="font-serif text-[38px] leading-[1.1] tracking-[-0.02em] text-text-primary max-w-2xl">
          Le risque n&apos;est pas de mal faire. <span className="italic text-forest-600">C&apos;est de ne pas tout suivre à temps.</span>
        </h2>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border/70">
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
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay: 0.1 + index * 0.12, ease }}
      className="group flex flex-col px-0 py-9 md:px-8 md:py-3 first:md:pl-0 last:md:pr-0"
    >
      <span
        className="font-serif italic text-[14px] text-forest-600 mb-7"
        style={{ letterSpacing: "0.04em" }}
      >
        &mdash; 0{index + 1}
      </span>

      <span className="font-serif text-[44px] leading-[1.02] tracking-[-0.02em] text-text-primary">
        {card.stat}
      </span>

      <span
        className={`text-[11px] font-sans uppercase tracking-[0.14em] mt-5 mb-5 ${
          card.eyebrowColor ?? "text-text-muted"
        }`}
      >
        {card.eyebrow}
      </span>

      <h3 className="font-serif text-[19px] leading-[1.25] text-text-primary mb-3">
        {card.title}
      </h3>

      <p className="text-[13.5px] text-text-body font-sans leading-[1.65] mb-8 flex-1">
        {card.body}
      </p>

      <div className="mt-auto flex items-center gap-2.5">
        <span className="h-px w-6 bg-forest-600/50 transition-[width] duration-500 group-hover:w-10" />
        <span className="font-serif italic text-[12.5px] text-text-subtle">
          {card.source}
        </span>
      </div>
    </motion.div>
  );
}
