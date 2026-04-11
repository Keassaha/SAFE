"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import {
  Clock,
  Calculator,
  AlertTriangle,
} from "lucide-react";

const PAINS = [
  {
    icon: Clock,
    title: "48% de votre temps perdu en admin",
    description:
      "Les avocats ne facturent que 2,9 heures par jour sur 8. Le reste passe en tâches administratives non facturables.",
    stat: "48%",
    statLabel: "perdu",
    source: "Clio Legal Trends Report 2024",
    accent: {
      icon: "text-red-400",
      bg: "bg-red-500/15",
      border: "border-red-400/20",
      gradient: "from-red-500/20 via-red-400/5 to-transparent",
      line: "bg-red-400",
      statBg: "bg-red-400/10",
      statText: "text-red-400",
    },
  },
  {
    icon: Calculator,
    title: "30% de vos revenus jamais collectés",
    description:
      "Entre les heures non facturées et les factures impayées, seuls 70% du travail effectué génère un revenu réel.",
    stat: "30%",
    statLabel: "perdu",
    source: "Bloomberg Law 2024",
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
  {
    icon: AlertTriangle,
    title: "L'inspection peut arriver demain",
    description:
      "Fidéicommis, registres, facturation. Chaque transaction doit être tracée et conforme au Règlement B-1 r.5.",
    stat: "B-1 r.5",
    statLabel: "requis",
    source: "Barreau du Québec",
    accent: {
      icon: "text-orange-400",
      bg: "bg-orange-500/15",
      border: "border-orange-400/20",
      gradient: "from-orange-500/20 via-orange-400/5 to-transparent",
      line: "bg-orange-400",
      statBg: "bg-orange-400/10",
      statText: "text-orange-400",
    },
  },
];

function PainCard({
  item,
  idx,
}: {
  item: (typeof PAINS)[number];
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

        <p className="text-[var(--safe-text-muted)] leading-relaxed font-sans text-sm group-hover:text-white/60 transition-colors duration-500 mb-3">
          {item.description}
        </p>

        <p className="text-[10px] text-white/20 font-sans italic">
          Source : {item.source}
        </p>
      </div>

      <div
        className={`absolute -bottom-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-700 ${item.accent.line}`}
      />
    </motion.div>
  );
}

export function PainPoints() {
  return (
    <section className="section-dusk relative py-16 sm:py-24 lg:py-32 overflow-hidden">
      <div className="landing-grain absolute inset-0 pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-5xl px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <p className="text-sm font-sans font-semibold uppercase tracking-widest text-red-400/80 mb-4">
            Les chiffres parlent
          </p>
          <h2 className="font-sans text-3xl sm:text-4xl md:text-5xl text-[var(--safe-white)] mb-6 leading-tight tracking-tight">
            Ce que la paperasse{" "}
            <span className="italic text-red-400/90">vous coûte vraiment.</span>
          </h2>
        </div>

        {/* Pain cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
          {PAINS.map((item, idx) => (
            <PainCard key={item.title} item={item} idx={idx} />
          ))}
        </div>

        {/* Transition to solution */}
        <div className="text-center mt-12 sm:mt-16">
          <p className="text-lg sm:text-xl text-[var(--safe-white)] font-sans font-medium">
            Et si tout ça disparaissait{" "}
            <span className="italic text-[var(--safe-sage)]">en 30 jours ?</span>
          </p>
          <div className="mt-6 flex justify-center animate-bounce">
            <div className="w-8 h-8 rounded-full border border-[var(--safe-sage)]/20 flex items-center justify-center">
              <svg className="w-4 h-4 text-[var(--safe-sage)]/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
