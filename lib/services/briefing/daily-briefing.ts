import { getSecurityAlerts, type SecurityAlertsReport } from "@/lib/services/security/security-alerts";
import { getUnbilledTimeReport } from "@/lib/services/finance/unbilled-time";
import { getReceivablesAging, type AgingClientRow } from "@/lib/services/finance/receivables-aging";

export interface DailyBriefing {
  security: SecurityAlertsReport;
  finance: {
    aFacturer: number;
    dormant: number;
    creancesEnRetard: number;
    creancesTotal: number;
    /** Top 3 clients par montant en retard. */
    topCreances: AgingClientRow[];
  };
}

/**
 * Briefing quotidien unifié (déterministe) : « voici ce qui demande votre
 * attention aujourd'hui ». Agrège l'Agent de sécurité (conformité, fidéicommis,
 * échéances) et l'Agent Finance (temps non facturé, créances en retard) en une
 * seule vue. Composition de services déjà testés.
 */
export async function getDailyBriefing(
  cabinetId: string,
  now: Date = new Date(),
): Promise<DailyBriefing> {
  const [security, unbilled, aging] = await Promise.all([
    getSecurityAlerts(cabinetId, now),
    getUnbilledTimeReport(cabinetId, now),
    getReceivablesAging(cabinetId, now),
  ]);

  return {
    security,
    finance: {
      aFacturer: unbilled.totals.montantTotal,
      dormant: unbilled.totals.montantDormant,
      creancesEnRetard: aging.totals.enRetard,
      creancesTotal: aging.totals.totalDu,
      topCreances: aging.clients.filter((c) => c.montantEnRetard > 0).slice(0, 3),
    },
  };
}
