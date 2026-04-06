"use client";

import { useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Calendar, Clock, Shield, Users, ArrowRight, CheckCircle2, Play, Monitor, Smartphone } from "lucide-react";
import { Navbar } from "@/components/marketing/Navbar";
import { Footer } from "@/components/marketing/Footer";

/* ───── Animated demo preview illustration ───── */
function DemoPreview() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <div ref={ref} className="relative">
      {/* Desktop mockup */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.5, duration: 0.6 }}
        className="rounded-safe border border-white/5 bg-[var(--safe-dark)]/50 overflow-hidden"
      >
        {/* Browser chrome */}
        <div className="flex items-center gap-1.5 px-3 py-2 bg-[var(--safe-darkest)]/50 border-b border-white/5">
          <div className="w-2 h-2 rounded-full bg-[#FF5F57]" />
          <div className="w-2 h-2 rounded-full bg-[#FEBC2E]" />
          <div className="w-2 h-2 rounded-full bg-[#28C840]" />
          <div className="flex-1 flex justify-center">
            <span className="text-xs text-[var(--safe-text-muted)] font-mono">app.safe-juridique.ca</span>
          </div>
        </div>

        {/* Dashboard preview content */}
        <div className="p-3 aspect-[16/10] relative">
          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.8 }}
            className="absolute left-3 top-3 bottom-3 w-16 rounded-safe-sm bg-white/[0.03] border border-white/[0.04] p-2"
          >
            <div className="w-4 h-4 rounded-safe-sm bg-[var(--safe-accent)]/20 flex items-center justify-center mb-3">
              <Shield className="w-2.5 h-2.5 text-[var(--safe-sage)]" />
            </div>
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={inView ? { opacity: 1 } : {}}
                transition={{ delay: 1.0 + i * 0.08 }}
                className={`h-1.5 rounded-full mb-2 ${i === 2 ? "bg-[var(--safe-sage)]/30 w-10" : "bg-white/5 w-8"}`}
              />
            ))}
          </motion.div>

          {/* Main content area */}
          <div className="ml-20 space-y-2">
            {/* KPI cards */}
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { label: "Dossiers", value: "47", color: "text-[var(--safe-sage)]" },
                { label: "Revenus", value: "12 480 $", color: "text-[var(--safe-white)]" },
                { label: "Conformité", value: "98%", color: "text-[var(--safe-sage)]" },
              ].map((kpi, i) => (
                <motion.div
                  key={kpi.label}
                  initial={{ opacity: 0, y: 5 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 1.0 + i * 0.1 }}
                  className="rounded-safe-sm bg-white/[0.03] border border-white/[0.04] p-1.5"
                >
                  <div className="text-xs text-[var(--safe-text-muted)] font-sans">{kpi.label}</div>
                  <div className={`text-xs font-bold font-sans ${kpi.color}`}>{kpi.value}</div>
                </motion.div>
              ))}
            </div>

            {/* Chart area */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 1.3 }}
              className="rounded-safe-sm bg-white/[0.03] border border-white/[0.04] p-2 h-12"
            >
              <div className="flex items-end gap-[2px] h-full">
                {[35, 55, 42, 70, 52, 85, 65, 78, 90, 48, 72, 95].map((h, i) => (
                  <motion.div
                    key={i}
                    className="flex-1 rounded-t-[1px]"
                    style={{ background: `rgba(142, 182, 155, ${0.2 + (h / 100) * 0.4})` }}
                    initial={{ height: 0 }}
                    animate={inView ? { height: `${h}%` } : {}}
                    transition={{ delay: 1.5 + i * 0.04, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  />
                ))}
              </div>
            </motion.div>
          </div>

          {/* Play button overlay */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 2.0, type: "spring" }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <motion.div
              animate={inView ? { scale: [1, 1.05, 1] } : {}}
              transition={{ delay: 2.5, duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-12 h-12 rounded-full bg-[var(--safe-sage)]/20 border border-[var(--safe-sage)]/30 flex items-center justify-center backdrop-blur-sm"
            >
              <Play className="w-5 h-5 text-[var(--safe-sage)] ml-0.5" />
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Device indicators */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 1.8 }}
        className="flex items-center justify-center gap-4 mt-4"
      >
        <div className="flex items-center gap-1.5 text-xs text-[var(--safe-text-muted)] font-sans">
          <Monitor className="w-3.5 h-3.5" /> Desktop
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[var(--safe-text-muted)] font-sans">
          <Smartphone className="w-3.5 h-3.5" /> Mobile
        </div>
      </motion.div>
    </div>
  );
}

const valuePoints = [
  {
    icon: Clock,
    title: "30 minutes",
    description: "Un appel court et ciblé pour comprendre vos besoins.",
  },
  {
    icon: Shield,
    title: "Sans engagement",
    description: "Aucune obligation. Explorez SAFE à votre rythme.",
  },
  {
    icon: Users,
    title: "Personnalisé",
    description: "Une démo adaptée à la taille et aux besoins de votre cabinet.",
  },
];

export default function DemoPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="relative flex flex-col min-h-screen bg-[var(--safe-darkest)] text-[var(--safe-white)] scroll-smooth">
      <Navbar />
      <main className="flex-1">
        <section className="relative pt-36 pb-20 lg:pt-44 lg:pb-28 bg-[var(--safe-darkest)] overflow-hidden">
          <div className="landing-grain absolute inset-0 pointer-events-none" />
          <div className="absolute inset-0 landing-grid opacity-20 pointer-events-none" />

          {/* Background glow */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[var(--safe-accent)] opacity-10 rounded-full blur-[120px] pointer-events-none" />

          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
            <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
              {/* Left — content */}
              <div>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-lg font-sans italic text-[var(--safe-sage)] mb-4"
                >
                  Démo
                </motion.p>
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.6 }}
                  className="font-sans text-5xl md:text-6xl text-[var(--safe-white)] mb-6 leading-[1.05] tracking-tight"
                >
                  Voyez SAFE{" "}
                  <span className="italic text-[var(--safe-sage)]">en action</span>.
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="text-lg text-[var(--safe-text-muted)] leading-relaxed font-sans mb-8"
                >
                  Réservez un appel découverte gratuit de 30 minutes. Nous vous montrerons
                  comment SAFE peut transformer la gestion de votre cabinet.
                </motion.p>

                {/* Animated demo preview */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mb-10"
                >
                  <DemoPreview />
                </motion.div>

                {/* Value points */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.6 }}
                  className="space-y-5"
                >
                  {valuePoints.map((point, i) => (
                    <motion.div
                      key={point.title}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      className="flex items-start gap-4"
                    >
                      <motion.div
                        whileHover={{ scale: 1.03 }}
                        className="w-11 h-11 rounded-safe bg-[var(--safe-accent)]/15 flex items-center justify-center shrink-0"
                      >
                        <point.icon className="w-5 h-5 text-[var(--safe-sage)]" />
                      </motion.div>
                      <div>
                        <h3 className="text-base font-semibold text-[var(--safe-white)] font-sans tracking-tight">
                          {point.title}
                        </h3>
                        <p className="text-sm text-[var(--safe-text-muted)] font-sans">
                          {point.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                {/* What to expect */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.6 }}
                  className="mt-10 p-6 rounded-safe-md border border-white/5 bg-[var(--safe-dark)]/50"
                >
                  <h3 className="text-base font-semibold text-[var(--safe-white)] mb-4 font-sans tracking-tight">
                    Ce que vous verrez pendant la démo :
                  </h3>
                  <ul className="space-y-2.5">
                    {[
                      "Création et suivi d'un dossier familial complet",
                      "Facturation conforme B-1 r.5 avec calcul automatique TPS/TVQ",
                      "Gestion des comptes en fidéicommis",
                      "Tableau de bord et rapports financiers",
                    ].map((item, i) => (
                      <motion.li
                        key={item}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.9 + i * 0.08 }}
                        className="flex items-start gap-3"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[var(--safe-sage)] shrink-0 mt-0.5" />
                        <span className="text-sm text-[var(--safe-text-muted)] font-sans">
                          {item}
                        </span>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              </div>

              {/* Right — form */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.7 }}
              >
                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="rounded-safe-md border border-[var(--safe-sage)]/20 bg-[var(--safe-dark)]/50 p-10 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                      className="w-16 h-16 rounded-full bg-[var(--safe-sage)]/20 flex items-center justify-center mx-auto mb-6"
                    >
                      <Calendar className="w-7 h-7 text-[var(--safe-sage)]" />
                    </motion.div>
                    <h3 className="text-2xl font-bold text-[var(--safe-white)] mb-3 font-sans tracking-tight">
                      Demande envoyée !
                    </h3>
                    <p className="text-[var(--safe-text-muted)] font-sans mb-2">
                      Nous vous contacterons dans les 24 heures pour confirmer votre créneau.
                    </p>
                    <p className="text-sm text-[var(--safe-text-muted)] font-sans">
                      Vérifiez votre boîte courriel (et vos indésirables).
                    </p>
                  </motion.div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setSubmitted(true);
                    }}
                    className="rounded-safe-md border border-white/5 bg-[var(--safe-dark)]/50 p-8 space-y-5"
                  >
                    <div className="text-center mb-2">
                      <h2 className="text-xl font-bold text-[var(--safe-white)] font-sans tracking-tight">
                        Réserver votre démo
                      </h2>
                      <p className="text-sm text-[var(--safe-text-muted)] font-sans mt-1">
                        Remplissez le formulaire et nous vous contacterons rapidement.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm text-[var(--safe-sage)] mb-2 font-sans">
                          Prénom
                        </label>
                        <input
                          type="text"
                          required
                          className="w-full px-4 py-3 rounded-safe bg-[var(--safe-darkest)]/50 border border-white/10 text-[var(--safe-white)] placeholder-[var(--safe-text-muted)] focus:border-[var(--safe-sage)]/40 focus:outline-none transition-colors font-sans text-sm"
                          placeholder="Prénom"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-[var(--safe-sage)] mb-2 font-sans">
                          Nom
                        </label>
                        <input
                          type="text"
                          required
                          className="w-full px-4 py-3 rounded-safe bg-[var(--safe-darkest)]/50 border border-white/10 text-[var(--safe-white)] placeholder-[var(--safe-text-muted)] focus:border-[var(--safe-sage)]/40 focus:outline-none transition-colors font-sans text-sm"
                          placeholder="Nom"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-[var(--safe-sage)] mb-2 font-sans">
                        Courriel professionnel
                      </label>
                      <input
                        type="email"
                        required
                        className="w-full px-4 py-3 rounded-safe bg-[var(--safe-darkest)]/50 border border-white/10 text-[var(--safe-white)] placeholder-[var(--safe-text-muted)] focus:border-[var(--safe-sage)]/40 focus:outline-none transition-colors font-sans text-sm"
                        placeholder="courriel@cabinet.ca"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm text-[var(--safe-sage)] mb-2 font-sans">
                          Cabinet
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-3 rounded-safe bg-[var(--safe-darkest)]/50 border border-white/10 text-[var(--safe-white)] placeholder-[var(--safe-text-muted)] focus:border-[var(--safe-sage)]/40 focus:outline-none transition-colors font-sans text-sm"
                          placeholder="Nom du cabinet"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-[var(--safe-sage)] mb-2 font-sans">
                          Nombre d&apos;avocats
                        </label>
                        <select className="w-full px-4 py-3 rounded-safe bg-[var(--safe-darkest)]/50 border border-white/10 text-[var(--safe-white)] focus:border-[var(--safe-sage)]/40 focus:outline-none transition-colors font-sans text-sm">
                          <option value="">Sélectionnez</option>
                          <option value="1">1 (solo)</option>
                          <option value="2-5">2 à 5</option>
                          <option value="6-10">6 à 10</option>
                          <option value="10+">Plus de 10</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-[var(--safe-sage)] mb-2 font-sans">
                        Comment avez-vous entendu parler de SAFE ?
                      </label>
                      <select className="w-full px-4 py-3 rounded-safe bg-[var(--safe-darkest)]/50 border border-white/10 text-[var(--safe-white)] focus:border-[var(--safe-sage)]/40 focus:outline-none transition-colors font-sans text-sm">
                        <option value="">Sélectionnez</option>
                        <option value="barreau">Formation du Barreau</option>
                        <option value="collegue">Recommandation d&apos;un confrère</option>
                        <option value="recherche">Recherche Google</option>
                        <option value="linkedin">LinkedIn</option>
                        <option value="autre">Autre</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="group w-full py-3 rounded-full font-semibold text-sm bg-[var(--safe-accent)] text-[var(--safe-lightest)] hover:bg-[var(--safe-sage)] hover:text-[var(--safe-darkest)] transition-all duration-300 flex items-center justify-center gap-2 font-sans mt-2"
                    >
                      Réserver ma démo gratuite
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </button>

                    <p className="text-xs text-center text-[var(--safe-text-muted)] font-sans">
                      En soumettant ce formulaire, vous acceptez notre politique de
                      confidentialité. Aucun spam, promis.
                    </p>
                  </form>
                )}
              </motion.div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
