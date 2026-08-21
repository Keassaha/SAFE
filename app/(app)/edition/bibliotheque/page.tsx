import { requirePageAccess } from "@/lib/auth/page-guard";
import { canViewDocuments } from "@/lib/auth/permissions";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { EditionBibliotheque } from "@/components/edition/EditionBibliotheque";

export default async function EditionBibliothequePage() {
  /* Le menu masquait déjà Édition aux rôles non autorisés
     (SidebarNav, `canViewDocuments`), mais l'URL directe servait la
     page quand même. « Le menu cache, il ne protège pas. » */
  const session = await requirePageAccess(canViewDocuments);
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
