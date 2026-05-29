/**
 * Chargement (serveur) de la config taxes d'un cabinet depuis la base.
 *
 * Pont entre Prisma et le module pur `lib/billing/taxes.ts`. Lit
 * `CabinetInterface.modules.facturation.taxes` et retombe sur la province
 * de facturation du client (ou QC) si la config est absente/malformée.
 */
import { prisma } from "@/lib/db";
import { getCabinetTaxConfig } from "./taxes";
import type { CabinetTaxConfig } from "./types";
import type { Prisma, PrismaClient } from "@prisma/client";

type DbClient = PrismaClient | Prisma.TransactionClient;

export async function getCabinetTaxConfigById(
  cabinetId: string,
  client: DbClient = prisma,
  fallbackProvince: string | null | undefined = "QC",
): Promise<CabinetTaxConfig> {
  // Défensif : certains clients de transaction (ou mocks de test partiels)
  // n'exposent pas le délégué `cabinetInterface`. Dans ce cas on retombe
  // proprement sur la config par défaut de la province plutôt que de planter.
  let modules: unknown = null;
  if (client?.cabinetInterface?.findUnique) {
    const iface = await client.cabinetInterface.findUnique({
      where: { cabinetId },
      select: { modules: true },
    });
    try {
      modules = iface?.modules ? JSON.parse(iface.modules) : null;
    } catch {
      modules = null;
    }
  }
  return getCabinetTaxConfig(modules, fallbackProvince);
}
