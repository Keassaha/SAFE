import Link from "next/link";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { canViewBillingTrust } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils/format";
import { routes } from "@/lib/routes";
import { getDailyBriefing } from "@/lib/services/briefing/daily-briefing";
import { ShieldAlert, AlertTriangle, ShieldCheck, Clock, FileWarning, CalendarClock, DollarSign } from "lucide-react";

export default async function BriefingPage() {
  const { cabinetId, role } = await requireCabinetAndUser();
  if (!canViewBillingTrust(role as UserRole)) {
    return <div className="p-6"><p className="text-[#B84A3E]">Accès refusé.</p></div>;
  }

  const { security, finance } = await getDailyBriefing(cabinetId);
  const { summary, echeances, fideicommis } = security;
  const echeancesDepassees = [...echeances.ircc, ...echeances.appels, ...echeances.documentsExpirant].filter(
    (e) => e.joursRestants < 0,
  ).length;
  const ras = summary.nbCritiques === 0 && summary.nbAvertissements === 0 && finance.aFacturer === 0 && finance.creancesEnRetard === 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Briefing du jour"
        description="Ce qui demande votre attention aujourd'hui — sécurité, conformité et argent, en un coup d'œil."
      />

      {ras && (
        <Card className="border-si-verified/30 bg-si-verified/10">
          <CardContent className="p-4 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-si-verified shrink-0" />
            <p className="text-sm font-medium text-si-verified">Tout est sous contrôle. Rien d&apos;urgent aujourd&apos;hui.</p>
          </CardContent>
        </Card>
      )}

      {/* Sécurité / conformité */}
      <Link href={routes.securite} className="block">
        <Card className={summary.nbCritiques > 0 ? "border-[#B84A3E]/40 bg-[#B84A3E]/10 hover:bg-[#B84A3E]/10" : "hover:bg-si-canvas"}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-emerald-700" /> Sécurité &amp; conformité
              </h2>
              <span className="text-xs text-emerald-700">Tableau de sécurité →</span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <span className={summary.nbCritiques > 0 ? "text-[#B84A3E] font-semibold" : "text-si-muted"}>
                {summary.nbCritiques} critique{summary.nbCritiques > 1 ? "s" : ""}
              </span>
              <span className={summary.nbAvertissements > 0 ? "text-si-amber-ink" : "text-si-muted"}>
                {summary.nbAvertissements} avertissement{summary.nbAvertissements > 1 ? "s" : ""}
              </span>
            </div>
            <ul className="mt-2 space-y-1 text-xs text-si-ink">
              {fideicommis.rapprochementEnRetard && (
                <li className="flex items-center gap-1.5 text-[#B84A3E]">
                  <AlertTriangle className="w-3.5 h-3.5" /> Rapprochement fidéicommis en retard ({fideicommis.rapprochementEnRetard.joursDepuisFinMois} j)
                </li>
              )}
              {fideicommis.alerts.soldesNegatifs.length > 0 && (
                <li className="flex items-center gap-1.5 text-[#B84A3E]">
                  <AlertTriangle className="w-3.5 h-3.5" /> {fideicommis.alerts.soldesNegatifs.length} solde(s) fiducie négatif(s)
                </li>
              )}
              {echeancesDepassees > 0 && (
                <li className="flex items-center gap-1.5 text-[#B84A3E]">
                  <CalendarClock className="w-3.5 h-3.5" /> {echeancesDepassees} échéance(s) légale(s) dépassée(s)
                </li>
              )}
              {echeances.documentsExpirant.length > 0 && (
                <li className="flex items-center gap-1.5 text-si-amber-ink">
                  <FileWarning className="w-3.5 h-3.5" /> {echeances.documentsExpirant.length} document(s) qui expire(nt) bientôt
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      </Link>

      {/* Finance */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-sm font-semibold flex items-center gap-1.5 mb-3">
            <DollarSign className="w-4 h-4 text-emerald-700" /> Argent à récupérer
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link href={routes.facturationTempsNonFacture} className="rounded-md border border-si-line p-3 hover:bg-si-canvas">
              <p className="text-xs text-si-muted flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Temps non facturé</p>
              <p className="text-lg font-semibold tabular-nums text-emerald-700">{formatCurrency(finance.aFacturer)}</p>
              {finance.dormant > 0 && <p className="text-xs text-si-amber-ink">dont {formatCurrency(finance.dormant)} dormant</p>}
            </Link>
            <Link href={routes.facturationCreancesAging} className="rounded-md border border-si-line p-3 hover:bg-si-canvas">
              <p className="text-xs text-si-muted">Créances en retard</p>
              <p className="text-lg font-semibold tabular-nums text-[#B84A3E]">{formatCurrency(finance.creancesEnRetard)}</p>
              <p className="text-xs text-si-muted">sur {formatCurrency(finance.creancesTotal)} dûs</p>
            </Link>
            <div className="rounded-md border border-si-line p-3">
              <p className="text-xs text-si-muted">Top relances</p>
              {finance.topCreances.length === 0 ? (
                <p className="text-sm text-si-muted mt-1">—</p>
              ) : (
                <ul className="text-xs text-si-ink mt-1 space-y-0.5">
                  {finance.topCreances.map((c) => (
                    <li key={c.clientId} className="flex justify-between gap-2">
                      <span className="truncate">{c.clientNom}</span>
                      <span className="tabular-nums shrink-0">{formatCurrency(c.montantEnRetard)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
