"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { MandatConnu } from "@/lib/services/reprise-un-client/contexte";
import { Alerte, Champ, Lien, Section, champ, titre } from "./ui";

export interface CoordonneesSaisies {
  adresse: string;
  telephone: string;
  courriel: string;
}

export type ClientChoisi =
  | {
      mode: "connu";
      id: string;
      nom: string;
      adresse: string | null;
      courriel: string | null;
      telephone: string | null;
      identiteVerifiee: boolean;
      mandats: MandatConnu[];
    }
  | { mode: "nouveau"; nom: string; coordonnees: CoordonneesSaisies; proches: { id: string; nom: string }[] };

export type MandatChoisi =
  | { mode: "existant"; id: string; intitule: string; taux: number | null }
  | { mode: "nouveau"; intitule: string; taux: string; avocatId: string };

export interface EtatConflits {
  phase: "attente" | "verification" | "fait" | "erreur";
  nombre: number;
  pour: string;
}

/* ── La ligne d'état d'un client : connu, ou nouveau et ses conflits ─────── */

export function EtatClient({ client, conflits }: { client: ClientChoisi; conflits: EtatConflits }) {
  const t = useTranslations("repriseUnClient.depot");
  if (client.mode === "connu") return <span className="text-si-verified">{t("dejaAuCabinet")}</span>;
  const etat =
    conflits.phase === "verification"
      ? <span className="text-si-muted">{t("conflitsEnCours")}</span>
      : conflits.phase === "fait" && conflits.nombre === 0
        ? <span className="text-si-verified">{t("aucunConflit")}</span>
        : conflits.phase === "fait"
          ? <span className="text-si-amber-ink">{t("conflitsTrouves", { n: conflits.nombre })}</span>
          : conflits.phase === "erreur"
            ? <span className="text-si-amber-ink">{t("conflitsErreur")}</span>
            : null;
  return (
    <>
      <span>{t("nouveauClient")}</span>
      {etat && <> · {etat}</>}
    </>
  );
}

/* ── Le choix du mandat, pour un client connu ─────────────────────────────── */

export function ChoixMandat({
  mandats,
  valeur,
  onChange,
  tauxDefaut,
  avocats,
}: {
  mandats: MandatConnu[];
  valeur: MandatChoisi | null;
  onChange: (m: MandatChoisi) => void;
  tauxDefaut: number | null;
  avocats: { id: string; nom: string }[];
}) {
  const t = useTranslations("repriseUnClient.depot");
  const nouveau = valeur?.mode === "nouveau" ? valeur : null;
  return (
    <div className="mt-3">
      <Champ libelle={t("rangerDans")} className="max-w-[460px]">
        <select
          className={champ}
          value={valeur?.mode === "existant" ? valeur.id : valeur?.mode === "nouveau" ? "__nouveau" : ""}
          onChange={(e) => {
            const id = e.target.value;
            if (id === "__nouveau") {
              onChange({
                mode: "nouveau",
                intitule: "",
                taux: tauxDefaut !== null ? String(tauxDefaut).replace(".", ",") : "",
                avocatId: avocats.length === 1 ? avocats[0].id : "",
              });
              return;
            }
            const m = mandats.find((x) => x.id === id);
            if (m) onChange({ mode: "existant", id: m.id, intitule: m.intitule, taux: m.tauxHoraire });
          }}
        >
          <option value="" disabled>
            —
          </option>
          {mandats.map((m) => (
            <option key={m.id} value={m.id}>{m.intitule}</option>
          ))}
          <option value="__nouveau">{t("unNouveauMandat")}</option>
        </select>
      </Champ>
      {nouveau && <ChampsNouveauMandat mandat={nouveau} onChange={onChange} avocats={avocats} />}
    </div>
  );
}

export function ChampsNouveauMandat({
  mandat,
  onChange,
  avocats,
}: {
  mandat: Extract<MandatChoisi, { mode: "nouveau" }>;
  onChange: (m: MandatChoisi) => void;
  avocats: { id: string; nom: string }[];
}) {
  const t = useTranslations("repriseUnClient.depot");
  // Un cabinet d'un seul avocat n'a pas à le désigner : SAFE le fait (v4).
  const plusieurs = avocats.length > 1;
  return (
    <div className={`mt-4 grid gap-4 ${plusieurs ? "sm:grid-cols-[2fr_1fr_1.4fr]" : "sm:grid-cols-[2fr_1fr]"}`}>
      <Champ libelle={t("mandat")}>
        <input className={champ} value={mandat.intitule} onChange={(e) => onChange({ ...mandat, intitule: e.target.value })} />
      </Champ>
      <Champ libelle={t("taux")}>
        <input inputMode="decimal" className={`${champ} text-right`} value={mandat.taux} onChange={(e) => onChange({ ...mandat, taux: e.target.value })} />
      </Champ>
      {plusieurs && (
        <Champ libelle={t("avocat")}>
          <select className={champ} value={mandat.avocatId} onChange={(e) => onChange({ ...mandat, avocatId: e.target.value })}>
            <option value="">{t("aucunAvocat")}</option>
            {avocats.map((a) => (
              <option key={a.id} value={a.id}>{a.nom}</option>
            ))}
          </select>
        </Champ>
      )}
    </div>
  );
}

/* ── L'écran du nouveau client ────────────────────────────────────────────── */

export function EcranNouveauClient({
  client,
  onClient,
  conflits,
  declaration,
  onDeclaration,
  mandat,
  onMandat,
  avocats,
  onCestLui,
  alertes,
}: {
  client: Extract<ClientChoisi, { mode: "nouveau" }>;
  onClient: (c: Extract<ClientChoisi, { mode: "nouveau" }>) => void;
  conflits: EtatConflits;
  declaration: boolean;
  onDeclaration: (v: boolean) => void;
  mandat: Extract<MandatChoisi, { mode: "nouveau" }>;
  onMandat: (m: MandatChoisi) => void;
  avocats: { id: string; nom: string }[];
  onCestLui: (id: string) => void;
  alertes: React.ReactNode;
}) {
  const t = useTranslations("repriseUnClient.depot");
  const [nomEnEdition, setNomEnEdition] = useState(!client.nom);
  const [visibles, setVisibles] = useState<Set<keyof CoordonneesSaisies>>(
    () => new Set((["adresse", "telephone", "courriel"] as const).filter((k) => client.coordonnees[k])),
  );
  const majCoord = (k: keyof CoordonneesSaisies, v: string) =>
    onClient({ ...client, coordonnees: { ...client.coordonnees, [k]: v } });

  const libelles = { adresse: t("adresse"), telephone: t("telephone"), courriel: t("courriel") };
  const ajouts = { adresse: t("ajouterAdresse"), telephone: t("ajouterTelephone"), courriel: t("ajouterCourriel") };
  const manquants = (["adresse", "telephone", "courriel"] as const).filter((k) => !visibles.has(k));

  return (
    <>
      <Section premiere>
        {nomEnEdition ? (
          <div className="flex max-w-[520px] items-end gap-3">
            <Champ libelle={t("nomClient")} className="flex-1">
              <input
                autoFocus
                className={champ}
                value={client.nom}
                onChange={(e) => onClient({ ...client, nom: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && client.nom.trim() && setNomEnEdition(false)}
              />
            </Champ>
            <Lien className="mb-2" disabled={!client.nom.trim()} onClick={() => setNomEnEdition(false)}>
              {t("valider")}
            </Lien>
          </div>
        ) : (
          <h2 className={titre}>{client.nom}</h2>
        )}
        <p className="mt-1 text-si-muted">
          <EtatClient client={client} conflits={conflits} />
          {!nomEnEdition && (
            <>
              {" · "}
              <Lien onClick={() => setNomEnEdition(true)}>{t("corrigerNom")}</Lien>
            </>
          )}
        </p>
        {client.proches.map((p) => (
          <Alerte key={p.id}>
            {t("proche", { nom: p.nom })} <Lien className="ml-2" onClick={() => onCestLui(p.id)}>{t("cestLui")}</Lien>
          </Alerte>
        ))}
        {alertes}

        {visibles.size > 0 && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {(["adresse", "telephone", "courriel"] as const)
              .filter((k) => visibles.has(k))
              .map((k) => (
                <Champ key={k} libelle={libelles[k]} className={k === "adresse" ? "sm:col-span-2" : ""}>
                  <input
                    type={k === "courriel" ? "email" : k === "telephone" ? "tel" : "text"}
                    className={champ}
                    value={client.coordonnees[k]}
                    onChange={(e) => majCoord(k, e.target.value)}
                  />
                </Champ>
              ))}
          </div>
        )}
        {manquants.length > 0 && (
          <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
            {manquants.map((k) => (
              <Lien key={k} onClick={() => setVisibles((v) => new Set(v).add(k))}>{ajouts[k]}</Lien>
            ))}
          </p>
        )}
        <label className="mt-4 flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            className="mt-[3px] h-4 w-4 accent-[var(--si-ink)]"
            checked={declaration}
            onChange={(e) => onDeclaration(e.target.checked)}
          />
          <span>{t("declaration")}</span>
        </label>
      </Section>

      <Section>
        <ChampsNouveauMandat mandat={mandat} onChange={onMandat} avocats={avocats} />
      </Section>
    </>
  );
}
