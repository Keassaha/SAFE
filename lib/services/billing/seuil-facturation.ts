import { prisma } from "@/lib/db";
import { getSeuilFacturation, parseCabinetConfig } from "@/lib/cabinet-config";

/**
 * Lit le seuil de facturation d'un cabinet, en dollars taxes comprises.
 *
 * Un seul point de lecture pour l'écran et le serveur : la section
 * « Honoraires à facturer », la vue détail d'un client et la création d'un
 * brouillon regardent tous ce chiffre-ci, jamais une constante locale.
 */
export async function getSeuilFacturationById(cabinetId: string): Promise<number> {
  const cabinet = await prisma.cabinet.findUnique({
    where: { id: cabinetId },
    select: { config: true },
  });
  return getSeuilFacturation(parseCabinetConfig(cabinet?.config ?? null));
}
