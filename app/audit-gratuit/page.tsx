"use client";

/**
 * Diagnostic — page d'entrée, écrite avec la grammaire de la page d'accueil.
 * Même en-tête, même rail de tirets, mêmes scènes épinglées pilotées au scroll,
 * même bande de preuves et même pied de page que le site public.
 * Réf. direction : docs/design/PROMPT_DIAGNOSTIC_COMME_LA_LANDING.md
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { SafeLogo, SafeMark } from "@/components/branding/SafeLogo";
import {
  BG, SURFACE, INK, MUTED, FAINT, GREEN, VERIFIED, LINE, LINE_SOFT, R,
  Footer, PaperDrift, ScrollHint, SceneRail,
  useScrollScrub, scenePhase, easeOutCubic, easeInOutQuad,
} from "@/components/public-site/shared";

const AuditForm = dynamic(
  () => import("@/components/audit-gratuit/AuditForm").then((m) => m.AuditForm),
  {
    loading: () => (
      <div className="audit-v2-bg flex min-h-screen items-center justify-center">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: FAINT }}>
          Chargement
        </span>
      </div>
    ),
  }
);

type Lang = "fr" | "en";

/* Une promesse par palier de défilement : le lecteur n'en lit jamais deux à la fois. */
const PROMESSES = [
  {
    num: "01",
    titre: "Plus de revenus",
    ligne: "Le temps saisi mais jamais facturé, chiffré pour votre cabinet.",
  },
  {
    num: "02",
    titre: "Plus de temps",
    ligne: "Les heures d'administration que la double saisie vous prend chaque semaine.",
  },
  {
    num: "03",
    titre: "Plus tranquille",
    ligne: "L'état de vos obligations Barreau, écrit noir sur blanc.",
  },
];

/* Les trois lignes de la feuille de rapport, avec leur valeur d'exemple. */
const LIGNES_RAPPORT = [
  { lbl: "Temps saisi, jamais facturé", cible: 18400, suffixe: " $ / an", decimales: 0 },
  { lbl: "Administration, par semaine", cible: 6.5, suffixe: " h", decimales: 1 },
  { lbl: "Obligations à jour", cible: 7, suffixe: " sur 10", decimales: 0 },
];

const RAIL = [
  { id: "zone-entree", label: "Diagnostic" },
  { id: "zone-rapport", label: "Rapport" },
  { id: "section-etapes", label: "Déroulement" },
  { id: "section-depart", label: "Commencer" },
] as const;

const nombre = (v: number, decimales: number) =>
  v.toLocaleString("fr-CA", { minimumFractionDigits: decimales, maximumFractionDigits: decimales });

/* ── En-tête, repris de l'accueil : liens, connexion, un seul bouton plein ── */

function EnteteDiagnostic() {
  const [menuOpen, setMenuOpen] = useState(false);
  const liens = [
    { href: R.fonctionnalites, label: "Fonctionnalités" },
    { href: R.tarification, label: "Tarification" },
    { href: R.aPropos, label: "À propos" },
    { href: R.demo, label: "Contact" },
  ];

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 flex h-[60px] items-center justify-between px-6 sm:px-11"
      style={{
        background: "rgba(239,242,237,0.86)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderBottom: `1px solid ${LINE}`,
      }}
    >
      <Link href={R.accueil} className="flex items-center gap-2.5">
        <SafeLogo size={20} />
      </Link>

      <div className="hidden items-center gap-[26px] lg:flex">
        {liens.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="font-sans text-[13px] transition-colors duration-300 hover:text-[#1F2A24]"
            style={{ color: MUTED }}
          >
            {l.label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <Link href="/connexion" className="hidden font-sans text-[13px] lg:inline" style={{ color: MUTED }}>
          Connexion
        </Link>
        <a
          href="#section-depart"
          className="inline-flex h-[34px] items-center rounded-[7px] px-4 font-sans text-[13px] font-medium transition-colors duration-300 hover:bg-[#0e8f47]"
          style={{ background: GREEN, color: "#fff" }}
        >
          Commencer
        </a>

        <div className="relative lg:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-label="Ouvrir le menu"
            className="inline-flex h-9 w-9 items-center justify-center rounded-[7px] border"
            style={{ borderColor: LINE, background: SURFACE }}
          >
            <span className="flex flex-col gap-[3px]">
              <span className={`block h-[1.5px] w-4 transition-transform duration-300 ${menuOpen ? "translate-y-[4.5px] rotate-45" : ""}`} style={{ background: INK }} />
              <span className={`block h-[1.5px] w-4 transition-opacity duration-300 ${menuOpen ? "opacity-0" : ""}`} style={{ background: INK }} />
              <span className={`block h-[1.5px] w-4 transition-transform duration-300 ${menuOpen ? "-translate-y-[4.5px] -rotate-45" : ""}`} style={{ background: INK }} />
            </span>
          </button>

          <AnimatePresence>
            {menuOpen && (
              <motion.div
                key="menu"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className="absolute right-0 top-[calc(100%+10px)] w-60 rounded-[12px] border p-2"
                style={{ background: SURFACE, borderColor: LINE, boxShadow: "0 30px 60px -40px rgba(11,31,25,0.5)" }}
              >
                {[...liens, { href: "/connexion", label: "Connexion" }].map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setMenuOpen(false)}
                    className="block rounded-[8px] px-4 py-2.5 font-sans text-[13px] transition-colors duration-300 hover:bg-[rgb(var(--si-forest-rgb) / 0.06)]"
                    style={{ color: MUTED }}
                  >
                    {l.label}
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

/* ── Scène 1 · Entrée épinglée : le titre cède la place aux trois promesses ── */

function SceneEntree() {
  const zone = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useScrollScrub(zone, (p) => {
    const root = stage.current;
    if (!root) return;

    const tete = root.querySelector<HTMLElement>("[data-tete]");
    if (tete) {
      const parti = easeInOutQuad(scenePhase(p, 0.08, 0.3));
      tete.style.opacity = String(1 - parti);
      tete.style.transform = `translateY(${-parti * 6}vh)`;
    }

    root.querySelectorAll<HTMLElement>("[data-promesse]").forEach((el, i) => {
      const entre = easeOutCubic(scenePhase(p, 0.22 + i * 0.16, 0.42 + i * 0.16));
      el.style.opacity = String(entre);
      el.style.transform = `translateY(${(1 - entre) * 22}px)`;
      const filet = el.querySelector<HTMLElement>("[data-filet]");
      if (filet) filet.style.transform = `scaleX(${easeOutCubic(scenePhase(p, 0.24 + i * 0.16, 0.5 + i * 0.16))})`;
    });

    const hint = zone.current?.querySelector<HTMLElement>("[data-scroll-hint]");
    if (hint) hint.style.opacity = String(1 - scenePhase(p, 0.02, 0.12));
  });

  return (
    <div ref={zone} id="zone-entree" className="relative" style={{ height: "360vh" }}>
      {/* pr sur grand écran : le rail garde sa voie à droite, il ne croise jamais le texte */}
      <div className="sticky top-0 flex min-h-screen items-center overflow-hidden px-6 sm:px-11 lg:pr-[150px]" style={{ background: BG }}>
        <PaperDrift count={9} />

        <div ref={stage} className="relative mx-auto w-full max-w-[1080px]">
          {/* Tête : ce que c'est, en une phrase */}
          <div data-tete>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em]" style={{ color: GREEN }}>
              Diagnostic · gratuit · rapport sous 24 h
            </p>
            <h1
              className="mt-5 max-w-[13ch] font-serif text-[44px] leading-[1.0] sm:text-[68px]"
              style={{ color: INK, letterSpacing: "-0.026em" }}
            >
              Ce que votre cabinet{" "}
              <em className="italic" style={{ color: GREEN }}>
                laisse passer.
              </em>
            </h1>
            <p className="mt-6 max-w-[46ch] font-sans text-[16px] leading-[1.62]" style={{ color: MUTED }}>
              Une quinzaine de minutes de questions sur votre pratique. En retour, un rapport
              chiffré sur votre facturation, votre temps et vos obligations.
            </p>
          </div>

          {/* Trois promesses, une par palier */}
          <div className="pointer-events-none absolute inset-x-0 top-0">
            {PROMESSES.map((pr, i) => (
              <div
                key={pr.num}
                data-promesse
                className="absolute left-0 w-full max-w-[46ch]"
                style={{ top: `${i * 132}px`, opacity: 0 }}
              >
                <span
                  data-filet
                  aria-hidden
                  className="block h-px origin-left"
                  style={{ background: LINE, transform: "scaleX(0)" }}
                />
                <div className="flex gap-6 pt-5">
                  <span className="pt-1.5 font-mono text-[11px] tracking-[0.14em]" style={{ color: GREEN }}>
                    {pr.num}
                  </span>
                  <div>
                    <p className="font-serif text-[26px] leading-tight sm:text-[32px]" style={{ color: INK }}>
                      {pr.titre}
                    </p>
                    <p className="mt-2 font-sans text-[15px] leading-[1.6]" style={{ color: MUTED }}>
                      {pr.ligne}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <ScrollHint />
      </div>
    </div>
  );
}

/* ── Bande de preuves, même dispositif que l'accueil ── */

function BandePreuves() {
  const items = [
    "Gratuit, sans carte de crédit",
    "Une quinzaine de minutes",
    "Rapport écrit sous 24 h",
    "Vos réponses restent confidentielles",
  ];
  return (
    <div className="border-y" style={{ background: SURFACE, borderColor: LINE }}>
      <div className="mx-auto grid max-w-[1240px] gap-3 px-6 py-5 sm:grid-cols-2 sm:px-11 lg:grid-cols-4">
        {items.map((t) => (
          <span key={t} className="flex items-center gap-2 font-sans text-[12.5px]" style={{ color: MUTED }}>
            <i className="block h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: GREEN }} />
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ── Feuille de rapport : les lignes se posent, les chiffres montent ── */

function FeuilleRapport() {
  return (
    <div
      className="rounded-[12px] border p-7 sm:p-8"
      style={{ background: "#fff", borderColor: LINE, boxShadow: "0 30px 60px -38px rgba(11,31,25,0.5)" }}
    >
      <div className="flex items-baseline justify-between gap-4">
        <span className="font-serif text-[24px]" style={{ color: INK }}>Rapport de diagnostic</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: FAINT }}>Exemple</span>
      </div>
      <p className="mt-1.5 border-b pb-4 font-sans text-[12.5px]" style={{ color: MUTED, borderColor: LINE }}>
        Cabinet de deux personnes · pratique en droit familial
      </p>

      {LIGNES_RAPPORT.map((l) => (
        <div
          key={l.lbl}
          data-ligne
          className="flex items-center justify-between gap-4 border-b py-4"
          style={{ borderColor: LINE_SOFT, opacity: 0 }}
        >
          <span className="font-sans text-[13.5px]" style={{ color: MUTED }}>{l.lbl}</span>
          <span data-valeur className="font-mono text-[15px] tabular-nums" style={{ color: INK }}>
            {nombre(0, l.decimales)}{l.suffixe}
          </span>
        </div>
      ))}

      <div
        data-reco
        className="mt-6 rounded-[9px] px-5 py-4"
        style={{ background: "var(--si-forest)", color: "#F4F7F3", opacity: 0 }}
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: "var(--si-verified-on-forest)" }}>
          Recommandation
        </p>
        <p className="mt-2 font-sans text-[13.5px] leading-[1.55]">
          Reprendre la facturation du temps déjà saisi avant de toucher au reste. C&apos;est là que
          se trouve l&apos;écart le plus large.
        </p>
      </div>

      <p data-remise className="mt-4 font-sans text-[12.5px]" style={{ color: VERIFIED, opacity: 0 }}>
        Remis par écrit sous 24 h, avec le détail de chaque chiffre.
      </p>
    </div>
  );
}

function SceneRapport() {
  const zone = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  useScrollScrub(zone, (p) => {
    const root = stage.current;
    if (!root) return;

    root.querySelectorAll<HTMLElement>("[data-ligne]").forEach((el, i) => {
      const pose = easeOutCubic(scenePhase(p, 0.08 + i * 0.13, 0.32 + i * 0.13));
      el.style.opacity = String(0.2 + pose * 0.8);
      el.style.transform = `translateX(${(1 - pose) * 14}px)`;
      const valeur = el.querySelector<HTMLElement>("[data-valeur]");
      const ligne = LIGNES_RAPPORT[i];
      if (valeur && ligne) {
        const monte = easeInOutQuad(scenePhase(p, 0.14 + i * 0.13, 0.46 + i * 0.13));
        valeur.textContent = nombre(ligne.cible * monte, ligne.decimales) + ligne.suffixe;
      }
    });

    const reco = root.querySelector<HTMLElement>("[data-reco]");
    if (reco) {
      const a = easeOutCubic(scenePhase(p, 0.66, 0.86));
      reco.style.opacity = String(a);
      reco.style.transform = `translateY(${(1 - a) * 16}px)`;
    }

    const remise = root.querySelector<HTMLElement>("[data-remise]");
    if (remise) remise.style.opacity = String(scenePhase(p, 0.86, 0.97));
  });

  return (
    <div ref={zone} id="zone-rapport" className="relative" style={{ height: "320vh" }}>
      <div className="sticky top-0 grid min-h-screen content-center overflow-hidden px-6 sm:px-11 lg:pr-[150px]" style={{ background: BG }}>
        <div
          ref={stage}
          className="mx-auto grid w-full max-w-[1160px] items-center gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-[76px]"
        >
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em]" style={{ color: GREEN }}>
              Ce qu&apos;on regarde
            </p>
            <h2
              className="mt-4 max-w-[15ch] font-serif text-[30px] leading-[1.08] sm:text-[44px]"
              style={{ color: INK, letterSpacing: "-0.018em" }}
            >
              Trois chiffres, tirés de vos réponses.
            </h2>
            <p className="mt-5 max-w-[48ch] font-sans text-[15px] leading-[1.65]" style={{ color: MUTED }}>
              Les questions portent sur votre façon de saisir le temps, de facturer, de tenir le
              fidéicommis et de suivre vos échéances. Le rapport ramène tout cela à ce qui se
              chiffre, avec la méthode de calcul à côté de chaque montant.
            </p>
            <p
              className="mt-6 max-w-[44ch] border-l-2 pl-4 font-sans text-[14px] leading-[1.55]"
              style={{ borderColor: GREEN, color: INK }}
            >
              Vous repartez avec le rapport, que vous choisissiez SAFE ou non.
            </p>
          </div>

          <div>
            <FeuilleRapport />
            <p className="mt-3 font-sans text-[12px]" style={{ color: FAINT }}>
              Exemple sur des données fictives. Vos chiffres viennent de vos réponses.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Déroulement, questions, départ ── */

const ETAPES = [
  {
    num: "01",
    titre: "Vous répondez",
    ligne: "Une question à l'écran, dans la langue de votre choix. Vous pouvez vous arrêter et reprendre.",
  },
  {
    num: "02",
    titre: "On calcule",
    ligne: "Vos réponses sont converties en montants et en heures, avec la méthode de calcul écrite à côté.",
  },
  {
    num: "03",
    titre: "Vous décidez",
    ligne: "Le rapport arrive sous 24 h. Vous jugez ensuite si une démonstration mérite vingt minutes.",
  },
];

const QUESTIONS = [
  {
    q: "Qui voit mes réponses ?",
    r: "Elles servent à produire votre rapport et restent entre vous et SAFE. Aucun nom de client n'est demandé.",
  },
  {
    q: "Faut-il payer quelque chose ?",
    r: "Non. Le diagnostic est gratuit et sans carte de crédit. Le tarif se discute après le rapport, si vous le souhaitez.",
  },
  {
    q: "Et si je ne connais pas mes chiffres ?",
    r: "Une estimation suffit. Les questions sont écrites pour être répondues de mémoire, sans ouvrir votre comptabilité.",
  },
];

function SectionEtapes() {
  return (
    <section id="section-etapes" className="border-y px-6 py-[clamp(84px,12vh,150px)] sm:px-11" style={{ background: SURFACE, borderColor: LINE }}>
      <div className="mx-auto max-w-[1100px]">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em]" style={{ color: GREEN }}>
          Comment ça se passe
        </p>
        <h2
          className="mt-3.5 max-w-[16ch] font-serif text-[30px] leading-[1.08] sm:text-[46px]"
          style={{ color: INK, letterSpacing: "-0.018em" }}
        >
          Trois étapes, et rien à préparer.
        </h2>

        <div className="mt-11">
          {ETAPES.map((e) => (
            <div key={e.num} className="grid gap-2 border-t py-7 sm:grid-cols-[auto_0.8fr_1.2fr] sm:gap-8" style={{ borderColor: LINE }}>
              <span className="font-mono text-[11px] tracking-[0.14em]" style={{ color: GREEN }}>{e.num}</span>
              <p className="font-serif text-[22px] leading-tight" style={{ color: INK }}>{e.titre}</p>
              <p className="max-w-[58ch] font-sans text-[14px] leading-[1.65]" style={{ color: MUTED }}>{e.ligne}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionQuestions() {
  return (
    <section className="px-6 py-[clamp(84px,12vh,150px)] sm:px-11" style={{ background: BG }}>
      <div className="mx-auto max-w-[1100px]">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em]" style={{ color: GREEN }}>
          Avant de commencer
        </p>
        <h2
          className="mt-3.5 max-w-[16ch] font-serif text-[30px] leading-[1.08] sm:text-[46px]"
          style={{ color: INK, letterSpacing: "-0.018em" }}
        >
          Les questions qu&apos;on nous pose.
        </h2>

        <div className="mt-11">
          {QUESTIONS.map((item) => (
            <div key={item.q} className="grid gap-3 border-t py-7 sm:grid-cols-[0.86fr_1.14fr] sm:gap-[18px]" style={{ borderColor: LINE }}>
              <h3 className="font-serif text-[20px] leading-[1.35]" style={{ color: INK }}>{item.q}</h3>
              <p className="max-w-[58ch] font-sans text-[14px] leading-[1.65]" style={{ color: MUTED }}>{item.r}</p>
            </div>
          ))}
        </div>

        <Link href={R.faq} className="mt-4 inline-block font-sans text-[13.5px]" style={{ color: INK }}>
          Lire toutes les questions →
        </Link>
      </div>
    </section>
  );
}

/** Départ : seul moment centré de la page, c'est ici que le questionnaire prend la main. */
function SectionDepart({ onStart }: { onStart: (lang: Lang) => void }) {
  return (
    <section id="section-depart" className="border-t px-6 py-[clamp(84px,12vh,150px)] text-center sm:px-11" style={{ background: BG, borderColor: LINE }}>
      <div className="mx-auto max-w-[620px]">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em]" style={{ color: GREEN }}>
          Prêt quand vous l&apos;êtes
        </p>
        <h2
          className="mx-auto mt-4 max-w-[18ch] font-serif text-[34px] leading-[1.05] sm:text-[52px]"
          style={{ color: INK, letterSpacing: "-0.02em" }}
        >
          Dans quelle langue préférez-vous répondre&nbsp;?
        </h2>

        <div className="mt-9 grid grid-cols-2 gap-4">
          {(["fr", "en"] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => onStart(l)}
              className="rounded-[12px] border p-6 text-left transition-colors duration-300"
              style={{ background: SURFACE, borderColor: LINE }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgb(var(--si-forest-rgb) / 0.45)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = LINE; }}
            >
              <span className="block font-serif text-[34px] leading-none" style={{ color: INK }}>
                {l.toUpperCase()}
              </span>
              <span className="mt-2 block font-sans text-[12.5px]" style={{ color: MUTED }}>
                {l === "fr" ? "Français · Québec" : "English · Canada"}
              </span>
            </button>
          ))}
        </div>

        <p className="mt-6 font-sans text-[12.5px]" style={{ color: FAINT }}>
          Confidentiel. Aucune carte de crédit. Le tarif vient après le diagnostic, pas avant.
        </p>
      </div>
    </section>
  );
}

/* ── Version sans animation : même contenu, empilé ── */

function DiagnosticStatique({ onStart }: { onStart: (lang: Lang) => void }) {
  return (
    <>
      <div className="px-6 pb-20 pt-32 sm:px-11" style={{ background: BG }}>
        <div className="mx-auto w-full max-w-[720px]">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em]" style={{ color: GREEN }}>
            Diagnostic · gratuit · rapport sous 24 h
          </p>
          <h1 className="mt-5 font-serif text-[44px] leading-[1.02] sm:text-[60px]" style={{ color: INK, letterSpacing: "-0.026em" }}>
            Ce que votre cabinet <em className="italic" style={{ color: GREEN }}>laisse passer.</em>
          </h1>
          <p className="mt-6 max-w-[46ch] font-sans text-[16px] leading-[1.62]" style={{ color: MUTED }}>
            Une quinzaine de minutes de questions sur votre pratique. En retour, un rapport chiffré
            sur votre facturation, votre temps et vos obligations.
          </p>

          <div className="mt-12 space-y-8">
            {PROMESSES.map((pr) => (
              <div key={pr.num} className="border-t pt-5" style={{ borderColor: LINE }}>
                <div className="flex gap-6">
                  <span className="pt-1.5 font-mono text-[11px] tracking-[0.14em]" style={{ color: GREEN }}>
                    {pr.num}
                  </span>
                  <div>
                    <p className="font-serif text-[26px] leading-tight" style={{ color: INK }}>{pr.titre}</p>
                    <p className="mt-2 max-w-[46ch] font-sans text-[15px] leading-[1.6]" style={{ color: MUTED }}>
                      {pr.ligne}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BandePreuves />

      <section className="px-6 py-20 sm:px-11" style={{ background: BG }}>
        <div className="mx-auto w-full max-w-[720px]">
          <p className="font-mono text-[11px] uppercase tracking-[0.16em]" style={{ color: GREEN }}>
            Ce qu&apos;on regarde
          </p>
          <h2 className="mt-4 font-serif text-[30px] leading-[1.08] sm:text-[40px]" style={{ color: INK }}>
            Trois chiffres, tirés de vos réponses.
          </h2>
          <p className="mt-5 max-w-[52ch] font-sans text-[15px] leading-[1.65]" style={{ color: MUTED }}>
            Les questions portent sur votre façon de saisir le temps, de facturer, de tenir le
            fidéicommis et de suivre vos échéances. Le rapport ramène tout cela à ce qui se chiffre.
          </p>
          <ul className="mt-8 border-t" style={{ borderColor: LINE }}>
            {LIGNES_RAPPORT.map((l) => (
              <li key={l.lbl} className="flex items-center justify-between gap-4 border-b py-4" style={{ borderColor: LINE_SOFT }}>
                <span className="font-sans text-[13.5px]" style={{ color: MUTED }}>{l.lbl}</span>
                <span className="font-mono text-[15px] tabular-nums" style={{ color: INK }}>
                  {nombre(l.cible, l.decimales)}{l.suffixe}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 font-sans text-[12px]" style={{ color: FAINT }}>
            Exemple sur des données fictives. Vos chiffres viennent de vos réponses.
          </p>
        </div>
      </section>

      <SectionEtapes />
      <SectionQuestions />
      <SectionDepart onStart={onStart} />
    </>
  );
}

export default function DiagnosticPage() {
  const [lang, setLang] = useState<Lang | null>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  if (lang) return <AuditForm lang={lang} />;

  return (
    <div className="audit-v2-bg min-h-screen">
      <EnteteDiagnostic />

      {reduced ? (
        <DiagnosticStatique onStart={setLang} />
      ) : (
        <>
          <SceneRail stops={RAIL} />
          <SceneEntree />
          <BandePreuves />
          <SceneRapport />
          <SectionEtapes />
          <SectionQuestions />
          <SectionDepart onStart={setLang} />
        </>
      )}

      <Footer />
    </div>
  );
}
