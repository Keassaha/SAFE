"use client";

/** Page publique de tarification, issue du copy révisé. */

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  INK,
  MUTED,
  FAINT,
  GREEN,
  VERIFIED,
  LINE,
  SURFACE,
  BG,
  R,
  fadeUp,
  PageShell,
  PageHeader,
} from "./shared";

const FORFAITS = [
  {
    nom: "Solo",
    prix: "99 $",
    periode: "par mois",
    pour: "Pour l’avocate ou l’avocat qui exerce seul.",
    desc: "Fidéicommis, dossiers, temps et facturation dans un même abonnement.",
    accent: false,
  },
  {
    nom: "Cabinet",
    prix: "149 $",
    periode: "par mois",
    pour: "Pour les petits cabinets qui travaillent en équipe.",
    desc: "Tout ce qui est compris dans Solo, avec l’accès pour votre équipe.",
    accent: true,
  },
];

const QUESTIONS = [
  {
    q: "Est-ce que SAFE vaut son prix ?",
    r: "Comparez le coût à ce que vous consacrez aujourd’hui aux vérifications, aux doubles saisies et à la préparation des rapprochements. La rencontre de découverte vous aidera à faire ce calcul avec votre réalité.",
  },
  {
    q: "Y a-t-il un engagement annuel ?",
    r: "Non. Les forfaits réguliers sont mensuels.",
  },
  {
    q: "À qui appartiennent mes données ?",
    r: "À votre cabinet. Vous pouvez les exporter dans les formats offerts par SAFE.",
  },
];

export default function TarificationPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Tarification"
        titre="Un prix clair. L’accompagnement compris."
        intro="La configuration initiale est incluse. Aucun frais d’installation ne s’ajoute."
      />

      {/* Forfaits */}
      <section className="px-6 pb-8" style={{ background: BG }}>
        <div className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-2">
          {FORFAITS.map((f, i) => (
            <motion.div
              key={f.nom}
              {...fadeUp(0.06 + i * 0.06)}
              className="flex flex-col rounded-[16px] p-7"
              style={{
                background: SURFACE,
                border: `1px solid ${f.accent ? "rgba(18,161,80,0.35)" : LINE}`,
                boxShadow: f.accent ? "0 30px 60px -40px rgba(11,31,25,0.4)" : "none",
              }}
            >
              <span className="font-mono text-[12px] uppercase tracking-[0.1em]" style={{ color: f.accent ? GREEN : FAINT }}>
                {f.nom}
              </span>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-mono text-[38px] tabular-nums leading-none" style={{ color: INK }}>
                  {f.prix}
                </span>
                <span className="font-sans text-[14px]" style={{ color: MUTED }}>
                  {f.periode}
                </span>
              </div>
              <p className="mt-5 font-sans text-[15px] font-medium leading-[1.5]" style={{ color: INK }}>
                {f.pour}
              </p>
              <p className="mt-2 font-sans text-[14.5px] leading-[1.55]" style={{ color: MUTED }}>
                {f.desc}
              </p>
              <div className="mt-6">
                <Link
                  href={R.diagnostic}
                  className="inline-flex h-10 items-center rounded-[8px] px-4 font-sans text-[14px] font-medium transition-transform duration-200 hover:-translate-y-0.5"
                  style={
                    f.accent
                      ? { background: GREEN, color: "#fff" }
                      : { background: "transparent", color: INK, border: `1px solid ${LINE}` }
                  }
                >
                  Faire le diagnostic
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
        <motion.p {...fadeUp(0.2)} className="mx-auto mt-4 max-w-4xl font-sans text-[12.5px]" style={{ color: FAINT }}>
          Prix en dollars canadiens. Taxes applicables en sus.
        </motion.p>
      </section>

      {/* Offre fondateurs */}
      <section className="px-6 py-20" style={{ background: BG }}>
        <motion.div
          {...fadeUp(0)}
          className="mx-auto max-w-3xl rounded-[18px] p-8 sm:p-10"
          style={{ background: "#14261F", color: "#EAF2EC" }}
        >
          <span className="font-mono text-[12px] uppercase tracking-[0.12em]" style={{ color: "#8EB69B" }}>
            Cabinets fondateurs
          </span>
          <h2 className="mt-4 max-w-[22ch] font-serif text-[28px] leading-[1.15] sm:text-[36px]" style={{ letterSpacing: "-0.015em" }}>
            Participez aux premières étapes de SAFE.
          </h2>
          <div className="mt-5 space-y-4 font-sans text-[15.5px] leading-[1.6]" style={{ color: "#C4D4C9" }}>
            <p>
              Nous ouvrons cinq places à des cabinets qui veulent utiliser SAFE et contribuer
              directement à son amélioration.
            </p>
            <p>
              Vous profitez de 12 mois sans frais. Ensuite, vous choisissez entre un abonnement de
              50 $ par mois maintenu pour la durée de votre utilisation ou un paiement unique de
              5 000 $, selon les modalités convenues.
            </p>
            <p>
              En retour, nous vous demandons une rétroaction franche sur ce qui fonctionne, ce qui
              ralentit votre travail et ce qui doit être amélioré.
            </p>
          </div>
          <Link
            href={R.demo}
            className="mt-7 inline-flex h-11 items-center rounded-[8px] px-5 font-sans text-[15px] font-medium transition-transform duration-200 hover:-translate-y-0.5"
            style={{ background: GREEN, color: "#fff" }}
          >
            Vérifier s’il reste une place
          </Link>
        </motion.div>
      </section>

      {/* Décision réversible + questions rapides */}
      <section className="px-6 py-20" style={{ background: SURFACE, borderTop: `1px solid ${LINE}` }}>
        <div className="mx-auto max-w-2xl">
          <motion.h2 {...fadeUp(0)} className="font-serif text-[24px] leading-[1.2] sm:text-[30px]" style={{ color: INK, letterSpacing: "-0.015em" }}>
            Une décision réversible.
          </motion.h2>
          <motion.p {...fadeUp(0.06)} className="mt-4 font-sans text-[16px] leading-[1.6]" style={{ color: MUTED }}>
            Les forfaits réguliers sont mensuels. Vous pouvez mettre fin à votre abonnement selon
            les modalités prévues et récupérer vos données dans les formats d’export offerts.
          </motion.p>

          <div className="mt-12 space-y-8">
            {QUESTIONS.map((item, i) => (
              <motion.div key={item.q} {...fadeUp(0.06 + i * 0.05)} className="pt-6" style={{ borderTop: `1px solid ${LINE}` }}>
                <h3 className="font-sans text-[16px] font-semibold" style={{ color: INK }}>
                  {item.q}
                </h3>
                <p className="mt-2 font-sans text-[15px] leading-[1.6]" style={{ color: MUTED }}>
                  {item.r}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
