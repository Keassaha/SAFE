"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import {
  FolderCheck,
  ShieldCheck,
  Clock,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

const CALENDLY_URL = "https://calendly.com/jeremie/30min";

const OUTCOMES = [
  {
    icon: TrendingUp,
    title: "Rentabilité visible instantanément",
    description:
      "Vos chiffres en temps réel : revenus, honoraires, encaissements et performance par dossier. Vous pilotez le cabinet avec des décisions claires.",
    stat: "1 clic",
    cta: { label: "Faire mon audit gratuit", href: "/audit-gratuit" },
    accent: {
      icon: "text-cyan-400",
      bg: "bg-cyan-500/15",
      border: "border-cyan-400/20",
      gradient: "from-cyan-500/20 via-cyan-400/5 to-transparent",
      line: "bg-cyan-400",
      statBg: "bg-cyan-400/10",
      statText: "text-cyan-400",
    },
  },
  {
    icon: FolderCheck,
    title: "Fidéicommis réconcilié en 1 clic",
    description:
      "Dépôts, retraits, double validation, soldes en temps réel par client et par dossier. Moins de saisie, plus de temps facturable.",
    stat: "1 clic",
    cta: { label: "Réserver un appel", href: CALENDLY_URL },
    accent: {
      icon: "text-emerald-400",
      bg: "bg-emerald-500/15",
      border: "border-emerald-400/20",
      gradient: "from-emerald-500/20 via-emerald-400/5 to-transparent",
      line: "bg-emerald-400",
      statBg: "bg-emerald-400/10",
      statText: "text-emerald-400",
    },
  },
  {
    icon: ShieldCheck,
    title: "Toujours prêt pour l\u2019inspection",
    description:
      "Piste d\u2019audit, exports et contrôles. La conformité devient une tranquillit\u00e9 d\u2019esprit, pas une course de dernière minute.",
    stat: "B-1 r.5",
    cta: { label: "Faire mon audit gratuit", href: "/audit-gratuit" },
    accent: {
      icon: "text-violet-400",
      bg: "bg-violet-500/15",
      border: "border-violet-400/20",
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
      "Échéanciers judiciaires, rappels et alertes automatiques. Zéro oubli : vous avancez avec confiance.",
    stat: "0 oubli",
    cta: { label: "Réserver un appel", href: CALENDLY_URL },
    accent: {
      icon: "text-amber-400",
      bg: "bg-amber-500/15",
      border: "border-amber-400/20",
      gradient: "from-amber-500/20 via-amber-400/5 to-transparent",
      line: "bg-amber-400",
      statBg: "bg-amber-400/10",
      statText: "text-amber-400",
    },
  },
];

/* ───── "Dossier" cube — PainPoints-style tilt + top accent line ───── */
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

  const isExternal = feat.cta.href.startsWith("http");
  const ctaClasses = `inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-full text-sm font-semibold font-sans ${feat.accent.statText} bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.18)] transition-all duration-300`;

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
      {/* Hover gradient overlay */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-br ${feat.accent.gradient} opacity-0 transition-opacity duration-700`}
        style={{ opacity: hovered ? 1 : 0 }}
      />

      {/* Top accent line — scroll-in animation */}
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
        {/* Icon + stat pill */}
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
          </motion.div>
        </div>

        <h3 className="text-xl font-bold text-[var(--safe-white)] mb-3 font-sans tracking-tight">
          {feat.title}
        </h3>

        <p className="text-[var(--safe-text-muted)] leading-relaxed font-sans text-sm group-hover:text-white/60 transition-colors duration-500">
          {feat.description}
        </p>

        {isExternal ? (
          <a
            href={feat.cta.href}
            target="_blank"
            rel="noopener noreferrer"
            className={ctaClasses}
          >
            {feat.cta.label}
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
          </a>
        ) : (
          <Link href={feat.cta.href} className={ctaClasses}>
            {feat.cta.label}
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>

      {/* Corner blur glow */}
      <div
        className={`absolute -bottom-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-700 ${feat.accent.line}`}
      />
    </motion.div>
  );
}

export function FeaturesGrid() {
  return (
    <section className="relative py-24 sm:py-32 lg:py-40 overflow-hidden">
      <div className="landing-grain absolute inset-0 pointer-events-none opacity-30" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
        <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-24">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--safe-sage)] mb-5 font-sans"
          >
            Ce que SAFE change concrètement
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.05 }}
            className="font-sans text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-[1.1] tracking-tight"
          >
            Les résultats, pas{" "}
            <span className="italic text-[var(--safe-sage)]">les fonctionnalités.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.12, duration: 0.6 }}
            className="text-base sm:text-lg text-white/45 leading-relaxed font-sans max-w-2xl mx-auto"
          >
            Résultats mesurables dès le premier mois. Chaque fonctionnalité
            existe pour vous faire gagner du temps et de l&apos;argent.
          </motion.p>

          <motion.div
            className="mx-auto mt-10 h-px bg-gradient-to-r from-transparent via-[var(--safe-sage)]/40 to-transparent"
            initial={{ width: 0, opacity: 0 }}
            whileInView={{ width: "50%", opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {OUTCOMES.map((feat, idx) => (
            <OutcomeCard key={feat.title} feat={feat} idx={idx} />
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.9, duration: 0.7 }}
          className="text-center mt-20"
        >
          <Link
            href="/fonctionnalites"
            className="group inline-flex items-center gap-3 px-8 py-4 text-sm sm:text-base font-semibold rounded-full font-sans text-white bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] hover:bg-[rgba(255,255,255,0.1)] hover:border-[rgba(255,255,255,0.22)] hover:shadow-lg hover:shadow-white/5 transition-all duration-400"
          >
            Voir toutes les fonctionnalités
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
