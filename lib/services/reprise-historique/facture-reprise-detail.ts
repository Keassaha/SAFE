import { prisma } from "@/lib/db";
import { nomDuClient } from "@/lib/services/reprise-un-client/contexte";
import { modeDepuisColonnes, type ModePaiementSaisie } from "@/lib/services/reprise-un-client/saisie";
import type { JournalCorrectionMotive } from "@prisma/client";

/**
 * Tout ce que l'écran « Corriger » montre d'UNE facture reprise : ce qu'elle
 * dit aujourd'hui, ce qui lui est déjà arrivé, et la pièce dont elle vient.
 *
 * La correction ne vit plus dans une liste à part (décision CEO du
 * 2026-10-01) : on corrige une facture là où elle vit, depuis sa page en
 * Facturation ou depuis la fin d'un client qu'on vient de reprendre.
 */

const FACTURE_PASSEE_DOCUMENT_TYPE = "facture_passee_source";

export interface CorrectionPassee {
  date: string;
  auteur: string | null;
  motifCode: JournalCorrectionMotive | null;
}

export interface FactureRepriseDetail {
  id: string;
  numero: string;
  clientNom: string;
  dateEmission: string;
  /** Jour où la facture est entrée dans SAFE par la reprise. */
  repriseLe: string;
  montantTotal: number;
  montantPaye: number;
  statutPaiement: "payee" | "partielle" | "impayee";
  datePaiement: string | null;
  modePaiement: ModePaiementSaisie | null;
  lignes: { id: string; description: string; montant: number; nature: "honoraire" | "debours" }[];
  corrections: CorrectionPassee[];
  piece: { id: string; nom: string; mimeType: string | null } | null;
}

function lireJson(texte: string | null): Record<string, unknown> {
  if (!texte) return {};
  try {
    const v = JSON.parse(texte);
    return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export async function chargerFactureReprise(
  cabinetId: string,
  invoiceId: string,
): Promise<FactureRepriseDetail | null> {
  const f = await prisma.invoice.findFirst({
    where: { id: invoiceId, cabinetId, estReprise: true, cancelledAt: null },
    select: {
      id: true,
      numero: true,
      dossierId: true,
      createdAt: true,
      dateEmission: true,
      totalInvoiceAmount: true,
      montantTotal: true,
      montantPaye: true,
      paymentStatus: true,
      client: { select: { raisonSociale: true, prenom: true, nom: true } },
      payments: {
        where: { estReprise: true },
        select: { datePaiement: true, paymentMethod: true },
        orderBy: { createdAt: "asc" },
        take: 1,
      },
      invoiceLines: {
        select: { id: true, description: true, montant: true, lineType: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
  if (!f) return null;

  const journaux = await prisma.auditLog.findMany({
    where: { cabinetId, entityType: "Invoice", entityId: f.id, action: { in: ["create", "reverse"] } },
    select: { action: true, metadata: true, newValues: true, createdAt: true, user: { select: { nom: true } } },
    orderBy: { createdAt: "asc" },
  });

  const corrections: CorrectionPassee[] = journaux
    .filter((j) => j.action === "reverse")
    .map((j) => {
      const v = lireJson(j.newValues);
      return {
        date: j.createdAt.toISOString().slice(0, 10),
        auteur: j.user?.nom ?? null,
        motifCode: (typeof v.motifCode === "string" ? v.motifCode : null) as JournalCorrectionMotive | null,
      };
    });

  // La pièce : le lien exact est consigné au versement depuis le 2026-10-01 ;
  // avant, on la retrouve par son nom de fichier dans le même mandat.
  const creation = lireJson(journaux.find((j) => j.action === "create")?.metadata ?? null);
  const documentId = typeof creation.documentId === "string" ? creation.documentId : null;
  const fichierNom = typeof creation.fichierNom === "string" ? creation.fichierNom : null;
  const piece =
    documentId || (fichierNom && f.dossierId)
      ? await prisma.document.findFirst({
          where: {
            cabinetId,
            documentType: FACTURE_PASSEE_DOCUMENT_TYPE,
            ...(documentId ? { id: documentId } : { dossierId: f.dossierId, nom: fichierNom! }),
          },
          select: { id: true, nom: true, mimeType: true },
          orderBy: { createdAt: "desc" },
        })
      : null;

  const total = f.totalInvoiceAmount || f.montantTotal;
  const paiement = f.payments[0] ?? null;

  return {
    id: f.id,
    numero: f.numero,
    clientNom: f.client ? nomDuClient(f.client) : "",
    dateEmission: f.dateEmission.toISOString().slice(0, 10),
    repriseLe: f.createdAt.toISOString().slice(0, 10),
    montantTotal: total,
    montantPaye: f.montantPaye,
    statutPaiement: f.paymentStatus === "PAID" ? "payee" : f.paymentStatus === "PARTIAL" ? "partielle" : "impayee",
    datePaiement: paiement ? paiement.datePaiement.toISOString().slice(0, 10) : null,
    modePaiement: paiement ? modeDepuisColonnes(paiement.paymentMethod) : null,
    lignes: f.invoiceLines.map((l) => ({
      id: l.id,
      description: l.description,
      montant: l.montant,
      nature: l.lineType === "expense" ? "debours" : "honoraire",
    })),
    corrections,
    piece,
  };
}
