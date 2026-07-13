/**
 * Création d'un mandat éditable (RichDocument type="mandat") avec sa version
 * initiale et son entrée au cahier du dossier. Partagé par la création à partir
 * du gabarit et par l'import d'un mandat existant (.docx / PDF / texte collé).
 */
import { prisma } from "@/lib/db";
import { createDocketEntryForRichDocument } from "@/lib/dossiers/docket-service";
import type { Dossier } from "@prisma/client";

type DossierForMandat = Pick<Dossier, "id" | "clientId" | "cabinetId" | "type" | "sousType"> & {
  sections: { sectionKey: string }[];
};

export async function createMandatRichDocument(params: {
  cabinetId: string;
  userId: string;
  dossier: DossierForMandat;
  titre: string;
  content: string;
  versionLabel: string;
}): Promise<{ id: string; titre: string }> {
  const { cabinetId, userId, dossier, titre, content, versionLabel } = params;

  const doc = await prisma.richDocument.create({
    data: {
      cabinetId,
      dossierId: dossier.id,
      clientId: dossier.clientId,
      createdById: userId,
      lastEditedById: userId,
      lastEditedAt: new Date(),
      titre,
      type: "mandat",
      content,
    },
  });

  await prisma.richDocumentVersion.create({
    data: {
      richDocumentId: doc.id,
      cabinetId,
      createdById: userId,
      content,
      versionNumber: 1,
      label: versionLabel,
    },
  });

  await createDocketEntryForRichDocument({
    dossier,
    richDocument: doc,
    availableSectionKeys: dossier.sections.map((s) => s.sectionKey),
    createdById: userId,
  });

  return { id: doc.id, titre: doc.titre };
}
