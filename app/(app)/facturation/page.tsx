import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { routes } from "@/lib/routes";
import { prisma } from "@/lib/db";
import { getCabinetInterfaceDerived } from "@/lib/services/cabinet-interface";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { FacturationPageHero } from "@/components/facturation/FacturationPageHero";
import { FacturationMainKpis, type FacturationMainKpisData } from "@/components/facturation/FacturationMainKpis";
import { FacturationFilters } from "@/components/facturation/FacturationFilters";
import { FacturationTable } from "@/components/facturation/FacturationTable";
import { FacturationActions } from "@/components/facturation/FacturationActions";
import { HonorairesAFacturerView } from "./honoraires/HonorairesAFacturerView";
import type { InvoiceStatut } from "@prisma/client";
import type { FacturationTableRow } from "@/components/facturation/FacturationTable";
import {
  aggregateBillableRegistreTaches,
  aggregateBillableExpenses,
  aggregateBillableTimeEntries,
  countBillableClients,
} from "@/lib/billing/queries";
import {
  whereInvoiceDraft,
  whereInvoiceIssuedActive,
  whereInvoiceOverdue,
  whereInvoiceForReports,
  legacyStatutToInvoiceWhere,
  deriveLegacyStatut,
} from "@/lib/billing/invoice-status";

const STATUT_OPTIONS: { value: "" | InvoiceStatut; label: string }[] = [
  { value: "", label: "" },
  { value: "brouillon", label: "" },
  { value: "envoyee", label: "" },
  { value: "partiellement_payee", label: "" },
  { value: "payee", label: "" },
  { value: "en_retard", label: "" },
];

export default async function FacturationPage({
  searchParams,
}: {
  searchParams: Promise<{ statut?: string; q?: string; dateFrom?: string; dateTo?: string }>;
}) {
  const t = await getTranslations("facturation");
  const { cabinetId, role } = await requireCabinetAndUser();

  // Detect billing mode — shares the layout's cached CabinetInterface fetch
  // (React.cache dedupes, so no second DB query here)
  const { billingMode } = await getCabinetInterfaceDerived(cabinetId);

  const { statut: statutParam, q, dateFrom: dateFromParam, dateTo: dateToParam } = await searchParams;
  const currentStatut =
    STATUT_OPTIONS.some((o) => o.value === statutParam) && statutParam
      ? (statutParam as InvoiceStatut)
      : null;
  const currentSearch = (q ?? "").trim();
  const dateFrom = dateFromParam ? new Date(dateFromParam) : null;
  const dateTo = dateToParam ? new Date(dateToParam) : null;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // Doctrine: docs/accounting/INVOICE_STATUS_NORMALIZATION.md
  // Le filtre URL `?statut=...` est traduit en where canonique pour
  // ne pas dépendre du champ `statut` legacy qui n'est plus la source de vérité.
  const statutFilter = legacyStatutToInvoiceWhere(currentStatut, now);

  const [
    invoices,
    facturablesTime,
    facturablesForfaits,
    facturablesExpenses,
    facturablesClientCount,
    envoyeesAgg,
    enRetardAgg,
    brouillonsCount,
    issuedForTaux,
  ] = await Promise.all([
    prisma.invoice.findMany({
      where: {
        cabinetId,
        ...(statutFilter ?? {}),
        ...(dateFrom ? { dateEmission: { gte: dateFrom, ...(dateTo ? { lte: dateTo } : {}) } } : {}),
        ...(dateTo && !dateFrom ? { dateEmission: { lte: dateTo } } : {}),
        ...(currentSearch
          ? {
              OR: [
                { numero: { contains: currentSearch } },
                { client: { raisonSociale: { contains: currentSearch } } },
                { dossier: { intitule: { contains: currentSearch } } },
              ],
            }
          : {}),
      },
      include: {
        client: { select: { id: true, raisonSociale: true } },
        dossier: { select: { id: true, intitule: true } },
        reminderLogs: { orderBy: { sentAt: "desc" as const }, take: 1 },
      },
      orderBy: { dateEmission: "desc" },
    }),
    // Doctrine §3 — feeAmount prime sur montant, write-offs exclus.
    // Encapsulé dans `aggregateBillableTimeEntries` pour garder la règle au même endroit.
    aggregateBillableTimeEntries(prisma, cabinetId),
    aggregateBillableRegistreTaches(prisma, cabinetId),
    aggregateBillableExpenses(prisma, cabinetId),
    countBillableClients(prisma, cabinetId),
    // KPI "envoyées" : factures émises actives (non en retard, non payées).
    prisma.invoice.aggregate({
      where: { cabinetId, ...whereInvoiceIssuedActive(now) },
      _count: true,
      _sum: { montantTotal: true },
    }),
    // KPI "en retard" : calcul dynamique (dateEcheance < now).
    prisma.invoice.aggregate({
      where: { cabinetId, ...whereInvoiceOverdue(now) },
      _count: true,
      _sum: { balanceDue: true },
    }),
    // KPI "brouillons" : DRAFT + READY_TO_ISSUE.
    prisma.invoice.count({
      where: { cabinetId, ...whereInvoiceDraft() },
    }),
    // Taux d'encaissement : sur l'ensemble des factures émises (PAID inclus).
    prisma.invoice.aggregate({
      where: { cabinetId, ...whereInvoiceForReports() },
      _sum: { montantTotal: true, totalPaidAmount: true },
    }),
  ]);

  const facturablesSum =
    facturablesTime.total +
    facturablesForfaits.total +
    facturablesExpenses.total;
  const totalEmitted = issuedForTaux._sum.montantTotal ?? 0;
  const totalPaid = issuedForTaux._sum.totalPaidAmount ?? 0;
  const kpis: FacturationMainKpisData = {
    facturablesCount: facturablesClientCount,
    facturablesSum,
    envoyeesCount: envoyeesAgg._count,
    envoyeesSum: envoyeesAgg._sum.montantTotal ?? 0,
    verificationCount: brouillonsCount,
    enRetardCount: enRetardAgg._count,
    enRetardSum: enRetardAgg._sum.balanceDue ?? 0,
    tauxEncaissement:
      totalEmitted > 0 ? Math.round((totalPaid / totalEmitted) * 100) : undefined,
  };

  const rows: FacturationTableRow[] = invoices.map((inv) => ({
    id: inv.id,
    numero: inv.numero,
    client: inv.client.raisonSociale ?? "",
    clientId: inv.client.id,
    dossier: inv.dossier?.intitule ?? "—",
    dossierId: inv.dossier?.id ?? null,
    dateEmission: inv.dateEmission,
    dateEcheance: inv.dateEcheance,
    montantTotal: inv.montantTotal,
    balanceDue: inv.balanceDue,
    // Doctrine: statut affiché = dérivé de invoiceStatus + paymentStatus + dateEcheance.
    statut: deriveLegacyStatut(inv, now),
    lastReminderDay: inv.lastReminderDay,
    lastReminderSentAt: inv.reminderLogs[0]?.sentAt ?? null,
  }));

  return (
    <div className="space-y-6">
      <FacturationPageHero />
      <FacturationMainKpis kpis={kpis} />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { href: routes.facturationTempsNonFacture, titre: "Temps non facturé", sous: "Revenus dormants" },
          { href: routes.facturationFrais, titre: "Débours", sous: "À refacturer" },
          { href: routes.facturationCreancesAging, titre: "Aging des créances", sous: "Impayés par ancienneté" },
          { href: routes.facturationTaxes, titre: "TPS / TVQ", sous: "À remettre (estimation)" },
          { href: routes.facturationRentabilite, titre: "Rentabilité", sous: "Marge par dossier" },
        ].map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-safe border border-emerald-200 bg-emerald-50/50 px-4 py-3 hover:bg-emerald-50 transition-colors"
          >
            <p className="text-sm font-semibold text-emerald-900">{c.titre}</p>
            <p className="text-xs text-emerald-700/80 mt-0.5">{c.sous} →</p>
          </Link>
        ))}
      </div>

      <section id="facturables" className="scroll-mt-24">
        <HonorairesAFacturerView cabinetId={cabinetId} role={role} embedded />
      </section>

      <Card>
        <CardHeader
          title={t("listTitle")}
          action={<FacturationActions billingMode={billingMode} />}
        />
        <CardContent className="space-y-4">
          <FacturationFilters
            currentStatut={currentStatut}
            currentSearch={currentSearch}
            statutOptions={STATUT_OPTIONS}
            dateFrom={dateFromParam ?? ""}
            dateTo={dateToParam ?? ""}
          />
          {rows.length === 0 ? (
            <p className="text-sm text-[var(--safe-text-secondary)] py-8 text-center">
              {t("noMatch")}
            </p>
          ) : (
            <FacturationTable invoices={rows} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
