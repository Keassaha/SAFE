/**
 * Déclaration de transmission d'une facture.
 *
 * Art. 56(2) B-1 r.5 · s. 9(1)3 By-Law 9.
 *
 * C'est la PORTE DE SORTIE du garde-fou de retrait (PR-2). Un cabinet qui poste ses
 * factures, les remet en main propre ou les envoie depuis son propre client courriel
 * doit pouvoir le dire. Sans cette porte, le garde-fou serait un mur, et un mur se
 * contourne : l'utilisateur saisirait le retrait autrement, ce qui est pire que de
 * l'avoir laissé passer.
 *
 * ⚠️ CE SERVICE NE FABRIQUE PAS DE PREUVE. Il consigne une déclaration : sa date, son
 * canal, et qui l'a faite. La distinction entre preuve et déclaration est portée par
 * le canal et remonte jusqu'au rapport.
 */

import { prisma } from "@/lib/db";
import { createAuditLog } from "@/lib/services/audit";
import { getCabinetProvince } from "@/lib/cabinet/get-province";
import { resolveProvince } from "@/lib/compliance/rules";
import { clientDisplayName } from "@/lib/clients/normalize-name";
import {
  evaluateDelivery,
  findMissingDeclarationFields,
  getDeclarationRequirements,
  getSelectableDeliveryChannels,
  type DeliveryVerdict,
} from "@/lib/compliance/invoice-delivery";

export class InvoiceDeliveryError extends Error {
  readonly code: "MISSING_DECLARATION_FIELDS" | "INVOICE_NOT_FOUND" | "INVOICE_NOT_ISSUED";
  readonly reference: string;

  constructor(params: {
    code: InvoiceDeliveryError["code"];
    message: string;
    reference: string;
    remedy: string;
  }) {
    super(`${params.message} (${params.reference}) ${params.remedy}`);
    this.name = "InvoiceDeliveryError";
    this.code = params.code;
    this.reference = params.reference;
  }
}

/** Canaux qu'un utilisateur peut déclarer, pour l'écran. */
export { getSelectableDeliveryChannels, getDeclarationRequirements };

/**
 * Consigne une transmission faite hors de SAFE.
 *
 * Refuse sur une facture non émise : on ne transmet pas un brouillon, et l'accepter
 * permettrait de préparer le terrain d'un retrait avant même que la facture existe
 * comme document.
 */
export async function declareInvoiceDelivery(params: {
  cabinetId: string;
  invoiceId: string;
  deliveredAt: Date;
  deliveryChannel: string;
  note?: string | null;
  userId: string;
}): Promise<void> {
  const invoice = await prisma.invoice.findFirst({
    where: { id: params.invoiceId, cabinetId: params.cabinetId },
    select: { id: true, numero: true, invoiceStatus: true },
  });
  if (!invoice) {
    throw new InvoiceDeliveryError({
      code: "INVOICE_NOT_FOUND",
      message: "Facture introuvable pour ce cabinet.",
      reference: "B-1 r.5, art. 56(2)",
      remedy: "Vérifiez la facture sélectionnée.",
    });
  }

  if (invoice.invoiceStatus === "DRAFT" || invoice.invoiceStatus === "READY_TO_ISSUE") {
    throw new InvoiceDeliveryError({
      code: "INVOICE_NOT_ISSUED",
      message: `La facture ${invoice.numero} n'est pas émise : elle ne peut pas avoir été transmise.`,
      reference: "B-1 r.5, art. 56(2)",
      remedy: "Émettez la facture, puis déclarez sa transmission.",
    });
  }

  const missing = findMissingDeclarationFields({
    deliveredAt: params.deliveredAt,
    deliveryChannel: params.deliveryChannel,
  });
  if (missing.length > 0) {
    const reqs = getDeclarationRequirements().filter((r) => missing.includes(r.field));
    throw new InvoiceDeliveryError({
      code: "MISSING_DECLARATION_FIELDS",
      message: `Déclaration incomplète : ${reqs.map((r) => r.labelFr).join(", ")}.`,
      reference: "B-1 r.5, art. 56(2)",
      remedy: reqs.map((r) => r.whyFr).join(" "),
    });
  }

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      deliveredAt: params.deliveredAt,
      deliveryChannel: params.deliveryChannel,
      deliveryDeclaredById: params.userId,
      deliveryNote: params.note ?? null,
    },
  });

  await createAuditLog({
    cabinetId: params.cabinetId,
    userId: params.userId,
    entityType: "Invoice",
    entityId: invoice.id,
    action: "update",
    newValues: {
      type: "invoice_delivery_declared",
      deliveredAt: params.deliveredAt.toISOString(),
      deliveryChannel: params.deliveryChannel,
      note: params.note ?? null,
      reference: "B-1 r.5, art. 56(2) / By-Law 9, s. 9(1)3",
    },
    performedBy: params.userId,
  });
}

/** État de transmission d'une facture, pour l'écran de facturation. */
export async function getInvoiceDeliveryStatus(params: {
  cabinetId: string;
  invoiceId: string;
}): Promise<DeliveryVerdict | null> {
  const invoice = await prisma.invoice.findFirst({
    where: { id: params.invoiceId, cabinetId: params.cabinetId },
    select: { deliveredAt: true, deliveryChannel: true },
  });
  if (!invoice) return null;

  const province = resolveProvince(await getCabinetProvince(params.cabinetId));
  return evaluateDelivery({
    province,
    deliveredAt: invoice.deliveredAt,
    deliveryChannel: invoice.deliveryChannel,
  });
}

/**
 * Factures ÉMISES dont la transmission n'est pas consignée.
 *
 * C'est la file d'attente réelle du garde-fou : tant qu'une facture y figure, aucun
 * retrait ne peut s'appuyer sur elle. Les brouillons en sont exclus — ils n'ont rien
 * à transmettre — et les factures annulées aussi.
 */
export async function listUndeliveredIssuedInvoices(params: {
  cabinetId: string;
}): Promise<
  Array<{
    id: string;
    numero: string;
    dateEmission: Date;
    montantTotal: number;
    clientName: string;
    dossierRef: string | null;
  }>
> {
  const rows = await prisma.invoice.findMany({
    where: {
      cabinetId: params.cabinetId,
      deliveredAt: null,
      invoiceStatus: { in: ["ISSUED", "PARTIALLY_PAID", "PAID", "OVERDUE"] },
    },
    select: {
      id: true,
      numero: true,
      dateEmission: true,
      montantTotal: true,
      client: { select: { prenom: true, nom: true, raisonSociale: true } },
      dossier: { select: { reference: true } },
    },
    orderBy: { dateEmission: "desc" },
  });

  return rows.map((r) => ({
    id: r.id,
    numero: r.numero,
    dateEmission: r.dateEmission,
    montantTotal: r.montantTotal,
    clientName: clientDisplayName(r.client ?? {}),
    dossierRef: r.dossier?.reference ?? null,
  }));
}

/**
 * Factures dont la transmission est PRÉSUMÉE ou seulement DÉCLARÉE.
 *
 * Le cabinet doit pouvoir voir sur quoi reposent ses retraits. Une transmission
 * présumée n'est pas une faute — c'est une zone où la preuve manque, et la nommer
 * vaut mieux que de la laisser se fondre dans la masse.
 */
export async function listUnprovenDeliveries(params: {
  cabinetId: string;
}): Promise<
  Array<{
    id: string;
    numero: string | null;
    deliveredAt: Date | null;
    channel: string | null;
    presumed: boolean;
  }>
> {
  const rows = await prisma.invoice.findMany({
    where: {
      cabinetId: params.cabinetId,
      deliveredAt: { not: null },
      deliveryChannel: { not: "EMAIL_SAFE" },
    },
    select: { id: true, numero: true, deliveredAt: true, deliveryChannel: true },
    orderBy: { deliveredAt: "desc" },
  });

  return rows.map((r) => ({
    id: r.id,
    numero: r.numero,
    deliveredAt: r.deliveredAt,
    channel: r.deliveryChannel,
    presumed: r.deliveryChannel === "LEGACY_PRESUME",
  }));
}
