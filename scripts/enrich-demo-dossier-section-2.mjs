/**
 * Complète le dossier de démonstration utilisé par le mouvement 2 de la vitrine.
 *
 * Usage : node --env-file=.env.local scripts/enrich-demo-dossier-section-2.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const NUMERO_DOSSIER = "2026-028";
const ECHEANCE = new Date("2026-09-03T14:00:00.000Z");
const TITRE_TACHE = "Préparer le projet de demande et vérifier les renseignements financiers";
const NOTE =
  "Note de travail : préparer le projet de demande et vérifier les renseignements financiers avant la rencontre avec le client.";

async function main() {
  const dossier = await prisma.dossier.findFirst({
    where: { numeroDossier: NUMERO_DOSSIER },
    select: {
      id: true,
      cabinetId: true,
      assistantJuridiqueId: true,
      avocatResponsableId: true,
    },
  });
  if (!dossier) throw new Error(`Dossier de démonstration ${NUMERO_DOSSIER} introuvable.`);

  const [assistante, avocate] = await Promise.all([
    prisma.user.findFirst({
      where: { cabinetId: dossier.cabinetId, role: "assistante" },
      select: { id: true, nom: true },
    }),
    dossier.avocatResponsableId
      ? prisma.user.findUnique({ where: { id: dossier.avocatResponsableId }, select: { id: true, nom: true } })
      : null,
  ]);
  if (!assistante || !avocate) throw new Error("Le duo de démonstration est incomplet.");

  await prisma.$transaction(async (tx) => {
    let aChange = false;
    if (!dossier.assistantJuridiqueId) {
      await tx.dossier.update({
        where: { id: dossier.id },
        data: { assistantJuridiqueId: assistante.id },
      });
      aChange = true;
    }

    const [note, evenement, tache, navette] = await Promise.all([
      tx.dossierNote.findFirst({ where: { dossierId: dossier.id, content: NOTE }, select: { id: true } }),
      tx.dossierEvenement.findFirst({
        where: { dossierId: dossier.id, titre: "Échéance : transmission des renseignements financiers" },
        select: { id: true },
      }),
      tx.dossierTache.findFirst({ where: { dossierId: dossier.id, titre: TITRE_TACHE }, select: { id: true } }),
      tx.dossierNavetteMessage.findFirst({
        where: { cabinetId: dossier.cabinetId, sourceRef: "demo:2026-028:note-interne" },
        select: { id: true },
      }),
    ]);

    if (!note) {
      await tx.dossierNote.create({
        data: { dossierId: dossier.id, createdById: assistante.id, typeNote: "note_interne", content: NOTE },
      });
      aChange = true;
    }
    if (!evenement) {
      await tx.dossierEvenement.create({
        data: {
          dossierId: dossier.id,
          type: "echeance",
          titre: "Échéance : transmission des renseignements financiers",
          date: ECHEANCE,
          notes: "Échéance préparatoire suivie avec l’adjointe.",
        },
      });
      aChange = true;
    }
    if (!tache) {
      await tx.dossierTache.create({
        data: {
          dossierId: dossier.id,
          titre: TITRE_TACHE,
          description: "Préparer le projet de demande et confirmer les renseignements requis avant l’échéance.",
          assigneeId: assistante.id,
          priorite: "high",
          statut: "en_cours",
          dateEcheance: ECHEANCE,
        },
      });
      aChange = true;
    }
    if (!navette) {
      await tx.dossierNavetteMessage.create({
        data: {
          cabinetId: dossier.cabinetId,
          dossierId: dossier.id,
          authorId: assistante.id,
          authorRole: "assistante",
          recipientId: avocate.id,
          type: "question",
          body: NOTE,
          dueDate: ECHEANCE,
          sourceRef: "demo:2026-028:note-interne",
        },
      });
      aChange = true;
    }

    if (aChange) {
      await tx.auditLog.create({
        data: {
          cabinetId: dossier.cabinetId,
          userId: assistante.id,
          entityType: "Dossier",
          entityId: dossier.id,
          action: "update",
          metadata: JSON.stringify({
            source: "demo-section-2",
            changes: ["assistant_assignment", "internal_note", "deadline", "task"],
          }),
          performedBy: assistante.nom,
        },
      });
    }
  });

  const verification = await prisma.dossier.findUniqueOrThrow({
    where: { id: dossier.id },
    select: {
      numeroDossier: true,
      intitule: true,
      assistantJuridique: { select: { nom: true } },
      _count: { select: { notes: true, taches: true, evenements: true, navetteMessages: true } },
    },
  });
  console.log(JSON.stringify(verification, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
