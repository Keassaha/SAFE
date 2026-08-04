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
        .safe-mock table th { font-size: 12.5px !important; }
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
      <div
        className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 sm:px-5"
        style={{ background: "#1F3A2E", color: "#E9EFE9" }}
      >
        <span className="flex items-center gap-2 font-sans text-[12px]">
          <b className="font-medium">SAFE</b>
          <span style={{ opacity: 0.45 }}>·</span>
          {fil}
        </span>
        <span className="mock-mini flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.12em]" style={{ color: "#9FD5B4" }}>
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full" style={{ background: "#9FD5B4", opacity: 0.6 }} />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full" style={{ background: "#9FD5B4" }} />
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
 */
export function IndiceEssai({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 flex items-start gap-2.5 font-sans text-[12.5px]" style={{ color: VERIFIED }}>
      <span className="mt-[5px] shrink-0" style={{ color: GREEN }}>
        <SafeBullet size={11} />
      </span>
      {children}
    </p>
  );
}

const money = (n: number) =>
  n.toLocaleString("fr-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " $";

/* ──────────────────── 1. Fiche de temps, réellement saisissable ──────────────────── */

type Entree = { id: number; desc: string; dossier: string; heures: number; taux: number; facturee: boolean };

const DOSSIERS = [
  "Succession Tremblay · 2026-014",
  "Garde partagée Nadeau · 2026-021",
  "Vente Beaulieu · 2026-008",
];

const ENTREES_INITIALES: Entree[] = [
  { id: 1, desc: "Rédaction de la requête en vérification", dossier: DOSSIERS[0], heures: 2.1, taux: 450, facturee: false },
  { id: 2, desc: "Appel avec la liquidatrice", dossier: DOSSIERS[0], heures: 0.8, taux: 450, facturee: false },
];

export function MockupFicheDeTemps() {
  const [entrees, setEntrees] = useState<Entree[]>(ENTREES_INITIALES);
  const [desc, setDesc] = useState("");
  const [dossier, setDossier] = useState(DOSSIERS[0]);
  const [heures, setHeures] = useState("1,5");
  const [facture, setFacture] = useState(false);
  const [dernierId, setDernierId] = useState<number | null>(null);

  /* Deux façons de facturer : à l'heure ou au forfait. */
  const [mode, setMode] = useState<"horaire" | "forfait">("horaire");
  const [forfait, setForfait] = useState("750");

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

  /* un forfait porte son montant dans `taux` et zéro heure */
  const valeur = (e: Entree) => (e.heures === 0 ? e.taux : e.heures * e.taux);
  const nonFacture = useMemo(
    () => entrees.filter((e) => !e.facturee).reduce((s, e) => s + valeur(e), 0),
    [entrees]
  );
  const heuresTotal = useMemo(
    () => entrees.filter((e) => !e.facturee).reduce((s, e) => s + e.heures, 0),
    [entrees]
  );

  function ajouter(e: React.FormEvent) {
    e.preventDefault();
    if (!desc.trim()) return;
    const id = Date.now();
    if (mode === "forfait") {
      const montant = parseFloat(forfait.replace(",", "."));
      if (!Number.isFinite(montant) || montant <= 0) return;
      /* un forfait s'inscrit comme un montant, sans heures */
      setEntrees((prev) => [{ id, desc: desc.trim(), dossier, heures: 0, taux: montant, facturee: false }, ...prev]);
    } else {
      const h = parseFloat(heures.replace(",", "."));
      if (!Number.isFinite(h) || h <= 0) return;
      setEntrees((prev) => [{ id, desc: desc.trim(), dossier, heures: h, taux: 450, facturee: false }, ...prev]);
    }
    setDernierId(id);
    setDesc("");
    setHeures("1,5");
    setFacture(false);
  }

  function facturer() {
    setEntrees((prev) => prev.map((e) => ({ ...e, facturee: true })));
    setFacture(true);
  }

  function reinitialiser() {
    setEntrees(ENTREES_INITIALES);
    setFacture(false);
    setDernierId(null);
  }

  return (
    <div>
      <SafeWindow fil={<span>Temps &amp; forfaits</span>} indice="Maquette · saisissez votre temps">
        <div className="p-4 sm:p-5">
          {/* Totaux */}
          <div className="grid grid-cols-3 gap-2">
            {[
              ["Temps non facturé", money(nonFacture), `${entrees.filter((e) => !e.facturee).length} entrées`],
              ["Heures", heuresTotal.toFixed(2).replace(".", ",") + " h", "hors forfaits"],
              ["Total à facturer", money(nonFacture), facture ? "facturé" : "prêt"],
            ].map(([label, val, sous]) => (
              <div key={label} className="min-w-0 rounded-[9px] border px-2.5 py-2.5" style={{ borderColor: LINE, background: "#fff" }}>
                <p className="mock-mini truncate font-sans text-[10px]" style={{ color: FAINT }}>{label}</p>
                <p className="mt-1 truncate font-mono text-[14px] tabular-nums" style={{ color: INK }}>{val}</p>
                <p className="mock-mini mt-0.5 truncate font-sans text-[9.5px]" style={{ color: FAINT }}>{sous}</p>
              </div>
            ))}
          </div>

          {/* Chronomètre */}
          <div
            className="mt-3 flex flex-wrap items-center gap-2.5 rounded-[10px] border px-3 py-2.5"
            style={{ borderColor: LINE, background: "#fff" }}
          >
            <span
              className="font-mono text-[19px] tabular-nums transition-colors"
              style={{ color: enMarche ? GREEN : INK }}
            >
              {horloge}
            </span>
            <button
              type="button"
              onClick={() => setEnMarche((v) => !v)}
              className="inline-flex h-8 items-center gap-1.5 rounded-[7px] px-3 font-sans text-[12px] font-medium transition-colors"
              style={
                enMarche
                  ? { background: "rgba(31,42,36,0.07)", color: INK }
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
              className="inline-flex h-8 items-center rounded-[7px] border px-3 font-sans text-[12px] transition-colors disabled:opacity-40"
              style={{ borderColor: LINE, color: MUTED, background: "#fff" }}
            >
              Verser dans l&apos;entrée
            </button>
            <span className="mock-mini ml-auto font-sans text-[10.5px]" style={{ color: FAINT }}>
              Le chronomètre tourne pendant que vous travaillez.
            </span>
          </div>

          {/* Saisie */}
          <form onSubmit={ajouter} className="mt-2.5 rounded-[10px] border p-3" style={{ borderColor: "rgba(18,161,80,0.3)", background: "rgba(18,161,80,0.04)" }}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="mock-mini font-mono text-[10px] uppercase tracking-[0.12em]" style={{ color: GREEN }}>
                Ajouter une entrée
              </p>
              {/* certains avocats facturent à l'heure, d'autres au forfait */}
              <span className="inline-flex rounded-[7px] border p-0.5" style={{ borderColor: LINE, background: "#fff" }}>
                {(["horaire", "forfait"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className="rounded-[5px] px-2.5 py-1 font-sans text-[11px] capitalize transition-colors"
                    style={mode === m ? { background: "#1F3A2E", color: "#fff" } : { color: MUTED }}
                  >
                    {m}
                  </button>
                ))}
              </span>
            </div>
            {/* deux rangées : la description occupe toute la largeur, le reste suit.
               La maquette vit dans une colonne étroite, il ne faut rien faire déborder. */}
            <div className="mt-2.5 grid grid-cols-[1fr_72px_auto] gap-2">
              <input
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Ex. Préparation de l'audition"
                aria-label="Description du travail"
                className="mock-input col-span-3 h-9 min-w-0 rounded-[7px] border px-2.5 font-sans text-[13px] outline-none"
                style={{ borderColor: LINE, background: "#fff", color: INK }}
              />
              <select
                value={dossier}
                onChange={(e) => setDossier(e.target.value)}
                aria-label="Dossier"
                className="mock-input h-9 min-w-0 rounded-[7px] border px-2 font-sans text-[12.5px] outline-none"
                style={{ borderColor: LINE, background: "#fff", color: INK }}
              >
                {DOSSIERS.map((d) => (
                  <option key={d} value={d}>{d.split(" · ")[0]}</option>
                ))}
              </select>
              {mode === "horaire" ? (
                <input
                  value={heures}
                  onChange={(e) => setHeures(e.target.value)}
                  aria-label="Durée en heures"
                  inputMode="decimal"
                  className="mock-input h-9 min-w-0 rounded-[7px] border px-2 text-right font-mono text-[13px] outline-none"
                  style={{ borderColor: LINE, background: "#fff", color: INK }}
                />
              ) : (
                <input
                  value={forfait}
                  onChange={(e) => setForfait(e.target.value)}
                  aria-label="Montant du forfait"
                  inputMode="decimal"
                  className="mock-input h-9 min-w-0 rounded-[7px] border px-2 text-right font-mono text-[13px] outline-none"
                  style={{ borderColor: LINE, background: "#fff", color: INK }}
                />
              )}
              <button
                type="submit"
                className="h-9 whitespace-nowrap rounded-[7px] px-4 font-sans text-[13px] font-medium transition-transform hover:-translate-y-px"
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
                  <span className="block font-mono text-[12.5px]" style={{ color: INK }}>
                    {e.heures === 0 ? "forfait" : e.heures.toFixed(2).replace(".", ",") + " h"}
                  </span>
                  <span className="mock-mini block font-mono text-[10.5px]" style={{ color: e.facturee ? VERIFIED : FAINT }}>
                    {e.facturee ? "facturée" : money(valeur(e))}
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
                onClick={facturer}
                className="inline-flex h-9 items-center rounded-[7px] border px-4 font-sans text-[13px] font-medium transition-colors"
                style={{ borderColor: "rgba(18,161,80,0.4)", color: VERIFIED, background: "#fff" }}
              >
                Préparer la facture →
              </button>
            ) : (
              <span
                className="inline-flex items-center gap-2 rounded-[7px] px-3 py-2 font-sans text-[12.5px]"
                style={{ background: "rgba(18,161,80,0.1)", color: VERIFIED }}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: GREEN }} />
                Facture préparée à partir de {money(nonFacture)} de temps. Aucune ressaisie.
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
        Démarrez le chronomètre, ou basculez sur forfait. Écrivez une tâche, puis regardez
        le total suivre.
      </IndiceEssai>
      <style>{`
        @keyframes mockIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: none; } }
        .mock-input:focus { border-color: ${GREEN} !important; box-shadow: 0 0 0 3px rgba(18,161,80,0.12); }
      `}</style>
    </div>
  );
}

/* ──────────────────── 2. Tableau de bord manipulable ──────────────────── */

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
                  className="rounded-[10px] p-3 text-left transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    background: on ? "#16301F" : "#1F3A2E",
                    color: "#EAF2EC",
                    boxShadow: on ? "0 16px 32px -18px rgba(11,31,25,0.7)" : "none",
                    outline: on ? `2px solid ${GREEN}` : "2px solid transparent",
                  }}
                >
                  <span className="flex items-center gap-1.5">
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: estFid && !rapproche ? "#D9A63C" : "#7FD0A0" }}
                    />
                    <span className="mock-mini font-mono text-[8.5px] uppercase tracking-[0.1em]" style={{ color: "rgba(234,242,236,0.7)" }}>
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
            className="mt-3 overflow-hidden rounded-[9px] border transition-all duration-300"
            style={{
              borderColor: carte ? LINE : "transparent",
              background: carte ? "#fff" : "transparent",
              maxHeight: carte ? 140 : 0,
              opacity: carte ? 1 : 0,
            }}
          >
            {carte ? (
              <div className="p-3.5">
                <p className="font-sans text-[12.5px]" style={{ color: INK }}>{carte.label}</p>
                <p className="mt-1.5 max-w-[62ch] font-sans text-[12.5px] leading-[1.6]" style={{ color: MUTED }}>
                  {carte.detail}
                </p>
                {carte.cle === "fideicommis" && !rapproche ? (
                  <button
                    type="button"
                    onClick={() => setRapproche(true)}
                    className="mt-2.5 inline-flex h-8 items-center rounded-[7px] px-3 font-sans text-[12.5px] font-medium"
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

/* ──────────── 2 bis. L'application complète, avec sa barre de menu ────────────
   Le « après » de la page À propos : une vraie fenêtre de logiciel, dense et
   cohérente, où l'on change de section comme dans SAFE. */

const MENUS = [
  { cle: "tableau", label: "Tableau de bord" },
  { cle: "facturation", label: "Facturation" },
  { cle: "fideicommis", label: "Fidéicommis" },
] as const;

export function MockupAppComplete() {
  const [vue, setVue] = useState<string>("tableau");
  const [rapproche, setRapproche] = useState(false);
  const [envoyee, setEnvoyee] = useState(false);

  return (
    <div>
      <div
        className="safe-mock overflow-hidden rounded-[14px] border"
        style={{ borderColor: LINE, background: SURFACE, boxShadow: "0 40px 80px -44px rgba(11,31,25,0.55)" }}
      >
        <StylesMaquettesMobiles />
        {/* Barre de menu de l'application */}
        <div
          className="flex items-center gap-2 border-b px-3 py-2"
          style={{ borderColor: "rgba(255,255,255,0.08)", background: "#FBFCFA" }}
        >
          <span className="flex items-center pr-2">
            <SafeLogo size={12} />
          </span>
          <span className="mock-mini hidden font-sans text-[10.5px] sm:inline" style={{ color: FAINT }}>
            Cabinet Nadeau
          </span>
          <span className="ml-auto flex items-center gap-1">
            {MENUS.map((m) => {
              const on = vue === m.cle;
              return (
                <button
                  key={m.cle}
                  type="button"
                  onClick={() => setVue(m.cle)}
                  className="rounded-[6px] px-2.5 py-1.5 font-sans text-[11.5px] transition-colors"
                  style={{
                    color: on ? INK : MUTED,
                    background: on ? "rgba(31,42,36,0.06)" : "transparent",
                  }}
                >
                  {m.label}
                </button>
              );
            })}
          </span>
        </div>

        {/* Bandeau d'état */}
        <div
          className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2"
          style={{ background: "#1F3A2E", color: "#E4EDE6" }}
        >
          {[
            ["Dossiers actifs", "12"],
            ["Clients actifs", "9"],
            ["Fidéicommis", rapproche ? "Rapproché" : "À rapprocher"],
          ].map(([k, v], i) => (
            <span key={k} className="mock-mini flex items-center gap-1.5 font-sans text-[10.5px]">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: i === 2 && !rapproche ? "#D9A63C" : "#7FD0A0" }}
              />
              {k}
              <b className="font-medium">{v}</b>
            </span>
          ))}
          <span className="mock-mini ml-auto font-mono text-[9.5px]" style={{ color: "rgba(228,237,230,0.6)" }}>
            30 JUIN 2026
          </span>
        </div>

        <div className="p-3.5 sm:p-4">
          {/* ── Vue tableau de bord ── */}
          {vue === "tableau" ? (
            <div>
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                {[
                  ["Facturé ce mois", "18 240,00 $", "+12 %"],
                  ["Encaissé", "15 980,00 $", "88 %"],
                  ["À recevoir", "2 260,00 $", "3 factures"],
                  ["Heures du mois", "128,75 h", "+8 %"],
                ].map(([l, v, s]) => (
                  <div key={l} className="min-w-0 rounded-[9px] p-2.5" style={{ background: "#1F3A2E", color: "#EAF2EC" }}>
                    <p className="mock-mini truncate font-mono text-[8px] uppercase tracking-[0.1em]" style={{ color: "rgba(234,242,236,0.65)" }}>{l}</p>
                    <p className="mt-1.5 truncate font-mono text-[14px] tabular-nums">{v}</p>
                    <p className="mock-mini mt-0.5 truncate font-sans text-[9px]" style={{ color: "#7FD0A0" }}>{s}</p>
                  </div>
                ))}
              </div>

              <div className="mt-3 grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-[9px] border p-3" style={{ borderColor: LINE, background: "#fff" }}>
                  <p className="mock-mini font-mono text-[9px] uppercase tracking-[0.12em]" style={{ color: GREEN }}>À traiter maintenant</p>
                  <p className="mt-1.5 font-serif text-[16px] leading-[1.2]" style={{ color: INK }}>
                    Trois factures dépassent 30 jours.
                  </p>
                  <div className="mt-2.5 space-y-1.5">
                    {[
                      ["Boulanger c. Nadeau", "1 240,00 $", "42 j"],
                      ["Succession Tremblay", "620,00 $", "35 j"],
                      ["Vente Beaulieu", "400,00 $", "31 j"],
                    ].map(([c, m, j]) => (
                      <div key={c} className="flex items-center justify-between border-b pb-1.5 last:border-0" style={{ borderColor: LINE_SOFT }}>
                        <span className="truncate font-sans text-[11.5px]" style={{ color: INK }}>{c}</span>
                        <span className="flex shrink-0 items-center gap-2">
                          <span className="font-mono text-[11px]" style={{ color: INK }}>{m}</span>
                          <span className="mock-mini rounded-full px-1.5 py-0.5 font-mono text-[9px]" style={{ background: "rgba(195,138,36,0.14)", color: "#8A6A1E" }}>{j}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setEnvoyee(true)}
                    className="mt-2.5 inline-flex h-8 items-center rounded-[7px] px-3 font-sans text-[11.5px] font-medium"
                    style={{ background: envoyee ? "rgba(18,161,80,0.12)" : GREEN, color: envoyee ? VERIFIED : "#fff" }}
                  >
                    {envoyee ? "Rappels envoyés aux trois clients" : "Envoyer les rappels"}
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="rounded-[9px] border p-3" style={{ borderColor: LINE, background: "#fff" }}>
                    <p className="font-serif text-[13px]" style={{ color: INK }}>Lecture financière</p>
                    {[
                      ["Taux d'encaissement", "88 %"],
                      ["Heures non facturées", "1 400,83 $"],
                      ["Solde en fidéicommis", "23 568,40 $"],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between border-b py-1.5 last:border-0" style={{ borderColor: LINE_SOFT }}>
                        <span className="font-sans text-[11px]" style={{ color: MUTED }}>{k}</span>
                        <span className="font-mono text-[11px]" style={{ color: INK }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-[9px] border p-3" style={{ borderColor: LINE, background: "#fff" }}>
                    <p className="font-serif text-[13px]" style={{ color: INK }}>Activité récente</p>
                    {[
                      ["Facture 2026-041 payée", "il y a 2 h"],
                      ["6,5 h approuvées", "il y a 5 h"],
                      ["Dépôt en fiducie 2 500 $", "hier"],
                    ].map(([k, v]) => (
                      <div key={k} className="flex items-center justify-between border-b py-1.5 last:border-0" style={{ borderColor: LINE_SOFT }}>
                        <span className="flex min-w-0 items-center gap-1.5">
                          <span className="h-1 w-1 shrink-0 rounded-full" style={{ background: GREEN }} />
                          <span className="truncate font-sans text-[11px]" style={{ color: INK }}>{k}</span>
                        </span>
                        <span className="mock-mini shrink-0 font-sans text-[9.5px]" style={{ color: FAINT }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* ── Vue facturation ── */}
          {vue === "facturation" ? (
            <div>
              <div className="grid grid-cols-3 gap-2">
                {[["Facturables", "4"], ["Envoyées", "11"], ["En retard", "3"]].map(([l, v]) => (
                  <div key={l} className="rounded-[9px] border p-2.5" style={{ borderColor: LINE, background: "#fff" }}>
                    <p className="mock-mini font-sans text-[9.5px]" style={{ color: FAINT }}>{l}</p>
                    <p className="mt-1 font-mono text-[15px]" style={{ color: INK }}>{v}</p>
                  </div>
                ))}
              </div>
              <table className="mt-3 w-full text-left">
                <tbody>
                  <tr className="border-b" style={{ borderColor: LINE }}>
                    {["Client", "Dossier", "Heures", "Montant"].map((h) => (
                      <th key={h} className="pb-1.5 font-sans text-[9.5px] font-medium last:text-right" style={{ color: FAINT }}>{h}</th>
                    ))}
                  </tr>
                  {[
                    ["Marie-Claude Tremblay", "2026-014", "6,5 h", "3 679,20 $"],
                    ["Pierre Nadeau", "2026-021", "4,2 h", "2 173,50 $"],
                    ["Sylvie Beaulieu", "2026-008", "2,0 h", "1 034,25 $"],
                  ].map((r) => (
                    <tr key={r[0]} className="border-b" style={{ borderColor: LINE_SOFT }}>
                      {r.map((c, i) => (
                        <td key={i} className="py-1.5 font-sans text-[11px] last:text-right last:font-mono" style={{ color: i === 0 ? INK : MUTED }}>{c}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2.5 font-sans text-[10.5px] leading-[1.5]" style={{ color: VERIFIED }}>
                À l&apos;envoi d&apos;une facture, les écritures comptables se passent seules :
                revenu, taxes, créance. Rien à ressaisir.
              </p>
            </div>
          ) : null}

          {/* ── Vue fidéicommis ── */}
          {vue === "fideicommis" ? (
            <div>
              {[
                ["Solde bancaire", "23 568,40 $", true],
                ["Registre du fidéicommis", "23 568,40 $", true],
                ["Soldes par dossier", rapproche ? "23 568,40 $" : "23 068,40 $", rapproche],
              ].map(([l, v, ok]) => (
                <div key={l as string} className="flex items-center justify-between border-b py-2.5" style={{ borderColor: LINE_SOFT }}>
                  <span className="font-sans text-[12px]" style={{ color: MUTED }}>{l}</span>
                  <span className="flex items-center gap-2 font-mono text-[12px]" style={{ color: ok ? INK : "#9A6712" }}>
                    {v}
                    <span className="h-2 w-2 rounded-full" style={{ background: ok ? GREEN : "#C38A24" }} />
                  </span>
                </div>
              ))}
              <div className="mt-3">
                {!rapproche ? (
                  <div className="rounded-[8px] px-3 py-2.5" style={{ background: "rgba(195,138,36,0.09)" }}>
                    <p className="font-sans text-[11px] leading-[1.5]" style={{ color: "#72531B" }}>
                      Écart de 500 $. La certification reste bloquée.
                    </p>
                    <button
                      type="button"
                      onClick={() => setRapproche(true)}
                      className="mt-2 inline-flex h-7.5 items-center rounded-[6px] px-2.5 py-1.5 font-sans text-[11px] font-medium"
                      style={{ background: GREEN, color: "#fff" }}
                    >
                      Corriger l&apos;écart
                    </button>
                  </div>
                ) : (
                  <p className="rounded-[8px] px-3 py-2.5 font-sans text-[11px]" style={{ background: "rgba(18,161,80,0.1)", color: VERIFIED }}>
                    Concordance. La certification peut être produite.
                  </p>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <IndiceEssai>
        Changez de section dans le menu : tableau de bord, facturation, fidéicommis.
      </IndiceEssai>
    </div>
  );
}

/* ──────────────────── 2 ter. Un dépôt non conforme est refusé ────────────────────
   Décrit le comportement livré aujourd'hui : au-delà du plafond, l'écriture est
   refusée et la règle citée. Le régime québécois (déclaration obligatoire plutôt
   qu'interdiction) sera ajouté quand le moteur sera rendu conscient de la province. */

export function MockupDepotConforme() {
  const [montant, setMontant] = useState("8 000");
  const [tente, setTente] = useState(false);

  const valeur = parseFloat(montant.replace(/\s/g, "").replace(",", ".")) || 0;
  const refuse = valeur > 7500;

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
                <p className="font-sans text-[12.5px] font-medium" style={{ color: "#72531B" }}>
                  Écriture refusée
                </p>
                <p className="mt-1 font-sans text-[12px] leading-[1.55]" style={{ color: "#72531B" }}>
                  Le plafond d&apos;espèces applicable au dossier est dépassé. SAFE bloque
                  l&apos;enregistrement et cite la règle plutôt que de laisser passer une
                  écriture qui deviendrait un problème à l&apos;inspection.
                </p>
              </div>
            ) : (
              <div className="rounded-[9px] px-3.5 py-3" style={{ background: "rgba(18,161,80,0.1)" }}>
                <p className="font-sans text-[12.5px] font-medium" style={{ color: VERIFIED }}>
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

/* ──────────── 2 quater. L'envoi de facture écrit la comptabilité ──────────── */

const ECRITURES = [
  ["Honoraires professionnels", "3 200,00 $", "Produit"],
  ["TPS à remettre", "160,00 $", "Passif"],
  ["TVQ à remettre", "319,20 $", "Passif"],
  ["Créance client", "3 679,20 $", "Actif"],
];

export function MockupEnvoiFacture() {
  const [etape, setEtape] = useState(0); // 0 prête · 1 envoyée · 2 écritures passées

  React.useEffect(() => {
    if (etape !== 1) return;
    const t = setTimeout(() => setEtape(2), 900);
    return () => clearTimeout(t);
  }, [etape]);

  return (
    <div>
      <SafeWindow fil={<span>Facture 2026-041</span>} indice="Maquette · envoyez la facture">
        <div className="p-4 sm:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2 border-b pb-3" style={{ borderColor: LINE }}>
            <span className="font-serif text-[18px]" style={{ color: INK }}>Succession Tremblay</span>
            <span className="font-mono text-[15px]" style={{ color: INK }}>3 679,20 $</span>
          </div>

          <div className="mt-3">
            <p className="mock-mini font-mono text-[9.5px] uppercase tracking-[0.12em]" style={{ color: FAINT }}>
              Écritures comptables
            </p>
            <div className="mt-2">
              {ECRITURES.map((e, i) => {
                const visible = etape === 2;
                return (
                  <div
                    key={e[0]}
                    className="flex items-center justify-between border-b py-2 transition-all duration-500"
                    style={{
                      borderColor: LINE_SOFT,
                      opacity: visible ? 1 : 0.2,
                      transform: visible ? "none" : "translateX(-6px)",
                      transitionDelay: `${i * 110}ms`,
                    }}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-500"
                        style={{ background: visible ? GREEN : "rgba(124,135,127,0.4)" }}
                      />
                      <span className="truncate font-sans text-[12.5px]" style={{ color: INK }}>{e[0]}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-3">
                      <span className="mock-mini font-sans text-[10.5px]" style={{ color: FAINT }}>{e[2]}</span>
                      <span className="font-mono text-[12px]" style={{ color: INK }}>{e[1]}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4">
            {etape === 0 ? (
              <button
                type="button"
                onClick={() => setEtape(1)}
                className="inline-flex h-9 items-center rounded-[7px] px-4 font-sans text-[13px] font-medium"
                style={{ background: GREEN, color: "#fff" }}
              >
                Envoyer la facture au client
              </button>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className="inline-flex items-center gap-2 rounded-[7px] px-3 py-2 font-sans text-[12.5px]"
                  style={{ background: "rgba(18,161,80,0.1)", color: VERIFIED }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: GREEN }} />
                  {etape === 1
                    ? "Facture envoyée au client..."
                    : "Envoyée. Quatre écritures passées, tableau de bord à jour."}
                </span>
                <button
                  type="button"
                  onClick={() => setEtape(0)}
                  className="font-sans text-[12px] underline underline-offset-2"
                  style={{ color: FAINT }}
                >
                  Recommencer
                </button>
              </div>
            )}
          </div>
        </div>
      </SafeWindow>
      <IndiceEssai>Cliquez « Envoyer » : les écritures se passent seules, sous vos yeux.</IndiceEssai>
    </div>
  );
}

/* ──────────── 2 quinquies. Le cartable se monte selon la pratique ──────────── */

const CARTABLES: Record<string, { label: string; sections: [string, string][] }> = {
  famille: {
    label: "Droit de la famille",
    sections: [
      ["Mandat et engagement", ""],
      ["Pièces Madame (P-)", "Règl. Cour Qc art. 13"],
      ["Pièces Monsieur (D-)", "Règl. Cour Qc art. 13"],
      ["Procédures", ""],
      ["Jugements et ordonnances", ""],
      ["Correspondance", ""],
      ["Fidéicommis", ""],
      ["Notes et honoraires", ""],
      ["Fermeture du dossier", ""],
    ],
  },
  criminel: {
    label: "Droit criminel",
    sections: [
      ["Mandat et engagement", ""],
      ["Phase préjudiciaire", ""],
      ["Divulgation de la preuve", ""],
      ["Procédures", ""],
      ["Audiences", ""],
      ["Correspondance", ""],
      ["Notes et honoraires", ""],
      ["Fermeture du dossier", ""],
    ],
  },
  immobilier: {
    label: "Immobilier",
    sections: [
      ["Mandat et engagement", ""],
      ["Titre et examen", ""],
      ["Financement", ""],
      ["Actes et publication", ""],
      ["Fidéicommis", ""],
      ["Correspondance", ""],
      ["Notes et honoraires", ""],
      ["Fermeture du dossier", ""],
    ],
  },
};

export function MockupCartable() {
  const [domaine, setDomaine] = useState("famille");
  const [depose, setDepose] = useState(false);
  const cartable = CARTABLES[domaine];

  return (
    <div>
      <SafeWindow fil={<span>Nouveau dossier · cartable</span>} indice="Maquette · changez de domaine">
        <div className="p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-sans text-[12px]" style={{ color: MUTED }}>Domaine de pratique</span>
            <select
              value={domaine}
              onChange={(e) => { setDomaine(e.target.value); setDepose(false); }}
              aria-label="Domaine de pratique"
              className="mock-input h-9 rounded-[7px] border px-2.5 font-sans text-[13px] outline-none"
              style={{ borderColor: LINE, background: "#fff", color: INK }}
            >
              {Object.entries(CARTABLES).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>

          <div className="mt-3.5 space-y-1">
            {cartable.sections.map((s, i) => (
              <div
                key={s[0]}
                className="flex items-center justify-between rounded-[7px] border px-3 py-2"
                style={{
                  borderColor: depose && i === 1 ? "rgba(18,161,80,0.45)" : LINE_SOFT,
                  background: depose && i === 1 ? "rgba(18,161,80,0.06)" : "#fff",
                  animation: `mockIn 0.45s cubic-bezier(0.16,1,0.3,1) ${i * 55}ms both`,
                }}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="mock-mini font-mono text-[10px]" style={{ color: FAINT }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="truncate font-sans text-[12.5px]" style={{ color: INK }}>{s[0]}</span>
                </span>
                <span className="mock-mini shrink-0 pl-3 font-mono text-[9.5px]" style={{ color: FAINT }}>
                  {depose && i === 1 ? "1 pièce classée" : s[1]}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-3.5">
            {!depose ? (
              <button
                type="button"
                onClick={() => setDepose(true)}
                className="inline-flex h-9 items-center rounded-[7px] border px-4 font-sans text-[13px] font-medium"
                style={{ borderColor: "rgba(18,161,80,0.4)", color: VERIFIED, background: "#fff" }}
              >
                Déposer une pièce
              </button>
            ) : (
              <p className="font-sans text-[12px] leading-[1.55]" style={{ color: VERIFIED }}>
                « Déclaration de revenus 2025.pdf » reconnue et classée dans la bonne
                section. Vous n&apos;avez rien eu à choisir.
              </p>
            )}
          </div>
        </div>
      </SafeWindow>
      <IndiceEssai>
        Changez de domaine : le cartable se remonte. Puis déposez une pièce.
      </IndiceEssai>
    </div>
  );
}

/* ──────────────────── 3. Rapprochement à trois voies ──────────────────── */

export function MockupRapprochement() {
  const [corrige, setCorrige] = useState(false);
  const soldes = [
    ["Solde bancaire", 21000, true],
    ["Registre du fidéicommis", 21000, true],
    ["Soldes par dossier", corrige ? 21000 : 20500, corrige],
  ] as const;

  return (
    <div>
      <SafeWindow fil={<span>Fidéicommis · rapprochement</span>} indice="Maquette · corrigez l'écart">
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: LINE }}>
            <span className="font-sans text-[13px]" style={{ color: INK }}>Rapprochement à trois voies</span>
            <span className="mock-mini font-mono text-[10.5px]" style={{ color: FAINT }}>JUIN 2026</span>
          </div>
          {soldes.map(([label, val, ok]) => (
            <div key={label} className="flex items-center justify-between border-b py-3" style={{ borderColor: LINE_SOFT }}>
              <span className="font-sans text-[13px]" style={{ color: MUTED }}>{label}</span>
              <span className="flex items-center gap-2 font-mono text-[13px]" style={{ color: ok ? INK : "#9A6712" }}>
                {money(val)}
                <span
                  className="h-2 w-2 rounded-full transition-all"
                  style={{
                    background: ok ? GREEN : "#C38A24",
                    boxShadow: ok ? "none" : "0 0 0 4px rgba(195,138,36,0.12)",
                  }}
                />
              </span>
            </div>
          ))}
          <div className="mt-3.5">
            {!corrige ? (
              <div className="rounded-[9px] px-3.5 py-3" style={{ background: "rgba(195,138,36,0.09)" }}>
                <p className="font-sans text-[12px] leading-[1.55]" style={{ color: "#72531B" }}>
                  Écart de 500 $. La certification reste bloquée jusqu&apos;à la correction.
                </p>
                <button
                  type="button"
                  onClick={() => setCorrige(true)}
                  className="mt-2.5 inline-flex h-8 items-center rounded-[7px] px-3 font-sans text-[12.5px] font-medium"
                  style={{ background: GREEN, color: "#fff" }}
                >
                  Corriger l&apos;écart
                </button>
              </div>
            ) : (
              <div className="rounded-[9px] px-3.5 py-3" style={{ background: "rgba(18,161,80,0.1)" }}>
                <p className="font-sans text-[12px] leading-[1.55]" style={{ color: VERIFIED }}>
                  Concordance. Les trois soldes s&apos;accordent, la certification peut être produite.
                </p>
                <button
                  type="button"
                  onClick={() => setCorrige(false)}
                  className="mt-2 font-sans text-[11.5px] underline underline-offset-2"
                  style={{ color: FAINT }}
                >
                  Revoir l&apos;écart
                </button>
              </div>
            )}
          </div>
        </div>
      </SafeWindow>
      <IndiceEssai>Le bouton est actif : corrigez l&apos;écart et regardez la pastille passer au vert.</IndiceEssai>
    </div>
  );
}

/* ──────────────────── 4. Dossier navigable (client → dossier) ──────────────────── */

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
                <p className="mock-mini font-mono text-[9.5px] uppercase tracking-[0.13em]" style={{ color: FAINT }}>Fiche client</p>
                <p className="mt-1 font-serif text-[19px]" style={{ color: INK }}>Marie-Claude Tremblay</p>
                {[
                  ["Type", "Particulier · liquidatrice"],
                  ["Ville", "Lévis (Québec)"],
                  ["En fiducie", "2 225,00 $"],
                  ["À recevoir", "0,00 $"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b py-1.5 last:border-0" style={{ borderColor: LINE_SOFT }}>
                    <span className="font-sans text-[12.5px]" style={{ color: MUTED }}>{k}</span>
                    <span className="font-sans text-[12.5px]" style={{ color: INK }}>{v}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-[10px] border p-3.5" style={{ borderColor: LINE, background: "#fff" }}>
                <p className="mock-mini font-mono text-[9.5px] uppercase tracking-[0.13em]" style={{ color: FAINT }}>
                  Dossiers de la cliente
                </p>
                <button
                  type="button"
                  onClick={() => setEcran("dossier")}
                  className="group mt-2 flex w-full items-center justify-between gap-3 rounded-[9px] border p-3 text-left transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    borderColor: "rgba(18,161,80,0.4)",
                    background: "rgba(18,161,80,0.05)",
                    boxShadow: "0 10px 24px -18px rgba(11,31,25,0.5)",
                  }}
                >
                  <span className="min-w-0">
                    <span className="mock-mini block font-mono text-[10.5px]" style={{ color: FAINT }}>2026-014 · Succession</span>
                    <span className="mt-0.5 block font-sans text-[13.5px]" style={{ color: INK }}>Succession Tremblay</span>
                  </span>
                  <span
                    className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 font-sans text-[12px] font-medium transition-transform group-hover:translate-x-0.5"
                    style={{ background: GREEN, color: "#fff" }}
                  >
                    Ouvrir →
                  </span>
                </button>
                <div className="mt-2 flex items-center justify-between rounded-[9px] border p-3" style={{ borderColor: LINE_SOFT }}>
                  <span>
                    <span className="mock-mini block font-mono text-[10.5px]" style={{ color: FAINT }}>2024-032 · Immobilier</span>
                    <span className="mt-0.5 block font-sans text-[13.5px]" style={{ color: MUTED }}>Vente d&apos;un immeuble locatif</span>
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
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-sans text-[12px] transition-colors"
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
                      className="-mb-px px-3 py-2 font-sans text-[12.5px] transition-colors"
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
                        <p className="mock-mini font-sans text-[10.5px]" style={{ color: FAINT }}>{k}</p>
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
                          <td className="py-2 font-sans text-[12.5px]" style={{ color: INK }}>{t}</td>
                          <td className="py-2 text-right font-mono text-[12.5px]" style={{ color: INK }}>{h}</td>
                        </tr>
                      ))}
                      <tr>
                        <td />
                        <td className="pt-2.5 font-sans text-[12.5px] font-medium" style={{ color: INK }}>Total approuvé</td>
                        <td className="pt-2.5 text-right font-mono text-[13.5px]" style={{ color: INK }}>6,5 h</td>
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
                          <td className="py-2 font-sans text-[12.5px]" style={{ color: INK }}>{t}</td>
                          <td className="py-2 text-right font-mono text-[12.5px]" style={{ color: INK }}>{m}</td>
                        </tr>
                      ))}
                      <tr>
                        <td className="pt-2.5 font-sans text-[12.5px] font-medium" style={{ color: INK }}>
                          Facture 2026-041 · payée le 14 juin
                        </td>
                        <td className="pt-2.5 text-right font-mono text-[13.5px]" style={{ color: VERIFIED }}>3 679,20 $</td>
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
                          <td className="py-2 font-sans text-[12.5px]" style={{ color: INK }}>{t}</td>
                          <td className="py-2 text-right font-mono text-[12.5px]" style={{ color: INK }}>{m}</td>
                        </tr>
                      ))}
                      <tr>
                        <td className="pt-2.5 font-sans text-[12.5px] font-medium" style={{ color: INK }}>Solde en fiducie</td>
                        <td className="pt-2.5 text-right font-mono text-[13.5px]" style={{ color: INK }}>2 225,00 $</td>
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
                        <span className="font-sans text-[12.5px]" style={{ color: INK }}>{t}</span>
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
