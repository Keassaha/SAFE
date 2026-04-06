"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  MapPin,
  ShieldCheck,
  Activity,
} from "lucide-react";

/* ───── Animated counter ───── */
function AnimatedCounter({
  end,
  suffix = "",
  duration = 2000,
}: {
  end: number;
  suffix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!inView) return;
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(end * eased));
      if (progress < 1) requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }, [inView, end, duration]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

/* ───── Stats ───── */
const stats = [
  {
    icon: MapPin,
    value: 100,
    suffix: "%",
    label: "Données hébergées au Canada",
    description: "Serveurs à Montréal et Toronto, conformes aux lois canadiennes sur la vie privée.",
  },
  {
    icon: ShieldCheck,
    value: 0,
    suffix: "",
    label: "Compromis sur la conformité",
    description: "Chaque fonctionnalité est validée pour respecter le Règlement B-1 r.5 du Barreau.",
  },
  {
    icon: Activity,
    value: 24,
    suffix: "/7",
    label: "Accès sécurisé à vos dossiers",
    description: "Disponibilité garantie avec sauvegardes automatiques et chiffrement bout en bout.",
  },
];

export function About() {
  return (
    <section className="section-dusk relative py-28 lg:py-36">
      <div className="landing-grain absolute inset-0 pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-4xl px-6 lg:px-10">
        {/* Label */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-sans text-sm font-semibold uppercase tracking-widest text-[var(--safe-sage)] mb-4"
        >
          Notre mission
        </motion.p>

        {/* Headline */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="font-sans text-4xl md:text-5xl text-[var(--safe-white)] mb-8 leading-tight tracking-tight"
        >
          Simplifier la gestion quotidienne des{" "}
          <span className="italic text-[var(--safe-sage)]">cabinets</span>
        </motion.h2>

        {/* Body text */}
        <div className="space-y-5 max-w-3xl">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-white/70 text-lg leading-relaxed font-sans"
          >
            Les petits cabinets en droit familial font face à des obligations de conformité
            identiques aux grands cabinets, sans les mêmes ressources. SAFE est né de ce
            constat : vous méritez un outil pensé pour votre réalité, pas un logiciel
            générique adapté à la va-vite.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-white/70 text-lg leading-relaxed font-sans"
          >
            Facturation conforme au Règlement sur la comptabilité et les normes d&apos;exercice
            professionnel, gestion de fidéicommis avec validation humaine, suivi des
            échéanciers de cour — tout est intégré, rien n&apos;est superflu.
          </motion.p>
        </div>

        {/* Stats — with generous spacing */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-16 lg:mt-20">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12, duration: 0.5 }}
              className="relative group p-6 rounded-safe-md bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.15] transition-all duration-500"
            >
              {/* Subtle top glow */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />

              <div className="w-10 h-10 rounded-safe bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                <stat.icon className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-3xl font-bold text-white font-sans mb-2 tracking-tight">
                <AnimatedCounter end={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-xs font-semibold text-emerald-400/80 font-sans uppercase tracking-wider leading-tight mb-2">
                {stat.label}
              </div>
              <p className="text-xs text-white/40 font-sans leading-relaxed">
                {stat.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
