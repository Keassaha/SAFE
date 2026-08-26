"use client";
import { useFormatteurs } from "@/lib/i18n/formatteurs";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { routes } from "@/lib/routes";
import { useQuery } from "@tanstack/react-query";
import { Loader2, FileMinus, ArrowLeft } from "lucide-react";
import { RegistrePagination, usePaginationLocale } from "@/components/ui/registre";

interface FacturationNotesCreditViewProps {
  cabinetId: string;
}

type NoteDeCredit = {
  id: string;
  creditNoteNumber: string;
  creditDate: string;
  invoiceId: string;
  totalCredit: number;
  appliedAmount: number;
  remainingAmount: number;
  status: string;
};

export function FacturationNotesCreditView({ cabinetId }: FacturationNotesCreditViewProps) {
  const t = useTranslations("billingUi");
  const { formatCurrency, formatCalendarDate } = useFormatteurs();
  const tc = useTranslations("common");
  const { data, isLoading } = useQuery<{ creditNotes: NoteDeCredit[] }>({
    queryKey: ["facturation", "notes-credit"],
    queryFn: async () => {
      const res = await fetch("/api/facturation/credit-notes");
      if (!res.ok) return { creditNotes: [] };
      return res.json();
    },
  });

  const notes: NoteDeCredit[] = data?.creditNotes ?? [];
  // Paginé par 20, comme tous les registres du produit.
  const pageNotes = usePaginationLocale(notes);

  return (
    <div className="space-y-6">
      {/* En-tête posé sur la surface de travail. Il portait un dégradé sombre
          peint à la main, hors palette : c'est exactement la « grande carte
          employée comme en-tête de page » que la direction retire. */}
      <header className="pb-1">
        <Link
          href={routes.facturation}
          className="mb-3 inline-flex items-center gap-2 text-sm text-si-muted transition-colors hover:text-si-ink"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden />
          {t("backToOverview")}
        </Link>
        <h1 className="font-serif text-[32px] leading-tight tracking-tight text-si-ink">{t("creditNotes")}</h1>
        <p className="mt-2 max-w-[65ch] text-sm text-si-muted">
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
                  {pageNotes.tranche.map((n) => (
                    <tr key={n.id} className="safe-zoom-rang border-b border-si-line ">
                      <td className="py-2 px-3 font-medium">{n.creditNoteNumber}</td>
                      <td className="py-2 px-3">{formatCalendarDate(n.creditDate)}</td>
                      <td className="py-2 px-3">{n.invoiceId}</td>
                      <td className="py-2 px-3 text-right">{formatCurrency(n.totalCredit)}</td>
                      <td className="py-2 px-3 text-right">{formatCurrency(n.appliedAmount)}</td>
                      <td className="py-2 px-3 text-right">{formatCurrency(n.remainingAmount)}</td>
                      <td className="py-2 px-3">{n.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <RegistrePagination
                totalCount={pageNotes.total}
                currentPage={pageNotes.page}
                resume={tc("paginationRange", {
                  start: pageNotes.debut + 1,
                  end: pageNotes.fin,
                  total: pageNotes.total,
                })}
                labelPage={tc("paginationPage", {
                  current: pageNotes.page,
                  total: pageNotes.totalPages,
                })}
                labelPrecedent={tc("previous")}
                labelSuivant={tc("next")}
                onPageChange={pageNotes.setPage}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
