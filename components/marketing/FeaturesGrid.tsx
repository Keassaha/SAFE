"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import {
  FolderKanban,
  Receipt,
  LockKeyhole,
  CalendarClock,
  LineChart,
  UserCog,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

const FEATURES = [
  {
    icon: FolderKanban,
    title: "Gestion des dossiers",
    description:
      "Suivi complet de chaque dossier familial : parties, enfants, pensions, échéanciers et documentation centralisée.",
    stat: "47",
    statLabel: "dossiers actifs",
    accent: {
      icon: "text-blue-400",
      bg: "bg-blue-500/15",
      border: "border-blue-400/20",
      glow: "from-blue-400/8",
      gradient: "from-blue-500/20 via-blue-400/5 to-transparent",
      line: "bg-blue-400",
      statBg: "bg-blue-400/10",
      statText: "text-blue-400",
    },
  },
  {
    icon: Receipt,
    title: "Facturation conforme",
    description:
      "Factures conformes au Règlement B-1 r.5 du Barreau, calculs TPS/TVQ automatiques et gestion des encaissements.",
    stat: "B-1 r.5",
    statLabel: "conforme",
    accent: {
      icon: "text-emerald-400",
      bg: "bg-emerald-500/15",
      border: "border-emerald-400/20",
      glow: "from-emerald-400/8",
      gradient: "from-emerald-500/20 via-emerald-400/5 to-transparent",
      line: "bg-emerald-400",
      statBg: "bg-emerald-400/10",
      statText: "text-emerald-400",
    },
  },
  {
    icon: LockKeyhole,
    title: "Comptes en fidéicommis",
    description:
      "Mouvements traçables avec validation humaine obligatoire pour assurer un registre irréprochable.",
    stat: "100%",
    statLabel: "traçable",
    accent: {
      icon: "text-violet-400",
      bg: "bg-violet-500/15",
      border: "border-violet-400/20",
      glow: "from-violet-400/8",
      gradient: "from-violet-500/20 via-violet-400/5 to-transparent",
      line: "bg-violet-400",
      statBg: "bg-violet-400/10",
      statText: "text-violet-400",
    },
  },
  {
    icon: CalendarClock,
    title: "Échéanciers & délais",
    description:
      "Ne manquez plus aucun délai de cour ou de prescription. Alertes automatiques et calendrier intégré.",
    stat: "0",
    statLabel: "délai manqué",
    accent: {
      icon: "text-amber-400",
      bg: "bg-amber-500/15",
      border: "border-amber-400/20",
      glow: "from-amber-400/8",
      gradient: "from-amber-500/20 via-amber-400/5 to-transparent",
      line: "bg-amber-400",
      statBg: "bg-amber-400/10",
      statText: "text-amber-400",
    },
  },
  {
    icon: LineChart,
    title: "Rapports financiers",
    description:
      "Vue d'ensemble de la rentabilité par dossier, par avocat et par type de mandat. Exportation en un clic.",
    stat: "1 clic",
    statLabel: "pour exporter",
    accent: {
      icon: "text-cyan-400",
      bg: "bg-cyan-500/15",
      border: "border-cyan-400/20",
      glow: "from-cyan-400/8",
      gradient: "from-cyan-500/20 via-cyan-400/5 to-transparent",
      line: "bg-cyan-400",
      statBg: "bg-cyan-400/10",
      statText: "text-cyan-400",
    },
  },
  {
    icon: UserCog,
    title: "Employés virtuels",
    description:
      "Assistance intelligente pour la rédaction et la recherche — ne donne jamais de conseils juridiques.",
    stat: "24/7",
    statLabel: "disponible",
    accent: {
      icon: "text-rose-400",
      bg: "bg-rose-500/15",
      border: "border-rose-400/20",
      glow: "from-rose-400/8",
      gradient: "from-rose-500/20 via-rose-400/5 to-transparent",
      line: "bg-rose-400",
      statBg: "bg-rose-400/10",
      statText: "text-rose-400",
    },
  },
];

/* ───── 3D tilt card ───── */
function FeatureCard({
  feat,
  idx,
}: {
  feat: (typeof FEATURES)[number];
  idx: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), {
    stiffness: 200,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), {
    stiffness: 200,
    damping: 20,
  });

  function handleMouse(e: React.MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function handleLeave() {
    x.set(0);
    y.set(0);
    setHovered(false);
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.6,
        delay: idx * 0.1,
        ease: [0.16, 1, 0.3, 1],
      }}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 800,
      }}
      onMouseMove={handleMouse}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleLeave}
      className="group relative rounded-2xl border border-white/[0.06] bg-[#051F20] overflow-hidden cursor-default"
    >
      {/* Animated gradient background on hover */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-br ${feat.accent.gradient} opacity-0 transition-opacity duration-700`}
        style={{ opacity: hovered ? 1 : 0 }}
      />

      {/* Animated top line */}
      <motion.div
        className={`absolute top-0 left-0 h-[2px] ${feat.accent.line}`}
        initial={{ width: "0%" }}
        whileInView={{ width: "100%" }}
        viewport={{ once: true }}
        transition={{
          duration: 1.2,
          delay: 0.3 + idx * 0.1,
          ease: [0.16, 1, 0.3, 1],
        }}
      />

      <div className="relative z-10 p-8">
        {/* Top row: icon + stat */}
        <div className="flex items-start justify-between mb-6">
          <motion.div
            className={`w-14 h-14 rounded-2xl ${feat.accent.bg} border ${feat.accent.border} flex items-center justify-center`}
            whileHover={{ scale: 1.15, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
          >
            <feat.icon className={`w-7 h-7 ${feat.accent.icon}`} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 + idx * 0.1, type: "spring", stiffness: 300 }}
            className={`px-3 py-1.5 rounded-xl ${feat.accent.statBg} border ${feat.accent.border}`}
          >
            <span className={`text-sm font-bold font-jakarta ${feat.accent.statText}`}>
              {feat.stat}
            </span>
            <span className="text-[10px] text-white/40 font-jakarta ml-1.5">
              {feat.statLabel}
            </span>
          </motion.div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-[var(--safe-white)] mb-3 font-jakarta">
          {feat.title}
        </h3>

        {/* Description */}
        <p className="text-[var(--safe-text-muted)] leading-relaxed font-jakarta text-sm mb-6 group-hover:text-white/60 transition-colors duration-500">
          {feat.description}
        </p>

        {/* Bottom link */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6 + idx * 0.1 }}
        >
          <Link
            href="/fonctionnalites"
            className={`inline-flex items-center gap-2 text-xs font-semibold font-jakarta ${feat.accent.statText} hover:gap-3 transition-all duration-300`}
          >
            En savoir plus
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </motion.div>
      </div>

      {/* Corner glow on hover */}
      <div
        className={`absolute -bottom-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-700 ${feat.accent.line}`}
      />
    </motion.div>
  );
}

export function FeaturesGrid() {
  return (
    <section className="section-dusk relative py-28 lg:py-36 overflow-hidden">
      <div className="landing-grain absolute inset-0 pointer-events-none" />

      {/* Background floating orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-[10%] left-[5%] w-[300px] h-[300px] rounded-full bg-emerald-500/5 blur-[100px]"
          animate={{ y: [0, 40, 0], x: [0, 20, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[10%] right-[5%] w-[250px] h-[250px] rounded-full bg-blue-500/5 blur-[80px]"
          animate={{ y: [0, -30, 0], x: [0, -25, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-lg font-instrument italic text-white mb-4"
          >
            Fonctionnalités
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-instrument text-4xl md:text-5xl text-[var(--safe-white)] mb-6 leading-tight tracking-tight"
          >
            Tout ce dont votre cabinet a besoin.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-lg text-white leading-relaxed font-jakarta"
          >
            Un écosystème intégré pour remplacer vos feuilles de calcul et logiciels désuets.
          </motion.p>

          {/* Animated separator line */}
          <motion.div
            className="mx-auto mt-8 h-px bg-gradient-to-r from-transparent via-[var(--safe-sage)] to-transparent"
            initial={{ width: 0, opacity: 0 }}
            whileInView={{ width: "60%", opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>

        {/* Bento-style grid — 2 large + 1 medium on top, 1 medium + 2 large on bottom */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feat, idx) => (
            <FeatureCard key={feat.title} feat={feat} idx={idx} />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="text-center mt-16"
        >
          <Link
            href="/fonctionnalites"
            className="group inline-flex items-center gap-3 px-8 py-4 text-base font-semibold rounded-full border border-[var(--safe-sage)]/30 text-[var(--safe-sage)] hover:bg-[var(--safe-sage)]/10 hover:border-[var(--safe-sage)]/50 transition-all duration-300 font-jakarta"
          >
            Voir toutes les fonctionnalités
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
