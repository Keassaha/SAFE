import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
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
      cabinet: { select: { id: true, nom: true, adresse: true } },
      client: {
        select: {
          id: true,
          raisonSociale: true,
          billingAddress: true,
          billingCity: true,
          billingProvince: true,
          billingPostalCode: true,
          billingCountry: true,
        },
      },
      dossier: { select: { id: true, intitule: true, numeroDossier: true } },
      invoiceItems: {
        orderBy: { createdAt: "asc" },
        include: { user: { select: { id: true, nom: true } } },
      },
      invoiceLines: {
        orderBy: { sortOrder: "asc" },
        include: {
          timeEntry: { include: { user: { select: { nom: true } } } },
        },
      },
    },
  });

  if (!invoice) notFound();
  const now = new Date();
  if (
    invoice.shareTokenExpiresAt &&
    invoice.shareTokenExpiresAt < now
  ) {
    notFound();
  }

  const lineItems = invoice.invoiceLines.map((line) => ({
    id: line.id,
    type:
      line.lineType === "fee"
        ? "honoraires"
        : line.lineType === "expense"
          ? "debours_taxable"
          : "honoraires",
    description: line.description,
    date: (line.serviceDate ?? line.createdAt) as Date,
    hours: line.quantite ?? null,
    rate: line.tauxUnitaire ?? null,
    amount: line.lineSubtotal ?? line.montant,
    userNom: line.timeEntry?.user?.nom ?? null,
  }));
  const itemItems = invoice.invoiceItems.map((item) => ({
    id: item.id,
    type: item.type,
    description: item.description,
    date: item.date,
    hours: item.hours,
    rate: item.rate,
    amount: item.amount,
    userNom: item.professionalDisplayName ?? item.user?.nom ?? null,
  }));
  const items = [...lineItems, ...itemItems].map((i) => ({
    ...i,
    date: i.date instanceof Date ? i.date.toISOString().slice(0, 10) : String(i.date),
  }));

  return (
    <div className="min-h-screen bg-neutral-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <FactureClientView
          numero={invoice.numero}
          dateEmission={invoice.dateEmission.toISOString()}
          dateEcheance={invoice.dateEcheance.toISOString()}
          statut={invoice.statut}
          cabinet={invoice.cabinet}
          client={invoice.client}
          dossier={invoice.dossier}
          items={items}
          subtotalTaxable={invoice.subtotalTaxable ?? 0}
          tps={invoice.tps ?? 0}
          tvq={invoice.tvq ?? 0}
          deboursNonTaxableTotal={invoice.deboursNonTaxableTotal ?? 0}
          montantTotal={invoice.montantTotal ?? 0}
          montantPaye={invoice.montantPaye ?? 0}
          balanceDue={invoice.balanceDue ?? 0}
          clientNote={invoice.clientNote}
        />
      </div>
    </div>
  );
}
