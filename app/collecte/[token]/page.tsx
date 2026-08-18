import { prisma } from "@/lib/db";
import { verifierLien, messageRefus } from "@/lib/dossiers/collecte-lien";
import { CollecteClientView } from "./CollecteClientView";

type Props = { params: Promise<{ token: string }> };

/**
 * La page que le client ouvre depuis son lien.
 *
 * Spec : docs/product/SPEC_COLLECTE_PIECES_CLIENT.md
 *
 * CLOISONNEMENT PAR LA REQUÊTE, PAS PAR L'AFFICHAGE
 *
 * Cette page ne lit que les pièces attendues DU CLIENT et le strict nécessaire du
 * dossier : son intitulé, et le nom du cabinet. Elle ne charge ni notes internes, ni
 * stratégie, ni honoraires, ni les autres parties. Ce qui n'est pas lu ne peut pas
 * fuir par une erreur de rendu.
 *
 * Les pièces attendues de la PARTIE ADVERSE ne sont pas montrées non plus : le client
 * n'a pas à savoir ce que l'autre côté doit fournir.
 */
export default async function CollectePage({ params }: Props) {
  const { token } = await params;

  const dossier = token?.trim()
    ? await prisma.dossier.findFirst({
        where: { collecteToken: token },
        select: {
          id: true,
          intitule: true,
          collecteToken: true,
          collecteTokenExpiresAt: true,
          cabinet: { select: { nom: true } },
        },
      })
    : null;

  const verdict = verifierLien(dossier, new Date());
  if (!verdict.valide) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg items-center px-6">
        <p className="text-[15px] leading-relaxed text-si-ink">
          {messageRefus(verdict.motif)}
        </p>
      </main>
    );
  }

  const pieces = await prisma.expectedDocument.findMany({
    where: {
      dossierId: dossier!.id,
      fournisseur: "CLIENT",
      etat: { notIn: ["ECARTEE"] },
    },
    orderBy: [{ echeance: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      libelle: true,
      raison: true,
      etat: true,
      echeance: true,
      motifRemplacement: true,
    },
  });

  return (
    <CollecteClientView
      token={token}
      cabinet={dossier!.cabinet?.nom ?? ""}
      dossier={dossier!.intitule}
      pieces={pieces.map((p) => ({
        id: p.id,
        libelle: p.libelle,
        raison: p.raison,
        etat: p.etat,
        echeance: p.echeance ? p.echeance.toISOString() : null,
        motifRemplacement: p.motifRemplacement,
      }))}
    />
  );
}
