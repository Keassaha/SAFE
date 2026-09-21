import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canCreateClients } from "@/lib/auth/permissions";
import { revalidatePath } from "next/cache";
import { hashProofFile } from "@/lib/services/finance/proof-dedup";
import { writeDocumentObject } from "@/lib/services/document";
import { verserFactureReprise, VerserFactureError } from "@/lib/services/reprise-historique/verser-reprise";
import type { FactureRepriseSaisie } from "@/lib/services/reprise-historique/construire-lot";
import { MemoireDuLot } from "@/lib/services/reprise-historique/memoire-du-lot";
import { FACTURE_PASSEE_DOCUMENT_TYPE } from "@/app/api/clients/entree/reprise/analyser/route";
import type { UserRole } from "@prisma/client";
import { randomUUID } from "crypto";

const EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

interface FactureRepriseEntree extends FactureRepriseSaisie {
  hash?: string;
  mimeType?: string;
  montantPaye: number | null;
}

interface FactureResultatApi {
  id: string;
  ok: boolean;
  erreur?: string;
  invoiceId?: string;
}

/**
 * Nos refus à nous sont écrits pour être lus : on les montre tels quels. Tout
 * le reste est une panne technique, et un cabinet n'a rien à faire d'une trace
 * Prisma de deux écrans. Le détail va au journal du serveur, l'écran dit ce qui
 * compte : cette facture n'est pas passée, et rien n'a été écrit pour elle.
 */
function messageDErreur(err: unknown, fichierNom: string): string {
  if (err instanceof VerserFactureError) return err.message;
  console.error(`Versement de « ${fichierNom} » échoué :`, err);
  return "Une panne technique a empêché d'écrire cette facture. Rien n'a été enregistré pour elle, vous pouvez la redéposer. Le détail est dans le journal du serveur.";
}

function getSessionData() {
  return getServerSession(authOptions).then((session) => {
    if (!session?.user) return null;
    const cabinetId = (session.user as { cabinetId?: string }).cabinetId;
    const role = (session.user as { role?: string }).role as UserRole;
    const userId = (session.user as { id?: string }).id;
    if (!cabinetId || !userId) return null;
    return { cabinetId, role, userId };
  });
}

/**
 * Verse le lot de factures passées revues à l'écran : une transaction par
 * facture (un échec n'en perd pas huit autres), fichier source re-transmis
 * pour vérification d'intégrité et conservation. RIEN n'est écrit avant cet
 * appel — voir le bandeau de l'écran de reprise.
 */
export async function POST(request: Request) {
  const data = await getSessionData();
  if (!data) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  if (!canCreateClients(data.role)) {
    return NextResponse.json({ error: "Droits insuffisants" }, { status: 403 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const lotBrut = form.get("lot");
  if (typeof lotBrut !== "string") {
    return NextResponse.json({ error: "Lot manquant" }, { status: 400 });
  }
  let lot: FactureRepriseEntree[];
  try {
    lot = JSON.parse(lotBrut);
  } catch {
    return NextResponse.json({ error: "Lot illisible" }, { status: 400 });
  }

  const resultats: FactureResultatApi[] = [];
  // Deux factures du même client encore inconnu ne doivent pas créer deux
  // fiches : ce qui est créé pour la première sert aux suivantes du lot.
  const memoire = new MemoireDuLot();

  for (const itemBrut of lot) {
    const item = { ...itemBrut, ...memoire.appliquer(itemBrut) };
    // Une facture tapée sans aucun scan : pas de fichier attendu, pas
    // d'empreinte à vérifier. Elle sera marquée « sans pièce ».
    if (item.sansPiece) {
      try {
        const ecrit = await verserFactureReprise({
          cabinetId: data.cabinetId,
          userId: data.userId,
          facture: item,
          montantPaye: item.montantPaye,
        });
        memoire.retenir(item, ecrit);
        resultats.push({ id: item.id, ok: true, invoiceId: ecrit.invoiceId });
      } catch (err) {
        resultats.push({ id: item.id, ok: false, erreur: messageDErreur(err, item.fichierNom) });
      }
      continue;
    }

    const file = form.get(`file_${item.id}`);
    if (!(file instanceof File)) {
      resultats.push({ id: item.id, ok: false, erreur: "Fichier source manquant." });
      continue;
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const hashVerifie = hashProofFile(buffer);
    if (!item.hash || !item.mimeType || hashVerifie !== item.hash) {
      resultats.push({
        id: item.id,
        ok: false,
        erreur: "Le fichier a changé depuis l'analyse : à ré-analyser.",
      });
      continue;
    }

    // Le fichier part sur le stockage AVANT l'écriture comptable, pour que son
    // empreinte puisse s'inscrire dans la même transaction que la facture. Si
    // le stockage refuse, on refuse la facture : rien n'a encore été écrit.
    // Un fichier orphelin sur le disque ne coûte rien ; une facture sans
    // empreinte se redépose indéfiniment.
    const ext = EXT[item.mimeType] ?? "bin";
    const storageKey = `factures-passees/${data.cabinetId}/${new Date().getFullYear()}/${randomUUID()}.${ext}`;
    try {
      await writeDocumentObject(storageKey, buffer, item.mimeType);
    } catch (err) {
      console.error(`Conservation de « ${item.fichierNom} » échouée :`, err);
      resultats.push({
        id: item.id,
        ok: false,
        erreur:
          "Le fichier n'a pas pu être conservé, la facture n'a donc pas été enregistrée. Rien n'a été écrit pour elle, vous pouvez la redéposer.",
      });
      continue;
    }

    try {
      const ecrit = await verserFactureReprise({
        cabinetId: data.cabinetId,
        userId: data.userId,
        facture: item,
        montantPaye: item.montantPaye,
        piece: {
          hash: item.hash,
          documentType: FACTURE_PASSEE_DOCUMENT_TYPE,
          nom: item.fichierNom,
          mimeType: item.mimeType,
          sizeBytes: buffer.byteLength,
          storageKey,
          dateDocument: item.extraction.dateEmission ? new Date(item.extraction.dateEmission) : null,
        },
      });
      memoire.retenir(item, ecrit);

      resultats.push({ id: item.id, ok: true, invoiceId: ecrit.invoiceId });
    } catch (err) {
      resultats.push({ id: item.id, ok: false, erreur: messageDErreur(err, item.fichierNom) });
    }
  }

  revalidatePath("/clients");
  revalidatePath("/clients/entree");

  return NextResponse.json({ resultats });
}
