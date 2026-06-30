"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check, FileText } from "lucide-react";
import { useSafeMotion } from "@/lib/motion";
import { DemoWindow, ScriptedCursor, useScriptedClick } from "./demoKit";

const HEURES = [
  { desc: "Vérification diligente et titres", h: "6,0 h", montant: "1 800,00 $" },
  { desc: "Négociation et révision de l'acte", h: "4,5 h", montant: "1 350,00 $" },
];

/**
 * Démo INTERACTIVE Facturation : le curseur clique « Générer la facture » et les
 * heures saisies deviennent réellement une facture numérotée. En boucle.
 */
export function FactureDemo() {
  const { reduceMotion } = useSafeMotion();
  const { active, clicking, cursor, bodyRef, targetRef } = useScriptedClick(reduceMotion);

  return (
    <DemoWindow label="safecabinet.ca · Facturation" bodyRef={bodyRef}>
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif text-[19px] text-text-primary leading-tight">Temps à facturer</h3>
          <p className="text-[12px] text-text-subtle mt-0.5">Constructions Beaulieu inc.</p>
        </div>
        <motion.span
          key={active ? "done" : "todo"}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${
            active ? "bg-forest-700/[0.1] text-forest-800" : "bg-amber-100 text-amber-800"
          }`}
        >
          {active ? "Facturé" : "10,5 h en attente"}
        </motion.span>
      </div>

      {/* Lignes de temps */}
      <motion.div
        animate={{ opacity: active ? 0.45 : 1 }}
        className="mt-5 rounded-xl border border-[0.5px] border-border bg-canvas divide-y divide-border"
      >
        {HEURES.map((l) => (
          <div key={l.desc} className="flex items-center justify-between px-4 py-2.5">
            <div>
              <p className="text-[14px] font-medium text-text-primary">{l.desc}</p>
              <p className="font-mono text-[11px] text-text-subtle">{l.h} · 300,00 $/h</p>
            </div>
            <span className="font-mono text-[14px] text-text-primary tabular-nums">{l.montant}</span>
          </div>
        ))}
      </motion.div>

      {/* Action / facture créée */}
      <div className="mt-4 min-h-[44px] flex items-center">
        {active ? (
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 6 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            className="flex w-full items-center justify-between rounded-xl border border-[0.5px] border-forest-700/30 bg-forest-700/[0.06] px-4 py-2.5"
          >
            <span className="inline-flex items-center gap-2 text-[13px] font-medium text-forest-800">
              <FileText className="h-4 w-4" strokeWidth={2} />
              Facture 2026-002 créée
            </span>
            <span className="font-mono text-[14px] font-semibold text-forest-800 tabular-nums">3 150,00 $</span>
          </motion.div>
        ) : (
          <span
            ref={(el) => {
              targetRef.current = el;
            }}
            className={`inline-flex items-center gap-1.5 rounded-lg bg-forest-700 px-3 py-1.5 text-[13px] font-medium text-forest-50 ${
              clicking ? "scale-95" : ""
            } transition-transform`}
          >
            <Check className="h-4 w-4" strokeWidth={2.25} />
            Générer la facture
          </span>
        )}
      </div>

      <p className="mt-4 text-[12px] text-text-subtle">
        Numérotation sans trou, TPS et TVQ calculées, prête à envoyer.
      </p>

      {!reduceMotion && <ScriptedCursor x={cursor.x} y={cursor.y} clicking={clicking} />}
    </DemoWindow>
  );
}
