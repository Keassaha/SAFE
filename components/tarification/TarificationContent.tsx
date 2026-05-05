"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { TARIFICATION, AUTOMATIONS, FAQ_TARIFICATION } from "@/lib/tarification";

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
          <Eyebrow>Tarification SAFE</Eyebrow>
        </motion.div>
        <motion.h1
          variants={fadeUp}
          className="font-serif text-[44px] sm:text-[60px] leading-[1.02] tracking-[-0.025em] text-zinc-900 mb-6"
        >
          Le système de gestion de cabinet conçu par et pour les{" "}
          <span className="bg-gradient-to-r from-emerald-700 to-emerald-500 bg-clip-text text-transparent italic">
            avocats canadiens et québécois
          </span>
          .
        </motion.h1>
        <motion.p
          variants={fadeUp}
          className="text-[17px] text-zinc-600 font-sans leading-[1.65] max-w-2xl mx-auto mb-10"
        >
          Avoir un cabinet qui tourne sans vous le vendredi après-midi — sans embaucher,
          sans apprendre un nouveau métier, sans risquer un faux pas avec votre Barreau.
        </motion.p>
        <motion.div
          variants={fadeUp}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <PrimaryButton href={AUDIT_HREF} size="lg">
            Diagnostic gratuit (15 min) &rarr;
          </PrimaryButton>
          <GhostButton href="#paliers">Voir les paliers</GhostButton>
        </motion.div>
      </motion.div>
    </section>
  );
}

function PourquoiMaintenant() {
  const items = [
    {
      titre: "Pénurie d'adjointes",
      desc: "Embaucher un bookkeeper coûte 45 000 $ et plus par an au Canada.",
    },
    {
      titre: "Loi 25, FINTRAC, exigences Barreau renforcées",
      desc: "Un cabinet non conforme = risque réel de plainte ou de sanction.",
    },
    {
      titre: "L'écart se creuse",
      desc: "Les cabinets qui ont automatisé en 2025 ont 12 mois d'avance.",
    },
  ];
  return (
    <section className="py-24 px-6 max-w-6xl mx-auto">
      <SectionHeader
        eyebrow="Pourquoi maintenant"
        title={
          <>
            Trois fenêtres se referment{" "}
            <span className="italic text-emerald-700">en même temps</span>.
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
        {items.map((it) => (
          <motion.div
            key={it.titre}
            variants={fadeUp}
            className="relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-sm border border-white/80 p-7 shadow-[0_2px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)] transition-shadow"
          >
            <GradientOrb className="-top-12 -right-12 w-32 h-32 opacity-60" />
            <h3 className="relative font-sans font-semibold text-[16px] text-zinc-900 mb-3 leading-[1.3]">
              {it.titre}
            </h3>
            <p className="relative text-[13.5px] text-zinc-600 font-sans leading-[1.65]">
              {it.desc}
            </p>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

function PaliersGrid() {
  const { solo, cabinet } = TARIFICATION.paliers;
  const paliers = [
    {
      key: "solo",
      nom: "Solo",
      prix: `${solo.prix} $`,
      prixSuffix: "/mois",
      annuel: `${solo.prixAnnuel} $/mois en annuel · économie ${solo.eco} $`,
      pourQui: "1 avocat (avec ou sans adjointe), toute discipline.",
      features: [
        "Configuration adaptée à votre pratique",
        "Clients et dossiers illimités",
        "Facturation forfait, horaire ou mixte",
        "Comptabilité fidéicommis intégrée",
        "Cartables réglementaires standards",
        "Conformité automatisée",
        "Bilingue FR/EN, hébergé au Canada",
        "Support standard",
      ],
      cta: "Commencer mon audit",
      highlight: false,
    },
    {
      key: "cabinet",
      nom: "Cabinet",
      prix: `${cabinet.prix} $`,
      prixSuffix: "/mois",
      annuel: `${cabinet.prixAnnuel} $/mois en annuel`,
      pourQui: "2 à 5 avocats, équipes mixtes, multi-disciplines.",
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
      prix: "Sur devis",
      prixSuffix: "",
      annuel: "Quand le standard ne suffit plus.",
      pourQui: "6 avocats et plus, multi-bureaux, workflows hors cadre.",
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
    <section id="paliers" className="relative py-24 px-6 max-w-6xl mx-auto">
      <SectionHeader
        eyebrow="Les paliers"
        title={
          <>
            Trois paliers, une même{" "}
            <span className="italic text-emerald-700">configuration sur mesure</span>.
          </>
        }
        subtitle="Choisissez votre point d'entrée. Tout le reste s'adapte à votre pratique."
      />
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={stagger}
        className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch"
      >
        {paliers.map((p) => (
          <motion.div
            key={p.key}
            variants={fadeUp}
            className={`relative overflow-hidden rounded-2xl p-8 flex flex-col h-full transition-all hover:scale-[1.005] ${
              p.highlight
                ? "bg-gradient-to-br from-emerald-700 to-emerald-900 text-white shadow-xl shadow-emerald-800/25"
                : "bg-white/70 backdrop-blur-sm border border-white/80 shadow-[0_2px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)]"
            }`}
          >
            {!p.highlight && <GradientOrb className="-top-16 -right-16 w-40 h-40 opacity-50" />}
            {p.highlight && (
              <>
                <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-56 h-56 rounded-full bg-emerald-300/15 blur-3xl pointer-events-none" />
              </>
            )}
            {p.badge && (
              <span className="relative inline-flex self-start mb-5 items-center text-[10.5px] uppercase tracking-[0.18em] font-semibold px-3 py-1 rounded-full bg-white/15 text-white border border-white/20 backdrop-blur-sm">
                {p.badge}
              </span>
            )}
            <h3
              className={`relative font-serif text-[24px] mb-2 ${
                p.highlight ? "text-white" : "text-zinc-900"
              }`}
            >
              {p.nom}
            </h3>
            <div className="relative flex items-baseline gap-1 mb-2">
              <span
                className={`font-serif text-[42px] leading-none tracking-[-0.02em] ${
                  p.highlight ? "text-white" : "text-zinc-900"
                }`}
              >
                {p.prix}
              </span>
              {p.prixSuffix && (
                <span
                  className={`text-[14px] ${
                    p.highlight ? "text-white/70" : "text-zinc-500"
                  }`}
                >
                  {p.prixSuffix}
                </span>
              )}
            </div>
            <p
              className={`relative text-[12.5px] mb-5 ${
                p.highlight ? "text-white/65" : "text-zinc-500"
              }`}
            >
              {p.annuel}
            </p>
            <p
              className={`relative text-[13.5px] font-sans leading-[1.65] mb-6 ${
                p.highlight ? "text-white/85" : "text-zinc-700"
              }`}
            >
              {p.pourQui}
            </p>
            <ul className="relative space-y-2.5 mb-8 flex-1">
              {p.features.map((f) => (
                <li
                  key={f}
                  className={`text-[13px] font-sans leading-[1.55] flex gap-2 ${
                    p.highlight ? "text-white/85" : "text-zinc-700"
                  }`}
                >
                  <span
                    className={`shrink-0 mt-[2px] ${
                      p.highlight ? "text-emerald-300" : "text-emerald-600"
                    }`}
                  >
                    ✓
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

function PackEmployeVirtuel() {
  return (
    <section
      id="employe-virtuel"
      className="relative py-24 px-6 max-w-6xl mx-auto"
    >
      <SectionHeader
        eyebrow="Pack Employé Virtuel"
        title={
          <>
            L'assistant de vos assistants{" "}
            <span className="italic text-emerald-700">qui assure</span>.
          </>
        }
        subtitle="Zéro erreur. Cent pour cent de contrôle. Cent pour cent de précision. Sous votre regard vigilant."
      />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={fadeUp}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 to-emerald-900 text-white p-10 mb-14 max-w-2xl mx-auto text-center shadow-xl shadow-emerald-800/25"
      >
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-emerald-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-emerald-300/15 blur-3xl pointer-events-none" />
        <p className="relative text-[11px] uppercase tracking-[0.18em] text-white/70 font-semibold mb-4">
          Pack Employé Virtuel
        </p>
        <div className="relative flex items-baseline gap-1 justify-center mb-3">
          <span className="font-serif text-[56px] leading-none tracking-[-0.02em]">
            {TARIFICATION.packEv.prix.toLocaleString("fr-CA")} $
          </span>
          <span className="text-[15px] text-white/70">/mois</span>
        </div>
        <p className="relative text-[14px] text-white/80 leading-[1.65] mb-7">
          Tout inclus. Sans setup fee. Résiliable en tout temps.
        </p>
        <Link
          href={AUDIT_HREF}
          className="safe-site-cta-primary relative"
        >
          Activer mon Pack &rarr;
        </Link>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease }}
        className="text-center text-[15px] text-zinc-600 max-w-2xl mx-auto leading-[1.7] mb-12"
      >
        Ce ne sont pas des chatbots. Ce sont des séries d'automations qui exécutent les
        tâches répétitives de votre cabinet — vous gardez la décision finale, l'IA exécute
        le reste.
      </motion.p>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={stagger}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
      >
        {AUTOMATIONS.map((a) => (
          <motion.div
            key={a.num}
            variants={fadeUp}
            className="relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-sm border border-white/80 p-6 shadow-[0_2px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.06)] transition-shadow"
          >
            <GradientOrb className="-top-12 -right-12 w-32 h-32 opacity-50" />
            <div className="relative mb-4 inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-800 font-serif text-[14px]">
              {a.num}
            </div>
            <h3 className="relative font-sans font-semibold text-[15px] text-zinc-900 mb-2.5 leading-[1.3]">
              {a.titre}
            </h3>
            <p className="relative text-[13px] text-zinc-600 font-sans leading-[1.65]">
              {a.desc}
            </p>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease }}
        className="mt-14 text-center"
      >
        <p className="text-[15px] text-zinc-700 leading-[1.7] max-w-3xl mx-auto">
          Un assistant junior coûte 2 500 à 3 333 $ par mois. Le Pack vous fait économiser{" "}
          <span className="font-semibold text-emerald-700">60 à 70 %</span>. ROI typique :{" "}
          <span className="font-semibold text-emerald-700">6× à 12×</span> dès le premier
          mois.
        </p>
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
          Time-to-first-value contractuel
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

function OffreFondateurs() {
  const { placesPrises, placesTotal, prix, deadlineJours } = TARIFICATION.fondateurs;
  const closed = placesPrises >= placesTotal;
  return (
    <section id="fondateurs" className="py-24 px-6 max-w-3xl mx-auto">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={fadeUp}
        className="text-center"
      >
        <Eyebrow>Offre Fondateurs</Eyebrow>
        <h2 className="font-serif text-[34px] sm:text-[40px] leading-[1.05] tracking-[-0.02em] text-zinc-900 mb-4">
          {placesTotal} places.{" "}
          <span className="italic text-emerald-700">Jamais relancée.</span>
        </h2>
        <p className="text-[15px] text-zinc-600 leading-[1.7] max-w-xl mx-auto mb-10">
          Vous ne devenez pas client : vous devenez{" "}
          <span className="text-zinc-900 font-medium">partenaire fondateur</span>. Votre voix
          oriente la roadmap. Votre prix est verrouillé pour toujours.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.7, ease }}
        className="relative overflow-hidden rounded-2xl bg-white/70 backdrop-blur-sm border border-emerald-700/15 p-8 sm:p-10 shadow-[0_8px_32px_rgba(31,58,46,0.08)]"
      >
        <GradientOrb className="-top-24 -right-24 w-72 h-72 opacity-50" />
        <GradientOrb className="-bottom-24 -left-24 w-72 h-72 opacity-30" color="sand" />

        <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-6 mb-8">
          {[
            ["Prix", `${prix} $`, "une seule fois"],
            ["Accès", "Solo", "à vie"],
            ["Places", `${placesPrises} / ${placesTotal}`, closed ? "fermée" : "restantes"],
            ["Deadline", `${deadlineJours} j`, "après lancement"],
          ].map(([k, v, sub]) => (
            <div key={k}>
              <p className="text-[10.5px] uppercase tracking-[0.18em] text-emerald-700 font-semibold mb-2">
                {k}
              </p>
              <p className="font-serif text-[22px] text-zinc-900 leading-[1.1] mb-0.5">
                {v}
              </p>
              <p className="text-[11.5px] text-zinc-500">{sub}</p>
            </div>
          ))}
        </div>

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-6 border-t border-emerald-700/10">
          <p className="text-[13px] text-zinc-500 italic">
            Cette offre ne sera jamais répétée.
          </p>
          {!closed && (
            <PrimaryButton href={AUDIT_HREF}>
              Devenir Fondateur &rarr;
            </PrimaryButton>
          )}
        </div>
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
          Prêt à voir votre cabinet{" "}
          <span className="bg-gradient-to-r from-emerald-700 to-emerald-500 bg-clip-text text-transparent italic">
            dans SAFE
          </span>{" "}
          ?
        </motion.h2>
        <motion.p
          variants={fadeUp}
          className="text-[15.5px] text-zinc-600 leading-[1.7] max-w-xl mx-auto mb-10"
        >
          Trois étapes : diagnostic gratuit, discovery call, activation sous 7 jours.
        </motion.p>
        <motion.div
          variants={fadeUp}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <PrimaryButton href={AUDIT_HREF} size="lg">
            Lancer mon diagnostic gratuit &rarr;
          </PrimaryButton>
          <GhostButton href="/contact">Réserver un appel de 30 min</GhostButton>
        </motion.div>
      </motion.div>
    </section>
  );
}

export function TarificationContent() {
  return (
    <div className="relative">
      <Hero />
      <PourquoiMaintenant />
      <PaliersGrid />
      <InclusPartout />
      <PackEmployeVirtuel />
      <TripleGarantie />
      <FAQSection />
      <OffreFondateurs />
      <CtaFinal />
    </div>
  );
}
