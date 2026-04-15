"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Check, ArrowRight, ChevronDown, Shield, Sparkles, Zap, Clock, Lock } from "lucide-react";
import Link from "next/link";
import { Navbar } from "@/components/marketing/Navbar";
import { FinalCTA } from "@/components/marketing/FinalCTA";
import { Footer } from "@/components/marketing/Footer";

/* ───── Animated counter for pricing ───── */
function AnimatedPrice({ value, inView }: { value: number; inView: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const t0 = performance.now();
    function tick(now: number) {
      const p = Math.min((now - t0) / 1200, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.round(value * eased));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [inView, value]);

  return <>{count}</>;
}

/* ───── Animated checkmarks ───── */
function AnimatedCheck({ delay, inView }: { delay: number; inView: boolean }) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={inView ? { scale: 1, opacity: 1 } : {}}
      transition={{ delay, type: "spring", stiffness: 300 }}
    >
      <Check className="w-4 h-4 text-[var(--safe-sage)]" />
    </motion.div>
  );
}

/* ───── Plans — aligned with main page Pricing.tsx ───── */
const PLANS = [
  {
    name: "Solo",
    monthlyPrice: 99,
    annualPrice: 79,
    annualSaving: "240",
    description: "Vous pratiquez seul et voulez dormir tranquille avant l'inspection.",
    features: [
      "1 avocat + 1 adjoint",
      "Dossiers illimités",
      "Facturation conforme B-1 r.5",
      "1 compte en fidéicommis",
      "Audit de conformité de base",
      "Agent IA Finance, 50 requêtes/mois",
      "Échéanciers & alertes",
      "Support par courriel (48h)",
    ],
    popular: false,
    cta: "Faire mon audit gratuit",
    href: "/audit-gratuit",
    icon: Shield,
  },
  {
    name: "Cabinet",
    monthlyPrice: 149,
    annualPrice: 119,
    annualSaving: "360",
    description: "Tout ce qu'il faut pour que votre équipe se concentre sur le droit, pas la paperasse.",
    features: [
      "Jusqu'à 5 utilisateurs",
      "Dossiers illimités",
      "3 comptes en fidéicommis",
      "Rapports financiers avancés",
      "Audit complet + alertes conformité",
      "Agent IA Finance, 200 requêtes/mois",
      "Agent IA Assistant, 100 requêtes/mois",
      "Échéanciers & alertes de cour",
      "Onboarding 1-on-1 (30 min)",
      "Support prioritaire (24h)",
    ],
    popular: true,
    cta: "Faire mon audit gratuit",
    href: "/audit-gratuit",
    icon: Sparkles,
  },
  {
    name: "Cabinet+",
    monthlyPrice: 499,
    annualPrice: 399,
    annualSaving: "1 200",
    description: "Pour les cabinets qui veulent la tranquillité d'esprit totale.",
    features: [
      "Jusqu'à 15 utilisateurs",
      "Comptes en fidéicommis illimités",
      "Rapport pré-inspection automatisé",
      "Agents IA illimités",
      "Intégrations sur mesure",
      "Migration de données complète",
      "Onboarding concierge (3 sessions)",
      "Support téléphone + Slack dédié",
      "SLA garanti",
    ],
    popular: false,
    cta: "Réserver une démo",
    href: "/demo",
    icon: Zap,
  },
];

/* ───── Comparison table ───── */
const comparisonFeatures = [
  { name: "Utilisateurs", solo: "1 avocat + 1 adjoint", cabinet: "Jusqu'à 5", cabinetPlus: "Jusqu'à 15" },
  { name: "Dossiers", solo: "Illimité", cabinet: "Illimité", cabinetPlus: "Illimité" },
  { name: "Comptes fidéicommis", solo: "1", cabinet: "3", cabinetPlus: "Illimité" },
  { name: "Facturation conforme B-1 r.5", solo: true, cabinet: true, cabinetPlus: true },
  { name: "Échéanciers & alertes", solo: true, cabinet: true, cabinetPlus: true },
  { name: "Audit de conformité", solo: "De base", cabinet: "Complet + alertes", cabinetPlus: "Complet + rapport pré-inspection" },
  { name: "Agent IA Finance", solo: "50 req/mois", cabinet: "200 req/mois", cabinetPlus: "Illimité" },
  { name: "Agent IA Assistant", solo: false, cabinet: "100 req/mois", cabinetPlus: "Illimité" },
  { name: "Rapports financiers avancés", solo: false, cabinet: true, cabinetPlus: true },
  { name: "Onboarding", solo: "Self-serve + vidéos", cabinet: "Session 1-on-1 (30 min)", cabinetPlus: "Concierge (3 sessions)" },
  { name: "Migration de données", solo: false, cabinet: false, cabinetPlus: true },
  { name: "Intégrations sur mesure", solo: false, cabinet: false, cabinetPlus: true },
  { name: "SLA garanti", solo: false, cabinet: false, cabinetPlus: true },
  { name: "Support", solo: "Courriel (48h)", cabinet: "Prioritaire (24h)", cabinetPlus: "Téléphone + Slack dédié" },
];

/* ───── FAQ ───── */
const faqs = [
  {
    q: "Comment commencer ?",
    a: "Faites votre audit gratuit en 5 minutes pour évaluer votre cabinet, puis réservez une démo personnalisée avec notre équipe.",
  },
  {
    q: "Quelle est votre garantie ?",
    a: "30 jours satisfait ou remboursé, sans question. Si SAFE ne vous convient pas, on vous rembourse intégralement.",
  },
  {
    q: "Puis-je changer de plan en cours de route ?",
    a: "Absolument. Passez du Solo au Cabinet ou au Cabinet+ à tout moment. La différence est calculée au prorata.",
  },
  {
    q: "Quels modes de paiement acceptez-vous ?",
    a: "Cartes de crédit Visa, Mastercard et American Express. Facturation mensuelle ou annuelle (économisez 20% sur l'annuel).",
  },
  {
    q: "Mes données sont-elles sécurisées ?",
    a: "Toutes les données sont hébergées au Canada (Montréal et Toronto), chiffrées AES-256. Conforme à la Loi 25 sur la protection des renseignements personnels.",
  },
  {
    q: "Que se passe-t-il si j'annule ?",
    a: "Vous conservez l'accès jusqu'à la fin de votre période. Vos données sont exportables en tout temps. Elles vous appartiennent.",
  },
  {
    q: "La migration depuis mon ancien logiciel est-elle incluse ?",
    a: "La migration complète est incluse dans le plan Cabinet+. Pour les plans Solo et Cabinet, nous fournissons des outils d'importation et un guide détaillé.",
  },
  {
    q: "L'IA donne-t-elle des conseils juridiques ?",
    a: "Non, jamais. Les agents IA sont des assistants administratifs entraînés sur les règles du Barreau du Québec. Ils aident à vérifier, classer et organiser, sans jamais se substituer au jugement professionnel.",
  },
];

function FAQItem({ q, a, index }: { q: string; a: string; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className="border-b border-[var(--safe-sage)]/15"
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="text-[var(--safe-white)] font-medium font-sans pr-4">{q}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronDown className="w-5 h-5 text-[var(--safe-sage)] shrink-0" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-[var(--safe-text-muted)] font-sans leading-relaxed">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function TarificationPage() {
  const [annual, setAnnual] = useState(true);
  const cardsRef = useRef<HTMLDivElement>(null);
  const cardsInView = useInView(cardsRef, { once: true, margin: "-80px" });

  return (
    <div className="relative flex flex-col min-h-screen bg-[var(--safe-darkest)] text-[var(--safe-white)] scroll-smooth">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="section-morning relative pt-36 pb-20 lg:pt-44 lg:pb-28 overflow-hidden">
          <div className="landing-grain absolute inset-0 pointer-events-none" />
          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10 text-center">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg font-sans italic text-[var(--safe-sage)] mb-4"
            >
              Tarification
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="font-sans text-4xl md:text-5xl lg:text-7xl text-[var(--safe-white)] mb-6 leading-[1.05] tracking-tight"
            >
              Moins cher qu&apos;une heure de votre temps.{" "}
              <span className="italic text-[var(--safe-sage)]">Rentable dès le jour 1.</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-lg text-[var(--safe-text-muted)] max-w-2xl mx-auto font-sans"
            >
              Pas de frais cachés. Pas d&apos;engagement à long terme. Annulez en tout temps.
              Satisfait ou remboursé 30 jours.
            </motion.p>

            {/* Annual/Monthly toggle */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mt-8 inline-flex items-center gap-3 bg-white/[0.04] border border-white/[0.08] rounded-full p-1.5"
            >
              <button
                onClick={() => setAnnual(false)}
                className={`px-5 py-2 rounded-full text-sm font-medium font-sans transition-all duration-300 ${
                  !annual
                    ? "bg-[var(--safe-sage)] text-[var(--safe-darkest)]"
                    : "text-[var(--safe-text-muted)] hover:text-[var(--safe-white)]"
                }`}
              >
                Mensuel
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`px-5 py-2 rounded-full text-sm font-medium font-sans transition-all duration-300 flex items-center gap-2 ${
                  annual
                    ? "bg-[var(--safe-sage)] text-[var(--safe-darkest)]"
                    : "text-[var(--safe-text-muted)] hover:text-[var(--safe-white)]"
                }`}
              >
                Annuel
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  annual
                    ? "bg-[var(--safe-darkest)]/20 text-[var(--safe-darkest)]"
                    : "bg-emerald-500/20 text-emerald-400"
                }`}>
                  -20%
                </span>
              </button>
            </motion.div>
          </div>
        </section>

        {/* Pricing cards */}
        <section className="section-morning relative py-16" ref={cardsRef}>
          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {PLANS.map((plan, idx) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 30 }}
                  animate={cardsInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: idx * 0.12 }}
                  className={`card-dark relative rounded-safe-md p-6 sm:p-8 flex flex-col ${
                    plan.popular
                      ? "bg-[var(--safe-darkest)] border-2 border-[#8EB69B]/40 shadow-2xl shadow-[var(--safe-accent)]/10 lg:scale-105"
                      : "bg-[var(--safe-darkest)] border border-[#8EB69B]/10"
                  }`}
                >
                  {plan.popular && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={cardsInView ? { opacity: 1, y: 0 } : {}}
                      transition={{ delay: 0.5, type: "spring" }}
                      className="absolute top-0 right-8 -translate-y-1/2 bg-[var(--safe-sage)] text-[var(--safe-darkest)] text-xs font-bold uppercase tracking-wider py-1.5 px-4 rounded-full font-sans"
                    >
                      Le plus populaire
                    </motion.div>
                  )}

                  {/* Plan icon */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={cardsInView ? { scale: 1 } : {}}
                    transition={{ delay: 0.3 + idx * 0.12, type: "spring" }}
                    className="w-10 h-10 rounded-safe bg-[var(--safe-accent)]/15 flex items-center justify-center mb-4"
                  >
                    <plan.icon className="w-5 h-5 text-[var(--safe-sage)]" />
                  </motion.div>

                  <h3 className="text-2xl font-bold text-[var(--safe-white)] mb-2 font-sans tracking-tight">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-[var(--safe-text-muted)] mb-6 font-sans leading-relaxed">
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="mb-2 flex items-end gap-1">
                    <span className="text-4xl sm:text-5xl font-bold text-[var(--safe-white)] font-sans">
                      <AnimatedPrice value={annual ? plan.annualPrice : plan.monthlyPrice} inView={cardsInView} />$
                    </span>
                    <span className="text-[var(--safe-text-muted)] mb-1.5 font-sans">
                      /mois
                    </span>
                  </div>
                  {annual && (
                    <p className="text-xs text-emerald-400 font-sans mb-6">
                      Économisez {plan.annualSaving}$/an
                    </p>
                  )}
                  {!annual && <div className="mb-6" />}

                  {/* Features */}
                  <ul className="space-y-3.5 mb-8 flex-grow">
                    {plan.features.map((feat, fi) => (
                      <li key={feat} className="flex items-start gap-3">
                        <AnimatedCheck delay={0.5 + idx * 0.12 + fi * 0.04} inView={cardsInView} />
                        <span className="text-sm text-[var(--safe-white)]/80 font-sans">
                          {feat}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Link
                    href={plan.href}
                    className={`group w-full py-3 rounded-full font-semibold text-center text-sm transition-all duration-300 flex items-center justify-center gap-2 font-sans ${
                      plan.popular
                        ? "bg-[var(--safe-sage)] text-[var(--safe-darkest)] hover:bg-[var(--safe-lightest)]"
                        : "bg-white/5 text-[var(--safe-white)] hover:bg-white/10 border border-white/10"
                    }`}
                  >
                    {plan.cta}
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Guarantee badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-center"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                <span className="text-sm text-[var(--safe-text-muted)] font-sans">30 jours satisfait ou remboursé</span>
              </div>
              <span className="hidden sm:block text-white/10">|</span>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-400" />
                <span className="text-sm text-[var(--safe-text-muted)] font-sans">Aucun engagement, annulez en 2 clics</span>
              </div>
              <span className="hidden sm:block text-white/10">|</span>
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-400" />
                <span className="text-sm text-[var(--safe-text-muted)] font-sans">Vos données exportables en tout temps</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Comparison table */}
        <section className="section-night relative py-20 lg:py-28">
          <div className="landing-grain absolute inset-0 pointer-events-none" />
          <div className="relative z-10 mx-auto max-w-5xl px-6 lg:px-10">
            <h2 className="font-sans text-3xl md:text-4xl text-[var(--safe-white)] text-center mb-12 tracking-tight">
              Comparer les plans en détail
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[var(--safe-sage)]/30">
                    <th className="py-4 pr-4 text-sm text-[var(--safe-text-muted)] font-sans font-medium">
                      Fonctionnalité
                    </th>
                    <th className="py-4 px-4 text-sm text-[var(--safe-white)] font-sans font-semibold text-center">
                      Solo
                    </th>
                    <th className="py-4 px-4 text-sm text-[var(--safe-sage)] font-sans font-semibold text-center">
                      Cabinet ⭐
                    </th>
                    <th className="py-4 pl-4 text-sm text-[var(--safe-white)] font-sans font-semibold text-center">
                      Cabinet+
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((feat, ri) => (
                    <motion.tr
                      key={feat.name}
                      className="border-b border-[var(--safe-sage)]/15"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: ri * 0.03 }}
                    >
                      <td className="py-3 pr-4 text-sm text-[var(--safe-white)] font-sans">
                        {feat.name}
                      </td>
                      {(["solo", "cabinet", "cabinetPlus"] as const).map((plan) => {
                        const val = feat[plan];
                        return (
                          <td key={plan} className="py-3 px-4 text-center">
                            {typeof val === "boolean" ? (
                              val ? (
                                <Check className="w-4 h-4 text-[var(--safe-sage)] mx-auto" />
                              ) : (
                                <span className="text-[var(--safe-text-muted)] opacity-40">—</span>
                              )
                            ) : (
                              <span className="text-sm text-[var(--safe-text-muted)] font-sans">
                                {val}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="section-night relative py-20 lg:py-28">
          <div className="landing-grain absolute inset-0 pointer-events-none" />
          <div className="relative z-10 mx-auto max-w-3xl px-6 lg:px-10">
            <div className="text-center mb-12">
              <p className="text-lg font-sans italic text-[var(--safe-sage)] mb-4">
                Questions fréquentes
              </p>
              <h2 className="font-sans text-3xl md:text-4xl text-[var(--safe-white)] tracking-tight">
                Tout ce que vous devez savoir.
              </h2>
            </div>
            <div>
              {faqs.map((faq, i) => (
                <FAQItem key={faq.q} q={faq.q} a={faq.a} index={i} />
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
