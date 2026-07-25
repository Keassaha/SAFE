"use client";

// Trousse partagée de l'ébauche landing (docs/product/DIRECTION_LANDING_SAFE_INSPIREE_LINEAR_2026.md).
// Discipline Linear : tout aligné à gauche, grille narrative répétable (§3.3), filets plutôt
// qu'ombres (§3.5), animation réservée aux confirmations et révélations utiles (§7.5),
// respect de prefers-reduced-motion.
import React, { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion, animate } from "framer-motion";

export const EASE = [0.16, 1, 0.3, 1] as const;

export const INK = "#1F2A24";
export const MUTED = "#5A665F";
export const FAINT = "#7C877F";
export const SURFACE = "#FBFCFA";
export const CANVAS = "#EFF2ED";
export const GREEN = "#12A150";
export const VERIFIED = "#1F6A47";
export const AMBER = "#8A6A1E";
export const LINE = "rgba(31,42,36,0.08)";
export const HAIR = "rgba(31,42,36,0.05)";
export const SCENE_SHADOW = "0 40px 80px -44px rgba(11,31,25,.5)";

export function fadeUp(delay = 0) {
  return {
    initial: { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-80px" },
    transition: { duration: 0.6, delay, ease: EASE },
  };
}

// Conteneur de section : filet en haut, retrait latéral, largeur de lecture Linear (§7.1).
export function Section({
  id,
  children,
  className = "",
  first = false,
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
  first?: boolean;
}) {
  return (
    <section
      id={id}
      className={`bg-canvas px-6 sm:px-8 ${first ? "" : "border-t border-[0.5px] border-border"} ${className}`}
    >
      <div className="mx-auto max-w-[1180px]">{children}</div>
    </section>
  );
}

// L'en-tête narratif : numéro + titre à gauche, description à droite. Toujours à gauche.
export function NarrativeHeader({
  num,
  eyebrow,
  title,
  description,
  className = "",
}: {
  num: string;
  eyebrow: string;
  title: React.ReactNode;
  description: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`grid gap-8 md:grid-cols-12 md:gap-10 ${className}`}>
      <motion.div {...fadeUp(0)} className="md:col-span-7">
        <div className="mb-5 flex items-baseline gap-3">
          <span className="font-mono text-[12px] tracking-[0.06em] text-forest-600">&mdash; {num}</span>
          <span className="font-sans text-[11px] uppercase tracking-[0.16em] text-text-muted">{eyebrow}</span>
        </div>
        <h2 className="max-w-[16ch] font-serif text-[34px] leading-[1.08] tracking-[-0.02em] text-text-primary sm:text-[42px]">
          {title}
        </h2>
      </motion.div>
      <motion.div {...fadeUp(0.1)} className="md:col-span-5 md:pt-2">
        <p className="max-w-[44ch] font-sans text-[15px] leading-[1.65] text-text-body">{description}</p>
      </motion.div>
    </div>
  );
}

function groupFr(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

// Montant qui monte (ou descend, via `from`) quand la scène entre dans le champ.
// Statique si mouvement réduit.
export function AnimatedAmount({
  value,
  from = 0,
  prefix = "",
  suffix = " $",
  duration = 1.1,
  delay = 0,
  className,
  style,
}: {
  value: number;
  from?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(from);

  useEffect(() => {
    if (!inView) return;
    if (reduce) {
      setDisplay(value);
      return;
    }
    const controls = animate(from, value, {
      duration,
      delay,
      ease: EASE,
      onUpdate: (latest) => setDisplay(latest),
    });
    return () => controls.stop();
  }, [inView, value, from, reduce, duration, delay]);

  return (
    <span ref={ref} className={className} style={style}>
      {prefix}
      {groupFr(display)}
      {suffix}
    </span>
  );
}

// Coche qui se dessine à l'entrée. Statique si mouvement réduit.
export function CheckDraw({ size = 13, color = GREEN, delay = 0 }: { size?: number; color?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden>
      <motion.path
        d="M3 7.2 5.6 9.8 11 3.8"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduce ? undefined : { pathLength: 0 }}
        whileInView={reduce ? undefined : { pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay, ease: EASE }}
      />
    </svg>
  );
}

// Point « en direct » qui pulse doucement. Statique si mouvement réduit.
export function LivePulse({ color = GREEN }: { color?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      className="inline-block h-1.5 w-1.5 rounded-full"
      style={{ background: color }}
      animate={reduce ? undefined : { opacity: [1, 0.3, 1] }}
      transition={reduce ? undefined : { duration: 2, repeat: Infinity, ease: "easeInOut" }}
      aria-hidden
    />
  );
}

// Cadre de scène produit : surface, filet, une seule ombre douce teintée forêt autorisée (§3.5).
export function SceneFrame({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: EASE }}
      className={`w-full overflow-hidden rounded-[16px] text-left ${className}`}
      style={{ background: SURFACE, border: `1px solid ${LINE}`, boxShadow: SCENE_SHADOW }}
    >
      {children}
    </motion.div>
  );
}
