"use client";

import React from "react";
import { motion } from "framer-motion";
import { LivePulse, EASE } from "./kit";

// 02 Repères de confiance — une seule ligne sobre, alignée à gauche, aucune carte, aucun compteur.
const reperes = ["Conçu au Québec", "Conforme B-1 r.5", "Données au Canada", "Construit en public"];

export function ReperesPreview() {
  return (
    <section className="border-t border-[0.5px] border-border bg-canvas px-6 py-8 sm:px-8" id="reperes">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: EASE }}
        className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-x-6 gap-y-2 font-sans text-[12px] uppercase tracking-[0.1em] text-text-muted"
      >
        <LivePulse />
        {reperes.map((r, i) => (
          <React.Fragment key={r}>
            {i > 0 && (
              <span aria-hidden className="text-border">
                ·
              </span>
            )}
            <span>{r}</span>
          </React.Fragment>
        ))}
      </motion.div>
    </section>
  );
}
