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

  return (
    <DossierAtelierView
      dossier={dossier as any}
      currentUserId={session.userId}
    />
  );
}
