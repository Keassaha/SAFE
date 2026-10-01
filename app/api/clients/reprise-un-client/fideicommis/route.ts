import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/services/audit";
import { accesRepriseUnClient } from "@/lib/services/reprise-un-client/acces";
import { ecrireSoldeOuverture } from "@/lib/services/entree-client/enregistrer-entree-client";

export const dynamic = "force-dynamic";

/**
 * Déclare le solde détenu en fidéicommis pour un mandat repris, depuis l'écran
 * de fin de « Reprendre un client » (second correctif de la version 4).
 *
 * Même écriture que l'Entrée d'un client : un solde D'OUVERTURE, qui n'est pas
 * un dépôt (voir `ecrireSoldeOuverture`). Refusé si le dossier a déjà des
 * mouvements en fidéicommis : ce service FIXE le solde du compte, et sur un
 * dossier déjà mouvementé il écraserait le vrai solde.
 */
export async function POST(request: Request) {
  const acces = await accesRepriseUnClient();
  if (acces instanceof NextResponse) return acces;

  const corps = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const dossierId = typeof corps?.dossierId === "string" ? corps.dossierId : null;
  const montant = typeof corps?.montant === "number" && Number.isFinite(corps.montant) ? corps.montant : null;
  const arrete = typeof corps?.arreteAu === "string" && /^\d{4}-\d{2}-\d{2}$/.test(corps.arreteAu) ? corps.arreteAu : null;
  const recuATitreDe = typeof corps?.recuATitreDe === "string" ? corps.recuATitreDe.trim().slice(0, 300) || null : null;
  if (!dossierId || montant === null || !arrete) {
    return NextResponse.json({ error: "Indiquez le montant et la date du relevé." }, { status: 400 });
  }
  if (!(montant > 0)) {
    return NextResponse.json({ error: "Un solde détenu doit être supérieur à zéro." }, { status: 422 });
  }
  const arreteAu = new Date(`${arrete}T12:00:00.000Z`);
  if (arreteAu.getTime() > Date.now()) {
    return NextResponse.json({ error: "La date du relevé ne peut pas être dans le futur." }, { status: 422 });
  }

  const dossier = await prisma.dossier.findFirst({
    where: { id: dossierId, cabinetId: acces.cabinetId },
    select: { id: true, clientId: true },
  });
  if (!dossier?.clientId) return NextResponse.json({ error: "Mandat introuvable." }, { status: 404 });

  const dejaMouvemente = await prisma.trustTransaction.count({ where: { cabinetId: acces.cabinetId, dossierId } });
  if (dejaMouvemente > 0) {
    return NextResponse.json(
      { error: "Ce mandat a déjà des mouvements en fidéicommis. Corrigez le solde depuis le registre du fidéicommis." },
      { status: 409 },
    );
  }

  const ecritureId = await prisma.$transaction((db) =>
    ecrireSoldeOuverture(db, {
      cabinetId: acces.cabinetId,
      clientId: dossier.clientId as string,
      dossierId,
      utilisateurId: acces.userId,
      fonds: { montant, arreteAu, recuATitreDe },
    }),
  );
  await createAuditLog({
    cabinetId: acces.cabinetId,
    userId: acces.userId,
    entityType: "TrustTransaction",
    entityId: ecritureId,
    action: "create",
    metadata: { source: "reprise_un_client", soldeOuverture: montant, dossierId },
  });
  revalidatePath(`/dossiers/${dossierId}`);
  return NextResponse.json({ ok: true, solde: montant });
}
