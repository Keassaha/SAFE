import { prisma } from "@/lib/db";

/**
 * Durée de conservation (années) applicable à un dossier, lue depuis la
 * configuration du cabinet (CabinetInterface.modules.pipeda.retention[type]).
 *
 * MÊME source que la lettre de fermeture (app/api/documents/closure-letter)
 * afin que la date stockée corresponde exactement à ce que la lettre annonce
 * au client. Défaut prudent : 7 ans (Barreau B-1 r.5 / minima connus).
 */
export async function getRetentionYears(
  cabinetId: string,
  dossierType: string | null,
): Promise<number> {
  const intf = await prisma.cabinetInterface.findUnique({
    where: { cabinetId },
    select: { modules: true },
  });
  if (intf?.modules) {
    try {
      const mods = JSON.parse(intf.modules);
      const map = mods?.pipeda?.retention as Record<string, number> | undefined;
      if (map) {
        return map[dossierType ?? "default"] ?? map.default ?? 7;
      }
    } catch {
      /* configuration illisible : on garde le défaut prudent */
    }
  }
  return 7;
}

/** Date de fin de conservation = date de fermeture + durée applicable. */
export async function computeRetentionUntil(
  cabinetId: string,
  dossierType: string | null,
  from: Date,
): Promise<Date> {
  const years = await getRetentionYears(cabinetId, dossierType);
  const until = new Date(from);
  until.setFullYear(until.getFullYear() + years);
  return until;
}
