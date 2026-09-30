"use client";

import { useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cleCroisement } from "@/lib/clients/croisement-conflits";
import {
  calculer,
  controler,
  lireNombre,
  montantLigne,
  resteDu,
  MODES_PAIEMENT,
  type ChampTaxe,
  type FactureSaisie,
  type LigneSaisie,
  type ModePaiementSaisie,
  type NatureSaisie,
} from "@/lib/services/reprise-un-client/saisie";
import { Bloc, Carte, Champ, champClass, champRepris, EnTeteCarte, Message, Pastille, Segment, nouvelId } from "./pieces";
import type { EntreeFacture } from "./types";

export function ligneVide(tauxMandat: number | null): LigneSaisie {
  return {
    id: nouvelId(),
    date: "",
    description: "",
    nature: "horaire",
    heures: "",
    taux: tauxMandat !== null ? String(tauxMandat).replace(".", ",") : "",
    montant: "",
  };
}

export function factureVide(nbTaxes: number, tauxMandat: number | null): FactureSaisie {
  return {
    numero: "",
    dateEmission: "",
    lignes: [ligneVide(tauxMandat)],
    taxes: Array.from({ length: nbTaxes }, () => ""),
    total: "",
    statutPaiement: null,
    datePaiement: "",
    montantRecu: "",
    modePaiement: null,
  };
}

/** Les champs repris à la main par-dessus la lecture, pour l'ambre et pour le journal d'audit. */
export function champsCorriges(e: EntreeFacture): string[] {
  if (!e.lu) return [];
  const lu = e.lu;
  const s = e.saisie;
  const diff: string[] = [];
  if (s.numero !== lu.numero) diff.push("numero");
  if (s.dateEmission !== lu.dateEmission) diff.push("dateEmission");
  if (s.total !== lu.total) diff.push("total");
  s.taxes.forEach((v, i) => v !== (lu.taxes[i] ?? "") && diff.push(`taxe${i + 1}`));
  s.lignes.forEach((l, i) => {
    const o = lu.lignes.find((x) => x.id === l.id);
    if (!o) return diff.push(`ligne${i + 1}`);
    (["date", "description", "nature", "heures", "taux", "montant"] as const).forEach((k) => {
      if (l[k] !== o[k]) diff.push(`ligne${i + 1}.${k}`);
    });
  });
  return diff;
}

function repris(e: EntreeFacture, cle: string): boolean {
  return Boolean(e.lu) && champsCorriges(e).includes(cle);
}

interface Props {
  champsTaxe: ChampTaxe[];
  tauxMandat: number | null;
  clientNom: string;
  entrees: EntreeFacture[];
  ouverteId: string | null;
  onOuvrir: (id: string) => void;
  onSaisie: (id: string, saisie: FactureSaisie) => void;
  onDeposer: (fichiers: File[]) => void;
  onTaper: () => void;
}

export function EtapeFactures({ champsTaxe, tauxMandat, clientNom, entrees, ouverteId, onOuvrir, onSaisie, onDeposer, onTaper }: Props) {
  const t = useTranslations("repriseUnClient.factures");
  const locale = useLocale();
  const devise = new Intl.NumberFormat(locale === "en" ? "en-CA" : "fr-CA", { style: "currency", currency: "CAD" });
  const nombre = new Intl.NumberFormat(locale === "en" ? "en-CA" : "fr-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const inputFichiers = useRef<HTMLInputElement>(null);

  const ouverte = entrees.find((e) => e.id === ouverteId) ?? null;

  return (
    <Carte>
      <EnTeteCarte
        titre={t("titre")}
        aide={entrees.length === 0 ? t("aideVide") : t("aide", { n: entrees.length })}
        actions={
          <>
            <input
              ref={inputFichiers}
              type="file"
              multiple
              accept="application/pdf,image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const fichiers = Array.from(e.target.files ?? []);
                if (fichiers.length) onDeposer(fichiers);
                e.target.value = "";
              }}
            />
            <Button variant="secondary" onClick={() => inputFichiers.current?.click()}>
              <Upload className="mr-1.5 inline-block h-4 w-4" aria-hidden />
              {t("deposer")}
            </Button>
            <Button variant="secondary" onClick={onTaper}>
              {t("taper")}
            </Button>
          </>
        }
      />

      {entrees.map((e) => {
        const c = calculer(e.saisie, champsTaxe);
        const actif = e.id === ouverteId;
        const pastille =
          e.statut === "enregistree" ? <Pastille ton="ok">{t("enregistree")}</Pastille>
          : e.statut === "lecture" ? <Pastille ton="neutre">{t("lecture")}</Pastille>
          : e.statut === "deja_reprise" ? <Pastille ton="neutre">{t("dejaReprise")}</Pastille>
          : e.erreur ? <Pastille ton="attention">{t("echec")}</Pastille>
          : actif ? <Pastille ton="cours">{t("enCours")}</Pastille>
          : <Pastille ton="attention">{t("aVerifier")}</Pastille>;
        const cliquable = e.statut === "a_verifier" && !actif;
        return (
          <div
            key={e.id}
            className={`grid grid-cols-[20px_1fr_auto_auto] items-center gap-3 border-t border-si-line2 px-5 py-2.5 text-[13px] ${
              actif ? "bg-si-canvas shadow-[inset_2px_0_0_var(--si-ink)]" : ""
            }`}
          >
            <span className={e.statut === "enregistree" ? "text-si-verified" : "text-si-ink"} aria-hidden>
              {e.statut === "enregistree" ? <Check className="h-4 w-4" /> : actif ? "●" : "○"}
            </span>
            <div className="min-w-0">
              <div className="truncate font-medium text-si-ink">{e.saisie.numero || e.fichierNom || t("sansNumero")}</div>
              <div className="truncate text-[12px] text-si-muted">
                {e.statut === "deja_reprise"
                  ? t("dejaRepriseAide", { date: e.dejaRepriseLe ?? "" })
                  : `${e.saisie.dateEmission || t("dateInconnue")} · ${t("lignes", { n: e.saisie.lignes.length })} · ${e.source === "pdf" ? t("luePdf") : t("saisieMain")}`}
              </div>
            </div>
            <span className="text-right font-mono tabular-nums text-si-ink">{c.total !== null && e.statut !== "deja_reprise" ? devise.format(c.total) : ""}</span>
            <span className="flex items-center justify-end gap-2">
              {cliquable && (
                <button type="button" onClick={() => onOuvrir(e.id)} className="text-[12px] text-si-muted underline underline-offset-2 hover:text-si-ink">
                  {t("ouvrir")}
                </button>
              )}
              {pastille}
            </span>
          </div>
        );
      })}

      {ouverte && ouverte.statut === "a_verifier" && (
        <Formulaire
          entree={ouverte}
          champsTaxe={champsTaxe}
          tauxMandat={tauxMandat}
          clientNom={clientNom}
          onSaisie={(s) => onSaisie(ouverte.id, s)}
          devise={devise}
          nombre={nombre}
        />
      )}
    </Carte>
  );
}

function Formulaire({
  entree,
  champsTaxe,
  tauxMandat,
  clientNom,
  onSaisie,
  devise,
  nombre,
}: {
  entree: EntreeFacture;
  champsTaxe: ChampTaxe[];
  tauxMandat: number | null;
  clientNom: string;
  onSaisie: (s: FactureSaisie) => void;
  devise: Intl.NumberFormat;
  nombre: Intl.NumberFormat;
}) {
  const t = useTranslations("repriseUnClient.factures");
  const locale = useLocale();
  const s = entree.saisie;
  const c = calculer(s, champsTaxe);
  const controle = controler(s, champsTaxe);
  const reste = resteDu(s, c.total);
  const maj = (patch: Partial<FactureSaisie>) => onSaisie({ ...s, ...patch });
  const majLigne = (id: string, patch: Partial<LigneSaisie>) =>
    maj({ lignes: s.lignes.map((l) => (l.id === id ? { ...l, ...patch } : l)) });

  const adresseeAilleurs =
    entree.clientLu && cleCroisement(entree.clientLu) !== cleCroisement(clientNom) ? entree.clientLu : null;

  const natures: { cle: NatureSaisie; libelle: string }[] = [
    { cle: "horaire", libelle: t("horaire") },
    { cle: "forfait", libelle: t("forfait") },
    { cle: "debours", libelle: t("debours") },
  ];

  const changerNature = (l: LigneSaisie, nature: NatureSaisie) => {
    if (nature === l.nature) return;
    if (nature === "horaire") {
      majLigne(l.id, { nature, montant: "", taux: l.taux || (tauxMandat !== null ? String(tauxMandat).replace(".", ",") : "") });
    } else {
      // Passer d'horaire à un montant fixe garde le montant déjà calculé.
      const m = l.nature === "horaire" ? montantLigne(l) : lireNombre(l.montant);
      majLigne(l.id, { nature, heures: "", taux: "", montant: m !== null ? String(m).replace(".", ",") : l.montant });
    }
  };

  const cls = (cle: string, base: string) => `${base} ${repris(entree, cle) ? champRepris : ""}`;

  return (
    <div className="border-t border-si-line px-5 pb-5 pt-[18px]">
      {entree.lectureEchouee && <Message ton="attention">{entree.raisonLecture || t("lectureMuette")}</Message>}
      {adresseeAilleurs && <Message ton="attention">{t("adresseeAilleurs", { lu: adresseeAilleurs, choisi: clientNom })}</Message>}
      {entree.erreur && <Message ton="erreur">{entree.erreur}</Message>}
      {(entree.lectureEchouee || adresseeAilleurs || entree.erreur) && <div className="h-4" />}

      <Bloc lettre="A" titre={t("blocFacture")}>
        <div className="mt-2.5 flex flex-wrap gap-2.5">
          <Champ libelle={t("numero")} className="w-[180px]">
            <input className={cls("numero", `${champClass} font-mono`)} value={s.numero} onChange={(e) => maj({ numero: e.target.value })} />
          </Champ>
          <Champ libelle={t("dateEmission")} className="w-[180px]">
            <input type="date" className={cls("dateEmission", `${champClass} font-mono`)} value={s.dateEmission} onChange={(e) => maj({ dateEmission: e.target.value })} />
          </Champ>
          <Champ libelle={t("fichier")} className="min-w-[220px] flex-1">
            <div className={`${champClass} flex items-center text-si-muted`}>
              {entree.source === "pdf" ? t("fichierConserve", { nom: entree.fichierNom }) : t("sansPiece")}
            </div>
          </Champ>
        </div>
      </Bloc>

      <Bloc
        lettre="B"
        titre={t("blocDetail")}
        aide={t.rich("detailAide", { b: (chunks) => <b className="font-medium text-si-body">{chunks}</b> })}
      >
        <div className="mt-2.5 overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-[13px]">
            <thead>
              <tr className="text-[12px] text-si-muted">
                <th className="w-[136px] px-1 pb-1.5 text-left font-medium">{t("colDate")}</th>
                <th className="px-1 pb-1.5 text-left font-medium">{t("colDescription")}</th>
                <th className="w-[68px] px-1 pb-1.5 text-right font-medium">{t("colHeures")}</th>
                <th className="w-[84px] px-1 pb-1.5 text-right font-medium">{t("colTaux")}</th>
                <th className="w-[104px] px-1 pb-1.5 text-right font-medium">{t("colMontant")}</th>
                <th className="w-[232px] px-1 pb-1.5 text-left font-medium">{t("colNature")}</th>
                <th className="w-[28px]" />
              </tr>
            </thead>
            <tbody>
              {s.lignes.map((l, i) => {
                const k = `ligne${i + 1}`;
                const calcule = l.nature === "horaire" ? montantLigne(l) : null;
                return (
                  <tr key={l.id}>
                    <td className="p-1">
                      <input type="date" className={cls(`${k}.date`, `${champClass} h-8 font-mono`)} value={l.date} onChange={(e) => majLigne(l.id, { date: e.target.value })} />
                    </td>
                    <td className="p-1">
                      <input className={cls(`${k}.description`, `${champClass} h-8`)} value={l.description} onChange={(e) => majLigne(l.id, { description: e.target.value })} />
                    </td>
                    <td className="p-1">
                      <input
                        inputMode="decimal"
                        disabled={l.nature !== "horaire"}
                        placeholder={l.nature !== "horaire" ? "—" : ""}
                        className={cls(`${k}.heures`, `${champClass} h-8 text-right font-mono tabular-nums`)}
                        value={l.heures}
                        onChange={(e) => majLigne(l.id, { heures: e.target.value })}
                      />
                    </td>
                    <td className="p-1">
                      <input
                        inputMode="decimal"
                        disabled={l.nature !== "horaire"}
                        placeholder={l.nature !== "horaire" ? "—" : ""}
                        className={cls(`${k}.taux`, `${champClass} h-8 text-right font-mono tabular-nums`)}
                        value={l.taux}
                        onChange={(e) => majLigne(l.id, { taux: e.target.value })}
                      />
                    </td>
                    <td className="p-1">
                      {l.nature === "horaire" ? (
                        <div className={`${champClass} flex h-8 items-center justify-end font-mono tabular-nums`} aria-label={t("colMontant")}>
                          {calcule !== null ? nombre.format(calcule) : ""}
                        </div>
                      ) : (
                        <input
                          inputMode="decimal"
                          className={cls(`${k}.montant`, `${champClass} h-8 text-right font-mono tabular-nums`)}
                          value={l.montant}
                          onChange={(e) => majLigne(l.id, { montant: e.target.value })}
                        />
                      )}
                    </td>
                    <td className="p-1">
                      <Segment taille="petite" etiquette={t("colNature")} valeur={l.nature} options={natures} onChange={(v) => changerNature(l, v)} />
                    </td>
                    <td className="p-1 text-center">
                      <button
                        type="button"
                        aria-label={t("retirerLigne", { n: i + 1 })}
                        onClick={() => maj({ lignes: s.lignes.filter((x) => x.id !== l.id) })}
                        className="text-si-subtle hover:text-si-ink"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <button type="button" onClick={() => maj({ lignes: [...s.lignes, ligneVide(tauxMandat)] })} className="mt-2 text-[12px] text-si-muted underline underline-offset-2 hover:text-si-ink">
          {t("ajouterLigne")}
        </button>

        <div className="ml-auto mt-3.5 w-full max-w-[340px] text-[13px]">
          <div className="flex items-center justify-between py-1.5 text-si-body">
            <span>{t("sousTotal")}</span>
            <span className="font-mono tabular-nums">{devise.format(c.sousTotal)}</span>
          </div>
          {champsTaxe.map((champ, i) => (
            <div key={champ.cle} className="flex items-center justify-between py-1 text-si-body">
              <span className="whitespace-nowrap">{t(`taxe.${champ.cle}`, { taux: String(champ.taux).replace(".", locale === "en" ? "." : ",") })}</span>
              <input
                inputMode="decimal"
                aria-label={t(`taxe.${champ.cle}`, { taux: String(champ.taux) })}
                className={cls(`taxe${i + 1}`, `${champClass} !w-[140px] h-8 shrink-0 text-right font-mono tabular-nums placeholder:text-si-ink`)}
                placeholder={nombre.format(c.taxesCalculees[i])}
                value={s.taxes[i] ?? ""}
                onChange={(e) => maj({ taxes: s.taxes.map((v, j) => (j === i ? e.target.value : v)) })}
              />
            </div>
          ))}
          <div className="mt-1 flex items-center justify-between border-t border-si-line pt-2.5 font-medium text-si-ink">
            <span className="whitespace-nowrap">{t("total")}</span>
            <input
              inputMode="decimal"
              aria-label={t("total")}
              className={cls("total", `${champClass} !w-[140px] h-8 shrink-0 text-right font-mono font-medium tabular-nums placeholder:text-si-ink`)}
              placeholder={nombre.format(c.totalCalcule)}
              value={s.total}
              onChange={(e) => maj({ total: e.target.value })}
            />
          </div>
          <p className="mt-1.5 text-right text-[12px] text-si-muted">{t("totalFoi")}</p>
        </div>
      </Bloc>

      <Bloc lettre="C" titre={t("blocPaiement")} aide={t("paiementAide")} dernier>
        <div className="mt-2.5">
          <Segment
            etiquette={t("blocPaiement")}
            valeur={s.statutPaiement}
            onChange={(v) => maj({ statutPaiement: v })}
            options={[
              { cle: "payee", libelle: t("payee") },
              { cle: "partielle", libelle: t("partielle") },
              { cle: "impayee", libelle: t("impayee") },
            ]}
          />
        </div>
        {s.statutPaiement && s.statutPaiement !== "impayee" && (
          <div className="mt-2.5 flex flex-wrap gap-2.5">
            <Champ libelle={s.statutPaiement === "payee" ? t("datePaiement") : t("dateReception")} className="w-[180px]">
              <input type="date" className={`${champClass} font-mono`} value={s.datePaiement} onChange={(e) => maj({ datePaiement: e.target.value })} />
            </Champ>
            {s.statutPaiement === "partielle" && (
              <Champ libelle={t("montantRecu")} className="w-[160px]">
                <input inputMode="decimal" className={`${champClass} text-right font-mono tabular-nums`} value={s.montantRecu} onChange={(e) => maj({ montantRecu: e.target.value })} />
              </Champ>
            )}
            <Champ libelle={t("mode")} className="w-[220px]">
              <select className={champClass} value={s.modePaiement ?? ""} onChange={(e) => maj({ modePaiement: (e.target.value || null) as ModePaiementSaisie | null })}>
                <option value="">{t("choisirMode")}</option>
                {MODES_PAIEMENT.map((m) => (
                  <option key={m} value={m}>{t(`modes.${m}`)}</option>
                ))}
              </select>
            </Champ>
          </div>
        )}
        {reste !== null && s.statutPaiement && (
          <p className="mt-2.5 text-[13px] text-si-body">
            {t("resteDu")} <span className="font-mono font-medium tabular-nums text-si-ink">{devise.format(reste)}</span>
          </p>
        )}

        {(controle.bloquants.length > 0 || controle.avertissements.length > 0) && (
          <ul className="mt-4 space-y-1.5 border-t border-si-line2 pt-3 text-[13px]">
            {controle.bloquants.map((b, i) => (
              <li key={`b${i}`} className="flex gap-2 text-si-danger-ink">
                <span aria-hidden>•</span>
                {t(`bloquants.${b.code}`, b.valeurs ?? {})}
              </li>
            ))}
            {controle.avertissements.map((a, i) => (
              <li key={`a${i}`} className="flex gap-2 text-si-amber-ink">
                <span aria-hidden>•</span>
                {a.code === "ECART_DETAIL"
                  ? t("avertissements.ECART_DETAIL", { ecart: devise.format(Number(a.valeurs?.ecart ?? 0)) })
                  : t(`avertissements.${a.code}`)}
              </li>
            ))}
          </ul>
        )}
      </Bloc>
    </div>
  );
}
