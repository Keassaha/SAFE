import { requireCabinetAndUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { DocumentEditor } from "@/components/atelier/DocumentEditor";

interface Props {
  params: Promise<{ dossierId: string; docId: string }>;
}

export default async function DocumentEditorPage({ params }: Props) {
  const { dossierId, docId } = await params;
  const session = await requireCabinetAndUser();
  if (!session) notFound();

  // Tous les dossiers du cabinet pour Move + classification
  const allDossiers = await prisma.dossier.findMany({
    where: { cabinetId: session.cabinetId, statut: { not: "cloture" } },
    include: { client: { select: { raisonSociale: true } } },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  const doc = await prisma.richDocument.findFirst({
    where: {
      id: docId,
      dossierId: dossierId,
      cabinetId: session.cabinetId,
      isArchived: false,
    },
    include: {
      dossier: {
        select: {
          id: true,
          intitule: true,
          numeroDossier: true,
          tauxHoraire: true,
          modeFacturation: true,
        },
      },
      client: { select: { id: true, raisonSociale: true } },
    },
  });

  if (!doc) notFound();

  // Session de travail active sur ce document pour cet user
  const activeSession = await prisma.workSession.findFirst({
    where: {
      richDocumentId: docId,
      userId: session.userId,
      cabinetId: session.cabinetId,
      statut: "en_cours",
    },
  });

  return (
    <DocumentEditor
      doc={doc as any}
      activeSession={activeSession as any}
      currentUserId={session.userId}
      allDossiers={allDossiers.map((d) => ({
        id: d.id,
        intitule: d.intitule,
        clientNom: d.client.raisonSociale ?? "Sans nom",
        numeroDossier: d.numeroDossier,
      }))}
    />
  );
}
