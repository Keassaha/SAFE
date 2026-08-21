"use client";

/**
 * SAFE Cabinet — les fonctions essentielles.
 *
 * Refonte du 2026-08-20. La page était un catalogue de six sections de poids
 * égal, ouvert par la conformité et fermé par les dossiers. Elle raconte
 * maintenant une journée de cabinet, dans l'ordre où le travail se fait :
 * ce qui demande une intervention aujourd'hui, le dossier qui porte le
 * contexte, le travail qui devient facturable, l'argent qui circule, et les
 * fonds des clients qu'il faut vérifier avant de certifier.
 *
 * Trois règles ont commandé la réécriture.
 *
 * 1. Une affirmation par écran réel. Chaque preuve renvoie à une page du
 *    produit, vérifiée dans le code avant d'être publiée. Ce qui n'est pas
 *    atteignable depuis l'application n'est pas annoncé ici : c'est pourquoi
 *    la section des rappels a disparu (`createReminder` existe dans
 *    lib/services/billing/reminder-service.ts et n'est appelé par aucun
 *    écran). Les factures en retard restent montrées, parce qu'elles sont
 *    visibles ; leur relance ne l'est pas, parce qu'elle ne part pas.
 * 2. Aucune composition ne se répète. Pas d'alternance texte à gauche, image
 *    à droite jusqu'au pied de page (DESIGN_HUMAIN A17) : la journée est
 *    empilée, le dossier est en deux colonnes, le travail facturable prend
 *    toute la largeur, les finances montrent deux registres côte à côte, le
 *    fidéicommis inverse l'ordre une seule fois.
 * 3. La conformité n'ouvre plus la page. Elle reste la preuve la plus
 *    distinctive de SAFE, et elle arrive à sa place : à la fin, sur les fonds
 *    des clients, là où elle se démontre au lieu de s'annoncer.
 *
 * Palette et composants : ceux du site actuel (`shared.tsx`, jetons `si-*`,
 * palette Ardoise). Aucune couleur écrite en dur.
 */

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  INK, MUTED, PROSE, FAINT, GREEN, VERIFIED, LINE, LINE_SOFT, SURFACE, BG, EASE, R,
  PageShell, PaperDrift, fadeUp,
} from "./shared";
import {
  MockupAujourdhui,
  MockupTravailFacturable,
  MockupFactureEtPaiement,
  MockupJournaux,
  MockupRapprochement,
  MockupDossier,
  DetailCartable,
} from "./mockups";

/* Pas de rail de section ici, contrairement à l'accueil et à la tarification.
   Le rail est fixé à droite de la fenêtre, et les preuves de cette page vont
   jusqu'au bord du conteneur : à 1280 px, « Temps et débours » se posait sur la
   maquette. Un repère de lecture qui masque la preuve coûte plus qu'il ne
   rapporte, et la page se suit très bien sans lui. */

/* ── Grammaire commune des sections ──────────────────────────────────────── */

function Exergue({ children, index }: { children: React.ReactNode; index: string }) {
  return (
    <motion.p
      {...fadeUp(0)}
      className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.14em]"
      style={{ color: MUTED }}
    >
      <span style={{ color: FAINT }}>{index}</span>
      {children}
    </motion.p>
  );
}

function Titre({ children, large }: { children: React.ReactNode; large?: boolean }) {
  return (
    <motion.h2
      {...fadeUp(0.06)}
      className={`mt-4 font-serif font-normal leading-[1.14] ${
        large ? "text-[30px] sm:max-w-[22ch] sm:text-[42px]" : "text-[28px] sm:max-w-[19ch] sm:text-[38px]"
      }`}
      style={{ color: INK, letterSpacing: "-0.018em" }}
    >
      {children}
    </motion.h2>
  );
}

function Prose({ paragraphes, delai = 0.12 }: { paragraphes: string[]; delai?: number }) {
  return (
    <div className="mt-5 max-w-[52ch] space-y-3.5 font-sans text-[16px] leading-[1.68]" style={{ color: PROSE }}>
      {paragraphes.map((p, i) => (
        <motion.p key={i} {...fadeUp(delai + i * 0.06)}>
          {p}
        </motion.p>
      ))}
    </div>
  );
}

/** Enveloppe d'une preuve : elle entre une fois, sans déplacement au survol. */
function Preuve({ children, delai = 0.08 }: { children: React.ReactNode; delai?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      data-revele=""
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ delay: delai, duration: 0.86, ease: EASE }}
      className="min-w-0"
    >
      {children}
    </motion.div>
  );
}

function Section({
  id,
  fond,
  children,
}: {
  id?: string;
  fond: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-20 px-6 py-16 sm:py-24"
      style={{ background: fond, borderTop: `1px solid ${LINE}` }}
    >
      <div className="mx-auto max-w-[1140px]">{children}</div>
    </section>
  );
}

/* ── 01 · Le hero ─────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pb-16 pt-28 sm:pb-20 sm:pt-36" style={{ background: BG }}>
      <PaperDrift />
      <div className="relative mx-auto max-w-[1140px]">
        <motion.p
          {...fadeUp(0)}
          className="font-mono text-[12px] uppercase tracking-[0.14em]"
          style={{ color: FAINT }}
        >
          SAFE Cabinet
        </motion.p>
        <motion.h1
          {...fadeUp(0.06)}
          className="mt-4 font-serif text-[33px] leading-[1.08] sm:max-w-[20ch] sm:text-[52px]"
          style={{ color: INK, letterSpacing: "-0.018em" }}
        >
          L’administration de votre cabinet, reliée de bout en bout.
        </motion.h1>
        <motion.p
          {...fadeUp(0.12)}
          className="mt-6 max-w-[56ch] font-sans text-[16.5px] leading-[1.6] sm:text-[19px]"
          style={{ color: PROSE }}
        >
          SAFE rassemble le travail quotidien, les dossiers, le temps, la facturation, les
          paiements, la comptabilité et le fidéicommis dans un même système.
        </motion.p>
        <motion.p
          {...fadeUp(0.16)}
          className="mt-4 max-w-[56ch] font-sans text-[16px] leading-[1.65]"
          style={{ color: MUTED }}
        >
          Découvrez les fonctions essentielles qui permettent à l’équipe de voir ce qui avance, ce
          qui attend et ce qui doit être vérifié.
        </motion.p>
        <motion.div {...fadeUp(0.22)} className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Link
            href={R.diagnostic}
            className="safe-zoom inline-flex h-11 items-center rounded-[7px] px-6 font-sans text-[14px] font-medium transition-transform duration-200"
            style={{ background: GREEN, color: "#fff", boxShadow: "0 14px 28px -18px rgb(var(--si-forest-rgb) / 0.85)" }}
          >
            Évaluer mon cabinet
          </Link>
          <Link href={R.demo} className="font-sans text-[14px]" style={{ color: INK }}>
            Voir une démonstration
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

/* ── 02 · Le travail administratif du jour ────────────────────────────────
   Empilée, et non en deux colonnes : la journée est un seul écran, et la
   preuve doit occuper toute la largeur pour qu'on lise la file. */

function SectionJournee() {
  return (
    <Section id="journee" fond={SURFACE}>
      <div className="max-w-[62ch]">
        <Exergue index="01">Aujourd’hui dans le cabinet</Exergue>
        <Titre large>Ce qui demande votre attention remonte au même endroit.</Titre>
        <Prose
          paragraphes={[
            "Dossiers à compléter, échéances, factures en attente, opérations à vérifier et tâches administratives sont regroupés dans une vue commune.",
            "L’équipe voit ce qui doit être traité maintenant, sans devoir ouvrir chaque dossier pour le découvrir.",
          ]}
        />
      </div>
      <div className="mt-10 sm:mt-12">
        <Preuve>
          <MockupAujourdhui />
        </Preuve>
      </div>
    </Section>
  );
}

/* ── 03 · Clients et dossiers ─────────────────────────────────────────────
   Deux colonnes. Le cartable vit sous le texte, une taille en dessous : il
   prouve que le dossier arrive structuré, il ne réclame plus sa section. */

function SectionDossiers() {
  return (
    <Section id="dossiers" fond={BG}>
      <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start lg:gap-16">
        <div className="min-w-0">
          <Exergue index="02">Le contexte du cabinet</Exergue>
          <Titre>Chaque affaire conserve son histoire et ses prochaines étapes.</Titre>
          <Prose
            paragraphes={[
              "Clients, parties, documents, échéances, notes, temps et débours restent reliés au dossier concerné.",
              "À l’ouverture, SAFE peut préparer une structure adaptée au domaine de pratique. L’équipe reprend le travail sans devoir reconstruire le contexte.",
            ]}
          />
        </div>
        <Preuve>
          <MockupDossier />
        </Preuve>
      </div>
      <motion.div {...fadeUp(0.12)} className="mt-10 border-t pt-7 sm:mt-12" style={{ borderColor: LINE }}>
        <DetailCartable />
      </motion.div>
    </Section>
  );
}

/* ── 04 · Temps, débours et travail facturable ────────────────────────────
   Le titre et la prose se partagent la largeur en deux colonnes de texte,
   puis la preuve prend toute la page : c'est une chaîne, elle se lit d'un
   bord à l'autre. */

function SectionTravail() {
  return (
    <Section id="travail" fond={SURFACE}>
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end lg:gap-16">
        <div className="min-w-0">
          <Exergue index="03">Du travail consigné au travail facturé</Exergue>
          <Titre>Le travail est inscrit une fois, au moment où il se fait.</Titre>
        </div>
        <Prose
          paragraphes={[
            "Le temps peut être enregistré par chronomètre ou après le travail. Les débours et les dépenses refacturables se rattachent au même dossier.",
            "Chaque élément reste prêt pour la facturation, sans devoir être retranscrit à la fin du mois.",
          ]}
        />
      </div>
      <div className="mt-10 sm:mt-12">
        <Preuve>
          <MockupTravailFacturable />
        </Preuve>
      </div>
    </Section>
  );
}

/* ── 05 · Facturation, paiements et comptabilité ──────────────────────────
   Deux preuves côte à côte, et c'est l'argument : la facturation et la
   comptabilité sont deux fonctions distinctes qui partagent un contexte. Une
   seule maquette les aurait fondues, ce qui est précisément l'erreur à ne pas
   commettre ici. */

function SectionFinances() {
  return (
    <Section id="finances" fond={BG}>
      <div className="max-w-[62ch]">
        <Exergue index="04">Une continuité financière</Exergue>
        <Titre large>La facture, le paiement et l’écriture comptable restent reliés.</Titre>
        <Prose
          paragraphes={[
            "Le travail consigné devient une facture. Les taxes sont calculées selon la configuration du cabinet. Lorsqu’un paiement est reçu, il se rattache à la bonne facture et met à jour le solde à recevoir.",
            "Les revenus, les dépenses, les taxes et les mouvements comptables restent disponibles dans les journaux du cabinet.",
          ]}
        />
      </div>
      <div className="mt-10 grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-start lg:gap-10 sm:mt-12">
        <Preuve>
          <MockupFactureEtPaiement />
        </Preuve>
        <Preuve delai={0.16}>
          <MockupJournaux />
        </Preuve>
      </div>
      <motion.p
        {...fadeUp(0.1)}
        className="mt-8 max-w-[64ch] font-sans text-[14px] leading-[1.65]"
        style={{ color: MUTED }}
      >
        Les factures en retard et les créances restent visibles, par client et par ancienneté du
        retard. Le suivi auprès du client demeure entre les mains du cabinet.
      </motion.p>
    </Section>
  );
}

/* ── 06 · Fidéicommis et vérifications ────────────────────────────────────
   La seule inversion de la page : la preuve d'abord, le texte ensuite. Elle
   est justifiée, un rapprochement se lit comme un registre, et l'ordre des
   trois soldes porte l'argument avant la phrase qui l'explique. */

function SectionFideicommis() {
  return (
    <Section id="fideicommis" fond={SURFACE}>
      {/* Au pouce, le titre reste en tête : on lit ce qu'on regarde avant de le
          regarder. C'est au large seulement que la preuve passe à gauche. */}
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div className="min-w-0">
          <Exergue index="05">Les fonds des clients</Exergue>
          <Titre>Ce qui doit concorder est vérifié avant d’être certifié.</Titre>
          <Prose
            paragraphes={[
              "SAFE tient les mouvements du fidéicommis séparément des opérations du cabinet. Le relevé bancaire, le registre et les soldes détenus par dossier sont rapprochés dans une même vue.",
              "Un écart demeure visible jusqu’à sa résolution. Les corrections s’ajoutent au journal sans effacer l’écriture d’origine.",
            ]}
          />
          <motion.p
            {...fadeUp(0.26)}
            className="mt-7 border-l-2 pl-4 font-sans text-[15px] leading-[1.6]"
            style={{ borderColor: VERIFIED, color: INK }}
          >
            SAFE soutient la tenue, la vérification et la traçabilité. La responsabilité
            professionnelle demeure celle du cabinet.
          </motion.p>
        </div>
        <div className="min-w-0 lg:order-first">
          <Preuve>
            <MockupRapprochement />
          </Preuve>
        </div>
      </div>
    </Section>
  );
}

/* ── 07 · Également dans SAFE Cabinet ─────────────────────────────────────
   Un registre, pas une grille de cartes à icônes. Chaque entrée renvoie à un
   écran réel du produit, vérifié le 2026-08-20. Une phrase, jamais deux. */

const EGALEMENT: [string, string][] = [
  ["Équipe et permissions", "Chaque personne du cabinet a un rôle, et le rôle décide de ce qu’elle voit."],
  ["Documents et cartables par domaine", "Les pièces se rangent dans les sections du domaine, avec leur source."],
  ["Rapports administratifs et financiers", "Activité, honoraires, encaissement et rentabilité sur la période choisie."],
  ["Vérification de l’identité et des conflits", "Les méthodes proposées suivent le régime applicable au cabinet."],
  ["Importation de données", "Vos clients, dossiers et historiques arrivent depuis un fichier."],
  ["Interface en français et en anglais", "Chaque personne bascule l’interface d’une langue à l’autre."],
  ["Paramètres de facturation du cabinet", "Numéros de taxes, apparence de la facture, mode de facturation."],
];

function SectionEgalement() {
  return (
    <Section fond={BG}>
      <motion.h2
        {...fadeUp(0)}
        className="font-serif text-[27px] font-normal leading-[1.16] sm:text-[34px]"
        style={{ color: INK, letterSpacing: "-0.016em" }}
      >
        Également dans SAFE Cabinet
      </motion.h2>
      <ul className="mt-8 border-b" style={{ borderColor: LINE }}>
        {EGALEMENT.map(([titre, ligne], i) => (
          <motion.li
            key={titre}
            initial={{ opacity: 0, y: 8 }}
            data-revele=""
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.04 + i * 0.06, duration: 0.7, ease: EASE }}
            className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border-t py-3.5 sm:grid-cols-[auto_minmax(0,26ch)_1fr] sm:gap-x-6"
            style={{ borderColor: LINE }}
          >
            <span className="font-mono text-[11px] tabular-nums leading-[1.9]" style={{ color: FAINT }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="font-sans text-[15px] leading-[1.5]" style={{ color: INK }}>{titre}</span>
            <span className="col-start-2 font-sans text-[14px] leading-[1.55] sm:col-start-3" style={{ color: MUTED }}>
              {ligne}
            </span>
          </motion.li>
        ))}
      </ul>
      <motion.p {...fadeUp(0.1)} className="mt-5 max-w-[64ch] font-sans text-[13.5px] leading-[1.6]" style={{ color: FAINT }}>
        D’autres capacités sont en préparation. Elles ne sont annoncées ici qu’une fois utilisables
        dans l’application.
      </motion.p>
    </Section>
  );
}

/* ── 08 · Ce que SAFE ne remplace pas, et la suite ────────────────────────── */

function SectionLimites() {
  return (
    <section className="px-6 py-16 sm:py-24" style={{ background: SURFACE, borderTop: `1px solid ${LINE}` }}>
      <div className="mx-auto max-w-[1140px]">
        <motion.p
          {...fadeUp(0)}
          className="font-mono text-[11px] uppercase tracking-[0.14em]"
          style={{ color: FAINT }}
        >
          Ce que SAFE ne remplace pas
        </motion.p>
        <motion.h2
          {...fadeUp(0.06)}
          className="mt-4 max-w-[24ch] font-serif text-[27px] font-normal leading-[1.16] sm:max-w-[30ch] sm:text-[34px]"
          style={{ color: INK, letterSpacing: "-0.016em" }}
        >
          Le système soutient le travail. Votre équipe conserve le jugement.
        </motion.h2>
        <motion.p
          {...fadeUp(0.12)}
          className="mt-5 max-w-[62ch] font-sans text-[16.5px] leading-[1.7]"
          style={{ color: PROSE }}
        >
          SAFE ne remplace ni le jugement professionnel de l’avocate, ni la personne qui connaît le
          cabinet, ni le rôle du comptable. Il organise l’information, prépare le travail et rend
          visibles les éléments qui demandent une intervention.
        </motion.p>
        <motion.p
          {...fadeUp(0.16)}
          className="mt-3.5 max-w-[62ch] font-sans text-[16.5px] leading-[1.7]"
          style={{ color: PROSE }}
        >
          La responsabilité professionnelle demeure celle du cabinet.
        </motion.p>

        <motion.div {...fadeUp(0.22)} className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-5">
          <Link
            href={R.diagnostic}
            className="safe-zoom inline-flex h-11 items-center rounded-[7px] px-6 font-sans text-[14px] font-medium transition-transform duration-200"
            style={{ background: GREEN, color: "#fff", boxShadow: "0 14px 28px -18px rgb(var(--si-forest-rgb) / 0.85)" }}
          >
            Évaluer mon cabinet
          </Link>
          <Link href={R.demo} className="font-sans text-[14px]" style={{ color: INK }}>
            Réserver une rencontre
          </Link>
        </motion.div>
        <motion.p {...fadeUp(0.26)} className="mt-4 font-sans text-[13px]" style={{ color: MUTED }}>
          Gratuit, sans carte de crédit. Rapport sous 24 heures.
        </motion.p>

        <motion.p
          {...fadeUp(0.3)}
          className="mt-12 max-w-[74ch] border-t pt-5 font-sans text-[12.5px] leading-[1.6]"
          style={{ borderColor: LINE_SOFT, color: FAINT }}
        >
          Les écrans de cette page sont des maquettes manipulables, sur des données fictives. Elles
          reproduisent l’interface de SAFE sans être le logiciel.
        </motion.p>
      </div>
    </section>
  );
}

export default function FonctionnalitesPage() {
  return (
    <PageShell>
      <Hero />
      <SectionJournee />
      <SectionDossiers />
      <SectionTravail />
      <SectionFinances />
      <SectionFideicommis />
      <SectionEgalement />
      <SectionLimites />
    </PageShell>
  );
}
