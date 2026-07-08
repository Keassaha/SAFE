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
    /**
     * Vue active : quand aucun statut n'est explicitement filtré, masque les
     * dossiers clôturés/archivés (ils restent accessibles via le filtre de statut).
     * Utilisé pour la LISTE ; les statistiques comptent tous les statuts.
     */
    excludeClosedByDefault?: boolean;
    /** Filtres avancés (Lot A) — plage de dates d'ouverture (ISO). */
    dateFrom?: string | null;
    dateTo?: string | null;
    /** N'affiche que les dossiers avec au moins une tâche non terminée et échue. */
    overdueTasks?: boolean | null;
    /**
     * Date de référence pour « échue » (passée par l'appelant, jamais `new Date()`
     * ici : le builder doit rester pur et déterministe).
     */
    now?: Date | null;
    /** Fiducie : "positive" (solde > 0), "negative" (solde < 0), sinon ignoré. */
    trust?: string | null;
  }
): Prisma.DossierWhereInput {
  const {
    q,
    clientId,
    status,
    type,
    lawyer,
    restrictToUserId,
    excludeClosedByDefault,
    dateFrom,
    dateTo,
    overdueTasks,
    now,
    trust,
  } = filters;
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
  } else if (excludeClosedByDefault) {
    // Vue active par défaut : on masque clôturés + archivés.
    where.statut = { notIn: ["cloture", "archive"] };
  }

  if (
    type?.trim() &&
    ["droit_famille", "litige_civil", "criminel", "immigration", "immobilier", "corporate", "autre"].includes(
      type
    )
  ) {
    where.type = type as
      | "droit_famille"
      | "litige_civil"
      | "criminel"
      | "immigration"
      | "immobilier"
      | "corporate"
      | "autre";
  }

  if (lawyer?.trim() && !restrictToUserId) {
    where.avocatResponsableId = lawyer.trim();
  }

  // Plage de dates d'ouverture. Borne haute inclusive (fin de journée).
  const from = dateFrom?.trim() ? new Date(dateFrom.trim()) : null;
  const to = dateTo?.trim() ? new Date(dateTo.trim()) : null;
  const validFrom = from && !Number.isNaN(from.getTime()) ? from : null;
  const validTo = to && !Number.isNaN(to.getTime()) ? to : null;
  // Si les bornes sont incohérentes (from > to), on ignore la plage.
  if (validFrom && validTo && validFrom > validTo) {
    // no-op : plage invalide, ignorée.
  } else {
    const range: Prisma.DateTimeFilter = {};
    if (validFrom) range.gte = validFrom;
    if (validTo) {
      const end = new Date(validTo);
      end.setHours(23, 59, 59, 999);
      range.lte = end;
    }
    if (range.gte || range.lte) {
      where.dateOuverture = range;
    }
  }

  // Tâches en retard : au moins une DossierTache non terminée/annulée et échue.
  if (overdueTasks && now) {
    where.taches = {
      some: {
        statut: { notIn: ["terminee", "annulee"] },
        dateEcheance: { lt: now },
      },
    };
  }

  // Fiducie : solde positif ou négatif (signal de conformité).
  if (trust === "positive") {
    where.soldeFiducieDossier = { gt: 0 };
  } else if (trust === "negative") {
    where.soldeFiducieDossier = { lt: 0 };
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
