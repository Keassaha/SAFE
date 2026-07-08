import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSafeIncWorkspace } from "@/lib/safe-inc";
import { getTrustReconciliationStatus } from "@/lib/services/trust-reconciliation-status";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

/**
 * Module Audits clients — Console SAFE Inc.
 *
 * Surveille la conformité comptable (fidéicommis) des cabinets CLIENTS de SAFE.
 * Les données viennent du produit SAFE (TrustReconciliation, TrustAccount), pas du CRM.
 *
 * Un cabinet client = un Lead converti (cabinetId non null), hors SAFE Inc. lui-même.
 *
 * Niveaux de conformité dérivés :
 *  - CRITIQUE : solde fidéicommis négatif OU réconciliation en retard >10j
 *  - AVERTISSEMENT : réconciliation en retard ≤10j OU jamais réconcilié avec activité
 *  - CONFORME : réconcilié à jour, solde positif
 *  - NON_APPLICABLE : pas d'activité fidéicommis
 */

type Niveau = "CRITIQUE" | "AVERTISSEMENT" | "CONFORME" | "NON_APPLICABLE";

type AuditRow = {
  leadId: string;
  cabinetId: string;
  nom: string;
  niveau: Niveau;
  raison: string;
  trustBalance: number;
  daysOverdue: number;
  hasActivity: boolean;
  lastReconciled: string | null;
};

function niveauBadge(n: Niveau) {
  const map: Record<Niveau, { label: string; cls: string }> = {
    CRITIQUE: { label: "Critique", cls: "bg-[#B84A3E]/10 text-[#B84A3E] border-[#B84A3E]/30" },
    AVERTISSEMENT: { label: "Avertissement", cls: "bg-si-amber/[0.13] text-si-amber-ink border-si-amber/30" },
    CONFORME: { label: "Conforme", cls: "bg-si-verified/10 text-si-verified border-si-verified/30" },
    NON_APPLICABLE: { label: "N/A", cls: "bg-si-canvas text-si-muted border-si-line" },
  };
  const { label, cls } = map[n];
  return (
    <span className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

function money(n: number): string {
  return n.toLocaleString("fr-CA", { style: "currency", currency: "CAD" });
}

export default async function ConsoleAuditsPage() {
  const workspace = await getSafeIncWorkspace();

  // Cabinets clients = leads convertis (cabinetId non null), hors SAFE Inc.
  const clientLeads = await prisma.lead.findMany({
    where: {
      workspaceId: workspace.id,
      cabinetId: { not: null },
    },
    select: {
      id: true,
      raisonSociale: true,
      cabinetId: true,
      cabinet: { select: { nom: true } },
    },
  });

  // Exclure le cabinet SAFE Inc. lui-même (dog food)
  const monitored = clientLeads.filter((l) => l.cabinet?.nom !== "SAFE");

  const rows: AuditRow[] = await Promise.all(
    monitored.map(async (l): Promise<AuditRow> => {
      const cabinetId = l.cabinetId as string;

      // Statut réconciliation (produit SAFE)
      const status = await getTrustReconciliationStatus(cabinetId).catch(() => null);

      // Solde fidéicommis agrégé (somme des comptes)
      const agg = await prisma.trustAccount.aggregate({
        where: { cabinetId },
        _sum: { currentBalance: true },
      });
      const trustBalance = agg._sum.currentBalance ?? 0;

      const hasActivity = status?.hasTrustActivity ?? false;
      const daysOverdue = status?.daysOverdue ?? 0;
      const lastReconciled = status?.lastCertifiedPeriode ?? null;

      let niveau: Niveau = "NON_APPLICABLE";
      let raison = "Aucune activité fidéicommis";

      if (hasActivity) {
        if (trustBalance < 0) {
          niveau = "CRITIQUE";
          raison = `Solde fidéicommis négatif (${money(trustBalance)})`;
        } else if (status?.isOverdue && daysOverdue > 10) {
          niveau = "CRITIQUE";
          raison = `Réconciliation en retard de ${daysOverdue} jours`;
        } else if (status?.isOverdue) {
          niveau = "AVERTISSEMENT";
          raison = `Réconciliation en retard de ${daysOverdue} jours`;
        } else if (status?.hasNeverReconciled) {
          niveau = "AVERTISSEMENT";
          raison = "Jamais réconcilié malgré activité fidéicommis";
        } else {
          niveau = "CONFORME";
          raison = lastReconciled
            ? `Réconcilié au ${lastReconciled}`
            : "À jour";
        }
      }

      return {
        leadId: l.id,
        cabinetId,
        nom: l.raisonSociale,
        niveau,
        raison,
        trustBalance,
        daysOverdue,
        hasActivity,
        lastReconciled,
      };
    }),
  );

  const total = rows.length;
  const conformes = rows.filter((r) => r.niveau === "CONFORME").length;
  const avertissements = rows.filter((r) => r.niveau === "AVERTISSEMENT").length;
  const critiques = rows.filter((r) => r.niveau === "CRITIQUE").length;
  const alertes = rows.filter(
    (r) => r.niveau === "CRITIQUE" || r.niveau === "AVERTISSEMENT",
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audits de conformité"
        description="Surveillance fidéicommis des cabinets clients — Barreau / LSO By-Law 9"
      />

      {total === 0 ? (
        <EmptyState
          title="Aucun cabinet client surveillé"
          description="Les audits apparaîtront ici dès qu'un lead est converti en client avec activité fidéicommis. Pour l'instant, aucun cabinet client (hors SAFE Inc.) n'a de données fidéicommis."
        />
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label="Cabinets surveillés" value={total} />
            <KpiCard label="Conformes" value={conformes} accent="emerald" />
            <KpiCard label="Avertissements" value={avertissements} accent="amber" />
            <KpiCard label="Critiques" value={critiques} accent="red" />
          </div>

          {/* Alertes */}
          {alertes.length > 0 && (
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-si-muted">
                Alertes ({alertes.length})
              </h2>
              <div className="space-y-2">
                {alertes.map((r) => (
                  <div
                    key={r.cabinetId}
                    className={`flex items-center gap-3 rounded-md border px-4 py-3 ${
                      r.niveau === "CRITIQUE"
                        ? "border-[#B84A3E]/30 bg-[#B84A3E]/[0.06]"
                        : "border-si-amber/30 bg-si-amber/[0.13]"
                    }`}
                  >
                    <span className="text-lg">
                      {r.niveau === "CRITIQUE" ? "🛑" : "⚠️"}
                    </span>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-si-ink">
                        {r.nom}
                      </div>
                      <div className="text-xs text-si-muted">{r.raison}</div>
                    </div>
                    <Link
                      href={`/console/leads/${r.leadId}`}
                      className="rounded border border-si-line bg-si-surface px-2.5 py-1 text-xs font-medium text-si-ink hover:border-si-verified/50 hover:text-si-verified"
                    >
                      Voir le cabinet
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Table complète */}
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-si-muted">
              Tous les cabinets clients
            </h2>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-si-line bg-si-canvas text-xs uppercase tracking-wide text-si-muted">
                      <tr>
                        <th className="px-4 py-3 text-left">Cabinet</th>
                        <th className="px-4 py-3 text-left">Conformité</th>
                        <th className="px-4 py-3 text-left">Détail</th>
                        <th className="px-4 py-3 text-right">Solde fidéicommis</th>
                        <th className="px-4 py-3 text-left">Dernière réconciliation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-si-line">
                      {rows.map((r) => (
                        <tr key={r.cabinetId} className="hover:bg-si-canvas/60">
                          <td className="px-4 py-3">
                            <Link
                              href={`/console/leads/${r.leadId}`}
                              className="font-medium text-si-ink hover:text-si-verified"
                            >
                              {r.nom}
                            </Link>
                          </td>
                          <td className="px-4 py-3">{niveauBadge(r.niveau)}</td>
                          <td className="px-4 py-3 text-si-muted">{r.raison}</td>
                          <td
                            className={`px-4 py-3 text-right tabular-nums ${
                              r.trustBalance < 0 ? "font-semibold text-[#B84A3E]" : "text-si-ink"
                            }`}
                          >
                            {r.hasActivity ? money(r.trustBalance) : "—"}
                          </td>
                          <td className="px-4 py-3 text-si-muted">
                            {r.lastReconciled ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <div className="rounded-md border border-si-line bg-si-canvas px-4 py-2 text-xs text-si-muted">
        💡 Les données de conformité proviennent du produit SAFE (réconciliations
        fidéicommis des cabinets). Un cabinet apparaît ici dès qu'il est converti
        en client et possède de l'activité fidéicommis.
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  accent = "default",
}: {
  label: string;
  value: number;
  accent?: "default" | "emerald" | "amber" | "red";
}) {
  const valueClass =
    accent === "emerald"
      ? "text-si-verified"
      : accent === "amber"
      ? "text-si-amber-ink"
      : accent === "red"
      ? "text-[#B84A3E]"
      : "text-si-ink";
  return (
    <Card>
      <CardContent className="px-6 py-5">
        <p className="text-xs uppercase tracking-wide text-si-muted">{label}</p>
        <p className={`mt-2 text-3xl font-semibold tabular-nums ${valueClass}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
