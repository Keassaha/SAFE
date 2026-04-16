"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  ClipboardCheck,
  Phone,
  Cog,
  PackageCheck,
} from "lucide-react";

const STEPS = [
  {
    number: "01",
    icon: ClipboardCheck,
    title: "Audit d'efficacit\u00e9",
    duration: "10 min",
    description:
      "R\u00e9pondez \u00e0 quelques questions sur votre cabinet. En 10 minutes, vous recevez un rapport personnalis\u00e9 : conformit\u00e9, efficacit\u00e9, points de risque \u2014 un portrait clair de votre situation.",
    accent: {
      icon: "text-emerald-400",
      bg: "bg-emerald-500/15",
      border: "border-emerald-400/25",
      line: "bg-emerald-400",
      glow: "rgba(52, 211, 153, 0.3)",
    },
  },
  {
    number: "02",
    icon: Phone,
    title: "Consultation t\u00e9l\u00e9phonique",
    duration: "30 min",
    description:
      "On revoit ensemble les r\u00e9sultats de votre audit. On creuse vos besoins sp\u00e9cifiques, on identifie le plan id\u00e9al et on r\u00e9pond \u00e0 toutes vos questions. Sans engagement.",
    accent: {
      icon: "text-blue-400",
      bg: "bg-blue-500/15",
      border: "border-blue-400/25",
      line: "bg-blue-400",
      glow: "rgba(96, 165, 250, 0.3)",
    },
  },
  {
    number: "03",
    icon: Cog,
    title: "Pr\u00e9paration de votre syst\u00e8me",
    duration: "7-14 jours",
    description:
      "J\u00e9r\u00e9mie configure SAFE selon votre pratique : interface, automatisations, comptes fid\u00e9icommis, facturation, migration de vos donn\u00e9es. Vous continuez de pratiquer normalement.",
    accent: {
      icon: "text-amber-400",
      bg: "bg-amber-500/15",
      border: "border-amber-400/25",
      line: "bg-amber-400",
      glow: "rgba(251, 191, 36, 0.3)",
    },
  },
  {
    number: "04",
    icon: PackageCheck,
    title: "Livraison du syst\u00e8me",
    duration: "Jour 15-30",
    description:
      "Votre syst\u00e8me est pr\u00eat. On forme votre \u00e9quipe, on valide que tout fonctionne et on vous accompagne pendant 30 jours. Vous \u00eates op\u00e9rationnel sans avoir perdu une seule journ\u00e9e facturable.",
    accent: {
      icon: "text-[var(--safe-warm)]",
      bg: "bg-[rgba(212,165,116,0.15)]",
      border: "border-[rgba(212,165,116,0.35)]",
      line: "bg-[var(--safe-warm)]",
      glow: "rgba(212, 165, 116, 0.45)",
      isGold: true,
    },
  },
];

function StepCard({ step, idx }: { step: (typeof STEPS)[number]; idx: number }) {
  const ref = useRef<HTMLDivElement>(null);

  /* Tilt parallax — subtle UXPEAK-style 3D card */
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [6, -6]), {
    stiffness: 180,
    damping: 22,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-6, 6]), {
    stiffness: 180,
    damping: 22,
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
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: idx * 0.12, ease: [0.16, 1, 0.3, 1] }}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      className="group relative rounded-safe-md border border-white/[0.06] bg-[rgba(5,31,32,0.55)] backdrop-blur-md overflow-hidden"
    >
      {/* Top accent line — animates in on scroll */}
      <motion.div
        className={`absolute top-0 left-0 h-[2px] ${step.accent.line}`}
        initial={{ width: "0%" }}
        whileInView={{ width: "100%" }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, delay: 0.3 + idx * 0.12, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${step.accent.glow}, transparent 70%)`,
        }}
      />

      <div className="relative z-10 p-5 sm:p-7">
        {/* Icon + duration badge */}
        <div className="flex items-start justify-between mb-5">
          <motion.div
            className={`w-12 h-12 rounded-safe-md ${step.accent.bg} border ${step.accent.border} flex items-center justify-center`}
            whileHover={{ scale: 1.08, rotate: -4 }}
            transition={{ type: "spring", stiffness: 220, damping: 16 }}
          >
            <step.icon className={`w-6 h-6 ${step.accent.icon}`} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 + idx * 0.1, type: "spring", stiffness: 180, damping: 20 }}
            className={`px-3 py-1 rounded-full ${step.accent.bg} border ${step.accent.border}`}
          >
            <span className={`text-xs font-bold font-sans ${step.accent.icon}`}>
              {step.number}
            </span>
            <span className="text-[10px] text-white/50 font-sans ml-1.5">
              {step.duration}
            </span>
          </motion.div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-[var(--safe-white)] mb-3 font-sans tracking-tight">
          {step.title}
        </h3>

        {/* Description */}
        <p className="text-[var(--safe-text-muted)] leading-relaxed font-sans text-sm">
          {step.description}
        </p>
      </div>

      {/* Corner glow on hover */}
      <div
        className={`absolute -bottom-16 -right-16 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-30 transition-opacity duration-700 ${step.accent.line}`}
      />
    </motion.div>
  );
}

export function ProcessTimeline() {
  /* Scroll-driven gauge fill for the horizontal timeline */
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setProgress(1);
      return;
    }
    const onScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const viewH = window.innerHeight;
      const raw = (viewH - rect.top) / (rect.height + viewH * 0.3);
      const clamped = Math.max(0, Math.min(1, raw));
      setProgress(clamped);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <section ref={sectionRef} className="section-dusk relative py-16 sm:py-28 lg:py-36">
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
            On s&apos;occupe de tout.{" "}
            <span className="italic text-[var(--safe-sage)]">
              Vous continuez de pratiquer.
            </span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-base sm:text-lg text-[var(--safe-text-muted)] leading-relaxed font-sans max-w-2xl mx-auto"
          >
            Changer de syst&egrave;me fait peur. On le sait. C&apos;est pour &ccedil;a qu&apos;on fait le gros du travail pendant que vous continuez de pratiquer.
          </motion.p>
        </div>

        {/* Steps grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
          {STEPS.map((step, idx) => (
            <StepCard key={step.number} step={step} idx={idx} />
          ))}
        </div>

        {/* Scroll-driven horizontal gauge with 4 phase pips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="hidden lg:block mt-16"
          aria-hidden
        >
          <div className="relative max-w-4xl mx-auto">
            {/* Track */}
            <div className="h-[2px] w-full rounded-full bg-[rgba(142,182,155,0.09)]" />

            {/* Gauge fill (scroll-driven) */}
            <div
              className="timeline-gauge absolute inset-y-0 left-0 rounded-full transition-[width] duration-300 ease-out"
              style={{
                width: `${Math.round(progress * 100)}%`,
                height: "2px",
              }}
            />

            {/* 4 phase pips */}
            <div className="absolute inset-0 flex items-center justify-between">
              {STEPS.map((step, idx) => {
                const threshold = idx / (STEPS.length - 1);
                const active = progress >= threshold - 0.02;
                const isGold = (step.accent as { isGold?: boolean }).isGold;
                return (
                  <div
                    key={step.number}
                    className="relative flex flex-col items-center"
                  >
                    <div
                      className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-all duration-500 ${
                        active
                          ? `${step.accent.bg} border ${step.accent.border}`
                          : "bg-[rgba(12,18,14,0.9)] border border-[rgba(142,182,155,0.12)]"
                      }`}
                      style={{
                        boxShadow:
                          active && isGold
                            ? "0 0 20px rgba(212,165,116,0.45)"
                            : active
                              ? "0 0 14px rgba(142,182,155,0.3)"
                              : "none",
                      }}
                    >
                      <span
                        className={`text-xs font-bold font-sans transition-colors duration-500 ${
                          active
                            ? step.accent.icon
                            : "text-[var(--safe-text-muted)]/60"
                        }`}
                      >
                        {step.number}
                      </span>
                      {active && isGold && <span className="pulse-ring" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
