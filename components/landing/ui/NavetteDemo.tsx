"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, CornerUpLeft, Send } from "lucide-react";
import { useSafeMotion } from "@/lib/motion";

/**
 * Démo INTERACTIVE scriptée du flux navette « l'adjointe prépare, l'avocat approuve ».
 * Le curseur se déplace vers « Approuver », clique, et l'élément passe RÉELLEMENT à
 * l'état « Approuvé » (changement d'état réel, pas un curseur figé sur une image).
 * En boucle. Respecte prefers-reduced-motion (affiche l'état initial sans animation).
 */
export function NavetteDemo() {
  const { reduceMotion } = useSafeMotion();
  const [approved, setApproved] = useState(false);
  const [cursor, setCursor] = useState<{ x: number; y: number }>({ x: 90, y: 94 });
  const [clicking, setClicking] = useState(false);

  useEffect(() => {
    if (reduceMotion) return;
    let alive = true;
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    async function loop() {
      while (alive) {
        setApproved(false);
        setClicking(false);
        setCursor({ x: 90, y: 94 });
        await wait(1400);
        if (!alive) return;
        // Déplacement vers le bouton « Approuver »
        setCursor({ x: 26.5, y: 76 });
        await wait(1150);
        if (!alive) return;
        // Clic
        setClicking(true);
        await wait(160);
        if (!alive) return;
        setApproved(true);
        setClicking(false);
        // On tient l'état approuvé visible
        await wait(2600);
      }
    }
    loop();
    return () => {
      alive = false;
    };
  }, [reduceMotion]);

  return (
    <div className="rounded-[14px] border border-[0.5px] border-border-strong bg-surface shadow-[0_50px_130px_-55px_rgba(31,58,46,0.5)] overflow-hidden">
      {/* Barre fenêtre */}
      <div className="flex items-center gap-2 px-4 h-9 border-b border-[0.5px] border-border bg-canvas">
        <span className="w-2.5 h-2.5 rounded-full bg-[#E2E2E2]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#E2E2E2]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#E2E2E2]" />
        <span className="ml-3 text-[11px] text-text-subtle font-sans truncate">
          safecabinet.ca · Tableau de bord
        </span>
      </div>

      {/* Corps (zone relative pour le curseur) */}
      <div className="relative bg-surface p-6 sm:p-8 min-h-[300px]">
        {/* En-tête navette */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-[19px] text-text-primary leading-tight">Votre navette</h3>
            <p className="text-[12px] text-text-subtle mt-0.5">En attente de vous</p>
          </div>
          <motion.span
            key={approved ? "done" : "pending"}
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${
              approved ? "bg-forest-700/[0.1] text-forest-800" : "bg-amber-100 text-amber-800"
            }`}
          >
            {approved ? "À jour" : "1 à valider"}
          </motion.span>
        </div>

        {/* Élément navette */}
        <motion.div
          animate={{ opacity: approved ? 0.7 : 1 }}
          className="mt-5 rounded-xl border border-[0.5px] border-border bg-canvas p-4"
        >
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-forest-700/[0.1] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-forest-800">
              Prêt pour revue
            </span>
            <span className="font-mono text-[12px] text-text-subtle">2026-001</span>
          </div>
          <p className="mt-2 text-[15px] font-medium text-text-primary">
            Requête en révision prête à valider
          </p>
          <p className="text-[12px] text-text-subtle mt-0.5">Aaliyah Côté · il y a 2 min</p>

          {/* Actions / état approuvé */}
          <div className="mt-4 h-9 flex items-center">
            {approved ? (
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 320, damping: 20 }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-forest-700/[0.1] px-3 py-1.5 text-[13px] font-medium text-forest-800"
              >
                <Check className="h-4 w-4" strokeWidth={2.5} />
                Approuvé
              </motion.span>
            ) : (
              <div className="flex items-center gap-2">
                <span
                  className={`relative inline-flex items-center gap-1.5 rounded-lg bg-forest-700 px-3 py-1.5 text-[13px] font-medium text-forest-50 ${
                    clicking ? "scale-95" : ""
                  } transition-transform`}
                >
                  <Check className="h-4 w-4" strokeWidth={2.25} />
                  Approuver
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-[13px] font-medium text-text-body">
                  <CornerUpLeft className="h-4 w-4" strokeWidth={1.75} />
                  Renvoyer
                </span>
              </div>
            )}
          </div>
        </motion.div>

        <p className="mt-4 flex items-center gap-1.5 text-[12px] text-text-subtle">
          <Send className="h-3.5 w-3.5" strokeWidth={1.75} />
          L'adjointe prépare, vous approuvez en un clic.
        </p>

        {/* Curseur scripté */}
        {!reduceMotion && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute z-20 hidden sm:block"
            initial={false}
            animate={{ left: `${cursor.x}%`, top: `${cursor.y}%` }}
            transition={{ duration: 1.0, ease: [0.4, 0, 0.2, 1] }}
          >
            <motion.span
              className="absolute rounded-full border-2"
              style={{ width: 30, height: 30, marginLeft: -15, marginTop: -15, borderColor: "rgba(31,58,46,0.55)" }}
              animate={clicking ? { scale: [0.3, 1.6], opacity: [0.6, 0] } : { scale: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]">
              <path d="M4 2l14 7.5-6 1.5-2.5 6L4 2z" fill="#1F3A2E" stroke="#FFFFFF" strokeWidth="1.4" strokeLinejoin="round" />
            </svg>
          </motion.div>
        )}
      </div>
    </div>
  );
}
