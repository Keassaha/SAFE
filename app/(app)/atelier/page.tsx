import { requireCabinetAndUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import { AtelierView } from "@/components/atelier/AtelierView";
import { notFound } from "next/navigation";

export default async function AtelierPage() {
  const session = await requireCabinetAndUser();
  if (!session) notFound();

  const { cabinetId } = session;

  // Charger les clients avec leurs dossiers et documents riches
  const clients = await prisma.client.findMany({
    where: { cabinetId, status: { not: "archive" } },
    include: {
      dossiers: {
        where: { cabinetId, statut: { not: "cloture" } },
        include: {
          richDocuments: {
            where: { isArchived: false },
            orderBy: { updatedAt: "desc" },
            take: 5,
            select: {
              id: true,
              titre: true,
              type: true,
              statut: true,
              updatedAt: true,
              lastEditedAt: true,
              createdBy: { select: { nom: true } },
            },
          },
          _count: { select: { richDocuments: true } },
        },
        orderBy: { updatedAt: "desc" },
      },
    },
    orderBy: { raisonSociale: "asc" },
  });

  // Sessions de travail actives de l'utilisateur courant
  const activeSessions = await prisma.workSession.findMany({
    where: {
      cabinetId,
      userId: session.userId,
      statut: "en_cours",
    },
    include: {
      richDocument: { select: { id: true, titre: true } },
      dossier: { select: { id: true, intitule: true } },
      client: { select: { id: true, raisonSociale: true } },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Atelier de Rédaction"
        description="Vos dossiers clients organisés comme un classeur physique"
      />
      <AtelierView
        clients={clients as any}
        activeSessions={activeSessions as any}
        currentUserId={session.userId}
      />
    </div>
  );
}
