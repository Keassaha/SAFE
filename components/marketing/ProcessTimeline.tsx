"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  ClipboardCheck,
  Phone,
  Cog,
  PackageCheck,
  Check,
  BarChart3,
  Shield,
  AlertTriangle,
  Calendar,
  ArrowRight,
  Monitor,
  Users,
  FileText,
  Zap,
  Rocket,
} from "lucide-react";
import Image from "next/image";

/* ───── Step 1: Audit d'efficacité — Realistic audit report card ───── */
function AuditAnimation() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div ref={ref} className="w-full aspect-[4/3] rounded-safe-md border border-emerald-400/20 bg-gradient-to-br from-[#0a1f16] to-[#0d2818] overflow-hidden relative p-4 sm:p-5">
      {/* Browser chrome */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="flex items-center gap-1.5 mb-3"
      >
        <div className="w-2 h-2 rounded-full bg-red-400/60" />
        <div className="w-2 h-2 rounded-full bg-amber-400/60" />
        <div className="w-2 h-2 rounded-full bg-green-400/60" />
        <div className="flex-1 h-5 rounded-full bg-white/5 ml-2 flex items-center px-2">
          <span className="text-[9px] text-white/30 font-mono">safecabinet.ca/audit-gratuit</span>
        </div>
      </motion.div>

      {/* Audit score card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="bg-white/[0.06] border border-white/10 rounded-lg p-3 mb-3"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-emerald-300 font-sans font-semibold uppercase tracking-wider">Résultat de votre audit</span>
          <span className="text-[10px] text-white/40 font-sans">10 min</span>
        </div>
        {/* Score circle */}
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={inView ? { scale: 1 } : {}}
            transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
            className="w-14 h-14 rounded-full border-[3px] border-emerald-400/40 flex items-center justify-center shrink-0 relative"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.9 }}
            >
              <span className="text-lg font-bold text-emerald-400 font-sans">72</span>
              <span className="text-[8px] text-emerald-400/60 font-sans">/100</span>
            </motion.div>
          </motion.div>
          <div className="flex-1 space-y-1.5">
            {[
              { label: "Conformité Barreau", pct: 85, color: "bg-emerald-400" },
              { label: "Efficacité admin", pct: 45, color: "bg-amber-400" },
              { label: "Gestion fidéicommis", pct: 60, color: "bg-emerald-400" },
            ].map((bar, i) => (
              <div key={bar.label}>
                <div className="flex justify-between mb-0.5">
                  <span className="text-[9px] text-white/60 font-sans">{bar.label}</span>
                  <span className="text-[9px] text-white/40 font-sans">{bar.pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${bar.color}`}
                    initial={{ width: "0%" }}
                    animate={inView ? { width: `${bar.pct}%` } : {}}
                    transition={{ delay: 0.8 + i * 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Risk zones */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 1.1, duration: 0.4 }}
        className="space-y-1.5"
      >
        {[
          { text: "Facturation manuelle", icon: AlertTriangle, risk: true },
          { text: "Fidéicommis conforme", icon: Shield, risk: false },
          { text: "Aucun suivi d'échéances", icon: AlertTriangle, risk: true },
        ].map((item, i) => (
          <motion.div
            key={item.text}
            initial={{ opacity: 0, x: -8 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 1.2 + i * 0.1 }}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[10px] font-sans ${
              item.risk
                ? "bg-red-500/10 border border-red-400/15 text-red-300"
                : "bg-emerald-500/10 border border-emerald-400/15 text-emerald-300"
            }`}
          >
            <item.icon className="w-3 h-3 shrink-0" />
            <span>{item.text}</span>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

/* ───── Step 2: Consultation téléphonique — Call scheduling card ───── */
function ConsultationAnimation() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div ref={ref} className="w-full aspect-[4/3] rounded-safe-md border border-blue-400/20 bg-gradient-to-br from-blue-950 to-[#0a1a2e] overflow-hidden relative p-4 sm:p-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="flex items-center justify-between mb-4"
      >
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-semibold text-white font-sans">Consultation</span>
        </div>
        <span className="px-3 py-1 rounded-full bg-blue-500/20 text-xs text-blue-300 font-medium font-sans">
          30 min
        </span>
      </motion.div>

      {/* Caller card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="bg-white/[0.06] border border-white/10 rounded-lg p-3 mb-3 flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--safe-accent)] to-emerald-700 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-white font-sans">JT</span>
        </div>
        <div>
          <p className="text-xs font-semibold text-white font-sans">Jérémie Tiahou</p>
          <p className="text-[10px] text-blue-300 font-sans">Fondateur, SAFE</p>
        </div>
        <motion.div
          animate={inView ? { scale: [1, 1.15, 1] } : {}}
          transition={{ delay: 1, duration: 1.5, repeat: Infinity }}
          className="ml-auto w-8 h-8 rounded-full bg-green-500/20 border border-green-400/30 flex items-center justify-center"
        >
          <Phone className="w-3.5 h-3.5 text-green-400" />
        </motion.div>
      </motion.div>

      {/* Discussion points */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="mb-3"
      >
        <span className="text-[10px] text-blue-300/60 font-sans uppercase tracking-wider mb-2 block">Ordre du jour</span>
      </motion.div>
      {[
        { text: "Revue des résultats d'audit", done: true },
        { text: "Besoins spécifiques du cabinet", done: true },
        { text: "Plan recommandé", done: false },
        { text: "Questions & prochaines étapes", done: false },
      ].map((item, i) => (
        <motion.div
          key={item.text}
          initial={{ opacity: 0, x: -10 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 0.7 + i * 0.12 }}
          className="flex items-center gap-2 py-1.5"
        >
          <div className={`w-4 h-4 rounded-sm flex items-center justify-center ${
            item.done ? "bg-blue-500/25" : "border border-white/15"
          }`}>
            {item.done && <Check className="w-2.5 h-2.5 text-blue-400" />}
          </div>
          <span className={`text-[11px] font-sans ${item.done ? "text-white/90" : "text-white/40"}`}>{item.text}</span>
        </motion.div>
      ))}
    </div>
  );
}

/* ───── Step 3: Préparation du système — Build dashboard ───── */
function PreparationAnimation() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const configItems = [
    { label: "Interface du cabinet", done: true },
    { label: "Comptes fidéicommis", done: true },
    { label: "Modèles de facturation", done: true },
    { label: "Migration des données", done: true },
    { label: "Automatisations", done: false },
    { label: "Tests de conformité", done: false },
  ];

  const progress = (configItems.filter((c) => c.done).length / configItems.length) * 100;

  return (
    <div ref={ref} className="w-full aspect-[4/3] rounded-safe-md border border-amber-400/20 bg-gradient-to-br from-amber-950 to-[#1a1408] overflow-hidden p-4 sm:p-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-between mb-3"
      >
        <div className="flex items-center gap-2">
          <Cog className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-white font-sans">Préparation en cours</span>
        </div>
        <span className="text-xs text-amber-300 font-medium font-sans">{configItems.filter(c => c.done).length}/{configItems.length}</span>
      </motion.div>

      {/* Progress bar */}
      <div className="w-full h-2 rounded-full bg-white/5 mb-1 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400"
          initial={{ width: "0%" }}
          animate={inView ? { width: `${progress}%` } : {}}
          transition={{ delay: 0.4, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <motion.p
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : {}}
        transition={{ delay: 0.6 }}
        className="text-[9px] text-amber-300/50 font-sans mb-3"
      >
        Jérémie configure votre système pendant que vous pratiquez.
      </motion.p>

      {/* Config checklist */}
      <div className="space-y-1.5">
        {configItems.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, x: -12 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.5 + i * 0.1, duration: 0.35 }}
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md ${
              item.done ? "bg-amber-500/10 border border-amber-400/10" : "bg-white/[0.02] border border-white/5"
            }`}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={inView ? { scale: 1 } : {}}
              transition={{ delay: 0.65 + i * 0.1, type: "spring" }}
              className={`w-4 h-4 rounded-sm flex items-center justify-center ${
                item.done ? "bg-amber-500/25" : "border border-white/15"
              }`}
            >
              {item.done && <Check className="w-2.5 h-2.5 text-amber-400" />}
            </motion.div>
            <span className={`text-[11px] font-sans font-medium ${item.done ? "text-white" : "text-white/35"}`}>
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

/* ───── Step 4: Livraison du système — Dashboard reveal ───── */
function LivraisonAnimation() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div ref={ref} className="w-full aspect-[4/3] rounded-safe-md border border-violet-400/20 bg-gradient-to-br from-violet-950 to-[#1a0a2e] overflow-hidden relative p-4 sm:p-5">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-between mb-3"
      >
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-semibold text-white font-sans">Votre tableau de bord</span>
        </div>
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 1.2, type: "spring" }}
          className="px-2.5 py-1 rounded-full bg-green-500/20 text-[10px] text-green-300 font-bold font-sans border border-green-400/20"
        >
          EN LIGNE
        </motion.span>
      </motion.div>

      {/* Mini dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="bg-white/[0.06] border border-white/10 rounded-lg p-3 mb-2.5"
      >
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-2.5">
          {[
            { label: "Dossiers", value: "24", color: "text-violet-300" },
            { label: "Fidéicommis", value: "OK", color: "text-green-400" },
            { label: "Conformité", value: "98%", color: "text-emerald-400" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.6 + i * 0.12 }}
              className="text-center"
            >
              <p className={`text-base font-bold font-sans ${stat.color}`}>{stat.value}</p>
              <p className="text-[8px] text-white/40 font-sans">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Mini chart bars */}
        <div className="flex items-end gap-1 h-8">
          {[40, 65, 50, 80, 70, 90, 75, 85, 95].map((h, i) => (
            <motion.div
              key={i}
              className="flex-1 rounded-sm bg-gradient-to-t from-violet-500/40 to-violet-400/60"
              initial={{ height: 0 }}
              animate={inView ? { height: `${h}%` } : {}}
              transition={{ delay: 0.8 + i * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            />
          ))}
        </div>
      </motion.div>

      {/* Delivered items */}
      <div className="space-y-1.5">
        {[
          { text: "Formation complétée", icon: Users },
          { text: "Données migrées", icon: FileText },
          { text: "Support 30 jours activé", icon: Zap },
        ].map((item, i) => (
          <motion.div
            key={item.text}
            initial={{ opacity: 0, x: -8 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 1.0 + i * 0.12 }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-green-500/8 border border-green-400/10"
          >
            <Check className="w-3 h-3 text-green-400 shrink-0" />
            <span className="text-[10px] text-green-300/80 font-sans">{item.text}</span>
          </motion.div>
        ))}
      </div>

      {/* Rocket */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ delay: 1.4, type: "spring" }}
        className="absolute bottom-3 right-3"
      >
        <motion.div
          animate={inView ? { y: [0, -3, 0] } : {}}
          transition={{ delay: 1.6, duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-8 h-8 rounded-full bg-violet-500/15 border border-violet-400/20 flex items-center justify-center"
        >
          <Rocket className="w-4 h-4 text-violet-400" />
        </motion.div>
      </motion.div>
    </div>
  );
}

const stepAnimations = [AuditAnimation, ConsultationAnimation, PreparationAnimation, LivraisonAnimation];

const STEPS = [
  {
    number: "01",
    icon: ClipboardCheck,
    title: "Audit d'efficacité",
    duration: "10 min",
    description:
      "Répondez à quelques questions sur votre cabinet. En 10 minutes, vous recevez un rapport personnalisé : conformité, efficacité, points de risque — un portrait clair de votre situation.",
    accent: { icon: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-400/25" },
  },
  {
    number: "02",
    icon: Phone,
    title: "Consultation téléphonique",
    duration: "30 min",
    description:
      "On revoit ensemble les résultats de votre audit. On creuse vos besoins spécifiques, on identifie le plan idéal et on répond à toutes vos questions. Sans engagement.",
    accent: { icon: "text-blue-400", bg: "bg-blue-500/15", border: "border-blue-400/25" },
  },
  {
    number: "03",
    icon: Cog,
    title: "Préparation de votre système",
    duration: "7-14 jours",
    description:
      "Jérémie configure SAFE selon votre pratique : interface, automatisations, comptes fidéicommis, facturation, migration de vos données. Vous continuez de pratiquer normalement.",
    accent: { icon: "text-amber-400", bg: "bg-amber-500/15", border: "border-amber-400/25" },
  },
  {
    number: "04",
    icon: PackageCheck,
    title: "Livraison du système",
    duration: "Jour 15-30",
    description:
      "Votre système est prêt. On forme votre équipe, on valide que tout fonctionne et on vous accompagne pendant 30 jours. Vous êtes opérationnel sans avoir perdu une seule journée facturable.",
    accent: { icon: "text-violet-400", bg: "bg-violet-500/15", border: "border-violet-400/25" },
  },
];

export function ProcessTimeline() {
  return (
    <section className="section-dusk relative py-16 sm:py-28 lg:py-36">
      <div className="landing-grain absolute inset-0 pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        {/* Header */}
        <div className="text-center mb-16 lg:mb-20">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-lg font-sans italic text-[var(--safe-sage)] mb-4"
          >
            Le processus
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-sans text-3xl sm:text-4xl md:text-5xl text-[var(--safe-white)] mb-6 leading-tight tracking-tight max-w-3xl mx-auto"
          >
            De votre réalité à votre système.{" "}
            <span className="italic text-[var(--safe-sage)]">En quatre étapes.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-base sm:text-lg text-[var(--safe-text-muted)] leading-relaxed font-sans max-w-2xl mx-auto"
          >
            Changer de système fait peur. On le sait. C&apos;est pour ça qu&apos;on fait le gros du travail pendant que vous continuez de pratiquer.
          </motion.p>
        </div>

        {/* Steps grid — 2x2 on desktop, 1 col on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {STEPS.map((step, idx) => {
            const AnimComponent = stepAnimations[idx];
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: idx * 0.12 }}
                className="flex flex-col"
              >
                {/* Animated visual */}
                <div className="mb-5">
                  <AnimComponent />
                </div>

                {/* Step label + duration */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-[var(--safe-text-muted)] tracking-wider font-sans">
                    ÉTAPE {step.number}
                  </span>
                  <span className="text-[10px] text-[var(--safe-sage)] font-sans font-medium px-2 py-0.5 rounded-full bg-[var(--safe-sage)]/10 border border-[var(--safe-sage)]/20">
                    {step.duration}
                  </span>
                </div>

                {/* Icon + Title */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-safe border ${step.accent.border} ${step.accent.bg} flex items-center justify-center shrink-0`}>
                    <step.icon className={`w-5 h-5 ${step.accent.icon}`} />
                  </div>
                  <h3 className="text-lg font-bold text-[var(--safe-white)] font-sans tracking-tight">
                    {step.title}
                  </h3>
                </div>

                <p className="text-[var(--safe-text-muted)] leading-relaxed font-sans text-sm">
                  {step.description}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Arrow flow — desktop only */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="hidden lg:flex items-center justify-center gap-4 mt-12"
        >
          {STEPS.map((step, idx) => (
            <div key={step.number} className="flex items-center gap-4">
              <div className={`w-8 h-8 rounded-full ${step.accent.bg} border ${step.accent.border} flex items-center justify-center`}>
                <span className={`text-xs font-bold font-sans ${step.accent.icon}`}>{step.number}</span>
              </div>
              {idx < STEPS.length - 1 && (
                <ArrowRight className="w-4 h-4 text-[var(--safe-text-muted)]/40" />
              )}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
