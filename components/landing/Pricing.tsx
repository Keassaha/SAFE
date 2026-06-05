"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const plans = [
  {
    name: "Solo",
    price: "99",
    description: "1 avocat avec ou sans adjointe, toute discipline.",
    features: [
      "Configuration adaptée à votre pratique",
      "Clients et dossiers illimités",
      "Facturation forfait, horaire ou mixte",
      "Comptabilité fidéicommis intégrée",
      "Support standard",
    ],
  },
  {
    name: "Cabinet",
    price: "149",
    description: "2 à 5 avocats, équipes mixtes, multi-disciplines.",
    popular: true,
    features: [
      "Tout le palier Solo",
      "Multi-utilisateurs avec rôles",
      "Portail client",
      "Time tracking complet",
      "Rapports avancés",
      "Support email et chat",
    ],
  },
  {
    name: "Cabinet+",
    price: "Sur devis",
    description: "6 avocats et plus, multi-bureaux, workflows hors cadre.",
    features: [
      "Tout le palier Cabinet",
      "Pipeline d'onboarding 3 phases",
      "Configuration sur mesure",
      "Formation équipe",
      "SSO et intégrations spécialisées",
      "Support prioritaire avec SLA",
    ],
  },
];

export function Pricing() {
  return (
    <section id="tarifs" className="py-24 relative overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="font-sans text-sm font-semibold text-gold-400 uppercase tracking-widest mb-3">
            Tarifs
          </p>
          <h2 className="font-sans text-3xl md:text-4xl font-semibold text-white mb-4 tracking-[-0.04em]">
            Tarifs simples et transparents
          </h2>
          <p className="font-sans text-lg text-white/60 max-w-2xl mx-auto">
            Choisissez le forfait adapt&eacute; &agrave; la taille de votre cabinet. Sans frais cach&eacute;s.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative rounded-safe-md p-8 backdrop-blur-sm ${
                plan.popular
                  ? "bg-white/15 border-2 border-gold-500/60"
                  : "bg-white/[0.07] border border-white/15"
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Populaire
                </span>
              )}

              <h3 className="text-xl font-semibold text-white mb-2 tracking-tight">{plan.name}</h3>
              <p className="text-sm text-white/50 mb-6">{plan.description}</p>

              <div className="mb-6">
                <span className="text-4xl font-bold text-white">
                  {plan.price === "Sur devis" ? plan.price : `${plan.price} $`}
                </span>
                {plan.price === "Sur devis" ? null : (
                  <span className="text-white/50 text-sm"> / mois</span>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-white/65">
                    <Check className="w-4 h-4 text-gold-400 mt-0.5 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Link href="/connexion?tab=signup" tabIndex={-1}>
                  <Button
                    variant={plan.popular ? "landing-primary" : "landing-secondary"}
                    className="w-full text-sm"
                  >
                    Commencer
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
