import type { ModeFacturationDossier } from "@prisma/client";
import { prisma } from "@/lib/db";

/**
 * Résumé financier d'un dossier — bandeau « contexte financier » de la page
 * dossier v2 (structure parallèle « Calme opérationnel »).
 *
 * Définitions :
 * - Temps non facturé = entrées facturables sans facture, non radiées, dont le
 *   statut est NON_BILLED / READY_TO_BILL (ou legacy null). Les entrées déjà
 *   engagées dans un brouillon de facture (IN_DRAFT_INVOICE) sont EXCLUES :
 *   elles ne sont plus « à facturer ». Peut donc différer de l'écran
 *   /facturation/temps-non-facture si celui-ci inclut les brouillons.
 * - Montant facturable = honoraires non facturés (somme des TimeEntry.montant,
 *   valeur de vérité calculée à la saisie) + débours refacturables NON_FACTURE.
 * - Solde à recevoir = Σ max(0, montantTotal − montantPaye) des factures
 *   émises (statut ≠ brouillon) non annulées.
 * - Fidéicommis = Dossier.soldeFiducieDossier (source canonique, comme la
 *   page legacy et les filtres de liste).
 */
export interface DossierFinancialSummary {
  unbilledMinutes: number;
  unbilledFeesAmount: number;
  unbilledDisbursements: number;
  billableAmount: number;
  receivableBalance: number;
  /** Nombre de factures émises non annulées (badge onglet Facturation). */
  issuedInvoiceCount: number;
  trustBalance: number;
  /** Entrées READY_TO_BILL hors facture — même définition que hasReadyToBillWork. */
  readyToBillCount: number;
  modeFacturation: ModeFacturationDossier | null;
  tauxHoraire: number | null;
}

export async function getDossierFinancialSummary(
  cabinetId: string,
  dossierId: string,
): Promise<DossierFinancialSummary> {
  const [unbilledTime, readyToBill, unbilledDebours, invoices, dossier] =
    await Promise.all([
      prisma.timeEntry.aggregate({
        _sum: { dureeMinutes: true, montant: true },
        where: {
          cabinetId,
          dossierId,
          facturable: true,
          invoiceId: null,
          isWrittenOff: false,
          OR: [
            { billingStatus: null },
            { billingStatus: { in: ["NON_BILLED", "READY_TO_BILL"] } },
          ],
        },
      }),
      prisma.timeEntry.count({
        where: {
          cabinetId,
          dossierId,
          billingStatus: "READY_TO_BILL",
          invoiceId: null,
        },
      }),
      prisma.deboursDossier.aggregate({
        _sum: { montant: true },
        where: {
          cabinetId,
          dossierId,
          refacturable: true,
          statutDebours: "NON_FACTURE",
        },
      }),
      prisma.invoice.findMany({
        where: {
          cabinetId,
          dossierId,
          statut: { not: "brouillon" },
          cancelledAt: null,
        },
        select: { montantTotal: true, montantPaye: true },
      }),
      prisma.dossier.findFirst({
        where: { id: dossierId, cabinetId },
        select: {
          soldeFiducieDossier: true,
          modeFacturation: true,
          tauxHoraire: true,
        },
      }),
    ]);

  const unbilledMinutes = unbilledTime._sum.dureeMinutes ?? 0;
  const unbilledFeesAmount = unbilledTime._sum.montant ?? 0;
  const unbilledDisbursements = unbilledDebours._sum.montant ?? 0;
  const receivableBalance = invoices.reduce(
    (sum, inv) => sum + Math.max(0, inv.montantTotal - inv.montantPaye),
    0,
  );

  return {
    unbilledMinutes,
    unbilledFeesAmount,
    unbilledDisbursements,
    billableAmount: unbilledFeesAmount + unbilledDisbursements,
    receivableBalance,
    issuedInvoiceCount: invoices.length,
    trustBalance: dossier?.soldeFiducieDossier ?? 0,
    readyToBillCount: readyToBill,
    modeFacturation: dossier?.modeFacturation ?? null,
    tauxHoraire: dossier?.tauxHoraire ?? null,
  };
}
