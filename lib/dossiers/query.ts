import type { Prisma } from "@prisma/client";

/** Nombre de dossiers par page (liste et export). */
export const DOSSIER_LIST_PAGE_SIZE = 20;

export function buildDossierListWhere(
  cabinetId: string,
  filters: {
    q?: string | null;
    clientId?: string | null;
    status?: string | null;
    type?: string | null;
    lawyer?: string | null;
    /** When set (e.g. for LAWYER role), only dossiers where avocatResponsableId = this user. */
    restrictToUserId?: string | null;
  }
): Prisma.DossierWhereInput {
  const { q, clientId, status, type, lawyer, restrictToUserId } = filters;
  const where: Prisma.DossierWhereInput = { cabinetId };

  if (restrictToUserId?.trim()) {
    where.avocatResponsableId = restrictToUserId.trim();
  }

  if (clientId?.trim()) {
    where.clientId = clientId.trim();
  }

  if (q?.trim()) {
    const term = q.trim();
    where.OR = [
      { reference: { contains: term } },
      { numeroDossier: { contains: term } },
      { intitule: { contains: term } },
      { client: { raisonSociale: { contains: term } } },
      { client: { prenom: { contains: term } } },
      { client: { nom: { contains: term } } },
    ];
  }

  if (status?.trim() && ["ouvert", "actif", "en_attente", "cloture", "archive"].includes(status)) {
    where.statut = status as "ouvert" | "actif" | "en_attente" | "cloture" | "archive";
  }

  if (
    type?.trim() &&
    ["droit_famille", "litige_civil", "criminel", "immigration", "corporate", "autre"].includes(
      type
    )
  ) {
    where.type = type as
      | "droit_famille"
      | "litige_civil"
      | "criminel"
      | "immigration"
      | "corporate"
      | "autre";
  }

  if (lawyer?.trim() && !restrictToUserId) {
    where.avocatResponsableId = lawyer.trim();
  }

  return where;
}

export type DossierSortField =
  | "reference"
  | "intitule"
  | "statut"
  | "dateOuverture"
  | "updatedAt"
  | "avocatResponsable";

export type DossierSortOrder = "asc" | "desc";

export function getDossierListOrderBy(
  sortBy: DossierSortField,
  sortOrder: DossierSortOrder
): Prisma.DossierOrderByWithRelationInput[] {
  if (sortBy === "avocatResponsable") {
    return [{ avocatResponsable: { nom: sortOrder } }];
  }
  return [{ [sortBy]: sortOrder }];
}
