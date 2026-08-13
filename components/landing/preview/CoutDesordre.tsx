"use client";

import React from "react";
import { motion } from "framer-motion";
import { Section, NarrativeHeader, SceneFrame, AnimatedAmount, fadeUp, INK, MUTED, FAINT, AMBER, LINE, HAIR } from "./kit";

// 03 Le coût du désordre — nommer les pertes sans dramatisation (§03). Une scène « état du mois »
// où trois chiffres montent calmement, puis les frictions du quotidien en liste à gauche.
const metrics = [
  { label: "Temps non facturé ce mois", value: 14, suffix: " h", prefix: "", color: INK, note: "saisi mais pas encore sur une facture" },
  { label: "En attente de facturation", value: 4300, suffix: " $", prefix: "", color: INK, note: "travail livré, facture pas encore partie" },
  { label: "Trésorerie immobilisée", value: 9450, suffix: " $", prefix: "", color: AMBER, note: "facturé, en attente de paiement" },
];

const frictions = [
  "Des heures de travail réel qui n'atteignent jamais la facture.",
  "Des factures qui partent des semaines après le travail livré.",
  "Une trésorerie qui dort entre le dossier fermé et le paiement reçu.",
  "Des registres et rapprochements longs à vérifier au moment voulu.",
  "Des échéances qui reposent sur la mémoire de quelqu'un.",
];

export function CoutDesordre() {
  return (
    <Section id="cout" className="py-[120px]">
      <NarrativeHeader
        num="03"
        eyebrow="L'enjeu"
        title={
          <>
            Le risque n&apos;est pas de mal faire.{" "}
            <span className="italic text-forest-600">C&apos;est de ne pas tout suivre à temps.</span>
          </>
        }
        description="Rien de dramatique. Juste ce qui attend, mois après mois, quand chaque suivi dépend d'une personne et d'un tableur."
      />

      <div className="mt-16 grid gap-10 md:grid-cols-12 md:gap-12">
        {/* Scène : état du mois, chiffres qui montent */}
        <div className="md:col-span-7">
          <SceneFrame>
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${LINE}` }}>
              <span className="font-sans text-[14px] font-medium" style={{ color: INK }}>
                Ce qui attend, ce mois-ci
              </span>
              <span className="font-mono text-[12px]" style={{ color: FAINT }}>
                Juin 2026
              </span>
            </div>
            <div>
              {metrics.map((m, i) => (
                <motion.div
                  key={m.label}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                  className="flex items-center justify-between px-6 py-5"
                  style={{ borderTop: i === 0 ? undefined : `1px solid ${HAIR}` }}
                >
                  <div className="pr-4">
                    <p className="font-sans text-[13.5px] font-medium" style={{ color: INK }}>
                      {m.label}
                    </p>
                    <p className="mt-0.5 font-sans text-[12px]" style={{ color: FAINT }}>
                      {m.note}
                    </p>
                  </div>
                  <AnimatedAmount
                    value={m.value}
                    suffix={m.suffix}
                    prefix={m.prefix}
                    className="whitespace-nowrap font-serif text-[26px] tabular-nums"
                    style={{ color: m.color }}
                  />
                </motion.div>
              ))}
            </div>
          </SceneFrame>
        </div>

        {/* Frictions du quotidien, en liste à gauche */}
        <motion.ul {...fadeUp(0.1)} className="md:col-span-5 md:pt-2">
          {frictions.map((f, i) => (
            <li
              key={f}
              className="flex gap-4 py-4 font-sans text-[14px] leading-[1.55] text-text-body"
              style={{ borderTop: i === 0 ? undefined : `1px solid ${LINE}` }}
            >
              <span className="mt-0.5 font-mono text-[12px] text-forest-600">0{i + 1}</span>
              <span>{f}</span>
            </li>
          ))}
        </motion.ul>
      </div>
    </Section>
  );
}
