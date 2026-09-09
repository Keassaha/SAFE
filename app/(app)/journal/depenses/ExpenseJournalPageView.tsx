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
import {
  TaxesAConfirmerSection,
  type DepenseATaxeEstimee,
} from "@/components/expense-journal/TaxesAConfirmerSection";
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
  taxesAConfirmer,
  taxesSansOrigine,
  canWrite = true,
  embedded = false,
}: {
  cabinetId: string;
  kpis: ExpenseJournalKpisData;
  sessions: SessionWithCount[];
  categories: ExpenseCategory[];
  transactions: BankImportTransaction[];
  /** Dépenses dont la taxe n'est qu'estimée, donc pas encore réclamable. */
  taxesAConfirmer: DepenseATaxeEstimee[];
  /** Dépenses dont la taxe n'a jamais été calculée. */
  taxesSansOrigine: number;
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

      {/* Les six cartes de chiffres ne s'affichent QUE sur l'écran autonome.
          Intégrées dans Comptabilité, elles répétaient sous les yeux ce que la
          bande du haut venait de dire : « Dépenses du mois » y figure déjà.
          Deux fois le même montant sur un écran, c'est une invitation à
          chercher lequel des deux est le bon.

          Le journal général applique déjà cette règle (GeneralJournalPageView,
          `{!embedded && …}`). Le journal des dépenses ne la suivait pas.
          Décision CEO du 2026-09-09. */}
      {!embedded && <ExpenseJournalKpis data={kpis} />}

      {/* Ce qui reste à faire n'est pas un chiffre à contempler : c'est du
          travail. Il monte donc en tête de l'onglet, sous forme d'une seule
          phrase, et il disparaît quand tout est classé et validé. */}
      {embedded && (kpis.uncategorizedCount > 0 || kpis.toValidateCount > 0) && (
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-lg border border-si-amber/40 bg-si-amber/[0.08] px-4 py-3">
          <span className="text-[13px] font-medium text-si-amber-ink">{t("toDoTitle")}</span>
          <span className="text-[12.5px] text-si-body">
            {[
              kpis.uncategorizedCount > 0
                ? t("toDoUncategorized", { count: kpis.uncategorizedCount })
                : null,
              kpis.toValidateCount > 0
                ? t("toDoToValidate", { count: kpis.toValidateCount })
                : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </div>
      )}

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

      {/* Après la boucle quotidienne, pas avant. Importer et valider est le geste
          de tous les jours ; confirmer les taxes est une dette qu'on vient solder.
          Mettre la dette en tête volerait la place du geste fréquent. */}
      <TaxesAConfirmerSection
        depenses={taxesAConfirmer}
        sansOrigine={taxesSansOrigine}
        canWrite={canWrite}
      />
    </div>
  );
}
