import type { Prisma } from "@prisma/client";

/** Nombre de clients par page (liste et export). */
export const CLIENT_LIST_PAGE_SIZE = 20;

export function buildClientListWhere(
  cabinetId: string,
  filters: {
    q?: string | null;
    status?: string | null;
    type?: string | null;
  }
): Prisma.ClientWhereInput {
  const { q, status, type } = filters;
  const where: Prisma.ClientWhereInput = { cabinetId };
  const orConditions: Prisma.ClientWhereInput["OR"] = [];
  if (q?.trim()) {
    orConditions.push(
      { raisonSociale: { contains: q.trim() } },
      { prenom: { contains: q.trim() } },
      { nom: { contains: q.trim() } },
      { email: { contains: q.trim() } },
      { telephone: { contains: q.trim() } },
      { contact: { contains: q.trim() } }
    );
  }
  if (orConditions.length > 0) where.OR = orConditions;
  if (status && ["actif", "inactif", "archive"].includes(status)) {
    where.status = status as "actif" | "inactif" | "archive";
  }
  if (type && ["personne_physique", "personne_morale"].includes(type)) {
    where.typeClient = type as "personne_physique" | "personne_morale";
  }
  return where;
}

export type ClientSortField = "raisonSociale" | "status" | "updatedAt" | "trustAccountBalance" | "assignedLawyer";
export type ClientSortOrder = "asc" | "desc";

export function getClientListOrderBy(
  sortBy: ClientSortField,
  sortOrder: ClientSortOrder
): Prisma.ClientOrderByWithRelationInput[] {
  if (sortBy === "assignedLawyer") {
    return [{ assignedLawyer: { nom: sortOrder } }];
  }
  return [{ [sortBy]: sortOrder }];
}
