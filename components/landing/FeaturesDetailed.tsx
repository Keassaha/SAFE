"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Receipt,
  BookOpen,
  FolderOpen,
  Users,
  Landmark,
} from "lucide-react";
import { BrowserFrame } from "./ui/BrowserFrame";
import { NavetteDemo } from "./ui/NavetteDemo";
import { FideicommisDemo } from "./ui/FideicommisDemo";
import { FactureDemo } from "./ui/FactureDemo";
import { ComptabiliteDemo } from "./ui/ComptabiliteDemo";

const EASE = [0.16, 1, 0.3, 1] as const;

const reveal = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

type Showcase = {
  num: string;
  kicker: string;
  title: string;
  body: string;
  bullets: string[];
  outcome: string;
  src: string;
  alt: string;
  label: string;
  demo?: React.ComponentType;
};

const SHOWCASE: Showcase[] = [
  {
    num: "01",
    kicker: "Fidéicommis",
    title: "Le fidéicommis suivi en continu, pas seulement le jour de l'inspection.",
    body: "Chaque dépôt et chaque retrait est inscrit, le solde par client et par dossier reste exact, et la conciliation mensuelle se fait sans tableur. SAFE refuse un retrait qui rendrait un compte négatif et conserve une piste de vérification complète.",
    bullets: [
      "Conciliation mensuelle certifiée",
      "Blocage des soldes négatifs (B-1, r.5)",
      "Plafond comptant respecté",
      "Chaque mouvement tracé",
    ],
    outcome: "Prêt pour l'inspection, toute l'année.",
    src: "/images/app/fideicommis.png",
    alt: "Comptes en fidéicommis dans SAFE, soldes par client et conciliation",
    label: "safecabinet.ca · Fidéicommis",
    demo: FideicommisDemo,
  },
  {
    num: "02",
    kicker: "Facturation",
    title: "Vos heures deviennent des factures, et vos factures deviennent des paiements.",
    body: "Le temps saisi et les débours se transforment en facture en quelques clics. La numérotation est sans trou, les paiements s'enregistrent et s'allouent, et SAFE signale ce qui dort : temps non facturé, créances qui vieillissent, trop-payés à restituer.",
    bullets: [
      "Numérotation sans trou",
      "Débours refacturés, reçus de paiement",
      "Aging des créances et relances",
      "Surpaiements signalés",
    ],
    outcome: "Rien ne se perd en chemin.",
    src: "/images/app/facture.png",
    alt: "Facture générée dans SAFE, en dollars canadiens avec TPS et TVQ",
    label: "safecabinet.ca · Facture",
    demo: FactureDemo,
  },
  {
    num: "03",
    kicker: "Comptabilité",
    title: "Une comptabilité que vous comprenez, que votre comptable accepte.",
    body: "SAFE tient la comptabilité opérationnelle de votre cabinet (encaissements, dépenses, débours, fidéicommis toujours séparé) et la prépare pour votre comptable. Lui garde le grand livre, vous gardez une vue claire.",
    bullets: [
      "Cash, factures, créances, dépenses et fidéicommis séparés",
      "Contrôle mensuel",
      "Prête à transmettre à votre comptable",
    ],
    outcome: "L'argent du cabinet, lisible.",
    src: "/images/app/comptabilite.png",
    alt: "Page comptabilité de SAFE, vue claire des flux du cabinet",
    label: "safecabinet.ca · Comptabilité",
    demo: ComptabiliteDemo,
  },
];

type Card = {
  kicker: string;
  title: string;
  body: string;
  bullets: string[];
  outcome: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
};

const CARDS: Card[] = [
  {
    kicker: "Dossiers",
    title: "Vos dossiers sous contrôle, de l'ouverture à la fermeture.",
    body: "Clients, mandats, échéances et documents au même endroit. Chaque domaine a sa structure, et fermer un dossier se fait proprement : SAFE alerte sur ce qui reste à régler et produit une lettre de fermeture.",
    bullets: [
      "Cartables par domaine",
      "Échéances et actes suivis",
      "Fermeture guidée et lettre de fermeture",
      "Conservation 7 à 10 ans",
    ],
    outcome: "Fini les dimanches soirs à chercher un courriel.",
    icon: FolderOpen,
  },
  {
    kicker: "Le duo avocat et adjointe",
    title: "L'adjointe prépare, l'avocat approuve. Rien ne se perd entre vous deux.",
    body: "Le cœur de SAFE : le travail terminé remonte tout seul à la bonne personne. L'adjointe marque un document prêt ou un dossier prêt pour revue ; l'avocat approuve ou renvoie en un clic. Les échéances urgentes et les factures prêtes apparaissent sans courriel de relance.",
    bullets: [
      "Fil avocat et adjointe, par dossier",
      "Document prêt, facture prête, acte urgent : tout remonte seul",
      "Résumé courriel quotidien, par personne",
    ],
    outcome: "Votre adjointe est valorisée, vous gardez le contrôle.",
    icon: Users,
  },
  {
    kicker: "Conformité",
    title: "La conformité, suivie au lieu d'être improvisée.",
    body: "Vos obligations envers le Barreau et la LSO sont connues, suivies et traçables. Rapport annuel, rétention des dossiers, vérification d'identité : ce qui se prépare d'habitude dans l'urgence devient un état que vous consultez.",
    bullets: [
      "Obligations B-1, r.5 et LSO suivies",
      "Rétention 7 à 10 ans",
      "Vérification d'identité",
    ],
    outcome: "Une inspection cesse d'être un événement.",
    icon: ShieldCheck,
  },
];

const AUDIENCES: { icon: React.ComponentType<{ className?: string; strokeWidth?: number }>; who: string; what: string }[] = [
  { icon: ShieldCheck, who: "Pour l'avocat", what: "Votre risque et votre argent sous contrôle." },
  { icon: Receipt, who: "Pour l'adjointe", what: "Outillée, sécurisée, reconnue." },
  { icon: Users, who: "Pour le duo", what: "Vous montez de niveau ensemble." },
];

const KICKER_ICONS: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  Fidéicommis: Landmark,
  Facturation: Receipt,
  Comptabilité: BookOpen,
};

export function FeaturesDetailed() {
  return (
    <div className="bg-canvas">
      {/* ── Hero ── */}
      <section className="mx-auto max-w-[1180px] px-6 pt-16 pb-10 sm:pt-24">
        <motion.div initial="hidden" animate="visible" variants={reveal} className="max-w-3xl">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-forest-700 mb-4">
            Fonctionnalités
          </p>
          <h1 className="font-serif text-[40px] sm:text-[52px] leading-[1.05] tracking-[-0.02em] text-text-primary">
            Tout ce qu'un petit cabinet gère, sans rien échapper.
          </h1>
          <p className="mt-5 text-[17px] leading-relaxed text-text-body max-w-2xl">
            SAFE réunit le fidéicommis, la facturation, la comptabilité et les dossiers au même
            endroit. Pensé pour le cabinet solo comme pour le duo avocat et adjointe : vous gardez le
            contrôle, votre adjointe est outillée, et rien ne tombe entre les mailles.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.15 }}
          className="mt-12"
        >
          {/* Démo INTERACTIVE : le curseur clique « Approuver » et l'élément passe
              réellement à « Approuvé » (vrai changement d'état, en boucle). */}
          <NavetteDemo />
          <p className="mt-3 text-center text-[13px] text-text-subtle">
            En direct : l'adjointe prépare, vous approuvez en un clic.
          </p>
        </motion.div>
      </section>

      {/* ── Lignes vitrine (captures réelles) ── */}
      <section className="mx-auto max-w-[1180px] px-6 py-12 space-y-24">
        {SHOWCASE.map((f, i) => {
          const Icon = KICKER_ICONS[f.kicker] ?? ShieldCheck;
          const Demo = f.demo;
          const reversed = i % 2 === 1;
          return (
            <motion.div
              key={f.num}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={reveal}
              className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center"
            >
              <div className={reversed ? "lg:order-2" : ""}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-forest-700/[0.08] text-forest-700">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-forest-700">
                    {f.num} · {f.kicker}
                  </p>
                </div>
                <h2 className="font-serif text-[28px] sm:text-[32px] leading-[1.15] tracking-[-0.01em] text-text-primary">
                  {f.title}
                </h2>
                <p className="mt-4 text-[16px] leading-relaxed text-text-body">{f.body}</p>
                <ul className="mt-5 space-y-2">
                  {f.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-[15px] text-text-body">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-forest-700" strokeWidth={2} />
                      {b}
                    </li>
                  ))}
                </ul>
                <p className="mt-5 inline-block rounded-full bg-forest-700/[0.07] px-3.5 py-1.5 text-[13px] font-medium text-forest-800">
                  {f.outcome}
                </p>
              </div>

              <div className={reversed ? "lg:order-1" : ""}>
                {Demo ? (
                  <Demo />
                ) : (
                  <BrowserFrame src={f.src} alt={f.alt} label={f.label} />
                )}
              </div>
            </motion.div>
          );
        })}
      </section>

      {/* ── Cartes (dossiers, duo, conformité) ── */}
      <section className="mx-auto max-w-[1180px] px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {CARDS.map((c) => {
            const Icon = c.icon;
            return (
              <motion.div
                key={c.kicker}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={reveal}
                className="flex flex-col rounded-2xl border border-[0.5px] border-border bg-surface p-6 shadow-[0_30px_80px_-60px_rgba(31,58,46,0.45)]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-forest-700/[0.08] text-forest-700">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <p className="mt-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-forest-700">
                  {c.kicker}
                </p>
                <h3 className="mt-1.5 font-serif text-[21px] leading-[1.2] tracking-[-0.01em] text-text-primary">
                  {c.title}
                </h3>
                <p className="mt-3 text-[15px] leading-relaxed text-text-body">{c.body}</p>
                <ul className="mt-4 space-y-2">
                  {c.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-[14px] text-text-body">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-forest-700" strokeWidth={2} />
                      {b}
                    </li>
                  ))}
                </ul>
                <p className="mt-auto pt-5 text-[14px] font-medium text-forest-800">{c.outcome}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Bande « Pour qui » ── */}
      <section className="mx-auto max-w-[1180px] px-6 py-12">
        <div className="rounded-[20px] bg-forest-900 px-8 py-10 sm:px-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {AUDIENCES.map((a) => {
              const Icon = a.icon;
              return (
                <div key={a.who}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-white/10 text-forest-50">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <p className="mt-3 font-serif text-[19px] text-forest-50">{a.who}</p>
                  <p className="mt-1 text-[15px] leading-relaxed text-forest-50/75">{a.what}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
