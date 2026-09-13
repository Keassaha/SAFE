import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { routes } from "@/lib/routes";
import { prisma } from "@/lib/db";
import { getCabinetInterfaceDerived } from "@/lib/services/cabinet-interface";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { FacturationPageHero } from "@/components/facturation/FacturationPageHero";
import { FacturationMainKpis, type FacturationMainKpisData } from "@/components/facturation/FacturationMainKpis";
import {
  FacturationFiltres,
  FacturationRecherche,
} from "@/components/facturation/FacturationFilters";
import { FacturationTable } from "@/components/facturation/FacturationTable";
import { FacturationActions } from "@/components/facturation/FacturationActions";
import { HonorairesAFacturerView } from "./honoraires/HonorairesAFacturerView";
import { getSeuilFacturationById } from "@/lib/services/billing/seuil-facturation";
import { getFormatteurs } from "@/lib/i18n/formatteurs-serveur";
import { canManageCabinetSettings } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import type { InvoiceStatut, Prisma } from "@prisma/client";
import { joursDeRetard } from "@/lib/services/billing/reminder-service";
import {
  FACTURE_LISTE_TAILLE_PAGE,
  estChampTri,
  getFactureListeOrderBy,
  type FactureChampTri,
  type FactureOrdreTri,
} from "@/lib/facturation/liste-query";
import {
  RegistreBarreOutils,
  RegistreFeuille,
  RegistreAucunResultat,
} from "@/components/ui/registre";
import { FacturationPagination } from "@/components/facturation/FacturationPagination";
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
  searchParams: Promise<{
    statut?: string;
    q?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}) {
  const t = await getTranslations("facturation");
  const tb = await getTranslations("billingUi");
  const { cabinetId, role } = await requireCabinetAndUser();
  const { formatCurrency } = await getFormatteurs();
  const seuilFacturation = await getSeuilFacturationById(cabinetId);

  // Detect billing mode — shares the layout's cached CabinetInterface fetch
  // (React.cache dedupes, so no second DB query here)
  const { billingMode } = await getCabinetInterfaceDerived(cabinetId);

  const params = await searchParams;
  const { statut: statutParam, q, dateFrom: dateFromParam, dateTo: dateToParam } = params;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  // Par défaut, la plus récente en tête : c'est ce que le registre faisait
  // déjà, sans laisser le cabinet en changer.
  const sortBy: FactureChampTri = estChampTri(params.sortBy) ? params.sortBy : "dateEmission";
  const sortOrder: FactureOrdreTri = params.sortOrder === "asc" ? "asc" : "desc";
  const currentStatut =
    STATUT_OPTIONS.some((o) => o.value === statutParam) && statutParam
      ? (statutParam as InvoiceStatut)
      : null;
  const currentSearch = (q ?? "").trim();
  const dateFrom = dateFromParam ? new Date(dateFromParam) : null;
  const dateTo = dateToParam ? new Date(dateToParam) : null;
  const hasActiveFilter = Boolean(currentStatut || currentSearch || dateFrom || dateTo);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // Doctrine: docs/accounting/INVOICE_STATUS_NORMALIZATION.md
  // Le filtre URL `?statut=...` est traduit en where canonique pour
  // ne pas dépendre du champ `statut` legacy qui n'est plus la source de vérité.
  const statutFilter = legacyStatutToInvoiceWhere(currentStatut, now);

  // Un seul `where` pour la tranche et pour le compte : deux copies finissent
  // toujours par diverger, et la pagination annoncerait alors un total qui ne
  // correspond pas aux lignes affichées.
  const whereFactures = {
    cabinetId,
    ...(statutFilter ?? {}),
    ...(dateFrom ? { dateEmission: { gte: dateFrom, ...(dateTo ? { lte: dateTo } : {}) } } : {}),
    ...(dateTo && !dateFrom ? { dateEmission: { lte: dateTo } } : {}),
    ...(currentSearch
      ? {
          OR: [
            { numero: { contains: currentSearch } },
            { client: { raisonSociale: { contains: currentSearch } } },
            { client: { nom: { contains: currentSearch } } },
            { client: { prenom: { contains: currentSearch } } },
            { dossier: { intitule: { contains: currentSearch } } },
          ],
        }
      : {}),
  } satisfies Prisma.InvoiceWhereInput;

  const [
    invoices,
    invoicesTotal,
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
      where: whereFactures,
      include: {
        // `typeClient` manquait : le registre affichait `raisonSociale ?? ""`,
        // donc une colonne Client VIDE pour toute personne physique.
        client: {
          select: {
            id: true,
            raisonSociale: true,
            prenom: true,
            nom: true,
            typeClient: true,
            // La relance a besoin de savoir s'il y a quelqu'un à qui écrire.
            email: true,
          },
        },
        cabinet: { select: { nom: true } },
        dossier: { select: { id: true, intitule: true } },
        reminderLogs: { orderBy: { sentAt: "desc" as const }, take: 1 },
      },
      orderBy: getFactureListeOrderBy(sortBy, sortOrder),
      skip: (page - 1) * FACTURE_LISTE_TAILLE_PAGE,
      take: FACTURE_LISTE_TAILLE_PAGE,
    }),
    prisma.invoice.count({ where: whereFactures }),
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

  /**
   * Nom porté par la ligne. Même règle qu'au registre clients : nom de famille
   * d'abord, qui est ce sur quoi l'œil balaye et ce sur quoi le tri porte.
   */
  function nomClient(client: {
    typeClient: string;
    raisonSociale: string | null;
    prenom: string | null;
    nom: string | null;
  }): string {
    if (client.typeClient === "personne_physique" && (client.prenom || client.nom)) {
      return [client.nom, client.prenom].filter(Boolean).join(", ");
    }
    return client.raisonSociale?.trim() || t("clientUnnamed");
  }

  const rows: FacturationTableRow[] = invoices.map((inv) => ({
    id: inv.id,
    numero: inv.numero,
    client: nomClient(inv.client),
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
    clientEmail: inv.client.email?.trim() || null,
    cabinetNom: inv.cabinet?.nom ?? "",
    joursDeRetard: joursDeRetard(inv.dateEcheance, now),
    lastReminderSentAt: inv.reminderLogs[0]?.sentAt ?? null,
    sentAt: inv.sentAt ?? null,
  }));

  const secondaryTools = [
    { href: routes.facturationTempsNonFacture, title: t("toolUnbilledTime"), hint: t("toolUnbilledTimeHint") },
    { href: routes.facturationFrais, title: t("toolDisbursements"), hint: t("toolDisbursementsHint") },
    { href: routes.facturationCreancesAging, title: t("toolReceivablesAging"), hint: t("toolReceivablesAgingHint") },
    { href: routes.facturationTaxes, title: t("toolTaxes"), hint: t("toolTaxesHint") },
    { href: routes.facturationRentabilite, title: t("toolProfitability"), hint: t("toolProfitabilityHint") },
  ];

  return (
    <div className="space-y-6">
      <FacturationPageHero />
      <FacturationMainKpis kpis={kpis} />

      {/* Une rangée de liens, plus cinq cartes.
          Cinq boîtes formaient un second menu au milieu de la page, entre les
          chiffres et le registre. Les destinations restent : deux d'entre elles,
          TPS/TVQ et Rentabilité, n'ont AUCUNE autre porte dans le produit.
          Ce sont des rapports qu'on consulte, pas des étapes du travail : un
          lien suffit. Demande CEO du 2026-09-10. */}
      <nav aria-label={t("secondaryToolsLabel")} className="flex flex-wrap items-center gap-x-1 gap-y-1 text-[13px]">
        {secondaryTools.map((tool, i) => (
          <span key={tool.href} className="flex items-center gap-1">
            {i > 0 ? <span className="text-si-muted" aria-hidden>·</span> : null}
            <Link
              href={tool.href}
              title={tool.hint}
              className="min-h-tap inline-flex items-center rounded px-1 text-si-body underline decoration-si-line underline-offset-2 transition-colors hover:text-si-ink hover:decoration-si-ink-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-si-verified"
            >
              {tool.title}
            </Link>
          </span>
        ))}
      </nav>

      {/* « Honoraires à facturer » ouvre la section de travail.
          Ce n'est pas une facture, c'est du travail terminé qui en attend une,
          et c'est la première chose à traiter : ce qui reste à facturer passe
          avant ce qui l'est déjà. Demande CEO du 2026-09-10. */}
      <section id="facturables" className="scroll-mt-24 space-y-2">
        <div>
          <h2 className="text-lg font-medium text-si-ink">{tb("feesToBill")}</h2>
          <p className="max-w-[65ch] text-[13px] text-si-muted">{t("unbilledIntro")}</p>
          {/* Le seuil se lit là où il agit. Il vivait gravé dans le code ;
              il se règle désormais dans Paramètres › Facturation. */}
          <p className="max-w-[65ch] text-[13px] text-si-muted">
            {tb.rich("seuilPhrase", {
              amount: () => (
                <span className="font-mono tabular-nums text-si-ink">{formatCurrency(seuilFacturation)}</span>
              ),
            })}
            {canManageCabinetSettings(role as UserRole) ? (
              <>
                {" "}
                <Link
                  href={routes.parametresFacture}
                  className="text-si-ink underline decoration-si-line underline-offset-2 transition-colors hover:decoration-si-ink-strong"
                >
                  {tb("seuilModify")}
                </Link>
              </>
            ) : null}
          </p>
        </div>
        <HonorairesAFacturerView cabinetId={cabinetId} />
      </section>

      {/* La liste passe sur une feuille : surface blanche, filet, une ombre
          longue. Le canvas gris la porte au lieu de la contenir, et la barre
          d'outils appartient visiblement au même objet que le tableau. */}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between">
          <div className="flex items-baseline gap-3">
            <h2 className="text-lg font-medium text-si-ink">{t("listTitle")}</h2>
            {/* Le compte total, visible sans filtrer. C'est le premier chiffre
                qu'un inspecteur vérifie. */}
            <span className="text-[13px] text-si-muted">{t("invoiceCount", { count: invoicesTotal })}</span>
          </div>
          <FacturationActions billingMode={billingMode} />
        </div>
        <RegistreFeuille ariaLabel={t("listTitle")}>
          <RegistreBarreOutils
            recherche={
              <FacturationRecherche
                currentStatut={currentStatut}
                currentSearch={currentSearch}
                dateFrom={dateFromParam ?? ""}
                dateTo={dateToParam ?? ""}
              />
            }
            filtres={
              <FacturationFiltres
                currentStatut={currentStatut}
                currentSearch={currentSearch}
                statutOptions={STATUT_OPTIONS}
                dateFrom={dateFromParam ?? ""}
                dateTo={dateToParam ?? ""}
              />
            }
          />
          {rows.length === 0 ? (
            hasActiveFilter ? (
              <RegistreAucunResultat message={t("noMatch")} />
            ) : (
              <EmptyState
                title={t("emptyTitle")}
                description={t("emptyDesc")}
                action={
                  <Link href={routes.facturationFactureNouvelle}>
                    <Button type="button">{t("newInvoice")}</Button>
                  </Link>
                }
              />
            )
          ) : (
            <>
              <FacturationTable invoices={rows} sortBy={sortBy} sortOrder={sortOrder} />
              <FacturationPagination totalCount={invoicesTotal} currentPage={page} />
            </>
          )}
        </RegistreFeuille>
      </div>

    </div>
  );
}
