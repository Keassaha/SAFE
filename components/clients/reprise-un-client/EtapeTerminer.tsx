"use client";

import { useLocale, useTranslations } from "next-intl";
import { Check } from "lucide-react";
import type { RecapitulatifMandat } from "@/lib/services/reprise-un-client/recapitulatif";
import { Carte, EnTeteCarte, Message } from "./pieces";

export function EtapeTerminer({ recap }: { recap: RecapitulatifMandat }) {
  const t = useTranslations("repriseUnClient.terminer");
  const tm = useTranslations("repriseUnClient.modes");
  const locale = useLocale();
  const loc = locale === "en" ? "en-CA" : "fr-CA";
  const devise = new Intl.NumberFormat(loc, { style: "currency", currency: "CAD" });
  const nombre = new Intl.NumberFormat(loc, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const date = (iso: string) =>
    new Intl.DateTimeFormat(loc, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`));

  const { totaux } = recap;
  const periode =
    recap.periode.debut && recap.periode.fin
      ? t("reprisDuAu", { debut: date(recap.periode.debut), fin: date(recap.periode.fin) })
      : t("aucuneFacture");

  const libellePaiement = (statut: string, mode: string | null) =>
    [tm(statut as "payee"), mode && statut !== "impayee" ? tm(mode as "cheque") : null].filter(Boolean).join(" · ");

  return (
    <Carte>
      <EnTeteCarte titre={recap.client.nom} aide={`${recap.mandat.intitule} · ${periode}`} />

      <div className="grid grid-cols-3 border-t border-si-line">
        {[
          { l: t("facture"), v: totaux.facture, du: false },
          { l: t("encaisse"), v: totaux.encaisse, du: false },
          { l: t("resteDu"), v: totaux.resteDu, du: totaux.resteDu > 0 },
        ].map((c, i) => (
          <div key={i} className="border-r border-si-line2 px-5 py-3.5 last:border-r-0">
            <div className="text-[12px] text-si-muted">{c.l}</div>
            <div className={`mt-1 font-mono text-[20px] tabular-nums ${c.du ? "text-si-amber-ink" : "text-si-ink"}`}>{devise.format(c.v)}</div>
          </div>
        ))}
      </div>

      {recap.factures.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-[13px]">
            <thead>
              <tr className="border-t border-si-line text-[12px] text-si-muted">
                <th className="px-5 py-2.5 text-left font-medium">{t("colFacture")}</th>
                <th className="px-3 py-2.5 text-left font-medium">{t("colDate")}</th>
                <th className="px-3 py-2.5 text-right font-medium">{t("colHeures")}</th>
                <th className="px-3 py-2.5 text-right font-medium">{t("colTotal")}</th>
                <th className="px-3 py-2.5 text-right font-medium">{t("colEncaisse")}</th>
                <th className="px-3 py-2.5 text-right font-medium">{t("colReste")}</th>
                <th className="px-5 py-2.5 text-left font-medium">{t("colPaiement")}</th>
              </tr>
            </thead>
            <tbody>
              {recap.factures.map((f) => (
                <tr key={f.id} className="border-t border-si-line2">
                  <td className="px-5 py-2.5 font-medium text-si-ink">{f.numero}</td>
                  <td className="px-3 py-2.5 font-mono text-si-ink">{f.dateEmission}</td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums">{nombre.format(f.heures)}</td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums">{nombre.format(f.total)}</td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums">{nombre.format(f.encaisse)}</td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums">{nombre.format(f.resteDu)}</td>
                  <td className="px-5 py-2.5 text-[12px] text-si-muted">{libellePaiement(f.statut, f.mode)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-si-line font-medium text-si-ink">
                <td className="px-5 py-2.5" colSpan={2}>{t("totalFactures", { n: recap.factures.length })}</td>
                <td className="px-3 py-2.5 text-right font-mono tabular-nums">{nombre.format(totaux.heures)}</td>
                <td className="px-3 py-2.5 text-right font-mono tabular-nums">{nombre.format(totaux.facture)}</td>
                <td className="px-3 py-2.5 text-right font-mono tabular-nums">{nombre.format(totaux.encaisse)}</td>
                <td className="px-3 py-2.5 text-right font-mono tabular-nums">{nombre.format(totaux.resteDu)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <div className="border-t border-si-line px-5 pb-4 pt-3.5">
        <h3 className="text-[14px] font-medium text-si-ink">{t("maintenantDansSafe")}</h3>
        <ul className="mt-2 grid gap-x-6 gap-y-1.5 text-[13px] text-si-body sm:grid-cols-2">
          {[
            t("laFiche"),
            recap.mandat.tauxHoraire !== null
              ? t("leMandatTaux", { taux: devise.format(recap.mandat.tauxHoraire) })
              : t("leMandat"),
            t("lesFactures", { n: recap.factures.length }),
            t("lesHeures", { heures: nombre.format(totaux.heures), forfaits: totaux.forfaits }),
            t("lesDebours", { n: totaux.debours }),
            t("lesEcritures", { n: totaux.ecritures }),
          ].map((texte, i) => (
            <li key={i} className="flex gap-2">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-si-verified" aria-hidden />
              {texte}
            </li>
          ))}
        </ul>
      </div>

      {!recap.client.identiteVerifiee && (
        <div className="px-5 pb-5">
          <Message ton="attention">
            <b className="font-medium text-si-amber-ink">{t("resteACompleter")}</b> {t("identiteManque")}
          </Message>
        </div>
      )}
    </Carte>
  );
}
