import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";
import { recalculateInvoiceTotals } from "@/lib/services/billing/invoice-service";
import type { FactureRepriseSaisie, StatutPaiementReprise } from "@/lib/services/reprise-historique/construire-lot";

/**
 * Écrit une facture passée confirmée à l'écran : client/dossier si nouveaux,
 * la facture et ses lignes, une entrée de temps (horaire) ou une tâche de
 * registre (forfait) par ligne — marquées facturées pour ne jamais revenir en
 * facturation — et un paiement si la facture est payée/partielle.
 *
 * Doctrine (mémoire project_entree_client_reprise, plan « reprise des
 * factures passées ») :
 * - Le fidéicommis reste HORS de ce lot : aucune `TrustTransaction` ici.
 * - Aucune écriture au journal comptable : `Invoice.estReprise` /
 *   `Payment.estReprise` documentent le passé, ce n'est pas un événement du
 *   jour. `createPayment` (service de paiement normal) écrit au journal — on
 *   ne le réutilise donc pas ici, on écrit directement.
 * - Le statut de paiement est celui choisi par l'utilisateur, jamais deviné.
 */

export interface VerserFactureParams {
  cabinetId: string;
  userId: string;
  facture: FactureRepriseSaisie;
  /** Requis si `statutPaiement` est "payee" ou "partielle". */
  montantPaye: number | null;
}

export interface VerserFactureResultat {
  factureId: string; // id côté écran (FactureRepriseSaisie.id), pour relier le résultat à la carte
  invoiceId: string;
  clientId: string;
  dossierId: string;
  clientCree: boolean;
  dossierCree: boolean;
}

export class VerserFactureError extends Error {
  constructor(
    public readonly factureId: string,
    message: string,
  ) {
    super(message);
  }
}

function toDate(iso: string | null, repli: Date): Date {
  if (!iso) return repli;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? repli : d;
}

/** Numéro de repli quand la facture source n'en porte aucun de lisible. */
function numeroRepli(): string {
  return `REPRISE-${randomUUID()}`;
}

function resolveMontantPaye(
  statut: StatutPaiementReprise,
  montantTotal: number,
  montantPayeSaisi: number | null,
): number {
  if (statut === "payee") return montantTotal;
  if (statut === "partielle") {
    if (montantPayeSaisi === null || montantPayeSaisi <= 0) {
      throw new Error("Le montant payé est requis pour une facture partielle.");
    }
    return Math.min(montantPayeSaisi, montantTotal);
  }
  return 0;
}

export async function verserFactureReprise(
  params: VerserFactureParams,
): Promise<VerserFactureResultat> {
  const { cabinetId, userId, facture, montantPaye } = params;
  const { extraction, match, statutPaiement } = facture;

  if (!statutPaiement) {
    throw new VerserFactureError(facture.id, "Statut de paiement non choisi.");
  }
  if (extraction.montantTotal === null) {
    throw new VerserFactureError(
      facture.id,
      "Montant total illisible sur la facture : à corriger avant de verser.",
    );
  }
  const montantTotal = extraction.montantTotal;
  const dateEmission = toDate(extraction.dateEmission, new Date());
  const lignesAvecMontant = extraction.lignes.filter((l) => l.montant !== null);

  const resultat = await prisma.$transaction(async (tx) => {
    // ── Client ────────────────────────────────────────────────────────────
    let clientId = match.client.clientId;
    let clientCree = false;
    if (!clientId) {
      const client = await tx.client.create({
        data: {
          cabinetId,
          typeClient: "personne_morale",
          raisonSociale: match.client.clientNom,
        },
        select: { id: true },
      });
      clientId = client.id;
      clientCree = true;
    }

    // ── Dossier ───────────────────────────────────────────────────────────
    let dossierId = match.dossier.dossierId;
    let dossierCree = false;
    if (!dossierId) {
      const dossier = await tx.dossier.create({
        data: {
          cabinetId,
          clientId,
          intitule: match.dossier.dossierIntitule,
          statut: "actif",
        },
        select: { id: true },
      });
      dossierId = dossier.id;
      dossierCree = true;
    }

    // ── Facture ───────────────────────────────────────────────────────────
    const numeroLu = extraction.numeroFacture?.trim() || null;
    const numeroDejaPris = numeroLu
      ? await tx.invoice.findFirst({ where: { cabinetId, numero: numeroLu }, select: { id: true } })
      : null;
    const numero = numeroLu && !numeroDejaPris ? numeroLu : numeroRepli();

    const invoice = await tx.invoice.create({
      data: {
        cabinetId,
        clientId,
        dossierId,
        numero,
        dateEmission,
        dateEcheance: dateEmission,
        statut: "envoyee",
        invoiceStatus: "ISSUED",
        estReprise: true,
        deliveryChannel: "LEGACY_PRESUME",
      },
      select: { id: true },
    });

    // ── Lignes + temps/tâches liées ──────────────────────────────────────
    let sortOrder = 0;
    for (const ligne of lignesAvecMontant) {
      const serviceDate = ligne.date ? toDate(ligne.date, dateEmission) : null;
      const quantite = ligne.heures ?? 1;
      const tauxUnitaire = ligne.heures
        ? (ligne.tauxHoraire ?? (ligne.montant as number) / ligne.heures)
        : (ligne.montant as number);

      const invoiceLine = await tx.invoiceLine.create({
        data: {
          invoiceId: invoice.id,
          description: ligne.description,
          quantite,
          tauxUnitaire,
          montant: ligne.montant as number,
          lineType: "fee",
          sourceType: "manual",
          serviceDate,
          taxable: true,
          sortOrder: sortOrder++,
        },
        select: { id: true },
      });

      if (ligne.heures) {
        await tx.timeEntry.create({
          data: {
            cabinetId,
            dossierId,
            clientId,
            userId,
            date: serviceDate ?? dateEmission,
            dureeMinutes: Math.round(ligne.heures * 60),
            description: ligne.description,
            facturable: true,
            statut: "facture",
            tauxHoraire: tauxUnitaire,
            montant: ligne.montant as number,
            billingStatus: "BILLED",
            invoiceId: invoice.id,
            invoiceLineId: invoiceLine.id,
          },
        });
      } else {
        await tx.registreTache.create({
          data: {
            cabinetId,
            dossierId,
            clientId,
            description: ligne.description,
            montantBase: ligne.montant as number,
            montantFinal: ligne.montant as number,
            date: serviceDate ?? dateEmission,
            statut: "facture",
            invoiceLineId: invoiceLine.id,
          },
        });
      }
    }

    await recalculateInvoiceTotals(invoice.id, tx);

    // ── Paiement (direct, sans passer par createPayment : pas d'écriture au
    // journal pour un encaissement reconstitué — voir l'en-tête du fichier) ──
    if (statutPaiement !== "impayee") {
      const montantAAllouer = resolveMontantPaye(
        statutPaiement,
        montantTotal,
        montantPaye,
      );
      const datePaiementIso = facture.datePaiement;
      if (!datePaiementIso) {
        throw new Error("La date de paiement est requise pour une facture payée ou partielle.");
      }
      const datePaiement = toDate(datePaiementIso, dateEmission);

      const payment = await tx.payment.create({
        data: {
          cabinetId,
          clientId,
          invoiceId: invoice.id,
          datePaiement,
          montant: montantAAllouer,
          method: "autre",
          paymentMethod: "other",
          sourceAccountType: "operating",
          allocationStatus: montantAAllouer >= montantTotal ? "ALLOCATED" : "PARTIALLY_ALLOCATED",
          estReprise: true,
          receivedById: userId,
        },
        select: { id: true },
      });

      await tx.paymentAllocation.create({
        data: {
          paymentId: payment.id,
          invoiceId: invoice.id,
          allocatedAmount: montantAAllouer,
          allocatedAt: datePaiement,
        },
      });

      await recalculateInvoiceTotals(invoice.id, tx);
    }

    return { invoiceId: invoice.id, clientId, dossierId, clientCree, dossierCree };
  });

  return { factureId: facture.id, ...resultat };
}
