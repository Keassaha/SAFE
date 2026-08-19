import { NextIntlClientProvider } from "next-intl";
import { prisma } from "@/lib/db";
import { verifierLien, cleRefus } from "@/lib/dossiers/collecte-lien";
import {
  localeDuClient,
  messagesCollecte,
  traduire,
} from "@/lib/dossiers/collecte-langue";
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
 *
 * LA LANGUE VIENT DE LA FICHE DU CLIENT
 *
 * Le reste de l'application lit un témoin `NEXT_LOCALE`, posé à la connexion. Ce
 * client n'a pas de compte : le témoin n'existe pas et la page tomberait toujours en
 * français. On fournit donc les messages nous-mêmes, dans la langue inscrite sur sa
 * fiche, au lieu de laisser la configuration globale décider pour lui.
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
          client: { select: { langue: true } },
        },
      })
    : null;

  const locale = localeDuClient(dossier?.client?.langue);
  const messages = await messagesCollecte(locale);

  const verdict = verifierLien(dossier, new Date());
  if (!verdict.valide) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg items-center px-6">
        <p className="text-[15px] leading-relaxed text-si-ink">
          {traduire(messages, cleRefus(verdict.motif))}
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
    <NextIntlClientProvider
      locale={locale}
      messages={{ collecte: messages }}
      timeZone="America/Toronto"
    >
      <CollecteClientView
        token={token}
        cabinet={dossier!.cabinet?.nom ?? ""}
        dossier={dossier!.intitule}
        locale={locale}
        pieces={pieces.map((p) => ({
          id: p.id,
          libelle: p.libelle,
          raison: p.raison,
          etat: p.etat,
          echeance: p.echeance ? p.echeance.toISOString() : null,
          motifRemplacement: p.motifRemplacement,
        }))}
      />
    </NextIntlClientProvider>
  );
}
