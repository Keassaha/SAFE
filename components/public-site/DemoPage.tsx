"use client";

/** Ébauche landing-v2 — Démo et contact (copy section E). Route isolée, non liée à la prod. */

import React from "react";
import { motion } from "framer-motion";
import { INK, MUTED, FAINT, GREEN, LINE, SURFACE, BG, fadeUp, PageShell, PageHeader } from "./shared";

const DEROULEMENT = [
  "Nous partons de votre façon de travailler.",
  "Nous ciblons les tâches qui demandent le plus de vérifications.",
  "Nous vous montrons seulement les parties de SAFE qui s’y rapportent.",
  "Vous posez vos questions et décidez de la suite, sans pression.",
];

const CHAMPS = [
  { label: "Nom", type: "text", placeholder: "Votre nom" },
  { label: "Courriel professionnel", type: "email", placeholder: "vous@votrecabinet.ca" },
  { label: "Nom du cabinet", type: "text", placeholder: "Votre cabinet" },
];

export default function DemoPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Démo et contact"
        titre="Commençons par votre réalité, pas par une présentation de vente."
        intro="En 20 minutes, nous regardons comment vous tenez vos dossiers, votre temps et votre fidéicommis aujourd’hui. Vous verrez ensuite si SAFE mérite d’aller plus loin."
      />

      <section className="px-6 pb-24" style={{ background: BG }}>
        <div className="mx-auto grid max-w-5xl gap-12 sm:grid-cols-2 sm:items-start">
          {/* Déroulement */}
          <motion.div {...fadeUp(0)}>
            <p className="font-mono text-[12px] uppercase tracking-[0.12em]" style={{ color: FAINT }}>
              Le déroulement
            </p>
            <ul className="mt-6 space-y-4">
              {DEROULEMENT.map((d, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: GREEN }} aria-hidden />
                  <span className="font-sans text-[16px] leading-[1.55]" style={{ color: MUTED }}>
                    {d}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Formulaire */}
          <motion.form
            {...fadeUp(0.1)}
            onSubmit={(e) => e.preventDefault()}
            className="rounded-[16px] p-7"
            style={{ background: SURFACE, border: `1px solid ${LINE}` }}
          >
            <div className="space-y-4">
              {CHAMPS.map((c) => (
                <label key={c.label} className="block">
                  <span className="font-sans text-[13px] font-medium" style={{ color: INK }}>
                    {c.label}
                  </span>
                  <input
                    type={c.type}
                    placeholder={c.placeholder}
                    className="mt-1.5 h-11 w-full rounded-[8px] px-3.5 font-sans text-[14.5px] outline-none"
                    style={{ background: "#fff", border: `1px solid ${LINE}`, color: INK }}
                  />
                </label>
              ))}
            </div>
            <button
              type="submit"
              className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-[8px] font-sans text-[15px] font-medium transition-transform duration-200 hover:-translate-y-0.5"
              style={{ background: GREEN, color: "#fff" }}
            >
              Choisir un moment
            </button>
            <p className="mt-4 font-sans text-[12px] leading-[1.5]" style={{ color: FAINT }}>
              Vos coordonnées servent uniquement à répondre à votre demande et à organiser la
              rencontre. Elles ne sont pas vendues ni partagées à des fins de prospection par des
              tiers.
            </p>
          </motion.form>
        </div>
      </section>
    </PageShell>
  );
}
