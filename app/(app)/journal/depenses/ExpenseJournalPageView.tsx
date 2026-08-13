"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Receipt } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ActionsSection } from "@/components/comptabilite/ActionsSection";
import { ExpenseJournalKpis } from "@/components/expense-journal/ExpenseJournalKpis";
import { ImportStatementBlock } from "@/components/expense-journal/ImportStatementBlock";
import { ImportRecuModal } from "@/components/expense-journal/ImportRecuModal";
import { ExpensesJournalTable } from "@/components/expense-journal/ExpensesJournalTable";
import { ValidationPanel } from "@/components/expense-journal/ValidationPanel";
import type { BankImportSession, BankImportTransaction, ExpenseCategory } from "@prisma/client";

export type ExpenseJournalKpisData = {
  totalMonth: number;
  totalYear: number;
  uncategorizedCount: number;
  toValidateCount: number;
  topCategoryName: string | null;
  topCategoryAmount: number;
  importedThisMonth: number;
  variation: number | null;
  byCategory: Array<{ name: string; total: number }>;
  refacturableSum: number;
  totalValidated: number;
};

type SessionWithCount = BankImportSession & {
  _count: { transactions: number };
};

export function ExpenseJournalPageView({
  cabinetId,
  kpis,
  sessions,
  categories,
  transactions,
  canWrite = true,
  embedded = false,
}: {
  cabinetId: string;
  kpis: ExpenseJournalKpisData;
  sessions: SessionWithCount[];
  categories: ExpenseCategory[];
  transactions: BankImportTransaction[];
  /** Tenir le journal des dépenses. En lecture seule : chiffres et écritures,
   *  sans import ni validation (les actions serveur refusent de toute façon). */
  canWrite?: boolean;
  /** Rendu dans la page Comptabilité : les actions rejoignent la ligne de
   *  titre de la section au lieu de flotter au-dessus du contenu. */
  embedded?: boolean;
}) {
  const router = useRouter();
  const t = useTranslations("receiptImport");
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<boolean>(false);
  const [recuModalOpen, setRecuModalOpen] = useState<boolean>(false);

  const selectedTransaction = transactions.find((t) => t.id === selectedTransactionId);

  return (
    <div className="space-y-6 pb-12">
      {canWrite && (
        <ActionsSection embarque={embedded}>
          <Button type="button" onClick={() => setRecuModalOpen(true)}>
            <Receipt className="mr-2 h-4 w-4" aria-hidden />
            {t("importButton")}
          </Button>
        </ActionsSection>
      )}

      <ExpenseJournalKpis data={kpis} />

      {canWrite && (
        <ImportRecuModal
          open={recuModalOpen}
          onClose={() => setRecuModalOpen(false)}
          categories={categories}
          onSuccess={() => {
            setRecuModalOpen(false);
            setSelectedTransactionId(null);
            router.refresh();
          }}
        />
      )}

      {canWrite && (
        <ImportStatementBlock
          onSuccess={() => {
            setImportSuccess(true);
            setSelectedTransactionId(null);
          }}
        />
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className={canWrite ? "xl:col-span-2" : "xl:col-span-3"}>
          <ExpensesJournalTable
            transactions={transactions}
            categories={categories}
            selectedId={selectedTransactionId}
            onSelectTransaction={canWrite ? setSelectedTransactionId : () => {}}
            onValidationComplete={() => setSelectedTransactionId(null)}
          />
        </div>
        {canWrite && (
          <div className="xl:col-span-1">
            <ValidationPanel
              transaction={selectedTransaction ?? null}
              categories={categories}
              onClose={() => setSelectedTransactionId(null)}
              onValidated={() => setSelectedTransactionId(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
