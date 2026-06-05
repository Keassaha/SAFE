"use client";

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

type Step = {
  num: string;
  title: string;
  desc: string;
  time: string;
  detail: string;
};

const STEPS: Step[] = [
  {
    num: '01',
    title: "Audit",
    desc: "On identifie les zones de friction, les risques et les priorités du cabinet.",
    time: "10 min",
    detail: "Rapport personnalisé : votre conformité fiduciaire, votre argent immobilisé en chiffres réels, et 3 priorités concrètes pour votre cabinet. Aucun engagement, aucune démonstration commerciale.",
  },
  {
    num: '02',
    title: "Validation",
    desc: "On confirme le bon cadre pour votre pratique, votre équipe et votre mode de facturation.",
    time: "30 min",
    detail: "Un appel direct avec l'équipe SAFE. Pas de scénario commercial.",
  },
  {
    num: '03',
    title: "Mise en ordre",
    desc: "On configure SAFE, on prépare la migration et on structure le socle du cabinet.",
    time: "7-14 jours",
    detail: "On fait le travail lourd. Vous validez à chaque étape clé.",
  },
  {
    num: '04',
    title: "Mise en service",
    desc: "Le cabinet devient plus simple à piloter, plus clair à suivre et plus solide au quotidien.",
    time: "J+15 à 30",
    detail: "Première facture envoyée dès la première semaine. Premier mois de fidéicommis concilié dans les 30 jours.",
  },
];

export function ProcessTimeline() {
  const ease = [0.16, 1, 0.3, 1] as const;
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 70%", "end 30%"],
  });
  const lineProgress = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section id="processus" className="py-[100px] px-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease }}
        className="mb-16 text-center flex flex-col items-center"
      >
        <span className="text-[12px] font-sans uppercase tracking-[0.15em] text-forest-600 font-medium block mb-4">
          Le processus
        </span>
        <h2 className="font-serif text-[38px] leading-[1.1] tracking-[-0.02em] text-text-primary max-w-2xl mb-4">
          On ne vous laisse pas seul{" "}
          <span className="italic text-forest-600">
            avec un nouvel outil.
          </span>
        </h2>
        <p className="text-[15px] text-text-body font-sans leading-[1.6] max-w-xl">
          Quatre étapes, une seule logique : remettre les choses en ordre, ensemble.
        </p>
      </motion.div>

      <div ref={containerRef} className="relative pl-12 md:pl-20">
        {/* Rail de fond — centré au milieu des cercles (40px → centre à 20px du bord du container) */}
        <span
          aria-hidden
          className="absolute left-[20px] top-0 bottom-0 w-px bg-border"
        />
        {/* Rail de progression lié au scroll */}
        <motion.span
          aria-hidden
          style={{ height: lineProgress }}
          className="absolute left-[20px] top-0 w-px bg-gradient-to-b from-forest-600 to-forest-600/30"
        />

        <ul className="flex flex-col gap-5">
          {STEPS.map((step, i) => (
            <StepCard key={step.num} step={step} index={i} ease={ease} />
          ))}
        </ul>
      </div>
    </section>
  );
}

function StepCard({
  step,
  index,
  ease,
}: {
  step: Step;
  index: number;
  ease: readonly [number, number, number, number];
}) {
  return (
    <motion.li
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay: 0.1 + index * 0.1, ease }}
      whileHover="hover"
      className="relative"
    >
      {/* Pastille de l'étape — sort sur le rail */}
      <motion.span
        aria-hidden
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, delay: 0.25 + index * 0.1, ease }}
        className="absolute -left-12 md:-left-20 top-5 z-10 flex items-center justify-center"
      >
        <motion.span
          className="relative w-[40px] h-[40px] rounded-full bg-surface border border-border flex items-center justify-center shadow-sm"
          variants={{
            hover: {
              backgroundColor: "#1F3A2E",
              borderColor: "#1F3A2E",
            },
          }}
          transition={{ duration: 0.4, ease }}
        >
          {/* Numéro à l'intérieur */}
          <motion.span
            className="font-serif italic text-[14px] tabular-nums text-forest-600"
            variants={{ hover: { color: "#FFFFFF" } }}
            transition={{ duration: 0.4, ease }}
          >
            {step.num}
          </motion.span>
          {/* Anneau vert au hover */}
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full border border-forest-600"
            initial={{ opacity: 0, scale: 1 }}
            variants={{ hover: { opacity: 1, scale: 1.25 } }}
            transition={{ duration: 0.5, ease }}
          />
        </motion.span>
      </motion.span>

      {/* Carte du step */}
      <motion.div
        className="relative p-6 md:p-7 bg-surface border border-[0.5px] border-border rounded-[10px] overflow-hidden transition-[border-color,box-shadow,transform] duration-500 hover:border-forest-600/50 hover:shadow-[0_20px_60px_-30px_rgba(31,58,46,0.3)]"
      >
        {/* Halo vert subtil au hover */}
        <motion.span
          aria-hidden
          className="pointer-events-none absolute -inset-px rounded-[10px]"
          initial={{ opacity: 0 }}
          variants={{ hover: { opacity: 1 } }}
          transition={{ duration: 0.6, ease }}
          style={{
            background:
              "radial-gradient(500px circle at 0% 50%, rgba(31,58,46,0.06), transparent 55%)",
          }}
        />

        <div className="flex items-start justify-between gap-4 mb-2 relative z-10">
          <motion.h3
            className="font-serif text-[22px] leading-[1.25] tracking-[-0.01em] text-text-primary"
            variants={{ hover: { x: 2 } }}
            transition={{ duration: 0.4, ease }}
          >
            {step.title}
          </motion.h3>
          <span className="text-[11px] font-sans uppercase tracking-[0.1em] text-text-muted tabular-nums whitespace-nowrap mt-2">
            {step.time}
          </span>
        </div>

        <p className="text-[14px] text-text-body font-sans leading-[1.6] max-w-xl mb-3 relative z-10">
          {step.desc}
        </p>

        {/* Détail supplémentaire qui se déploie au hover — sans cadre, juste le texte */}
        <motion.div
          className="overflow-hidden relative z-10"
          initial={{ height: 0, opacity: 0 }}
          variants={{ hover: { height: "auto", opacity: 1 } }}
          transition={{ duration: 0.5, ease }}
        >
          <p className="pt-3 text-[13px] font-serif italic text-forest-600 leading-[1.55]">
            {step.detail}
          </p>
        </motion.div>
      </motion.div>
    </motion.li>
  );
}
