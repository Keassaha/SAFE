"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Check, ArrowRight, Shield } from "lucide-react";
import Link from "next/link";

const PLANS = [
  {
    name: "Solo",
    monthlyPrice: "79",
    annualPrice: "63",
    annualSaving: "192",
    subtitle: "1 utilisateur",
    description: "Vous pratiquez seul et voulez dormir tranquille avant l'inspection du Barreau.",
    features: [
      "1 utilisateur (avocat)",
      "Dossiers clients illimités",
      "Facturation conforme (Barreau provincial)",
      "1 compte en fidéicommis",
      "Conformité Loi 25 + PIPEDA",
      "Alertes de conformité Barreau",
      "Échéanciers & alertes judiciaires",
      "Support par courriel (48h)",
    ],
    popular: false,
    cta: "Essai gratuit 14 jours",
    href: "/audit-onboarding",
  },
  {
    name: "Cabinet",
    monthlyPrice: "249",
    annualPrice: "199",
    annualSaving: "600",
    subtitle: "2 à 5 utilisateurs",
    description: "Toute l'équipe sur la même plateforme — sans paperasse, sans risque de non-conformité.",
    features: [
      "2 à 5 utilisateurs inclus",
      "Dossiers clients illimités",
      "Comptes en fidéicommis illimités",
      "Audit complet + rapports pré-inspection",
      "Conformité Loi 25 + PIPEDA + FINTRAC",
      "Migration de données offerte",
      "Onboarding personnalisé (1 session)",
      "Support prioritaire (24h)",
    ],
    popular: true,
    cta: "Essai gratuit 14 jours",
    href: "/audit-onboarding",
  },
  {
    name: "Cabinet+",
    monthlyPrice: "449",
    annualPrice: "359",
    annualSaving: "1 080",
    subtitle: "6 à 15 utilisateurs",
    description: "Pour les cabinets établis qui exigent un support premium et une conformité blindée.",
    features: [
      "6 à 15 utilisateurs inclus",
      "Tout ce qui est dans Cabinet",
      "Rapport pré-inspection certifié (tous barreaux)",
      "Conformité multi-provinciale complète",
      "Onboarding personnalisé (3 sessions)",
      "Support téléphone dédié + Slack privé",
      "Template kit conformité complet",
      "Garantie conformité 90 jours",
    ],
    popular: false,
    cta: "Essai gratuit 14 jours",
    href: "/audit-onboarding",
  },
];

export function Pricing() {
  const [annual, setAnnual] = useState(true);

  return (
    <section className="section-night relative py-16 sm:py-28 lg:py-36">
      <div className="landing-grain absolute inset-0 pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-20">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-lg font-sans italic text-[var(--safe-sage)] mb-4"
          >
            Tarification
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-sans text-3xl sm:text-4xl md:text-5xl text-[var(--safe-white)] mb-6 leading-tight tracking-tight"
          >
            Moins cher qu&apos;une heure de votre temps.{" "}
            <span className="italic text-[var(--safe-sage)]">Rentable dès le jour 1.</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-base sm:text-lg text-[var(--safe-text-muted)] leading-relaxed font-sans"
          >
            Pas de frais cachés. Pas d&apos;engagement à long terme. Annulez en tout temps.
            Satisfait ou remboursé 30 jours.
          </motion.p>

          {/* Annual/Monthly toggle */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mt-8 inline-flex items-center gap-3 bg-white/[0.04] border border-white/[0.08] rounded-full p-1.5"
          >
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-full text-sm font-medium font-sans transition-all duration-300 ${
                !annual
                  ? "bg-[var(--safe-sage)] text-[var(--safe-darkest)]"
                  : "text-[var(--safe-text-muted)] hover:text-white"
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-5 py-2 rounded-full text-sm font-medium font-sans transition-all duration-300 flex items-center gap-2 ${
                annual
                  ? "bg-[var(--safe-sage)] text-[var(--safe-darkest)]"
                  : "text-[var(--safe-text-muted)] hover:text-white"
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

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-6xl mx-auto">
          {PLANS.map((plan, idx) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: idx * 0.12 }}
              className={`card-dark relative rounded-safe-md p-5 sm:p-8 flex flex-col ${
                plan.popular
                  ? "bg-[var(--safe-darkest)] border-2 border-[#8EB69B]/40 shadow-2xl shadow-[var(--safe-accent)]/10 md:-my-2"
                  : "bg-[var(--safe-dark)] border border-[#051F20]/10 hover:border-[#8EB69B]/20 transition-colors duration-300"
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-8 -translate-y-1/2 bg-[var(--safe-sage)] text-[var(--safe-darkest)] text-xs font-bold uppercase tracking-wider py-1.5 px-4 rounded-full font-sans">
                  Le plus populaire
                </div>
              )}

              <h3 className="text-2xl font-bold text-[var(--safe-white)] mb-1 font-sans tracking-tight">
                {plan.name}
              </h3>
              <p className="text-xs text-[var(--safe-sage)] font-sans font-medium mb-3">
                {plan.subtitle}
              </p>
              <p className="text-sm text-[var(--safe-text-muted)] mb-6 font-sans leading-relaxed">
                {plan.description}
              </p>

              {/* Price */}
              <div className="mb-2 flex items-end gap-1">
                <span className="text-4xl sm:text-5xl font-bold text-[var(--safe-white)] font-sans">
                  {annual ? plan.annualPrice : plan.monthlyPrice}$
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
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-[var(--safe-sage)] shrink-0 mt-0.5" />
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
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Guarantee badge */}
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
          <span className="text-sm text-[var(--safe-text-muted)] font-sans">Aucun engagement — annulez en 2 clics</span>
          <span className="hidden sm:block text-white/10">|</span>
          <span className="text-sm text-[var(--safe-text-muted)] font-sans">Vos données exportables en tout temps</span>
        </motion.div>
      </div>
    </section>
  );
}
