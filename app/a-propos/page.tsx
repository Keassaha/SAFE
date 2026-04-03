"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Shield, Heart, Lock, Accessibility, ArrowRight, Scale, Briefcase, FileText, Users } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/marketing/Navbar";
import { FinalCTA } from "@/components/marketing/FinalCTA";
import { Footer } from "@/components/marketing/Footer";

/* ───── Animated SAFE logo illustration ───── */
function SAFEIllustration() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const orbitItems = [
    { icon: Scale, label: "Conformité", x: 88, y: 50 },
    { icon: Briefcase, label: "Gestion", x: 62, y: 14 },
    { icon: FileText, label: "Facturation", x: 19, y: 28 },
    { icon: Users, label: "Clients", x: 19, y: 72 },
    { icon: Lock, label: "Sécurité", x: 62, y: 86 },
  ];

  return (
    <div ref={ref} className="relative w-full aspect-square max-w-md mx-auto">
      {/* Outer orbit ring */}
      <motion.div
        className="absolute inset-[10%] rounded-full border border-[var(--safe-sage)]/10"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.8, delay: 0.2 }}
      />

      {/* Inner orbit ring */}
      <motion.div
        className="absolute inset-[25%] rounded-full border border-[var(--safe-sage)]/5"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.8, delay: 0.4 }}
      />

      {/* Central SAFE logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <div className="w-20 h-20 rounded-2xl bg-[var(--safe-accent)]/20 border border-[var(--safe-sage)]/20 flex flex-col items-center justify-center">
          <Shield className="w-8 h-8 text-[var(--safe-sage)] mb-1" />
          <span className="text-[10px] font-bold text-[var(--safe-white)] font-instrument tracking-wide">SAFE</span>
        </div>
      </motion.div>

      {/* Orbiting items */}
      {orbitItems.map((item, i) => {
        return (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, scale: 0 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.6 + i * 0.12, type: "spring", stiffness: 200 }}
            className="absolute flex flex-col items-center"
            style={{ left: `${item.x}%`, top: `${item.y}%`, transform: "translate(-50%, -50%)" }}
          >
            <motion.div
              animate={inView ? { y: [0, -3, 0] } : {}}
              transition={{ delay: 1.5 + i * 0.2, duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center hover:border-[var(--safe-sage)]/20 transition-colors"
            >
              <item.icon className="w-5 h-5 text-[var(--safe-sage)]/60" />
            </motion.div>
            <span className="mt-1 text-[7px] text-[var(--safe-text-muted)] font-jakarta">{item.label}</span>
          </motion.div>
        );
      })}

      {/* Animated connection lines from center to orbit items */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
        {orbitItems.map((item, i) => {
          return (
            <motion.line
              key={i}
              x1="50" y1="50" x2={item.x} y2={item.y}
              stroke="rgba(142, 182, 155, 0.08)"
              strokeWidth="0.3"
              initial={{ pathLength: 0 }}
              animate={inView ? { pathLength: 1 } : {}}
              transition={{ delay: 0.8 + i * 0.1, duration: 0.6 }}
            />
          );
        })}
      </svg>

      {/* Pulse effect */}
      <motion.div
        className="absolute inset-[35%] rounded-full bg-[var(--safe-sage)]/5"
        animate={inView ? { scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] } : {}}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

/* ───── Animated timeline for story section ───── */
function StoryTimeline() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  const events = [
    { year: "2023", text: "Constat : les cabinets familiaux manquent d'outils adaptés" },
    { year: "2024", text: "Conception avec des avocats en droit familial au Québec" },
    { year: "2025", text: "Lancement de SAFE — conforme B-1 r.5 et Loi 25" },
    { year: "2026", text: "Employés virtuels et intégrations comptables avancées" },
  ];

  return (
    <div ref={ref} className="space-y-4">
      {events.map((event, i) => (
        <motion.div
          key={event.year}
          initial={{ opacity: 0, x: 20 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 0.3 + i * 0.2, duration: 0.5 }}
          className="flex gap-4 items-start"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={inView ? { scale: 1 } : {}}
            transition={{ delay: 0.4 + i * 0.2, type: "spring" }}
            className="shrink-0 w-14 h-8 rounded-lg bg-[var(--safe-accent)]/15 border border-[var(--safe-sage)]/15 flex items-center justify-center"
          >
            <span className="text-[10px] font-bold text-[var(--safe-sage)] font-jakarta">{event.year}</span>
          </motion.div>
          <div className="pt-1">
            <p className="text-sm text-[var(--safe-white)] font-jakarta">{event.text}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

const values = [
  {
    icon: Shield,
    title: "Conformité",
    description:
      "Chaque fonctionnalité est conçue pour respecter le Règlement B-1 r.5 du Barreau du Québec et la Loi 25 sur la protection des renseignements personnels.",
  },
  {
    icon: Heart,
    title: "Simplicité",
    description:
      "Un logiciel qui se met au service de votre pratique, pas l'inverse. Interface intuitive, formation minimale, productivité immédiate.",
  },
  {
    icon: Lock,
    title: "Sécurité",
    description:
      "Données hébergées au Canada, chiffrement AES-256, authentification multi-facteurs et piste d'audit complète sur chaque opération.",
  },
  {
    icon: Accessibility,
    title: "Accessibilité",
    description:
      "Conforme WCAG 2.1 AA, SAFE est accessible à tous les membres de votre équipe, quelles que soient leurs capacités.",
  },
];

export default function AProposPage() {
  return (
    <div className="relative flex flex-col min-h-screen bg-[var(--safe-darkest)] text-[var(--safe-white)] scroll-smooth">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="section-light relative pt-36 pb-20 lg:pt-44 lg:pb-28 overflow-hidden">
          <div className="landing-grain absolute inset-0 pointer-events-none" />
          <div className="absolute inset-0 landing-grid opacity-20 pointer-events-none" />

          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
            <div className="max-w-3xl">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-lg font-instrument italic text-[var(--safe-sage)] mb-4"
              >
                À propos
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
                className="font-instrument text-5xl md:text-6xl lg:text-7xl text-[var(--safe-white)] mb-8 leading-[1.05] tracking-tight"
              >
                Rendre la conformité{" "}
                <span className="italic text-[var(--safe-sage)]">simple</span> pour les
                petits cabinets.
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-lg text-[var(--safe-text-muted)] leading-relaxed font-jakarta"
              >
                SAFE est né d&apos;un constat simple : les avocats en droit familial au
                Québec méritent un outil à la hauteur de leur expertise, conçu pour leur
                réalité réglementaire et leur pratique quotidienne.
              </motion.p>
            </div>
          </div>
        </section>

        {/* Story */}
        <section className="section-afternoon relative py-20 lg:py-28">
          <div className="landing-grain absolute inset-0 pointer-events-none" />
          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
            <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
              <div>
                <p className="text-lg font-instrument italic text-[var(--safe-sage)] mb-4">
                  L&apos;histoire
                </p>
                <h2 className="font-instrument text-3xl md:text-4xl text-[var(--safe-white)] mb-8 leading-tight">
                  D&apos;une frustration à une solution.
                </h2>
                <div className="space-y-6 text-[var(--safe-text-muted)] font-jakarta leading-relaxed">
                  <p>
                    Tout a commencé par une conversation avec une avocate solo en droit familial
                    à Sherbrooke. Elle jonglait entre un tableur Excel pour sa facturation, un
                    logiciel comptable générique pour ses fidéicommis, et un calendrier papier
                    pour ses échéanciers de cour.
                  </p>
                  <p>
                    Malgré ses compétences juridiques exceptionnelles, elle perdait des heures
                    chaque semaine en tâches administratives redondantes — et vivait dans
                    l&apos;inquiétude constante de manquer un délai ou de commettre une erreur
                    dans ses registres de fidéicommis.
                  </p>
                  <p>
                    Nous avons réalisé que ce problème était systémique. Les logiciels de gestion
                    juridique existants étaient soit trop chers, soit conçus pour la réalité
                    américaine ou pancanadienne, sans comprendre les particularités du Barreau du
                    Québec.
                  </p>
                  <p className="text-[var(--safe-white)] font-medium">
                    SAFE a été conçu pour combler ce vide : un outil spécialisé, abordable et
                    parfaitement adapté à la pratique québécoise du droit familial.
                  </p>
                </div>
              </div>

              {/* Animated visual — replaced static placeholder */}
              <div className="flex flex-col justify-center gap-8">
                <SAFEIllustration />
              </div>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="relative py-20 lg:py-28 bg-[var(--safe-darkest)]">
          <div className="landing-grain absolute inset-0 pointer-events-none" />
          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
            <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
              <div className="lg:max-w-lg">
                <p className="text-lg font-instrument italic text-[var(--safe-sage)] mb-4">
                  La mission
                </p>
                <h2 className="font-instrument text-3xl md:text-5xl text-[var(--safe-white)] mb-8 leading-tight">
                  Que chaque avocat en droit familial au Québec puisse se concentrer sur ce qui
                  compte vraiment :{" "}
                  <span className="italic text-[var(--safe-sage)]">ses clients</span>.
                </h2>
                <p className="text-lg text-[var(--safe-text-muted)] font-jakarta leading-relaxed">
                  Nous croyons que la conformité ne devrait jamais être un obstacle à la
                  pratique du droit. SAFE automatise ce qui peut l&apos;être et simplifie le
                  reste, pour que vous puissiez dédier votre énergie aux familles que vous
                  accompagnez.
                </p>
              </div>

              {/* Animated timeline */}
              <div>
                <StoryTimeline />
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="section-light relative py-20 lg:py-28">
          <div className="landing-grain absolute inset-0 pointer-events-none" />
          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
            <div className="text-center mb-16">
              <p className="text-lg font-instrument italic text-[var(--safe-sage)] mb-4">
                Nos valeurs
              </p>
              <h2 className="font-instrument text-3xl md:text-4xl text-[var(--safe-white)]">
                Les principes qui guident chaque décision.
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {values.map((value, i) => (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="card-dark group p-8 rounded-2xl border border-[var(--safe-sage)]/10 bg-[var(--safe-darkest)] hover:border-[var(--safe-sage)]/30 transition-colors duration-500"
                >
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                    className="w-12 h-12 rounded-xl bg-[var(--safe-accent)]/15 flex items-center justify-center mb-5"
                  >
                    <value.icon className="w-6 h-6 text-[var(--safe-sage)]" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-[var(--safe-white)] mb-3 font-jakarta">
                    {value.title}
                  </h3>
                  <p className="text-[var(--safe-text-muted)] leading-relaxed font-jakarta">
                    {value.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
