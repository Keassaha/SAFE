import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { presentInvoice } from "@/lib/services/billing/invoice-presenter";
import { FactureClientView } from "./FactureClientView";

type Props = { params: Promise<{ token: string }> };

export default async function FactureClientPage({ params }: Props) {
  const { token } = await params;
  if (!token?.trim()) notFound();

  const invoice = await prisma.invoice.findFirst({
    where: {
      shareToken: token,
      cancelledAt: null,
    },
    include: {
      cabinet: {
        select: { id: true, nom: true, adresse: true, telephone: true, email: true, barreauNumero: true },
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
      dossier: { select: { id: true, intitule: true, numeroDossier: true, modeFacturation: true } },
      invoiceItems: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, nom: true } } },
      },
      invoiceLines: {
        orderBy: { sortOrder: "asc" },
        include: { timeEntry: { include: { user: { select: { nom: true } } } } },
      },
    },
  });

  if (!invoice) notFound();
  const now = new Date();
  if (invoice.shareTokenExpiresAt && invoice.shareTokenExpiresAt < now) {
    notFound();
  }

  // Pipeline canonique : presenter → aperçu unique (InvoicePreview → InvoiceDocument).
  // Strictement le même rendu que le PDF généré pour téléchargement / email.
  const presented = presentInvoice(invoice);

  return (
    <div className="min-h-screen bg-neutral-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <FactureClientView invoice={presented} />
      </div>
    </div>
  );
}
