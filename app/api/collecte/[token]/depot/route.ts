import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/db";
import { writeDocumentObject } from "@/lib/services/document";
import { verifierLien, verifierFichier, cleRefus } from "@/lib/dossiers/collecte-lien";
import {
  localeDuClient,
  messagesCollecte,
  traduire,
} from "@/lib/dossiers/collecte-langue";
import { toCalendarDayUTC } from "@/lib/utils/calendar-date";

/**
 * Dépôt d'une pièce par le client, sans compte.
 *
 * Spec : docs/product/SPEC_COLLECTE_PIECES_CLIENT.md
 *
 * TROIS RÈGLES QUI TIENNENT LA SÉCURITÉ
 *
 * 1. Le jeton est la SEULE autorisation, et il est vérifié à chaque appel. Rien
 *    n'est déduit d'un identifiant fourni par le client.
 * 2. La pièce visée doit appartenir au dossier du jeton. Un `expectedDocumentId`
 *    d'un autre dossier est refusé, pas ignoré.
 * 3. Le client ne peut déposer que sur une pièce qui LUI est demandée. Une pièce
 *    attendue de la partie adverse ou du cabinet n'est pas déposable ici.
 *
 * L'ORIGINAL N'EST JAMAIS REMPLACÉ
 *
 * Un second dépôt sur la même pièce crée un nouveau `Document` et laisse le premier
 * en place. C'est la même doctrine que la comptabilité : on corrige en ajoutant.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!token?.trim()) {
    // Aucun dossier n'a encore été lu : la langue du client est inconnue, donc défaut.
    const msg = await messagesCollecte("fr");
    return NextResponse.json({ error: traduire(msg, cleRefus("inexistant")) }, { status: 404 });
  }

  const dossier = await prisma.dossier.findFirst({
    where: { collecteToken: token },
    select: {
      id: true,
      cabinetId: true,
      collecteToken: true,
      collecteTokenExpiresAt: true,
      // La langue des refus se prend sur la fiche du client, pas sur le navigateur.
      client: { select: { langue: true } },
    },
  });

  const msg = await messagesCollecte(localeDuClient(dossier?.client?.langue));

  const verdict = verifierLien(dossier, new Date());
  if (!verdict.valide) {
    // 404 dans tous les cas : un 403 confirmerait que le jeton a existé.
    return NextResponse.json({ error: traduire(msg, cleRefus(verdict.motif)) }, { status: 404 });
  }

  const form = await request.formData();
  const expectedDocumentId = String(form.get("expectedDocumentId") ?? "");
  const fichier = form.get("fichier");

  if (!(fichier instanceof File)) {
    return NextResponse.json({ error: traduire(msg, "aucunFichier") }, { status: 400 });
  }

  const controle = verifierFichier({ type: fichier.type, size: fichier.size });
  if (!controle.ok) {
    return NextResponse.json({ error: traduire(msg, controle.cle) }, { status: 400 });
  }

  // La pièce doit appartenir au dossier du jeton, et être attendue DU CLIENT.
  const piece = await prisma.expectedDocument.findFirst({
    where: {
      id: expectedDocumentId,
      dossierId: dossier!.id,
      fournisseur: "CLIENT",
    },
    select: { id: true, libelle: true, etat: true },
  });
  if (!piece) {
    return NextResponse.json({ error: traduire(msg, "pieceInattendue") }, { status: 404 });
  }
  if (piece.etat === "ACCEPTEE" || piece.etat === "ECARTEE" || piece.etat === "PRODUITE") {
    return NextResponse.json(
      { error: traduire(msg, "pieceDejaReglee") },
      { status: 409 },
    );
  }

  const buffer = Buffer.from(await fichier.arrayBuffer());
  const empreinte = createHash("sha256").update(buffer).digest("hex");
  const cle = `collecte/${dossier!.cabinetId}/${dossier!.id}/${piece.id}/${empreinte.slice(0, 16)}`;

  await writeDocumentObject(cle, buffer, fichier.type || "application/octet-stream");

  // Un nouveau Document à chaque dépôt : l'original précédent reste intact.
  const document = await prisma.document.create({
    data: {
      cabinetId: dossier!.cabinetId,
      dossierId: dossier!.id,
      nom: fichier.name || piece.libelle,
      storageKey: cle,
      mimeType: fichier.type || "application/octet-stream",
      sizeBytes: fichier.size,
      hash: empreinte,
      // Déposé par le client, pas par le cabinet. `uploadedById` reste NULL : y
      // mettre un membre du cabinet inscrirait une fausse mention à l'audit.
      provenance: "CLIENT",
    },
  });

  await prisma.expectedDocument.update({
    where: { id: piece.id },
    data: {
      documentId: document.id,
      // « Reçue » et non « acceptée » : accepter est une décision humaine du cabinet.
      etat: "RECUE",
      recueLe: toCalendarDayUTC(new Date()),
      motifRemplacement: null,
    },
  });

  return NextResponse.json({ ok: true, etat: "RECUE" });
}
