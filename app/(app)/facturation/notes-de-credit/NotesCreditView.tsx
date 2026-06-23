"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { routes } from "@/lib/routes";
import { useQuery } from "@tanstack/react-query";
import { Loader2, FileMinus, ArrowLeft } from "lucide-react";

interface FacturationNotesCreditViewProps {
  cabinetId: string;
}

export function FacturationNotesCreditView({ cabinetId }: FacturationNotesCreditViewProps) {
  const t = useTranslations("billingUi");
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
      <header className="rounded-xl bg-gradient-to-r from-[#051F20] via-[#0B2B26] to-[#163832] text-white p-6 shadow-lg">
        <Link
          href={routes.facturation}
          className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm mb-3"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden />
          {t("backToOverview")}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{t("creditNotes")}</h1>
        <p className="mt-1 text-white/80 text-sm">
          {t("creditNotesSubtitle")}
        </p>
      </header>

      <Card>
        <CardHeader title={t("creditNotes")} />
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-si-muted/50" />
            </div>
          ) : notes.length === 0 ? (
            <p className="text-si-muted py-8 text-center">{t("noCreditNotes")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-si-line bg-si-canvas">
                    <th className="text-left py-3 px-3 font-medium">{t("number")}</th>
                    <th className="text-left py-3 px-3 font-medium">{t("date")}</th>
                    <th className="text-left py-3 px-3 font-medium">{t("originalInvoice")}</th>
                    <th className="text-right py-3 px-3 font-medium">{t("amount")}</th>
                    <th className="text-right py-3 px-3 font-medium">{t("applied")}</th>
                    <th className="text-right py-3 px-3 font-medium">{t("remaining")}</th>
                    <th className="text-left py-3 px-3 font-medium">{t("status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {notes.map((n: { id: string; creditNoteNumber: string; creditDate: string; invoiceId: string; totalCredit: number; appliedAmount: number; remainingAmount: number; status: string }) => (
                    <tr key={n.id} className="border-b border-si-line hover:bg-si-canvas/80">
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
