"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import Image from "next/image";
import {
  Shield,
  LockKeyhole,
  Database,
  FileCheck,
  Fingerprint,
  MapPin,
  ShieldCheck,
  Activity,
  CheckCircle2,
  Server,
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
    <section className="section-afternoon relative py-28 lg:py-36">
      <div className="landing-grain absolute inset-0 pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          {/* Left — text + stats */}
          <div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-jakarta text-sm font-semibold uppercase tracking-widest text-[var(--safe-sage)] mb-4"
            >
              Notre mission
            </motion.p>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="font-instrument text-4xl md:text-5xl text-[#1a2e28] mb-8 leading-tight tracking-tight"
            >
              Simplifier la gestion quotidienne des{" "}
              <span className="italic text-[var(--safe-sage)]">cabinets</span>
            </motion.h2>

            <div className="space-y-5">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1, duration: 0.6 }}
                className="text-[#2B4A3E]/90 text-lg leading-relaxed font-jakarta"
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
                className="text-[#2B4A3E]/90 text-lg leading-relaxed font-jakarta mb-12"
              >
                Facturation conforme au Règlement sur la comptabilité et les normes d&apos;exercice
                professionnel, gestion de fidéicommis avec validation humaine, suivi des
                échéanciers de cour — tout est intégré, rien n&apos;est superflu.
              </motion.p>
            </div>

            {/* Stats — bold horizontal cards */}
            <div className="grid grid-cols-3 gap-3">
              {stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12, duration: 0.5 }}
                  className="relative group p-5 rounded-2xl bg-[#0B2B26] border border-[#163832] shadow-lg hover:shadow-xl transition-all duration-500 overflow-hidden"
                >
                  {/* Subtle top glow */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />

                  <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center mb-3">
                    <stat.icon className="w-4.5 h-4.5 text-emerald-400" />
                  </div>
                  <div className="text-3xl font-bold text-white font-instrument mb-1 tracking-tight">
                    <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-400/80 font-jakarta uppercase tracking-wider leading-tight">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right — security dashboard visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex items-center justify-center"
          >
            <div className="relative w-full max-w-lg mx-auto">
              <div className="absolute inset-0 -m-6 bg-gradient-to-br from-emerald-400/20 via-transparent to-teal-400/10 rounded-[2.5rem] blur-2xl pointer-events-none" />
              <Image 
                src="/images/security_illustration.png" 
                alt="Digital Security and Management Illustration" 
                layout="responsive"
                width={800} 
                height={800} 
                className="relative z-10 w-full h-auto object-cover rounded-3xl shadow-2xl border border-white/20"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

