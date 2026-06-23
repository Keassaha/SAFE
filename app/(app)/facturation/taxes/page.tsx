import { requireCabinetAndUser } from "@/lib/auth/session";
import { canViewBillingTrust } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { routes } from "@/lib/routes";
import { getTaxRemittance, currentQuarter, type TaxLine } from "@/lib/services/finance/tax-remittance";

function parseDate(s: string | undefined): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const d = new Date(s + "T00:00:00");
  return Number.isNaN(d.getTime()) ? null : d;
}

function TaxCard({ titre, line }: { titre: string; line: TaxLine }) {
  return (
    <Card>
      <CardContent className="p-4 space-y-1">
        <h3 className="text-sm font-semibold text-si-ink">{titre}</h3>
        <div className="flex justify-between text-sm">
          <span className="text-si-muted">Perçue (ventes)</span>
          <span className="tabular-nums">{formatCurrency(line.percue)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-si-muted">− Notes de crédit</span>
          <span className="tabular-nums">{formatCurrency(line.notesCredit)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-si-muted">− Crédits sur intrants</span>
          <span className="tabular-nums">{formatCurrency(line.creditsIntrants)}</span>
        </div>
        <div className="flex justify-between text-base font-semibold border-t border-si-line pt-1 mt-1">
          <span>À remettre</span>
          <span className={`tabular-nums ${line.aRemettre < 0 ? "text-emerald-700" : "text-si-ink"}`}>
            {formatCurrency(line.aRemettre)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function TaxesPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { cabinetId, role } = await requireCabinetAndUser();
  if (!canViewBillingTrust(role as UserRole)) {
    return <div className="p-6"><p className="text-[#B84A3E]">Accès refusé.</p></div>;
  }

  const { from: fromParam, to: toParam } = await searchParams;
  const q = currentQuarter();
  const from = parseDate(fromParam) ?? q.from;
  const to = parseDate(toParam) ?? q.to;

  const report = await getTaxRemittance(cabinetId, { from, to });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="TPS / TVQ à remettre"
        description="Estimation à faire valider par votre comptable. Calculée à partir des factures émises, notes de crédit et dépenses validées."
        backHref={routes.facturation}
        backLabel="Retour à la facturation"
      />

      <Card>
        <CardContent className="p-4">
          <form className="flex flex-wrap items-end gap-3" method="get">
            <label className="text-sm">
              <span className="block text-si-muted mb-1">Du</span>
              <input type="date" name="from" defaultValue={report.periode.from}
                className="h-9 px-2 rounded border border-si-line bg-si-surface text-sm" />
            </label>
            <label className="text-sm">
              <span className="block text-si-muted mb-1">Au</span>
              <input type="date" name="to" defaultValue={report.periode.to}
                className="h-9 px-2 rounded border border-si-line bg-si-surface text-sm" />
            </label>
            <button type="submit" className="h-9 px-4 rounded-lg bg-si-forest text-si-surface text-sm font-medium hover:opacity-90">
              Appliquer
            </button>
            <span className="text-xs text-si-muted self-center">
              Période : {formatDate(report.periode.from)} → {formatDate(report.periode.to)}
            </span>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TaxCard titre="TPS" line={report.tps} />
        <TaxCard titre="TVQ" line={report.tvq} />
      </div>

      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <span className="text-sm font-medium">Total à remettre (TPS + TVQ)</span>
          <span className="text-xl font-bold tabular-nums">{formatCurrency(report.totalARemettre)}</span>
        </CardContent>
      </Card>

      <p className="text-xs text-si-muted">
        Estimation indicative. Les montants officiels à déclarer doivent être validés par votre comptable
        (traitement des cas particuliers, ajustements, méthode rapide, etc.).
      </p>
    </div>
  );
}
