import { cache } from "react";
import { prisma } from "@/lib/db";

/**
 * Cached per-request fetch of the cabinet's interface config.
 * React cache() dedupes calls within a single server render so layout + pages
 * don't each open a new Prisma connection for the same cabinetId.
 */
export const getCabinetInterface = cache(async (cabinetId: string) => {
  return prisma.cabinetInterface.findUnique({
    where: { cabinetId },
    select: { modules: true, ongletsActifs: true, ongletsMasques: true },
  });
});

export interface CabinetInterfaceDerived {
  billingMode: "forfait" | "horaire";
  activeNavIds: string[] | null;
  hiddenNavIds: string[];
}

/**
 * Derived convenience wrapper — parses JSON modules + onglet arrays once
 * and caches the parsed result per-request alongside the raw fetch.
 */
export const getCabinetInterfaceDerived = cache(
  async (cabinetId: string): Promise<CabinetInterfaceDerived> => {
    const config = await getCabinetInterface(cabinetId);
    let billingMode: "forfait" | "horaire" = "horaire";
    let activeNavIds: string[] | null = null;
    let hiddenNavIds: string[] = [];

    if (config?.modules) {
      try {
        const modules = JSON.parse(config.modules);
        if (modules?.facturation?.principal === "forfait") billingMode = "forfait";
      } catch {
        /* ignore parse errors */
      }
    }
    if (config?.ongletsActifs) {
      try {
        const parsed = JSON.parse(config.ongletsActifs);
        if (Array.isArray(parsed) && parsed.length > 0) activeNavIds = parsed;
      } catch {
        /* ignore */
      }
    }
    if (config?.ongletsMasques) {
      try {
        const parsed = JSON.parse(config.ongletsMasques);
        if (Array.isArray(parsed)) hiddenNavIds = parsed;
      } catch {
        /* ignore */
      }
    }

    return { billingMode, activeNavIds, hiddenNavIds };
  }
);
