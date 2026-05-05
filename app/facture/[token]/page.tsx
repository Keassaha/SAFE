import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { deriveLegacyStatut } from "@/lib/billing/invoice-status";
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

  // Pipeline canonique : presenter → vue → template. Les rabais (legacy ou
  // nouveaux) sont systématiquement convertis en lignes négatives visibles.
  const presented = presentInvoice(invoice);
  const itemsForView = presented.lines.map((l) => ({
    id: l.id,
    type: l.type,
    description: l.description,
    date: l.date instanceof Date ? l.date.toISOString().slice(0, 10) : String(l.date),
    hours: l.hours,
    rate: l.rate,
    amount: l.amount,
    userNom: l.userNom,
  }));

  return (
    <div className="min-h-screen bg-neutral-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <FactureClientView
          numero={presented.numero}
          dateEmission={presented.dateEmission.toISOString()}
          dateEcheance={presented.dateEcheance.toISOString()}
          statut={deriveLegacyStatut(invoice)}
          cabinet={presented.cabinet}
          client={presented.client}
          dossier={presented.dossier}
          items={itemsForView}
          subtotalTaxable={presented.totals.subtotalTaxable}
          tps={presented.totals.tps}
          tvq={presented.totals.tvq}
          deboursNonTaxableTotal={presented.totals.deboursNonTaxableTotal}
          montantTotal={presented.totals.montantTotal}
          montantPaye={presented.totals.montantPaye}
          balanceDue={presented.totals.balanceDue}
          clientNote={presented.clientNote}
        />
      </div>
    </div>
  );
}
