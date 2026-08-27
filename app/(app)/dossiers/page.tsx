import Link from "next/link";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { RegistreBarreOutils, RegistreFeuille } from "@/components/ui/registre";
import {
  buildDossierListWhere,
  getDossierListOrderBy,
  DOSSIER_LIST_PAGE_SIZE,
  type DossierSortField,
  type DossierSortOrder,
} from "@/lib/dossiers/query";
import { DossierSummaryCards } from "@/components/dossiers/registry/DossierSummaryCards";
import { DossierSearchBar } from "@/components/dossiers/registry/DossierSearchBar";
import { DossierFilters } from "@/components/dossiers/registry/DossierFilters";
import { DossiersTable } from "@/components/dossiers/registry/DossiersTable";
import { DossierPagination } from "@/components/dossiers/registry/DossierPagination";
import { DossierCreateModal } from "@/components/dossiers/registry/DossierCreateModal";
import type { UserRole } from "@prisma/client";
import { canManageDossiers, canViewDossiers, canViewBillingTrust } from "@/lib/auth/permissions";
import { getCabinetDossierTaxonomyOptions } from "@/lib/dossiers/cabinet-dossier-taxonomy";
import { isMultiPartiesDossierEnabled } from "@/lib/flags";
import { getCabinetBillingMode } from "@/lib/services/cabinet-interface";
import { Download } from "lucide-react";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

const SORT_FIELDS: DossierSortField[] = [
  "reference",
  "intitule",
  "statut",
  "dateOuverture",
  "updatedAt",
  "avocatResponsable",
];
const SORT_ORDERS: DossierSortOrder[] = ["asc", "desc"];

export default async function DossiersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    clientId?: string;
    status?: string;
    type?: string;
    lawyer?: string;
    page?: string;
    sortBy?: string;
    sortOrder?: string;
    dateFrom?: string;
    dateTo?: string;
    overdue?: string;
    trust?: string;
  }>;
}) {
  const t = await getTranslations("matters");
  const tc = await getTranslations("common");
  const { cabinetId, role, userId } = await requireCabinetAndUser();
  if (!canViewDossiers(role as UserRole)) {
    notFound();
  }
  const params = await searchParams;

  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const sortBy: DossierSortField = SORT_FIELDS.includes(params.sortBy as DossierSortField)
    ? (params.sortBy as DossierSortField)
    : "dateOuverture";
  const sortOrder: DossierSortOrder = SORT_ORDERS.includes(params.sortOrder as DossierSortOrder)
    ? (params.sortOrder as DossierSortOrder)
    : "desc";

  const today = new Date();
  const canViewTrust = canViewBillingTrust(role as UserRole);

  const baseFilters = {
    q: params.q ?? null,
    clientId: params.clientId ?? null,
    status: params.status ?? null,
    type: params.type ?? null,
    restrictToUserId: role === "avocat" ? userId : null,
    dateFrom: params.dateFrom ?? null,
    dateTo: params.dateTo ?? null,
    overdueTasks: params.overdue === "1",
    now: today,
    // Le filtre fiducie n'est appliqué que si le rôle a le droit de la voir.
    trust: canViewTrust ? (params.trust ?? null) : null,
  };
  // Liste : vue active (masque clôturés/archivés sauf filtre de statut explicite).
  // Stats : comptent tous les statuts (la carte « clôturés » doit rester juste).
  const listWhere = buildDossierListWhere(cabinetId, { ...baseFilters, excludeClosedByDefault: true });
  const statsWhere = buildDossierListWhere(cabinetId, baseFilters);
  const orderBy = getDossierListOrderBy(sortBy, sortOrder);

  // Taxonomie configurée du cabinet → sujets/sous-matières + numérotation par
  // préfixe dans le modal de création (comme la page /dossiers/nouveau).
  // `locale` n'a pas de dépendance DB : résolu avant pour pouvoir l'injecter
  // dans le Promise.all ci-dessous, plutôt qu'en une troisième vague séparée.
  const locale = await getLocale();

  const [
    dossiers,
    totalCount,
    stats,
    clients,
    acteStats,
    avocats,
    assistants,
    actesUrgentsCount,
    taxonomyOptions,
    cabinetBillingMode,
  ] = await Promise.all([
    prisma.dossier.findMany({
      where: listWhere,
      orderBy,
      skip: (page - 1) * DOSSIER_LIST_PAGE_SIZE,
      take: DOSSIER_LIST_PAGE_SIZE,
      include: {
        client: {
          select: { id: true, raisonSociale: true, prenom: true, nom: true, typeClient: true },
        },
        avocatResponsable: { select: { nom: true } },
      },
    }),
    prisma.dossier.count({ where: listWhere }),
    prisma.dossier.groupBy({
      by: ["statut"],
      where: statsWhere,
      _count: true,
    }),
    prisma.client.findMany({
      where: { cabinetId },
      select: { id: true, typeClient: true, raisonSociale: true, prenom: true, nom: true },
      orderBy: { raisonSociale: "asc" },
    }),
    prisma.dossierActe.groupBy({
      by: ["status"],
      where: { dossier: { cabinetId } },
      _count: true,
    }),
    prisma.user.findMany({
      where: { cabinetId, role: { in: ["admin_cabinet", "avocat"] } },
      select: { id: true, nom: true },
      orderBy: { nom: "asc" },
    }),
    prisma.user.findMany({
      where: { cabinetId, role: "assistante" },
      select: { id: true, nom: true },
      orderBy: { nom: "asc" },
    }),
    prisma.dossierActe.count({
      where: {
        dossier: { cabinetId },
        status: { not: "done" },
        deadline: { lte: today },
      },
    }),
    getCabinetDossierTaxonomyOptions(cabinetId, locale),
    getCabinetBillingMode(cabinetId),
  ]);

  /**
   * Total de la barre de synthèse : TOUS les statuts.
   *
   * Il valait `totalCount`, qui compte la LISTE et porte donc
   * `excludeClosedByDefault`. « Total dossiers » excluait les clôturés pendant
   * que « Dossiers clôturés », lui, les comptait : le total pouvait être plus
   * petit que l'une de ses parties, et le « % du total » divisait par une
   * population qui n'était pas la sienne. Déc. CEO du 2026-08-27.
   *
   * `totalCount` reste la source de la pagination : c'est bien la liste qu'elle
   * pagine.
   */
  const totalDossiersToutStatuts = stats.reduce((s, g) => s + g._count, 0);

  const actifsCount =
    (stats.find((s) => s.statut === "actif")?._count ?? 0) +
    (stats.find((s) => s.statut === "ouvert")?._count ?? 0);
  const cloturesCount =
    (stats.find((s) => s.statut === "cloture")?._count ?? 0) +
    (stats.find((s) => s.statut === "archive")?._count ?? 0);

  const totalActes = acteStats.reduce((s, g) => s + g._count, 0);
  const actesEnCours = acteStats.find((g) => g.status === "inprogress")?._count ?? 0;
  const actesTermines = acteStats.find((g) => g.status === "done")?._count ?? 0;

  const canCreate = canManageDossiers(role as UserRole);
  const multiPartiesEnabled = isMultiPartiesDossierEnabled();

  const exportParams = new URLSearchParams();
  if (params.q) exportParams.set("q", params.q);
  if (params.clientId) exportParams.set("clientId", params.clientId);
  if (params.status) exportParams.set("status", params.status);
  if (params.type) exportParams.set("type", params.type);
  if (params.dateFrom) exportParams.set("dateFrom", params.dateFrom);
  if (params.dateTo) exportParams.set("dateTo", params.dateTo);
  if (params.overdue === "1") exportParams.set("overdue", "1");
  if (canViewTrust && params.trust) exportParams.set("trust", params.trust);
  const exportHref = `/api/dossiers/export?${exportParams.toString()}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("manageMattersDesc")}
        action={
          <div className="flex items-center gap-2">
            <Link href={exportHref} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" type="button">
                <Download className="w-4 h-4 mr-2 inline-block" aria-hidden />
                {tc("export")} CSV
              </Button>
            </Link>
            {canCreate && (
              <DossierCreateModal
                clients={clients}
                avocats={avocats}
                assistants={assistants}
                canCreate={canCreate}
                cabinetBillingMode={cabinetBillingMode}
                subjectOptions={taxonomyOptions.subjectOptions}
                submatterOptions={taxonomyOptions.submatterOptions}
                multiPartiesEnabled={multiPartiesEnabled}
              />
            )}
          </div>
        }
      />
      <DossierSummaryCards
        totalDossiers={totalDossiersToutStatuts}
        actifsCount={actifsCount}
        cloturesCount={cloturesCount}
        totalActes={totalActes}
        actesEnCours={actesEnCours}
        actesUrgents={actesUrgentsCount}
        actesTermines={actesTermines}
      />
      {/* La liste passe sur une feuille, comme le registre clients. Le titre
          « Liste des dossiers » a sauté : posé au-dessus d'une liste de
          dossiers, sur une page qui s'appelle Dossiers, il disait trois fois la
          même chose et volait la largeur de la recherche. */}
      <RegistreFeuille ariaLabel={t("matterList")}>
        <RegistreBarreOutils
          recherche={<DossierSearchBar />}
          filtres={<DossierFilters clients={clients} canViewTrust={canViewTrust} />}
        />
        {dossiers.length === 0 ? (
          <EmptyState
            title={t("noMatters")}
            description={t("createFirstMatter")}
            action={
              canCreate ? (
                <DossierCreateModal
                  clients={clients}
                  avocats={avocats}
                  assistants={assistants}
                  canCreate={canCreate}
                  buttonLabel={t("newMatter")}
                  cabinetBillingMode={cabinetBillingMode}
                  subjectOptions={taxonomyOptions.subjectOptions}
                  submatterOptions={taxonomyOptions.submatterOptions}
                  multiPartiesEnabled={multiPartiesEnabled}
                />
              ) : undefined
            }
          />
        ) : (
          <>
            <DossiersTable
              dossiers={dossiers}
              sortBy={sortBy}
              sortOrder={sortOrder}
              avocats={avocats}
              canManage={canCreate}
            />
            <DossierPagination
              totalCount={totalCount}
              currentPage={page}
              pageSize={DOSSIER_LIST_PAGE_SIZE}
            />
          </>
        )}
      </RegistreFeuille>
    </div>
  );
}
