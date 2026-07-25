"use client";

import React from "react";
import { motion } from "framer-motion";

// La réponse à « L'enjeu » : mêmes trois sujets, même ordre, même langage éditorial.
// Problème (ProblemSection) → réponse (Piliers). Miroir volontaire.
const EASE = [0.2, 0, 0, 1] as const;

const piliers = [
  {
    num: "01",
    eyebrow: "La conformité",
    titre: "Suivie en continu, prête à montrer.",
    texte: "Vos obligations B-1 r.5 et LSO sont connues, suivies et traçables. Une inspection devient un état à consulter, pas une crise à préparer.",
    outcome: "Prêt à tout moment",
  },
  {
    num: "02",
    eyebrow: "Le fidéicommis",
    titre: "Au sou près, chaque mois.",
    texte: "Chaque mouvement tracé, conciliation mensuelle sans tableur, retraits bloqués avant l'erreur. Le rapport est prêt à signer.",
    outcome: "0 écart toléré",
  },
  {
    num: "03",
    eyebrow: "La facturation",
    titre: "Du temps saisi au paiement reçu.",
    texte: "Vos heures deviennent des factures, vos factures deviennent des paiements. Les relances partent seules, rien ne dort.",
    outcome: "Rien ne se perd",
  },
];

export function Piliers() {
  return (
    <section className="px-6 py-[110px]" id="piliers">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: EASE }}
          className="mb-16 text-center"
        >
          <span className="mb-4 block font-sans text-[12px] font-medium uppercase tracking-[0.15em] text-forest-600">
            La réponse
          </span>
          <h2 className="mx-auto max-w-2xl font-serif text-[38px] leading-[1.1] tracking-[-0.02em] text-text-primary">
            Trois piliers, <span className="italic text-forest-600">tenus pour vous.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 divide-y divide-border/70 md:grid-cols-3 md:divide-x md:divide-y-0">
          {piliers.map((p, i) => (
            <motion.div
              key={p.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.12, ease: EASE }}
              className="group flex flex-col px-0 py-9 md:px-8 md:py-3 first:md:pl-0 last:md:pr-0"
            >
              <span className="mb-6 block font-serif text-[14px] italic text-forest-600" style={{ letterSpacing: "0.04em" }}>
                &mdash; {p.num}
              </span>
              <span className="mb-4 font-sans text-[11px] uppercase tracking-[0.14em] text-text-muted">
                {p.eyebrow}
              </span>
              <h3 className="mb-3 font-serif text-[19px] leading-[1.25] text-text-primary">{p.titre}</h3>
              <p className="mb-8 flex-1 font-sans text-[13.5px] leading-[1.65] text-text-body">{p.texte}</p>
              <div className="mt-auto flex items-center gap-2.5">
                <span className="h-px w-6 bg-forest-600/50 transition-[width] duration-500 group-hover:w-10" />
                <span className="font-serif text-[12.5px] italic text-text-subtle">{p.outcome}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
