"use client";

import React from 'react';
import { motion } from 'framer-motion';

type Feature = {
  kicker: string;
  title: string;
  body: string;
};

const FEATURES: Feature[] = [
  {
    kicker: "Facturation",
    title: "Une facturation plus rigoureuse.",
    body: "Les heures se transforment en factures. Les factures se transforment en paiements. Sans relances bricolées dans Word, sans temps non capturé.",
  },
  {
    kicker: "Fidéicommis",
    title: "Un fidéicommis plus clair.",
    body: "Registre tenu, conciliation mensuelle, piste d'audit complète. La conformité B-1, r.5 et By-Laws de la LSO en continu — pas seulement le jour de l'inspection.",
  },
  {
    kicker: "Conformité",
    title: "Une conformité plus sereine.",
    body: "Obligations Barreau et LSO connues, suivies, traçables. Une inspection ne devrait pas être un événement à préparer en urgence.",
  },
  {
    kicker: "Dossiers",
    title: "Des dossiers mieux organisés.",
    body: "Clients, mandats, échéances et documents au même endroit. Un dimanche soir ne devrait plus servir à retrouver un email perdu.",
  },
];

export function FeaturesGrid() {
  const ease = [0.16, 1, 0.3, 1] as const;

  return (
    <section className="py-[100px] px-6 max-w-5xl mx-auto" id="produit">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease }}
        className="mb-16 text-center flex flex-col items-center"
      >
        <span className="text-[12px] font-sans uppercase tracking-[0.15em] text-forest-600 font-medium block mb-4">
          La promesse
        </span>
        <h2 className="font-serif text-[38px] leading-[1.1] tracking-[-0.02em] text-text-primary max-w-2xl mb-4">
          SAFE ne vend pas un logiciel. <span className="italic text-forest-600">SAFE installe un système.</span>
        </h2>
        <p className="text-[15px] text-text-body font-sans leading-[1.6] max-w-xl">
          Quatre piliers, un seul objectif : remettre le cabinet en ordre.
        </p>
      </motion.div>

      {/* Grille de cubes animés — même pattern que la section ProblemSection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-[680px] mx-auto">
        {FEATURES.map((f, i) => (
          <AnimatedCard
            key={f.kicker}
            index={i}
            ease={ease}
            kicker={f.kicker}
            title={f.title}
            body={f.body}
          />
        ))}
      </div>
    </section>
  );
}


/**
 * Carte animée partagée entre FeaturesGrid et ProblemSection.
 * Variante `hover` pilote : bordure, trait supérieur, halo radial,
 * translation du numéro, fade-in de la flèche, couleur du kicker.
 */
export function AnimatedCard({
  index,
  ease,
  kicker,
  kickerColor,
  title,
  body,
  footer,
}: {
  index: number;
  ease: readonly [number, number, number, number];
  kicker: string;
  kickerColor?: string;
  title: string;
  body: string;
  footer?: React.ReactNode;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, delay: 0.1 + index * 0.1, ease }}
      whileHover="hover"
      className="group relative flex min-h-[330px] flex-col p-7 bg-surface border border-[0.5px] border-border rounded-[10px] overflow-hidden transition-[border-color,box-shadow,transform] duration-500 hover:border-forest-600/50 hover:shadow-[0_30px_80px_-40px_rgba(31,58,46,0.35)] hover:-translate-y-1"
    >
      {/* Halo radial vert qui s'étend au hover */}
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

      {/* Trait vert horizontal supérieur */}
      <motion.span
        aria-hidden
        className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-forest-600 via-forest-600/80 to-transparent origin-left"
        initial={{ scaleX: 0 }}
        variants={{ hover: { scaleX: 1 } }}
        transition={{ duration: 0.9, ease }}
      />

      {/* Header */}
      <div className="flex items-center justify-end mb-8 relative z-10">
        <motion.span
          className={`text-[11px] font-sans uppercase tracking-[0.12em] ${
            kickerColor ?? "text-text-muted"
          }`}
          variants={{ hover: { color: "#1F3A2E" } }}
          transition={{ duration: 0.4 }}
        >
          {kicker}
        </motion.span>
      </div>

      {/* Titre */}
      <motion.h3
        className="font-serif text-[22px] leading-[1.25] tracking-[-0.01em] text-text-primary mb-3 relative z-10"
        variants={{ hover: { x: 2 } }}
        transition={{ duration: 0.5, ease }}
      >
        {title}
      </motion.h3>

      {/* Body */}
      <p className="text-[14px] text-text-body font-sans leading-[1.65] flex-1 relative z-10">
        {body}
      </p>

      {/* Footer : flèche qui apparaît + trait qui se dessine */}
      <div className="mt-8 relative z-10 h-[18px] overflow-hidden">
        <motion.div
          className="flex items-center gap-2 text-forest-600"
          initial={{ y: 8, opacity: 0 }}
          variants={{ hover: { y: 0, opacity: 1 } }}
          transition={{ duration: 0.5, ease, delay: 0.05 }}
        >
          <motion.span
            aria-hidden
            className="h-px bg-forest-600 origin-left"
            initial={{ scaleX: 0, width: 24 }}
            variants={{ hover: { scaleX: 1, width: 32 } }}
            transition={{ duration: 0.6, ease, delay: 0.1 }}
          />
          <span className="text-[11px] font-sans uppercase tracking-[0.15em] font-medium">
            {footer ?? "En savoir plus"}
          </span>
          <motion.span
            aria-hidden
            className="font-sans text-[14px]"
            initial={{ x: -4 }}
            variants={{ hover: { x: 0 } }}
            transition={{ duration: 0.5, ease, delay: 0.15 }}
          >
            →
          </motion.span>
        </motion.div>
      </div>
    </motion.article>
  );
}
