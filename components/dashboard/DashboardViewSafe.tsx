import Link from "next/link";
import type { DashboardPayload, ActivityFeedItem } from "@/lib/dashboard/types";
import { cn } from "@/lib/utils";
import { GettingStarted } from "@/components/dashboard/GettingStarted";
import {
  ComplianceStrip,
  PriorityCard,
  KpiCard,
  Obligations,
  type ComplianceItem,
  type UpNextItem,
  type Obligation,
} from "@/components/ds-safe/sections";
import { Card, CardTitle } from "@/components/ds-safe/core";
import { ArrowUpRight } from "lucide-react";
import { routes } from "@/lib/routes";

/**
 * Tableau de bord — design system safe-interface (variante froide albâtre).
 *
 * Consomme le MÊME `DashboardPayload` que `DashboardView` (aucune re-requête) :
 * on ne change que la présentation. `DashboardView` reste disponible comme repli
 * (revert = remettre `<DashboardView>` dans la page). Vue focalisée (priorité,
 * conformité, fidéicommis, indicateurs, obligations) conforme au design validé.
 */
export function DashboardViewSafe({ payload }: { payload: DashboardPayload }) {
  const {
    kpis,
    alerts,
    lastReconciliation,
    indicators,
    activeClientsCount,
    activeDossiersCount,
    soldeFideicommis,
    activityFeed,
    onboardingChecklist,
  } = payload;

  // Cabinet neuf : tant que l'onboarding n'est pas complet, on guide d'abord.
  const onboardingComplete = onboardingChecklist
    ? Object.values(onboardingChecklist).every(Boolean)
    : true;
  const showOnboarding = Boolean(onboardingChecklist) && !onboardingComplete;

  const recon = lastReconciliation;
  const trustToReconcile = !recon || recon.status !== "certified" || recon.daysSince > 31;

  const dateLabel = new Date().toLocaleDateString("fr-CA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const compliance: ComplianceItem[] = [
    { label: "Dossiers actifs", value: String(activeDossiersCount), state: "ok" },
    { label: "Clients actifs", value: String(activeClientsCount), state: "ok" },
    {
      label: "Fidéicommis",
      value: trustToReconcile ? "À rapprocher" : "À jour",
      state: trustToReconcile ? "warn" : "ok",
    },
  ];

  const alertTone = (type: string): UpNextItem["tone"] =>
    /trust|fidei|overdue|retard|urgent/i.test(type) ? "amber" : "verified";
  const upNext: UpNextItem[] = (alerts ?? []).slice(0, 4).map((a) => ({
    text: a.message,
    meta: a.type,
    tone: alertTone(a.type),
  }));
  if (upNext.length === 0) {
    upNext.push({ text: "Aucune action urgente : tout est à jour.", meta: "", tone: "muted" });
  }

  const obligations: Obligation[] = [
    {
      title: "Rapprochement fidéicommis",
      detail: recon ? `Période ${recon.periode}` : "Jamais effectué",
      status: trustToReconcile ? "À faire" : "À jour",
      state: trustToReconcile ? "warn" : "ok",
    },
    {
      title: "Clients avec fonds en fiducie",
      detail: "Sommes détenues en fiducie (B-1 r.5)",
      status: String(indicators.activeTrustAccounts),
      state: "ok",
    },
    {
      title: "Factures impayées",
      detail: "Solde à recevoir",
      status: String(indicators.invoicesPending),
      state: indicators.invoicesPending > 0 ? "warn" : "ok",
    },
    {
      title: "Temps non facturé",
      detail: "Entrées prêtes à facturer",
      status: String(indicators.unbilledEntries),
      state: indicators.unbilledEntries > 0 ? "warn" : "ok",
    },
  ];

  return (
    <div className="bg-si-canvas text-si-ink font-sans rounded-2xl p-6 sm:p-8">
      {showOnboarding && onboardingChecklist && (
        <div className="mb-5">
          <GettingStarted checklist={onboardingChecklist} />
        </div>
      )}

      <ComplianceStrip items={compliance} rightNote={dateLabel} />

      <AccountingSnapshot
        factured={kpis.revenueThisMonth.value}
        encaisse={kpis.paymentsReceived.value}
        resteARecevoir={kpis.outstandingInvoices.value}
        fiducie={soldeFideicommis ?? kpis.trustBalance.value}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-5">
        <PriorityCard
          priority={{
            eyebrow: "À traiter maintenant",
            title: trustToReconcile
              ? "Rapprochez le fidéicommis et suivez vos sommes à recevoir"
              : "Suivez vos sommes à recevoir",
            metrics: [
              { label: "À recevoir", value: kpis.outstandingInvoices.value, tone: "amber" },
              { label: "Encaissé ce mois", value: kpis.paymentsReceived.value },
            ],
          }}
          upNext={upNext}
        >
          <Link
            href="/comptes/rapprochement"
            className="inline-block font-sans text-sm font-medium rounded-xl px-[22px] py-3 bg-si-forest text-si-surface hover:bg-si-forest-soft transition-colors no-underline"
          >
            Rapprocher le fidéicommis
          </Link>
        </PriorityCard>

        <div className="flex flex-col gap-5">
          <KpiCard
            title="Lecture financière du mois"
            kpis={[
              { label: "Sorties", value: kpis.expensesThisMonth.value },
              { label: "Taux d'encaissement", value: kpis.recoveryRate.value },
            ]}
          />
          <ActivityCard items={activityFeed ?? []} />
        </div>
      </div>

      <div className="mt-5">
        <Obligations items={obligations} />
      </div>
    </div>
  );
}

function formatRelativeFr(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  if (hours < 24) return `il y a ${hours} h`;
  if (days < 7) return `il y a ${days} j`;
  return date.toLocaleDateString("fr-CA", { day: "numeric", month: "short" });
}

/* Fil des dernières actions du cabinet */
function ActivityCard({ items }: { items: ActivityFeedItem[] }) {
  return (
    <Card className="px-6 py-[22px]">
      <div className="flex items-baseline justify-between mb-3.5">
        <CardTitle>Activité récente</CardTitle>
        {items.length > 0 && (
          <Link
            href={routes.parametresAudit}
            className="text-xs text-si-verified font-medium no-underline hover:opacity-80"
          >
            Tout voir
          </Link>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-[13px] text-si-muted py-3">Aucune activité récente.</p>
      ) : (
        items.slice(0, 5).map((item, i) => (
          <div
            key={item.id}
            className={cn("flex items-start gap-3 py-[10px]", i > 0 && "border-t border-si-line2")}
          >
            <span className="mt-[7px] w-[7px] h-[7px] rounded-full bg-si-verified shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="text-[13px] text-si-ink truncate">
                <span className="font-medium">{item.action}</span>
                <span className="text-si-muted"> — {item.entityType}</span>
              </div>
              <div className="text-[11.5px] text-si-muted mt-0.5">
                {formatRelativeFr(item.timestamp)}
                {item.userDisplayName ? ` · ${item.userDisplayName}` : ""}
              </div>
            </div>
          </div>
        ))
      )}
    </Card>
  );
}

function AccountingSnapshot({
  factured,
  encaisse,
  resteARecevoir,
  fiducie,
}: {
  factured: string;
  encaisse: string;
  resteARecevoir: string;
  fiducie: string;
}) {
  const tiles = [
    {
      label: "Facturé ce mois",
      value: factured,
      href: routes.facturation,
      pill: "Facturation",
    },
    {
      label: "Encaissé ce mois",
      value: encaisse,
      href: routes.facturationPaiements,
      pill: "Encaissements",
    },
    {
      label: "Reste à recevoir",
      value: resteARecevoir,
      href: routes.facturationCreancesAging,
      pill: "Créances",
    },
    {
      label: "Fidéicommis client",
      value: fiducie,
      href: routes.comptes,
      pill: "Fidéicommis",
    },
  ];

  return (
    <Card elevated className="mt-5 px-6 py-6">
      <div className="flex flex-col gap-5">
        <div className="max-w-3xl">
          <div className="font-mono text-[11px] tracking-[1.4px] uppercase text-si-verified">
            Lecture rapide
          </div>
          <CardTitle className="mt-2 text-[28px] sm:text-[32px] leading-[1.1]">
            Vos chiffres, en langage simple
          </CardTitle>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {tiles.map((tile) => (
            <Link
              key={tile.label}
              href={tile.href}
              className="group relative overflow-hidden bg-si-forest text-si-surface rounded-2xl px-[26px] py-6 no-underline transition-transform duration-200 hover:-translate-y-0.5"
              aria-label={tile.label}
            >
              <div aria-hidden className="absolute -left-[50px] -bottom-[70px] w-[200px] h-[200px] glow-verified" />
              <span className="relative z-10 inline-flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-wider bg-si-verified/25 text-[#9FE3C2] px-2.5 py-[5px] rounded-full mb-3.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5FCF9C]" />
                {tile.pill}
              </span>
              <ArrowUpRight className="absolute right-[26px] top-6 z-10 h-4 w-4 opacity-50 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              <div className="relative z-10 text-xs opacity-75">{tile.label}</div>
              <div className="relative z-10 font-mono text-[28px] mt-1 mb-0.5">{tile.value}</div>
            </Link>
          ))}
        </div>
      </div>
    </Card>
  );
}
