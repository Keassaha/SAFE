"use client";

/**
 * À propos — l'origine, la vision et la méthode de SAFE.
 *
 * Refonte du 2026-08-21. La page précédente était un récit verrouillé de cinq
 * chapitres, piloté au défilement : sommaire collant, trace animée dans la
 * marge, titres qui se réduisaient une fois lus, chaîne horizontale de six
 * domaines. Elle racontait bien une chose, comment un fichier Excel est devenu
 * un logiciel, et elle s'arrêtait là.
 *
 * Ce qu'elle raconte maintenant : comment un problème administratif observé
 * dans un cabinet est devenu une suite administrative. L'origine reste, elle
 * n'est plus toute l'identité de SAFE.
 *
 * Trois décisions ont commandé la réécriture.
 *
 * 1. La page tient sans JavaScript et sans mouvement. Plus rien n'est révélé
 *    par le défilement au sens fort du terme : les entrées passent par
 *    `fadeUp` de shared.tsx, qui est coupé par `prefers-reduced-motion` via
 *    l'attribut `data-revele` (globals.css). Le sommaire collant, la trace et
 *    la réduction des titres ont disparu : trois mécanismes de lecture pour
 *    une page qui se lit très bien en descendant.
 *
 * 2. La grammaire est celle du site actuel, pas une grammaire propre à cette
 *    page. Sections alternées `BG` / `SURFACE` posées sur un filet, exergue
 *    mono numérotée, titre serif, prose Geist, preuves encadrées : la même
 *    que `FeaturesPage.tsx`, refondue le 2026-08-20. Aucune couleur en dur,
 *    aucun jeton local, aucune feuille de style injectée.
 *
 * 3. Aucune composition ne se répète (DESIGN_HUMAIN A17). Le constat pose le
 *    titre à gauche et les ruptures à droite, le premier SAFE tient une
 *    colonne d'artefact étroite, l'application passe la preuve à droite, la
 *    suite hiérarchise trois blocs de poids inégaux, la méthode est un
 *    registre numéroté, le fondateur revient à une colonne unique.
 *
 * Ce qui est montré est vérifié :
 * - le portrait est celui du fondateur, déjà servi par la page précédente ;
 * - `/images/a-propos/classeur-origine.png` est un recadrage de la capture du
 *   classeur d'origine fournie par le CEO
 *   (`public/experience-assets/excel-avant.jpg`, provenance au journal du
 *   2026-07-25). Le recadrage ne retient que le sommaire : aucun nom, aucun
 *   montant, aucun numéro de dossier ne quitte le fichier source ;
 * - l'outil nommé au §5 est le seul publié (`/calculateurs`). La pension
 *   alimentaire est en construction et n'est pas annoncée ici.
 */

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  INK, MUTED, PROSE, FAINT, GREEN, VERIFIED, LINE, LINE_SOFT, SURFACE, BG, EASE, R,
  PageShell, PaperDrift, fadeUp,
} from "./shared";
import { MockupFactureEtPaiement } from "./mockups";

/* ── Grammaire commune des sections ───────────────────────────────────────
   Reprise de FeaturesPage : même exergue, même échelle de titres, même
   mesure de prose. Elle est recopiée plutôt qu'extraite dans shared.tsx pour
   ne pas toucher un fichier déjà modifié par un autre chantier. */

function Exergue({ children, index }: { children: React.ReactNode; index: string }) {
  return (
    <motion.p
      {...fadeUp(0)}
      className="flex items-baseline gap-2.5 font-mono text-[11px] uppercase tracking-[0.14em]"
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
        large ? "text-[30px] sm:max-w-[22ch] sm:text-[42px]" : "text-[28px] sm:max-w-[20ch] sm:text-[38px]"
      }`}
      style={{ color: INK, letterSpacing: "-0.018em" }}
    >
      {children}
    </motion.h2>
  );
}

function Prose({
  paragraphes,
  delai = 0.12,
  classe = "mt-5",
}: {
  paragraphes: string[];
  delai?: number;
  classe?: string;
}) {
  return (
    <div className={`${classe} max-w-[54ch] space-y-3.5 font-sans text-[16px] leading-[1.68]`} style={{ color: PROSE }}>
      {paragraphes.map((p, i) => (
        <motion.p key={i} {...fadeUp(delai + i * 0.06)}>
          {p}
        </motion.p>
      ))}
    </div>
  );
}

/** La phrase qui ferme une section. Serif, parce qu'elle tranche, jamais parce
    qu'elle décore : c'est le registre éditorial du site, pas un troisième
    palier de titre. */
function Conclusion({ children, delai = 0.14 }: { children: React.ReactNode; delai?: number }) {
  return (
    <motion.p
      {...fadeUp(delai)}
      className="mt-10 max-w-[46ch] font-serif text-[21px] leading-[1.4] sm:mt-12 sm:text-[25px]"
      style={{ color: INK, letterSpacing: "-0.012em" }}
    >
      {children}
    </motion.p>
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

function Section({ id, fond, children }: { id?: string; fond: string; children: React.ReactNode }) {
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

/* ── 01 · Le hero ─────────────────────────────────────────────────────────
   Le problème est dans le titre, et le fondateur est identifié dès le premier
   écran : la page précédente le faisait arriver au cinquième chapitre. Le
   portrait reste subordonné, une signature à côté du texte au large, une
   rangée sous le texte au pouce. L'histoire de SAFE garde la colonne. */

function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pb-16 pt-28 sm:pb-20 sm:pt-36" style={{ background: BG }}>
      <PaperDrift />
      <div className="relative mx-auto max-w-[1140px]">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-end lg:gap-16">
          <div className="min-w-0">
            <motion.p
              {...fadeUp(0)}
              className="font-mono text-[12px] uppercase tracking-[0.14em]"
              style={{ color: FAINT }}
            >
              À propos de SAFE
            </motion.p>
            <motion.h1
              {...fadeUp(0.06)}
              className="mt-4 font-serif text-[33px] leading-[1.08] sm:max-w-[20ch] sm:text-[52px]"
              style={{ color: INK, letterSpacing: "-0.018em" }}
            >
              SAFE est né dans l’administration réelle d’un cabinet.
            </motion.h1>
            <motion.p
              {...fadeUp(0.12)}
              className="mt-6 max-w-[58ch] font-sans text-[16.5px] leading-[1.62] sm:text-[19px]"
              style={{ color: PROSE }}
            >
              Avant d’être une application, SAFE était une réponse à un problème concret : trop
              d’informations dispersées, trop de tâches répétées et trop de travail administratif
              reposant sur la mémoire de l’équipe.
            </motion.p>
          </div>

          <motion.div
            {...fadeUp(0.2)}
            className="flex items-center gap-4 border-t pt-6 lg:justify-end lg:border-t-0 lg:pt-0"
            style={{ borderColor: LINE }}
          >
            <Image
              src="/images/fondateur/portrait.jpg"
              alt="Jérémie Tiahou, fondateur de SAFE"
              width={328}
              height={410}
              priority
              sizes="(max-width: 1023px) 84px, 168px"
              className="h-auto w-[84px] shrink-0 rounded-[10px] object-cover lg:w-[168px]"
            />
            <div className="min-w-0">
              <p className="font-sans text-[15.5px] leading-[1.35]" style={{ color: INK }}>
                Jérémie Tiahou
              </p>
              <p className="mt-1 font-sans text-[13.5px] leading-[1.4]" style={{ color: MUTED }}>
                Fondateur de SAFE
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ── 02 · Le point de départ ──────────────────────────────────────────────
   Le titre tient une colonne, les ruptures l'autre. Chacune vit sur sa propre
   rangée, séparée par un filet : c'est la composition qui fait sentir la
   dispersion, pas une mosaïque de logos de logiciels. */

const RUPTURES = [
  "Le temps devait être retrouvé.",
  "Les factures étaient reconstruites.",
  "Les paiements et les opérations comptables étaient suivis séparément.",
];

function SectionConstat() {
  return (
    <Section id="constat" fond={SURFACE}>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start lg:gap-16">
        <div className="min-w-0">
          <Exergue index="01">Le constat</Exergue>
          <Titre>Le travail juridique avançait. L’administration suivait difficilement.</Titre>
        </div>

        <div className="min-w-0">
          <Prose
            classe="mt-0"
            delai={0.1}
            paragraphes={[
              "Les dossiers progressaient, mais les informations nécessaires à leur gestion vivaient dans plusieurs fichiers et plusieurs outils.",
            ]}
          />
          <ul className="mt-7 border-b" style={{ borderColor: LINE }}>
            {RUPTURES.map((ligne, i) => (
              <motion.li
                key={ligne}
                initial={{ opacity: 0, y: 8 }}
                data-revele=""
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.16 + i * 0.08, duration: 0.7, ease: EASE }}
                className="border-t py-4 font-sans text-[16px] leading-[1.5]"
                style={{ borderColor: LINE, color: INK }}
              >
                {ligne}
              </motion.li>
            ))}
          </ul>
          <motion.p
            {...fadeUp(0.4)}
            className="mt-5 max-w-[52ch] font-sans text-[15px] leading-[1.65]"
            style={{ color: MUTED }}
          >
            Chaque rupture demandait une nouvelle vérification ou une nouvelle saisie.
          </motion.p>
        </div>
      </div>

      <Conclusion>
        Le problème ne venait pas de l’équipe. Il venait d’un système qui ne partageait pas le
        contexte du cabinet.
      </Conclusion>
    </Section>
  );
}

/* ── 03 · Le premier SAFE ─────────────────────────────────────────────────
   L'artefact tient une colonne étroite et fixe, pas la moitié de la page : il
   prouve le point de départ, il ne devient pas le sujet. Il est recadré sur le
   sommaire du classeur, la seule zone qui ne porte ni nom ni montant. */

function SectionPremierSafe() {
  return (
    <Section id="premier-safe" fond={BG}>
      {/* Centré, pas aligné en haut : la colonne de texte fait la moitié de la
          hauteur de l'artefact, et un alignement par le haut laisserait un vide
          sous elle qui se lit comme un oubli. */}
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_208px] lg:items-center lg:gap-16">
        <div className="min-w-0">
          <Exergue index="02">Commencer simplement</Exergue>
          <Titre>La première version de SAFE était un fichier Excel.</Titre>
          <Prose
            paragraphes={[
              "Il ne s’agissait pas encore de construire une entreprise technologique. Il fallait d’abord rassembler une comptabilité éparpillée et rendre le travail plus facile à suivre.",
              "À mesure que les tâches et les informations ont été reliées, le fichier est devenu un véritable système de travail.",
            ]}
          />
          <motion.blockquote
            {...fadeUp(0.24)}
            className="mt-8 max-w-[46ch] border-l-2 pl-5 font-serif text-[19px] leading-[1.45] sm:text-[22px]"
            style={{ borderColor: VERIFIED, color: INK }}
          >
            Organiser le système autour du cabinet, plutôt que demander au cabinet de s’organiser
            autour de son logiciel.
          </motion.blockquote>
        </div>

        <Preuve delai={0.14}>
          <figure className="w-[136px] sm:w-[188px] lg:w-full">
            <div className="rounded-[12px] border p-2.5" style={{ background: SURFACE, borderColor: LINE }}>
              <Image
                src="/images/a-propos/classeur-origine.png"
                alt="Sommaire du classeur Excel d’origine : tableau de bord, temps, facturation, paiements, dépenses et débours, registres, rapports, paramètres."
                width={303}
                height={820}
                sizes="(max-width: 639px) 136px, (max-width: 1023px) 188px, 188px"
                className="h-auto w-full rounded-[7px]"
              />
            </div>
            {/* MUTED et non FAINT : cette légende nomme l'artefact, donc elle se
                lit. FAINT ne passe pas AA à 12,5 px sur ce fond. */}
            <figcaption
              className="mt-3 font-sans text-[12.5px] leading-[1.5]"
              style={{ color: MUTED }}
            >
              Le classeur d’origine, recadré sur son sommaire.
            </figcaption>
          </figure>
        </Preuve>
      </div>
    </Section>
  );
}

/* ── 04 · Du fichier à l'application ──────────────────────────────────────
   Une seule preuve, et elle démontre exactement ce que dit la prose : la
   facture se compose à partir du dossier, le paiement s'y rattache, le journal
   se remplit. Le visiteur peut l'actionner ; c'est du contenu réel, pas un
   effet. Les captures multiples de fonctionnalités appartiennent à SAFE
   Cabinet, pas à cette page. */

function SectionApplication() {
  return (
    <Section id="application" fond={SURFACE}>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] lg:items-start lg:gap-16">
        <div className="min-w-0">
          <Exergue index="03">Une information entre. Le travail avance.</Exergue>
          <Titre>Le fichier est devenu SAFE Cabinet.</Titre>
          <Prose
            paragraphes={[
              "Clients, dossiers, temps, débours, facturation, paiements, comptabilité, fidéicommis, échéances et rapports peuvent maintenant partager le même contexte.",
              "Une information inscrite pendant le travail reste disponible pour les étapes suivantes. Le dossier nourrit la facture. Le paiement met à jour la créance. Les opérations demeurent reliées aux registres et aux rapports.",
            ]}
          />
          <Conclusion delai={0.26}>
            Le produit a changé. L’idée, non : le logiciel doit comprendre le cabinet, pas
            l’inverse.
          </Conclusion>
        </div>

        <Preuve delai={0.12}>
          <MockupFactureEtPaiement />
        </Preuve>
      </div>
    </Section>
  );
}

/* ── 05 · La vision actuelle ──────────────────────────────────────────────
   Trois dimensions, trois poids différents. SAFE Cabinet occupe une rangée
   pleine parce que c'est le produit ; les outils et l'accompagnement se
   partagent la suivante. Pas trois cartes à icônes de taille égale : la
   hiérarchie dit ce qui est central, la grille ne le dirait pas.

   L'outil nommé est le seul publié. Vérifié le 2026-08-21 :
   `/calculateurs/patrimoine-familial` existe, la pension alimentaire est
   marquée « en construction » sur `/calculateurs` et n'est pas annoncée ici. */

function SectionSuite() {
  return (
    <Section id="suite" fond={BG}>
      <div className="max-w-[62ch]">
        <Exergue index="04">La suite SAFE</Exergue>
        <Titre large>Simplifier la pratique administrative, un problème concret à la fois.</Titre>
        <Prose
          paragraphes={[
            "SAFE ne s’arrête plus à une seule application. La vision est de réunir un système central pour le travail quotidien et des outils spécialisés pour les tâches administratives qui peuvent encore être simplifiées.",
          ]}
        />
      </div>

      <div className="mt-12 border-t" style={{ borderColor: LINE }}>
        <motion.div
          {...fadeUp(0.06)}
          className="grid gap-x-14 gap-y-4 border-b py-9 lg:grid-cols-[minmax(0,26ch)_minmax(0,1fr)]"
          style={{ borderColor: LINE }}
        >
          <div className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em]" style={{ color: MUTED }}>
              SAFE Cabinet
            </p>
            <h3
              className="mt-2.5 font-serif text-[25px] font-normal leading-[1.16] sm:text-[31px]"
              style={{ color: INK, letterSpacing: "-0.016em" }}
            >
              L’application centrale
            </h3>
          </div>
          <div className="min-w-0">
            <p className="max-w-[54ch] font-sans text-[16px] leading-[1.68]" style={{ color: PROSE }}>
              SAFE Cabinet relie les opérations quotidiennes du cabinet, de l’ouverture du dossier
              jusqu’à la facturation, la comptabilité et les registres.
            </p>
            <Link
              href={R.fonctionnalites}
              className="mt-4 inline-flex font-sans text-[14px] underline underline-offset-[5px]"
              style={{ color: INK, textDecorationColor: LINE_SOFT }}
            >
              Voir ce que fait SAFE Cabinet
            </Link>
          </div>
        </motion.div>

        <div className="grid gap-x-14 gap-y-9 py-9 sm:grid-cols-2">
          <motion.div {...fadeUp(0.12)} className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em]" style={{ color: MUTED }}>
              Outils SAFE
            </p>
            <h3
              className="mt-2.5 font-serif text-[20px] font-normal leading-[1.2] sm:text-[23px]"
              style={{ color: INK, letterSpacing: "-0.012em" }}
            >
              Des outils pour des tâches précises
            </h3>
            <p className="mt-3 max-w-[46ch] font-sans text-[15.5px] leading-[1.65]" style={{ color: PROSE }}>
              Des calculateurs, vérificateurs et générateurs autonomes répondent à des besoins
              précis de la pratique.
            </p>
            <p className="mt-2.5 max-w-[46ch] font-sans text-[13.5px] leading-[1.6]" style={{ color: MUTED }}>
              Un premier outil est publié : le partage du patrimoine familial.
            </p>
            <Link
              href={R.outils}
              className="mt-4 inline-flex font-sans text-[14px] underline underline-offset-[5px]"
              style={{ color: INK, textDecorationColor: LINE_SOFT }}
            >
              Voir les outils
            </Link>
          </motion.div>

          <motion.div {...fadeUp(0.18)} className="min-w-0">
            <p className="font-mono text-[11px] uppercase tracking-[0.14em]" style={{ color: MUTED }}>
              Accompagnement SAFE
            </p>
            <h3
              className="mt-2.5 font-serif text-[20px] font-normal leading-[1.2] sm:text-[23px]"
              style={{ color: INK, letterSpacing: "-0.012em" }}
            >
              Une implantation adaptée
            </h3>
            <p className="mt-3 max-w-[46ch] font-sans text-[15.5px] leading-[1.65]" style={{ color: PROSE }}>
              Chaque cabinet est d’abord compris, puis configuré selon sa province, sa structure et
              sa façon de travailler.
            </p>
          </motion.div>
        </div>
      </div>

      <Conclusion delai={0.08}>
        La suite évolue à partir du travail réel des cabinets, pas à partir d’une liste abstraite de
        fonctionnalités.
      </Conclusion>
    </Section>
  );
}

/* ── 06 · La manière de construire SAFE ───────────────────────────────────
   Un registre numéroté, la même grammaire que « Également dans SAFE Cabinet »
   sur la page Fonctionnalités. Quatre cartes à icônes diraient la même chose
   en moins clair, et c'est exactement le gabarit que DESIGN_HUMAIN A5 refuse. */

const ETAPES: [string, string][] = [
  [
    "Observer",
    "Regarder comment le travail est réellement effectué, ce qui doit être ressaisi et ce que l’équipe cherche sans le trouver.",
  ],
  [
    "Relier",
    "Faire circuler l’information entre les étapes qui partagent déjà le même contexte.",
  ],
  [
    "Vérifier",
    "Rendre visibles les écarts et conserver la trace des décisions importantes.",
  ],
  [
    "Améliorer",
    "Développer une capacité à la fois, la mettre entre les mains d’un cabinet et vérifier qu’elle simplifie réellement son travail.",
  ],
];

function SectionMethode() {
  return (
    <Section id="methode" fond={SURFACE}>
      <div className="max-w-[58ch]">
        <Exergue index="05">Notre méthode</Exergue>
        <Titre>Comprendre avant de construire.</Titre>
      </div>

      <ol className="mt-10 border-b sm:mt-12" style={{ borderColor: LINE }}>
        {ETAPES.map(([titre, texte], i) => (
          <motion.li
            key={titre}
            initial={{ opacity: 0, y: 8 }}
            data-revele=""
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.04 + i * 0.07, duration: 0.7, ease: EASE }}
            className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-5 gap-y-2 border-t py-6 sm:grid-cols-[auto_minmax(0,15ch)_minmax(0,1fr)] sm:gap-x-10 sm:py-7"
            style={{ borderColor: LINE }}
          >
            <span className="font-mono text-[11px] tabular-nums leading-[1.9]" style={{ color: FAINT }}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="font-sans text-[17px] leading-[1.35]" style={{ color: INK }}>
              {titre}
            </span>
            <span
              className="col-start-2 max-w-[54ch] font-sans text-[15.5px] leading-[1.65] sm:col-start-3"
              style={{ color: PROSE }}
            >
              {texte}
            </span>
          </motion.li>
        ))}
      </ol>

      <Conclusion delai={0.1}>
        Une fonctionnalité n’est pas terminée parce qu’elle existe. Elle est terminée lorsqu’elle
        simplifie un vrai travail.
      </Conclusion>
    </Section>
  );
}

/* ── 07 · Le fondateur ────────────────────────────────────────────────────
   Une colonne unique, et le seul endroit de la page où la voix passe à la
   première personne. Pas de second portrait : il est déjà au premier écran,
   et le répéter en ferait le sujet. La formation est citée telle qu'elle est
   documentée, rien de plus. */

function SectionFondateur() {
  return (
    <Section id="fondateur" fond={BG}>
      <div className="max-w-[64ch]">
        <Exergue index="06">Derrière SAFE</Exergue>
        <Titre>Une expérience administrative appliquée au monde juridique.</Titre>

        <div className="mt-7 max-w-[56ch] space-y-4 font-sans text-[17px] leading-[1.72]" style={{ color: PROSE }}>
          <motion.p {...fadeUp(0.12)}>
            Je suis Jérémie Tiahou. Ma formation est en administration et en comptabilité de petite
            entreprise.
          </motion.p>
          <motion.p {...fadeUp(0.18)}>
            SAFE est né de la rencontre entre cette expérience et ce que j’ai observé directement
            dans les opérations quotidiennes d’un cabinet.
          </motion.p>
          <motion.p {...fadeUp(0.24)}>
            Je n’ai pas commencé avec l’ambition de créer un autre logiciel juridique. J’ai commencé
            avec un problème à résoudre. C’est encore de cette manière que SAFE est construit
            aujourd’hui.
          </motion.p>
        </div>

        <motion.div {...fadeUp(0.3)} className="mt-9 border-t pt-5" style={{ borderColor: LINE }}>
          <p className="font-sans text-[15.5px] leading-[1.35]" style={{ color: INK }}>
            Jérémie Tiahou
          </p>
          <p className="mt-1 font-sans text-[13.5px] leading-[1.4]" style={{ color: MUTED }}>
            Fondateur de SAFE
          </p>
        </motion.div>
      </div>
    </Section>
  );
}

/* ── 08 · Conclusion ──────────────────────────────────────────────────────
   Une seule action pleine sur toute la page, et elle est ici. La rencontre
   reste un lien. */

function SectionFin() {
  return (
    <section className="px-6 py-16 sm:py-24" style={{ background: SURFACE, borderTop: `1px solid ${LINE}` }}>
      <div className="mx-auto max-w-[1140px]">
        <motion.h2
          {...fadeUp(0)}
          className="max-w-[24ch] font-serif text-[27px] font-normal leading-[1.16] sm:max-w-[28ch] sm:text-[36px]"
          style={{ color: INK, letterSpacing: "-0.016em" }}
        >
          Votre cabinet ne devrait pas avoir à s’adapter à son logiciel.
        </motion.h2>
        <motion.p
          {...fadeUp(0.08)}
          className="mt-5 max-w-[62ch] font-sans text-[16.5px] leading-[1.7]"
          style={{ color: PROSE }}
        >
          Commençons par comprendre votre organisation administrative, les tâches qui se répètent et
          les informations qui restent dispersées.
        </motion.p>

        <motion.div
          {...fadeUp(0.16)}
          className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-5"
        >
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
        <motion.p {...fadeUp(0.2)} className="mt-4 font-sans text-[13px]" style={{ color: MUTED }}>
          Gratuit, sans carte de crédit. Rapport sous 24 heures.
        </motion.p>

        <motion.p
          {...fadeUp(0.24)}
          className="mt-12 max-w-[74ch] border-t pt-5 font-sans text-[12.5px] leading-[1.6]"
          style={{ borderColor: LINE_SOFT, color: FAINT }}
        >
          L’écran de facturation présenté plus haut est une maquette manipulable, sur des données
          fictives. Elle reproduit l’interface de SAFE sans être le logiciel. SAFE soutient la
          tenue, la vérification et la traçabilité du travail administratif : la responsabilité
          professionnelle demeure celle du cabinet.
        </motion.p>
      </div>
    </section>
  );
}

/* Sans JavaScript, l'entrée de framer-motion ne s'exécute jamais et les blocs
   restent à l'opacité 0 qu'il écrit au rendu serveur. La page précédente
   tenait sans script, celle-ci le tient aussi : le navigateur n'applique cette
   règle que si le script est coupé, donc elle ne coûte rien au cas normal.

   Le sélecteur est le même que celui de `prefers-reduced-motion` dans
   globals.css, et il couvre tout : `fadeUp` pose `data-revele`, et les
   révélations écrites à la main dans cette page le posent aussi. */
const SANS_SCRIPT = `<style>.safe-vitrine [data-revele]{opacity:1!important;transform:none!important}</style>`;

export default function AProposPage() {
  return (
    <PageShell>
      <noscript dangerouslySetInnerHTML={{ __html: SANS_SCRIPT }} />
      <Hero />
      <SectionConstat />
      <SectionPremierSafe />
      <SectionApplication />
      <SectionSuite />
      <SectionMethode />
      <SectionFondateur />
      <SectionFin />
    </PageShell>
  );
}
