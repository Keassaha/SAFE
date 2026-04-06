"use client";

import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { routes } from "@/lib/routes";
import { AlertCircle, DollarSign, FileText, Link2 } from "lucide-react";

export type SuiviInvoiceRow = {
  id: string;
  numero: string;
  clientId: string;
  client: string;
  dossier: string | null;
  dateEmission: string;
  dateEcheance: string;
  montantTotal: number;
  balanceDue: number;
  statut: string;
  sentAt: string | null;
};

interface SuiviInvoicesViewProps {
  invoices: SuiviInvoiceRow[];
}

export function SuiviInvoicesView({ invoices }: SuiviInvoicesViewProps) {
  if (invoices.length === 0) {
    return (
      <p className="text-sm text-[var(--safe-text-secondary)] py-8 text-center">
        Aucune facture envoyée à afficher.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-50">
            <th className="text-left py-3 px-3 font-medium">Numéro</th>
            <th className="text-left py-3 px-3 font-medium">Client</th>
            <th className="text-left py-3 px-3 font-medium">Dossier</th>
            <th className="text-left py-3 px-3 font-medium">Échéance</th>
            <th className="text-right py-3 px-3 font-medium">Montant</th>
            <th className="text-right py-3 px-3 font-medium">Solde dû</th>
            <th className="text-left py-3 px-3 font-medium">Statut</th>
            <th className="text-right py-3 px-3 font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => {
            const isOverdue = inv.statut === "en_retard";
            return (
              <tr
                key={inv.id}
                className={`border-b border-neutral-100 hover:bg-neutral-50/80 ${
                  isOverdue ? "bg-red-50/50" : ""
                }`}
              >
                <td className="py-2 px-3 font-medium">
                  <Link
                    href={routes.facturationFactureEdit(inv.id)}
                    className="text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
                  >
                    <FileText className="h-4 w-4 shrink-0" aria-hidden />
                    {inv.numero}
                  </Link>
                </td>
                <td className="py-2 px-3">
                  <Link
                    href={routes.client(inv.clientId)}
                    className="text-[var(--safe-text-title)] hover:underline"
                  >
                    {inv.client}
                  </Link>
                </td>
                <td className="py-2 px-3 text-[var(--safe-text-secondary)]">
                  {inv.dossier ?? "—"}
                </td>
                <td className="py-2 px-3">{formatDate(inv.dateEcheance)}</td>
                <td className="py-2 px-3 text-right">{formatCurrency(inv.montantTotal)}</td>
                <td className="py-2 px-3 text-right font-medium">
                  {formatCurrency(inv.balanceDue)}
                </td>
                <td className="py-2 px-3">
                  {isOverdue ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-0.5 text-xs font-medium text-red-800">
                      <AlertCircle className="h-3.5 w-3.5" aria-hidden />
                      En retard
                    </span>
                  ) : inv.statut === "payee" ? (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-0.5 text-xs font-medium text-green-800">
                      Payée
                    </span>
                  ) : inv.statut === "partiellement_payee" ? (
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-0.5 text-xs font-medium text-amber-800">
                      Partiellement payée
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-0.5 text-xs font-medium text-neutral-700">
                      Envoyée
                    </span>
                  )}
                </td>
                <td className="py-2 px-3 text-right">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <Link
                      href={routes.facturationFactureEdit(inv.id)}
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
                    >
                      <Link2 className="h-4 w-4" aria-hidden />
                      Envoyer au client
                    </Link>
                    {inv.balanceDue > 0 && (
                      <Link
                        href={`${routes.facturationPaiements}?invoiceId=${encodeURIComponent(inv.id)}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
                      >
                        <DollarSign className="h-4 w-4" aria-hidden />
                        Ajouter un paiement
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
