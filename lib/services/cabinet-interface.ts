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

export type CabinetBillingMode = "forfait" | "horaire" | "mixed";

export interface CabinetInterfaceDerived {
  billingMode: CabinetBillingMode;
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
    let billingMode: CabinetBillingMode = "horaire";
    let activeNavIds: string[] | null = null;
    let hiddenNavIds: string[] = [];

    if (config?.modules) {
      try {
        const modules = JSON.parse(config.modules);
        const principal = modules?.facturation?.principal;
        if (principal === "forfait") billingMode = "forfait";
        else if (principal === "mixed" || principal === "mixte") billingMode = "mixed";
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

export async function getCabinetBillingMode(
  cabinetId: string
): Promise<CabinetBillingMode> {
  const { billingMode } = await getCabinetInterfaceDerived(cabinetId);
  return billingMode;
}
