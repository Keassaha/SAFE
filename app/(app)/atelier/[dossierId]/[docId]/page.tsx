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
    />
  );
}
