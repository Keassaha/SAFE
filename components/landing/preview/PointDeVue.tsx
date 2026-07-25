"use client";

import React from "react";
import { motion } from "framer-motion";
import { Section, NarrativeHeader, fadeUp, INK, MUTED, LINE, EASE } from "./kit";

// 04 Le point de vue SAFE — trois principes numérotés en séquence verticale à gauche,
// puis la ligne « copilote du copilote » (§04). Pas de trois cartes centrées.
const principes = [
  {
    num: "01",
    titre: "Préparer avant que l'urgence arrive.",
    texte: "Le travail est prêt en amont : dossiers à jour, échéances connues, documents classés. L'inspection devient un état à consulter, pas une nuit blanche.",
  },
  {
    num: "02",
    titre: "Vérifier avant que l'erreur circule.",
    texte: "Le fidéicommis se rapproche chaque mois, sou par sou. Ce qui cloche remonte tout seul, avant de sortir du cabinet.",
  },
  {
    num: "03",
    titre: "Faire entrer l'argent sans perdre le contrôle.",
    texte: "Le temps saisi devient facture, la facture devient paiement. Rien ne part sans validation, rien ne dort par oubli.",
  },
];

const roles = [
  { qui: "L'adjointe", fait: "garde le jugement et la main." },
  { qui: "SAFE", fait: "prépare, classe et signale." },
  { qui: "L'avocat", fait: "valide ce qui compte." },
];

export function PointDeVue() {
  return (
    <Section id="point-de-vue" className="py-[120px]">
      <NarrativeHeader
        num="04"
        eyebrow="Le point de vue"
        title={
          <>
            Préparer, vérifier, encaisser.{" "}
            <span className="italic text-forest-600">Dans cet ordre.</span>
          </>
        }
        description="SAFE ne remplace personne. Votre adjointe est le copilote de votre cabinet, SAFE est le sien."
      />

      <div className="mt-16 flex flex-col">
        {principes.map((p, i) => (
          <motion.div
            key={p.num}
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55, delay: i * 0.1, ease: EASE }}
            className="grid gap-4 py-9 md:grid-cols-12 md:gap-10"
            style={{ borderTop: `1px solid ${LINE}` }}
          >
            <div className="md:col-span-1">
              <span className="font-mono text-[13px] text-forest-600">{p.num}</span>
            </div>
            <h3 className="font-serif text-[24px] leading-[1.12] tracking-[-0.01em] text-text-primary md:col-span-6">
              {p.titre}
            </h3>
            <p className="max-w-[42ch] font-sans text-[14.5px] leading-[1.65] text-text-body md:col-span-5">
              {p.texte}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Copilote du copilote : trois rôles sur une ligne, à gauche */}
      <motion.div
        {...fadeUp(0.1)}
        className="mt-4 grid gap-px overflow-hidden rounded-[12px] sm:grid-cols-3"
        style={{ background: LINE, border: `1px solid ${LINE}` }}
      >
        {roles.map((r) => (
          <div key={r.qui} className="bg-canvas px-6 py-6">
            <p className="font-serif text-[17px] italic text-forest-600">{r.qui}</p>
            <p className="mt-1.5 font-sans text-[14px] leading-[1.5]" style={{ color: MUTED }}>
              {r.fait}
            </p>
          </div>
        ))}
      </motion.div>
    </Section>
  );
}
