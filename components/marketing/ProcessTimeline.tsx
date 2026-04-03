"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Phone,
  Settings,
  Rocket,
  MessageSquare,
  Check,
  Users,
  Calendar,
  Zap,
  ArrowRight,
  Video,
  Headphones,
} from "lucide-react";

/* ───── Step 1: Découverte — Video call card ───── */
function DiscoveryAnimation() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div ref={ref} className="w-full aspect-[4/3] rounded-2xl border border-blue-400/20 bg-gradient-to-br from-blue-950 to-[#0a1a2e] overflow-hidden relative p-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="flex items-center justify-between mb-5"
      >
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-blue-400" />
          <span className="text-[11px] font-semibold text-white font-jakarta">Appel découverte</span>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-[10px] text-blue-300 font-medium font-jakarta">
          30 min
        </span>
      </motion.div>

      {/* Two participants */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.4 }}
          className="rounded-xl bg-blue-500/10 border border-blue-400/15 p-4 flex flex-col items-center justify-center"
        >
          <div className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-400/20 flex items-center justify-center mb-2">
            <Users className="w-5 h-5 text-blue-400" />
          </div>
          <span className="text-[10px] text-white/80 font-jakarta font-medium">Votre cabinet</span>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.6 }}
          className="rounded-xl bg-emerald-500/10 border border-emerald-400/15 p-4 flex flex-col items-center justify-center"
        >
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400/20 flex items-center justify-center mb-2">
            <span className="text-base font-bold text-emerald-400 font-instrument">S</span>
          </div>
          <span className="text-[10px] text-white/80 font-jakarta font-medium">Équipe SAFE</span>
        </motion.div>
      </div>

      {/* Agenda items */}
      {[
        { text: "Pratique & spécialisation", done: true },
        { text: "Outils actuels", done: true },
        { text: "Besoins en conformité", done: false },
      ].map((item, i) => (
        <motion.div
          key={item.text}
          initial={{ opacity: 0, x: -10 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 0.8 + i * 0.15 }}
          className="flex items-center gap-2 py-1.5"
        >
          <div className={`w-4 h-4 rounded-md flex items-center justify-center ${
            item.done ? "bg-blue-500/25" : "border border-white/15"
          }`}>
            {item.done && <Check className="w-2.5 h-2.5 text-blue-400" />}
          </div>
          <span className={`text-[10px] font-jakarta ${item.done ? "text-white/90" : "text-white/50"}`}>{item.text}</span>
        </motion.div>
      ))}
    </div>
  );
}

/* ───── Step 2: Configuration — Settings dashboard ───── */
function ConfigAnimation() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const configItems = [
    { label: "Taux horaires", done: true, color: "bg-amber-400" },
    { label: "Modèles de facture", done: true, color: "bg-amber-400" },
    { label: "Comptes fidéicommis", done: true, color: "bg-amber-400" },
    { label: "Listes de taxes", done: false, color: "bg-white/20" },
    { label: "Rôles utilisateurs", done: false, color: "bg-white/20" },
  ];

  const progress = (configItems.filter((c) => c.done).length / configItems.length) * 100;

  return (
    <div ref={ref} className="w-full aspect-[4/3] rounded-2xl border border-amber-400/20 bg-gradient-to-br from-amber-950 to-[#1a1408] overflow-hidden p-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-between mb-4"
      >
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-amber-400" />
          <span className="text-[11px] font-semibold text-white font-jakarta">Configuration</span>
        </div>
        <span className="text-[10px] text-amber-300 font-medium font-jakarta">3/5</span>
      </motion.div>

      {/* Progress bar */}
      <div className="w-full h-2 rounded-full bg-white/5 mb-5 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400"
          initial={{ width: "0%" }}
          animate={inView ? { width: `${progress}%` } : {}}
          transition={{ delay: 0.4, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>

      {/* Config checklist */}
      <div className="space-y-2.5">
        {configItems.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -15 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.5 + i * 0.12, duration: 0.4 }}
            className={`flex items-center gap-3 p-2.5 rounded-lg ${
              item.done ? "bg-amber-500/10 border border-amber-400/10" : "bg-white/[0.03] border border-white/5"
            }`}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={inView ? { scale: 1 } : {}}
              transition={{ delay: 0.7 + i * 0.12, type: "spring" }}
              className={`w-5 h-5 rounded-md flex items-center justify-center ${
                item.done ? "bg-amber-500/25" : "border border-white/15"
              }`}
            >
              {item.done && <Check className="w-3 h-3 text-amber-400" />}
            </motion.div>
            <span className={`text-[11px] font-jakarta font-medium ${item.done ? "text-white" : "text-white/40"}`}>
              {item.label}
            </span>
            {item.done && (
              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400" />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ───── Step 3: Lancement — Launch timeline ───── */
function LaunchAnimation() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const milestones = [
    { label: "Jour 1-3", desc: "Formation de l'équipe", icon: Users, color: "text-emerald-400", bg: "bg-emerald-500/20" },
    { label: "Jour 4-14", desc: "Migration des données", icon: Zap, color: "text-cyan-400", bg: "bg-cyan-500/20" },
    { label: "Jour 15-30", desc: "Accompagnement dédié", icon: Headphones, color: "text-violet-400", bg: "bg-violet-500/20" },
  ];

  return (
    <div ref={ref} className="w-full aspect-[4/3] rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-950 to-[#081a12] overflow-hidden p-5 relative">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-between mb-5"
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span className="text-[11px] font-semibold text-white font-jakarta">Plan de lancement</span>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-[10px] text-emerald-300 font-medium font-jakarta">
          30 jours
        </span>
      </motion.div>

      {/* Timeline milestones */}
      <div className="relative ml-2 pl-6 border-l-2 border-emerald-400/20 space-y-4">
        {milestones.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, x: -15 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.4 + i * 0.2, duration: 0.5 }}
            className="relative"
          >
            {/* Timeline dot */}
            <motion.div
              initial={{ scale: 0 }}
              animate={inView ? { scale: 1 } : {}}
              transition={{ delay: 0.5 + i * 0.2, type: "spring" }}
              className="absolute -left-[31px] w-4 h-4 rounded-full bg-emerald-500/30 border-2 border-emerald-400/40 flex items-center justify-center"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </motion.div>

            <div className={`flex items-center gap-3 p-3 rounded-lg ${m.bg}/10 border border-white/5`}>
              <div className={`w-9 h-9 rounded-lg ${m.bg} flex items-center justify-center shrink-0`}>
                <m.icon className={`w-4 h-4 ${m.color}`} />
              </div>
              <div>
                <div className={`text-[10px] ${m.color} font-jakarta font-semibold`}>{m.label}</div>
                <div className="text-[11px] text-white font-jakarta">{m.desc}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Rocket icon */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="absolute bottom-4 right-4"
      >
        <motion.div
          animate={inView ? { y: [0, -4, 0] } : {}}
          transition={{ delay: 1.5, duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-400/20 flex items-center justify-center"
        >
          <Rocket className="w-5 h-5 text-emerald-400" />
        </motion.div>
      </motion.div>
    </div>
  );
}

const stepAnimations = [DiscoveryAnimation, ConfigAnimation, LaunchAnimation];

const STEPS = [
  {
    number: "01",
    icon: Phone,
    title: "Découverte",
    description:
      "Un appel de 30 minutes pour comprendre votre pratique, vos défis de conformité et vos besoins spécifiques en droit familial.",
    accent: { icon: "text-blue-400", bg: "bg-blue-500/15", border: "border-blue-400/25" },
  },
  {
    number: "02",
    icon: Settings,
    title: "Configuration",
    description:
      "On configure SAFE selon votre cabinet : taux horaires, modèles de facturation, comptes en fidéicommis et listes de taxes.",
    accent: { icon: "text-amber-400", bg: "bg-amber-500/15", border: "border-amber-400/25" },
  },
  {
    number: "03",
    icon: Rocket,
    title: "Lancement",
    description:
      "Formation complète de votre équipe et accompagnement dédié pendant les 30 premiers jours de transition.",
    accent: { icon: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-400/25" },
  },
];

export function ProcessTimeline() {
  return (
    <section className="section-dusk relative py-28 lg:py-36">
      <div className="landing-grain absolute inset-0 pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-16 lg:mb-20">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-lg font-instrument italic text-[var(--safe-sage)] mb-4"
          >
            Processus d&apos;intégration
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-instrument text-4xl md:text-5xl text-[var(--safe-white)] mb-6 leading-tight tracking-tight max-w-3xl mx-auto"
          >
            Une transition fluide, structurée et{" "}
            <span className="italic text-[var(--safe-sage)]">sans stress</span>.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-lg text-[var(--safe-text-muted)] leading-relaxed font-jakarta max-w-2xl mx-auto"
          >
            Nous connaissons la valeur de vos heures facturables. Notre processus
            d&apos;intégration est conçu pour minimiser les interruptions de votre pratique.
          </motion.p>
        </div>

        {/* Steps with animations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
          {STEPS.map((step, idx) => {
            const AnimComponent = stepAnimations[idx];
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                className="flex flex-col"
              >
                {/* Animated visual */}
                <div className="mb-6">
                  <AnimComponent />
                </div>

                {/* Step label */}
                <span className="text-xs font-mono text-[var(--safe-text-muted)] tracking-wider mb-2 block font-jakarta">
                  ÉTAPE {step.number}
                </span>

                {/* Icon + Title */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl border ${step.accent.border} ${step.accent.bg} flex items-center justify-center shrink-0`}>
                    <step.icon className={`w-5 h-5 ${step.accent.icon}`} />
                  </div>
                  <h3 className="text-xl font-bold text-[var(--safe-white)] font-jakarta">
                    {step.title}
                  </h3>
                </div>

                <p className="text-[var(--safe-text-muted)] leading-relaxed font-jakarta text-sm">
                  {step.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
