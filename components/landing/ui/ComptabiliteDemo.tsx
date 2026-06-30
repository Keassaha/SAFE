"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check, Download } from "lucide-react";
import { useSafeMotion } from "@/lib/motion";
import { DemoWindow, ScriptedCursor, useScriptedClick } from "./demoKit";

const POSTES = [
  { label: "Encaissé ce mois", valeur: "1 106,64 $", ton: "text-forest-800" },
  { label: "Reste à recevoir", valeur: "1 937,89 $", ton: "text-text-primary" },
  { label: "Dépenses", valeur: "612,40 $", ton: "text-text-primary" },
  { label: "Fidéicommis (séparé)", valeur: "16 000,00 $", ton: "text-text-primary" },
];

/**
 * Démo INTERACTIVE Comptabilité : le curseur clique « Exporter pour le comptable »
 * et l'export se prépare réellement (état « Prêt à transmettre »). En boucle.
 */
export function ComptabiliteDemo() {
  const { reduceMotion } = useSafeMotion();
  const { active, clicking, cursor, bodyRef, targetRef } = useScriptedClick(reduceMotion);

  return (
    <DemoWindow label="safecabinet.ca · Comptabilité" bodyRef={bodyRef}>
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif text-[19px] text-text-primary leading-tight">L&apos;argent du cabinet</h3>
          <p className="text-[12px] text-text-subtle mt-0.5">Juin 2026, chaque flux séparé</p>
        </div>
        <motion.span
          key={active ? "done" : "todo"}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${
            active ? "bg-forest-700/[0.1] text-forest-800" : "bg-amber-100 text-amber-800"
          }`}
        >
          {active ? "Exporté" : "À transmettre"}
        </motion.span>
      </div>

      {/* Postes */}
      <div className="mt-5 grid grid-cols-2 gap-2.5">
        {POSTES.map((p) => (
          <div key={p.label} className="rounded-xl border border-[0.5px] border-border bg-canvas px-3.5 py-2.5">
            <p className="text-[11px] text-text-subtle">{p.label}</p>
            <p className={`mt-0.5 font-mono text-[15px] font-semibold tabular-nums ${p.ton}`}>{p.valeur}</p>
          </div>
        ))}
      </div>

      {/* Action / état exporté */}
      <div className="mt-4 h-10 flex items-center">
        {active ? (
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 20 }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-forest-700/[0.1] px-3 py-1.5 text-[13px] font-medium text-forest-800"
          >
            <Check className="h-4 w-4" strokeWidth={2.5} />
            Export prêt à transmettre à votre comptable
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
            <Download className="h-4 w-4" strokeWidth={2.25} />
            Exporter pour le comptable
          </span>
        )}
      </div>

      <p className="mt-4 text-[12px] text-text-subtle">
        Cash, factures, créances, dépenses et fidéicommis, toujours séparés.
      </p>

      {!reduceMotion && <ScriptedCursor x={cursor.x} y={cursor.y} clicking={clicking} />}
    </DemoWindow>
  );
}
