import type { Prisma } from "@prisma/client";

export type DocumentActor = { cabinetId: string; userId: string; role: string };

/** Même frontière pour pages, API et actions serveur. Refus par défaut. */
export function dossierDocumentScope(actor: DocumentActor): Prisma.DossierWhereInput {
  const allowed = ["admin_cabinet", "assistante", "avocat"].includes(actor.role);
  return {
    cabinetId: actor.cabinetId,
    client: { cabinetId: actor.cabinetId },
    ...(!allowed ? { id: { in: [] } } : {}),
    ...(actor.role === "avocat" ? { avocatResponsableId: actor.userId } : {}),
  };
}

export function richDocumentScope(actor: DocumentActor): Prisma.RichDocumentWhereInput {
  return {
    cabinetId: actor.cabinetId,
    client: { cabinetId: actor.cabinetId },
    dossier: dossierDocumentScope(actor),
  };
}

export function uploadedDocumentScope(actor: DocumentActor): Prisma.DocumentWhereInput {
  return {
    cabinetId: actor.cabinetId,
    ...(!["admin_cabinet", "assistante", "avocat"].includes(actor.role) ? { id: { in: [] } } : {}),
    OR: [
      { dossier: dossierDocumentScope(actor) },
      { dossierId: null, client: { cabinetId: actor.cabinetId } },
      { dossierId: null, clientId: null, uploadedById: actor.userId },
    ],
  };
}
