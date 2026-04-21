import { requireCabinetAndUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { DossierAtelierView } from "@/components/atelier/DossierAtelierView";

interface Props {
  params: Promise<{ dossierId: string }>;
}

export default async function DossierAtelierPage({ params }: Props) {
  const { dossierId } = await params;
  const session = await requireCabinetAndUser();
  if (!session) notFound();

  const { cabinetId } = session;

  const dossier = await prisma.dossier.findFirst({
    where: { id: dossierId, cabinetId },
    include: {
      client: { select: { id: true, raisonSociale: true } },
      richDocuments: {
        where: { isArchived: false },
        include: {
          createdBy: { select: { nom: true } },
          lastEditedBy: { select: { nom: true } },
          _count: { select: { versions: true } },
        },
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!dossier) notFound();

  // Tous les dossiers du cabinet pour la classification IA (upload peut aller dans n'importe quel dossier)
  const allDossiers = await prisma.dossier.findMany({
    where: { cabinetId, statut: { not: "cloture" } },
    include: { client: { select: { raisonSociale: true } } },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return (
    <DossierAtelierView
      dossier={dossier as any}
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
