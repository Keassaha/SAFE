import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSafeIncWorkspace } from "@/lib/safe-inc";
import { getCabinetSubscriptionState } from "@/lib/services/subscription-state";
import { PLANS, type PlanKey } from "@/lib/stripe";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { isConsoleIntakeEnabled } from "@/lib/flags";

/**
 * Gestion clients / Abonnements — Console SAFE Inc.
 *
 * Vue des cabinets CLIENTS (leads convertis) avec leur état d'abonnement Stripe réel.
 * Données depuis le produit SAFE (Cabinet.stripe* + service subscription-state).
 *
 * v1 : vue de pilotage (plan, statut, MRR, renouvellement).
 * v2 : actions mutantes (rabais Stripe, blocage compte) — nécessitent un câblage
 *      Stripe prudent, marqué comme à venir pour ne pas toucher la facturation prod.
 */

function planLabel(plan: string): string {
  if (plan in PLANS) return PLANS[plan as PlanKey].name;
  return plan;
}

function planMonthly(plan: string): number {
  if (plan in PLANS) return PLANS[plan as PlanKey].price / 100;
  return 0;
}

function money(n: number): string {
  return n.toLocaleString("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });
}

function formatDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("fr-CA", { day: "2-digit", month: "short", year: "numeric" }).format(d);
}

function statutBadge(active: boolean, isTrialing: boolean, status: string | null) {
  if (isTrialing) {
    return <span className="inline-flex items-center rounded border border-si-amber/30 bg-si-amber/[0.13] px-2 py-0.5 text-xs font-medium text-si-amber-ink">Essai</span>;
  }
  if (active) {
    return <span className="inline-flex items-center rounded border border-si-verified/30 bg-si-verified/10 px-2 py-0.5 text-xs font-medium text-si-verified">Actif</span>;
  }
  return <span className="inline-flex items-center rounded border border-[#B84A3E]/30 bg-[#B84A3E]/10 px-2 py-0.5 text-xs font-medium text-[#B84A3E]">{status ?? "Inactif"}</span>;
}

export default async function ConsoleClientsPage() {
  const workspace = await getSafeIncWorkspace();

  const clientLeads = await prisma.lead.findMany({
    where: { workspaceId: workspace.id, cabinetId: { not: null } },
    select: {
      id: true,
      raisonSociale: true,
      cabinetId: true,
      dateDerniereActivite: true,
      cabinet: { select: { nom: true, plan: true } },
    },
  });

  const monitored = clientLeads.filter((l) => l.cabinet?.nom !== "SAFE");

  const rows = await Promise.all(
    monitored.map(async (l) => {
      const cabinetId = l.cabinetId as string;
      const sub = await getCabinetSubscriptionState(cabinetId).catch(() => null);
      const plan = sub?.plan ?? l.cabinet?.plan ?? "essentiel";
      const active = sub?.active ?? false;
      const isTrialing = sub?.isTrialing ?? false;
      const mrr = active && !isTrialing ? planMonthly(String(plan)) : 0;
      return {
        leadId: l.id,
        nom: l.raisonSociale,
        plan: String(plan),
        active,
        isTrialing,
        status: sub?.status ?? null,
        mrr,
        renouvellement: sub?.currentPeriodEnd ?? null,
        cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
        derniereActivite: l.dateDerniereActivite,
      };
    }),
  );

  const totalMRR = rows.reduce((s, r) => s + r.mrr, 0);
  const actifs = rows.filter((r) => r.active && !r.isTrialing).length;
  const essais = rows.filter((r) => r.isTrialing).length;
  const aRisque = rows.filter((r) => !r.active || r.cancelAtPeriodEnd).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gestion clients"
        description="Abonnements des cabinets clients — données Stripe réelles"
        action={
          isConsoleIntakeEnabled() ? (
            <Link
              href="/console/clients/nouveau"
              className="inline-flex items-center rounded-xl bg-si-surface px-4 py-2 text-sm font-medium text-si-forest transition hover:bg-si-surface/90"
            >
              + Nouveau client
            </Link>
          ) : undefined
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          title="Aucun client actif"
          description="Les cabinets apparaîtront ici dès qu'un lead est converti en client. Pour l'instant, aucun cabinet client (hors SAFE Inc.) n'est rattaché."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard label="MRR total" value={money(totalMRR)} accent="emerald" />
            <KpiCard label="Clients actifs" value={String(actifs)} />
            <KpiCard label="En essai" value={String(essais)} accent="amber" />
            <KpiCard label="À risque" value={String(aRisque)} accent={aRisque > 0 ? "red" : "default"} />
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-si-line bg-si-canvas text-xs uppercase tracking-wide text-si-muted">
                    <tr>
                      <th className="px-4 py-3 text-left">Cabinet</th>
                      <th className="px-4 py-3 text-left">Plan</th>
                      <th className="px-4 py-3 text-left">Statut</th>
                      <th className="px-4 py-3 text-right">MRR</th>
                      <th className="px-4 py-3 text-left">Renouvellement</th>
                      <th className="px-4 py-3 text-left">Dernière activité</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-si-line">
                    {rows.map((r) => (
                      <tr key={r.leadId} className="hover:bg-si-canvas/60">
                        <td className="px-4 py-3">
                          <Link href={`/console/clients/${r.leadId}`} className="font-medium text-si-ink hover:text-si-verified">
                            {r.nom}
                          </Link>
                          {r.cancelAtPeriodEnd && (
                            <span className="ml-2 text-[10px] uppercase tracking-wide text-[#B84A3E]">Résiliation prévue</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-si-ink">{planLabel(r.plan)}</td>
                        <td className="px-4 py-3">{statutBadge(r.active, r.isTrialing, r.status)}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-si-ink">
                          {r.mrr > 0 ? money(r.mrr) : "—"}
                        </td>
                        <td className="px-4 py-3 text-si-muted">{formatDate(r.renouvellement)}</td>
                        <td className="px-4 py-3 text-si-muted">{formatDate(r.derniereActivite)}</td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/console/clients/${r.leadId}`}
                            className="rounded border border-si-line bg-si-surface px-2.5 py-1 text-xs font-medium text-si-ink hover:border-si-verified/50 hover:text-si-verified"
                          >
                            Détails
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      <div className="rounded-md border border-si-line bg-si-canvas px-4 py-3 text-xs text-si-muted">
        💡 Les actions de gestion (appliquer un rabais Stripe, suspendre un compte
        pour non-paiement) arrivent en v2. Elles nécessitent un câblage Stripe
        prudent pour ne pas affecter la facturation réelle des clients.
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
  value: string;
  accent?: "default" | "emerald" | "amber" | "red";
}) {
  const valueClass =
    accent === "emerald" ? "text-si-verified"
    : accent === "amber" ? "text-si-amber-ink"
    : accent === "red" ? "text-[#B84A3E]"
    : "text-si-ink";
  return (
    <Card>
      <CardContent className="px-6 py-5">
        <p className="text-xs uppercase tracking-wide text-si-muted">{label}</p>
        <p className={`mt-2 text-3xl font-semibold tabular-nums ${valueClass}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
