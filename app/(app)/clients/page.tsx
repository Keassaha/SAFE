import Link from "next/link";
import type { UserRole } from "@prisma/client";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { routes } from "@/lib/routes";
import { prisma } from "@/lib/db";
import { buildClientListWhere, getClientListOrderBy, CLIENT_LIST_PAGE_SIZE } from "@/lib/clients/query";
import type { ClientSortField, ClientSortOrder } from "@/lib/clients/query";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { canCreateClients, canEditClients, canManageClients, canViewClients } from "@/lib/auth/permissions";
import { ClientSummaryCards } from "@/components/clients/registry/ClientSummaryCards";
import { ClientSearchBar } from "@/components/clients/registry/ClientSearchBar";
import { ClientFilters } from "@/components/clients/registry/ClientFilters";
import { ClientTable } from "@/components/clients/registry/ClientTable";
import { ClientPagination } from "@/components/clients/registry/ClientPagination";
import { ClientSuccessBanner } from "@/components/clients/registry/ClientSuccessBanner";
import type { ClientRow } from "@/components/clients/registry/ClientTable";
import { Download } from "lucide-react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

const SORT_FIELDS: ClientSortField[] = ["raisonSociale", "status", "updatedAt", "trustAccountBalance", "assignedLawyer"];

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    type?: string;
    lawyer?: string;
    page?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}) {
  const t = await getTranslations("clients");
  const tc = await getTranslations("common");
  const { cabinetId, role } = await requireCabinetAndUser();
  if (!canViewClients(role as UserRole)) {
    notFound();
  }
  const params = await searchParams;
  const { q, status, type } = params;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const sortBy: ClientSortField = SORT_FIELDS.includes(params.sortBy as ClientSortField)
    ? (params.sortBy as ClientSortField)
    : "raisonSociale";
  const sortOrder: ClientSortOrder =
    params.sortOrder === "desc" ? "desc" : "asc";

  const where = buildClientListWhere(cabinetId, { q, status, type });
  const orderBy = getClientListOrderBy(sortBy, sortOrder);

  const [clients, totalCount, stats] = await Promise.all([
    prisma.client.findMany({
      where,
      orderBy,
      skip: (page - 1) * CLIENT_LIST_PAGE_SIZE,
      take: CLIENT_LIST_PAGE_SIZE,
      include: {
        assignedLawyer: { select: { nom: true } },
        _count: { select: { dossiers: true } },
      },
    }),
    prisma.client.count({ where }),
    prisma.client.groupBy({
      by: ["status"],
      where: { cabinetId },
      _count: true,
    }),
  ]);

  const totalClients = stats.reduce((s, g) => s + g._count, 0);
  const activeClients = stats.find((g) => g.status === "actif")?._count ?? 0;
  const activeCasesResult = await prisma.dossier.count({
    where: { cabinetId, statut: "actif" },
  });
  const unbilledAmount =
    (await prisma.client.aggregate({ where: { cabinetId }, _sum: { trustAccountBalance: true } }))
      ._sum.trustAccountBalance ?? 0;

  const rows: ClientRow[] = clients.map((c) => ({
    id: c.id,
    typeClient: c.typeClient,
    status: c.status,
    raisonSociale: c.raisonSociale,
    prenom: c.prenom,
    nom: c.nom,
    email: c.email,
    telephone: c.telephone,
    langue: c.langue,
    trustAccountBalance: c.trustAccountBalance,
    assignedLawyerNom: c.assignedLawyer?.nom ?? null,
    dossiersActifsCount: c._count.dossiers,
    lastActivityAt: c.updatedAt,
  }));

  const canCreate = canCreateClients(role as UserRole);
  const canEdit = canEditClients(role as UserRole);
  const canArchive = canManageClients(role as UserRole);

  const exportHref =
    "/api/clients/export?" +
    new URLSearchParams({
      ...(q ? { q } : {}),
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
    }).toString();

  return (
    <div className="space-y-6 animate-fade-in">
      <ClientSuccessBanner />
      <PageHeader
        title={t("registryTitle")}
        description={t("manageClientsDesc")}
        action={
          <div className="flex items-center gap-2">
            <Link href={exportHref} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" type="button">
                <Download className="w-4 h-4 mr-2 inline-block" aria-hidden />
                {tc("export")} CSV
              </Button>
            </Link>
            {canCreate && (
              <Link href={routes.clientNouveau}>
                <Button>+ {t("newClient")}</Button>
              </Link>
            )}
          </div>
        }
      />

      <ClientSummaryCards
        totalClients={totalClients}
        activeClients={activeClients}
        activeCasesCount={activeCasesResult}
        unbilledAmount={unbilledAmount}
      />

      <Card>
        <CardHeader
          title={t("clientList")}
          action={
            <div className="flex flex-wrap items-center gap-3">
              <ClientSearchBar />
              <ClientFilters />
            </div>
          }
        />
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <EmptyState
              title={t("noClients")}
              description={t("createFirstClient")}
              action={
                canCreate ? (
                  <Link href={routes.clientNouveau}>
                    <Button>{t("newClient")}</Button>
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <>
              <ClientTable
                clients={rows}
                canEdit={canEdit}
                canArchive={canArchive}
                sortBy={sortBy}
                sortOrder={sortOrder}
              />
              <ClientPagination
                totalCount={totalCount}
                currentPage={page}
                pageSize={CLIENT_LIST_PAGE_SIZE}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
