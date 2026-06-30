"use client";

import React from "react";
import { motion } from "framer-motion";

/**
 * Kit partagé pour les démos INTERACTIVES de la page Fonctionnalités.
 * Même langage visuel que NavetteDemo : fenêtre + corps relatif + curseur scripté
 * qui clique un vrai bouton et déclenche un vrai changement d'état.
 */

export function DemoWindow({
  label,
  bodyRef,
  children,
}: {
  label: string;
  bodyRef?: React.Ref<HTMLDivElement>;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[14px] border border-[0.5px] border-border-strong bg-surface shadow-[0_50px_130px_-55px_rgba(31,58,46,0.5)] overflow-hidden">
      {/* Barre fenêtre */}
      <div className="flex items-center gap-2 px-4 h-9 border-b border-[0.5px] border-border bg-canvas">
        <span className="w-2.5 h-2.5 rounded-full bg-[#E2E2E2]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#E2E2E2]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#E2E2E2]" />
        <span className="ml-3 text-[11px] text-text-subtle font-sans truncate">{label}</span>
      </div>
      {/* Corps (zone relative pour le curseur) */}
      <div ref={bodyRef} className="relative bg-surface p-6 sm:p-8 min-h-[320px]">{children}</div>
    </div>
  );
}

/** Curseur scripté en pourcentage du corps. `clicking` déclenche l'anneau de clic. */
export function ScriptedCursor({
  x,
  y,
  clicking,
}: {
  x: number;
  y: number;
  clicking: boolean;
}) {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute z-20 hidden sm:block"
      initial={false}
      animate={{ left: `${x}%`, top: `${y}%` }}
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
  );
}

/**
 * Boucle scriptée commune : repos -> déplacement vers la position RÉELLE du bouton
 * (mesurée via refs) -> clic -> état actif -> maintien -> reset. Le curseur tombe
 * toujours pile sur le bouton, quelle que soit la mise en page.
 */
export function useScriptedClick(reduceMotion: boolean) {
  const bodyRef = React.useRef<HTMLDivElement | null>(null);
  const targetRef = React.useRef<HTMLElement | null>(null);
  const rest = { x: 90, y: 94 };
  const [active, setActive] = React.useState(false);
  const [clicking, setClicking] = React.useState(false);
  const [cursor, setCursor] = React.useState(rest);

  React.useEffect(() => {
    if (reduceMotion) return;
    let alive = true;
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const aim = () => {
      const c = bodyRef.current;
      const b = targetRef.current;
      if (!c || !b) return rest;
      const cr = c.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      return {
        x: ((br.left + br.width / 2 - cr.left) / cr.width) * 100,
        y: ((br.top + br.height / 2 - cr.top) / cr.height) * 100,
      };
    };
    async function loop() {
      while (alive) {
        setActive(false);
        setClicking(false);
        setCursor(rest);
        await wait(1400);
        if (!alive) return;
        setCursor(aim());
        await wait(1150);
        if (!alive) return;
        setClicking(true);
        await wait(160);
        if (!alive) return;
        setActive(true);
        setClicking(false);
        await wait(2800);
      }
    }
    loop();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduceMotion]);

  return { active, clicking, cursor, bodyRef, targetRef };
}
