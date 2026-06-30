"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, Clock3, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { TARIFICATION, FAQ_TARIFICATION } from "@/lib/tarification";

const ease = [0.16, 1, 0.3, 1] as const;
const AUDIT_HREF = "/audit-gratuit";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

// ---- shared building blocks ----

function GradientOrb({
  className = "",
  color = "emerald",
}: {
  className?: string;
  color?: "emerald" | "sand";
}) {
  void className;
  void color;
  return null;
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-sans uppercase tracking-[0.18em] text-emerald-700 font-semibold block mb-4">
      {children}
    </span>
  );
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  align?: "center" | "left";
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={fadeUp}
      className={`mb-14 flex flex-col ${
        align === "center" ? "items-center text-center" : "items-start"
      }`}
    >
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="font-serif text-[34px] sm:text-[42px] leading-[1.05] tracking-[-0.02em] text-zinc-900 mb-4 max-w-2xl">
        {title}
      </h2>
      {subtitle && (
        <p className="text-[15px] text-zinc-600 font-sans leading-[1.65] max-w-xl">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}

function PrimaryButton({
  href,
  children,
  size = "md",
}: {
  href: string;
  children: React.ReactNode;
  size?: "md" | "lg";
}) {
  const sizes = {
    md: "",
    lg: "px-6 py-3 text-[14.5px]",
  };
  return (
    <Link
      href={href}
      className={`safe-site-cta-primary ${sizes[size]}`}
    >
      {children}
    </Link>
  );
}

function GhostButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="safe-site-cta-secondary"
    >
      {children}
    </Link>
  );
}

// ---- sections ----

function Hero() {
  return (
    <section className="relative pt-24 pb-20 px-6 overflow-hidden">
      <GradientOrb className="-top-32 -left-32 w-[520px] h-[520px]" color="emerald" />
      <GradientOrb className="-top-20 right-0 w-[420px] h-[420px]" color="sand" />
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="relative max-w-4xl mx-auto text-center"
      >
        <motion.div variants={fadeUp}>
          <Eyebrow>Offre fondatrice</Eyebrow>
        </motion.div>
        <motion.h1
          variants={fadeUp}
          className="font-serif text-[44px] sm:text-[60px] leading-[1.02] tracking-[-0.025em] text-zinc-900 mb-6"
        >
          On bâtit SAFE avec cinq cabinets.{" "}
          <span className="bg-gradient-to-r from-emerald-700 to-emerald-500 bg-clip-text text-transparent italic">
            Pas seulement pour eux.
          </span>
        </motion.h1>
        <motion.p
          variants={fadeUp}
          className="text-[17px] text-zinc-600 font-sans leading-[1.65] max-w-2xl mx-auto mb-10"
        >
          SAFE est une jeune entreprise basée au Québec. Pour continuer à nous
          développer, on s&apos;associe à un petit nombre de cabinets partenaires, et on
          leur réserve des conditions qui ne reviendront pas.
        </motion.p>
        <motion.div
          variants={fadeUp}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <PrimaryButton href="/contact" size="lg">
            Nous contacter &rarr;
          </PrimaryButton>
          <GhostButton href="#prix-reguliers">Voir nos prix réguliers</GhostButton>
        </motion.div>
      </motion.div>
    </section>
  );
}

function OffreFondatrice() {
  const {
    placesPrises,
    placesTotal,
    abonnementVie,
    prixRegulierBarre,
    rachatUnique,
    moisGratuits,
  } = TARIFICATION.fondateurs;
  const restantes = Math.max(placesTotal - placesPrises, 0);
  return (
    <section id="fondateurs" className="py-20 px-6 max-w-5xl mx-auto">
      <SectionHeader
        eyebrow="L'offre fondatrice"
        title={
          <>
            Cinq places.{" "}
            <span className="italic text-emerald-700">Un tarif gelé à vie.</span>
          </>
        }
        subtitle={`${moisGratuits} mois gratuits dès l'activation, puis un tarif verrouillé pour toujours. Deux façons d'en profiter, à votre choix.`}
      />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={stagger}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch"
      >
        {/* Abonnement à vie */}
        <motion.div
          variants={fadeUp}
          className="relative overflow-hidden rounded-2xl p-7 sm:p-9 flex flex-col border border-emerald-950 bg-[linear-gradient(145deg,#163327_0%,#0f241b_48%,#07130f_100%)] text-white shadow-[0_30px_90px_-52px_rgba(7,19,15,0.85)]"
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-200 via-white to-emerald-300" />
          <span className="inline-flex self-start mb-5 items-center gap-1.5 text-[10.5px] uppercase tracking-[0.14em] font-semibold px-3 py-1 rounded-full bg-white/12 text-white border border-white/20 backdrop-blur-sm">
            <Sparkles className="h-3 w-3" aria-hidden="true" />
            Le choix des fondateurs
          </span>
          <p className="text-[11px] uppercase tracking-[0.14em] font-semibold text-emerald-100/75 mb-3">
            Abonnement à vie
          </p>
          <div className="flex items-end gap-2">
            <span className="font-serif text-[48px] leading-none text-white">
              {abonnementVie} $
            </span>
            <span className="pb-1 text-[14px] text-white/70">/ mois</span>
            <span className="pb-1 ml-1 text-[15px] text-white/40 line-through">
              {prixRegulierBarre} $
            </span>
          </div>
          <p className="text-[13.5px] leading-[1.6] text-white/85 mt-4 mb-7">
            {moisGratuits} mois gratuits dès l&apos;activation, puis {abonnementVie} $/mois
            gelés à vie. Aucune hausse, jamais, tant que vous restez membre.
          </p>
          <Link href="/contact" className="safe-site-cta-primary relative mt-auto">
            Nous contacter &rarr;
          </Link>
        </motion.div>

        {/* Rachat unique */}
        <motion.div
          variants={fadeUp}
          className="relative overflow-hidden rounded-2xl p-7 sm:p-9 flex flex-col border border-emerald-900/10 bg-white/80 shadow-[0_18px_60px_-48px_rgba(31,58,46,0.48)] hover:border-emerald-900/20 hover:bg-white transition-all"
        >
          <p className="text-[11px] uppercase tracking-[0.14em] font-semibold text-emerald-800 mb-3">
            Rachat unique
          </p>
          <div className="flex items-end gap-2">
            <span className="font-serif text-[48px] leading-none text-zinc-900">
              {rachatUnique.toLocaleString("fr-CA")} $
            </span>
            <span className="pb-1 text-[14px] text-zinc-500">une seule fois</span>
          </div>
          <p className="text-[13.5px] leading-[1.6] text-zinc-700 mt-4 mb-7">
            Vous payez une fois, plus jamais de mensualité à gérer. Accès à vie, mises à
            jour de conformité comprises. Réservé aux cinq cabinets fondateurs.
          </p>
          <Link href="/contact" className="safe-site-cta-secondary relative mt-auto">
            Nous contacter &rarr;
          </Link>
        </motion.div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, delay: 0.2, ease }}
        className="mt-8 text-center text-[13px] text-zinc-500"
      >
        {placesPrises} / {placesTotal} places attribuées ·{" "}
        {restantes > 1 ? `${restantes} places restantes` : `${restantes} place restante`}
      </motion.p>
    </section>
  );
}

function PartenariatFondateur() {
  const points = [
    {
      num: "01",
      titre: "Une entreprise qui grandit avec ses cabinets",
      desc: "Nous sommes une petite équipe. Les cinq premiers cabinets nous aident à bâtir le bon outil, pas l'inverse.",
    },
    {
      num: "02",
      titre: "Votre retour oriente l'outil",
      desc: "Ce que vous nous dites se retrouve dans la prochaine version. Vous n'êtes pas un dossier parmi mille.",
    },
    {
      num: "03",
      titre: "Un prix gelé à vie",
      desc: "En échange de votre confiance maintenant, votre tarif ne bouge plus, jamais.",
    },
  ];
  return (
    <section className="py-20 px-6 max-w-6xl mx-auto">
      <SectionHeader
        eyebrow="Pourquoi une offre fondatrice"
        title={
          <>
            Un partenariat,{" "}
            <span className="italic text-emerald-700">pas une promotion</span>.
          </>
        }
        subtitle="L'idée est simple et assumée. On cherche cinq cabinets pour avancer avec nous, et on récompense ceux qui embarquent tôt."
      />
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={stagger}
        className="grid grid-cols-1 md:grid-cols-3 gap-5"
      >
        {points.map((p) => (
          <motion.div
            key={p.num}
            variants={fadeUp}
            className="relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-sm border border-white/80 p-7 shadow-[0_2px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)] transition-shadow"
          >
            <div className="relative mb-5 inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-800 font-serif text-[14px]">
              {p.num}
            </div>
            <h3 className="relative font-sans font-semibold text-[16px] text-zinc-900 mb-3 leading-[1.3]">
              {p.titre}
            </h3>
            <p className="relative text-[13.5px] text-zinc-600 font-sans leading-[1.65]">
              {p.desc}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

function AvantagesFondateurs() {
  const avantages = [
    "12 mois gratuits dès l'activation",
    "Tarif de 50 $/mois gelé à vie",
    "Option de rachat unique à 5 000 $",
    "Mise en route faite avec vous, sans frais",
    "Migration de vos données incluse",
    "Mises à jour de conformité au Barreau incluses",
    "Accès prioritaire au support",
    "Voix au chapitre sur la feuille de route",
    "Hébergement au Canada, données chiffrées",
    "Statut de membre fondateur",
  ];
  return (
    <section className="py-20 px-6 max-w-5xl mx-auto">
      <SectionHeader
        eyebrow="Ce que vous obtenez"
        title={
          <>
            Tous les avantages{" "}
            <span className="italic text-emerald-700">fondateurs</span>.
          </>
        }
        subtitle="Une seule signature, et tout ce qui suit est compris."
      />
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={stagger}
        className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-3.5"
      >
        {avantages.map((a) => (
          <motion.div
            key={a}
            variants={fadeUp}
            className="flex gap-3 text-[14px] text-zinc-700 font-sans"
          >
            <span className="shrink-0 mt-[1px] flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-800">
              <Check className="h-3 w-3" aria-hidden="true" />
            </span>
            <span>{a}</span>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

function PaliersGrid() {
  const { solo, cabinet } = TARIFICATION.paliers;
  const valueProofs = [
    {
      icon: Clock3,
      value: "5 h",
      label: "récupérées par semaine visées en 60 jours",
    },
    {
      icon: ShieldCheck,
      value: "Canada",
      label: "hébergement, conformité et données sensibles",
    },
    {
      icon: TrendingUp,
      value: "Tout inclus",
      label: "configuration, mise en service et migration des données",
    },
  ];
  const paliers = [
    {
      key: "solo",
      nom: "Solo",
      label: "Cabinet indépendant",
      prix: `${solo.prix} $`,
      prixSuffix: "/mois",
      annuel: `${solo.prixAnnuel} $/mois en annuel · économie ${solo.eco} $`,
      pourQui: "1 avocat, toute discipline.",
      proof: "Moins qu'une demi-heure facturable.",
      features: [
        "Configuration adaptée à votre pratique",
        "Clients et dossiers illimités",
        "Facturation forfait, horaire ou mixte",
        "Comptabilité fidéicommis intégrée",
        "Cartables réglementaires standards",
        "Suivi de conformité intégré",
        "Bilingue FR/EN, hébergé au Canada",
        "Support standard",
      ],
      cta: "Commencer mon audit",
      highlight: false,
    },
    {
      key: "cabinet",
      nom: "Cabinet",
      label: "Équipe en croissance",
      prix: `${cabinet.prix} $`,
      prixSuffix: "/mois",
      annuel: `${cabinet.prixAnnuel} $/mois en annuel`,
      pourQui: "2 à 5 avocats, équipes mixtes, multi-disciplines.",
      proof: "Le meilleur ratio valeur / contrôle pour une équipe.",
      features: [
        "Tout le palier Solo",
        "Multi-utilisateurs avec rôles",
        "Portail client sécurisé",
        "Time tracking complet, fiches consolidées",
        "Rapports avancés par avocat, client, domaine",
        "Tagging multi-domaines, rapports croisés",
        "Support email et chat",
      ],
      cta: "Commencer mon audit",
      highlight: true,
      badge: "Le plus populaire",
    },
    {
      key: "cabinet-plus",
      nom: "Cabinet+",
      label: "Structure avancée",
      prix: "Sur devis",
      prixSuffix: "",
      annuel: "Quand le standard ne suffit plus.",
      pourQui: "6 avocats et plus, multi-bureaux, workflows hors cadre.",
      proof: "Architecture et accompagnement calibrés au cabinet.",
      features: [
        "Tout le palier Cabinet",
        "Pipeline d'onboarding 3 phases",
        "Configuration sur mesure",
        "Formation équipe, support prioritaire avec SLA",
        "SSO et intégrations spécialisées",
        "Cas hors cadre supportés",
      ],
      cta: "Demander mon audit",
      highlight: false,
    },
  ];

  return (
    <section id="prix-reguliers" className="relative py-24 px-6 max-w-6xl mx-auto">
      <SectionHeader
        eyebrow="Nos prix réguliers"
        title={
          <>
            Et après la phase fondatrice,{" "}
            <span className="italic text-emerald-700">des prix simples et publics</span>.
          </>
        }
        subtitle="Une fois les cinq places fondatrices comblées, voici nos tarifs standards. Pas de surprise, pas de paliers cachés."
      />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={stagger}
        className="mb-6 grid grid-cols-1 md:grid-cols-3 overflow-hidden rounded-2xl border border-emerald-900/10 bg-white/75 shadow-[0_18px_60px_-42px_rgba(31,58,46,0.55)] backdrop-blur-sm"
      >
        {valueProofs.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.value}
              variants={fadeUp}
              className={`flex min-h-[112px] items-center gap-4 p-6 ${
                index > 0 ? "border-t border-emerald-900/10 md:border-l md:border-t-0" : ""
              }`}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-900/10 bg-emerald-50 text-emerald-800">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span>
                <span className="block font-serif text-[28px] leading-none text-zinc-950">
                  {item.value}
                </span>
                <span className="mt-2 block text-[13px] leading-[1.45] text-zinc-600">
                  {item.label}
                </span>
              </span>
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={stagger}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch"
      >
        {paliers.map((p) => (
          <motion.div
            key={p.key}
            variants={fadeUp}
            className={`relative overflow-hidden rounded-2xl p-7 sm:p-8 flex flex-col h-full transition-all ${
              p.highlight
                ? "border border-emerald-950 bg-[linear-gradient(145deg,#163327_0%,#0f241b_48%,#07130f_100%)] text-white shadow-[0_30px_90px_-52px_rgba(7,19,15,0.85)] md:-translate-y-3"
                : "border border-emerald-900/10 bg-white/80 shadow-[0_18px_60px_-48px_rgba(31,58,46,0.48)] hover:border-emerald-900/20 hover:bg-white"
            }`}
          >
            {p.highlight && <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-200 via-white to-emerald-300" />}
            {p.badge && (
              <span className="relative inline-flex self-start mb-5 items-center gap-1.5 text-[10.5px] uppercase tracking-[0.14em] font-semibold px-3 py-1 rounded-full bg-white/12 text-white border border-white/20 backdrop-blur-sm">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                {p.badge}
              </span>
            )}
            <p
              className={`relative mb-3 text-[11px] uppercase tracking-[0.14em] font-semibold ${
                p.highlight ? "text-emerald-100/75" : "text-emerald-800"
              }`}
            >
              {p.label}
            </p>
            <h3
              className={`relative font-serif text-[28px] mb-5 ${
                p.highlight ? "text-white" : "text-zinc-900"
              }`}
            >
              {p.nom}
            </h3>
            <div className="relative mb-5 rounded-xl border border-current/10 bg-white/[0.055] p-5">
              <p
                className={`mb-2 text-[11px] uppercase tracking-[0.14em] font-semibold ${
                  p.highlight ? "text-white/55" : "text-zinc-500"
                }`}
              >
                Investissement
              </p>
              <div className="flex items-end gap-2">
                <span
                  className={`font-serif text-[48px] leading-none ${
                    p.highlight ? "text-white" : "text-zinc-900"
                  }`}
                >
                  {p.prix}
                </span>
                {p.prixSuffix && (
                  <span
                    className={`pb-1 text-[14px] ${
                      p.highlight ? "text-white/70" : "text-zinc-500"
                    }`}
                  >
                    {p.prixSuffix}
                  </span>
                )}
              </div>
              <p
                className={`relative mt-3 text-[12.5px] ${
                  p.highlight ? "text-white/62" : "text-zinc-500"
                }`}
              >
                {p.annuel}
              </p>
            </div>
            <p
              className={`relative mb-5 border-b pb-5 text-[13.5px] leading-[1.6] ${
                p.highlight ? "border-white/10 text-white/85" : "border-emerald-900/10 text-zinc-700"
              }`}
            >
              {p.pourQui}
            </p>
            <p
              className={`relative mb-6 text-[13px] font-medium leading-[1.5] ${
                p.highlight ? "text-emerald-100" : "text-emerald-900"
              }`}
            >
              {p.proof}
            </p>
            <ul className="relative space-y-2.5 mb-8 flex-1">
              {p.features.map((f) => (
                <li
                  key={f}
                  className={`text-[13px] font-sans leading-[1.55] flex gap-2.5 ${
                    p.highlight ? "text-white/85" : "text-zinc-700"
                  }`}
                >
                  <span
                    className={`shrink-0 mt-[1px] flex h-4 w-4 items-center justify-center rounded-full ${
                      p.highlight ? "bg-emerald-200 text-emerald-950" : "bg-emerald-50 text-emerald-800"
                    }`}
                  >
                    <Check className="h-3 w-3" aria-hidden="true" />
                  </span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href={AUDIT_HREF}
              className="safe-site-cta-primary relative mt-auto"
            >
              {p.cta} &rarr;
            </Link>
          </motion.div>
        ))}
      </motion.div>
      <motion.p
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, delay: 0.2, ease }}
        className="mt-12 text-center text-[14px] text-zinc-500 italic"
      >
        SAFE coûte moins de 21 minutes de votre temps facturable par mois.
      </motion.p>
    </section>
  );
}

function InclusPartout() {
  const items = [
    "Hébergement Canada (Loi 25 / PIPEDA)",
    "Mises à jour produit en continu",
    "Conformité par juridiction",
    "Comptabilité fidéicommis intégrée",
    "Bilinguisme FR/EN complet",
    "Support standard",
    "Sauvegardes chiffrées quotidiennes",
    "Sécurité (2FA, audit trail, journalisation)",
    "Mises à jour réglementaires",
    "Configuration adaptée à votre pratique",
    "Migration des données initiale",
  ];
  return (
    <section className="py-24 px-6 max-w-5xl mx-auto">
      <SectionHeader
        eyebrow="Ce qui est compris"
        title={
          <>
            Inclus avec tout abonnement,{" "}
            <span className="italic text-emerald-700">sans frais supplémentaires</span>.
          </>
        }
        subtitle="Vous payez le logiciel et la transformation. Pas l'air autour."
      />
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={stagger}
        className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-3"
      >
        {items.map((it) => (
          <motion.div
            key={it}
            variants={fadeUp}
            className="flex gap-3 text-[14px] text-zinc-700 font-sans"
          >
            <span className="text-emerald-600 shrink-0 mt-[2px]">✓</span>
            <span>{it}</span>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

function TripleGarantie() {
  const garanties = [
    {
      num: "01",
      titre: "Activation sous 30 jours, ou compensation",
      desc: "Si votre première facture n'est pas envoyée et votre premier dossier n'est pas numérisé sous 30 jours, chaque jour de retard est offert sur votre abonnement et notre équipe d'activation reste mobilisée gratuitement jusqu'à la mise en service complète.",
    },
    {
      num: "02",
      titre: "Performance — 5 h par semaine récupérées en 60 jours",
      desc: "Nous mesurons votre temps gagné dans le tableau de bord. Si vous n'atteignez pas 5 heures par semaine récupérées au jour 60, nous continuons de travailler avec vous gratuitement — accompagnement, formation, ajustements — jusqu'à ce que vous y soyez.",
    },
    {
      num: "03",
      titre: "Migration sans perte",
      desc: "Chaque client, dossier, écriture comptable et fichier de votre ancien système est retrouvé dans SAFE. Réconciliation vérifiée et signée par notre équipe avant la mise en production. Si une donnée manque, nous la récupérons à nos frais.",
    },
  ];

  return (
    <section className="py-24 px-6 max-w-6xl mx-auto">
      <SectionHeader
        eyebrow="Triple garantie"
        title={
          <>
            Le risque est sur nous,{" "}
            <span className="italic text-emerald-700">pas sur vous</span>.
          </>
        }
      />
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={stagger}
        className="grid grid-cols-1 md:grid-cols-3 gap-5"
      >
        {garanties.map((g) => (
          <motion.div
            key={g.num}
            variants={fadeUp}
            className="relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-sm border border-white/80 p-7 shadow-[0_2px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)] transition-shadow"
          >
            <GradientOrb className="-top-12 -right-12 w-32 h-32 opacity-50" />
            <div className="relative mb-5 inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-800 font-serif text-[14px]">
              {g.num}
            </div>
            <h3 className="relative font-sans font-semibold text-[16px] text-zinc-900 mb-3 leading-[1.3]">
              {g.titre}
            </h3>
            <p className="relative text-[13px] text-zinc-600 font-sans leading-[1.65]">
              {g.desc}
            </p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease }}
        className="mt-10 mx-auto max-w-3xl text-center"
      >
        <p className="text-[12px] uppercase tracking-[0.18em] text-emerald-700 font-semibold mb-3">
          Notre engagement de mise en service
        </p>
        <p className="text-[14.5px] text-zinc-600 leading-[1.8]">
          <span className="font-semibold text-zinc-900">Jour 1</span> — première facture
          envoyée. <span className="font-semibold text-zinc-900">Jour 3</span> — premier
          dossier numérisé. <span className="font-semibold text-zinc-900">Jour 7</span> —
          première heure de gain mesurée.
        </p>
      </motion.div>
    </section>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-zinc-200/60 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left text-[14.5px] font-sans font-medium text-zinc-900 hover:text-emerald-700 transition-colors"
      >
        <span className="pr-4">{question}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 text-emerald-700"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-[13.5px] text-zinc-600 leading-[1.7] pr-8">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FAQSection() {
  return (
    <section id="faq" className="py-24 px-6 max-w-3xl mx-auto">
      <SectionHeader
        eyebrow="Questions fréquentes"
        title={
          <>
            Vous avez des questions.{" "}
            <span className="italic text-emerald-700">Voici les réponses.</span>
          </>
        }
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease }}
        className="rounded-2xl bg-white/70 backdrop-blur-sm border border-white/80 px-6 sm:px-8 shadow-[0_2px_16px_rgba(0,0,0,0.04)]"
      >
        {FAQ_TARIFICATION.map((f) => (
          <FAQItem key={f.question} question={f.question} answer={f.answer} />
        ))}
      </motion.div>
    </section>
  );
}

function CtaFinal() {
  return (
    <section className="relative py-28 px-6 overflow-hidden">
      <GradientOrb className="-bottom-32 -left-32 w-[500px] h-[500px]" />
      <GradientOrb className="-top-20 right-0 w-[420px] h-[420px]" color="sand" />
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={stagger}
        className="relative max-w-3xl mx-auto text-center"
      >
        <motion.h2
          variants={fadeUp}
          className="font-serif text-[36px] sm:text-[44px] leading-[1.05] tracking-[-0.02em] text-zinc-900 mb-5"
        >
          Prêt à faire partie{" "}
          <span className="bg-gradient-to-r from-emerald-700 to-emerald-500 bg-clip-text text-transparent italic">
            des cinq
          </span>{" "}
          ?
        </motion.h2>
        <motion.p
          variants={fadeUp}
          className="text-[15.5px] text-zinc-600 leading-[1.7] max-w-xl mx-auto mb-10"
        >
          On vous explique l&apos;offre fondatrice en quinze minutes, sans engagement.
        </motion.p>
        <motion.div
          variants={fadeUp}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <PrimaryButton href="/contact" size="lg">
            Nous contacter &rarr;
          </PrimaryButton>
          <GhostButton href={AUDIT_HREF}>Faire l&apos;audit gratuit d&apos;abord</GhostButton>
        </motion.div>
      </motion.div>
    </section>
  );
}

export function TarificationContent() {
  return (
    <div className="relative">
      <Hero />
      <OffreFondatrice />
      <PartenariatFondateur />
      <AvantagesFondateurs />
      <PaliersGrid />
      <InclusPartout />
      <TripleGarantie />
      <FAQSection />
      <CtaFinal />
    </div>
  );
}
