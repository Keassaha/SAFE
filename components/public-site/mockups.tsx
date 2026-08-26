"use client";

/**
 * Maquettes interactives de SAFE pour le site public.
 *
 * Principe : partout où l'on montrait une capture d'écran figée, on montre une
 * reproduction manipulable de l'interface. Le visiteur clique, saisit, navigue.
 * Ce ne sont pas des captures et ce n'est pas le vrai logiciel : ce sont des
 * maquettes fidèles, sur des données fictives, annoncées comme telles.
 *
 * Règles :
 * - le cadre `SafeWindow` porte toujours la mention « maquette » ;
 * - chaque zone cliquable a une affordance visible (pastille, curseur, libellé) ;
 * - aucune donnée réelle, aucun appel réseau.
 */

import React, { useMemo, useState } from "react";
import { CASH_THRESHOLD_CAD } from "@/lib/compliance/cash";
import { INK, MUTED, FAINT, GREEN, VERIFIED, AMBER, LINE, LINE_SOFT, SURFACE } from "./shared";
import { SafeBullet, SafeLogo } from "@/components/branding/SafeLogo";

/* ────────────────────────────── Cadre commun ────────────────────────────── */

/**
 * Adaptations téléphone communes à toutes les maquettes :
 * cibles tactiles d'au moins 44 px, aucun texte sous 11 px, champs qui ne
 * déclenchent pas le zoom automatique d'iOS (16 px minimum sur les entrées).
 */
export function StylesMaquettesMobiles() {
  return (
    <style>{`
      @media (max-width: 860px) {
        .safe-mock button,
        .safe-mock select,
        .safe-mock [role="button"] { min-height: 44px; }
        .safe-mock input,
        .safe-mock select { min-height: 44px; font-size: 16px !important; }
        .safe-mock .mock-mini { font-size: 11px !important; }
        .safe-mock table td,
        .safe-mock table th { font-size: 12px !important; }
      }
    `}</style>
  );
}

export function SafeWindow({
  fil,
  indice = "Maquette · cliquez pour explorer",
  children,
}: {
  fil: React.ReactNode;
  indice?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="safe-mock overflow-hidden rounded-[14px] border"
      style={{
        borderColor: LINE,
        background: SURFACE,
        boxShadow: "0 34px 68px -42px rgba(11,31,25,0.5)",
      }}
    >
      <StylesMaquettesMobiles />
      {/* Les surfaces sombres de l'application passent toutes par le dégradé
          d'action et portent une lueur verte : l'application ne peint jamais
          un aplat d'encre, il n'existe pas un seul fond plat dans le produit
          (retour CEO du 19 août 2026, vérifié dans components/ds-safe). */}
      <div
        className="relative flex flex-wrap items-center justify-between gap-2 overflow-hidden px-4 py-2.5 sm:px-5"
        style={{
          backgroundColor: "var(--si-ink)",
          backgroundImage:
            "linear-gradient(135deg, var(--si-ink) 0%, var(--si-action-vert) 100%)",
          color: "#E9EFE9",
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute -right-[50px] -top-[70px] h-[230px] w-[230px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(46, 125, 91, 0.4), transparent 70%)" }}
        />
        <span className="relative z-10 flex items-center gap-2 font-sans text-[12px]">
          <b className="font-medium">SAFE</b>
          <span style={{ opacity: 0.45 }}>·</span>
          {fil}
        </span>
        <span className="mock-mini relative z-10 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: "var(--si-verified-on-forest)" }}>
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full" style={{ background: "var(--si-verified-on-forest)", opacity: 0.6 }} />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: "var(--si-verified-on-forest)" }} />
          </span>
          {indice}
        </span>
      </div>
      {children}
    </div>
  );
}

/**
 * Invitation sous une maquette.
 * Repère graphique maison (chevron du logo), jamais d'émoji.
 *
 * En serif : c'est la page qui s'adresse au lecteur, pas un libellé de la
 * maquette au-dessus. La frontière de la vitrine passe ici, au bord de
 * l'écran dessiné.
 */
export function IndiceEssai({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 flex items-start gap-2.5 font-serif text-[13px]" style={{ color: VERIFIED }}>
      <span className="mt-[5px] shrink-0" style={{ color: GREEN }}>
        <SafeBullet size={11} />
      </span>
      {children}
    </p>
  );
}

const money = (n: number) =>
  n.toLocaleString("fr-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " $";

/* ──────────────────── 1. La journée du cabinet ────────────────────
   Reproduit l'écran « Aujourd'hui » (app/(app)/aujourdhui/page.tsx), qui compose
   la file de l'adjointe (lib/dossiers/assistant-queue) et la Navette : une seule
   prochaine action, ce qui attend une validation, les échéances qui approchent,
   ce qui dort chez le client. On traite un élément, le suivant prend sa place.
   Aucune relance n'est envoyée ici : l'écran montre, il ne poste rien. */

type ElementDuJour = { action: string; dossier: string; delai: string; retard?: boolean };

const FILE_DU_JOUR: ElementDuJour[] = [
  {
    action: "Consigner les 2 h d'audition de mardi",
    dossier: "2026-008 · Vente Beaulieu",
    delai: "en retard de 2 jours",
    retard: true,
  },
  {
    action: "Demander la déclaration de revenus 2025",
    dossier: "2026-021 · Garde partagée Nadeau",
    delai: "dans 3 jours",
  },
  {
    action: "Faire signer le mandat de représentation",
    dossier: "2026-014 · Succession Tremblay",
    delai: "dans 6 jours",
  },
];

const A_VALIDER: [string, string][] = [
  ["Projet de mise en demeure", "préparé par Aaliyah · 2026-021"],
  ["Facture 2026-041 · 4 072,41 $", "préparée par Aaliyah · 2026-014"],
];

const ECHEANCES: [string, string, string][] = [
  ["Divulgation des pièces", "2026-021", "3 j"],
  ["Signification de la demande", "2026-014", "8 j"],
  ["Publication de l'acte de vente", "2026-008", "15 j"],
];

const CHEZ_LE_CLIENT: [string, string][] = [
  ["Relevés bancaires 2025", "demandés il y a 6 jours"],
  ["Procuration signée", "demandée il y a 2 jours"],
];

export function MockupAujourdhui() {
  const [traites, setTraites] = useState(0);
  const [approuves, setApprouves] = useState<number[]>([]);
  const courant = FILE_DU_JOUR[traites] ?? null;
  const restants = FILE_DU_JOUR.length - traites;

  return (
    <div>
      <SafeWindow fil={<span>Aujourd&apos;hui · Cabinet Nadeau</span>} indice="Maquette · traitez un élément">
        <div className="p-4 sm:p-5">
          {/* En-tête : ce qui reste, et rien d'autre. */}
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b pb-3" style={{ borderColor: LINE }}>
            <span className="font-serif text-[19px]" style={{ color: INK }}>Bonjour Aaliyah</span>
            <span className="mock-mini font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: FAINT }}>
              Jeudi 11 juin 2026 · 12 dossiers actifs
            </span>
          </div>
          <p className="mt-2 flex items-center gap-2 font-sans text-[12px]" style={{ color: restants > 0 ? AMBER : VERIFIED }}>
            <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "currentColor" }} aria-hidden />
            {restants > 0
              ? `${restants} élément${restants > 1 ? "s" : ""} attend${restants > 1 ? "ent" : ""} une intervention.`
              : "Rien ne vous échappe aujourd'hui."}
          </p>

          {/* Une seule prochaine action. C'est le propos de l'écran. */}
          <div
            className="mt-3 rounded-[10px] border p-3.5"
            style={{
              borderColor: courant ? "rgb(var(--si-ink-strong-rgb) / 0.35)" : LINE,
              background: courant ? "rgb(var(--si-ink-strong-rgb) / 0.04)" : "#fff",
            }}
          >
            <p className="mock-mini font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: courant ? GREEN : FAINT }}>
              Votre prochaine action
            </p>
            {courant ? (
              <div className="mt-1.5 flex flex-wrap items-end justify-between gap-3">
                <span className="min-w-0">
                  <span className="block font-sans text-[14px] leading-[1.35]" style={{ color: INK }}>
                    {courant.action}
                  </span>
                  <span className="mock-mini mt-1 flex flex-wrap items-center gap-2 font-mono text-[10px]" style={{ color: FAINT }}>
                    {courant.dossier}
                    <span
                      className="rounded-full px-2 py-0.5"
                      style={
                        courant.retard
                          ? { background: "rgb(var(--si-amber-rgb) / 0.14)", color: AMBER }
                          : { background: "rgb(var(--si-line-ink-rgb) / 0.06)", color: MUTED }
                      }
                    >
                      {courant.delai}
                    </span>
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setTraites((n) => n + 1)}
                  className="safe-zoom inline-flex h-9 shrink-0 items-center rounded-[7px] px-4 font-sans text-[13px] font-medium"
                  style={{ background: GREEN, color: "#fff" }}
                >
                  Faire maintenant →
                </button>
              </div>
            ) : (
              <div className="mt-1.5 flex flex-wrap items-center justify-between gap-3">
                <span className="font-sans text-[14px]" style={{ color: VERIFIED }}>
                  La file du jour est vide.
                </span>
                <button
                  type="button"
                  onClick={() => { setTraites(0); setApprouves([]); }}
                  className="font-sans text-[12px] underline underline-offset-2"
                  style={{ color: FAINT }}
                >
                  Recommencer
                </button>
              </div>
            )}
          </div>

          <div className="mt-3 grid items-start gap-3 lg:grid-cols-[1.05fr_0.95fr]">
            {/* Prêts pour validation */}
            <div className="rounded-[9px] border p-3" style={{ borderColor: LINE, background: "#fff" }}>
              <p className="mock-mini font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: FAINT }}>
                Prêts pour votre validation
              </p>
              <div className="mt-2 space-y-1.5">
                {A_VALIDER.map(([titre, meta], i) => {
                  const fait = approuves.includes(i);
                  return (
                    <div
                      key={titre}
                      className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 last:border-0 last:pb-0"
                      style={{ borderColor: LINE_SOFT }}
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-sans text-[12px]" style={{ color: INK }}>{titre}</span>
                        <span className="mock-mini block truncate font-sans text-[10px]" style={{ color: FAINT }}>{meta}</span>
                      </span>
                      {fait ? (
                        <span className="mock-mini shrink-0 font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: VERIFIED }}>
                          Approuvé
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setApprouves((a) => [...a, i])}
                          className="safe-zoom inline-flex h-8 shrink-0 items-center rounded-[7px] border px-3 font-sans text-[12px] font-medium"
                          style={{ borderColor: "rgb(var(--si-ink-strong-rgb) / 0.35)", color: VERIFIED, background: "#fff" }}
                        >
                          Approuver
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Échéances + attente client */}
            <div className="space-y-3">
              <div className="rounded-[9px] border p-3" style={{ borderColor: LINE, background: "#fff" }}>
                <p className="mock-mini font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: FAINT }}>
                  Échéances
                </p>
                <div className="mt-1.5">
                  {ECHEANCES.map(([label, dossier, jours]) => (
                    <div key={label} className="flex items-center justify-between gap-3 border-b py-1.5 last:border-0" style={{ borderColor: LINE_SOFT }}>
                      <span className="min-w-0">
                        <span className="block truncate font-sans text-[12px]" style={{ color: INK }}>{label}</span>
                        <span className="mock-mini block font-mono text-[10px]" style={{ color: FAINT }}>{dossier}</span>
                      </span>
                      <span className="mock-mini shrink-0 font-mono text-[11px] tabular-nums" style={{ color: MUTED }}>{jours}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[9px] border p-3" style={{ borderColor: LINE, background: "#fff" }}>
                <p className="mock-mini font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: FAINT }}>
                  En attente du client
                </p>
                <div className="mt-1.5">
                  {CHEZ_LE_CLIENT.map(([label, meta]) => (
                    <div key={label} className="flex items-center justify-between gap-3 border-b py-1.5 last:border-0" style={{ borderColor: LINE_SOFT }}>
                      <span className="truncate font-sans text-[12px]" style={{ color: INK }}>{label}</span>
                      <span className="mock-mini shrink-0 font-sans text-[10px]" style={{ color: FAINT }}>{meta}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SafeWindow>
      <IndiceEssai>
        Traitez la prochaine action : la suivante prend sa place, et le compte du haut suit.
      </IndiceEssai>
    </div>
  );
}

/* ──────────────────── 2. Du travail consigné au travail facturable ────────────────────
   Le temps se prend au chronomètre ou après coup, le forfait s'inscrit comme un
   montant, le débours se rattache au même dossier. Les trois se retrouvent dans
   le total « prêt à facturer », qui est ce que /facturation agrège réellement
   (lib/billing/queries : temps, forfaits et dépenses refacturables). */

type Entree = {
  id: number;
  desc: string;
  dossier: string;
  heures: number;
  taux: number;
  genre: "horaire" | "forfait" | "debours";
  facturee: boolean;
};

const DOSSIERS = [
  "Succession Tremblay · 2026-014",
  "Garde partagée Nadeau · 2026-021",
  "Vente Beaulieu · 2026-008",
];

const ENTREES_INITIALES: Entree[] = [
  { id: 1, desc: "Rédaction de la requête en vérification", dossier: DOSSIERS[0], heures: 2.1, taux: 450, genre: "horaire", facturee: false },
  { id: 2, desc: "Appel avec la liquidatrice", dossier: DOSSIERS[0], heures: 0.8, taux: 450, genre: "horaire", facturee: false },
  { id: 3, desc: "Copies certifiées et expédition", dossier: DOSSIERS[0], heures: 0, taux: 342, genre: "debours", facturee: false },
];

const MODES = [
  { cle: "horaire", label: "Heures" },
  { cle: "forfait", label: "Forfait" },
  { cle: "debours", label: "Débours" },
] as const;

type ModeSaisie = (typeof MODES)[number]["cle"];

export function MockupTravailFacturable() {
  const [entrees, setEntrees] = useState<Entree[]>(ENTREES_INITIALES);
  const [desc, setDesc] = useState("");
  const [dossier, setDossier] = useState(DOSSIERS[0]);
  const [heures, setHeures] = useState("1,5");
  const [montant, setMontant] = useState("750");
  const [facture, setFacture] = useState(false);
  const [dernierId, setDernierId] = useState<number | null>(null);
  const [mode, setMode] = useState<ModeSaisie>("horaire");

  /* Chronomètre : certains avocats comptent au fil du travail. */
  const [secondes, setSecondes] = useState(0);
  const [enMarche, setEnMarche] = useState(false);

  React.useEffect(() => {
    if (!enMarche) return;
    const t = setInterval(() => setSecondes((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [enMarche]);

  const horloge = `${String(Math.floor(secondes / 3600)).padStart(2, "0")}:${String(
    Math.floor((secondes % 3600) / 60)
  ).padStart(2, "0")}:${String(secondes % 60).padStart(2, "0")}`;

  function verserLeChrono() {
    if (secondes < 1) return;
    const h = Math.max(0.01, Math.round((secondes / 3600) * 100) / 100);
    setHeures(h.toFixed(2).replace(".", ","));
    setEnMarche(false);
    setSecondes(0);
    setMode("horaire");
  }

  /* un forfait et un débours portent leur montant dans `taux` et zéro heure */
  const valeur = (e: Entree) => (e.genre === "horaire" ? e.heures * e.taux : e.taux);
  const ouvertes = useMemo(() => entrees.filter((e) => !e.facturee), [entrees]);
  const honoraires = useMemo(
    () => ouvertes.filter((e) => e.genre !== "debours").reduce((s, e) => s + valeur(e), 0),
    [ouvertes]
  );
  const debours = useMemo(
    () => ouvertes.filter((e) => e.genre === "debours").reduce((s, e) => s + valeur(e), 0),
    [ouvertes]
  );

  function ajouter(e: React.FormEvent) {
    e.preventDefault();
    if (!desc.trim()) return;
    const id = Date.now();
    if (mode === "horaire") {
      const h = parseFloat(heures.replace(",", "."));
      if (!Number.isFinite(h) || h <= 0) return;
      setEntrees((prev) => [{ id, desc: desc.trim(), dossier, heures: h, taux: 450, genre: "horaire", facturee: false }, ...prev]);
    } else {
      const m = parseFloat(montant.replace(",", "."));
      if (!Number.isFinite(m) || m <= 0) return;
      setEntrees((prev) => [{ id, desc: desc.trim(), dossier, heures: 0, taux: m, genre: mode, facturee: false }, ...prev]);
    }
    setDernierId(id);
    setDesc("");
    setHeures("1,5");
    setFacture(false);
  }

  function reinitialiser() {
    setEntrees(ENTREES_INITIALES);
    setFacture(false);
    setDernierId(null);
  }

  const etiquetteGenre = (e: Entree) =>
    e.genre === "horaire" ? e.heures.toFixed(2).replace(".", ",") + " h" : e.genre === "forfait" ? "forfait" : "débours";

  return (
    <div>
      <SafeWindow fil={<span>Dossier 2026-014 · prêt à facturer</span>} indice="Maquette · inscrivez du travail">
        <div className="p-4 sm:p-5">
          {/* Totaux. Un chiffre par colonne, aligné à droite comme dans le produit. */}
          <div className="grid grid-cols-3 gap-2">
            {[
              ["Honoraires", money(honoraires), `${ouvertes.filter((e) => e.genre !== "debours").length} entrées`],
              ["Débours rattachés", money(debours), "refacturables"],
              ["Prêt à facturer", money(honoraires + debours), facture ? "porté à la facture" : "en attente"],
            ].map(([label, val, sous]) => (
              <div key={label} className="min-w-0 rounded-[9px] border px-2.5 py-2.5" style={{ borderColor: LINE, background: "#fff" }}>
                <p className="mock-mini truncate font-sans text-[10px]" style={{ color: FAINT }}>{label}</p>
                <p className="mt-1 truncate text-right font-mono text-[14px] tabular-nums" style={{ color: INK }}>{val}</p>
                <p className="mock-mini mt-0.5 truncate font-sans text-[10px]" style={{ color: FAINT }}>{sous}</p>
              </div>
            ))}
          </div>

          {/* Chronomètre */}
          <div
            className="mt-3 flex flex-wrap items-center gap-2.5 rounded-[10px] border px-3 py-2.5"
            style={{ borderColor: LINE, background: "#fff" }}
          >
            <span
              className="safe-zoom font-mono text-[19px] tabular-nums transition-colors"
              style={{ color: enMarche ? VERIFIED : INK }}
            >
              {horloge}
            </span>
            <button
              type="button"
              onClick={() => setEnMarche((v) => !v)}
              className="safe-zoom inline-flex h-8 items-center gap-1.5 rounded-[7px] px-3 font-sans text-[12px] font-medium transition-colors"
              style={
                enMarche
                  ? { background: "rgb(var(--si-line-ink-rgb) / 0.07)", color: INK }
                  : { background: GREEN, color: "#fff" }
              }
            >
              <span
                className="block"
                style={
                  enMarche
                    ? { width: 8, height: 8, background: "currentColor" }
                    : { width: 0, height: 0, borderLeft: "7px solid currentColor", borderTop: "5px solid transparent", borderBottom: "5px solid transparent" }
                }
                aria-hidden
              />
              {enMarche ? "Arrêter" : "Démarrer"}
            </button>
            <button
              type="button"
              onClick={verserLeChrono}
              disabled={secondes < 1}
              className="safe-zoom inline-flex h-8 items-center rounded-[7px] border px-3 font-sans text-[12px] transition-colors disabled:opacity-40"
              style={{ borderColor: LINE, color: MUTED, background: "#fff" }}
            >
              Verser dans l&apos;entrée
            </button>
            <span className="mock-mini ml-auto font-sans text-[10px]" style={{ color: FAINT }}>
              Ou inscrivez la durée après coup.
            </span>
          </div>

          {/* Saisie */}
          <form onSubmit={ajouter} className="mt-2.5 rounded-[10px] border p-3" style={{ borderColor: "rgb(var(--si-ink-strong-rgb) / 0.3)", background: "rgb(var(--si-ink-strong-rgb) / 0.04)" }}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="mock-mini font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: GREEN }}>
                Rattacher au dossier
              </p>
              <span className="inline-flex rounded-[7px] border p-0.5" style={{ borderColor: LINE, background: "#fff" }}>
                {MODES.map((m) => (
                  <button
                    key={m.cle}
                    type="button"
                    onClick={() => setMode(m.cle)}
                    className="safe-zoom rounded-[5px] px-2.5 py-1 font-sans text-[11px] transition-colors"
                    /* Onglet actif : le produit emploie le dégradé d'action,
                       voir RapportsView et Button. */
                    style={
                      mode === m.cle
                        ? {
                            backgroundColor: "var(--si-ink)",
                            backgroundImage:
                              "linear-gradient(135deg, var(--si-ink) 0%, var(--si-action-vert) 100%)",
                            color: "#fff",
                          }
                        : { color: MUTED }
                    }
                  >
                    {m.label}
                  </button>
                ))}
              </span>
            </div>
            {/* ── La rangée d'ajout ─────────────────────────────────────────
               Trois champs sur une rangée : le dossier, la valeur, le bouton.
               Sous 520 px, le dossier prend sa propre rangée, pleine largeur :
               « Succession Tremblay » y devenait « Succession T », et le
               chevron natif du menu mordait sur la lettre coupée. */}
            <div className="mt-2.5 grid grid-cols-[1fr_84px_auto] gap-2 max-[520px]:grid-cols-[1fr_auto]">
              <input
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder={mode === "debours" ? "Ex. Frais de signification" : "Ex. Préparation de l'audition"}
                aria-label={mode === "debours" ? "Nature du débours" : "Description du travail"}
                className="mock-input col-span-3 h-9 min-w-0 rounded-[7px] border px-2.5 font-sans text-[13px] outline-none max-[520px]:col-span-2"
                style={{ borderColor: LINE, background: "#fff", color: INK }}
              />
              <select
                value={dossier}
                onChange={(e) => setDossier(e.target.value)}
                aria-label="Dossier"
                /* Le retrait à droite laisse la place au chevron natif : sans
                   lui, le dernier caractère passe dessous. */
                className="mock-input h-9 min-w-0 rounded-[7px] border pl-2 pr-7 font-sans text-[12px] outline-none max-[520px]:col-span-2"
                style={{ borderColor: LINE, background: "#fff", color: INK }}
              >
                {DOSSIERS.map((d) => (
                  <option key={d} value={d}>{d.split(" · ")[0]}</option>
                ))}
              </select>
              <input
                value={mode === "horaire" ? heures : montant}
                onChange={(e) => (mode === "horaire" ? setHeures(e.target.value) : setMontant(e.target.value))}
                aria-label={mode === "horaire" ? "Durée en heures" : "Montant"}
                inputMode="decimal"
                className="mock-input h-9 min-w-0 rounded-[7px] border px-2 text-right font-mono text-[13px] tabular-nums outline-none"
                style={{ borderColor: LINE, background: "#fff", color: INK }}
              />
              <button
                type="submit"
                className="safe-zoom h-9 whitespace-nowrap rounded-[7px] px-4 font-sans text-[13px] font-medium transition-transform"
                style={{ background: GREEN, color: "#fff" }}
              >
                Ajouter
              </button>
            </div>
          </form>

          {/* Liste */}
          <div className="mt-4">
            {entrees.map((e) => (
              <div
                key={e.id}
                className="flex items-baseline justify-between gap-3 border-b py-2.5"
                style={{
                  borderColor: LINE_SOFT,
                  animation: e.id === dernierId ? "mockIn 0.5s cubic-bezier(0.16,1,0.3,1)" : undefined,
                }}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-sans text-[13px]" style={{ color: INK }}>{e.desc}</span>
                  <span className="mt-0.5 block truncate font-sans text-[11px]" style={{ color: FAINT }}>
                    {e.dossier}
                  </span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block font-mono text-[12px] tabular-nums" style={{ color: INK }}>
                    {etiquetteGenre(e)}
                  </span>
                  <span className="mock-mini block font-mono text-[10px] tabular-nums" style={{ color: e.facturee ? VERIFIED : FAINT }}>
                    {e.facturee ? "portée à la facture" : money(valeur(e))}
                  </span>
                </span>
              </div>
            ))}
          </div>

          {/* Passage à la facture */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {!facture ? (
              <button
                type="button"
                onClick={() => {
                  setEntrees((prev) => prev.map((e) => ({ ...e, facturee: true })));
                  setFacture(true);
                }}
                className="safe-zoom inline-flex h-9 items-center rounded-[7px] border px-4 font-sans text-[13px] font-medium transition-colors"
                style={{ borderColor: "rgb(var(--si-ink-strong-rgb) / 0.4)", color: VERIFIED, background: "#fff" }}
              >
                Préparer la facture →
              </button>
            ) : (
              <span
                className="inline-flex items-center gap-2 rounded-[7px] px-3 py-2 font-sans text-[12px]"
                style={{ background: "rgb(var(--si-ink-strong-rgb) / 0.1)", color: VERIFIED }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: VERIFIED }} />
                Facture préparée : {money(honoraires)} d&apos;honoraires et {money(debours)} de débours. Aucune ressaisie.
              </span>
            )}
            <button
              type="button"
              onClick={reinitialiser}
              className="font-sans text-[12px] underline underline-offset-2"
              style={{ color: FAINT }}
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </SafeWindow>
      <IndiceEssai>
        Démarrez le chronomètre, ou basculez sur forfait ou débours. Le total à facturer suit.
      </IndiceEssai>
      <style>{`
        @keyframes mockIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: none; } }
        .mock-input:focus { border-color: ${INK} !important; box-shadow: 0 0 0 3px rgb(var(--si-ink-strong-rgb) / 0.12); }
      `}</style>
    </div>
  );
}

/* ──────────────────── 3. Tableau de bord manipulable ────────────────────
   Hors page depuis la refonte des fonctionnalités : conservé pour la vitrine
   qui en aurait besoin. */

const CARTES = [
  {
    cle: "facturation",
    label: "Facturé ce mois",
    valeur: "1 424,74 $",
    detail: "Trois factures émises. La dernière, 2026-041, porte 6,5 h et deux débours.",
  },
  {
    cle: "encaissements",
    label: "Encaissé ce mois",
    valeur: "1 177,24 $",
    detail: "Taux d'encaissement de 83 %. Une facture reste ouverte depuis 12 jours.",
  },
  {
    cle: "creances",
    label: "Reste à recevoir",
    valeur: "247,50 $",
    detail: "Une seule créance, sous les 30 jours. Aucune relance nécessaire pour l'instant.",
  },
  {
    cle: "fideicommis",
    label: "Fidéicommis",
    valeur: "À rapprocher",
    detail: "Le relevé bancaire et le registre concordent. Les soldes par dossier restent à vérifier.",
    alerte: true,
  },
];

export function MockupTableauDeBord() {
  const [active, setActive] = useState<string | null>(null);
  const [rapproche, setRapproche] = useState(false);
  const carte = CARTES.find((c) => c.cle === active);

  return (
    <div>
      <SafeWindow fil={<span>Tableau de bord</span>} indice="Maquette · cliquez une carte">
        <div className="p-4 sm:p-5">
          <p className="mock-mini font-mono text-[10px] uppercase tracking-[0.14em]" style={{ color: GREEN }}>
            Lecture rapide
          </p>
          <p className="mt-1.5 font-serif text-[19px]" style={{ color: INK }}>Vos chiffres, en langage simple</p>

          <div className="mt-3.5 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            {CARTES.map((c) => {
              const on = active === c.cle;
              const estFid = c.cle === "fideicommis";
              return (
                <button
                  key={c.cle}
                  type="button"
                  onClick={() => setActive(on ? null : c.cle)}
                  className="safe-zoom rounded-[10px] p-3 text-left transition-all duration-200"
                  style={{
                    background: on ? "#16301F" : "var(--si-ink-strong)",
                    color: "#EAF2EC",
                    boxShadow: on ? "0 16px 32px -18px rgba(11,31,25,0.7)" : "none",
                    outline: on ? `2px solid ${GREEN}` : "2px solid transparent",
                  }}
                >
                  <span className="flex items-center gap-1.5">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: estFid && !rapproche ? "var(--si-amber)" : "var(--si-verified-on-forest)" }}
                    />
                    <span className="mock-mini font-mono text-[9px] uppercase tracking-[0.1em]" style={{ color: "rgba(234,242,236,0.7)" }}>
                      {c.label}
                    </span>
                  </span>
                  <span className="mt-2 block font-mono text-[15px] tabular-nums">
                    {estFid && rapproche ? "Rapproché" : c.valeur}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Panneau de détail, ouvert au clic */}
          <div
            className="safe-zoom mt-3 overflow-hidden rounded-[9px] border transition-all duration-300"
            style={{
              borderColor: carte ? LINE : "transparent",
              background: carte ? "#fff" : "transparent",
              maxHeight: carte ? 140 : 0,
              opacity: carte ? 1 : 0,
            }}
          >
            {carte ? (
              <div className="p-3.5">
                <p className="font-sans text-[12px]" style={{ color: INK }}>{carte.label}</p>
                <p className="mt-1.5 max-w-[62ch] font-sans text-[12px] leading-[1.6]" style={{ color: MUTED }}>
                  {carte.detail}
                </p>
                {carte.cle === "fideicommis" && !rapproche ? (
                  <button
                    type="button"
                    onClick={() => setRapproche(true)}
                    className="mt-2.5 inline-flex h-8 items-center rounded-[7px] px-3 font-sans text-[12px] font-medium"
                    style={{ background: GREEN, color: "#fff" }}
                  >
                    Rapprocher le fidéicommis
                  </button>
                ) : null}
                {carte.cle === "fideicommis" && rapproche ? (
                  <p className="mt-2.5 font-sans text-[12px]" style={{ color: VERIFIED }}>
                    Les trois soldes concordent. La certification peut être produite.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          {!carte ? (
            <p className="mt-3 font-sans text-[12px]" style={{ color: FAINT }}>
              Chaque carte s&apos;ouvre pour expliquer son chiffre.
            </p>
          ) : null}
        </div>
      </SafeWindow>
      <IndiceEssai>Cliquez une carte, puis essayez « Rapprocher le fidéicommis ».</IndiceEssai>
    </div>
  );
}

/* ──────────────────── 8. Un dépôt non conforme est refusé ────────────────────
   Retiré de la page des fonctionnalités le 2026-08-20 : le régime des espèces
   est une règle provinciale, elle appartient à une page spécialisée et non au
   récit du travail administratif. Le composant reste juste et réutilisable.
   Décrit le comportement livré aujourd'hui : au-delà du plafond, l'écriture est
   refusée et la règle citée. Le régime québécois (déclaration obligatoire plutôt
   qu'interdiction) sera ajouté quand le moteur sera rendu conscient de la province. */

export function MockupDepotConforme() {
  const [montant, setMontant] = useState("8 000");
  const [tente, setTente] = useState(false);

  const valeur = parseFloat(montant.replace(/\s/g, "").replace(",", ".")) || 0;
  // Le seuil vient du module de conformité, jamais recopié : cette maquette énonce
  // publiquement une règle que SAFE prétend maîtriser.
  //
  // ⚠️ La comparaison était `> 7500`, donc un dépôt de 7 500 $ EXACTEMENT était
  // présenté comme accepté. Le texte dit « 7 500 $ OU PLUS » : il est refusé.
  const refuse = valeur >= CASH_THRESHOLD_CAD;

  return (
    <div>
      <SafeWindow fil={<span>Fidéicommis · nouveau dépôt</span>} indice="Maquette · essayez un montant">
        <div className="p-4 sm:p-5">
          <div className="grid gap-2.5 sm:grid-cols-[1fr_auto]">
            <label className="block">
              <span className="font-sans text-[11px]" style={{ color: MUTED }}>Dépôt en espèces · dossier 2026-014</span>
              <div className="mt-1 flex items-center gap-2">
                <input
                  value={montant}
                  onChange={(e) => { setMontant(e.target.value); setTente(false); }}
                  aria-label="Montant du dépôt en espèces"
                  inputMode="decimal"
                  className="mock-input h-10 w-full min-w-0 rounded-[7px] border px-3 text-right font-mono text-[15px] outline-none"
                  style={{
                    borderColor: tente && refuse ? "#C38A24" : LINE,
                    background: "#fff",
                    color: tente && refuse ? "#9A6712" : INK,
                  }}
                />
                <span className="font-mono text-[13px]" style={{ color: MUTED }}>$</span>
              </div>
            </label>
            <button
              type="button"
              onClick={() => setTente(true)}
              className="h-10 self-end whitespace-nowrap rounded-[7px] px-4 font-sans text-[13px] font-medium"
              style={{ background: GREEN, color: "#fff" }}
            >
              Enregistrer le dépôt
            </button>
          </div>

          <div className="mt-3 min-h-[76px]">
            {!tente ? (
              <p className="font-sans text-[12px]" style={{ color: FAINT }}>
                Essayez 8 000 $, puis 2 000 $.
              </p>
            ) : refuse ? (
              <div className="rounded-[9px] px-3.5 py-3" style={{ background: "rgba(195,138,36,0.09)" }}>
                <p className="font-sans text-[12px] font-medium" style={{ color: "#72531B" }}>
                  Écriture refusée
                </p>
                <p className="mt-1 font-sans text-[12px] leading-[1.55]" style={{ color: "#72531B" }}>
                  Le plafond d&apos;espèces applicable au dossier est dépassé. SAFE bloque
                  l&apos;enregistrement et cite la règle plutôt que de laisser passer une
                  écriture qui deviendrait un problème à l&apos;inspection.
                </p>
              </div>
            ) : (
              <div className="rounded-[9px] px-3.5 py-3" style={{ background: "rgb(var(--si-ink-strong-rgb) / 0.1)" }}>
                <p className="font-sans text-[12px] font-medium" style={{ color: VERIFIED }}>
                  Dépôt enregistré
                </p>
                <p className="mt-1 font-sans text-[12px] leading-[1.55]" style={{ color: VERIFIED }}>
                  Reçu produit, écriture au registre du fidéicommis, solde du dossier mis à
                  jour. Rien à reporter ailleurs.
                </p>
              </div>
            )}
          </div>
        </div>
      </SafeWindow>
      <IndiceEssai>Entrez 8 000 $ et enregistrez. Puis recommencez avec 2 000 $.</IndiceEssai>
    </div>
  );
}

/* ──────────── 4. La facture, le paiement, l'écriture ────────────
   Trois états d'un même objet. Les taux viennent de la table des provinces
   (lib/billing/taxes.ts : QC en TPS et TVQ, ON en TVH), et le calcul suit
   lib/invoice-calculations.ts. Le journal de SAFE est mono-axe et append-only :
   l'émission écrit UNE ligne « Facturation client », l'encaissement en écrit
   une seconde (lib/services/journal/billing-journal.ts). On ne montre donc pas
   quatre écritures de double-entrée, qui n'existent qu'à l'export. */

const TAUX_PROVINCE = {
  QC: { label: "Québec", lignes: [["TPS 5 %", 0.05], ["TVQ 9,975 %", 0.09975]] as [string, number][] },
  ON: { label: "Ontario", lignes: [["TVH 13 %", 0.13]] as [string, number][] },
} as const;

const HONORAIRES = 3200;
const DEBOURS_REFACTURABLES = 342;

export function MockupFactureEtPaiement() {
  const [province, setProvince] = useState<keyof typeof TAUX_PROVINCE>("QC");
  const [etape, setEtape] = useState(0); // 0 prête · 1 émise · 2 payée

  const taxable = HONORAIRES + DEBOURS_REFACTURABLES;
  const taxes = TAUX_PROVINCE[province].lignes.map(
    ([label, taux]) => [label, Math.round(taxable * taux * 100) / 100] as [string, number]
  );
  const total = Math.round((taxable + taxes.reduce((s, [, v]) => s + v, 0)) * 100) / 100;

  const ecritures = [
    ["FACTURE", "Facture 2026-041 — Marie-Claude Tremblay", "Facturation client", total],
    ["PAIEMENT", "Paiement reçu — facture 2026-041", "Paiement Interac", total],
  ] as const;

  return (
    <div>
      <SafeWindow fil={<span>Facture 2026-041 · Succession Tremblay</span>} indice="Maquette · émettez, puis encaissez">
        <div className="p-4 sm:p-5">
          {/* Régime de taxes : réglage du cabinet, pas une constante. */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3" style={{ borderColor: LINE }}>
            <span className="mock-mini font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: FAINT }}>
              Régime de taxes du cabinet
            </span>
            <span className="inline-flex rounded-[7px] border p-0.5" style={{ borderColor: LINE, background: "#fff" }}>
              {(Object.keys(TAUX_PROVINCE) as (keyof typeof TAUX_PROVINCE)[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => { setProvince(p); setEtape(0); }}
                  className="safe-zoom rounded-[5px] px-2.5 py-1 font-sans text-[11px] transition-colors"
                  style={
                    province === p
                      ? {
                          backgroundColor: "var(--si-ink)",
                          backgroundImage: "linear-gradient(135deg, var(--si-ink) 0%, var(--si-action-vert) 100%)",
                          color: "#fff",
                        }
                      : { color: MUTED }
                  }
                >
                  {TAUX_PROVINCE[p].label}
                </button>
              ))}
            </span>
          </div>

          {/* Composition de la facture */}
          <div className="mt-3">
            {[
              ["Honoraires · 6,5 h à 450 $", HONORAIRES],
              ["Débours refacturables · copies et expédition", DEBOURS_REFACTURABLES],
            ].map(([label, val]) => (
              <div key={label as string} className="flex items-baseline justify-between gap-3 border-b py-2" style={{ borderColor: LINE_SOFT }}>
                <span className="min-w-0 truncate font-sans text-[12px]" style={{ color: INK }}>{label}</span>
                <span className="shrink-0 font-mono text-[12px] tabular-nums" style={{ color: INK }}>{money(val as number)}</span>
              </div>
            ))}
            <div className="flex items-baseline justify-between gap-3 border-b py-2" style={{ borderColor: LINE_SOFT }}>
              <span className="font-sans text-[12px]" style={{ color: MUTED }}>Sous-total taxable</span>
              <span className="font-mono text-[12px] tabular-nums" style={{ color: MUTED }}>{money(taxable)}</span>
            </div>
            {taxes.map(([label, val]) => (
              <div key={label} className="flex items-baseline justify-between gap-3 border-b py-2" style={{ borderColor: LINE_SOFT }}>
                <span className="font-sans text-[12px]" style={{ color: MUTED }}>{label}</span>
                <span className="font-mono text-[12px] tabular-nums" style={{ color: MUTED }}>{money(val)}</span>
              </div>
            ))}
            <div className="flex items-baseline justify-between gap-3 border-t pt-2.5" style={{ borderColor: LINE }}>
              <span className="font-sans text-[13px]" style={{ color: INK }}>Total de la facture</span>
              <span className="font-mono text-[15px] tabular-nums" style={{ color: INK }}>{money(total)}</span>
            </div>
            <div className="mt-1.5 flex items-baseline justify-between gap-3">
              <span className="font-sans text-[12px]" style={{ color: etape === 2 ? VERIFIED : AMBER }}>
                {etape === 2 ? "Encaissée" : "Reste à recevoir"}
              </span>
              <span className="font-mono text-[12px] tabular-nums" style={{ color: etape === 2 ? VERIFIED : AMBER }}>
                {money(etape === 2 ? 0 : total)}
              </span>
            </div>
          </div>

          {/* Le journal, une ligne par mouvement */}
          <div className="mt-4 rounded-[9px] border p-3" style={{ borderColor: LINE, background: "#fff" }}>
            <p className="mock-mini font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: FAINT }}>
              Journal général du cabinet
            </p>
            <div className="mt-1.5 min-h-[74px]">
              {ecritures.map(([type, description, categorie, val], i) => {
                const visible = etape > i;
                return (
                  <div
                    key={type}
                    className="flex items-center justify-between gap-3 border-b py-2 transition-all duration-500 last:border-0"
                    style={{
                      borderColor: LINE_SOFT,
                      opacity: visible ? 1 : 0.22,
                      transform: visible ? "none" : "translateX(-6px)",
                    }}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className="mock-mini shrink-0 rounded-[4px] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em]"
                        style={{ background: "rgb(var(--si-line-ink-rgb) / 0.07)", color: MUTED }}
                      >
                        {type}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-sans text-[12px]" style={{ color: INK }}>{description}</span>
                        <span className="mock-mini block truncate font-sans text-[10px]" style={{ color: FAINT }}>{categorie}</span>
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-[12px] tabular-nums" style={{ color: INK }}>{money(val)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-3.5 flex flex-wrap items-center gap-3">
            {etape === 0 ? (
              <button
                type="button"
                onClick={() => setEtape(1)}
                className="safe-zoom inline-flex h-9 items-center rounded-[7px] px-4 font-sans text-[13px] font-medium"
                style={{ background: GREEN, color: "#fff" }}
              >
                Émettre la facture
              </button>
            ) : etape === 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => setEtape(2)}
                  className="safe-zoom inline-flex h-9 items-center rounded-[7px] px-4 font-sans text-[13px] font-medium"
                  style={{ background: GREEN, color: "#fff" }}
                >
                  Enregistrer le paiement
                </button>
                <span className="font-sans text-[12px]" style={{ color: MUTED }}>
                  Numéro officiel attribué à l&apos;émission, sans trou dans la séquence.
                </span>
              </>
            ) : (
              <>
                <span
                  className="inline-flex items-center gap-2 rounded-[7px] px-3 py-2 font-sans text-[12px]"
                  style={{ background: "rgb(var(--si-ink-strong-rgb) / 0.1)", color: VERIFIED }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: VERIFIED }} />
                  Paiement rattaché à la facture. Le solde à recevoir tombe à zéro.
                </span>
                <button
                  type="button"
                  onClick={() => setEtape(0)}
                  className="font-sans text-[12px] underline underline-offset-2"
                  style={{ color: FAINT }}
                >
                  Recommencer
                </button>
              </>
            )}
          </div>
        </div>
      </SafeWindow>
      <IndiceEssai>
        Changez de province : les taxes suivent. Puis émettez et encaissez, le journal se remplit.
      </IndiceEssai>
    </div>
  );
}

/* ──────────── 5. Les journaux du cabinet ────────────
   Distinct de la facturation, et c'est le propos : les dépenses du cabinet ne
   sont pas des débours de dossier (lib/expense-journal/constants.ts pour les
   catégories, /comptabilite pour l'écran). Deux registres, un seul contexte. */

const DEPENSES: [string, string, string][] = [
  ["03 juin", "Vidéotron", "Internet"],
  ["05 juin", "SOQUIJ", "Recherche juridique"],
  ["11 juin", "Postes Canada", "Poste / messagerie"],
  ["18 juin", "Bureau en Gros", "Fournitures de bureau"],
];
const DEPENSES_MONTANTS = [118.42, 89.0, 46.75, 213.6];

const GENERAL: [string, string, string][] = [
  ["11 juin", "Facture 2026-041 — Marie-Claude Tremblay", "Facturation client"],
  ["14 juin", "Paiement reçu — facture 2026-039", "Paiement Interac"],
  ["18 juin", "Bureau en Gros — fournitures", "Dépense du cabinet"],
];
const GENERAL_MONTANTS = [4072.41, 1240.0, -213.6];

export function MockupJournaux() {
  const [vue, setVue] = useState<"depenses" | "general">("depenses");
  const totalDepenses = DEPENSES_MONTANTS.reduce((s, v) => s + v, 0);

  return (
    <div>
      <SafeWindow fil={<span>Comptabilité · juin 2026</span>} indice="Maquette · changez de journal">
        <div className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex rounded-[7px] border p-0.5" style={{ borderColor: LINE, background: "#fff" }}>
              {([["depenses", "Dépenses du cabinet"], ["general", "Journal général"]] as const).map(([cle, label]) => (
                <button
                  key={cle}
                  type="button"
                  onClick={() => setVue(cle)}
                  className="safe-zoom rounded-[5px] px-2.5 py-1 font-sans text-[11px] transition-colors"
                  style={
                    vue === cle
                      ? {
                          backgroundColor: "var(--si-ink)",
                          backgroundImage: "linear-gradient(135deg, var(--si-ink) 0%, var(--si-action-vert) 100%)",
                          color: "#fff",
                        }
                      : { color: MUTED }
                  }
                >
                  {label}
                </button>
              ))}
            </span>
            <span className="mock-mini font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: FAINT }}>
              Période ouverte
            </span>
          </div>

          <div className="mt-3">
            {(vue === "depenses" ? DEPENSES : GENERAL).map(([date, libelle, categorie], i) => {
              const val = vue === "depenses" ? DEPENSES_MONTANTS[i] : GENERAL_MONTANTS[i];
              return (
                <div
                  key={libelle}
                  className="flex items-baseline justify-between gap-3 border-b py-2"
                  style={{ borderColor: LINE_SOFT, animation: `mockIn 0.4s cubic-bezier(0.16,1,0.3,1) ${i * 50}ms both` }}
                >
                  <span className="flex min-w-0 items-baseline gap-2.5">
                    <span className="mock-mini shrink-0 font-mono text-[10px] tabular-nums" style={{ color: FAINT }}>{date}</span>
                    <span className="min-w-0">
                      <span className="block truncate font-sans text-[12px]" style={{ color: INK }}>{libelle}</span>
                      <span className="mock-mini block truncate font-sans text-[10px]" style={{ color: FAINT }}>{categorie}</span>
                    </span>
                  </span>
                  <span
                    className="shrink-0 font-mono text-[12px] tabular-nums"
                    style={{ color: val < 0 ? MUTED : INK }}
                  >
                    {val < 0 ? "−" : ""}{money(Math.abs(val))}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-3 flex items-baseline justify-between gap-3">
            <span className="font-sans text-[12px]" style={{ color: MUTED }}>
              {vue === "depenses" ? "Total des dépenses du mois" : "Écritures du mois"}
            </span>
            <span className="font-mono text-[13px] tabular-nums" style={{ color: INK }}>
              {vue === "depenses" ? money(totalDepenses) : `${GENERAL.length} lignes`}
            </span>
          </div>
          <p className="mt-2.5 font-sans text-[11px] leading-[1.55]" style={{ color: MUTED }}>
            Une écriture ne se modifie pas et ne se supprime pas. Une correction s&apos;ajoute au
            journal, et l&apos;écriture d&apos;origine reste lisible.
          </p>
        </div>
      </SafeWindow>
      <IndiceEssai>Passez d&apos;un journal à l&apos;autre : ce sont deux registres distincts.</IndiceEssai>
    </div>
  );
}

/* ──────────── 6. Le cartable, en détail subordonné ────────────
   Les libellés et les sources ci-dessous sont ceux que le produit monte
   réellement à l'ouverture d'un dossier (lib/dossiers/cartable-templates,
   posés par generateCartable). Recopiés ici et non importés : la vitrine ne
   doit pas tirer une table du domaine métier pour se dessiner.

   Ce n'est plus une section : c'est une preuve secondaire du dossier. Pas de
   cadre de fenêtre, pas de manipulation de pièce, une taille en dessous. */

const CARTABLES: Record<string, { label: string; sections: [string, string][] }> = {
  famille: {
    label: "Droit de la famille",
    sections: [
      ["Mandat et engagement", "RCNEPA art. 15-16"],
      ["Pièces Madame (P-)", "Règl. Cour Qc art. 13"],
      ["Pièces Monsieur (D-)", "Règl. Cour Qc art. 13"],
      ["Procédures", "C.p.c. art. 109 et s."],
      ["Jugements et ordonnances", "C.p.c. art. 322 et s."],
      ["Fidéicommis", "RCNEPA art. 44-55"],
      ["Fermeture du dossier", "RCNEPA art. 18-19"],
    ],
  },
  criminel: {
    label: "Droit criminel",
    sections: [
      ["Mandat et engagement", "Code déonto. art. 3.08"],
      ["Divulgation DPCP", "R. c. Stinchcombe, 1991"],
      ["Formulaires prescrits (C.cr.)", "Code criminel, annexes"],
      ["Actes de procédure", "Règles Cour sup. ch. crim."],
      ["Comparutions et dates", "R. c. Jordan, 2016 CSC 27"],
      ["Fidéicommis", "RCNEPA art. 44-55"],
      ["Fermeture du dossier", "RCNEPA art. 18-19"],
    ],
  },
  immobilier: {
    label: "Immobilier",
    sections: [
      ["Mandat et engagement", "RCNEPA · LRPCFAT"],
      ["Offre et convention", "C.c.Q. art. 1385 et s."],
      ["Financement et hypothèque", "Instructions du prêteur"],
      ["Recherche de titres", "C.c.Q. art. 2938 et s."],
      ["Documents de clôture", "C.c.Q. art. 1553 et s. · RDPRM"],
      ["Fidéicommis", "RCNEPA art. 44-55"],
      ["Fermeture du dossier", "RCNEPA art. 18-19"],
    ],
  },
};

export function DetailCartable() {
  const [domaine, setDomaine] = useState("famille");
  const cartable = CARTABLES[domaine];

  return (
    <div className="safe-mock grid gap-6 sm:grid-cols-[minmax(200px,236px)_1fr] sm:gap-10">
      <StylesMaquettesMobiles />
      <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: FAINT }}>
        Détail · la structure du dossier
      </p>
      {/* Au large, les trois domaines s'empilent : côte à côte dans un rail de
          236 px ils repassaient à la ligne deux contre un, ce qui se lit comme
          un accident et non comme un choix. */}
      <div className="mt-2.5 flex flex-wrap gap-1.5 sm:flex-col sm:items-start">
        {Object.entries(CARTABLES).map(([cle, v]) => (
          <button
            key={cle}
            type="button"
            onClick={() => setDomaine(cle)}
            aria-pressed={domaine === cle}
            className="safe-zoom rounded-[6px] border px-2.5 py-1 font-sans text-[12px] transition-colors"
            style={
              domaine === cle
                ? { borderColor: INK, color: INK, background: "rgb(var(--si-line-ink-rgb) / 0.05)" }
                : { borderColor: LINE, color: MUTED, background: "transparent" }
            }
          >
            {v.label}
          </button>
        ))}
      </div>
      <p className="mt-3.5 font-sans text-[12px] leading-[1.55]" style={{ color: MUTED }}>
        Changez de domaine : la structure change, et chaque section garde sa source.
      </p>
      </div>
      <ul className="grid border-b sm:grid-cols-2 sm:gap-x-10" style={{ borderColor: LINE_SOFT }}>
        {cartable.sections.map(([label, source], i) => (
          <li
            key={label}
            className="flex items-baseline justify-between gap-3 border-t py-1.5"
            style={{ borderColor: LINE_SOFT, animation: `mockIn 0.35s cubic-bezier(0.16,1,0.3,1) ${i * 35}ms both` }}
          >
            <span className="flex min-w-0 items-baseline gap-2.5">
              <span className="mock-mini shrink-0 font-mono text-[10px] tabular-nums" style={{ color: FAINT }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="truncate font-sans text-[12px]" style={{ color: INK }}>{label}</span>
            </span>
            <span className="mock-mini shrink-0 font-mono text-[10px]" style={{ color: FAINT }}>{source}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ──────────────────── 7. Le rapprochement du fidéicommis ────────────────────
   Trois soldes qui doivent concorder, un écart qui reste visible, une
   correction qui s'ajoute au journal sans effacer l'écriture d'origine
   (lib/services/journal/append-only-corrections.ts), et une certification qui
   ne s'ouvre qu'à écart nul, exactement comme ReconciliationWorkflow
   (canCertify = ecart === 0). */

export function MockupRapprochement() {
  const [etat, setEtat] = useState<"ecart" | "corrige" | "certifie">("ecart");
  const corrige = etat !== "ecart";
  const soldes = [
    ["Solde bancaire", 21000, true],
    ["Registre du fidéicommis", 21000, true],
    ["Soldes détenus par dossier", corrige ? 21000 : 20500, corrige],
  ] as const;

  return (
    <div>
      <SafeWindow fil={<span>Fidéicommis · rapprochement</span>} indice="Maquette · résorbez l'écart">
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: LINE }}>
            <span className="font-sans text-[13px]" style={{ color: INK }}>Rapprochement à trois voies</span>
            <span className="mock-mini font-mono text-[10px] uppercase tracking-[0.1em]" style={{ color: FAINT }}>Juin 2026</span>
          </div>
          {soldes.map(([label, val, ok]) => (
            <div key={label} className="flex items-center justify-between gap-3 border-b py-3" style={{ borderColor: LINE_SOFT }}>
              <span className="font-sans text-[13px]" style={{ color: MUTED }}>{label}</span>
              <span className="flex shrink-0 items-center gap-2 font-mono text-[13px] tabular-nums" style={{ color: ok ? INK : AMBER }}>
                {money(val)}
                <span
                  className="h-2 w-2 rounded-full transition-all"
                  style={{
                    background: ok ? VERIFIED : "var(--si-amber)",
                    boxShadow: ok ? "none" : "0 0 0 4px rgb(var(--si-amber-rgb) / 0.14)",
                  }}
                  aria-hidden
                />
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between gap-3 py-3">
            <span className="font-sans text-[13px]" style={{ color: corrige ? VERIFIED : AMBER }}>Écart</span>
            <span className="font-mono text-[15px] tabular-nums" style={{ color: corrige ? VERIFIED : AMBER }}>
              {money(corrige ? 0 : 500)}
            </span>
          </div>

          {etat === "ecart" ? (
            <div className="rounded-[9px] px-3.5 py-3" style={{ background: "rgb(var(--si-amber-rgb) / 0.1)" }}>
              <p className="font-sans text-[12px] leading-[1.55]" style={{ color: AMBER }}>
                Un dépôt de 500 $ n&apos;est rattaché à aucun dossier. L&apos;écart reste affiché
                tant qu&apos;il subsiste, et la certification demeure fermée.
              </p>
              <button
                type="button"
                onClick={() => setEtat("corrige")}
                className="safe-zoom mt-2.5 inline-flex h-8 items-center rounded-[7px] px-3 font-sans text-[12px] font-medium"
                style={{ background: GREEN, color: "#fff" }}
              >
                Rattacher le dépôt au dossier
              </button>
              <p className="mock-mini mt-2 font-sans text-[11px]" style={{ color: MUTED }}>
                Certifier le rapprochement · indisponible tant que l&apos;écart n&apos;est pas nul
              </p>
            </div>
          ) : etat === "corrige" ? (
            <div className="rounded-[9px] px-3.5 py-3" style={{ background: "rgb(var(--si-ink-strong-rgb) / 0.08)" }}>
              <p className="font-sans text-[12px] leading-[1.55]" style={{ color: VERIFIED }}>
                Concordance. La correction s&apos;est ajoutée au journal, et l&apos;écriture
                d&apos;origine y reste lisible.
              </p>
              <div className="mt-2 flex items-baseline justify-between gap-3 rounded-[7px] px-2.5 py-1.5" style={{ background: "#fff" }}>
                <span className="min-w-0">
                  <span className="mock-mini block font-mono text-[10px] uppercase tracking-[0.08em]" style={{ color: FAINT }}>
                    Correction · 30 juin 2026
                  </span>
                  <span className="block truncate font-sans text-[12px]" style={{ color: INK }}>
                    Dépôt rattaché au dossier 2026-014
                  </span>
                </span>
                <span className="shrink-0 font-mono text-[12px] tabular-nums" style={{ color: INK }}>{money(500)}</span>
              </div>
              <button
                type="button"
                onClick={() => setEtat("certifie")}
                className="safe-zoom mt-2.5 inline-flex h-8 items-center rounded-[7px] px-3 font-sans text-[12px] font-medium"
                style={{ background: GREEN, color: "#fff" }}
              >
                Certifier le rapprochement
              </button>
            </div>
          ) : (
            <div className="rounded-[9px] px-3.5 py-3" style={{ background: "rgb(var(--si-ink-strong-rgb) / 0.1)" }}>
              <p className="font-sans text-[12px] leading-[1.55]" style={{ color: VERIFIED }}>
                Rapprochement de juin 2026 certifié le 30 juin par Me Nadeau. La correction et
                l&apos;écriture d&apos;origine restent toutes deux au journal.
              </p>
              <button
                type="button"
                onClick={() => setEtat("ecart")}
                className="mt-2 font-sans text-[11px] underline underline-offset-2"
                style={{ color: FAINT }}
              >
                Revoir l&apos;écart
              </button>
            </div>
          )}
        </div>
      </SafeWindow>
      <IndiceEssai>
        Rattachez le dépôt : l&apos;écart tombe à zéro, et la certification s&apos;ouvre seulement là.
      </IndiceEssai>
    </div>
  );
}

/* ──────────────────── 9. Dossier navigable (client → dossier) ──────────────────── */

const ONGLETS = [
  { cle: "apercu", label: "Aperçu" },
  { cle: "temps", label: "Temps" },
  { cle: "facturation", label: "Facturation" },
  { cle: "fiducie", label: "Fiducie" },
  { cle: "documents", label: "Documents" },
];

export function MockupDossier() {
  const [ecran, setEcran] = useState<"client" | "dossier">("client");
  const [onglet, setOnglet] = useState("apercu");

  return (
    <div>
      <SafeWindow
        fil={
          <span className="flex items-center gap-1.5">
            Clients / Marie-Claude Tremblay
            {ecran === "dossier" ? <span style={{ opacity: 0.6 }}>/ Dossier 2026-014</span> : null}
          </span>
        }
        indice={ecran === "client" ? "Maquette · ouvrez le dossier" : "Maquette · changez d'onglet"}
      >
        <div className="p-4 sm:p-5" style={{ minHeight: 330 }}>
          {ecran === "client" ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-[10px] border p-3.5" style={{ borderColor: LINE, background: "#fff" }}>
                <p className="mock-mini font-mono text-[10px] uppercase tracking-[0.13em]" style={{ color: FAINT }}>Fiche client</p>
                <p className="mt-1 font-serif text-[19px]" style={{ color: INK }}>Marie-Claude Tremblay</p>
                {[
                  ["Type", "Particulier · liquidatrice"],
                  ["Ville", "Lévis (Québec)"],
                  ["En fiducie", "2 225,00 $"],
                  ["À recevoir", "0,00 $"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b py-1.5 last:border-0" style={{ borderColor: LINE_SOFT }}>
                    <span className="font-sans text-[12px]" style={{ color: MUTED }}>{k}</span>
                    <span className="font-sans text-[12px]" style={{ color: INK }}>{v}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-[10px] border p-3.5" style={{ borderColor: LINE, background: "#fff" }}>
                <p className="mock-mini font-mono text-[10px] uppercase tracking-[0.13em]" style={{ color: FAINT }}>
                  Dossiers de la cliente
                </p>
                <button
                  type="button"
                  onClick={() => setEcran("dossier")}
                  className="safe-zoom group mt-2 flex w-full items-center justify-between gap-3 rounded-[9px] border p-3 text-left transition-all duration-200"
                  style={{
                    borderColor: "rgb(var(--si-ink-strong-rgb) / 0.4)",
                    background: "rgb(var(--si-ink-strong-rgb) / 0.05)",
                    boxShadow: "0 10px 24px -18px rgba(11,31,25,0.5)",
                  }}
                >
                  <span className="min-w-0">
                    <span className="mock-mini block font-mono text-[10px]" style={{ color: FAINT }}>2026-014 · Succession</span>
                    <span className="mt-0.5 block font-sans text-[13px]" style={{ color: INK }}>Succession Tremblay</span>
                  </span>
                  <span
                    className="safe-zoom shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 font-sans text-[12px] font-medium transition-transform group-hover:translate-x-0.5"
                    style={{ background: GREEN, color: "#fff" }}
                  >
                    Ouvrir →
                  </span>
                </button>
                <div className="mt-2 flex items-center justify-between rounded-[9px] border p-3" style={{ borderColor: LINE_SOFT }}>
                  <span>
                    <span className="mock-mini block font-mono text-[10px]" style={{ color: FAINT }}>2024-032 · Immobilier</span>
                    <span className="mt-0.5 block font-sans text-[13px]" style={{ color: MUTED }}>Vente d&apos;un immeuble locatif</span>
                  </span>
                  <span className="rounded-full px-2.5 py-1 font-sans text-[11px]" style={{ background: "rgba(31,42,36,0.06)", color: MUTED }}>
                    Clôturé
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => { setEcran("client"); setOnglet("apercu"); }}
                  className="safe-zoom inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-sans text-[12px] transition-colors"
                  style={{ borderColor: LINE, color: MUTED, background: "#fff" }}
                >
                  ← Fiche client
                </button>
                <p className="font-serif text-[19px]" style={{ color: INK }}>
                  Dossier 2026-014 · Succession Tremblay
                </p>
              </div>

              <div className="mt-3 flex flex-wrap gap-1 border-b" style={{ borderColor: LINE }}>
                {ONGLETS.map((o) => {
                  const on = onglet === o.cle;
                  return (
                    <button
                      key={o.cle}
                      type="button"
                      onClick={() => setOnglet(o.cle)}
                      className="safe-zoom -mb-px px-3 py-2 font-sans text-[12px] transition-colors"
                      style={{
                        color: on ? INK : MUTED,
                        borderBottom: `2px solid ${on ? GREEN : "transparent"}`,
                      }}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>

              <div className="pt-3.5">
                {onglet === "apercu" ? (
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {[
                      ["Type", "Succession · vérification de testament"],
                      ["Ouvert le", "8 mai 2026"],
                      ["Temps au dossier", "6,5 h"],
                      ["Prochaine échéance", "30 juin · inventaire"],
                    ].map(([k, v]) => (
                      <div key={k} className="rounded-[9px] border p-3" style={{ borderColor: LINE, background: "#fff" }}>
                        <p className="mock-mini font-sans text-[10px]" style={{ color: FAINT }}>{k}</p>
                        <p className="mt-0.5 font-sans text-[13px]" style={{ color: INK }}>{v}</p>
                      </div>
                    ))}
                  </div>
                ) : null}

                {onglet === "temps" ? (
                  <table className="w-full text-left">
                    <tbody>
                      {[
                        ["12 mai", "Rédaction de la requête", "2,1 h"],
                        ["15 mai", "Appel avec la liquidatrice", "0,8 h"],
                        ["21 mai", "Inventaire préliminaire", "2,4 h"],
                        ["28 mai", "Révision et corrections", "1,2 h"],
                      ].map(([d, t, h]) => (
                        <tr key={t} className="border-b" style={{ borderColor: LINE_SOFT }}>
                          <td className="py-2 font-mono text-[11px]" style={{ color: FAINT }}>{d}</td>
                          <td className="py-2 font-sans text-[12px]" style={{ color: INK }}>{t}</td>
                          <td className="py-2 text-right font-mono text-[12px]" style={{ color: INK }}>{h}</td>
                        </tr>
                      ))}
                      <tr>
                        <td />
                        <td className="pt-2.5 font-sans text-[12px] font-medium" style={{ color: INK }}>Total approuvé</td>
                        <td className="pt-2.5 text-right font-mono text-[13px]" style={{ color: INK }}>6,5 h</td>
                      </tr>
                    </tbody>
                  </table>
                ) : null}

                {onglet === "facturation" ? (
                  <table className="w-full text-left">
                    <tbody>
                      {[
                        ["Honoraires · 6,5 h", "2 925,00 $"],
                        ["Débours · frais de greffe", "195,00 $"],
                        ["Débours · huissier", "80,00 $"],
                        ["TPS et TVQ", "479,20 $"],
                      ].map(([t, m]) => (
                        <tr key={t} className="border-b" style={{ borderColor: LINE_SOFT }}>
                          <td className="py-2 font-sans text-[12px]" style={{ color: INK }}>{t}</td>
                          <td className="py-2 text-right font-mono text-[12px]" style={{ color: INK }}>{m}</td>
                        </tr>
                      ))}
                      <tr>
                        <td className="pt-2.5 font-sans text-[12px] font-medium" style={{ color: INK }}>
                          Facture 2026-041 · payée le 14 juin
                        </td>
                        <td className="pt-2.5 text-right font-mono text-[13px]" style={{ color: VERIFIED }}>3 679,20 $</td>
                      </tr>
                    </tbody>
                  </table>
                ) : null}

                {onglet === "fiducie" ? (
                  <table className="w-full text-left">
                    <tbody>
                      {[
                        ["5 mai · avance reçue", "2 500,00 $"],
                        ["12 mai · frais de greffe", "-195,00 $"],
                        ["21 mai · huissier", "-80,00 $"],
                      ].map(([t, m]) => (
                        <tr key={t} className="border-b" style={{ borderColor: LINE_SOFT }}>
                          <td className="py-2 font-sans text-[12px]" style={{ color: INK }}>{t}</td>
                          <td className="py-2 text-right font-mono text-[12px]" style={{ color: INK }}>{m}</td>
                        </tr>
                      ))}
                      <tr>
                        <td className="pt-2.5 font-sans text-[12px] font-medium" style={{ color: INK }}>Solde en fiducie</td>
                        <td className="pt-2.5 text-right font-mono text-[13px]" style={{ color: INK }}>2 225,00 $</td>
                      </tr>
                    </tbody>
                  </table>
                ) : null}

                {onglet === "documents" ? (
                  <div className="space-y-2">
                    {[
                      ["Requête en vérification de testament", "Déposée", VERIFIED],
                      ["Inventaire préliminaire", "En révision", AMBER],
                      ["Correspondance du greffe", "Classée", VERIFIED],
                    ].map(([t, s, c]) => (
                      <div key={t} className="flex items-center justify-between rounded-[9px] border p-2.5" style={{ borderColor: LINE_SOFT }}>
                        <span className="font-sans text-[12px]" style={{ color: INK }}>{t}</span>
                        <span className="rounded-full px-2.5 py-1 font-sans text-[11px]" style={{ background: "rgba(31,42,36,0.05)", color: c as string }}>
                          {s}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </SafeWindow>
      <IndiceEssai>
        {ecran === "client"
          ? "Cliquez « Ouvrir » pour entrer dans le dossier."
          : "Parcourez les onglets : le temps, la facture et la fiducie vivent au même endroit."}
      </IndiceEssai>
    </div>
  );
}
