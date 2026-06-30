"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check, Scale } from "lucide-react";
import { useSafeMotion } from "@/lib/motion";
import { DemoWindow, ScriptedCursor, useScriptedClick } from "./demoKit";

const COMPTES = [
  { client: "Constructions Beaulieu inc.", dossier: "2026-002", solde: "16 000,00 $" },
  { client: "Succession Tremblay", dossier: "2026-005", solde: "4 250,00 $" },
];

/**
 * Démo INTERACTIVE Fidéicommis : le curseur clique « Réconcilier » et la
 * conciliation passe réellement à « Certifiée, aucun écart ». En boucle.
 */
export function FideicommisDemo() {
  const { reduceMotion } = useSafeMotion();
  const { active, clicking, cursor, bodyRef, targetRef } = useScriptedClick(reduceMotion);

  return (
    <DemoWindow label="safecabinet.ca · Fidéicommis" bodyRef={bodyRef}>
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif text-[19px] text-text-primary leading-tight">Comptes en fidéicommis</h3>
          <p className="text-[12px] text-text-subtle mt-0.5">Soldes par client et par dossier</p>
        </div>
        <motion.span
          key={active ? "done" : "todo"}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${
            active ? "bg-forest-700/[0.1] text-forest-800" : "bg-amber-100 text-amber-800"
          }`}
        >
          {active ? "Conciliée" : "À concilier"}
        </motion.span>
      </div>

      {/* Soldes */}
      <div className="mt-5 rounded-xl border border-[0.5px] border-border bg-canvas divide-y divide-border">
        {COMPTES.map((c) => (
          <div key={c.dossier} className="flex items-center justify-between px-4 py-2.5">
            <div>
              <p className="text-[14px] font-medium text-text-primary">{c.client}</p>
              <p className="font-mono text-[11px] text-text-subtle">Dossier {c.dossier}</p>
            </div>
            <span className="font-mono text-[14px] text-text-primary tabular-nums">{c.solde}</span>
          </div>
        ))}
      </div>

      {/* Action / état */}
      <div className="mt-4 h-10 flex items-center">
        {active ? (
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 20 }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-forest-700/[0.1] px-3 py-1.5 text-[13px] font-medium text-forest-800"
          >
            <Check className="h-4 w-4" strokeWidth={2.5} />
            Conciliation certifiée, aucun écart
          </motion.span>
        ) : (
          <span
            ref={(el) => {
              targetRef.current = el;
            }}
            className={`inline-flex items-center gap-1.5 rounded-lg bg-forest-700 px-3 py-1.5 text-[13px] font-medium text-forest-50 ${
              clicking ? "scale-95" : ""
            } transition-transform`}
          >
            <Scale className="h-4 w-4" strokeWidth={2.25} />
            Réconcilier
          </span>
        )}
      </div>

      <p className="mt-4 text-[12px] text-text-subtle">
        Aucun solde négatif. Chaque mouvement tracé, prêt pour l&apos;inspection.
      </p>

      {!reduceMotion && <ScriptedCursor x={cursor.x} y={cursor.y} clicking={clicking} />}
    </DemoWindow>
  );
}
