import Link from "next/link";
import type { DashboardPayload } from "@/lib/dashboard/types";
import { GettingStarted } from "@/components/dashboard/GettingStarted";
import {
  ComplianceStrip,
  PriorityCard,
  TrustCard,
  KpiCard,
  Obligations,
  type ComplianceItem,
  type UpNextItem,
  type Obligation,
} from "@/components/ds-safe/sections";

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
      title: "Comptes fiducie actifs",
      detail: "Suivi mensuel (B-1 r.5)",
      status: String(indicators.activeTrustAccounts),
      state: "ok",
    },
    {
      title: "Factures en attente",
      detail: "À valider ou émettre",
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
          <TrustCard
            badge="Fidéicommis"
            label="Solde en fidéicommis (clients)"
            amount={soldeFideicommis ?? kpis.trustBalance.value}
            caption={recon ? `Dernier rapprochement : ${recon.periode}` : "Jamais rapproché"}
          />
          <KpiCard
            title="Ce mois"
            kpis={[
              { label: "Revenu", value: kpis.revenueThisMonth.value },
              { label: "Encaissé", value: kpis.paymentsReceived.value },
              { label: "À recevoir", value: kpis.outstandingInvoices.value },
              { label: "Dépenses", value: kpis.expensesThisMonth.value },
              { label: "Taux d'encaissement", value: kpis.recoveryRate.value },
            ]}
          />
        </div>
      </div>

      <div className="mt-5">
        <Obligations items={obligations} />
      </div>
    </div>
  );
}
