"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "./ui/Button";

const ease = [0.16, 1, 0.3, 1] as const;

const inclusions = [
  "12 mois gratuits dès l'activation",
  "Mise en route faite avec vous, sans frais",
  "Mises à jour de conformité au Barreau incluses",
  "Statut de membre fondateur : votre avis oriente l'outil",
];

const listContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } },
};

const listItem = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { duration: 0.6, ease } },
};

function Check() {
  return (
    <span className="mt-[2px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-forest-600/15">
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path
          d="M2.5 6.2L4.8 8.5L9.5 3.5"
          stroke="#4F7A63"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function FoundingOffer() {
  return (
    <section
      id="offre-fondatrice"
      className="relative overflow-hidden bg-surface px-6 py-[110px]"
    >
      {/* Lueur forêt animée en fond */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-140px] h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-forest-600/10 blur-[120px]"
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative mx-auto max-w-5xl">
        {/* En-tête */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease }}
          className="flex flex-col items-center text-center"
        >
          <span className="mb-7 inline-flex items-center gap-2 rounded-full border border-[0.5px] border-border bg-canvas px-3 py-1">
            <motion.span
              className="h-1.5 w-1.5 rounded-full bg-forest-600"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <span className="font-sans text-[12px] tracking-[0.02em] text-forest-600">
              Offre fondatrice · 5 places seulement
            </span>
          </span>

          <h2 className="mb-5 max-w-2xl font-serif text-[42px] leading-[1.07] tracking-[-0.02em] text-text-primary">
            Devenez l&apos;un des 5 cabinets fondateurs.{" "}
            <span className="italic text-forest-600">Votre tarif, gelé à vie.</span>
          </h2>

          <p className="max-w-xl font-sans text-[16px] leading-[1.65] text-text-body">
            On construit SAFE avec cinq cabinets, pas seulement pour eux. En échange, vous obtenez des conditions qui ne reviendront plus une fois les cinq places prises.
          </p>
        </motion.div>

        {/* Deux options */}
        <div className="mt-14 grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
          {/* Option A : abonnement à vie (mise en avant) */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease }}
            whileHover={{ y: -6, transition: { duration: 0.25, ease } }}
            className="flex flex-col rounded-[10px] border border-forest-600/45 bg-canvas p-8 shadow-[0_18px_50px_-28px_rgba(31,58,46,0.45)] transition-[box-shadow,border-color] duration-300 hover:border-forest-600/70 hover:shadow-[0_30px_75px_-30px_rgba(31,58,46,0.6)]"
          >
            <span className="mb-4 inline-flex w-fit rounded-full bg-forest-600/10 px-2.5 py-1 font-sans text-[11px] uppercase tracking-[0.1em] text-forest-600">
              Le choix des fondateurs
            </span>
            <p className="font-sans text-[13px] uppercase tracking-[0.12em] text-text-body/60">
              Abonnement à vie
            </p>
            <div className="mt-5 flex items-end gap-2">
              <span className="font-serif text-[52px] leading-none text-text-primary">50&nbsp;$</span>
              <span className="mb-2 font-sans text-[14px] text-text-body">/&nbsp;mois</span>
              <span className="mb-2 ml-1 font-sans text-[15px] text-text-body/40 line-through">
                149&nbsp;$
              </span>
            </div>
            <p className="mt-5 font-sans text-[14px] leading-[1.6] text-text-body">
              12 mois gratuits dès l&apos;activation, puis 50&nbsp;$/mois gelés à vie. Aucune hausse, jamais, tant que vous restez membre.
            </p>
          </motion.div>

          {/* Option B : rachat unique */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.1, ease }}
            whileHover={{ y: -6, transition: { duration: 0.25, ease } }}
            className="flex flex-col rounded-[10px] border border-[0.5px] border-border bg-canvas p-8 transition-[box-shadow,border-color] duration-300 hover:border-forest-600/40 hover:shadow-[0_24px_60px_-32px_rgba(31,58,46,0.4)]"
          >
            <p className="font-sans text-[13px] uppercase tracking-[0.12em] text-text-body/60">
              Rachat unique
            </p>
            <div className="mt-5 flex items-end gap-2">
              <span className="font-serif text-[52px] leading-none text-text-primary">5&nbsp;000&nbsp;$</span>
              <span className="mb-2 font-sans text-[14px] text-text-body">une seule fois</span>
            </div>
            <p className="mt-5 font-sans text-[14px] leading-[1.6] text-text-body">
              Vous payez une fois, plus jamais de mensualité à gérer. Accès à vie, mises à jour de conformité comprises. Réservé aux cinq cabinets fondateurs.
            </p>
          </motion.div>
        </div>

        {/* Inclusions communes */}
        <motion.ul
          variants={listContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-x-10 gap-y-4 sm:grid-cols-2"
        >
          {inclusions.map((item) => (
            <motion.li
              key={item}
              variants={listItem}
              className="flex items-start gap-3 font-sans text-[14px] leading-[1.5] text-text-body"
            >
              <Check />
              {item}
            </motion.li>
          ))}
        </motion.ul>

        {/* Rareté + CTA */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.8, delay: 0.2, ease }}
          className="mt-14 flex flex-col items-center"
        >
          <div className="mb-7 flex items-center gap-2.5" aria-label="5 places fondatrices">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.span
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.1, ease }}
                className="h-2.5 w-2.5 rounded-full border border-forest-600/60 bg-forest-600/30"
              />
            ))}
            <span className="ml-2 font-sans text-[12px] uppercase tracking-[0.1em] text-text-body/60">
              5 places fondatrices
            </span>
          </div>

          <Link href="/contact" className="block">
            <Button variant="primary" size="lg" className="px-9">
              Nous contacter &rarr;
            </Button>
          </Link>

          <p className="mt-5 font-sans text-[13px] leading-[1.6] text-text-body/70">
            Sans engagement. On vous explique tout en 15 minutes.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
