import { cache } from "react";
import { prisma } from "@/lib/db";

/**
 * Sidebar counts — real-time aggregates per cabinet.
 *
 * Rendered next to each nav label in Éditorial Chaleureux sidebar:
 *   [Icon black]  [Label black]              [count forest green]
 *
 * Counts are cabinet-scoped and filtered to "live" states only:
 *   - clients:     status = actif
 *   - dossiers:    statut ∈ { ouvert, actif, en_attente }
 *   - facturation: statut ∈ { brouillon, envoyee, partiellement_payee, en_retard }
 *                  (excludes `payee` — paid invoices don't belong in a "todo" count)
 *
 * Cached per-request via React.cache so layout + children server components
 * that need the same counts don't each open a new connection.
 */

export interface SidebarCounts {
  clients: number;
  dossiers: number;
  facturation: number;
  /** Messages de Navette qui attendent l'utilisateur courant (non résolus). */
  navetteNeedsMe: number;
}

export const getSidebarCounts = cache(
  async (cabinetId: string, userId?: string): Promise<SidebarCounts> => {
    const [clients, dossiers, facturation, navetteNeedsMe] = await Promise.all([
      prisma.client.count({
        where: {
          cabinetId,
          status: "actif",
        },
      }),
      prisma.dossier.count({
        where: {
          cabinetId,
          statut: { in: ["ouvert", "actif", "en_attente"] },
        },
      }),
      prisma.invoice.count({
        where: {
          cabinetId,
          statut: {
            in: ["brouillon", "envoyee", "partiellement_payee", "en_retard"],
          },
        },
      }),
      userId
        ? prisma.dossierNavetteMessage.count({
            where: { cabinetId, recipientId: userId, resolvedAt: null },
          })
        : Promise.resolve(0),
    ]);

    return { clients, dossiers, facturation, navetteNeedsMe };
  }
);
