import Link from "next/link";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardTitle } from "@/components/ds-safe/core";
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
import { canManageDossiers, canViewDossiers } from "@/lib/auth/permissions";
import { getCabinetDossierTaxonomyOptions } from "@/lib/dossiers/cabinet-dossier-taxonomy";
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

  const where = buildDossierListWhere(cabinetId, {
    q: params.q ?? null,
    clientId: params.clientId ?? null,
    status: params.status ?? null,
    type: params.type ?? null,
    restrictToUserId: role === "avocat" ? userId : null,
  });
  const orderBy = getDossierListOrderBy(sortBy, sortOrder);

  const today = new Date();

  const [dossiers, totalCount, stats, clients, acteStats, avocats, assistants] = await Promise.all([
    prisma.dossier.findMany({
      where,
      orderBy,
      skip: (page - 1) * DOSSIER_LIST_PAGE_SIZE,
      take: DOSSIER_LIST_PAGE_SIZE,
      include: {
        client: true,
        avocatResponsable: { select: { nom: true } },
      },
    }),
    prisma.dossier.count({ where }),
    prisma.dossier.groupBy({
      by: ["statut"],
      where,
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
  ]);

  const actifsCount =
    (stats.find((s) => s.statut === "actif")?._count ?? 0) +
    (stats.find((s) => s.statut === "ouvert")?._count ?? 0);
  const cloturesCount =
    (stats.find((s) => s.statut === "cloture")?._count ?? 0) +
    (stats.find((s) => s.statut === "archive")?._count ?? 0);

  const totalActes = acteStats.reduce((s, g) => s + g._count, 0);
  const actesEnCours = acteStats.find((g) => g.status === "inprogress")?._count ?? 0;
  const actesTermines = acteStats.find((g) => g.status === "done")?._count ?? 0;
  const actesUrgentsCount = await prisma.dossierActe.count({
    where: {
      dossier: { cabinetId },
      status: { not: "done" },
      deadline: { lte: today },
    },
  });

  const canCreate = canManageDossiers(role as UserRole);

  // Taxonomie configurée du cabinet → sujets/sous-matières + numérotation par
  // préfixe dans le modal de création (comme la page /dossiers/nouveau).
  const locale = await getLocale();
  const [taxonomyOptions, cabinetBillingMode] = await Promise.all([
    getCabinetDossierTaxonomyOptions(cabinetId, locale),
    getCabinetBillingMode(cabinetId),
  ]);

  const exportParams = new URLSearchParams();
  if (params.q) exportParams.set("q", params.q);
  if (params.clientId) exportParams.set("clientId", params.clientId);
  if (params.status) exportParams.set("status", params.status);
  if (params.type) exportParams.set("type", params.type);
  const exportHref = `/api/dossiers/export?${exportParams.toString()}`;

  return (
    <div className="space-y-6 animate-fade-in">
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
              />
            )}
          </div>
        }
      />
      <DossierSummaryCards
        totalDossiers={totalCount}
        actifsCount={actifsCount}
        cloturesCount={cloturesCount}
        totalActes={totalActes}
        actesEnCours={actesEnCours}
        actesUrgents={actesUrgentsCount}
        actesTermines={actesTermines}
      />
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-si-line px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>{t("matterList")}</CardTitle>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <DossierSearchBar />
            <DossierFilters clients={clients} />
          </div>
        </div>
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
            />
            <DossierPagination
              totalCount={totalCount}
              currentPage={page}
              pageSize={DOSSIER_LIST_PAGE_SIZE}
            />
          </>
        )}
      </Card>
    </div>
  );
}
