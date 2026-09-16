import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canCreateClients } from "@/lib/auth/permissions";
import { revalidatePath } from "next/cache";
import { hashProofFile } from "@/lib/services/finance/proof-dedup";
import { writeDocumentObject, createDocumentRecord } from "@/lib/services/document";
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
  hash: string;
  mimeType: string;
  montantPaye: number | null;
}

interface FactureResultatApi {
  id: string;
  ok: boolean;
  erreur?: string;
  invoiceId?: string;
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
    const file = form.get(`file_${item.id}`);
    if (!(file instanceof File)) {
      resultats.push({ id: item.id, ok: false, erreur: "Fichier source manquant." });
      continue;
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const hashVerifie = hashProofFile(buffer);
    if (hashVerifie !== item.hash) {
      resultats.push({
        id: item.id,
        ok: false,
        erreur: "Le fichier a changé depuis l'analyse : à ré-analyser.",
      });
      continue;
    }

    try {
      const ecrit = await verserFactureReprise({
        cabinetId: data.cabinetId,
        userId: data.userId,
        facture: item,
        montantPaye: item.montantPaye,
      });
      memoire.retenir(item, ecrit);

      // Conservation du fichier source (best-effort : un échec de stockage ne
      // doit pas défaire l'écriture comptable déjà acquise).
      try {
        const ext = EXT[item.mimeType] ?? "bin";
        const key = `factures-passees/${data.cabinetId}/${new Date().getFullYear()}/${randomUUID()}.${ext}`;
        await writeDocumentObject(key, buffer, item.mimeType);
        await createDocumentRecord({
          cabinetId: data.cabinetId,
          userId: data.userId,
          clientId: ecrit.clientId,
          dossierId: ecrit.dossierId,
          nom: item.fichierNom,
          mimeType: item.mimeType,
          sizeBytes: buffer.byteLength,
          storageKey: key,
          hash: item.hash,
          documentType: FACTURE_PASSEE_DOCUMENT_TYPE,
          aiAssisted: true,
          dateDocument: item.extraction.dateEmission ? new Date(item.extraction.dateEmission) : null,
        });
      } catch (err) {
        console.error("Conservation du fichier de reprise échouée (facture enregistrée quand même):", err);
      }

      resultats.push({ id: item.id, ok: true, invoiceId: ecrit.invoiceId });
    } catch (err) {
      // Nos refus à nous sont écrits pour être lus : on les montre tels quels.
      // Tout le reste est une panne technique, et un cabinet n'a rien à faire
      // d'une trace Prisma de deux écrans. Le détail va au journal du serveur,
      // l'écran dit ce qui compte : cette facture n'est pas passée, et rien
      // n'a été écrit pour elle.
      if (err instanceof VerserFactureError) {
        resultats.push({ id: item.id, ok: false, erreur: err.message });
      } else {
        console.error(`Versement de « ${item.fichierNom} » échoué :`, err);
        resultats.push({
          id: item.id,
          ok: false,
          erreur:
            "Une panne technique a empêché d'écrire cette facture. Rien n'a été enregistré pour elle, vous pouvez la redéposer. Le détail est dans le journal du serveur.",
        });
      }
    }
  }

  revalidatePath("/clients");
  revalidatePath("/clients/entree");

  return NextResponse.json({ resultats });
}
