import { requireCabinetAndUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { EditionBibliotheque } from "@/components/edition/EditionBibliotheque";

export default async function EditionBibliothequePage() {
  const session = await requireCabinetAndUser();
  if (!session) notFound();

  const docs = await prisma.richDocument.findMany({
    where: { cabinetId: session.cabinetId, isArchived: false },
    orderBy: { updatedAt: "desc" },
    take: 200,
    select: {
      id: true,
      titre: true,
      type: true,
      statut: true,
      updatedAt: true,
      dossierId: true,
      client: { select: { raisonSociale: true } },
      dossier: { select: { intitule: true } },
    },
  });

  return (
    <EditionBibliotheque
      docs={docs.map((d) => ({
        id: d.id,
        titre: d.titre,
        type: d.type,
        statut: d.statut,
        updatedAt: d.updatedAt.toISOString(),
        dossierId: d.dossierId,
        clientNom: d.client?.raisonSociale ?? null,
        dossierIntitule: d.dossier?.intitule ?? null,
      }))}
    />
  );
}
