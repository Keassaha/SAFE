"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  ClipboardCheck,
  Phone,
  Cog,
  PackageCheck,
  ArrowRight,
} from "lucide-react";
import Image from "next/image";

const STEPS = [
  {
    number: "01",
    icon: ClipboardCheck,
    title: "Audit d'efficacité",
    duration: "10 min",
    description:
      "Répondez à quelques questions sur votre cabinet. En 10 minutes, vous recevez un rapport personnalisé : conformité, efficacité, points de risque — un portrait clair de votre situation.",
    image: "/images/process/audit.jpg",
    alt: "Avocate remplissant l'audit d'efficacité SAFE sur son ordinateur",
    accent: { icon: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-400/25", overlay: "from-emerald-950/80" },
  },
  {
    number: "02",
    icon: Phone,
    title: "Consultation téléphonique",
    duration: "30 min",
    description:
      "On revoit ensemble les résultats de votre audit. On creuse vos besoins spécifiques, on identifie le plan idéal et on répond à toutes vos questions. Sans engagement.",
    image: "/images/process/consultation.jpg",
    alt: "Professionnel en consultation téléphonique dans un bureau moderne",
    accent: { icon: "text-blue-400", bg: "bg-blue-500/15", border: "border-blue-400/25", overlay: "from-blue-950/80" },
  },
  {
    number: "03",
    icon: Cog,
    title: "Préparation de votre système",
    duration: "7-14 jours",
    description:
      "Jérémie configure SAFE selon votre pratique : interface, automatisations, comptes fidéicommis, facturation, migration de vos données. Vous continuez de pratiquer normalement.",
    image: "/images/process/preparation.jpg",
    alt: "Configuration du système SAFE pour un cabinet d'avocats",
    accent: { icon: "text-amber-400", bg: "bg-amber-500/15", border: "border-amber-400/25", overlay: "from-amber-950/80" },
  },
  {
    number: "04",
    icon: PackageCheck,
    title: "Livraison du système",
    duration: "Jour 15-30",
    description:
      "Votre système est prêt. On forme votre équipe, on valide que tout fonctionne et on vous accompagne pendant 30 jours. Vous êtes opérationnel sans avoir perdu une seule journée facturable.",
    image: "/images/process/livraison.jpg",
    alt: "Équipe célébrant la livraison du système SAFE",
    accent: { icon: "text-violet-400", bg: "bg-violet-500/15", border: "border-violet-400/25", overlay: "from-violet-950/80" },
  },
];

function StepCard({ step, idx }: { step: typeof STEPS[number]; idx: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: idx * 0.12 }}
      className="flex flex-col group"
    >
      {/* Image with overlay */}
      <div className="relative mb-5 rounded-safe-md overflow-hidden aspect-[4/3]">
        <Image
          src={step.image}
          alt={step.alt}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        {/* Dark gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-t ${step.accent.overlay} via-transparent to-transparent`} />

        {/* Step number badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: 0.3 + idx * 0.12, type: "spring" }}
          className={`absolute top-4 left-4 w-10 h-10 rounded-full ${step.accent.bg} border ${step.accent.border} backdrop-blur-sm flex items-center justify-center`}
        >
          <span className={`text-sm font-bold font-sans ${step.accent.icon}`}>{step.number}</span>
        </motion.div>

        {/* Duration badge */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4 + idx * 0.12 }}
          className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/40 backdrop-blur-sm border border-white/10"
        >
          <span className="text-[10px] text-white font-sans font-medium">{step.duration}</span>
        </motion.div>

        {/* Bottom icon overlay */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5 + idx * 0.12 }}
          className="absolute bottom-4 left-4 flex items-center gap-2"
        >
          <div className={`w-8 h-8 rounded-lg ${step.accent.bg} border ${step.accent.border} backdrop-blur-sm flex items-center justify-center`}>
            <step.icon className={`w-4 h-4 ${step.accent.icon}`} />
          </div>
          <span className="text-sm font-semibold text-white font-sans drop-shadow-lg">
            {step.title}
          </span>
        </motion.div>
      </div>

      {/* Text below */}
      <p className="text-[var(--safe-text-muted)] leading-relaxed font-sans text-sm">
        {step.description}
      </p>
    </motion.div>
  );
}

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

        {/* Steps grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {STEPS.map((step, idx) => (
            <StepCard key={step.number} step={step} idx={idx} />
          ))}
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
