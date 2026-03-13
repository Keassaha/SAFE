"use client";

import { InvoiceTemplate } from "@/components/facturation/InvoiceTemplate";
import type { InvoiceTemplateItem } from "@/components/facturation/InvoiceTemplate";

type FactureClientViewProps = {
  numero: string;
  dateEmission: string;
  dateEcheance: string;
  statut: string;
  cabinet: { id: string; nom: string; adresse: string | null } | null;
  client: {
    id: string;
    raisonSociale: string;
    billingAddress: string | null;
    billingCity: string | null;
    billingProvince: string | null;
    billingPostalCode: string | null;
    billingCountry: string | null;
  } | null;
  dossier: { id: string; intitule: string; numeroDossier: string | null } | null;
  items: Array<{
    id: string;
    type: string;
    description: string;
    date: string;
    hours: number | null;
    rate: number | null;
    amount: number;
    userNom?: string | null;
  }>;
  subtotalTaxable: number;
  tps: number;
  tvq: number;
  deboursNonTaxableTotal: number;
  montantTotal: number;
  montantPaye: number;
  balanceDue: number;
  clientNote: string | null;
};

export function FactureClientView({
  numero,
  dateEmission,
  dateEcheance,
  statut,
  cabinet,
  client,
  dossier,
  items,
  subtotalTaxable,
  tps,
  tvq,
  deboursNonTaxableTotal,
  montantTotal,
  montantPaye,
  balanceDue,
  clientNote,
}: FactureClientViewProps) {
  const templateItems: InvoiceTemplateItem[] = items.map((i) => ({
    id: i.id,
    type: i.type,
    description: i.description,
    date: i.date,
    hours: i.hours,
    rate: i.rate,
    amount: i.amount,
    userNom: i.userNom ?? null,
  }));

  return (
    <InvoiceTemplate
      numero={numero}
      dateEmission={dateEmission}
      dateEcheance={dateEcheance}
      statut={statut}
      cabinet={cabinet ?? undefined}
      client={client ?? undefined}
      dossier={dossier ?? undefined}
      items={templateItems}
      subtotalTaxable={subtotalTaxable}
      tps={tps}
      tvq={tvq}
      deboursNonTaxableTotal={deboursNonTaxableTotal}
      montantTotal={montantTotal}
      montantPaye={montantPaye}
      balanceDue={balanceDue}
      clientNote={clientNote}
    />
  );
}
