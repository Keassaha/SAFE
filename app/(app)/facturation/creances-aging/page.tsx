import Link from "next/link";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { canViewBillingTrust } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils/format";
import { routes } from "@/lib/routes";
import { getReceivablesAging } from "@/lib/services/finance/receivables-aging";

export default async function CreancesAgingPage() {
  const { cabinetId, role } = await requireCabinetAndUser();
  if (!canViewBillingTrust(role as UserRole)) {
    return <div className="p-6"><p className="text-[#B84A3E]">Accès refusé.</p></div>;
  }

  const { totals, clients } = await getReceivablesAging(cabinetId);

  const buckets = [
    { label: "Courant", value: totals.courant, tone: "text-emerald-700" },
    { label: "1–30 j", value: totals.b1_30, tone: "text-si-ink" },
    { label: "31–60 j", value: totals.b31_60, tone: "text-si-amber-ink" },
    { label: "61–90 j", value: totals.b61_90, tone: "text-si-amber-ink" },
    { label: "90 j+", value: totals.b90plus, tone: "text-[#B84A3E]" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Aging des créances"
        description="Factures impayées par ancienneté de retard. Priorisez les relances par montant en retard."
        backHref={routes.facturation}
        backLabel="Retour à la facturation"
      />

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-si-muted">Total dû</p>
            <p className="text-xl font-semibold tabular-nums">{formatCurrency(totals.totalDu)}</p>
          </CardContent>
        </Card>
        {buckets.map((b) => (
          <Card key={b.label}>
            <CardContent className="p-4">
              <p className="text-xs text-si-muted">{b.label}</p>
              <p className={`text-xl font-semibold tabular-nums ${b.tone}`}>{formatCurrency(b.value)}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {clients.length === 0 ? (
            <p className="text-si-muted py-10 text-center">Aucune créance impayée. 🎉</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-si-line bg-si-canvas text-left">
                    <th className="py-3 px-4 font-medium">Client</th>
                    <th className="py-3 px-4 font-medium text-right">Factures</th>
                    <th className="py-3 px-4 font-medium text-right">Retard max</th>
                    <th className="py-3 px-4 font-medium text-right">En retard</th>
                    <th className="py-3 px-4 font-medium text-right">Total dû</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c) => (
                    <tr key={c.clientId} className="border-b border-si-line hover:bg-si-canvas/70">
                      <td className="py-2.5 px-4">
                        <Link href={routes.client(c.clientId)} className="text-emerald-700 hover:underline">
                          {c.clientNom}
                        </Link>
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums">{c.nbFactures}</td>
                      <td className="py-2.5 px-4 text-right tabular-nums">
                        <span className={c.joursRetardMax > 90 ? "text-[#B84A3E] font-medium" : c.joursRetardMax > 0 ? "text-si-amber-ink" : ""}>
                          {c.joursRetardMax > 0 ? `${c.joursRetardMax} j` : "—"}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums font-medium text-[#B84A3E]">
                        {c.montantEnRetard > 0 ? formatCurrency(c.montantEnRetard) : "—"}
                      </td>
                      <td className="py-2.5 px-4 text-right tabular-nums font-semibold">{formatCurrency(c.totalDu)}</td>
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
