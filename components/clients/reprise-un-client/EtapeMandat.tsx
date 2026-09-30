"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Bloc, Carte, Champ, champClass, EnTeteCarte, Pastille, Segment, nouvelId } from "./pieces";
import type { ChoixClient, ChoixMandat, ContexteRepriseUnClient, MandatSaisi, SectionsSaisies } from "./types";

export function mandatVide(tauxDefaut: number | null): MandatSaisi {
  return {
    intitule: "",
    objetDuMandat: "",
    tauxHoraire: tauxDefaut !== null ? String(tauxDefaut).replace(".", ",") : "",
    enCours: true,
    dateOuverture: "",
    avocatResponsableId: "",
  };
}

export function sectionsVides(): SectionsSaisies {
  return {
    identite: { etat: "A_FAIRE", pieceVue: "", ouConservee: "", faiteLe: "", motifExemption: "" },
    fonds: { montant: "", arreteAu: "", recuATitreDe: "" },
    echeances: [],
    parties: [],
  };
}

interface Props {
  contexte: ContexteRepriseUnClient;
  client: ChoixClient;
  choix: ChoixMandat | null;
  onChoix: (c: ChoixMandat) => void;
  sections: SectionsSaisies;
  onSections: (s: SectionsSaisies) => void;
}

function Replie({
  lettre,
  titre,
  aide,
  etat,
  etatAttention = false,
  ouvert,
  onBascule,
  inactif,
  children,
  libelleOuvrir,
  libelleFermer,
}: {
  lettre: string;
  titre: string;
  aide: string;
  etat: string;
  etatAttention?: boolean;
  ouvert: boolean;
  onBascule: () => void;
  inactif?: boolean;
  children?: ReactNode;
  libelleOuvrir: string;
  libelleFermer: string;
}) {
  return (
    <div className="border-t border-si-line2">
      <div className="grid grid-cols-[26px_1fr_auto_auto] items-center gap-2.5 px-5 py-3">
        <span className="font-mono text-[12px] text-si-subtle">{lettre}</span>
        <div>
          <div className="text-[13px] font-medium text-si-ink">{titre}</div>
          <div className="text-[12px] text-si-muted">{aide}</div>
        </div>
        <span className={`text-[12px] ${etatAttention ? "text-si-amber-ink" : "text-si-muted"}`}>{etat}</span>
        {!inactif && (
          <button type="button" onClick={onBascule} aria-expanded={ouvert} className="text-[12px] text-si-muted underline underline-offset-2 hover:text-si-ink">
            {ouvert ? libelleFermer : libelleOuvrir}
          </button>
        )}
      </div>
      {ouvert && !inactif && <div className="px-5 pb-4 pl-[56px]">{children}</div>}
    </div>
  );
}

export function EtapeMandat({ contexte, client, choix, onChoix, sections, onSections }: Props) {
  const t = useTranslations("repriseUnClient.mandat");
  const [ouverts, setOuverts] = useState<Record<string, boolean>>({});
  const bascule = (cle: string) => setOuverts((o) => ({ ...o, [cle]: !o[cle] }));

  const mandatsExistants =
    client.mode === "existant" ? contexte.clients.find((c) => c.id === client.id)?.mandats ?? [] : [];

  const nouveau = choix?.mode === "nouveau" ? choix.mandat : null;
  const maj = (patch: Partial<MandatSaisi>) => {
    if (choix?.mode !== "nouveau") return;
    onChoix({ mode: "nouveau", mandat: { ...choix.mandat, ...patch } });
  };
  const creerNouveau = () => onChoix({ mode: "nouveau", mandat: mandatVide(contexte.tauxDefaut) });

  const s = sections;
  const majSections = (patch: Partial<SectionsSaisies>) => onSections({ ...s, ...patch });

  const etatIdentite =
    s.identite.etat === "VERIFIEE" ? t("identiteVerifiee") : s.identite.etat === "EXEMPTEE" ? t("identiteExemptee") : t("identiteNonVerifiee");

  return (
    <Carte>
      <EnTeteCarte titre={t("titre")} aide={t("aide")} />

      <div className="px-5 pb-5">
        {client.mode === "nouveau" ? (
          <p className="rounded-lg border border-dashed border-si-line bg-si-canvas px-3 py-2.5 text-[13px] text-si-muted">
            {t("aucunPourNouveau")}
          </p>
        ) : (
          <div className="overflow-hidden rounded-[10px] border border-si-line">
            <div className="border-b border-si-line2 px-3.5 py-2 text-[12px] text-si-muted">{t("existants")}</div>
            {mandatsExistants.map((m) => {
              const actif = choix?.mode === "existant" && choix.id === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onChoix({ mode: "existant", id: m.id, intitule: m.intitule, tauxHoraire: m.tauxHoraire })}
                  className={`grid w-full grid-cols-[1fr_auto] items-center gap-3 border-t border-si-line2 px-3.5 py-2.5 text-left first:border-t-0 ${
                    actif ? "bg-si-canvas shadow-[inset_2px_0_0_var(--si-ink)]" : "hover:bg-si-canvas"
                  }`}
                >
                  <span>
                    <span className="block text-[13px] font-medium text-si-ink">{m.intitule}</span>
                    <span className="block text-[12px] text-si-muted">
                      {m.enCours ? t("enCours") : t("termine")}
                      {m.tauxHoraire !== null ? ` · ${String(m.tauxHoraire).replace(".", ",")} $/h` : ""}
                    </span>
                  </span>
                  {actif ? <Pastille ton="cours">{t("choisirCelui")}</Pastille> : <span className="text-[12px] text-si-muted underline underline-offset-2">{t("choisirCelui")}</span>}
                </button>
              );
            })}
            <button
              type="button"
              onClick={creerNouveau}
              className={`w-full border-t border-si-line2 px-3.5 py-2.5 text-left text-[13px] ${
                nouveau ? "bg-si-canvas font-medium text-si-ink shadow-[inset_2px_0_0_var(--si-ink)]" : "text-si-ink hover:bg-si-canvas"
              }`}
            >
              <span className="font-normal text-si-muted">+ </span>
              {t("creerUnAutre")}
            </button>
          </div>
        )}
      </div>

      {nouveau && (
        <div className="border-t border-si-line px-5 pb-5 pt-[18px]">
          <Bloc lettre="A" titre={t("nouveauMandat")} dernier>
            <div className="mt-2.5 flex flex-wrap gap-2.5">
              <Champ libelle={t("intitule")} className="min-w-[260px] flex-1">
                <input className={champClass} value={nouveau.intitule} onChange={(e) => maj({ intitule: e.target.value })} autoFocus />
              </Champ>
              <Champ libelle={t("dateOuverture")} className="w-[190px]">
                <input type="date" className={`${champClass} font-mono`} value={nouveau.dateOuverture} onChange={(e) => maj({ dateOuverture: e.target.value })} />
              </Champ>
            </div>
            <div className="mt-2.5">
              <Champ libelle={t("objet")}>
                <input className={champClass} value={nouveau.objetDuMandat} onChange={(e) => maj({ objetDuMandat: e.target.value })} />
              </Champ>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-2.5">
              <Champ libelle={t("taux")} className="w-[180px]">
                <input inputMode="decimal" className={`${champClass} text-right font-mono tabular-nums`} value={nouveau.tauxHoraire} onChange={(e) => maj({ tauxHoraire: e.target.value })} placeholder="0,00" />
              </Champ>
              <Champ libelle={t("avocat")} className="min-w-[240px] flex-1">
                <select className={champClass} value={nouveau.avocatResponsableId} onChange={(e) => maj({ avocatResponsableId: e.target.value })}>
                  <option value="">{t("aucunAvocat")}</option>
                  {contexte.avocats.map((a) => (
                    <option key={a.id} value={a.id}>{a.nom}</option>
                  ))}
                </select>
              </Champ>
            </div>
            <div className="mt-3 text-[12px] text-si-muted">{t("encoreEnCours")}</div>
            <div className="mt-1.5">
              <Segment
                etiquette={t("encoreEnCours")}
                valeur={nouveau.enCours ? "oui" : "non"}
                onChange={(v) => maj({ enCours: v === "oui" })}
                options={[
                  { cle: "oui", libelle: t("enCours") },
                  { cle: "non", libelle: t("termine") },
                ]}
              />
            </div>
            <p className="mt-2 text-[12px] text-si-muted">{t("tauxAide")}</p>
          </Bloc>
        </div>
      )}

      {nouveau && (
        <>
          <div className="flex items-baseline gap-2.5 border-t border-si-line px-5 pb-2 pt-3.5">
            <h3 className="text-[14px] font-medium text-si-ink">{t("siApplicable")}</h3>
            <p className="text-[12px] text-si-muted">{t("siApplicableAide")}</p>
          </div>

          <Replie
            lettre="B"
            titre={t("identite")}
            aide={t("identiteAide")}
            etat={client.mode === "existant" ? t("identiteGereeFiche") : etatIdentite}
            etatAttention={client.mode === "nouveau" && s.identite.etat === "A_FAIRE"}
            inactif={client.mode === "existant"}
            ouvert={Boolean(ouverts.identite)}
            onBascule={() => bascule("identite")}
            libelleOuvrir={t("ouvrir")}
            libelleFermer={t("fermer")}
          >
            <Segment
              etiquette={t("identiteEtat")}
              valeur={s.identite.etat}
              onChange={(v) => majSections({ identite: { ...s.identite, etat: v } })}
              options={[
                { cle: "A_FAIRE", libelle: t("identiteAFaire") },
                { cle: "VERIFIEE", libelle: t("identiteVerifieeOpt") },
                { cle: "EXEMPTEE", libelle: t("identiteExempteeOpt") },
              ]}
            />
            {s.identite.etat === "VERIFIEE" && (
              <div className="mt-2.5 flex flex-wrap gap-2.5">
                <Champ libelle={t("identitePiece")} className="min-w-[180px] flex-1">
                  <input className={champClass} value={s.identite.pieceVue} onChange={(e) => majSections({ identite: { ...s.identite, pieceVue: e.target.value } })} />
                </Champ>
                <Champ libelle={t("identiteOu")} className="min-w-[180px] flex-1">
                  <input className={champClass} value={s.identite.ouConservee} onChange={(e) => majSections({ identite: { ...s.identite, ouConservee: e.target.value } })} />
                </Champ>
                <Champ libelle={t("identiteLe")} className="w-[170px]">
                  <input type="date" className={`${champClass} font-mono`} value={s.identite.faiteLe} onChange={(e) => majSections({ identite: { ...s.identite, faiteLe: e.target.value } })} />
                </Champ>
              </div>
            )}
            {s.identite.etat === "EXEMPTEE" && (
              <div className="mt-2.5">
                <Champ libelle={t("identiteMotif")}>
                  <input className={champClass} value={s.identite.motifExemption} onChange={(e) => majSections({ identite: { ...s.identite, motifExemption: e.target.value } })} />
                </Champ>
              </div>
            )}
          </Replie>

          <Replie
            lettre="C"
            titre={t("fonds")}
            aide={t("fondsAide")}
            etat={s.fonds.montant ? `${s.fonds.montant} $` : t("fondsAucun")}
            ouvert={Boolean(ouverts.fonds)}
            onBascule={() => bascule("fonds")}
            libelleOuvrir={t("ouvrir")}
            libelleFermer={t("fermer")}
          >
            <div className="flex flex-wrap gap-2.5">
              <Champ libelle={t("fondsMontant")} className="w-[160px]">
                <input inputMode="decimal" className={`${champClass} text-right font-mono tabular-nums`} value={s.fonds.montant} onChange={(e) => majSections({ fonds: { ...s.fonds, montant: e.target.value } })} />
              </Champ>
              <Champ libelle={t("fondsAu")} className="w-[180px]">
                <input type="date" className={`${champClass} font-mono`} value={s.fonds.arreteAu} onChange={(e) => majSections({ fonds: { ...s.fonds, arreteAu: e.target.value } })} />
              </Champ>
              <Champ libelle={t("fondsTitre")} className="min-w-[200px] flex-1">
                <input className={champClass} value={s.fonds.recuATitreDe} onChange={(e) => majSections({ fonds: { ...s.fonds, recuATitreDe: e.target.value } })} />
              </Champ>
            </div>
          </Replie>

          <Replie
            lettre="D"
            titre={t("dates")}
            aide={t("datesAide")}
            etat={s.echeances.length ? String(s.echeances.length) : t("datesAucune")}
            ouvert={Boolean(ouverts.dates)}
            onBascule={() => bascule("dates")}
            libelleOuvrir={t("ouvrir")}
            libelleFermer={t("fermer")}
          >
            {s.echeances.map((e, i) => (
              <div key={e.id} className="mb-2 flex items-end gap-2.5">
                <Champ libelle={t("dateLibelle")} className="flex-1">
                  <input className={champClass} value={e.libelle} onChange={(ev) => majSections({ echeances: s.echeances.map((x, j) => (j === i ? { ...x, libelle: ev.target.value } : x)) })} />
                </Champ>
                <Champ libelle={t("dateLe")} className="w-[170px]">
                  <input type="date" className={`${champClass} font-mono`} value={e.date} onChange={(ev) => majSections({ echeances: s.echeances.map((x, j) => (j === i ? { ...x, date: ev.target.value } : x)) })} />
                </Champ>
                <button type="button" aria-label={t("retirer")} onClick={() => majSections({ echeances: s.echeances.filter((_, j) => j !== i) })} className="mb-2 text-si-muted hover:text-si-ink">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => majSections({ echeances: [...s.echeances, { id: nouvelId(), date: "", libelle: "" }] })} className="text-[12px] text-si-muted underline underline-offset-2 hover:text-si-ink">
              {t("ajouterDate")}
            </button>
          </Replie>

          <Replie
            lettre="E"
            titre={t("parties")}
            aide={t("partiesAide")}
            etat={s.parties.length ? String(s.parties.length) : t("partiesAucune")}
            ouvert={Boolean(ouverts.parties)}
            onBascule={() => bascule("parties")}
            libelleOuvrir={t("ouvrir")}
            libelleFermer={t("fermer")}
          >
            {s.parties.map((p, i) => (
              <div key={p.id} className="mb-2 flex items-end gap-2.5">
                <Champ libelle={t("partieNom")} className="flex-1">
                  <input className={champClass} value={p.nomAffiche} onChange={(ev) => majSections({ parties: s.parties.map((x, j) => (j === i ? { ...x, nomAffiche: ev.target.value } : x)) })} />
                </Champ>
                <Champ libelle={t("partieRole")} className="w-[180px]">
                  <select className={champClass} value={p.role} onChange={(ev) => majSections({ parties: s.parties.map((x, j) => (j === i ? { ...x, role: ev.target.value as "partie_adverse" | "tiers" } : x)) })}>
                    <option value="partie_adverse">{t("partieAdverse")}</option>
                    <option value="tiers">{t("partieTiers")}</option>
                  </select>
                </Champ>
                <button type="button" aria-label={t("retirer")} onClick={() => majSections({ parties: s.parties.filter((_, j) => j !== i) })} className="mb-2 text-si-muted hover:text-si-ink">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button type="button" onClick={() => majSections({ parties: [...s.parties, { id: nouvelId(), nomAffiche: "", role: "partie_adverse" }] })} className="text-[12px] text-si-muted underline underline-offset-2 hover:text-si-ink">
              {t("ajouterPartie")}
            </button>
          </Replie>
          <div className="h-2" />
        </>
      )}
    </Carte>
  );
}
