import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/services/audit";
import { accesRepriseUnClient } from "@/lib/services/reprise-un-client/acces";

export const dynamic = "force-dynamic";

const CHAMPS = { adresse: "adresse", courriel: "email", telephone: "telephone" } as const;
type Champ = keyof typeof CHAMPS;

/**
 * « Mettre la fiche à jour » : remplace UNE coordonnée d'un client existant par
 * celle imprimée sur la facture. Jamais appelé sans le clic de la personne :
 * la fiche n'est pas réécrite en silence. L'ancienne valeur part au journal
 * d'audit, pour qu'on puisse dire ce qui a changé et qui l'a décidé.
 */
export async function POST(request: Request) {
  const acces = await accesRepriseUnClient();
  if (acces instanceof NextResponse) return acces;

  const corps = (await request.json().catch(() => null)) as { clientId?: unknown; champ?: unknown; valeur?: unknown } | null;
  const clientId = typeof corps?.clientId === "string" ? corps.clientId : null;
  const champ = typeof corps?.champ === "string" && corps.champ in CHAMPS ? (corps.champ as Champ) : null;
  const valeur = typeof corps?.valeur === "string" ? corps.valeur.trim().slice(0, 300) : "";
  if (!clientId || !champ || !valeur) {
    return NextResponse.json({ error: "Requête incomplète." }, { status: 400 });
  }

  const client = await prisma.client.findFirst({
    where: { id: clientId, cabinetId: acces.cabinetId },
    select: { id: true, adresse: true, email: true, telephone: true },
  });
  if (!client) return NextResponse.json({ error: "Client introuvable." }, { status: 404 });

  const colonne = CHAMPS[champ];
  await prisma.client.update({ where: { id: client.id }, data: { [colonne]: valeur } });
  await createAuditLog({
    cabinetId: acces.cabinetId,
    userId: acces.userId,
    entityType: "Client",
    entityId: client.id,
    action: "update",
    oldValues: { [colonne]: client[colonne] ?? null },
    newValues: { [colonne]: valeur, source: "reprise_un_client_facture" },
  });
  revalidatePath(`/clients/${client.id}`);
  return NextResponse.json({ ok: true });
}
