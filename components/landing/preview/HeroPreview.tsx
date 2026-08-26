"use client";

import React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { EASE, INK, MUTED, FAINT, SURFACE, GREEN, LINE, HAIR, VERIFIED, AMBER, SCENE_SHADOW, CheckDraw } from "./kit";

// 01 Hero — aligné à gauche (discipline Linear), le produit rejoué en vrai DOM sous le texte.
const ROWS = [
  { dossier: "Succession Tremblay", statut: "Facturé", statutBg: "rgba(31,42,36,0.06)", statutColor: "#4A534B", aRecevoir: "3 200 $", aRecevoirColor: INK, fiducie: "12 000 $", fiducieColor: INK },
  { dossier: "Divorce Gagnon", statut: "À relancer", statutBg: "rgba(176,122,28,0.12)", statutColor: AMBER, aRecevoir: "1 850 $", aRecevoirColor: AMBER, fiducie: "—", fiducieColor: "#B8BDB7" },
  { dossier: "Achat Rivière", statut: "Payé", statutBg: "rgb(var(--si-ink-strong-rgb) / 0.12)", statutColor: VERIFIED, aRecevoir: "0 $", aRecevoirColor: "#B8BDB7", fiducie: "8 500 $", fiducieColor: INK },
];

const up = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.55, delay, ease: EASE },
});

export function HeroPreview() {
  const reduce = useReducedMotion();

  return (
    <section className="bg-canvas px-6 pb-24 pt-28 sm:px-8">
      <div className="mx-auto max-w-[1180px]">
        {/* Bloc texte — à gauche, jamais centré */}
        <div className="max-w-[720px]">
          <motion.p {...up(0)} className="mb-6 font-mono text-[12px] tracking-[0.04em]" style={{ color: FAINT }}>
            Logiciel de gestion pour cabinets d&apos;avocats du Québec et de l&apos;Ontario
          </motion.p>

          <motion.h1
            {...up(0.1)}
            className="font-serif text-[46px] leading-[1.02] tracking-[-0.02em] sm:text-[60px] md:text-[68px]"
            style={{ color: INK }}
          >
            Votre cabinet, tenu <span className="italic" style={{ color: GREEN }}>sans faille.</span>
          </motion.h1>

          <motion.p
            {...up(0.2)}
            className="mt-6 max-w-[520px] font-sans text-[17px] leading-[1.5]"
            style={{ color: MUTED }}
          >
            SAFE tient le fidéicommis, la facturation et la conformité de votre cabinet,
            pendant que vous vous concentrez sur vos dossiers.
          </motion.p>

          <motion.div {...up(0.3)} className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/audit-gratuit"
              className="safe-zoom inline-flex h-10 items-center rounded-[8px] px-5 font-sans text-[14px] font-medium transition-transform duration-200"
              style={{ background: INK, color: SURFACE }}
            >
              Faire mon audit gratuit
            </Link>
            <Link href="/demo" className="inline-flex h-10 items-center px-1 font-sans text-[14px] font-medium" style={{ color: INK }}>
              Voir la démo&nbsp;&rarr;
            </Link>
          </motion.div>

          <motion.p {...up(0.4)} className="mt-4 font-sans text-[12px]" style={{ color: FAINT }}>
            Sans engagement, sans carte de crédit
          </motion.p>
        </div>

        {/* Scène produit — pleine largeur, animée en DOM */}
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.5, ease: EASE }}
          className="mt-16 w-full overflow-hidden rounded-[16px] text-left"
          style={{ background: SURFACE, border: `1px solid ${LINE}`, boxShadow: SCENE_SHADOW }}
        >
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: `1px solid ${LINE}` }}>
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
                    className={`px-6 py-2.5 font-sans text-[10.5px] font-medium uppercase tracking-[0.08em] ${
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
                  initial={reduce ? undefined : { opacity: 0 }}
                  animate={reduce ? undefined : { opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.75 + i * 0.12, ease: EASE }}
                >
                  <td className="px-6 py-3.5 font-sans text-[14px] font-medium" style={{ color: INK, borderTop: `1px solid ${HAIR}` }}>
                    {r.dossier}
                  </td>
                  <td className="px-6 py-3.5" style={{ borderTop: `1px solid ${HAIR}` }}>
                    <span className="inline-block rounded-full px-2.5 py-0.5 font-sans text-[11px] font-medium" style={{ background: r.statutBg, color: r.statutColor }}>
                      {r.statut}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right font-sans text-[14px] tabular-nums" style={{ color: r.aRecevoirColor, borderTop: `1px solid ${HAIR}` }}>
                    {r.aRecevoir}
                  </td>
                  <td className="hidden px-6 py-3.5 text-right font-sans text-[14px] tabular-nums sm:table-cell" style={{ color: r.fiducieColor, borderTop: `1px solid ${HAIR}` }}>
                    {r.fiducie}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.3, ease: EASE }}
            className="flex items-center gap-3 px-6 py-4"
            style={{ background: "#F3F7F3", borderTop: `1px solid ${LINE}` }}
          >
            <motion.span
              initial={reduce ? undefined : { scale: 0 }}
              animate={reduce ? undefined : { scale: 1 }}
              transition={{ duration: 0.4, delay: 1.5, ease: EASE }}
              className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full"
              style={{ background: "rgb(var(--si-ink-strong-rgb) / 0.13)" }}
            >
              <CheckDraw delay={1.6} />
            </motion.span>
            <span className="flex-1 font-sans text-[12.5px]" style={{ color: "#3A423B" }}>
              L&apos;assistant a rapproché le fidéicommis de juin.{" "}
              <span className="font-medium" style={{ color: VERIFIED }}>0 écart.</span> Vous validez.
            </span>
            <span className="flex-shrink-0 rounded-[7px] px-3.5 py-1.5 font-sans text-[12px] font-medium" style={{ background: GREEN, color: "#fff" }}>
              Valider
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
