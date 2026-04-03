"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { Check, ArrowRight, ChevronDown, HelpCircle, Sparkles, Shield, Zap } from "lucide-react";
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

/* ───── Animated checkmarks in feature lists ───── */
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

const PLANS = [
  {
    name: "Solo",
    price: 149,
    period: "/mois",
    description: "Parfait pour les avocats pratiquant seuls en droit familial.",
    features: [
      "1 avocat",
      "1 utilisateur adjoint",
      "Dossiers illimités",
      "Facturation conforme B-1 r.5",
      "Comptes en fidéicommis",
      "Échéanciers & alertes",
      "Support par courriel",
    ],
    popular: false,
    cta: "Commencer l'essai gratuit",
    href: "/demo",
    icon: Shield,
  },
  {
    name: "Cabinet",
    price: 349,
    period: "/mois",
    description: "L'outil complet pour les petites équipes juridiques.",
    features: [
      "Jusqu'à 5 avocats",
      "3 adjoints inclus",
      "Dossiers illimités",
      "Rapports financiers avancés",
      "Support prioritaire",
      "Employés virtuels (bêta)",
      "Échéanciers & alertes",
      "Export comptable",
    ],
    popular: true,
    cta: "Commencer l'essai gratuit",
    href: "/demo",
    icon: Sparkles,
  },
  {
    name: "Sur mesure",
    price: 0,
    period: "",
    description: "Pour les cabinets de plus de 5 avocats ou besoins spécifiques.",
    features: [
      "Avocats et adjoints illimités",
      "Intégrations sur mesure",
      "Migration de données complète",
      "Gestionnaire de compte dédié",
      "Formation sur site",
      "SLA garanti",
      "Personnalisation de l'interface",
      "API dédiée",
    ],
    popular: false,
    cta: "Nous contacter",
    href: "/contact",
    icon: Zap,
  },
];

const comparisonFeatures = [
  { name: "Avocats", solo: "1", cabinet: "Jusqu'à 5", custom: "Illimité" },
  { name: "Adjoints", solo: "1", cabinet: "3", custom: "Illimité" },
  { name: "Dossiers", solo: "Illimité", cabinet: "Illimité", custom: "Illimité" },
  { name: "Facturation B-1 r.5", solo: true, cabinet: true, custom: true },
  { name: "Fidéicommis", solo: true, cabinet: true, custom: true },
  { name: "Échéanciers", solo: true, cabinet: true, custom: true },
  { name: "Rapports avancés", solo: false, cabinet: true, custom: true },
  { name: "Employés virtuels", solo: false, cabinet: true, custom: true },
  { name: "Export comptable", solo: false, cabinet: true, custom: true },
  { name: "Migration de données", solo: false, cabinet: false, custom: true },
  { name: "Formation sur site", solo: false, cabinet: false, custom: true },
  { name: "SLA garanti", solo: false, cabinet: false, custom: true },
  { name: "API dédiée", solo: false, cabinet: false, custom: true },
  { name: "Support", solo: "Courriel", cabinet: "Prioritaire", custom: "Dédié" },
];

const faqs = [
  {
    q: "Y a-t-il un essai gratuit ?",
    a: "Oui, nous offrons un essai gratuit de 14 jours sans carte de crédit requise. Vous pouvez explorer toutes les fonctionnalités du plan Cabinet pendant cette période.",
  },
  {
    q: "Puis-je changer de plan en cours de route ?",
    a: "Absolument. Vous pouvez passer du plan Solo au plan Cabinet à tout moment. La différence de prix est calculée au prorata pour le mois en cours.",
  },
  {
    q: "Quels modes de paiement acceptez-vous ?",
    a: "Nous acceptons les cartes de crédit Visa, Mastercard et American Express. Pour le plan Sur mesure, nous offrons aussi la facturation mensuelle par virement.",
  },
  {
    q: "Mes données sont-elles sécurisées ?",
    a: "Toutes les données sont hébergées au Canada (Montréal et Toronto), chiffrées AES-256 au repos et en transit. Nous sommes conformes à la Loi 25 sur la protection des renseignements personnels.",
  },
  {
    q: "Que se passe-t-il si j'annule mon abonnement ?",
    a: "Vous conservez l'accès jusqu'à la fin de votre période de facturation. Vos données sont archivées pendant 90 jours et peuvent être exportées à tout moment.",
  },
  {
    q: "La migration depuis mon ancien logiciel est-elle incluse ?",
    a: "La migration assistée est incluse dans le plan Sur mesure. Pour les plans Solo et Cabinet, nous fournissons des outils d'importation et un guide détaillé.",
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
        <span className="text-[var(--safe-white)] font-medium font-jakarta pr-4">{q}</span>
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
            <p className="pb-5 text-[var(--safe-text-muted)] font-jakarta leading-relaxed">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function TarificationPage() {
  const cardsRef = useRef<HTMLDivElement>(null);
  const cardsInView = useInView(cardsRef, { once: true, margin: "-80px" });

  return (
    <div className="relative flex flex-col min-h-screen bg-[var(--safe-darkest)] text-[var(--safe-white)] scroll-smooth">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="section-light relative pt-36 pb-20 lg:pt-44 lg:pb-28 overflow-hidden">
          <div className="landing-grain absolute inset-0 pointer-events-none" />
          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10 text-center">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-lg font-instrument italic text-[var(--safe-sage)] mb-4"
            >
              Tarification
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="font-instrument text-5xl md:text-6xl lg:text-7xl text-[var(--safe-white)] mb-6 leading-[1.05] tracking-tight"
            >
              Un investissement{" "}
              <span className="italic text-[var(--safe-sage)]">rentable</span> dès le
              premier mois.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-lg text-[var(--safe-text-muted)] max-w-2xl mx-auto font-jakarta"
            >
              Pas de frais cachés. Pas d&apos;engagement à long terme. Annulez en tout temps.
            </motion.p>
          </div>
        </section>

        {/* Pricing cards */}
        <section className="section-light relative py-4" ref={cardsRef}>
          <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {PLANS.map((plan, idx) => (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 30 }}
                  animate={cardsInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: idx * 0.12 }}
                  className={`card-dark relative rounded-2xl p-8 flex flex-col ${
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
                      className="absolute top-0 right-8 -translate-y-1/2 bg-[var(--safe-sage)] text-[var(--safe-darkest)] text-xs font-bold uppercase tracking-wider py-1.5 px-4 rounded-full font-jakarta"
                    >
                      Populaire
                    </motion.div>
                  )}

                  {/* Plan icon */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={cardsInView ? { scale: 1 } : {}}
                    transition={{ delay: 0.3 + idx * 0.12, type: "spring" }}
                    className="w-10 h-10 rounded-xl bg-[var(--safe-accent)]/15 flex items-center justify-center mb-4"
                  >
                    <plan.icon className="w-5 h-5 text-[var(--safe-sage)]" />
                  </motion.div>

                  <h3 className="text-2xl font-bold text-[var(--safe-white)] mb-2 font-jakarta">
                    {plan.name}
                  </h3>
                  <p className="text-sm text-[var(--safe-text-muted)] mb-6 font-jakarta">
                    {plan.description}
                  </p>
                  <div className="mb-8 flex items-end gap-1">
                    {plan.price === 0 ? (
                      <span className="text-3xl font-bold text-[var(--safe-white)] font-jakarta">
                        Sur devis
                      </span>
                    ) : (
                      <>
                        <span className="text-5xl font-bold text-[var(--safe-white)] font-jakarta">
                          <AnimatedPrice value={plan.price} inView={cardsInView} />$
                        </span>
                        <span className="text-[var(--safe-text-muted)] mb-1.5 font-jakarta">
                          {plan.period}
                        </span>
                      </>
                    )}
                  </div>
                  <ul className="space-y-3.5 mb-8 flex-grow">
                    {plan.features.map((feat, fi) => (
                      <li key={feat} className="flex items-start gap-3">
                        <AnimatedCheck delay={0.5 + idx * 0.12 + fi * 0.06} inView={cardsInView} />
                        <span className="text-sm text-[var(--safe-white)]/80 font-jakarta">
                          {feat}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={plan.href}
                    className={`group w-full py-3.5 rounded-full font-semibold text-center text-sm transition-all duration-300 flex items-center justify-center gap-2 font-jakarta ${
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
          </div>
        </section>

        {/* Comparison table */}
        <section className="section-afternoon relative py-20 lg:py-28">
          <div className="landing-grain absolute inset-0 pointer-events-none" />
          <div className="relative z-10 mx-auto max-w-5xl px-6 lg:px-10">
            <h2 className="font-instrument text-3xl md:text-4xl text-[var(--safe-white)] text-center mb-12">
              Comparer les plans en détail
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[var(--safe-sage)]/30">
                    <th className="py-4 pr-4 text-sm text-[var(--safe-text-muted)] font-jakarta font-medium">
                      Fonctionnalité
                    </th>
                    <th className="py-4 px-4 text-sm text-[var(--safe-white)] font-jakarta font-semibold text-center">
                      Solo
                    </th>
                    <th className="py-4 px-4 text-sm text-[var(--safe-sage)] font-jakarta font-semibold text-center">
                      Cabinet
                    </th>
                    <th className="py-4 pl-4 text-sm text-[var(--safe-white)] font-jakarta font-semibold text-center">
                      Sur mesure
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
                      <td className="py-3.5 pr-4 text-sm text-[var(--safe-white)] font-jakarta">
                        {feat.name}
                      </td>
                      {(["solo", "cabinet", "custom"] as const).map((plan) => {
                        const val = feat[plan];
                        return (
                          <td key={plan} className="py-3.5 px-4 text-center">
                            {typeof val === "boolean" ? (
                              val ? (
                                <Check className="w-4 h-4 text-[var(--safe-sage)] mx-auto" />
                              ) : (
                                <span className="text-[var(--safe-text-muted)] opacity-40">—</span>
                              )
                            ) : (
                              <span className="text-sm text-[var(--safe-text-muted)] font-jakarta">
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
        <section className="section-dusk relative py-20 lg:py-28">
          <div className="landing-grain absolute inset-0 pointer-events-none" />
          <div className="relative z-10 mx-auto max-w-3xl px-6 lg:px-10">
            <div className="text-center mb-12">
              <p className="text-lg font-instrument italic text-[var(--safe-sage)] mb-4">
                Questions fréquentes
              </p>
              <h2 className="font-instrument text-3xl md:text-4xl text-[var(--safe-white)]">
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
