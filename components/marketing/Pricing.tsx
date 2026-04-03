"use client";

import { motion } from "framer-motion";
import { Check, ArrowRight } from "lucide-react";
import Link from "next/link";

const PLANS = [
  {
    name: "Solo",
    price: "149",
    period: "/mois",
    description: "Parfait pour les avocats pratiquant seuls en droit familial.",
    features: [
      "1 avocat",
      "1 utilisateur adjoint",
      "Dossiers illimités",
      "Facturation conforme B-1 r.5",
      "Comptes en fidéicommis",
      "Support par courriel",
    ],
    popular: false,
    cta: "Commencer l'essai gratuit",
    href: "/demo",
  },
  {
    name: "Cabinet",
    price: "349",
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
    ],
    popular: true,
    cta: "Commencer l'essai gratuit",
    href: "/demo",
  },
  {
    name: "Sur mesure",
    price: "Sur devis",
    period: "",
    description: "Pour les cabinets de plus de 5 avocats ou besoins spécifiques.",
    features: [
      "Avocats et adjoints illimités",
      "Intégrations sur mesure",
      "Migration de données complète",
      "Gestionnaire de compte dédié",
      "Formation sur site",
      "SLA garanti",
    ],
    popular: false,
    cta: "Nous contacter",
    href: "/contact",
  },
];

export function Pricing() {
  return (
    <section className="section-night relative py-28 lg:py-36">
      <div className="landing-grain absolute inset-0 pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-10">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-lg font-instrument italic text-[var(--safe-sage)] mb-4"
          >
            Tarification
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-instrument text-4xl md:text-5xl text-[var(--safe-white)] mb-6 leading-tight tracking-tight"
          >
            Un investissement rentable dès le premier mois.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-lg text-[var(--safe-text-muted)] leading-relaxed font-jakarta"
          >
            Pas de frais cachés. Pas d&apos;engagement à long terme. Annulez en tout temps.
          </motion.p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {PLANS.map((plan, idx) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: idx * 0.12 }}
              className={`card-dark relative rounded-2xl p-8 flex flex-col ${
                plan.popular
                  ? "bg-[var(--safe-darkest)] border-2 border-[#8EB69B]/40 shadow-2xl shadow-[var(--safe-accent)]/10 scale-[1.02] lg:scale-105"
                  : "bg-[var(--safe-dark)] border border-[#051F20]/10 hover:border-[#8EB69B]/20 transition-colors duration-300"
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-8 -translate-y-1/2 bg-[var(--safe-sage)] text-[var(--safe-darkest)] text-xs font-bold uppercase tracking-wider py-1.5 px-4 rounded-full font-jakarta">
                  Populaire
                </div>
              )}

              <h3 className="text-2xl font-bold text-[var(--safe-white)] mb-2 font-jakarta">
                {plan.name}
              </h3>
              <p className="text-sm text-[var(--safe-text-muted)] mb-6 font-jakarta">
                {plan.description}
              </p>

              {/* Price */}
              <div className="mb-8 flex items-end gap-1">
                {plan.price === "Sur devis" ? (
                  <span className="text-3xl font-bold text-[var(--safe-white)] font-jakarta">
                    {plan.price}
                  </span>
                ) : (
                  <>
                    <span className="text-5xl font-bold text-[var(--safe-white)] font-jakarta">
                      {plan.price}$
                    </span>
                    <span className="text-[var(--safe-text-muted)] mb-1.5 font-jakarta">
                      {plan.period}
                    </span>
                  </>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3.5 mb-8 flex-grow">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-[var(--safe-sage)] shrink-0 mt-0.5" />
                    <span className="text-sm text-[var(--safe-white)]/80 font-jakarta">
                      {feat}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link
                href={plan.href}
                className={`group w-full py-3.5 rounded-full font-semibold text-center text-sm transition-all duration-300 flex items-center justify-center gap-2 font-jakarta ${
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
      </div>
    </section>
  );
}
