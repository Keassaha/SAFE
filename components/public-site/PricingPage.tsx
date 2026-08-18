"use client";

/** Page publique de tarification, issue du copy révisé. */

import React, { useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  INK,
  MUTED,
  FAINT,
  GREEN,
  VERIFIED,
  LINE,
  SURFACE,
  BG,
  EASE,
  R,
  fadeUp,
  PageShell,
  PageHeader,
  scenePhase,
  easeOutCubic,
  easeInOutQuad,
  useScrollScrub,
  SceneRail,
  ScrollHint,
  type RailStop,
} from "./shared";
import { TARIFICATION } from "@/lib/tarification";

/* Offre fondatrice v2 : source unique dans lib/tarification.ts. */
const FOND = TARIFICATION.fondateurs;

/* Étapes du rail de droite, mêmes repères que l'accueil. */
const RAIL_STOPS: readonly RailStop[] = [
  { id: "scene-prix-clair", label: "Un prix clair" },
  { id: "sec-forfaits", label: "Forfaits" },
  { id: "sec-compris", label: "Ce qui est compris" },
  { id: "sec-fondateurs", label: "Cabinets fondateurs" },
  { id: "sec-questions", label: "Questions" },
];

/* ── La scène des frais, au téléphone ──────────────────────────────────────
   Sur écran large, la scène se joue au défilement : cinq frais paraissent un à
   un, se rayent, s'effacent, et le prix reste seul. Elle réserve 340vh pour
   cela.

   Au pouce, la même mise en scène coûtait 3,4 écrans de défilement et, une fois
   le mouvement retiré, n'affichait plus que son dernier instant : cinq
   pastilles invisibles occupant toujours leur place, un prix posé en absolu au
   milieu du vide.

   La version téléphone garde l'argument et jette la chorégraphie. Les frais
   sont là, rayés, tous en même temps : c'est exactement ce que la scène
   raconte, « voici ce que vous ne paierez pas ». Le prix se pose dessous, dans
   le flux. Le propos tient en un écran au lieu de trois et demi.

   Les `!important` reprennent les styles en ligne que le scrub écrit à chaque
   image ; aucune feuille ne peut les atteindre autrement. */
const CSS_TELEPHONE = `
  @media (max-width: 860px) {
    #scene-prix-clair { height: auto !important; }
    #scene-prix-clair > div {
      position: static;
      min-height: 0;
      padding: 88px 20px 72px;
    }
    #scene-prix-clair [data-frais] {
      opacity: 1 !important;
      transform: none !important;
    }
    #scene-prix-clair [data-barre] { transform: scaleX(1) !important; }
    #scene-prix-clair [data-prix] {
      position: static;
      width: 100%;
      margin-top: 26px;
      opacity: 1 !important;
      transform: none !important;
    }
    #scene-prix-clair [data-legende] { margin-top: 16px; opacity: 1 !important; }
    #scene-prix-clair [data-scroll-hint] { display: none; }
  }
`;

/** Scène épinglée · les frais dispersés s'effacent, il reste un prix clair. */
function SceneFraisClairs() {
  const zone = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  const FRAIS = [
    { label: "Frais d'installation", x: 6, y: 12, r: -6 },
    { label: "Module comptable en option", x: 58, y: 4, r: 5 },
    { label: "Frais par utilisateur ajouté", x: 12, y: 62, r: 4 },
    { label: "Support prioritaire facturé", x: 64, y: 56, r: -4 },
    { label: "Mise à niveau annuelle", x: 36, y: 30, r: 7 },
  ];

  /* Fenêtres larges et décalées : chaque frais prend son temps pour paraître,
     puis s'efface un à un plutôt que tout le groupe d'un coup. */
  useScrollScrub(zone, (p) => {
    const root = stage.current;
    if (!root) return;
    root.querySelectorAll<HTMLElement>("[data-frais]").forEach((chip, i) => {
      const appear = easeInOutQuad(scenePhase(p, 0.03 + i * 0.035, 0.2 + i * 0.035));
      const gone = easeInOutQuad(scenePhase(p, 0.38 + i * 0.055, 0.62 + i * 0.055));
      chip.style.opacity = String(appear * (1 - gone));
      const drift = (1 - appear) * 16;
      chip.style.transform = `translateY(${drift - gone * 20}px) scale(${1 - gone * 0.1})`;
      const bar = chip.querySelector<HTMLElement>("[data-barre]");
      if (bar) {
        bar.style.transform = `scaleX(${easeOutCubic(scenePhase(p, 0.3 + i * 0.05, 0.46 + i * 0.05))})`;
      }
    });
    const price = root.querySelector<HTMLElement>("[data-prix]");
    if (price) {
      const a = easeOutCubic(scenePhase(p, 0.76, 0.94));
      price.style.opacity = String(a);
      price.style.transform = `translate(-50%, -50%) scale(${0.94 + a * 0.06})`;
    }
    const legend = root.querySelector<HTMLElement>("[data-legende]");
    if (legend) legend.style.opacity = String(scenePhase(p, 0.93, 1));
    const hint = zone.current?.querySelector<HTMLElement>("[data-scroll-hint]");
    if (hint) hint.style.opacity = String(1 - scenePhase(p, 0.02, 0.1));
  });

  return (
    <div ref={zone} id="scene-prix-clair" className="relative" style={{ height: "340vh" }}>
      <style dangerouslySetInnerHTML={{ __html: CSS_TELEPHONE }} />
      <div className="sticky top-0 flex min-h-screen flex-col items-center justify-center px-6" style={{ background: BG }}>
        <div className="w-full max-w-[860px]">
          <p className="text-center font-mono text-[12px] uppercase tracking-[0.12em]" style={{ color: GREEN }}>
            Ce que vous ne verrez pas ici
          </p>
          {/* Éparpillement sur écran large, empilement en dessous.
              La dispersion dit « des frais partout » ; en colonne étroite elle
              dit surtout n'importe quoi. Mesuré à 375 px : trois paires de
              pastilles se recouvraient et deux passaient à la ligne. Un
              chevauchement se lit comme un défaut, pas comme une intention.

              L'empilement garde le propos : les frais se posent un à un, se
              rayent un à un, puis disparaissent. Même chorégraphie, lue de
              haut en bas au lieu d'être lue en désordre.

              Bascule à 768 px et non à 640 : mesuré à 640, deux pastilles
              passaient encore sur trois lignes, et la barre de rature ne
              traverse qu'une ligne. `md:whitespace-nowrap` interdit la coupure
              une fois la dispersion active — un frais se lit d'un trait.

              Position et rotation passent par des variables CSS pour ne
              s'appliquer qu'à partir du point de bascule : un style en ligne
              ne sait pas répondre à une requête de média. */}
          <div
            ref={stage}
            className="relative mx-auto mt-8 flex w-full flex-col items-center gap-3 md:block md:h-[520px]"
          >
            {FRAIS.map((f) => (
              <div
                key={f.label}
                data-frais
                className="relative inline-flex max-w-full items-center justify-center rounded-full border bg-white px-5 py-3 text-center font-serif text-[14px] sm:text-[15px] md:absolute md:left-[var(--fx)] md:top-[var(--fy)] md:max-w-none md:whitespace-nowrap md:px-7 md:py-3.5 md:text-[17px] md:[rotate:var(--fr)]"
                style={
                  {
                    "--fx": `${f.x}%`,
                    "--fy": `${f.y}%`,
                    "--fr": `${f.r}deg`,
                    borderColor: LINE,
                    color: MUTED,
                    boxShadow: "0 16px 32px -20px rgba(11,31,25,0.4)",
                    opacity: 0,
                  } as React.CSSProperties
                }
              >
                {f.label}
                <span
                  data-barre
                  aria-hidden
                  className="pointer-events-none absolute left-4 right-4 top-1/2 h-[1.5px] origin-left"
                  style={{ background: "rgba(31,42,36,0.55)", transform: "scaleX(0)" }}
                />
              </div>
            ))}
            <div
              data-prix
              className="absolute left-1/2 top-1/2 w-[min(96%,460px)] rounded-[18px] border bg-white p-7 text-center md:w-[min(92%,460px)] md:p-10"
              style={{
                borderColor: "rgb(var(--si-forest-rgb) / 0.35)",
                boxShadow: "0 40px 80px -44px rgba(11,31,25,0.55)",
                opacity: 0,
                transform: "translate(-50%, -50%)",
              }}
            >
              <p className="font-mono text-[11px] uppercase tracking-[0.14em]" style={{ color: GREEN }}>Un prix clair</p>
              <p className="mt-4 font-mono text-[46px] leading-none tabular-nums md:text-[64px]" style={{ color: INK }}>
                99 $<span className="font-mono text-[15px] md:text-[17px]" style={{ color: MUTED }}> / mois</span>
              </p>
              <p className="mt-3 font-serif text-[13.5px] leading-[1.55]" style={{ color: MUTED }}>
                Configuration initiale comprise. Rien à ajouter pour travailler.
              </p>
            </div>
          </div>
          <p data-legende className="mx-auto mt-2 max-w-[52ch] text-center font-serif text-[13.5px]" style={{ color: FAINT, opacity: 0 }}>
            Solo à 99 $ par mois, Cabinet à 149 $ par mois. C&apos;est tout.
          </p>
        </div>
        <ScrollHint />
      </div>
    </div>
  );
}

const COMPRIS = [
  "Fidéicommis rapproché à trois voies, certification bloquée en cas d'écart",
  "Dossiers, clients et parties reliés, avec leurs documents et échéances",
  "Temps et débours rattachés au dossier, prêts à facturer",
  "Facturation avec taxes, suivi des paiements et relances",
  "Configuration initiale avec votre équipe, comprise dans le prix",
];

function FactureFigure() {
  const lignes = [
    ["Honoraires professionnels", "6,5 h approuvées · mai 2026", "2 925,00 $"],
    ["Débours · Frais de greffe", "Rattaché au dossier le 12 mai", "195,00 $"],
    ["Débours · Signification par huissier", "Rattaché au dossier le 21 mai", "80,00 $"],
  ];
  const totaux = [
    ["Sous-total", "3 200,00 $"],
    ["TPS (5 %)", "160,00 $"],
    ["TVQ (9,975 %)", "319,20 $"],
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      data-revele=""
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7 }}
      className="relative overflow-hidden rounded-[12px] border bg-white p-7 sm:p-8"
      style={{ borderColor: LINE, boxShadow: "0 36px 70px -42px rgba(11,31,25,0.5)" }}
    >
      <div className="flex items-baseline justify-between">
        <span className="font-serif text-[24px]" style={{ color: INK }}>Facture 2026-041</span>
        <span className="font-mono text-[11px]" style={{ color: FAINT }}>2 JUIN 2026</span>
      </div>
      <p className="mt-1 border-b pb-4 font-sans text-[12.5px]" style={{ borderColor: LINE, color: MUTED }}>
        Succession Tremblay · Dossier 2026-014
      </p>
      {lignes.map(([desc, sub, amt], i) => (
        <motion.div
          key={desc}
          initial={{ opacity: 0.25, y: 8 }}
          data-revele=""
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.18 + i * 0.16, duration: 0.66, ease: EASE }}
          className="flex items-start justify-between gap-3 border-b py-3"
          style={{ borderColor: "rgba(31,42,36,0.05)" }}
        >
          <span className="font-sans text-[13px]" style={{ color: INK }}>
            {desc}
            <span className="mt-0.5 block text-[11.5px]" style={{ color: FAINT }}>{sub}</span>
          </span>
          <span className="whitespace-nowrap font-mono text-[13px]" style={{ color: INK }}>{amt}</span>
        </motion.div>
      ))}
      <div className="ml-auto mt-4 max-w-[280px]">
        {totaux.map(([label, amt], i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0 }}
            data-revele=""
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.62 + i * 0.12, duration: 0.6, ease: EASE }}
            className="flex justify-between py-1 font-sans text-[12.5px]"
            style={{ color: MUTED }}
          >
            <span>{label}</span>
            <span className="font-mono" style={{ color: INK }}>{amt}</span>
          </motion.div>
        ))}
        <motion.div
          initial={{ opacity: 0 }}
          data-revele=""
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.95, duration: 0.6, ease: EASE }}
          className="mt-2 flex justify-between border-t pt-2.5 font-sans text-[14px]"
          style={{ borderColor: LINE, color: INK }}
        >
          <span>Total</span>
          <span className="font-mono text-[16px]">3 679,20 $</span>
        </motion.div>
      </div>
      <motion.span
        initial={{ opacity: 0, scale: 1.5, rotate: -8 }}
        data-revele=""
        whileInView={{ opacity: 1, scale: 1, rotate: -8 }}
        viewport={{ once: true }}
        transition={{ delay: 1.15, duration: 0.6, ease: EASE }}
        className="absolute bottom-9 left-8 rounded-[8px] border-2 px-4 py-1.5 font-mono text-[12px] uppercase tracking-[0.1em]"
        style={{ borderColor: GREEN, color: GREEN }}
      >
        Payée · 14 juin
      </motion.span>
    </motion.div>
  );
}

const FORFAITS = [
  {
    nom: "Solo",
    prix: "99 $",
    periode: "par mois",
    pour: "Pour l’avocate ou l’avocat qui exerce seul.",
    desc: "Fidéicommis, dossiers, temps et facturation dans un même abonnement.",
    accent: false,
  },
  {
    nom: "Cabinet",
    prix: "149 $",
    periode: "par mois",
    pour: "Pour les petits cabinets qui travaillent en équipe.",
    desc: "Tout ce qui est compris dans Solo, avec l’accès pour votre équipe.",
    accent: true,
  },
];

const QUESTIONS = [
  {
    q: "Est-ce que SAFE vaut son prix ?",
    r: "Comparez le coût à ce que vous consacrez aujourd’hui aux vérifications, aux doubles saisies et à la préparation des rapprochements. La rencontre de découverte vous aidera à faire ce calcul avec votre réalité.",
  },
  {
    q: "Y a-t-il un engagement annuel ?",
    r: "Non. Les forfaits réguliers sont mensuels.",
  },
  {
    q: "À qui appartiennent mes données ?",
    r: "À votre cabinet. Vous pouvez les exporter dans les formats offerts par SAFE.",
  },
];

export default function TarificationPage() {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Tarification"
        titre="Un prix clair. L’accompagnement compris."
        intro="La configuration initiale est incluse. Aucun frais d’installation ne s’ajoute."
      />

      <SceneRail stops={RAIL_STOPS} />

      <SceneFraisClairs />

      {/* Forfaits */}
      <section id="sec-forfaits" className="px-6 pb-8" style={{ background: BG }}>
        <div className="mx-auto grid max-w-4xl gap-5 sm:grid-cols-2">
          {FORFAITS.map((f, i) => (
            <motion.div
              key={f.nom}
              {...fadeUp(0.06 + i * 0.06)}
              className="flex flex-col rounded-[16px] p-7"
              style={{
                background: SURFACE,
                border: `1px solid ${f.accent ? "rgb(var(--si-forest-rgb) / 0.35)" : LINE}`,
                boxShadow: f.accent ? "0 30px 60px -40px rgba(11,31,25,0.4)" : "none",
              }}
            >
              <span className="font-mono text-[12px] uppercase tracking-[0.1em]" style={{ color: f.accent ? GREEN : FAINT }}>
                {f.nom}
              </span>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-mono text-[38px] tabular-nums leading-none" style={{ color: INK }}>
                  {f.prix}
                </span>
                <span className="font-mono text-[14px]" style={{ color: MUTED }}>
                  {f.periode}
                </span>
              </div>
              <p className="mt-5 font-serif text-[16px] leading-[1.5]" style={{ color: INK }}>
                {f.pour}
              </p>
              <p className="mt-2 font-serif text-[15px] leading-[1.55]" style={{ color: MUTED }}>
                {f.desc}
              </p>
              <div className="mt-6">
                <Link
                  href={R.diagnostic}
                  className="safe-zoom inline-flex h-10 items-center rounded-[8px] px-4 font-sans text-[14px] font-medium transition-transform duration-200"
                  style={
                    f.accent
                      ? { background: GREEN, color: "#fff" }
                      : { background: "transparent", color: INK, border: `1px solid ${LINE}` }
                  }
                >
                  Faire le diagnostic
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
        <motion.p {...fadeUp(0.2)} className="mx-auto mt-4 max-w-4xl font-serif text-[13px]" style={{ color: FAINT }}>
          Prix en dollars canadiens. Taxes applicables en sus.
        </motion.p>
      </section>

      {/* Ce que le forfait comprend, ancré dans du concret */}
      <section id="sec-compris" className="px-6 py-20" style={{ background: BG }}>
        <div className="mx-auto grid max-w-[1100px] gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div>
            <motion.p {...fadeUp(0)} className="font-mono text-[12px] uppercase tracking-[0.12em]" style={{ color: GREEN }}>
              Compris dans les deux forfaits
            </motion.p>
            <motion.h2
              {...fadeUp(0.06)}
              className="mt-4 font-serif text-[28px] leading-[1.12] sm:max-w-[20ch] sm:text-[36px]"
              style={{ color: INK, letterSpacing: "-0.016em" }}
            >
              Du temps saisi au paiement, sans module à ajouter.
            </motion.h2>
            <ul className="mt-7 space-y-3.5">
              {COMPRIS.map((c, i) => (
                <motion.li
                  key={c}
                  initial={{ opacity: 0, y: 10 }}
                  data-revele=""
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.08 + i * 0.1, duration: 0.7, ease: EASE }}
                  className="flex gap-3 font-serif text-[15px] leading-[1.55]"
                  style={{ color: MUTED }}
                >
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ background: GREEN }} aria-hidden />
                  {c}
                </motion.li>
              ))}
            </ul>
          </div>
          <div>
            <FactureFigure />
            <p className="mt-3 font-serif text-[13px]" style={{ color: FAINT }}>
              La facture du dossier de démonstration, telle que SAFE la construit à partir du temps
              et des débours déjà rattachés.
            </p>
          </div>
        </div>
      </section>

      {/* Offre fondateurs */}
      <section id="sec-fondateurs" className="px-6 py-20" style={{ background: BG }}>
        <motion.div
          {...fadeUp(0)}
          className="mx-auto max-w-3xl rounded-[18px] p-8 sm:p-10"
          style={{ background: "#14261F", color: "#EAF2EC" }}
        >
          <span className="font-mono text-[12px] uppercase tracking-[0.12em]" style={{ color: "rgb(var(--si-surface-rgb) / 0.72)" }}>
            Cabinets fondateurs
          </span>
          <h2 className="mt-4 font-serif text-[28px] leading-[1.15] sm:max-w-[22ch] sm:text-[36px]" style={{ letterSpacing: "-0.015em" }}>
            Participez aux premières étapes de SAFE.
          </h2>
          <div className="mt-5 space-y-4 font-serif text-[15.5px] leading-[1.6]" style={{ color: "#C4D4C9" }}>
            <p>
              Nous ouvrons {FOND.placesTotal} places à des cabinets qui veulent utiliser SAFE et
              contribuer directement à son amélioration.
            </p>
            <p>
              Vos {FOND.dureeMois} premiers mois sont à {FOND.premiereAnneeSolo} $ par mois pour une
              pratique individuelle, {FOND.premiereAnneeCabinet} $ pour un cabinet avec adjointe.
              Ensuite, votre tarif fondateur reste gelé à {FOND.apresSolo} $ ou {FOND.apresCabinet} $
              tant que votre abonnement demeure actif. Votre coût ne double pas au treizième mois.
            </p>
          </div>

          <ul className="mt-7 space-y-3 font-serif text-[15px] leading-[1.55]" style={{ color: "#EAF2EC" }}>
            {[
              "La mise en route est faite par nous : paramétrage, reprise de vos dossiers actifs et de vos soldes de fidéicommis, formation de votre adjointe.",
              "Un atelier chaque semaine avec les autres cabinets fondateurs, et vos questions traitées là.",
              "Aucun engagement de durée. Si dans les soixante premiers jours vous jugez que SAFE ne vous apporte rien, les mois payés vous sont remboursés.",
              "Vos données restent les vôtres et s’exportent quand vous le voulez.",
              "Avant de signer, vous recevez par écrit la liste de ce que SAFE ne fait pas encore.",
            ].map((item) => (
              <li key={item} className="flex gap-3">
                <span aria-hidden style={{ color: "rgb(var(--si-surface-rgb) / 0.72)" }}>—</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <p className="mt-7 font-serif text-[15px] leading-[1.6]" style={{ color: "#C4D4C9" }}>
            En retour, nous demandons trente minutes par mois les trois premiers mois, puis une
            fois par trimestre, pour que vous nous disiez ce qui bloque. Et quelques phrases de
            votre part le jour où les résultats seront là.
          </p>

          <p className="mt-4 font-serif text-[14px] leading-[1.6]" style={{ color: "rgb(var(--si-surface-rgb) / 0.72)" }}>
            Chaque mise en route est faite à la main, ce qui nous limite à{" "}
            {FOND.miseEnRouteParMois} cabinets par mois. C’est pour cela qu’il y a{" "}
            {FOND.placesTotal} places et pas trente.
            {FOND.placesPrises > 0 && (
              <>
                {" "}
                {FOND.placesPrises === 1
                  ? `Une place sur ${FOND.placesTotal} est déjà prise.`
                  : `${FOND.placesPrises} places sur ${FOND.placesTotal} sont déjà prises.`}
              </>
            )}
          </p>

          <Link
            href={R.demo}
            className="safe-zoom mt-7 inline-flex h-11 items-center rounded-[8px] px-5 font-sans text-[15px] font-medium transition-transform duration-200"
            style={{ background: GREEN, color: "#fff" }}
          >
            Vérifier s’il reste une place
          </Link>
        </motion.div>
      </section>

      {/* Décision réversible + questions rapides */}
      <section id="sec-questions" className="px-6 py-20" style={{ background: SURFACE, borderTop: `1px solid ${LINE}` }}>
        <div className="mx-auto max-w-2xl">
          <motion.h2 {...fadeUp(0)} className="font-serif text-[24px] leading-[1.2] sm:text-[30px]" style={{ color: INK, letterSpacing: "-0.015em" }}>
            Une décision réversible.
          </motion.h2>
          <motion.p {...fadeUp(0.06)} className="mt-4 font-serif text-[16px] leading-[1.6]" style={{ color: MUTED }}>
            Les forfaits réguliers sont mensuels. Vous pouvez mettre fin à votre abonnement selon
            les modalités prévues et récupérer vos données dans les formats d’export offerts.
          </motion.p>

          <div className="mt-12 space-y-8">
            {QUESTIONS.map((item, i) => (
              <motion.div key={item.q} {...fadeUp(0.06 + i * 0.05)} className="pt-6" style={{ borderTop: `1px solid ${LINE}` }}>
                <h3 className="font-serif text-[18px] font-normal" style={{ color: INK }}>
                  {item.q}
                </h3>
                <p className="mt-2 font-serif text-[15px] leading-[1.6]" style={{ color: MUTED }}>
                  {item.r}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
