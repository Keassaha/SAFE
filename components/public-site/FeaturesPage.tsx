"use client";

/**
 * Fonctionnalités — ordre décidé dans docs/product/PLAN_PAGE_FONCTIONNALITES.md.
 * La conformité ouvre la page : c'est le seul avantage inimitable de SAFE face à un
 * logiciel comptable générique. Chaque section montre une maquette manipulable
 * plutôt qu'une capture figée. Scroll libre, aucun épinglage, aucun émoji.
 */

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { SafeBullet } from "@/components/branding/SafeLogo";
import {
  INK, MUTED, FAINT, GREEN, VERIFIED, LINE, SURFACE, BG, EASE, R,
  PageShell, PageHeader,
} from "./shared";
import {
  MockupDepotConforme,
  MockupFicheDeTemps,
  MockupEnvoiFacture,
  MockupAppComplete,
  MockupCartable,
  MockupDossier,
} from "./mockups";

type Section = {
  cle: string;
  label: string;
  titre: string;
  corps: string[];
  points?: string[];
  visuel: React.ReactNode;
  fond: string;
  inverse?: boolean;
};

const SECTIONS: Section[] = [
  {
    cle: "conformite",
    label: "La conformité, par conception",
    titre: "Le système connaît les règles. Il vous arrête avant l'erreur.",
    corps: [
      "SAFE n'est pas un logiciel comptable auquel on a ajouté du juridique. Il est construit à partir des obligations qui encadrent un cabinet au Québec et en Ontario : fidéicommis, tenue de livres, rapports, plafonds.",
      "Certaines actions ne sont pas seulement signalées, elles sont refusées, et le système vous dit pourquoi.",
    ],
    points: [
      "Un dépôt en espèces au-delà du plafond applicable est refusé, la règle est citée",
      "La certification d'un rapprochement reste bloquée tant qu'un écart subsiste",
      "L'état de conformité du cabinet est visible en permanence, domaine par domaine",
    ],
    visuel: <MockupDepotConforme />,
    fond: SURFACE,
  },
  {
    cle: "cartable",
    label: "Le dossier arrive structuré",
    titre: "Vous ouvrez un dossier. Le cartable est déjà monté.",
    corps: [
      "À l'ouverture d'un dossier, SAFE monte le cartable réglementaire du domaine concerné. Vous ne créez pas les sections et vous ne cherchez pas la bonne nomenclature : elle est là, avec sa source.",
      "En droit de la famille, les pièces se rangent en P- et D- selon le Règlement de la Cour du Québec. Un dossier criminel a sa phase préjudiciaire, un dossier immobilier son examen de titre. Vous déposez vos pièces, elles se classent.",
    ],
    visuel: <MockupCartable />,
    fond: BG,
    inverse: true,
  },
  {
    cle: "temps",
    label: "Le temps",
    titre: "Deux façons de compter. Aucune de les oublier.",
    corps: [
      "Certains avocats facturent à l'heure, d'autres au forfait, souvent les deux dans le même cabinet. SAFE prend les deux au même endroit.",
      "Le chronomètre tourne pendant que vous travaillez, ou vous inscrivez la durée après coup. Chaque entrée est reliée à son dossier, donc rien ne se perd d'ici la facture.",
    ],
    visuel: <MockupFicheDeTemps />,
    fond: SURFACE,
  },
  {
    cle: "facturation",
    label: "La facturation",
    titre: "Vous cliquez « envoyer ». Le reste est déjà écrit.",
    corps: [
      "L'avocat fait deux choses : saisir son temps, relire la facture. Au moment de l'envoi, la facture part au client et SAFE passe seul les écritures comptables : le produit, les taxes, la créance, l'affectation au dossier.",
      "Rien à reporter dans un autre logiciel. Rien à ressaisir en fin de mois.",
    ],
    visuel: <MockupEnvoiFacture />,
    fond: BG,
    inverse: true,
  },
  {
    cle: "rappels",
    label: "Les rappels",
    titre: "Les factures oubliées ne le restent pas.",
    corps: [
      "Passé le délai que vous fixez, SAFE signale les factures en souffrance et prépare les rappels. Vous approuvez, ils partent.",
      "Ce n'est pas une relance agressive. C'est le suivi qu'une adjointe ferait si elle avait le temps de tout regarder chaque semaine.",
    ],
    visuel: <MockupAppComplete />,
    fond: SURFACE,
  },
  {
    cle: "dossiers",
    label: "Les dossiers",
    titre: "Chaque affaire garde son contexte.",
    corps: [
      "Clients, parties, documents, échéances, temps et débours restent reliés au dossier concerné. Vous cherchez moins et vous reprenez le travail plus facilement.",
    ],
    visuel: <MockupDossier />,
    fond: BG,
    inverse: true,
  },
];

function SectionFonction({ s, index }: { s: Section; index: number }) {
  return (
    <section
      id={s.cle}
      className="scroll-mt-20 px-6 py-16 sm:py-24"
      style={{ background: s.fond, borderTop: `1px solid ${LINE}` }}
    >
      <div className="mx-auto grid max-w-[1140px] gap-9 sm:gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: EASE }}
          className={s.inverse ? "lg:order-2" : ""}
        >
          <p className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.14em]" style={{ color: GREEN }}>
            <span style={{ color: FAINT }}>{String(index + 1).padStart(2, "0")}</span>
            {s.label}
          </p>
          <h2
            className="mt-4 max-w-[19ch] font-serif text-[28px] font-normal leading-[1.14] sm:text-[38px]"
            style={{ color: INK, letterSpacing: "-0.018em" }}
          >
            {s.titre}
          </h2>
          <div className="mt-5 max-w-[48ch] space-y-3.5 font-sans text-[16px] leading-[1.68]" style={{ color: MUTED }}>
            {s.corps.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          {s.points ? (
            <ul className="mt-6 space-y-2.5">
              {s.points.map((p, i) => (
                <motion.li
                  key={p}
                  initial={{ opacity: 0, x: 12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.12 + i * 0.09, duration: 0.45, ease: EASE }}
                  className="flex gap-3 font-sans text-[14.5px] leading-[1.55]"
                  style={{ color: INK }}
                >
                  <span className="mt-[7px] shrink-0" style={{ color: GREEN }}>
                    <SafeBullet size={11} />
                  </span>
                  {p}
                </motion.li>
              ))}
            </ul>
          ) : null}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ delay: 0.1, duration: 0.75, ease: EASE }}
          className={s.inverse ? "lg:order-1" : ""}
        >
          {s.visuel}
        </motion.div>
      </div>
    </section>
  );
}

export default function FonctionnalitesPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Fonctionnalités"
        titre="Bâti sur les règles qui encadrent un cabinet, pas adapté après coup."
        intro="SAFE fonctionne comme l'assistant de votre adjointe. Ou comme votre adjointe, si vous n'en avez pas."
      />

      {/* Sommaire cliquable, pour donner la mesure de la page */}
      <section className="px-6 pb-10 sm:pb-12" style={{ background: BG }}>
        <div className="mx-auto flex max-w-[1140px] flex-wrap gap-2">
          {SECTIONS.map((s, i) => (
            <a
              key={s.cle}
              href={`#${s.cle}`}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-full border px-4 py-2 font-sans text-[13px] transition-colors hover:bg-black/[0.03] sm:min-h-0 sm:px-3.5 sm:py-1.5 sm:text-[12.5px]"
              style={{ borderColor: LINE, color: MUTED }}
            >
              <span className="font-mono text-[11px]" style={{ color: FAINT }}>{String(i + 1).padStart(2, "0")}</span>
              {s.label}
            </a>
          ))}
        </div>
      </section>

      {SECTIONS.map((s, i) => (
        <SectionFonction key={s.cle} s={s} index={i} />
      ))}

      {/* La limite */}
      <section className="px-6 py-16 sm:py-24" style={{ background: SURFACE, borderTop: `1px solid ${LINE}` }}>
        <div className="mx-auto max-w-[640px]">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-mono text-[11px] uppercase tracking-[0.14em]"
            style={{ color: FAINT }}
          >
            La limite
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, ease: EASE }}
            className="mt-4 font-serif text-[27px] font-normal leading-[1.16] sm:text-[34px]"
            style={{ color: INK, letterSpacing: "-0.016em" }}
          >
            Ce que SAFE ne remplace pas.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08, duration: 0.65, ease: EASE }}
            className="mt-5 font-sans text-[16.5px] leading-[1.7]"
            style={{ color: MUTED }}
          >
            SAFE ne remplace ni votre jugement professionnel, ni la personne qui connaît le
            cabinet, ni votre comptable de fin d&apos;année. Il soutient le suivi de vos
            obligations sans s&apos;y substituer. La responsabilité professionnelle demeure
            celle du cabinet.
          </motion.p>

          <div className="mt-10 flex flex-wrap items-center gap-5">
            <Link
              href={R.diagnostic}
              className="inline-flex h-11 items-center rounded-[7px] px-6 font-sans text-[14px] font-medium transition-transform duration-200 hover:-translate-y-0.5"
              style={{ background: GREEN, color: "#fff", boxShadow: "0 14px 28px -18px rgba(18,161,80,0.85)" }}
            >
              Faire le diagnostic
            </Link>
            <Link href={R.demo} className="font-sans text-[14px]" style={{ color: INK }}>
              Réserver une rencontre
            </Link>
          </div>

          <p className="mt-10 font-sans text-[12.5px] leading-[1.6]" style={{ color: VERIFIED }}>
            Les écrans de cette page sont des maquettes manipulables, sur des données
            fictives. Elles reproduisent l&apos;interface de SAFE sans être le logiciel.
          </p>
        </div>
      </section>
    </PageShell>
  );
}
