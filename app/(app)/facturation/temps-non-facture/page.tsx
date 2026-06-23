import Link from "next/link";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { canViewBillingTrust } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { routes } from "@/lib/routes";
import { getUnbilledTimeReport, DORMANT_DAYS } from "@/lib/services/finance/unbilled-time";
import { AlertTriangle, Clock } from "lucide-react";

export default async function TempsNonFacturePage() {
  const { cabinetId, role } = await requireCabinetAndUser();
  if (!canViewBillingTrust(role as UserRole)) {
    return (
      <div className="p-6">
        <p className="text-[#B84A3E]">Vous n&apos;avez pas accès à cette section.</p>
      </div>
    );
  }

  const report = await getUnbilledTimeReport(cabinetId);
  const { totals, parTranche, dossiers } = report;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Temps non facturé"
        description="Détecteur de revenus dormants : temps facturable jamais porté sur une facture. Chiffres exacts (aucune estimation)."
        backHref={routes.facturation}
        backLabel="Retour à la facturation"
      />

      {/* Synthèse */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-si-muted">À facturer (total)</p>
            <p className="text-2xl font-semibold tabular-nums text-emerald-700">
              {formatCurrency(totals.montantTotal)}
            </p>
            <p className="text-xs text-si-muted mt-1">
              {totals.nbEntries} fiche{totals.nbEntries > 1 ? "s" : ""} · {totals.nbDossiers} dossier
              {totals.nbDossiers > 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-si-muted flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-si-amber-ink" /> Dormant (&gt; {DORMANT_DAYS} j)
            </p>
            <p className="text-2xl font-semibold tabular-nums text-si-amber-ink">
              {formatCurrency(totals.montantDormant)}
            </p>
            <p className="text-xs text-si-muted mt-1">
              {totals.nbDossiersDormants} dossier{totals.nbDossiersDormants > 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-si-muted flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> Fiche la plus ancienne
            </p>
            <p className="text-2xl font-semibold tabular-nums">
              {totals.ageMaxJours > 0 ? `${totals.ageMaxJours} j` : "—"}
            </p>
            <p className="text-xs text-si-muted mt-1">
              {totals.plusAncienneDate ? formatDate(totals.plusAncienneDate) : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-si-muted">Par tranche d&apos;âge</p>
            <ul className="text-xs text-si-ink mt-1 space-y-0.5 tabular-nums">
              <li>0–30 j : {formatCurrency(parTranche.t0_30)}</li>
              <li>31–60 j : {formatCurrency(parTranche.t31_60)}</li>
              <li>61–90 j : {formatCurrency(parTranche.t61_90)}</li>
              <li className="text-si-amber-ink">90 j+ : {formatCurrency(parTranche.t90plus)}</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Liste actionnable */}
      <Card>
        <CardContent className="p-0">
          {dossiers.length === 0 ? (
            <p className="text-si-muted py-10 text-center">
              Aucun temps facturable en attente. Tout est facturé. 🎉
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-si-line bg-si-canvas text-left">
                    <th className="py-3 px-4 font-medium">Dossier</th>
                    <th className="py-3 px-4 font-medium">Client</th>
                    <th className="py-3 px-4 font-medium text-right">Fiches</th>
                    <th className="py-3 px-4 font-medium text-right">Plus ancienne</th>
                    <th className="py-3 px-4 font-medium text-right">À facturer</th>
                    <th className="py-3 px-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {dossiers.map((d) => (
                    <tr
                      key={d.dossierId ?? d.clientId ?? d.clientNom}
                      className="border-b border-si-line hover:bg-si-canvas/70"
                    >
                      <td className="py-2.5 px-4">
                        {d.numeroDossier ? `${d.numeroDossier} — ` : ""}
                        {d.dossierIntitule}
                      </td>
                      <td className="py-2.5 px-4">{d.clientNom}</td>
                      <td className="py-2.5 px-4 text-right tabular-nums">{d.nbEntries}</td>
                      <td className="py-2.5 px-4 text-right tabular-nums">
                        <span className={d.ageMaxJours > DORMANT_DAYS ? "text-si-amber-ink font-medium" : ""}>
                          {d.ageMaxJours} j
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums font-semibold">
                        {formatCurrency(d.montant)}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <Link
                          href={routes.facturationFactureNouvelle}
                          className="text-emerald-700 hover:underline font-medium"
                        >
                          Facturer
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
