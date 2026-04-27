import { prisma } from "@/lib/db";
import type { DossierType } from "@prisma/client";
import { getCartableTemplate } from "./cartable-templates";

export async function generateCartable(
  dossierId: string,
  cabinetId: string,
  type: DossierType | null | undefined
): Promise<void> {
  const sections = getCartableTemplate(type);

  await prisma.dossierSection.createMany({
    data: sections.map((s) => ({
      dossierId,
      cabinetId,
      sectionKey: s.sectionKey,
      label: s.label,
      ordre: s.ordre,
      origine: "template",
      sourceReglementaire: s.sourceReglementaire ?? null,
      icone: s.icone ?? null,
      description: s.description ?? null,
      privilegiee: s.privilegiee ?? false,
    })),
  });
}

export async function getDossierSections(dossierId: string, cabinetId: string) {
  return prisma.dossierSection.findMany({
    where: { dossierId, cabinetId, archive: false },
    orderBy: { ordre: "asc" },
    select: {
      id: true,
      sectionKey: true,
      label: true,
      ordre: true,
      origine: true,
      sourceReglementaire: true,
      icone: true,
      description: true,
      privilegiee: true,
    },
  });
}
