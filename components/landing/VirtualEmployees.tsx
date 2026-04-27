"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Check,
  X,
  FileText,
  Clock,
  ArrowUpRight,
} from "lucide-react";

const ease = [0.16, 1, 0.3, 1] as const;

type DraftInvoice = {
  client: string;
  matter: string;
  hours: string;
  amount: string;
  period: string;
};

const DRAFTS: DraftInvoice[] = [
  {
    client: "Tremblay & Associés",
    matter: "Consultation corporative",
    hours: "8,5 h",
    amount: "3 449,25 $",
    period: "Avril 2026",
  },
  {
    client: "Succession Beaulieu",
    matter: "Liquidation testamentaire",
    hours: "12,0 h",
    amount: "4 887,00 $",
    period: "Avril 2026",
  },
  {
    client: "Gagné Construction",
    matter: "Révision de contrats",
    hours: "5,25 h",
    amount: "2 148,75 $",
    period: "Avril 2026",
  },
];

export function VirtualEmployees() {
  return (
    <section
      id="employes-virtuels"
      className="py-[100px] px-6 max-w-6xl mx-auto"
    >
      {/* ── Header éditorial ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8, ease }}
        className="mb-16 text-center flex flex-col items-center"
      >
        <span className="text-[12px] font-sans uppercase tracking-[0.15em] text-forest-600 font-medium block mb-4">
          Copilote · pas remplaçant
        </span>
        <h2 className="font-serif text-[38px] leading-[1.1] tracking-[-0.02em] text-text-primary max-w-2xl mb-4">
          Le copilote idéal de votre{" "}
          <span className="italic text-forest-600">
            adjointe ou de votre comptable.
          </span>
        </h2>
        <p className="text-[15px] text-text-body font-sans leading-[1.6] max-w-xl">
          Nos agents IA ne remplacent pas votre équipe — ils lui épargnent les
          tâches répétitives. Préparation de factures, rapprochement des paiements,
          détection d&apos;écarts : tout passe par une validation humaine avant d&apos;être
          exécuté.
        </p>

        {/* Bande de réassurance — le jugement reste humain */}
        <div className="mt-6 inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[var(--sand-50)] border border-[0.5px] border-border">
          <span className="w-1.5 h-1.5 rounded-full bg-forest-600" aria-hidden />
          <span className="text-[11.5px] font-sans text-text-body">
            <span className="font-semibold text-text-primary">Un humain valide toujours.</span>{" "}
            <span className="italic text-text-muted">
              L&apos;IA assiste, vous décidez.
            </span>
          </span>
        </div>
      </motion.div>

      {/* ── Grille : texte gauche + illustration droite ──────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 items-center">
        {/* Colonne texte */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
          }}
          className="lg:col-span-2 space-y-6"
        >
          {[
            {
              kicker: "01",
              title: "Ils travaillent pendant que vous plaidez.",
              desc: "Pendant que vous êtes au palais, Léa prépare les factures à partir de vos feuilles de temps, relève les dépenses refacturables, signale les incohérences.",
            },
            {
              kicker: "02",
              title: "Vous validez. Eux exécutent.",
              desc: "Chaque brouillon passe par votre approbation. Un clic : la facture part au client, les écritures comptables se génèrent, le fidéicommis est mis à jour.",
            },
            {
              kicker: "03",
              title: "Piste de vérification intégrale.",
              desc: "Chaque action IA est journalisée avec horodatage et identité. Conforme au Barreau, auditable, reversible.",
            },
          ].map((item, idx) => (
            <motion.div
              key={item.kicker}
              variants={{
                hidden: { opacity: 0, x: -24 },
                visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease } },
              }}
              whileHover="hover"
              className="group relative border-l-2 border-forest-600/20 pl-5 py-1 cursor-default"
            >
              {/* Trait de gauche animé au hover */}
              <motion.span
                aria-hidden
                className="absolute left-[-2px] top-0 bottom-0 w-[2px] bg-forest-600 origin-top"
                initial={{ scaleY: 0 }}
                variants={{ hover: { scaleY: 1 } }}
                transition={{ duration: 0.45, ease }}
              />

              {/* Kicker 01 / 02 / 03 — animé */}
              <motion.span
                className="relative inline-flex items-center gap-2 mb-1"
                variants={{
                  hidden: { opacity: 0, y: 8 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.5, delay: 0.1 + idx * 0.08, ease },
                  },
                }}
              >
                {/* Pastille avec halo pulsant */}
                <span className="relative flex items-center justify-center w-5 h-5">
                  <motion.span
                    aria-hidden
                    className="absolute inset-0 rounded-full bg-forest-600/25"
                    animate={{ scale: [1, 1.8, 1.8], opacity: [0.55, 0, 0] }}
                    transition={{
                      duration: 2.2,
                      repeat: Infinity,
                      delay: idx * 0.4,
                      ease: "easeOut",
                    }}
                  />
                  <motion.span
                    aria-hidden
                    className="absolute inset-[3px] rounded-full bg-forest-600"
                    variants={{ hover: { scale: 1.15 } }}
                    transition={{ duration: 0.3, ease }}
                  />
                </span>
                <motion.span
                  className="text-[11px] font-mono tabular-nums text-forest-600 font-semibold"
                  variants={{ hover: { x: 2 } }}
                  transition={{ duration: 0.3, ease }}
                >
                  {item.kicker}
                </motion.span>
              </motion.span>

              <h3 className="font-serif text-[19px] leading-[1.25] tracking-[-0.01em] text-text-primary mb-1.5">
                {item.title}
              </h3>
              <p className="text-[13.5px] text-text-body font-sans leading-[1.6]">
                {item.desc}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Colonne illustration conversation */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease }}
          className="lg:col-span-3"
        >
          <ConversationMockup />
        </motion.div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────── */
/*  Mockup de conversation agent IA                             */
/* ──────────────────────────────────────────────────────────── */

function ConversationMockup() {
  const messageEase = [0.16, 1, 0.3, 1] as const;

  return (
    <div
      className="relative bg-surface border border-[0.5px] border-border rounded-[12px] overflow-hidden shadow-[0_30px_80px_-30px_rgba(15,23,42,0.2)]"
    >
      {/* Trait supérieur */}
      <span
        aria-hidden
        className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-forest-600 to-transparent z-10"
      />

      {/* En-tête — agent identity */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[0.5px] border-border bg-[var(--sand-50)]/60">
        <div className="relative">
          <span className="flex w-8 h-8 items-center justify-center rounded-full bg-forest-600 text-white font-serif text-[14px]">
            L
          </span>
          {/* Point de statut — halo pulsant */}
          <span className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center" aria-hidden>
            <motion.span
              className="absolute w-2.5 h-2.5 rounded-full"
              style={{ background: "#1F3A2E" }}
              animate={{ scale: [1, 2.2, 2.2], opacity: [0.5, 0, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
            />
            <span
              className="relative w-2.5 h-2.5 rounded-full border-2 border-surface"
              style={{ background: "#1F3A2E" }}
            />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-sans font-semibold text-text-primary leading-tight">
            Léa
          </p>
          <p className="text-[11px] font-sans text-text-muted mt-0.5 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-forest-600" strokeWidth={1.75} />
            Agent finance · actif
          </p>
        </div>
        <span className="text-[10px] font-mono tabular-nums text-text-subtle">
          09:14
        </span>
      </div>

      {/* Corps — messages */}
      <div className="px-5 py-5 space-y-4 bg-canvas/40">
        {/* Message utilisateur */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, ease: messageEase }}
          className="flex justify-end"
        >
          <div className="max-w-[78%] bg-forest-600 text-white rounded-[12px] rounded-br-[4px] px-4 py-2.5">
            <p className="text-[13px] font-sans leading-[1.5]">
              Prépare les factures du mois à partir des heures saisies.
            </p>
          </div>
        </motion.div>

        {/* Message agent — intro */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1, ease: messageEase }}
          className="flex justify-start"
        >
          <div className="max-w-[78%] bg-surface border border-[0.5px] border-border rounded-[12px] rounded-bl-[4px] px-4 py-2.5">
            <p className="text-[13px] font-sans leading-[1.5] text-text-body">
              J&apos;ai préparé <span className="font-semibold text-text-primary">3 brouillons</span> sur la base de{" "}
              <span className="font-mono tabular-nums">25,75 h</span> facturables.
              Total : <span className="font-mono tabular-nums text-forest-600 font-medium">10 485,00 $</span>.
            </p>
            <p className="text-[12px] font-sans italic text-text-muted mt-1.5 leading-[1.5]">
              Un écart de 0,75 h a été détecté sur le dossier Beaulieu — arrondi
              selon vos règles.
            </p>
          </div>
        </motion.div>

        {/* Message agent — cartes facture */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2, ease: messageEase }}
          className="flex justify-start"
        >
          <div className="max-w-[92%] w-full space-y-2">
            {DRAFTS.map((draft, i) => (
              <motion.div
                key={draft.client}
                initial={{ opacity: 0, y: 6 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.35,
                  delay: 0.25 + i * 0.08,
                  ease: messageEase,
                }}
                className="group bg-surface border border-[0.5px] border-border rounded-[8px] px-3.5 py-2.5 flex items-center gap-3 hover:border-forest-600/40 hover:shadow-[0_8px_24px_-12px_rgba(31,58,46,0.2)] transition-[border-color,box-shadow]"
              >
                {/* icône facture */}
                <span className="shrink-0 w-8 h-8 rounded-[6px] bg-[var(--sand-50)] border border-[0.5px] border-border flex items-center justify-center">
                  <FileText
                    className="w-3.5 h-3.5 text-forest-600"
                    strokeWidth={1.75}
                  />
                </span>

                {/* identité */}
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-sans font-semibold text-text-primary truncate leading-tight">
                    {draft.client}
                  </p>
                  <p className="text-[10.5px] font-sans text-text-muted truncate mt-0.5 flex items-center gap-1.5">
                    {draft.matter}
                    <span className="text-text-subtle">·</span>
                    <span className="inline-flex items-center gap-0.5 font-mono tabular-nums">
                      <Clock className="w-2.5 h-2.5" strokeWidth={1.75} />
                      {draft.hours}
                    </span>
                  </p>
                </div>

                {/* montant */}
                <span className="shrink-0 font-mono text-[13px] tabular-nums font-medium text-text-primary">
                  {draft.amount}
                </span>

                {/* actions approuver / refuser */}
                <div className="shrink-0 flex items-center gap-1">
                  <button
                    type="button"
                    aria-label={`Refuser ${draft.client}`}
                    className="w-7 h-7 rounded-[6px] border border-[0.5px] border-border bg-surface hover:border-[#B84A3E]/40 hover:bg-[#B84A3E]/5 transition-colors flex items-center justify-center"
                  >
                    <X
                      className="w-3.5 h-3.5 text-text-muted"
                      strokeWidth={2}
                    />
                  </button>
                  <button
                    type="button"
                    aria-label={`Approuver ${draft.client}`}
                    className="w-7 h-7 rounded-[6px] bg-forest-600 hover:bg-forest-700 transition-colors flex items-center justify-center shadow-[0_4px_12px_-4px_rgba(31,58,46,0.4)]"
                  >
                    <Check
                      className="w-3.5 h-3.5 text-white"
                      strokeWidth={2.5}
                    />
                  </button>
                </div>
              </motion.div>
            ))}

            {/* action globale */}
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: 0.55, ease: messageEase }}
              className="pt-1 flex items-center gap-2"
            >
              <button
                type="button"
                className="group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[7px] bg-text-primary text-white text-[12px] font-sans font-semibold hover:opacity-90 transition-opacity"
              >
                Tout approuver
                <ArrowUpRight
                  className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5"
                  strokeWidth={2}
                />
              </button>
              <span className="text-[11px] font-sans italic text-text-muted">
                Vous gardez le dernier mot.
              </span>
            </motion.div>
          </div>
        </motion.div>

        {/* typing indicator — signale que l'agent peut continuer */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.7 }}
          className="flex items-center gap-1.5 pt-1 pl-1"
        >
          <span className="flex gap-1 items-end h-3">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-forest-600"
                animate={{
                  y: [0, -4, 0],
                  scale: [1, 1.35, 1],
                  opacity: [0.4, 1, 0.4],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.18,
                  ease: [0.45, 0, 0.55, 1],
                }}
              />
            ))}
          </span>
          <span className="text-[11px] font-sans italic text-text-muted">
            Léa analyse les prochains dossiers…
          </span>
        </motion.div>
      </div>
    </div>
  );
}
