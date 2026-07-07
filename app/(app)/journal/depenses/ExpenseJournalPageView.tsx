"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Receipt } from "lucide-react";
import { Button } from "@/components/ui/Button";
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
}: {
  cabinetId: string;
  kpis: ExpenseJournalKpisData;
  sessions: SessionWithCount[];
  categories: ExpenseCategory[];
  transactions: BankImportTransaction[];
}) {
  const router = useRouter();
  const t = useTranslations("receiptImport");
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<boolean>(false);
  const [recuModalOpen, setRecuModalOpen] = useState<boolean>(false);

  const selectedTransaction = transactions.find((t) => t.id === selectedTransactionId);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-end">
        <Button type="button" onClick={() => setRecuModalOpen(true)}>
          <Receipt className="h-4 w-4" aria-hidden />
          {t("importButton")}
        </Button>
      </div>

      <ExpenseJournalKpis data={kpis} />

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

      <ImportStatementBlock
        onSuccess={() => {
          setImportSuccess(true);
          setSelectedTransactionId(null);
        }}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <ExpensesJournalTable
            transactions={transactions}
            categories={categories}
            selectedId={selectedTransactionId}
            onSelectTransaction={setSelectedTransactionId}
            onValidationComplete={() => setSelectedTransactionId(null)}
          />
        </div>
        <div className="xl:col-span-1">
          <ValidationPanel
            transaction={selectedTransaction ?? null}
            categories={categories}
            onClose={() => setSelectedTransactionId(null)}
            onValidated={() => setSelectedTransactionId(null)}
          />
        </div>
      </div>
    </div>
  );
}
