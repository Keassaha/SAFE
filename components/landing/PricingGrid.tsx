"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from './ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

type Billing = "monthly" | "annual";

export function PricingGrid() {
  const ease = [0.16, 1, 0.3, 1] as const;
  const [billing, setBilling] = useState<Billing>("monthly");
  const annual = billing === "annual";

  // Remise annuelle : -20 % → facturé sur 12 mois mais affiché en /mois équivalent
  const priceFor = (monthly: number) => (annual ? Math.round(monthly * 0.8) : monthly);

  const fmt = (n: number) => n.toLocaleString("fr-CA");

  return (
    <section className="py-[100px] px-6 max-w-6xl mx-auto" id="tarification">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease }}
        className="mb-10 text-center flex flex-col items-center"
      >
        <span className="text-[12px] font-sans uppercase tracking-[0.15em] text-forest-600 font-medium block mb-4">
          Tarification
        </span>
        <h2 className="font-serif text-[38px] leading-[1.1] tracking-[-0.02em] text-text-primary mb-4 max-w-2xl">
          Choisissez le niveau d&apos;accompagnement <span className="italic text-forest-600">adapté à votre cabinet.</span>
        </h2>
        <p className="text-[15px] text-text-body font-sans leading-[1.6] max-w-xl">
          Le bon choix dépend moins du nombre d&apos;utilisateurs que du niveau de complexité du cabinet. Si vous hésitez, l&apos;audit gratuit clarifie en quelques minutes.
        </p>
      </motion.div>

      {/* Switch mensuel / annuel */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease }}
        className="flex flex-col items-center gap-3 mb-14"
      >
        <div
          role="tablist"
          aria-label="Cycle de facturation"
          className="relative grid grid-cols-2 items-center p-1.5 rounded-full bg-white border border-[#D6D0C2] shadow-[0_2px_10px_-4px_rgba(31,58,46,0.15)]"
          style={{ width: 340 }}
        >
          {/* Pill coulissant */}
          <motion.span
            aria-hidden="true"
            className="absolute top-1.5 bottom-1.5 left-1.5 rounded-full bg-forest-600 shadow-md"
            style={{ width: "calc(50% - 6px)" }}
            animate={{ x: annual ? "100%" : "0%" }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          />
          <button
            role="tab"
            type="button"
            aria-selected={!annual}
            onClick={() => setBilling("monthly")}
            className={`relative z-10 h-10 text-[14px] font-sans font-semibold rounded-full transition-colors duration-200 ${
              !annual ? "text-white" : "text-[#4A4A4A] hover:text-text-primary"
            }`}
          >
            Mensuel
          </button>
          <button
            role="tab"
            type="button"
            aria-selected={annual}
            onClick={() => setBilling("annual")}
            className={`relative z-10 h-10 text-[14px] font-sans font-semibold rounded-full transition-colors duration-200 inline-flex items-center justify-center gap-2 ${
              annual ? "text-white" : "text-[#4A4A4A] hover:text-text-primary"
            }`}
          >
            Annuel
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide transition-colors ${
                annual ? "bg-white/20 text-white" : "bg-forest-600 text-white"
              }`}
            >
              −20 %
            </span>
          </button>
        </div>

        <div className="h-5">
          <AnimatePresence mode="wait">
            {annual && (
              <motion.span
                key="annual-hint"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
                className="text-[12px] font-sans text-text-muted"
              >
                Facturé annuellement · prix /mois équivalent
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Bannière globale « Tarif fondateur » — s'applique à toutes les formules */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease }}
        className="flex justify-center mb-8"
      >
        <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-surface border border-[0.5px] border-forest-600/30 shadow-[0_8px_30px_-15px_rgba(31,58,46,0.35)]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full bg-forest-600 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-forest-600" />
          </span>
          <span className="text-[12px] font-sans uppercase tracking-[0.12em] font-medium text-forest-600">
            Tarif fondateur
          </span>
          <span className="h-3 w-px bg-border" />
          <span className="text-[12px] font-serif italic text-text-muted">
            50 premiers cabinets · toutes formules
          </span>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">

        {/* ── Solo ── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.1, ease }}
          className="bg-surface border border-[0.5px] border-border rounded-[7px] p-8 flex flex-col h-full"
        >
          <h3 className="font-sans font-medium text-[15px] text-text-primary mb-2">Solo</h3>
          <div className="flex items-baseline gap-1 mb-1">
            <motion.span
              key={`solo-${billing}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="font-serif text-[42px] tracking-[-0.02em] text-text-primary tabular-nums"
            >
              {fmt(priceFor(99))}&nbsp;$
            </motion.span>
            <span className="text-[13px] text-text-subtle">/mois</span>
          </div>
          <div className="h-4 mb-4">
            {annual && (
              <span className="text-[11px] text-forest-600 font-medium">
                Soit {fmt(priceFor(99) * 12)} $ / an · économie {fmt(99 * 12 - priceFor(99) * 12)} $
              </span>
            )}
          </div>
          <p className="text-[13px] text-text-body font-sans leading-[1.5] mb-6">
            Pour l&apos;avocat·e qui pratique en solo et veut un système clair pour la facturation, le fidéicommis, les dossiers et la conformité.
          </p>
          <ul className="flex flex-col gap-3 mb-8 flex-1">
            {['1 utilisateur', 'Facturation et fidéicommis conformes', 'Suivi des paiements et comptes à recevoir', 'Portail client sécurisé', 'Mise en route et formation incluses'].map(f => (
              <li key={f} className="flex items-start gap-2 text-[13px] text-text-body">
                <span className="text-forest-600 mt-0.5">✓</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <Button variant="outlined" className="w-full">Faire mon audit gratuit &rarr;</Button>
        </motion.div>

        {/* ── Cabinet · Recommandé (en vert) ── */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.2, ease }}
          className="relative rounded-[7px] px-8 py-10 flex flex-col h-full shadow-lg z-10 overflow-visible"
          style={{
            background: "linear-gradient(180deg, #1F3A2E 0%, #16291F 100%)",
            border: "1px solid #2E5A49",
            boxShadow: "0 10px 40px -12px rgba(31,58,46,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          <div
            className="absolute -top-3 left-1/2 -translate-x-1/2 text-white text-[11px] uppercase tracking-[0.1em] font-sans font-semibold px-4 py-1.5 rounded-full whitespace-nowrap shadow-sm z-20"
            style={{ backgroundColor: "#2E5A49", border: "1px solid #8FB49F" }}
          >
            Recommandé
          </div>

          <h3 className="font-sans font-medium text-[15px] text-white mb-2">Cabinet</h3>
          <div className="flex items-baseline gap-1 mb-1">
            <motion.span
              key={`cabinet-${billing}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="font-serif text-[42px] tracking-[-0.02em] text-white tabular-nums"
            >
              {fmt(priceFor(149))}&nbsp;$
            </motion.span>
            <span className="text-[13px] text-[#C8D4CB]">/mois</span>
          </div>
          <div className="h-4 mb-4">
            {annual && (
              <span className="text-[11px] text-[#A9D3B6] font-medium">
                Soit {fmt(priceFor(149) * 12)} $ / an · économie {fmt(149 * 12 - priceFor(149) * 12)} $
              </span>
            )}
          </div>
          <p className="text-[13px] text-[#D4E8D9] font-sans leading-[1.5] mb-6">
            Pour le cabinet en croissance, avec un·e adjoint·e ou un·e parajuriste, qui a besoin de rôles clairs et d&apos;un pilotage plus visible.
          </p>
          <ul className="flex flex-col gap-3 mb-8 flex-1">
            {['Jusqu\'à 3 utilisateurs', 'Tout ce qui est inclus dans Solo', 'Permissions par rôle (avocat·e, adjoint·e, comptable)', 'Journal d\'audit complet', 'Reporting mensuel pour le teneur de livres', 'Onboarding personnalisé'].map(f => (
              <li key={f} className="flex items-start gap-2 text-[13px] text-[#D4E8D9]">
                <span className="text-[#A9D3B6] mt-0.5">✓</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
          <Button variant="dark" className="w-full text-forest-700 bg-white hover:bg-neutral-100">Faire mon audit gratuit &rarr;</Button>
        </motion.div>

        {/* ── Cabinet+ ── */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, delay: 0.3, ease }}
          className="bg-surface border border-[0.5px] border-border rounded-[7px] p-8 flex flex-col h-full"
        >
          <h3 className="font-sans font-medium text-[15px] text-text-primary mb-2">Cabinet+</h3>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="font-serif text-[28px] tracking-[-0.02em] text-text-primary">Sur devis</span>
          </div>
          <div className="h-4 mb-4">
            <span className="text-[11px] text-text-muted font-medium">
              Frais de mise en service dès 1 997 $ · engagement 12 mois
            </span>
          </div>
          <p className="text-[13px] text-text-body font-sans leading-[1.5] mb-6 mt-1">
            Pour les cabinets établis, avec migration de données historiques, intégrations comptables ou exigences de conformité plus marquées.
          </p>
          <ul className="flex flex-col gap-3 mb-8 flex-1">
            {['Utilisateurs au-delà de 3', 'Migration accompagnée des données existantes', 'Intégrations comptables (QuickBooks, Sage, Acomba)', 'Gestionnaire de compte SAFE dédié', 'Onboarding sur mesure'].map(f => (
              <li key={f} className="flex items-start gap-2 text-[13px] text-text-body">
                <span className="text-text-muted mt-0.5">✓</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
          {/* CTA "Réserver un appel" → page de contact (envoi vers jeremie@safecabinet.ca). */}
          <Link href="/contact" className="block">
            <Button variant="primary" className="w-full">Réserver un appel &rarr;</Button>
          </Link>
        </motion.div>

      </div>
    </section>
  );
}
