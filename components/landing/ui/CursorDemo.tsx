"use client";

import React from "react";
import { motion } from "framer-motion";
import { useSafeMotion } from "@/lib/motion";

export type Hotspot = { x: number; y: number };

/**
 * Superpose un curseur animé sur une capture de l'app : il se déplace d'un point
 * à l'autre, marque une pause et « clique » (anneau qui pulse). But : montrer le
 * produit en action sur la page vitrine. Respecte prefers-reduced-motion.
 *
 * `hotspots` en pourcentage de la zone (0-100), relatifs au conteneur.
 */
export function CursorDemo({
  children,
  hotspots,
  className = "",
}: {
  children: React.ReactNode;
  hotspots: Hotspot[];
  className?: string;
}) {
  const { reduceMotion } = useSafeMotion();

  // Construit des keyframes « déplacement puis pause » pour chaque point.
  const dwell = 0.1; // part du cycle passée immobile sur un point
  const xs: string[] = [];
  const ys: string[] = [];
  const times: number[] = [];
  const segment = (1 - dwell * hotspots.length) / hotspots.length;
  let t = 0;
  hotspots.forEach((h) => {
    xs.push(`${h.x}%`, `${h.x}%`);
    ys.push(`${h.y}%`, `${h.y}%`);
    times.push(Number(t.toFixed(3)), Number((t + dwell).toFixed(3)));
    t += dwell + segment;
  });
  // Boucle : retour au premier point.
  xs.push(`${hotspots[0].x}%`);
  ys.push(`${hotspots[0].y}%`);
  times.push(1);

  const cycle = hotspots.length * 2.4;

  return (
    <div className={`relative ${className}`}>
      {children}

      {!reduceMotion && hotspots.length > 0 && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute z-20 hidden sm:block"
          style={{ left: `${hotspots[0].x}%`, top: `${hotspots[0].y}%` }}
          animate={{ left: xs, top: ys }}
          transition={{ duration: cycle, times, repeat: Infinity, ease: "easeInOut" }}
        >
          {/* Anneau de clic (pulse) */}
          <motion.span
            className="absolute left-1 top-1 block rounded-full border-2"
            style={{ width: 30, height: 30, marginLeft: -15, marginTop: -15, borderColor: "rgba(31,58,46,0.55)" }}
            animate={{ scale: [0.3, 1.5, 0.3], opacity: [0, 0.55, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeOut" }}
          />
          {/* Pointeur */}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]">
            <path d="M4 2l14 7.5-6 1.5-2.5 6L4 2z" fill="#1F3A2E" stroke="#FFFFFF" strokeWidth="1.4" strokeLinejoin="round" />
          </svg>
        </motion.div>
      )}
    </div>
  );
}
