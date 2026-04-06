"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import {
  HeartHandshake,
  FolderCheck,
  ShieldCheck,
  Clock,
  TrendingUp,
  Brain,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

const OUTCOMES = [
  {
    icon: HeartHandshake,
    title: "Moins de stress administratif",
    description:
      "Fini les soirées à rattraper la paperasse. SAFE automatise la saisie, les rappels et les calculs pour que vous retrouviez votre sérénité.",
    stat: "70%",
    statLabel: "de tâches en moins",
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
    icon: FolderCheck,
    title: "Des dossiers organisés et complets",
    description:
      "Chaque dossier familial est documenté, structuré et à jour. Plus jamais de pièce manquante avant une audience.",
    stat: "100%",
    statLabel: "documenté",
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
    icon: ShieldCheck,
    title: "Toujours conforme au Barreau",
    description:
      "Facturation, fidéicommis, conservation des données — tout respecte le Règlement B-1 r.5 et la Loi 25, sans effort de votre part.",
    stat: "B-1 r.5",
    statLabel: "conforme",
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
    icon: Clock,
    title: "Plus aucun délai manqué",
    description:
      "Alertes automatiques pour les échéances de cour et prescriptions. Vous êtes toujours un pas en avance.",
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
    icon: TrendingUp,
    title: "Une vue claire sur votre rentabilité",
    description:
      "Savez-vous quels dossiers sont rentables ? SAFE vous donne la réponse en un coup d'œil, par avocat, par type de mandat.",
    stat: "1 clic",
    statLabel: "pour savoir",
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
    icon: Brain,
    title: "Une assistance IA qui vous comprend",
    description:
      "Un assistant qui connaît votre pratique et vous aide à rédiger, chercher et organiser — sans jamais donner de conseils juridiques.",
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
function OutcomeCard({
  feat,
  idx,
}: {
  feat: (typeof OUTCOMES)[number];
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
      className="group relative rounded-safe-md border border-white/[0.06] bg-[#051F20] overflow-hidden cursor-default"
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
            className={`w-14 h-14 rounded-safe-md ${feat.accent.bg} border ${feat.accent.border} flex items-center justify-center`}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <feat.icon className={`w-7 h-7 ${feat.accent.icon}`} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 + idx * 0.1, type: "spring", stiffness: 180, damping: 20 }}
            className={`px-3 py-1.5 rounded-safe ${feat.accent.statBg} border ${feat.accent.border}`}
          >
            <span className={`text-sm font-bold font-sans ${feat.accent.statText}`}>
              {feat.stat}
            </span>
            <span className="text-xs text-white/40 font-sans ml-1.5">
              {feat.statLabel}
            </span>
          </motion.div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-[var(--safe-white)] mb-3 font-sans tracking-tight">
          {feat.title}
        </h3>

        {/* Description */}
        <p className="text-[var(--safe-text-muted)] leading-relaxed font-sans text-sm group-hover:text-white/60 transition-colors duration-500">
          {feat.description}
        </p>
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
    <section className="section-night relative py-28 lg:py-36 overflow-hidden">
      <div className="landing-grain absolute inset-0 pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-lg font-sans italic text-[var(--safe-sage)] mb-4"
          >
            Ce que ça change pour vous
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-sans text-4xl md:text-5xl text-[var(--safe-white)] mb-6 leading-tight tracking-tight"
          >
            Votre cabinet mérite mieux que du{" "}
            <span className="italic text-[var(--safe-sage)]">bricolage.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-lg text-[var(--safe-text-muted)] leading-relaxed font-sans"
          >
            Moins de stress, plus de temps pour vos clients, et la certitude d&apos;être toujours conforme.
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

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {OUTCOMES.map((feat, idx) => (
            <OutcomeCard key={feat.title} feat={feat} idx={idx} />
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
            className="group inline-flex items-center gap-3 px-8 py-4 text-base font-semibold rounded-full border border-[var(--safe-sage)]/30 text-[var(--safe-sage)] hover:bg-[var(--safe-sage)]/10 hover:border-[var(--safe-sage)]/50 transition-all duration-300 font-sans"
          >
            Voir toutes les fonctionnalités
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
