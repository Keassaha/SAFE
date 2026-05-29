import { prisma } from "@/lib/db";
import { presentInvoice } from "@/lib/services/billing/invoice-presenter";
import { getCabinetTaxConfigById } from "@/lib/billing/cabinet-tax-config";

export async function loadPresentedInvoiceForCabinet(invoiceId: string, cabinetId: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, cabinetId },
    include: {
      cabinet: {
        // logoUrl + config : requis pour exposer les n° HST/GST/QST/Business
        // dans le PDF (norme facture canadienne).
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
        select: {
          id: true,
          intitule: true,
          numeroDossier: true,
          modeFacturation: true,
        },
      },
      invoiceLines: {
        orderBy: { sortOrder: "asc" },
        include: { timeEntry: { include: { user: { select: { nom: true } } } } },
      },
      invoiceItems: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { nom: true } } },
      },
    },
  });

  if (!invoice) return null;
  const taxConfig = await getCabinetTaxConfigById(
    cabinetId,
    prisma,
    invoice.client?.billingProvince ?? null,
  );
  return presentInvoice(invoice, taxConfig);
}
