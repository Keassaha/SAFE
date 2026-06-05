import Link from "next/link";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { canViewBillingTrust } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils/format";
import { routes } from "@/lib/routes";
import { getDossierProfitability } from "@/lib/services/finance/dossier-profitability";

function pct(v: number | null): string {
  return v == null ? "—" : `${Math.round(v * 100)} %`;
}

export default async function RentabilitePage() {
  const { cabinetId, role } = await requireCabinetAndUser();
  if (!canViewBillingTrust(role as UserRole)) {
    return <div className="p-6"><p className="text-status-error">Accès refusé.</p></div>;
  }

  const { totals, dossiers } = await getDossierProfitability(cabinetId);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Rentabilité par dossier"
        description="Marge brute = facturé HT − débours payés par le cabinet. N'inclut pas le coût du temps (non suivi)."
        backHref={routes.facturation}
        backLabel="Retour à la facturation"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4">
          <p className="text-xs text-neutral-500">Facturé HT</p>
          <p className="text-xl font-semibold tabular-nums">{formatCurrency(totals.factureHT)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-neutral-500">Débours payés</p>
          <p className="text-xl font-semibold tabular-nums">{formatCurrency(totals.coutsDirects)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-neutral-500">Marge brute</p>
          <p className={`text-xl font-semibold tabular-nums ${totals.margeBrute < 0 ? "text-red-700" : "text-emerald-700"}`}>
            {formatCurrency(totals.margeBrute)}
          </p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-xs text-neutral-500">Dossiers</p>
          <p className="text-xl font-semibold tabular-nums">{totals.nbDossiers}</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {dossiers.length === 0 ? (
            <p className="text-neutral-500 py-10 text-center">Aucune donnée de rentabilité.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50 text-left">
                    <th className="py-3 px-4 font-medium">Dossier</th>
                    <th className="py-3 px-4 font-medium">Client</th>
                    <th className="py-3 px-4 font-medium text-right">Facturé HT</th>
                    <th className="py-3 px-4 font-medium text-right">Débours</th>
                    <th className="py-3 px-4 font-medium text-right">Marge</th>
                    <th className="py-3 px-4 font-medium text-right">Marge %</th>
                  </tr>
                </thead>
                <tbody>
                  {dossiers.map((d) => (
                    <tr key={d.dossierId} className="border-b border-neutral-100 hover:bg-neutral-50/70">
                      <td className="py-2.5 px-4">
                        <Link href={routes.dossier(d.dossierId)} className="text-emerald-700 hover:underline">
                          {d.numeroDossier ? `${d.numeroDossier} — ` : ""}{d.intitule}
                        </Link>
                      </td>
                      <td className="py-2.5 px-4">{d.clientNom}</td>
                      <td className="py-2.5 px-4 text-right tabular-nums">{formatCurrency(d.factureHT)}</td>
                      <td className="py-2.5 px-4 text-right tabular-nums">{formatCurrency(d.coutsDirects)}</td>
                      <td className={`py-2.5 px-4 text-right tabular-nums font-semibold ${d.margeBrute < 0 ? "text-red-700" : ""}`}>
                        {formatCurrency(d.margeBrute)}
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums">{pct(d.margePct)}</td>
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
