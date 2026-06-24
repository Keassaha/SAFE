import { prisma } from "@/lib/db";
import { createNavetteMessage } from "@/lib/navette/navette-service";

const URGENT_WINDOW_DAYS = 3;

/** Seuil d'urgence : une échéance strictement avant ce point est « urgente ». */
export function urgentThreshold(now: Date, windowDays = URGENT_WINDOW_DAYS): Date {
  const t = new Date(now);
  t.setDate(t.getDate() + windowDays);
  return t;
}

/**
 * Émet un signal navette « acte urgent » pour chaque acte (LexTrack) non terminé
 * dont l'échéance est dans moins de 3 jours ou déjà dépassée, vers son assigné(e).
 *
 * IDEMPOTENT (règle du silence) : un acte ne déclenche qu'UN signal, jamais
 * réémis (déduplication sur `sourceRef = "acte:{id}"`, qu'il soit résolu ou non).
 * L'acte reste de toute façon visible dans LexTrack et dans le focus de /aujourd'hui.
 *
 * Émission système (scan d'échéances) : authorRole = "admin_cabinet", auteur =
 * l'avocat responsable du dossier (ou l'assigné à défaut). Best-effort par acte.
 * Retourne le nombre de signaux émis.
 */
export async function detectAndEmitUrgentActes(cabinetId: string, now: Date): Promise<number> {
  const threshold = urgentThreshold(now);

  const actes = await prisma.dossierActe.findMany({
    where: {
      status: { not: "done" },
      deadline: { lt: threshold },
      dossier: { cabinetId },
    },
    select: {
      id: true,
      title: true,
      deadline: true,
      assigneeId: true,
      dossierId: true,
      dossier: { select: { avocatResponsableId: true } },
    },
  });
  if (actes.length === 0) return 0;

  // Déduplication : actes ayant déjà un signal acte_urgent (résolu ou non).
  const sourceRefs = actes.map((a) => `acte:${a.id}`);
  const existing = await prisma.dossierNavetteMessage.findMany({
    where: { cabinetId, type: "acte_urgent", sourceRef: { in: sourceRefs } },
    select: { sourceRef: true },
  });
  const alreadySignaled = new Set(existing.map((e) => e.sourceRef));

  let emitted = 0;
  for (const acte of actes) {
    const sourceRef = `acte:${acte.id}`;
    if (alreadySignaled.has(sourceRef)) continue;
    try {
      const res = await createNavetteMessage({
        cabinetId,
        dossierId: acte.dossierId,
        authorId: acte.dossier.avocatResponsableId ?? acte.assigneeId,
        authorRole: "admin_cabinet", // émission système (scan d'échéances)
        type: "acte_urgent",
        recipientId: acte.assigneeId,
        body: acte.title,
        dueDate: acte.deadline,
        sourceRef,
      });
      if (res.ok) emitted++;
    } catch {
      // best-effort : un acte qui échoue n'interrompt pas le scan
    }
  }
  return emitted;
}
