"use client";

import { useLocale, useTranslations } from "next-intl";
import { X } from "lucide-react";
import {
  calculer,
  lireNombre,
  montantLigne,
  MODES_PAIEMENT,
  type ChampTaxe,
  type FactureSaisie,
  type LigneSaisie,
  type ModePaiementSaisie,
  type NatureSaisie,
} from "@/lib/services/reprise-un-client/saisie";
import { champsCorriges, ligneVide } from "./facture-outils";
import { Champ, Choix, Lien, champ, champRepris } from "./ui";
import type { EntreeFacture } from "./types";

export function formats(locale: string) {
  const loc = locale === "en" ? "en-CA" : "fr-CA";
  return {
    devise: new Intl.NumberFormat(loc, { style: "currency", currency: "CAD" }),
    nombre: new Intl.NumberFormat(loc, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    jourCourt: (iso: string) =>
      new Intl.DateTimeFormat(loc, { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`)),
    jourLong: (iso: string) =>
      new Intl.DateTimeFormat(loc, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`)),
  };
}

/** L'en-tête d'une facture, avec ce qui est connu : « Facture F-2026-021 du 5 mars 2026 ». */
export function intituleFacture(t: (k: string, v?: Record<string, string>) => string, s: FactureSaisie, jourLong: (iso: string) => string): string {
  const numero = s.numero.trim();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(s.dateEmission) ? jourLong(s.dateEmission) : "";
  if (numero && date) return t("factureNumDate", { numero, date });
  if (numero) return t("factureNum", { numero });
  if (date) return t("factureDate", { date });
  return t("factureVierge");
}

/* ── Le relevé : la facture telle qu'imprimée, lue d'un coup d'œil ───────── */

export function Releve({ saisie, champsTaxe }: { saisie: FactureSaisie; champsTaxe: ChampTaxe[] }) {
  const t = useTranslations("repriseUnClient.depot");
  const tf = useTranslations("repriseUnClient.factures");
  const locale = useLocale();
  const f = formats(locale);
  const c = calculer(saisie, champsTaxe);
  const lignes = saisie.lignes.filter((l) => l.description.trim() || l.heures || l.montant);

  return (
    <>
      <table className="mt-3 w-full border-collapse">
        <tbody>
          {lignes.map((l, i) => {
            const m = montantLigne(l);
            return (
              <tr key={l.id} className={`border-b border-si-line2 ${i === 0 ? "border-t border-t-si-line" : ""}`}>
                <td className="w-[84px] py-2.5 pr-3 align-baseline text-si-ink">{/^\d{4}-\d{2}-\d{2}$/.test(l.date) ? f.jourCourt(l.date) : ""}</td>
                <td className="py-2.5 pr-3 align-baseline">
                  {l.description}
                  {l.nature !== "horaire" && <span className="ml-1.5 text-si-muted">{l.nature === "debours" ? t("debours") : t("forfait")}</span>}
                </td>
                <td className="w-[84px] py-2.5 pr-3 text-right align-baseline">
                  {l.nature === "horaire" && lireNombre(l.heures) !== null ? t("heures", { h: f.nombre.format(lireNombre(l.heures) as number) }) : ""}
                </td>
                <td className="w-[110px] py-2.5 text-right align-baseline">{m !== null ? f.nombre.format(m) : ""}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="ml-auto mt-2.5 w-full max-w-[280px]">
        {champsTaxe.map((ch, i) => (
          <div key={ch.cle} className="flex justify-between py-1">
            <span>{tf(`taxe.${ch.cle}`, { taux: String(ch.taux).replace(".", locale === "en" ? "." : ",") })}</span>
            <span>{f.nombre.format(c.taxes[i])}</span>
          </div>
        ))}
        <div className="mt-1 flex justify-between border-t border-si-line pt-2 font-medium">
          <span>{t("total")}</span>
          <span>{c.total !== null ? f.devise.format(c.total) : "—"}</span>
        </div>
      </div>
    </>
  );
}

/* ── La correction : les mêmes informations, modifiables ─────────────────── */

export function Correction({
  entree,
  champsTaxe,
  tauxMandat,
  onSaisie,
}: {
  entree: EntreeFacture;
  champsTaxe: ChampTaxe[];
  tauxMandat: number | null;
  onSaisie: (s: FactureSaisie) => void;
}) {
  const t = useTranslations("repriseUnClient.depot");
  const tf = useTranslations("repriseUnClient.factures");
  const locale = useLocale();
  const f = formats(locale);
  const s = entree.saisie;
  const c = calculer(s, champsTaxe);
  const corriges = new Set(champsCorriges(entree));
  const repris = (cle: string) => (entree.lu && corriges.has(cle) ? champRepris : "");

  const maj = (patch: Partial<FactureSaisie>) => onSaisie({ ...s, ...patch });
  const majLigne = (id: string, patch: Partial<LigneSaisie>) =>
    maj({ lignes: s.lignes.map((l) => (l.id === id ? { ...l, ...patch } : l)) });

  const changerNature = (l: LigneSaisie, nature: NatureSaisie) => {
    if (nature === l.nature) return;
    if (nature === "horaire") {
      majLigne(l.id, { nature, montant: "", taux: l.taux || (tauxMandat !== null ? String(tauxMandat).replace(".", ",") : "") });
    } else {
      const m = l.nature === "horaire" ? montantLigne(l) : lireNombre(l.montant);
      majLigne(l.id, { nature, heures: "", taux: "", montant: m !== null ? m.toFixed(2).replace(".", ",") : l.montant });
    }
  };

  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-4">
        <Champ libelle={tf("numero")} className="w-[180px]">
          <input className={`${champ} ${repris("numero")}`} value={s.numero} onChange={(e) => maj({ numero: e.target.value })} />
        </Champ>
        <Champ libelle={tf("dateEmission")} className="w-[180px]">
          <input type="date" className={`${champ} ${repris("dateEmission")}`} value={s.dateEmission} onChange={(e) => maj({ dateEmission: e.target.value })} />
        </Champ>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr className="text-left text-si-muted">
              <th className="w-[150px] pb-1.5 pr-2 font-normal">{tf("colDate")}</th>
              <th className="pb-1.5 pr-2 font-normal">{tf("colDescription")}</th>
              <th className="w-[124px] pb-1.5 pr-2 font-normal">{tf("colNature")}</th>
              <th className="w-[76px] pb-1.5 pr-2 text-right font-normal">{tf("colHeures")}</th>
              <th className="w-[88px] pb-1.5 pr-2 text-right font-normal">{tf("colTaux")}</th>
              <th className="w-[108px] pb-1.5 text-right font-normal">{tf("colMontant")}</th>
              <th className="w-[28px]" />
            </tr>
          </thead>
          <tbody>
            {s.lignes.map((l, i) => {
              const k = `ligne${i + 1}`;
              const calcule = l.nature === "horaire" ? montantLigne(l) : null;
              return (
                <tr key={l.id}>
                  <td className="py-1 pr-2">
                    <input type="date" className={`${champ} ${repris(`${k}.date`)}`} value={l.date} onChange={(e) => majLigne(l.id, { date: e.target.value })} />
                  </td>
                  <td className="py-1 pr-2">
                    <input className={`${champ} ${repris(`${k}.description`)}`} value={l.description} onChange={(e) => majLigne(l.id, { description: e.target.value })} />
                  </td>
                  <td className="py-1 pr-2">
                    <select
                      aria-label={tf("colNature")}
                      className={`${champ} ${repris(`${k}.nature`)}`}
                      value={l.nature}
                      onChange={(e) => changerNature(l, e.target.value as NatureSaisie)}
                    >
                      <option value="horaire">{tf("horaire")}</option>
                      <option value="forfait">{tf("forfait")}</option>
                      <option value="debours">{tf("debours")}</option>
                    </select>
                  </td>
                  <td className="py-1 pr-2">
                    <input
                      inputMode="decimal"
                      aria-label={tf("colHeures")}
                      disabled={l.nature !== "horaire"}
                      placeholder={l.nature !== "horaire" ? "—" : ""}
                      className={`${champ} text-right ${repris(`${k}.heures`)}`}
                      value={l.heures}
                      onChange={(e) => majLigne(l.id, { heures: e.target.value })}
                    />
                  </td>
                  <td className="py-1 pr-2">
                    <input
                      inputMode="decimal"
                      aria-label={tf("colTaux")}
                      disabled={l.nature !== "horaire"}
                      placeholder={l.nature !== "horaire" ? "—" : ""}
                      className={`${champ} text-right ${repris(`${k}.taux`)}`}
                      value={l.taux}
                      onChange={(e) => majLigne(l.id, { taux: e.target.value })}
                    />
                  </td>
                  <td className="py-1">
                    {l.nature === "horaire" ? (
                      <div className={`${champ} flex items-center justify-end border-transparent bg-transparent`} aria-label={tf("colMontant")}>
                        {calcule !== null ? f.nombre.format(calcule) : ""}
                      </div>
                    ) : (
                      <input
                        inputMode="decimal"
                        aria-label={tf("colMontant")}
                        className={`${champ} text-right ${repris(`${k}.montant`)}`}
                        value={l.montant}
                        onChange={(e) => majLigne(l.id, { montant: e.target.value })}
                      />
                    )}
                  </td>
                  <td className="py-1 text-center">
                    <button
                      type="button"
                      aria-label={tf("retirerLigne", { n: i + 1 })}
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
      <Lien className="mt-2" onClick={() => maj({ lignes: [...s.lignes, ligneVide(tauxMandat)] })}>
        {tf("ajouterLigne")}
      </Lien>

      <div className="ml-auto mt-3 w-full max-w-[320px]">
        {champsTaxe.map((ch, i) => (
          <div key={ch.cle} className="flex items-center justify-between gap-4 py-1">
            <span className="whitespace-nowrap">{tf(`taxe.${ch.cle}`, { taux: String(ch.taux).replace(".", locale === "en" ? "." : ",") })}</span>
            <input
              inputMode="decimal"
              aria-label={tf(`taxe.${ch.cle}`, { taux: String(ch.taux) })}
              className={`${champ} !w-[140px] text-right placeholder:text-si-ink ${repris(`taxe${i + 1}`)}`}
              placeholder={f.nombre.format(c.taxesCalculees[i])}
              value={s.taxes[i] ?? ""}
              onChange={(e) => maj({ taxes: s.taxes.map((v, j) => (j === i ? e.target.value : v)) })}
            />
          </div>
        ))}
        <div className="mt-1 flex items-center justify-between gap-4 border-t border-si-line pt-2 font-medium">
          <span>{t("total")}</span>
          <input
            inputMode="decimal"
            aria-label={tf("total")}
            className={`${champ} !w-[140px] text-right font-medium placeholder:text-si-ink ${repris("total")}`}
            placeholder={f.nombre.format(c.totalCalcule)}
            value={s.total}
            onChange={(e) => maj({ total: e.target.value })}
          />
        </div>
        <p className="mt-1.5 text-right text-si-muted">{tf("totalFoi")}</p>
      </div>
    </div>
  );
}

/* ── Le paiement : identique dans les deux présentations ─────────────────── */

export function Paiement({ saisie, onSaisie }: { saisie: FactureSaisie; onSaisie: (s: FactureSaisie) => void }) {
  const t = useTranslations("repriseUnClient.depot");
  const tf = useTranslations("repriseUnClient.factures");
  const maj = (patch: Partial<FactureSaisie>) => onSaisie({ ...saisie, ...patch });
  const statut = saisie.statutPaiement;

  return (
    <>
      <Choix
        etiquette={tf("blocPaiement")}
        valeur={statut}
        onChange={(v) => maj({ statutPaiement: v })}
        options={[
          { cle: "payee", libelle: tf("payee") },
          { cle: "partielle", libelle: tf("partielle") },
          { cle: "impayee", libelle: tf("impayee") },
        ]}
      />
      {statut && statut !== "impayee" && (
        <div className="mt-4 grid gap-4 sm:grid-cols-[1.3fr_1fr_1fr]">
          <Champ libelle={statut === "payee" ? t("payeeLe") : t("recuLe")}>
            <input type="date" className={champ} value={saisie.datePaiement} onChange={(e) => maj({ datePaiement: e.target.value })} />
          </Champ>
          {statut === "partielle" ? (
            <Champ libelle={t("montantRecu")}>
              <input inputMode="decimal" className={`${champ} text-right`} value={saisie.montantRecu} onChange={(e) => maj({ montantRecu: e.target.value })} />
            </Champ>
          ) : (
            <div className="hidden sm:block" />
          )}
          <Champ libelle={t("par")}>
            <select
              className={champ}
              value={saisie.modePaiement ?? ""}
              onChange={(e) => maj({ modePaiement: (e.target.value || null) as ModePaiementSaisie | null })}
            >
              <option value="">{tf("choisirMode")}</option>
              {MODES_PAIEMENT.map((m) => (
                <option key={m} value={m}>{tf(`modes.${m}`)}</option>
              ))}
            </select>
          </Champ>
        </div>
      )}
    </>
  );
}
