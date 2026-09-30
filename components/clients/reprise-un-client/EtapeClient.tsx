"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { cleCroisement } from "@/lib/clients/croisement-conflits";
import { Bloc, Carte, Champ, champClass, EnTeteCarte, Message, Pastille, Segment } from "./pieces";
import type { ChoixClient, ContexteRepriseUnClient, EtatConflits, IdentiteSaisie } from "./types";

const FORMES_JURIDIQUES = /\b(inc|ltée|ltee|ltd|limitée|limited|corp|corporation|s\.?e\.?n\.?c\.?r?\.?l?|llp|cie|enr)\b\.?/i;

/** Recherche tolérante : casse, accents et ordre des mots ne comptent pas. */
function plat(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function identiteDepuisRecherche(texte: string): IdentiteSaisie {
  const nom = texte.trim();
  const vide: IdentiteSaisie = {
    typeClient: "personne_morale",
    prenom: "",
    nom: "",
    raisonSociale: "",
    occupation: "",
    natureActivites: "",
    email: "",
    telephone: "",
    langue: "",
    adresse: "",
  };
  if (FORMES_JURIDIQUES.test(nom) || !nom.includes(" ")) {
    return { ...vide, typeClient: "personne_morale", raisonSociale: nom };
  }
  const mots = nom.split(/\s+/);
  return { ...vide, typeClient: "personne_physique", prenom: mots.slice(0, -1).join(" "), nom: mots[mots.length - 1] };
}

export function nomSaisi(identite: IdentiteSaisie): string {
  return identite.typeClient === "personne_morale"
    ? identite.raisonSociale.trim()
    : [identite.prenom, identite.nom].map((v) => v.trim()).filter(Boolean).join(" ");
}

interface Props {
  contexte: ContexteRepriseUnClient;
  choix: ChoixClient | null;
  onChoix: (c: ChoixClient | null) => void;
  recherche: string;
  onRecherche: (v: string) => void;
  conflits: EtatConflits;
  onConflits: (c: EtatConflits) => void;
  conflitsDeclares: boolean;
  onConflitsDeclares: (v: boolean) => void;
}

export function EtapeClient({
  contexte,
  choix,
  onChoix,
  recherche,
  onRecherche,
  conflits,
  onConflits,
  conflitsDeclares,
  onConflitsDeclares,
}: Props) {
  const t = useTranslations("repriseUnClient.client");

  const trouves = useMemo(() => {
    const mots = plat(recherche).split(/\s+/).filter((m) => m.length >= 2);
    if (mots.length === 0) return [];
    return contexte.clients.filter((c) => {
      const nom = plat(c.nom);
      return mots.every((m) => nom.includes(m));
    }).slice(0, 6);
  }, [recherche, contexte.clients]);

  const nomExactExiste = useMemo(
    () => contexte.clients.some((c) => cleCroisement(c.nom) === cleCroisement(recherche)),
    [recherche, contexte.clients],
  );

  /* ── Conflits : vérifiés dès que le nouveau client a un nom ─────────── */
  const identite = choix?.mode === "nouveau" ? choix.identite : null;
  const nomNouveau = identite ? nomSaisi(identite) : "";
  useEffect(() => {
    if (!identite || nomNouveau.length < 3 || conflits.pour === nomNouveau) return;
    const minuterie = setTimeout(async () => {
      onConflits({ phase: "verification", nombre: 0, details: [], pour: nomNouveau });
      try {
        const res = await fetch("/api/clients/conflict-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            typeClient: identite.typeClient,
            raisonSociale: identite.raisonSociale,
            prenom: identite.prenom,
            nom: identite.nom,
            email: identite.email,
          }),
        });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { status: string; matches?: { label: string; reason: string }[] };
        const details = (data.matches ?? []).map((m) => ({ label: m.label, reason: m.reason }));
        onConflits({ phase: "fait", nombre: details.length, details, pour: nomNouveau });
      } catch {
        onConflits({ phase: "erreur", nombre: 0, details: [], pour: nomNouveau });
      }
    }, 600);
    return () => clearTimeout(minuterie);
    // identite change à chaque frappe : la clé de relance est le nom vérifié.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nomNouveau, identite?.email]);

  const majIdentite = (patch: Partial<IdentiteSaisie>) => {
    if (choix?.mode !== "nouveau") return;
    onChoix({ mode: "nouveau", identite: { ...choix.identite, ...patch } });
  };

  const choixExistantId = choix?.mode === "existant" ? choix.id : null;

  return (
    <Carte>
      <EnTeteCarte titre={t("question")} aide={t("aide")} />

      <div className="px-5 pb-5">
        <div className="flex h-10 items-center gap-2.5 rounded-lg border border-si-border-strong bg-si-surface px-3">
          <Search className="h-4 w-4 shrink-0 text-si-muted" aria-hidden />
          <input
            className="h-full min-w-0 flex-1 bg-transparent text-[14px] text-si-ink outline-none"
            placeholder={t("recherche")}
            value={recherche}
            onChange={(e) => onRecherche(e.target.value)}
            aria-label={t("recherche")}
            autoFocus
          />
          <span className="shrink-0 text-[12px] text-si-muted">{t("compte", { n: contexte.clients.length })}</span>
        </div>

        {recherche.trim().length >= 2 && (
          <div className="mt-2 overflow-hidden rounded-[10px] border border-si-line">
            <div className="border-b border-si-line2 px-3.5 py-2 text-[12px] text-si-muted">
              {trouves.length > 0 ? t("trouves") : t("aucunTrouve")}
            </div>
            {trouves.map((c) => {
              const actif = c.id === choixExistantId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => onChoix({ mode: "existant", id: c.id, nom: c.nom })}
                  className={`grid w-full grid-cols-[1fr_auto] items-center gap-3 border-t border-si-line2 px-3.5 py-2.5 text-left first:border-t-0 ${
                    actif ? "bg-si-canvas shadow-[inset_2px_0_0_var(--si-ink)]" : "hover:bg-si-canvas"
                  }`}
                >
                  <span>
                    <span className="block text-[13px] font-medium text-si-ink">{c.nom}</span>
                    <span className="block text-[12px] text-si-muted">{t("mandats", { n: c.mandats.length })}</span>
                  </span>
                  {actif ? (
                    <Pastille ton="cours">{t("choisi")}</Pastille>
                  ) : (
                    <span className="text-[12px] text-si-muted underline underline-offset-2">{t("cestCeClient")}</span>
                  )}
                </button>
              );
            })}
            {!nomExactExiste && (
              <button
                type="button"
                onClick={() => onChoix({ mode: "nouveau", identite: identiteDepuisRecherche(recherche) })}
                className={`grid w-full grid-cols-[1fr_auto] items-center gap-3 border-t border-si-line2 px-3.5 py-2.5 text-left ${
                  choix?.mode === "nouveau" ? "bg-si-canvas shadow-[inset_2px_0_0_var(--si-ink)]" : "hover:bg-si-canvas"
                }`}
              >
                <span>
                  <span className="block text-[13px] font-medium text-si-ink">
                    <span className="font-normal text-si-muted">+ </span>
                    {t("creer", { nom: recherche.trim() })}
                  </span>
                  <span className="block text-[12px] text-si-muted">{t("creerAide")}</span>
                </span>
                {choix?.mode === "nouveau" && <Pastille ton="cours">{t("choisi")}</Pastille>}
              </button>
            )}
          </div>
        )}

        {choix?.mode === "existant" && <Message ton="ok">{t("existantChoisi")}</Message>}
      </div>

      {identite && (
        <div className="border-t border-si-line px-5 pb-5 pt-[18px]">
          <Bloc lettre="A" titre={t("nouveauTitre")}>
            <div className="mt-2.5">
              <Segment
                etiquette={t("nouveauTitre")}
                valeur={identite.typeClient}
                onChange={(v) => majIdentite({ typeClient: v })}
                options={[
                  { cle: "personne_physique", libelle: t("personne") },
                  { cle: "personne_morale", libelle: t("entreprise") },
                ]}
              />
            </div>
            {identite.typeClient === "personne_morale" ? (
              <div className="mt-2.5 flex flex-wrap gap-2.5">
                <Champ libelle={t("raisonSociale")} className="min-w-[240px] flex-[1.3]">
                  <input className={champClass} value={identite.raisonSociale} onChange={(e) => majIdentite({ raisonSociale: e.target.value })} />
                </Champ>
                <Champ libelle={t("natureActivites")} className="min-w-[200px] flex-1">
                  <input className={champClass} value={identite.natureActivites} onChange={(e) => majIdentite({ natureActivites: e.target.value })} />
                </Champ>
              </div>
            ) : (
              <div className="mt-2.5 flex flex-wrap gap-2.5">
                <Champ libelle={t("prenom")} className="min-w-[160px] flex-1">
                  <input className={champClass} value={identite.prenom} onChange={(e) => majIdentite({ prenom: e.target.value })} />
                </Champ>
                <Champ libelle={t("nom")} className="min-w-[160px] flex-1">
                  <input className={champClass} value={identite.nom} onChange={(e) => majIdentite({ nom: e.target.value })} />
                </Champ>
                <Champ libelle={t("occupation")} className="min-w-[160px] flex-1">
                  <input className={champClass} value={identite.occupation} onChange={(e) => majIdentite({ occupation: e.target.value })} />
                </Champ>
              </div>
            )}
            <div className="mt-2.5 flex flex-wrap gap-2.5">
              <Champ libelle={t("courriel")} className="min-w-[220px] flex-1">
                <input type="email" className={champClass} value={identite.email} onChange={(e) => majIdentite({ email: e.target.value })} />
              </Champ>
              <Champ libelle={t("telephone")} className="w-[180px]">
                <input type="tel" className={`${champClass} font-mono tabular-nums`} value={identite.telephone} onChange={(e) => majIdentite({ telephone: e.target.value })} />
              </Champ>
              <Champ libelle={t("langue")} className="w-[160px]">
                <input className={champClass} value={identite.langue} onChange={(e) => majIdentite({ langue: e.target.value })} />
              </Champ>
            </div>
            <div className="mt-2.5">
              <Champ libelle={t("adresse")}>
                <input className={champClass} value={identite.adresse} onChange={(e) => majIdentite({ adresse: e.target.value })} />
              </Champ>
            </div>
          </Bloc>

          <Bloc lettre="B" titre={t("conflitsTitre")} aide={t("conflitsAide")} dernier>
            {conflits.phase === "verification" && <p className="mt-2.5 text-[13px] text-si-muted">{t("conflitsVerification")}</p>}
            {conflits.phase === "fait" && conflits.nombre === 0 && <Message ton="ok">{t("conflitsAucun")}</Message>}
            {conflits.phase === "fait" && conflits.nombre > 0 && (
              <Message ton="attention">
                {t("conflitsTrouves", { n: conflits.nombre })}
                <ul className="mt-1 list-disc pl-4">
                  {conflits.details.slice(0, 5).map((d, i) => (
                    <li key={i}>
                      <span className="font-medium">{d.label}</span> · {d.reason}
                    </li>
                  ))}
                </ul>
              </Message>
            )}
            {conflits.phase === "erreur" && <Message ton="attention">{t("conflitsErreur")}</Message>}
            <label className="mt-3 flex items-start gap-2 text-[13px] text-si-body">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-[var(--si-ink)]"
                checked={conflitsDeclares}
                onChange={(e) => onConflitsDeclares(e.target.checked)}
              />
              <span>
                {t("conflitsDeclarer")}
                <span className="block text-[12px] text-si-muted">{t("conflitsDeclarerAide")}</span>
              </span>
            </label>
          </Bloc>
        </div>
      )}
    </Carte>
  );
}
