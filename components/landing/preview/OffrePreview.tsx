"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Section, NarrativeHeader, fadeUp, CheckDraw, EASE, INK, MUTED, SURFACE, LINE } from "./kit";
import { TARIFICATION, prixFr } from "@/lib/tarification";

// 07 Offre et prix — prix publics lisibles, l'audit gratuit reste l'action dominante,
// l'offre fondatrice distincte et honnête. Tout aligné à gauche.
const inclusions = [
  "Première année à 50 $/mois (Solo) ou 100 $/mois (Cabinet)",
  "Mise en route faite avec vous, sans frais",
  "Mises à jour de conformité au Barreau incluses",
  "Statut de membre fondateur : votre avis oriente l'outil",
];

export function OffrePreview() {
  const { solo, cabinet } = TARIFICATION.paliers;

  return (
    <Section id="offre" className="py-[120px]">
      <NarrativeHeader
        num="07"
        eyebrow="Offre et prix"
        title={
          <>
            Un audit gratuit. <span className="italic text-forest-600">Des prix publics.</span>
          </>
        }
        description={`Solo ${prixFr(solo.prix)} $/mois, Cabinet ${prixFr(cabinet.prix)} $/mois. Tout inclus, configuration comprise, sans frais cachés. Le premier geste demandé reste l'audit gratuit.`}
      />

      <div className="mt-16 grid gap-4 md:grid-cols-2">
        {/* Prix publics */}
        <motion.div
          {...fadeUp(0)}
          className="flex flex-col justify-between rounded-[12px] p-8"
          style={{ background: SURFACE, border: `1px solid ${LINE}` }}
        >
          <div>
            <p className="font-sans text-[12px] uppercase tracking-[0.12em]" style={{ color: MUTED }}>
              Prix publics
            </p>
            <div className="mt-6 flex flex-col gap-4">
              <div className="flex items-baseline justify-between">
                <span className="font-serif text-[18px]" style={{ color: INK }}>
                  Solo
                </span>
                <span className="font-serif text-[32px] tabular-nums" style={{ color: INK }}>
                  {prixFr(solo.prix)}&nbsp;$<span className="font-sans text-[14px]" style={{ color: MUTED }}>&nbsp;/&nbsp;mois</span>
                </span>
              </div>
              <div className="flex items-baseline justify-between border-t border-[0.5px] border-border pt-4">
                <span className="font-serif text-[18px]" style={{ color: INK }}>
                  Cabinet
                </span>
                <span className="font-serif text-[32px] tabular-nums" style={{ color: INK }}>
                  {prixFr(cabinet.prix)}&nbsp;$<span className="font-sans text-[14px]" style={{ color: MUTED }}>&nbsp;/&nbsp;mois</span>
                </span>
              </div>
            </div>
          </div>
          <Link
            href="/audit-gratuit"
            className="safe-zoom mt-8 inline-flex h-10 w-fit items-center rounded-[8px] px-5 font-sans text-[14px] font-medium transition-transform duration-200"
            style={{ background: INK, color: SURFACE }}
          >
            Faire mon audit gratuit &rarr;
          </Link>
        </motion.div>

        {/* Offre fondatrice */}
        <motion.div
          {...fadeUp(0.1)}
          className="flex flex-col rounded-[12px] border border-forest-600/40 p-8"
          style={{ background: SURFACE, boxShadow: "0 24px 60px -40px rgba(31,58,46,0.4)" }}
        >
          <span className="w-fit rounded-full bg-forest-600/10 px-2.5 py-1 font-sans text-[11px] uppercase tracking-[0.1em] text-forest-600">
            Offre fondatrice · 5 places
          </span>
          <div className="mt-6 flex items-end gap-2">
            <span className="font-serif text-[44px] leading-none tabular-nums" style={{ color: INK }}>
              50&nbsp;$
            </span>
            <span className="mb-1.5 font-sans text-[14px]" style={{ color: MUTED }}>
              /&nbsp;mois la première année
            </span>
            <span className="mb-1.5 ml-1 font-sans text-[14px] line-through" style={{ color: "#B8BDB7" }}>
              99&nbsp;$
            </span>
          </div>
          <p className="mt-4 font-sans text-[14px] leading-[1.6]" style={{ color: MUTED }}>
            Première année à tarif fondateur : 50&nbsp;$ par mois en Solo, 100&nbsp;$ par mois en
            Cabinet. Ensuite, le tarif régulier s&apos;applique.
          </p>
          <ul className="mt-6 flex flex-col gap-3">
            {inclusions.map((item, i) => (
              <li key={item} className="flex items-start gap-3 font-sans text-[13.5px] leading-[1.5] text-text-body">
                <span className="mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-forest-600/15">
                  <CheckDraw size={11} delay={0.2 + i * 0.08} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </Section>
  );
}
