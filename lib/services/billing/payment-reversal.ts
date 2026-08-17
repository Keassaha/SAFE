/**
 * SAFE — Annulation d'un encaissement.
 *
 * Doctrine: docs/accounting/DOCTRINE_ANNULATION_CORRECTION.md §1.1.
 *
 * `allocationStatus = REVERSED` existait dans l'enum, était LU à trois endroits du
 * service d'allocation, et n'était ÉCRIT nulle part. Un statut mort : un paiement
 * encaissé par erreur ne pouvait pas être défait. Ce module lui donne son écriture.
 *
 * L'opération est la SYMÉTRIQUE EXACTE d'`allocateToInvoices` :
 *   allocation : crée les PaymentAllocation → recalcule les factures → journal (+)
 *   annulation : retire les PaymentAllocation → recalcule les factures → journal (−)
 *
 * Le Payment n'est JAMAIS supprimé. Il reste en base, marqué REVERSED, avec son
 * motif, sa date et son auteur. La preuve de paiement importée reste attachée :
 * c'est elle qui documente pourquoi on avait cru encaisser.
 */

import type { JournalCorrectionMotive } from "@prisma/client";
import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/services/audit";
import {
  contrepasserEcritureSource,
  validateMotif,
} from "@/lib/services/journal/annulation";
import { PAYMENT_JOURNAL_SOURCE_MODULE } from "@/lib/services/journal/billing-journal";
import { recalculateInvoiceTotals } from "./invoice-service";

export interface AnnulerPaiementParams {
  paymentId: string;
  cabinetId: string;
  motifCode: JournalCorrectionMotive;
  motifTexte?: string | null;
  performedById?: string | null;
}

export interface AnnulerPaiementResult {
  paymentId: string;
  montantAnnule: number;
  /** Factures dont le solde dû a été rouvert par l'annulation. */
  facturesReouvertes: string[];
  /** Identifiant de la contrepassation au journal, absent si rien n'y figurait. */
  annulationJournalId: string | null;
}

/**
 * Annule un encaissement : désalloue, rouvre les factures, contrepasse au journal.
 */
export async function annulerPaiement(
  params: AnnulerPaiementParams,
): Promise<AnnulerPaiementResult> {
  const { paymentId, cabinetId, motifCode, motifTexte, performedById } = params;

  const motif = validateMotif({ code: motifCode, texte: motifTexte });
  if (!motif.ok) throw new Error(motif.message);

  const now = new Date();

  const result = await prisma.$transaction(async (tx) => {
    // Mêmes verrous, et dans le MÊME ORDRE que `allocateToInvoices` (paiement puis
    // factures triées) : deux ordres différents sur les mêmes lignes produiraient
    // des interblocages entre une allocation et une annulation concurrentes.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`payment:${paymentId}`}))`;

    const payment = await tx.payment.findFirst({
      where: { id: paymentId, cabinetId },
      include: { paymentAllocations: true },
    });
    if (!payment) throw new Error("Paiement introuvable");
    if (payment.allocationStatus === "REVERSED") {
      throw new Error("Ce paiement est déjà annulé.");
    }

    const invoiceIds = Array.from(
      new Set(payment.paymentAllocations.map((a) => a.invoiceId)),
    ).sort();
    for (const invoiceId of invoiceIds) {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`invoice:${invoiceId}`}))`;
    }

    // Les allocations sont un LIEN, pas un fait comptable : le fait, c'est le
    // paiement, qui reste. Les retirer rend leur solde dû aux factures.
    await tx.paymentAllocation.deleteMany({ where: { paymentId } });

    await tx.payment.update({
      where: { id: paymentId },
      data: {
        allocationStatus: "REVERSED",
        reversedAt: now,
        reversalMotive: motifCode,
        reversalNote: motif.texte,
        reversedById: performedById ?? null,
      },
    });

    for (const invoiceId of invoiceIds) {
      await recalculateInvoiceTotals(invoiceId, tx);
    }

    const contrepassation = await contrepasserEcritureSource({
      cabinetId,
      sourceModule: PAYMENT_JOURNAL_SOURCE_MODULE,
      sourceId: paymentId,
      motifCode,
      motifTexte: motif.texte,
      utilisateurId: performedById ?? null,
      client: tx,
    });

    return {
      paymentId,
      montantAnnule: payment.montant,
      facturesReouvertes: invoiceIds,
      annulationJournalId: contrepassation?.annulationId ?? null,
    };
  });

  await createAuditLog({
    cabinetId,
    userId: performedById ?? undefined,
    entityType: "Payment",
    entityId: paymentId,
    action: "reverse",
    oldValues: { allocationStatus: "actif", montant: result.montantAnnule },
    newValues: {
      allocationStatus: "REVERSED",
      motifCode,
      motifTexte: motif.texte,
      facturesReouvertes: result.facturesReouvertes,
      annulationJournalId: result.annulationJournalId,
    },
    performedBy: performedById ?? undefined,
    performedAt: now,
  });

  return result;
}
