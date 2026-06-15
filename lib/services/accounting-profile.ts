/**
 * Persistance du profil comptable du cabinet (doctrine §10 + SOP §4-5).
 *
 * Stocké dans `CabinetInterface.modules.comptabilite.profil` (JSON), cohérent avec
 * la config taxe (`modules.facturation.taxes`). Aucune migration : on réutilise le
 * champ JSON existant et on prend soin de NE PAS écraser les autres modules.
 */

import { prisma } from "@/lib/db";
import {
  deriveAccountingProfile,
  type AccountingProfileInput,
  type AccountingProfileConfig,
} from "@/lib/accounting/profil-cabinet";

export interface StoredAccountingProfile {
  input: AccountingProfileInput;
  config: AccountingProfileConfig;
}

function parseModules(raw: string | null | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/** Lit le profil comptable persisté + sa configuration dérivée (null si absent). */
export async function getAccountingProfile(
  cabinetId: string,
): Promise<StoredAccountingProfile | null> {
  const iface = await prisma.cabinetInterface.findUnique({
    where: { cabinetId },
    select: { modules: true },
  });
  const modules = parseModules(iface?.modules);
  const comptabilite = modules.comptabilite as { profil?: AccountingProfileInput } | undefined;
  const input = comptabilite?.profil;
  if (!input) return null;
  return { input, config: deriveAccountingProfile(input) };
}

/**
 * Enregistre (ou met à jour) le profil comptable. Fusionne dans le JSON `modules`
 * sans toucher aux autres clés (facturation, conformité, etc.).
 */
export async function saveAccountingProfile(
  cabinetId: string,
  input: AccountingProfileInput,
): Promise<AccountingProfileConfig> {
  const existing = await prisma.cabinetInterface.findUnique({
    where: { cabinetId },
    select: { modules: true },
  });
  const modules = parseModules(existing?.modules);
  const comptabilite = (modules.comptabilite as Record<string, unknown>) ?? {};
  modules.comptabilite = { ...comptabilite, profil: input };
  const json = JSON.stringify(modules);

  await prisma.cabinetInterface.upsert({
    where: { cabinetId },
    create: { cabinetId, modules: json },
    update: { modules: json },
  });

  return deriveAccountingProfile(input);
}
