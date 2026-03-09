"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { routes } from "@/lib/routes";
import { useQuery } from "@tanstack/react-query";
import { Loader2, FileMinus, ArrowLeft } from "lucide-react";

interface FacturationNotesCreditViewProps {
  cabinetId: string;
}

export function FacturationNotesCreditView({ cabinetId }: FacturationNotesCreditViewProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["facturation", "notes-credit"],
    queryFn: async () => {
      const res = await fetch("/api/facturation/credit-notes");
      if (!res.ok) return { creditNotes: [] };
      return res.json();
    },
  });

  const notes = data?.creditNotes ?? [];

  return (
    <div className="space-y-6">
      <header className="rounded-xl bg-[var(--safe-sidebar-bg)] text-white p-6">
        <Link
          href={routes.facturation}
          className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm mb-3"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden />
          Retour à la vue d&apos;ensemble
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Notes de crédit</h1>
        <p className="mt-1 text-white/80 text-sm">
          Liste des notes de crédit et leur application aux factures.
        </p>
      </header>

      <Card>
        <CardHeader title="Notes de crédit" />
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
          ) : notes.length === 0 ? (
            <p className="text-neutral-500 py-8 text-center">Aucune note de crédit.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50">
                    <th className="text-left py-3 px-3 font-medium">N°</th>
                    <th className="text-left py-3 px-3 font-medium">Date</th>
                    <th className="text-left py-3 px-3 font-medium">Facture d&apos;origine</th>
                    <th className="text-right py-3 px-3 font-medium">Montant</th>
                    <th className="text-right py-3 px-3 font-medium">Appliqué</th>
                    <th className="text-right py-3 px-3 font-medium">Restant</th>
                    <th className="text-left py-3 px-3 font-medium">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {notes.map((n: { id: string; creditNoteNumber: string; creditDate: string; invoiceId: string; totalCredit: number; appliedAmount: number; remainingAmount: number; status: string }) => (
                    <tr key={n.id} className="border-b border-neutral-100 hover:bg-neutral-50/80">
                      <td className="py-2 px-3 font-medium">{n.creditNoteNumber}</td>
                      <td className="py-2 px-3">{formatDate(n.creditDate)}</td>
                      <td className="py-2 px-3">{n.invoiceId}</td>
                      <td className="py-2 px-3 text-right">{formatCurrency(n.totalCredit)}</td>
                      <td className="py-2 px-3 text-right">{formatCurrency(n.appliedAmount)}</td>
                      <td className="py-2 px-3 text-right">{formatCurrency(n.remainingAmount)}</td>
                      <td className="py-2 px-3">{n.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
