"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Shield, Heart, Lock, Accessibility, ArrowRight, Scale, Briefcase, FileText, Users } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/marketing/Navbar";
import { FinalCta } from "@/components/landing/FinalCta";
import { Footer } from "@/components/landing/Footer";

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
        className="absolute inset-[10%] rounded-full border border-forest-600/10"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={inView ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.8, delay: 0.2 }}
      />

      {/* Inner orbit ring */}
      <motion.div
        className="absolute inset-[25%] rounded-full border border-forest-600/5"
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
        <div className="w-20 h-20 rounded-safe-md bg-text-secondary/20 border border-forest-600/20 flex flex-col items-center justify-center">
          <Shield className="w-8 h-8 text-forest-600 mb-1" />
          <span className="text-xs font-bold text-text-primary font-sans tracking-wide">SAFE</span>
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
              className="w-11 h-11 rounded-safe bg-surface-2 border border-border flex items-center justify-center hover:border-forest-600/20 transition-colors"
            >
              <item.icon className="w-5 h-5 text-forest-600/60" />
            </motion.div>
            <span className="mt-1 text-xs text-text-body font-sans">{item.label}</span>
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
    { year: "2025", text: "Le constat, depuis la comptabilité d'une avocate en droit de la famille : trente minutes pour émettre une seule facture, du temps facturable laissé sur la table." },
    { year: "2025", text: "Août. Début de la construction de SAFE. Pensé d'abord en comptabilité, ensuite en logiciel. Socle conforme B-1 r.5, hébergement canadien, Loi 25." },
    { year: "2026", text: "SAFE se construit en public. Les avancées, les chiffres, les doutes, les leçons, documentés au fil de l'eau." },
    { year: "2026", text: "Premiers cabinets accompagnés. Migration assistée, mise en service, accompagnement humain à chaque étape." },
  ];

  return (
    <div ref={ref} className="space-y-4">
      {events.map((event, i) => (
        <motion.div
          key={`${event.year}-${i}`}
          initial={{ opacity: 0, x: 20 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ delay: 0.3 + i * 0.2, duration: 0.5 }}
          className="flex gap-4 items-start"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={inView ? { scale: 1 } : {}}
            transition={{ delay: 0.4 + i * 0.2, type: "spring" }}
            className="shrink-0 w-14 h-8 rounded-safe-sm bg-text-secondary/15 border border-forest-600/15 flex items-center justify-center"
          >
            <span className="text-xs font-bold text-forest-600 font-sans">{event.year}</span>
          </motion.div>
          <div className="pt-1">
            <p className="text-sm text-text-primary font-sans">{event.text}</p>
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
    <div className="relative flex flex-col min-h-screen bg-canvas text-text-primary scroll-smooth">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-canvas sm:border-y border-[0.5px] border-border relative pt-36 pb-20 lg:pt-44 lg:pb-28 overflow-hidden">
          
          

          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
            <div className="max-w-3xl">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-lg font-sans italic text-forest-600 mb-4"
              >
                À propos
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.6 }}
                className="font-sans text-5xl md:text-6xl lg:text-7xl text-text-primary mb-8 leading-[1.05] tracking-tight"
              >
                Je n&apos;étais pas avocat.{" "}
                <span className="italic text-forest-600">Je tenais leurs livres.</span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-lg text-text-body leading-relaxed font-sans"
              >
                Pendant des mois, j&apos;ai tenu la comptabilité d&apos;une avocate en droit de la famille. C&apos;est de cette chaise, celle du teneur de livres qui voyait chaque mois où l&apos;argent s&apos;évaporait, que SAFE est né. Je m&apos;appelle Jérémie Tiahou, et voici l&apos;histoire.
              </motion.p>
            </div>
          </div>
        </section>

        {/* Story */}
        <section className="bg-surface-2 sm:border-y border-[0.5px] border-border relative py-20 lg:py-28">
          
          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
            <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
              <div>
                <p className="text-lg font-sans italic text-forest-600 mb-4">
                  Le déclic
                </p>
                <h2 className="font-sans text-3xl md:text-4xl text-text-primary mb-8 leading-tight tracking-tight">
                  Le problème, ce n&apos;était pas l&apos;avocate. C&apos;était le système.
                </h2>
                <div className="space-y-6 text-text-body font-sans leading-relaxed">
                  <p>
                    Elle refusait catégoriquement QuickBooks. Trop complexe, mal adapté à sa pratique. Alors on gérait tout son cabinet autrement : Excel, fiches de temps papier, classeur physique, courriels éparpillés.
                  </p>
                  <p>
                    Le résultat ? Trente minutes pour émettre une seule facture. Toujours du retard. Du temps facturable constamment laissé sur la table.
                  </p>
                  <p>
                    J&apos;ai d&apos;abord cru que c&apos;était un cas isolé. Je me trompais. Une juge me l&apos;a confirmé, elle connaissait plusieurs avocats exactement dans la même situation. J&apos;en ai parlé à deux autres avocates, même tableur, même constat. Un seul mot revenait pour décrire leur quotidien : « infernal ».
                  </p>
                  <p className="text-text-primary font-medium">
                    C&apos;est là que j&apos;ai compris. Le problème n&apos;était pas l&apos;avocate. C&apos;était le système.
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
        <section className="bg-surface sm:border-y border-[0.5px] border-border relative py-20 lg:py-28">
          
          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
            <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
              <div className="lg:max-w-lg">
                <p className="text-lg font-sans italic text-forest-600 mb-4">
                  La mission
                </p>
                <h2 className="font-sans text-3xl md:text-5xl text-text-primary mb-8 leading-tight tracking-tight">
                  Aucun avocat solo ne devrait perdre une heure de son expertise{" "}
                  <span className="italic text-forest-600">sur des tâches que la machine devrait faire à sa place.</span>
                </h2>
                <div className="space-y-5 text-lg text-text-body font-sans leading-relaxed">
                  <p>
                    Depuis août 2025, je construis SAFE : le centre de commande du cabinet d&apos;avocats solo. Un système qui automatise la facturation, la comptabilité et l&apos;administratif des dossiers clients.
                  </p>
                  <p>
                    Les logiciels universels demandent au cabinet de s&apos;adapter à eux. SAFE fait l&apos;inverse, il s&apos;adapte à votre pratique, à vos obligations et à votre façon de facturer. Pour que votre énergie aille à vos clients, pas à la paperasse.
                  </p>
                  <p className="text-text-primary font-medium">
                    Aujourd&apos;hui, j&apos;ouvre une nouvelle étape : je construis SAFE en public. Les avancées, les chiffres, les doutes, les leçons. Si vous êtes avocat solo, ou si l&apos;admin vous freine encore, on est sur le même fil.
                  </p>
                </div>
              </div>

              {/* Animated timeline */}
              <div>
                <StoryTimeline />
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="bg-canvas sm:border-y border-[0.5px] border-border relative py-20 lg:py-28">
          
          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
            <div className="text-center mb-16">
              <p className="text-lg font-sans italic text-forest-600 mb-4">
                Nos valeurs
              </p>
              <h2 className="font-sans text-3xl md:text-4xl text-text-primary tracking-tight">
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
                  className="card-dark group p-8 rounded-safe-md border border-forest-600/10 bg-canvas hover:border-forest-600/30 transition-colors duration-500"
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 180, damping: 20 }}
                    className="w-12 h-12 rounded-safe bg-text-secondary/15 flex items-center justify-center mb-5"
                  >
                    <value.icon className="w-6 h-6 text-forest-600" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-text-primary mb-3 font-sans tracking-tight">
                    {value.title}
                  </h3>
                  <p className="text-text-body leading-relaxed font-sans">
                    {value.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
