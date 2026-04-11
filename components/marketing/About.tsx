"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import {
  MapPin,
  ShieldCheck,
  Activity,
} from "lucide-react";

const stats = [
  {
    icon: MapPin,
    title: "Données hébergées au Canada",
    description: "Serveurs à Montréal et Toronto, conformes aux lois canadiennes sur la vie privée.",
    stat: "100%",
    statLabel: "canadien",
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
    title: "Zéro compromis sur la conformité",
    description: "Chaque fonctionnalité est validée pour respecter le Règlement B-1 r.5 du Barreau.",
    stat: "0",
    statLabel: "compromis",
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
    icon: Activity,
    title: "Accès sécurisé à vos dossiers",
    description: "Disponibilité garantie avec sauvegardes automatiques et chiffrement bout en bout.",
    stat: "24/7",
    statLabel: "disponible",
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
];

function StatCard({
  item,
  idx,
}: {
  item: (typeof stats)[number];
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
      <motion.div
        className={`absolute inset-0 bg-gradient-to-br ${item.accent.gradient} opacity-0 transition-opacity duration-700`}
        style={{ opacity: hovered ? 1 : 0 }}
      />

      <motion.div
        className={`absolute top-0 left-0 h-[2px] ${item.accent.line}`}
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
        <div className="flex items-start justify-between mb-6">
          <motion.div
            className={`w-14 h-14 rounded-safe-md ${item.accent.bg} border ${item.accent.border} flex items-center justify-center`}
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <item.icon className={`w-7 h-7 ${item.accent.icon}`} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 + idx * 0.1, type: "spring", stiffness: 180, damping: 20 }}
            className={`px-3 py-1.5 rounded-safe ${item.accent.statBg} border ${item.accent.border}`}
          >
            <span className={`text-sm font-bold font-sans ${item.accent.statText}`}>
              {item.stat}
            </span>
            <span className="text-xs text-white/40 font-sans ml-1.5">
              {item.statLabel}
            </span>
          </motion.div>
        </div>

        <h3 className="text-xl font-bold text-[var(--safe-white)] mb-3 font-sans tracking-tight">
          {item.title}
        </h3>

        <p className="text-[var(--safe-text-muted)] leading-relaxed font-sans text-sm group-hover:text-white/60 transition-colors duration-500">
          {item.description}
        </p>
      </div>

      <div
        className={`absolute -bottom-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-700 ${item.accent.line}`}
      />
    </motion.div>
  );
}

export function About() {
  return (
    <section className="section-dusk relative py-16 sm:py-28 lg:py-36">
      <div className="landing-grain absolute inset-0 pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-10">
        {/* Label */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="font-sans text-sm font-semibold uppercase tracking-widest text-[var(--safe-sage)] mb-4"
          >
            Le vrai problème
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-sans text-3xl sm:text-4xl md:text-5xl text-[var(--safe-white)] mb-6 leading-tight tracking-tight"
          >
            Vous n&apos;avez pas fait le Barreau pour devenir{" "}
            <span className="italic text-[var(--safe-sage)]">comptable.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-base sm:text-lg text-[var(--safe-text-muted)] leading-relaxed font-sans"
          >
            SAFE automatise la conformité et la facturation pour que vous puissiez
            redevenir avocat.
          </motion.p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
          {stats.map((item, idx) => (
            <StatCard key={item.title} item={item} idx={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}
