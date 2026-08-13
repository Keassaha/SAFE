"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import {
  Section,
  NarrativeHeader,
  SceneFrame,
  AnimatedAmount,
  CheckDraw,
  EASE,
  INK,
  MUTED,
  FAINT,
  SURFACE,
  GREEN,
  VERIFIED,
  AMBER,
  LINE,
  HAIR,
} from "./kit";

// 05 Démonstration en trois actes — grille narrative Linear (§3.3) + scènes produit animées en DOM.
// Acte 01 Tenir : les lignes entrent en cascade, un fanion « Prêt » apparaît.
// Acte 02 Vérifier : journal et banque montent, l'écart descend jusqu'à 0, la coche se dessine.
// Acte 03 Encaisser : un statut bascule vers « Payée », le solde à recevoir baisse.

function SceneTenir() {
  const reduce = useReducedMotion();
  const rows = [
    { dossier: "Succession Tremblay", tache: "Préparer l'inventaire", echeance: "Dans 3 j" },
    { dossier: "Divorce Gagnon", tache: "Réviser l'entente", echeance: "Dans 6 j" },
    { dossier: "Achat Rivière", tache: "Confirmer la clôture", echeance: "Aujourd'hui" },
  ];
  return (
    <SceneFrame>
      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${LINE}` }}>
        <span className="font-sans text-[14px] font-medium" style={{ color: INK }}>
          À faire cette semaine
        </span>
        <span className="font-mono text-[12px]" style={{ color: FAINT }}>
          3 dossiers actifs
        </span>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {["Dossier", "Tâche", "Échéance", "Statut"].map((h, i) => (
              <th
                key={h}
                className={`px-6 py-2.5 font-sans text-[10.5px] font-medium uppercase tracking-[0.08em] ${
                  i >= 2 ? "text-right" : "text-left"
                } ${i === 1 ? "hidden sm:table-cell" : ""}`}
                style={{ color: "#9AA09A" }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <motion.tr
              key={r.dossier}
              initial={reduce ? undefined : { opacity: 0, y: 8 }}
              whileInView={reduce ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: i * 0.15, ease: EASE }}
            >
              <td className="px-6 py-3.5 font-sans text-[14px] font-medium" style={{ color: INK, borderTop: `1px solid ${HAIR}` }}>
                {r.dossier}
              </td>
              <td className="hidden px-6 py-3.5 font-sans text-[13px] sm:table-cell" style={{ color: MUTED, borderTop: `1px solid ${HAIR}` }}>
                {r.tache}
              </td>
              <td
                className="px-6 py-3.5 text-right font-sans text-[13px]"
                style={{ color: r.echeance === "Aujourd'hui" ? AMBER : MUTED, borderTop: `1px solid ${HAIR}` }}
              >
                {r.echeance}
              </td>
              <td className="px-6 py-3.5 text-right" style={{ borderTop: `1px solid ${HAIR}` }}>
                <motion.span
                  initial={reduce ? undefined : { opacity: 0, scale: 0.8 }}
                  whileInView={reduce ? undefined : { opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: 0.55 + i * 0.15, ease: EASE }}
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-sans text-[11px] font-medium"
                  style={{ background: "rgb(var(--si-forest-rgb) / 0.12)", color: VERIFIED }}
                >
                  <CheckDraw size={10} delay={0.7 + i * 0.15} />
                  Prêt
                </motion.span>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </SceneFrame>
  );
}

function SceneVerifier() {
  const reduce = useReducedMotion();
  const cells = [
    { label: "Journal", value: 24700, from: 0, accent: false },
    { label: "Banque", value: 24700, from: 0, accent: false },
    { label: "Écart", value: 0, from: 340, accent: true },
  ];
  return (
    <SceneFrame>
      <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${LINE}` }}>
        <span className="font-sans text-[14px] font-medium" style={{ color: INK }}>
          Fidéicommis, rapprochement de juin
        </span>
        <span className="font-mono text-[12px]" style={{ color: FAINT }}>
          Juin 2026
        </span>
      </div>
      <div className="grid grid-cols-3 gap-px" style={{ background: LINE }}>
        {cells.map((c) => (
          <div key={c.label} className="px-3 py-5 sm:px-6" style={{ background: SURFACE }}>
            <p className="font-sans text-[11px] uppercase tracking-[0.08em]" style={{ color: FAINT }}>
              {c.label}
            </p>
            <AnimatedAmount
              value={c.value}
              from={c.from}
              duration={c.accent ? 1.3 : 1}
              className="mt-2 block whitespace-nowrap font-serif text-[19px] tabular-nums sm:text-[26px]"
              style={{ color: c.accent ? VERIFIED : INK }}
            />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-3 px-6 py-4" style={{ background: "#F3F7F3", borderTop: `1px solid ${LINE}` }}>
        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full" style={{ background: "rgb(var(--si-forest-rgb) / 0.13)" }}>
          <CheckDraw delay={1.2} />
        </span>
        <span className="flex-1 font-sans text-[12.5px]" style={{ color: "#3A423B" }}>
          Aucun écart entre le journal, la banque et le grand livre.{" "}
          <span className="font-medium" style={{ color: VERIFIED }}>
            Le rapport est prêt à signer.
          </span>
        </span>
        <span className="flex-shrink-0 rounded-[7px] px-3.5 py-1.5 font-sans text-[12px] font-medium" style={{ background: GREEN, color: "#fff" }}>
          Valider
        </span>
      </div>
    </SceneFrame>
  );
}

type Invoice = {
  facture: string;
  client: string;
  montant: string;
  statutInitial: { label: string; bg: string; color: string };
  statutFinal?: { label: string; bg: string; color: string };
};

const invoices: Invoice[] = [
  {
    facture: "F-2026-0142",
    client: "Succession Tremblay",
    montant: "3 200 $",
    statutInitial: { label: "Envoyée", bg: "rgba(31,42,36,0.06)", color: "#4A534B" },
    statutFinal: { label: "Payée", bg: "rgb(var(--si-forest-rgb) / 0.12)", color: VERIFIED },
  },
  {
    facture: "F-2026-0143",
    client: "Divorce Gagnon",
    montant: "1 850 $",
    statutInitial: { label: "Relance envoyée", bg: "rgba(176,122,28,0.12)", color: AMBER },
  },
  {
    facture: "F-2026-0144",
    client: "Achat Rivière",
    montant: "4 400 $",
    statutInitial: { label: "Envoyée", bg: "rgba(31,42,36,0.06)", color: "#4A534B" },
  },
];

function SceneEncaisser() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setPaid(true);
      return;
    }
    const t = setTimeout(() => setPaid(true), 1100);
    return () => clearTimeout(t);
  }, [inView, reduce]);

  return (
    <div ref={ref}>
      <SceneFrame>
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${LINE}` }}>
          <span className="font-sans text-[14px] font-medium" style={{ color: INK }}>
            Factures en cours
          </span>
          <span className="font-mono text-[12px]" style={{ color: FAINT }}>
            <AnimatedAmount value={paid ? 6250 : 9450} from={9450} duration={0.6} suffix=" $ à recevoir" />
          </span>
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["Facture", "Client", "Montant", "Statut"].map((h, i) => (
                <th
                  key={h}
                  className={`px-6 py-2.5 font-sans text-[10.5px] font-medium uppercase tracking-[0.08em] ${
                    i === 2 ? "text-right" : "text-left"
                  } ${i === 0 ? "hidden sm:table-cell" : ""}`}
                  style={{ color: "#9AA09A" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoices.map((r, i) => {
              const showFinal = paid && r.statutFinal;
              const statut = showFinal ? r.statutFinal! : r.statutInitial;
              return (
                <tr key={r.facture}>
                  <td className="hidden px-6 py-3.5 font-mono text-[12.5px] sm:table-cell" style={{ color: MUTED, borderTop: `1px solid ${HAIR}` }}>
                    {r.facture}
                  </td>
                  <td className="px-6 py-3.5 font-sans text-[14px] font-medium" style={{ color: INK, borderTop: `1px solid ${HAIR}` }}>
                    {r.client}
                  </td>
                  <td className="px-6 py-3.5 text-right font-sans text-[14px] tabular-nums" style={{ color: INK, borderTop: `1px solid ${HAIR}` }}>
                    {r.montant}
                  </td>
                  <td className="px-6 py-3.5" style={{ borderTop: `1px solid ${HAIR}` }}>
                    <motion.span
                      key={statut.label}
                      initial={reduce || i !== 0 ? false : { opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, ease: EASE }}
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-sans text-[11px] font-medium"
                      style={{ background: statut.bg, color: statut.color }}
                    >
                      {showFinal && <CheckDraw size={10} color={VERIFIED} delay={0} />}
                      {statut.label}
                    </motion.span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </SceneFrame>
    </div>
  );
}

const actes = [
  {
    num: "01",
    eyebrow: "Tenir",
    titre: "Le cabinet sait ce qui doit être fait.",
    texte: "Dossiers, temps et échéances vivent au même endroit. Rien ne repose sur la mémoire de quelqu'un.",
    resultat: "Le cabinet sait ce qui doit être fait et ce qui est prêt.",
    scene: <SceneTenir />,
  },
  {
    num: "02",
    eyebrow: "Vérifier",
    titre: "Les écarts se voient avant de devenir des problèmes.",
    texte: "Le fidéicommis se rapproche chaque mois, sou par sou. Ce qui cloche remonte tout seul, ce qui est bon se valide en un geste.",
    resultat: "Les écarts sont visibles avant de devenir des problèmes.",
    scene: <SceneVerifier />,
  },
  {
    num: "03",
    eyebrow: "Encaisser",
    titre: "Le travail livré devient plus facilement un paiement reçu.",
    texte: "Le temps saisi devient une facture. La facture part, se suit, et relance elle-même si personne n'a répondu.",
    resultat: "Le travail accompli devient plus facilement du revenu encaissé.",
    scene: <SceneEncaisser />,
  },
];

export function TroisActes() {
  return (
    <Section id="demonstration" className="py-[120px]">
      <NarrativeHeader
        num="05"
        eyebrow="La démonstration"
        title={
          <>
            Trois actes, <span className="italic text-forest-600">un seul système.</span>
          </>
        }
        description="Tenir, vérifier, encaisser. Chaque acte est une scène réelle du produit, pas la même capture répétée trois fois."
      />

      <div className="mt-20 flex flex-col gap-24">
        {actes.map((a) => (
          <div key={a.num}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-12 md:items-end">
              <div className="md:col-span-6">
                <span className="mb-3 block font-mono text-[13px] text-forest-600">
                  &mdash; {a.num} {a.eyebrow}
                </span>
                <h3 className="max-w-[18ch] font-serif text-[28px] leading-[1.1] tracking-[-0.015em] text-text-primary">
                  {a.titre}
                </h3>
              </div>
              <div className="md:col-span-6">
                <p className="max-w-[44ch] font-sans text-[14.5px] leading-[1.65] text-text-body">{a.texte}</p>
              </div>
            </div>

            <div className="mt-9">{a.scene}</div>

            <div className="mt-5 flex items-center gap-2.5">
              <span className="h-px w-6 bg-forest-600/50" />
              <span className="font-serif text-[13px] italic text-text-subtle">{a.resultat}</span>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}
