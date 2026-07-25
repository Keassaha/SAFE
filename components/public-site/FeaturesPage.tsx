"use client";

/** Ébauche landing-v2 — Fonctionnalités (copy section B). Route isolée, non liée à la prod. */

import React from "react";
import { motion } from "framer-motion";
import { INK, MUTED, FAINT, GREEN, LINE, SURFACE, BG, fadeUp, PageShell, PageHeader } from "./shared";

const FEATURES = [
  {
    label: "Le fidéicommis",
    titre: "Un fidéicommis suivi avec la rigueur qu’il exige.",
    corps: [
      "Vous inscrivez chaque dépôt et chaque retrait une fois. SAFE rapproche le solde bancaire, le registre du compte en fidéicommis et le solde de chaque dossier client.",
      "Un écart ou un solde négatif apparaît ? SAFE vous le signale et bloque la certification du rapprochement tant que la situation n’est pas corrigée.",
      "Lorsque vient le temps de produire vos rapports, vous voyez les périodes complètes et celles qui demandent encore votre attention.",
    ],
  },
  {
    label: "La facturation",
    titre: "Du travail effectué à la facture, sans ressaisie inutile.",
    corps: [
      "Le temps et les débours associés au dossier remontent dans la facturation. Vous réduisez les oublis et voyez plus clairement ce qui peut être facturé.",
    ],
  },
  {
    label: "Le temps",
    titre: "Notez le temps pendant que le travail est encore frais.",
    corps: [
      "Chaque entrée est reliée au bon dossier. Au moment de facturer, vos heures sont déjà là, avec leur description.",
    ],
  },
  {
    label: "Les dossiers",
    titre: "Chaque affaire garde son contexte.",
    corps: [
      "Clients, parties, documents, échéances, temps et débours restent reliés au dossier concerné. Vous cherchez moins et reprenez le travail plus facilement.",
    ],
  },
];

export default function FonctionnalitesPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Fonctionnalités"
        titre="Moins de vérifications manuelles. Plus de visibilité sur votre cabinet."
        intro="SAFE relie le fidéicommis, les dossiers, le temps et la facturation pour que l’information suive le travail, au lieu de rester dispersée."
      />

      <section className="px-6 pb-24" style={{ background: BG }}>
        <div className="mx-auto max-w-5xl">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.label}
              {...fadeUp(0.04)}
              className="grid gap-6 py-14 sm:grid-cols-[1fr_1.7fr] sm:items-start"
              style={{ borderTop: i === 0 ? "none" : `1px solid ${LINE}` }}
            >
              <span className="font-mono text-[12px] uppercase tracking-[0.1em]" style={{ color: GREEN }}>
                {f.label}
              </span>
              <div>
                <h2 className="max-w-[24ch] font-serif text-[26px] leading-[1.15] sm:text-[32px]" style={{ color: INK, letterSpacing: "-0.015em" }}>
                  {f.titre}
                </h2>
                <div className="mt-4 space-y-3 font-sans text-[16px] leading-[1.6]" style={{ color: MUTED }}>
                  {f.corps.map((p, j) => (
                    <p key={j}>{p}</p>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="px-6 py-20" style={{ background: SURFACE, borderTop: `1px solid ${LINE}` }}>
        <div className="mx-auto max-w-2xl">
          <motion.p {...fadeUp(0)} className="font-mono text-[12px] uppercase tracking-[0.14em]" style={{ color: FAINT }}>
            La limite
          </motion.p>
          <motion.h2 {...fadeUp(0.06)} className="mt-4 font-serif text-[26px] leading-[1.2] sm:text-[32px]" style={{ color: INK, letterSpacing: "-0.015em" }}>
            Ce que SAFE ne remplace pas.
          </motion.h2>
          <motion.p {...fadeUp(0.12)} className="mt-5 font-sans text-[16px] leading-[1.6]" style={{ color: MUTED }}>
            SAFE ne remplace ni votre jugement professionnel ni votre comptable de fin d’année. Il
            vous aide à tenir l’information quotidienne de façon structurée et à préparer ce dont
            votre comptable aura besoin.
          </motion.p>
        </div>
      </section>
    </PageShell>
  );
}
