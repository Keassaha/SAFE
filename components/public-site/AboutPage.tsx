"use client";

/** Page publique À propos, issue du copy révisé. */

import React from "react";
import { motion } from "framer-motion";
import { INK, MUTED, FAINT, LINE, BG, fadeUp, PageShell, PageHeader } from "./shared";

const HISTOIRE = [
  "Avant SAFE, j’ai travaillé directement avec un cabinet d’avocats en Ontario. Le système en place ne suivait plus la réalité du travail.",
  "La facturation était largement manuelle. Les renseignements étaient répartis dans des fichiers Excel qui ne se parlaient pas. Il n’y avait pas de véritable fiche de temps ni de vue centrale des dossiers. Pour produire une facture ou vérifier un compte, il fallait retrouver l’information, la recouper et souvent la saisir de nouveau.",
  "Les procédures s’allongeaient parce que chaque étape dépendait de la précédente et que rien ne gardait le fil automatiquement. La conformité était difficile à vérifier au quotidien. Ce n’était pas un manque de rigueur de la part du cabinet. C’était un système qui demandait trop de travail manuel pour rester fiable.",
  "C’est pour répondre à ce problème que j’ai créé SAFE.",
  "J’ai commencé par relier ce qui était dispersé : les dossiers, les fiches de temps, les débours, la facturation et le fidéicommis. L’objectif n’était pas d’ajouter un logiciel de plus. C’était de réduire les étapes manuelles, de rendre l’information plus facile à vérifier et de soutenir la conformité dans le travail de tous les jours.",
  "SAFE ne remplace pas la personne qui connaît le cabinet. Il lui donne un système qui garde le fil, signale ce qui demande son attention et l’aide à terminer le travail sans tout reprendre.",
  "Je n’ai pas découvert ce problème dans une étude de marché. Je l’ai vu, puis je l’ai travaillé de l’intérieur. C’est encore ainsi que SAFE évolue aujourd’hui : à partir des besoins réels d’un cabinet ontarien et des exigences propres à la pratique juridique canadienne.",
];

export default function AProposPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="À propos"
        titre="J’ai créé SAFE parce qu’un cabinet méritait mieux qu’un système manuel."
      />

      <section className="px-6 pb-24" style={{ background: BG }}>
        <div className="mx-auto max-w-2xl">
          <motion.div {...fadeUp(0)} className="space-y-5 font-sans text-[17px] leading-[1.65]" style={{ color: MUTED }}>
            {HISTOIRE.map((p, i) => (
              <p key={i} style={i === 3 ? { color: INK, fontWeight: 500 } : undefined}>
                {p}
              </p>
            ))}
          </motion.div>

          <motion.div {...fadeUp(0.1)} className="mt-12 pt-6" style={{ borderTop: `1px solid ${LINE}` }}>
            <p className="font-serif text-[20px] italic" style={{ color: INK }}>
              Jérémie Tiahou
            </p>
            <p className="mt-1 font-sans text-[13.5px]" style={{ color: FAINT }}>
              Fondateur de SAFE
            </p>
          </motion.div>
        </div>
      </section>
    </PageShell>
  );
}
