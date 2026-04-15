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
    title: "Récupérez vos soirées",
    description:
      "La facturation qui prenait 25 minutes passe à 2 minutes. Les réconciliations manuelles disparaissent. Vous rentrez chez vous l'esprit libre.",
    stat: "10h+",
    statLabel: "/mois",
    image: "https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&h=400&fit=crop&q=80",
    cta: { label: "Faire mon audit gratuit", href: "/audit-gratuit" },
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
    title: "Fidéicommis réconcilié en 1 clic",
    description:
      "Dépôts, retraits, double validation, soldes en temps réel par client et par dossier. Fini le Excel le soir.",
    stat: "1 clic",
    statLabel: "",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop&q=80",
    cta: { label: "Réserver une démo", href: "/demo" },
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
    title: "Toujours prêt pour l'inspection",
    description:
      "Piste d'audit inaltérable. Relevés exportables. Quand l'inspecteur frappe, tout est prêt.",
    stat: "B-1 r.5",
    statLabel: "conforme",
    image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&h=400&fit=crop&q=80",
    cta: { label: "Faire mon audit gratuit", href: "/audit-gratuit" },
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
    title: "Aucun délai manqué",
    description:
      "Échéanciers judiciaires, délais de prescription et de signification. Alertes automatiques à 7 jours, 3 jours et 24 heures.",
    stat: "0",
    statLabel: "oubli",
    image: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&h=400&fit=crop&q=80",
    cta: { label: "Réserver une démo", href: "/demo" },
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
    title: "Rentabilité visible instantanément",
    description:
      "Revenus par dossier, par avocat, par mandat. Rapports TPS/TVQ prêts pour Revenu Québec.",
    stat: "1 clic",
    statLabel: "",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop&q=80",
    cta: { label: "Faire mon audit gratuit", href: "/audit-gratuit" },
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
    title: "Conçu pour le droit canadien",
    description:
      "Pas un logiciel américain adapté. Bâti pour le B-1 r.5, la Loi 25 et le By-Law 9 dès la première ligne de code.",
    stat: "QC + ON",
    statLabel: "",
    image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=400&fit=crop&q=80",
    cta: { label: "Réserver une démo", href: "/demo" },
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

      <div className="relative z-10 p-5 sm:p-8">
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
        <p className="text-[var(--safe-text-muted)] leading-relaxed font-sans text-sm group-hover:text-white/60 transition-colors duration-500 mb-4">
          {feat.description}
        </p>

        {/* CTA */}
        <Link
          href={feat.cta.href}
          className={`inline-flex items-center gap-2 text-sm font-medium ${feat.accent.statText} hover:underline font-sans transition-colors duration-300`}
        >
          {feat.cta.label}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
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
    <section className="section-night relative py-16 sm:py-28 lg:py-36 overflow-hidden">
      <div className="landing-grain absolute inset-0 pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-20">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-lg font-sans italic text-[var(--safe-sage)] mb-4"
          >
            Ce que SAFE change concrètement
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-sans text-3xl sm:text-4xl md:text-5xl text-[var(--safe-white)] mb-6 leading-tight tracking-tight"
          >
            Les résultats, pas{" "}
            <span className="italic text-[var(--safe-sage)]">les fonctionnalités.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-base sm:text-lg text-[var(--safe-text-muted)] leading-relaxed font-sans"
          >
            Résultats mesurables dès le premier mois. Chaque fonctionnalité
            existe pour vous faire gagner du temps et de l&apos;argent.
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
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
            className="group inline-flex items-center gap-3 px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base font-semibold rounded-full border border-[var(--safe-sage)]/30 text-[var(--safe-sage)] hover:bg-[var(--safe-sage)]/10 hover:border-[var(--safe-sage)]/50 transition-all duration-300 font-sans"
          >
            Voir toutes les fonctionnalités
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
