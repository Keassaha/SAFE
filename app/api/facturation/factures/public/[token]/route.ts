import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { deriveLegacyStatut } from "@/lib/billing/invoice-status";
import { presentInvoice } from "@/lib/services/billing/invoice-presenter";
import { getCabinetTaxConfigById } from "@/lib/billing/cabinet-tax-config";

/**
 * GET: retourne la facture pour un token de partage (lien client).
 * Pas d'authentification. 404 si token invalide, 410 si expiré.
 *
 * Cette route délègue au MÊME presenter (`presentInvoice`) que l'aperçu, le
 * PDF, le courriel et la page publique `app/facture/[token]/page.tsx`. Elle ne
 * recalcule plus les lignes ni les totaux par elle-même : ainsi tous les rendus
 * d'une facture restent identiques (lignes, taxes, total, payé, solde).
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!token?.trim()) {
    return NextResponse.json({ error: "Lien invalide" }, { status: 404 });
  }

  const invoice = await prisma.invoice.findFirst({
    where: {
      shareToken: token,
      cancelledAt: null,
    },
    include: {
      cabinet: {
        select: {
          id: true,
          nom: true,
          adresse: true,
          telephone: true,
          email: true,
          barreauNumero: true,
          logoUrl: true,
          config: true,
        },
      },
      client: {
        select: {
          id: true,
          raisonSociale: true,
          prenom: true,
          nom: true,
          typeClient: true,
          email: true,
          billingAddress: true,
          billingCity: true,
          billingProvince: true,
          billingPostalCode: true,
          billingCountry: true,
        },
      },
      dossier: {
        select: { id: true, intitule: true, numeroDossier: true, modeFacturation: true },
      },
      invoiceItems: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { nom: true } } },
      },
      invoiceLines: {
        orderBy: { sortOrder: "asc" },
        include: { timeEntry: { include: { user: { select: { nom: true } } } } },
      },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });
  }
  const now = new Date();
  if (invoice.shareTokenExpiresAt && invoice.shareTokenExpiresAt < now) {
    return NextResponse.json({ error: "Ce lien a expiré" }, { status: 410 });
  }

  const taxConfig = await getCabinetTaxConfigById(
    invoice.cabinetId,
    prisma,
    invoice.client?.billingProvince ?? null,
  );
  const presented = presentInvoice(invoice, taxConfig);

  return NextResponse.json({
    id: presented.id,
    numero: presented.numero,
    // Doctrine: docs/accounting/INVOICE_STATUS_NORMALIZATION.md
    statut: deriveLegacyStatut(invoice),
    invoiceStatus: presented.invoiceStatus,
    dateEmission: presented.dateEmission,
    dateEcheance: presented.dateEcheance,
    clientId: invoice.clientId,
    cabinet: presented.cabinet,
    client: presented.client,
    dossierId: invoice.dossierId,
    dossier: presented.dossier,
    isForfait: presented.isForfait,
    items: presented.lines,
    totals: presented.totals,
    clientNote: presented.clientNote,
  });
}
