/**
 * Service intérêts : calcul et historisation des intérêts de retard.
 */

import { prisma } from "@/lib/db";
import { computeInterestAmount } from "@/lib/invoice-calculations";
import { createAuditLog } from "@/lib/services/audit";

/** Calcule le nombre de jours de retard à une date donnée */
export function getDaysOverdue(dueDate: Date, asOf: Date = new Date()): number {
  if (asOf <= dueDate) return 0;
  return Math.floor((asOf.getTime() - dueDate.getTime()) / (24 * 60 * 60 * 1000));
}

/**
 * Cette charge d'intérêt peut-elle encore être réécrite ?
 *
 * B-03 : `createOrUpdateInterestCharge` disait « create or update » et ne
 * contenait qu'un `create`. Appelée deux fois sur la même facture, elle
 * EMPILAIT deux charges au lieu d'en corriger une, et le client se voyait
 * facturer les intérêts en double.
 *
 * Deux conditions, et la seconde est la plus importante : une charge portée par
 * une ligne de facture a déjà été remise à un client. La réécrire changerait un
 * document sorti du cabinet. Seule une charge encore calculée, et que rien n'a
 * facturée, se rafraîchit.
 */
export function estUneChargeEnAttente(charge: {
  status: string | null;
  invoiceLineId: string | null;
}): boolean {
  return charge.status === "calculated" && charge.invoiceLineId === null;
}

/** Crée ou met à jour un enregistrement d'intérêt pour une facture */
export async function createOrUpdateInterestCharge(params: {
  invoiceId: string;
  annualRate: number;
  asOfDate?: Date;
  createdById?: string | null;
}): Promise<{ interestChargeId: string; interestAmount: number }> {
  const { invoiceId, annualRate, asOfDate = new Date(), createdById } = params;

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
  });
  if (!invoice) throw new Error("Facture introuvable");
  if (invoice.invoiceStatus !== "ISSUED" && invoice.invoiceStatus !== "PARTIALLY_PAID" && invoice.invoiceStatus !== "OVERDUE") {
    throw new Error("La facture doit être émise pour calculer les intérêts");
  }

  const dueDate = invoice.dateEcheance;
  const daysOverdue = getDaysOverdue(dueDate, asOfDate);
  if (daysOverdue <= 0) {
    throw new Error("La facture n'est pas en retard");
  }

  const baseAmount = invoice.balanceDue ?? invoice.totalInvoiceAmount ?? invoice.montantTotal ?? 0;
  if (baseAmount <= 0) throw new Error("Aucun solde à facturer d'intérêts");

  const interestAmount = computeInterestAmount(baseAmount, annualRate, daysOverdue);
  if (interestAmount <= 0) return { interestChargeId: "", interestAmount: 0 };

  /* La charge la plus récente encore en attente est corrigée plutôt que
     doublée. Voir `estUneChargeEnAttente` ci-dessus. */
  const derniere = await prisma.interestCharge.findFirst({
    where: { invoiceId },
    orderBy: { createdAt: "desc" },
  });
  const donnees = {
    calculationDate: asOfDate,
    annualRate,
    daysOverdue,
    baseAmount,
    interestAmount,
    status: "calculated",
  };
  const charge =
    derniere && estUneChargeEnAttente(derniere)
      ? await prisma.interestCharge.update({ where: { id: derniere.id }, data: donnees })
      : await prisma.interestCharge.create({ data: { invoiceId, ...donnees } });

  await createAuditLog({
    cabinetId: invoice.cabinetId,
    userId: createdById ?? undefined,
    entityType: "Invoice",
    entityId: invoiceId,
    action: "update",
    metadata: {
      interestCharge: charge.id,
      interestAmount,
      /* Distingue une correction d'une nouvelle charge dans la piste d'audit. */
      corrigee: Boolean(derniere && estUneChargeEnAttente(derniere)),
    },
    performedBy: createdById ?? undefined,
    performedAt: asOfDate,
  });

  return { interestChargeId: charge.id, interestAmount };
}
