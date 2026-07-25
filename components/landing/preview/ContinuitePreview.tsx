"use client";

import React from "react";
import { motion } from "framer-motion";
import { Section, NarrativeHeader, LivePulse, EASE, FAINT } from "./kit";

// 06 La preuve de continuité — montrer que SAFE est vivant sans inventer de traction (§06).
// Gabarits d'emplacement, PAS des affirmations publiques : à brancher sur un changelog réel.
const entriesPlaceholder = [
  "Emplacement pour la dernière amélioration livrée.",
  "Emplacement pour un correctif ou un ajustement suivant.",
  "Emplacement pour la prochaine étape annoncée publiquement.",
];

export function ContinuitePreview() {
  return (
    <Section id="continuite" className="py-[100px]">
      <NarrativeHeader
        num="06"
        eyebrow="Construit en public"
        title={
          <>
            SAFE avance <span className="italic text-forest-600">à visage découvert.</span>
          </>
        }
        description="Emplacement réservé pour un changelog réel. Dates et contenu à brancher avant toute intégration : aucune ligne ci-dessous n'est une affirmation publique."
      />

      <ul className="mt-14">
        {entriesPlaceholder.map((e, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.08, ease: EASE }}
            className="flex items-center gap-5 border-t border-[0.5px] border-border py-5"
          >
            <span className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em]" style={{ color: FAINT }}>
              <LivePulse />À définir
            </span>
            <span className="font-sans text-[14.5px] leading-[1.5] text-text-body">{e}</span>
          </motion.li>
        ))}
      </ul>
    </Section>
  );
}
