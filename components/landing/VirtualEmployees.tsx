"use client";

import React, { useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  animate,
} from "framer-motion";
import { AnimatedCard } from "./FeaturesGrid";

const ease = [0.16, 1, 0.3, 1] as const;

type Pillar = {
  kicker: string;
  title: string;
  body: string;
  footer: string;
};

const PILLARS: Pillar[] = [
  {
    kicker: "Mémoire",
    title: "Vous n'avez plus à tout garder en tête.",
    body: "Les échéances, les rappels et les rapprochements reviennent au bon moment, sans que vous ayez à y penser. Vous n'avez plus à espérer que rien ne passe entre les mailles.",
    footer: "Échéances tenues",
  },
  {
    kicker: "Équilibre",
    title: "Vos chiffres restent solides.",
    body: "Le fidéicommis est tracé, les factures sont à jour et la conformité est vérifiée en continu. Ce qui ne vous appartient pas reste exactement à sa place, au sou près.",
    footer: "Fidéicommis tracé",
  },
  {
    kicker: "Présence",
    title: "Vous n'êtes plus seul à tout porter.",
    body: "Pendant que vous plaidez, votre cabinet continue d'avancer. À votre retour, tout est en ordre plutôt qu'en retard, prêt à reprendre là où vous l'aviez laissé.",
    footer: "Toujours à jour",
  },
];

export function VirtualEmployees() {
  return (
    <section id="coequipier" className="py-[100px] px-6 max-w-6xl mx-auto">
      {/* ── Header éditorial ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease }}
        className="mb-16 text-center flex flex-col items-center"
      >
        <span className="text-[12px] font-sans uppercase tracking-[0.15em] text-forest-600 font-medium block mb-4">
          Le coéquipier
        </span>
        <h2 className="font-serif text-[38px] leading-[1.1] tracking-[-0.02em] text-text-primary max-w-2xl mb-4">
          Un cabinet fiable ne tient jamais sur une seule personne.{" "}
          <span className="italic text-forest-600">Il tient en équilibre.</span>
        </h2>
        <p className="text-[15px] text-text-body font-sans leading-[1.65] max-w-2xl">
          Derrière chaque avocat, il y a une adjointe qui fait tenir l'ensemble&nbsp;: les délais, les chiffres, les dossiers. Mais même la meilleure coéquipière ne peut pas tout garder en tête, dans des fichiers éparpillés. SAFE lui donne une base solide sur laquelle s'appuyer. C'est ce qui rend votre binôme vraiment fiable, et un cabinet fiable, c'est un cabinet qui garde son équilibre, quoi qu'il arrive.
        </p>
      </motion.div>

      {/* ── Visuel central : la balance qui revient d'aplomb ─── */}
      <BalanceScale />

      {/* ── Trois piliers (mêmes cartes que la promesse) ─────── */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-4">
        {PILLARS.map((p, i) => (
          <AnimatedCard
            key={p.kicker}
            index={i}
            ease={ease}
            kicker={p.kicker}
            title={p.title}
            body={p.body}
            footer={p.footer}
          />
        ))}
      </div>

      {/* ── Thèse de clôture ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, delay: 0.15, ease }}
        className="mt-14 text-center"
      >
        <p className="font-serif text-[24px] leading-[1.35] tracking-[-0.01em] text-text-primary max-w-2xl mx-auto">
          Un avocat mérite un coéquipier fiable.{" "}
          <span className="italic text-forest-600">
            Et pour être fiable, il faut être SAFE.
          </span>
        </p>
      </motion.div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────── */
/*  La balance : poussez-la, elle revient toujours d'aplomb.    */
/*  Le fil à plomb reste vertical, les plateaux restent droits. */
/* ──────────────────────────────────────────────────────────── */

const FOREST = "#1F3A2E";
const PIVOT_X = 160;
const PIVOT_Y = 158;

function BalanceScale() {
  // Inclinaison cible (pilotée souris) -> ressort souple qui se rééquilibre.
  const tilt = useMotionValue(0);
  const beamRot = useSpring(tilt, { stiffness: 55, damping: 11, mass: 1 });
  // Les plateaux et le fil à plomb annulent la rotation : ils restent droits.
  const counterRot = useTransform(beamRot, (v) => -v);
  // L'indicateur « À niveau » apparaît seulement près de l'équilibre.
  const levelOpacity = useTransform(beamRot, [-3, -1.1, 1.1, 3], [0, 1, 1, 0]);

  const intro = useRef<ReturnType<typeof animate> | null>(null);
  const touched = useRef(false);

  // Petite démonstration au chargement : elle penche, puis se stabilise.
  useEffect(() => {
    intro.current = animate(tilt, [0, 9, -6, 3, 0], {
      duration: 2.8,
      delay: 0.5,
      ease,
    });
    return () => intro.current?.stop();
  }, [tilt]);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!touched.current) {
      touched.current = true;
      intro.current?.stop();
    }
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    tilt.set(px * 26);
  };
  const handleLeave = () => {
    tilt.set(0);
  };

  return (
    <div className="flex flex-col items-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.9, ease }}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        className="relative w-full max-w-[440px] aspect-square cursor-ew-resize select-none"
      >
        <svg
          viewBox="0 0 320 320"
          className="w-full h-full overflow-visible"
          role="img"
          aria-label="Une balance que l'on pousse avec la souris et qui revient toujours à l'équilibre."
        >
          {/* Ligne de niveau (référence vraie) */}
          <line
            x1={42}
            y1={PIVOT_Y}
            x2={278}
            y2={PIVOT_Y}
            stroke="rgba(31,58,46,0.12)"
            strokeWidth={1}
            strokeDasharray="3 6"
          />

          {/* Indicateur « À niveau » */}
          <motion.g style={{ opacity: levelOpacity }}>
            <circle cx={146} cy={114} r={3} fill={FOREST} />
            <text
              x={156}
              y={114}
              dominantBaseline="middle"
              className="font-serif italic"
              style={{ fontSize: "13px", fill: FOREST }}
            >
              À niveau
            </text>
          </motion.g>

          {/* Fil à plomb : reste vertical quoi qu'il arrive (repère de vérité) */}
          <motion.g
            style={{ rotate: counterRot, transformOrigin: `${PIVOT_X}px ${PIVOT_Y}px` }}
          >
            <line
              x1={PIVOT_X}
              y1={PIVOT_Y}
              x2={PIVOT_X}
              y2={244}
              stroke="rgba(31,58,46,0.35)"
              strokeWidth={1}
              strokeDasharray="2 4"
            />
            <path d="M155 244 h10 l-5 9 z" fill={FOREST} opacity={0.7} />
          </motion.g>

          {/* Fléau (le bras de la balance) qui s'incline */}
          <motion.g
            style={{ rotate: beamRot, transformOrigin: `${PIVOT_X}px ${PIVOT_Y}px` }}
          >
            {/* Barre */}
            <rect
              x={52}
              y={PIVOT_Y - 5}
              width={216}
              height={10}
              rx={5}
              fill={FOREST}
            />
            {/* Embouts */}
            <circle cx={58} cy={PIVOT_Y} r={4} fill={FOREST} />
            <circle cx={262} cy={PIVOT_Y} r={4} fill={FOREST} />

            {/* Plateau gauche : reste droit (contre-rotation) */}
            <motion.g
              style={{ rotate: counterRot, transformOrigin: `58px ${PIVOT_Y}px` }}
            >
              <line x1={58} y1={PIVOT_Y} x2={58} y2={PIVOT_Y + 22} stroke={FOREST} strokeWidth={1.5} />
              <circle cx={58} cy={PIVOT_Y + 34} r={15} fill="#FFFFFF" stroke="rgba(31,58,46,0.45)" strokeWidth={1.5} />
              <circle cx={58} cy={PIVOT_Y + 34} r={2.5} fill={FOREST} />
              <text
                x={58}
                y={PIVOT_Y + 64}
                textAnchor="middle"
                className="font-sans"
                style={{ fontSize: "10.5px", letterSpacing: "0.05em", fill: "var(--text-body, #4a4a44)", fontWeight: 500 }}
              >
                Le quotidien
              </text>
            </motion.g>

            {/* Plateau droit : reste droit (contre-rotation) */}
            <motion.g
              style={{ rotate: counterRot, transformOrigin: `262px ${PIVOT_Y}px` }}
            >
              <line x1={262} y1={PIVOT_Y} x2={262} y2={PIVOT_Y + 22} stroke={FOREST} strokeWidth={1.5} />
              <circle cx={262} cy={PIVOT_Y + 34} r={15} fill="#FFFFFF" stroke="rgba(31,58,46,0.45)" strokeWidth={1.5} />
              <circle cx={262} cy={PIVOT_Y + 34} r={2.5} fill={FOREST} />
              <text
                x={262}
                y={PIVOT_Y + 64}
                textAnchor="middle"
                className="font-sans"
                style={{ fontSize: "10.5px", letterSpacing: "0.05em", fill: "var(--text-body, #4a4a44)", fontWeight: 500 }}
              >
                L'imprévu
              </text>
            </motion.g>
          </motion.g>

          {/* Socle : pivot + halo pulsant */}
          <path
            d={`M${PIVOT_X} ${PIVOT_Y} L${PIVOT_X - 16} ${PIVOT_Y + 34} L${PIVOT_X + 16} ${PIVOT_Y + 34} Z`}
            fill="rgba(31,58,46,0.10)"
            stroke="rgba(31,58,46,0.30)"
            strokeWidth={1}
          />
          <line
            x1={PIVOT_X - 26}
            y1={PIVOT_Y + 34}
            x2={PIVOT_X + 26}
            y2={PIVOT_Y + 34}
            stroke="rgba(31,58,46,0.30)"
            strokeWidth={1.5}
          />
          <motion.circle
            cx={PIVOT_X}
            cy={PIVOT_Y}
            r={9}
            fill="rgba(31,58,46,0.18)"
            initial={{ scale: 0.4, opacity: 0 }}
            whileInView={{ scale: [0.4, 2.4, 2.4], opacity: [0, 0.4, 0] }}
            viewport={{ once: true }}
            transition={{ duration: 2.4, delay: 1.2, repeat: Infinity, ease: "easeOut" }}
            style={{ transformOrigin: `${PIVOT_X}px ${PIVOT_Y}px` }}
          />
          <circle cx={PIVOT_X} cy={PIVOT_Y} r={6} fill={FOREST} />
        </svg>
      </motion.div>

      {/* Indice interactif */}
      <p className="mt-7 text-center text-[12.5px] font-sans italic text-text-muted px-4">
        Poussez la balance : elle revient toujours d&apos;aplomb.
      </p>
    </div>
  );
}
