"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

// DA « Attio » validée CEO 2026-07-22 (analyse mesurée : docs/journal/2026-07-22_analyse_attio_mesuree_navigateur.md)
// — Sans-serif serré (64px/600, interligne 0.95), CTA compacts 36px radius 10.
// — Le produit est rejoué en vrai DOM (tableau de dossiers + assistant), pas une capture.
// — Animations : entrées 500 ms, cascade 120 ms, easing signature (0.2, 0, 0, 1).
// — Base verdâtre SAFE conservée (structure d'Attio, chaleur de SAFE).
const BG = "#EFF2ED";
const SURFACE = "#FBFCFA";
const INK = "#141A16";
const MUTED = "#5A665F";
const FAINT = "#7C877F";
/* L'accent de la vitrine suit désormais l'action de l'application.
 * Il valait #12A150, un vert vif étranger à la palette, déclaré deux fois.
 * Source unique : `si-ink-strong` dans lib/ds/palettes.ts. */
const GREEN = "var(--si-ink-strong)";
const LINE = "rgba(31,42,36,0.08)";

const EASE = [0.2, 0, 0, 1] as const;

const ROWS = [
  {
    dossier: "Succession Tremblay",
    statut: "Facturé",
    statutBg: "rgba(31,42,36,0.06)",
    statutColor: "#4A534B",
    aRecevoir: "3 200 $",
    aRecevoirColor: INK,
    fiducie: "12 000 $",
    fiducieColor: INK,
  },
  {
    dossier: "Divorce Gagnon",
    statut: "À relancer",
    statutBg: "rgba(176,122,28,0.12)",
    statutColor: "#8A6A1E",
    aRecevoir: "1 850 $",
    aRecevoirColor: "#8A6A1E",
    fiducie: "—",
    fiducieColor: "#B8BDB7",
  },
  {
    dossier: "Achat Rivière",
    statut: "Payé",
    statutBg: "rgb(var(--si-ink-strong-rgb) / 0.12)",
    statutColor: "var(--si-verified)",
    aRecevoir: "0 $",
    aRecevoirColor: "#B8BDB7",
    fiducie: "8 500 $",
    fiducieColor: INK,
  },
];

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: EASE },
});

export function Hero() {
  return (
    <section
      className="relative flex flex-col items-center px-6 pt-24 pb-20 text-center"
      style={{ background: BG }}
    >
      <motion.p
        {...fadeUp(0)}
        className="mb-5 font-sans text-[13px]"
        style={{ color: FAINT }}
      >
        Logiciel de gestion pour cabinets d&apos;avocats du Québec et de l&apos;Ontario
      </motion.p>

      <motion.h1
        {...fadeUp(0.12)}
        className="max-w-3xl font-serif text-[46px] sm:text-[58px] md:text-[66px]"
        style={{ color: INK, letterSpacing: "-0.015em", lineHeight: 1.02 }}
      >
        Votre cabinet, tenu <span className="italic" style={{ color: GREEN }}>sans faille.</span>
      </motion.h1>

      <motion.p
        {...fadeUp(0.24)}
        className="mt-5 max-w-[460px] font-sans text-[16px] font-medium leading-[1.45]"
        style={{ color: MUTED }}
      >
        SAFE tient le fidéicommis, la facturation et la conformité de votre cabinet,
        pendant que vous vous concentrez sur vos dossiers.
      </motion.p>

      <motion.div {...fadeUp(0.36)} className="mt-7 flex items-center gap-3">
        <Link
          href="/audit-gratuit"
          className="inline-flex h-9 items-center rounded-[10px] px-4 font-sans text-[14px] font-medium transition-colors duration-300"
          style={{ background: INK, color: SURFACE }}
        >
          Faire mon audit gratuit
        </Link>
        <Link
          href="/demo"
          className="inline-flex h-9 items-center px-2 font-sans text-[14px] font-medium transition-colors duration-300"
          style={{ color: INK }}
        >
          Voir la démo&nbsp;&rarr;
        </Link>
      </motion.div>

      <motion.p {...fadeUp(0.48)} className="mt-3 font-sans text-[12px]" style={{ color: FAINT }}>
        Sans engagement, sans carte de crédit
      </motion.p>

      {/* Produit rejoué en vrai DOM — le cœur de la DA */}
      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.55, ease: EASE }}
        className="mt-14 w-full max-w-[860px] overflow-hidden rounded-[14px] text-left"
        style={{
          background: SURFACE,
          border: `1px solid ${LINE}`,
          boxShadow: "0 24px 60px -32px rgba(20,26,22,0.28)",
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-3.5"
          style={{ borderBottom: `1px solid ${LINE}` }}
        >
          <span className="font-sans text-[14px] font-medium" style={{ color: INK }}>
            Dossiers actifs
          </span>
          <span className="font-sans text-[12px]" style={{ color: FAINT }}>
            Juin 2026 · CAD
          </span>
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr>
              {["Dossier", "Statut", "À recevoir", "Fidéicommis"].map((h, i) => (
                <th
                  key={h}
                  className={`px-5 py-2.5 font-sans text-[10.5px] font-medium uppercase tracking-[0.08em] ${
                    i >= 2 ? "text-right" : "text-left"
                  } ${i === 3 ? "hidden sm:table-cell" : ""}`}
                  style={{ color: "#9AA09A" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r, i) => (
              <motion.tr
                key={r.dossier}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.8 + i * 0.12, ease: EASE }}
              >
                <td
                  className="px-5 py-3 font-sans text-[13.5px] font-medium"
                  style={{ color: INK, borderTop: `1px solid rgba(31,42,36,0.05)` }}
                >
                  {r.dossier}
                </td>
                <td className="px-5 py-3" style={{ borderTop: `1px solid rgba(31,42,36,0.05)` }}>
                  <span
                    className="inline-block rounded-full px-2.5 py-0.5 font-sans text-[11px] font-medium"
                    style={{ background: r.statutBg, color: r.statutColor }}
                  >
                    {r.statut}
                  </span>
                </td>
                <td
                  className="px-5 py-3 text-right font-sans text-[13.5px] tabular-nums"
                  style={{ color: r.aRecevoirColor, borderTop: `1px solid rgba(31,42,36,0.05)` }}
                >
                  {r.aRecevoir}
                </td>
                <td
                  className="hidden px-5 py-3 text-right font-sans text-[13.5px] tabular-nums sm:table-cell"
                  style={{ color: r.fiducieColor, borderTop: `1px solid rgba(31,42,36,0.05)` }}
                >
                  {r.fiducie}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        {/* L'assistant au travail — la preuve d'intelligence, sans décoration IA */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.35, ease: EASE }}
          className="flex items-center gap-3 px-5 py-3.5"
          style={{ background: "#F3F7F3", borderTop: `1px solid ${LINE}` }}
        >
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4, delay: 1.55, ease: EASE }}
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full"
            style={{ background: "rgb(var(--si-ink-strong-rgb) / 0.13)" }}
            aria-hidden
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path
                d="M3 7.2 5.6 9.8 11 3.8"
                stroke={GREEN}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.span>
          <span className="flex-1 font-sans text-[12.5px]" style={{ color: "#3A423B" }}>
            L&apos;assistant a rapproché le fidéicommis de juin.{" "}
            <span className="font-medium" style={{ color: "var(--si-verified)" }}>
              0 écart.
            </span>{" "}
            Vous validez.
          </span>
          <span
            className="flex-shrink-0 rounded-[7px] px-3.5 py-1.5 font-sans text-[12px] font-medium"
            style={{ background: GREEN, color: "#fff" }}
          >
            Valider
          </span>
        </motion.div>
      </motion.div>

      <motion.div
        {...fadeUp(0.7)}
        className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 font-sans text-[12px]"
        style={{ color: FAINT }}
      >
        <span>Conçu au Québec</span>
        <span aria-hidden>·</span>
        <span>Conforme B-1&nbsp;r.5</span>
        <span aria-hidden>·</span>
        <span>Données au Canada</span>
      </motion.div>
    </section>
  );
}
