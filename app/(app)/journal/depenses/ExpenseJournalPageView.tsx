"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Plus, Receipt, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ActionsSection } from "@/components/comptabilite/ActionsSection";
import { ExpenseJournalKpis } from "@/components/expense-journal/ExpenseJournalKpis";
import { ImportStatementBlock } from "@/components/expense-journal/ImportStatementBlock";
import { ImportRecuModal } from "@/components/expense-journal/ImportRecuModal";
import { ExpensesJournalTable } from "@/components/expense-journal/ExpensesJournalTable";
import { DepensesTable } from "@/components/expense-journal/DepensesTable";
import { AjouterDepenseModal } from "@/components/expense-journal/AjouterDepenseModal";
import { resteAFaire } from "@/lib/expense-journal/etat-depense";
import type { DepenseListe } from "@/lib/expense-journal/charger";
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
  depenses,
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
  /** Les dépenses du cabinet. Le tableau central les montrait jamais. */
  depenses: DepenseListe[];
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
  const td = useTranslations("expenseJournal");
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [recuModalOpen, setRecuModalOpen] = useState<boolean>(false);
  const [depenseModalOpen, setDepenseModalOpen] = useState<boolean>(false);
  const [importOuvert, setImportOuvert] = useState<boolean>(false);

  const selectedTransaction = transactions.find((t) => t.id === selectedTransactionId);
  const aFaire = resteAFaire(depenses);
  /* La file d'attente d'un relevé bancaire n'a de sens que s'il y a quelque
     chose dedans. Affichée vide, elle occupait le centre de l'écran avec
     « aucune transaction » pendant que treize dépenses restaient invisibles. */
  const fileImport = transactions.filter((t) => t.status !== "validated" && t.status !== "ignored");

  return (
    <div className="space-y-6 pb-12">
      {/* Les six cartes de chiffres ne s'affichent QUE sur l'écran autonome.
          Intégrées dans Comptabilité, elles répétaient sous les yeux ce que la
          bande du haut venait de dire. Décision CEO du 2026-09-09. */}
      {!embedded && <ExpenseJournalKpis data={kpis} />}

      {/* Ce qui reste à faire n'est pas un chiffre à contempler : c'est du
          travail. Il tient en une phrase, et il disparaît quand tout est
          classé et validé. */}
      {(aFaire.aClasser > 0 || aFaire.aValider > 0 || fileImport.length > 0) && (
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-lg border border-si-amber/40 bg-si-amber/[0.08] px-4 py-3">
          <span className="text-[13px] font-medium text-si-amber-ink">{td("toDoTitle")}</span>
          <span className="text-[12.5px] text-si-body">
            {[
              aFaire.aClasser > 0 ? td("toDoSort", { count: aFaire.aClasser }) : null,
              aFaire.aValider > 0 ? td("toDoValidate", { count: aFaire.aValider }) : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </div>
      )}

      {/* ── Les dépenses ─────────────────────────────────────────── */}
      <section>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <h2 className="text-[11px] font-medium uppercase tracking-[0.09em] text-si-ink">
            {td("sectionTitle")}
          </h2>
          {canWrite && (
            <div className="ml-auto flex items-center gap-2">
              {/* Deux portes d'import cohabitaient : un bouton flottant et une
                  carte entière pour un seul bouton. Une seule, repliée. */}
              <button
                type="button"
                onClick={() => setImportOuvert((v) => !v)}
                aria-expanded={importOuvert}
                className="safe-zoom inline-flex min-h-tap items-center gap-1.5 rounded-md border border-si-line bg-si-surface px-3 text-xs font-medium text-si-ink transition-colors hover:border-si-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-si-accent/30"
              >
                <Upload size={13} />
                {td("importMenu")}
              </button>
              <button
                type="button"
                onClick={() => setDepenseModalOpen(true)}
                className="safe-zoom safe-action-degrade inline-flex min-h-tap items-center gap-1.5 rounded-md px-3 text-xs font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-si-accent/30"
              >
                <Plus size={14} />
                {td("addExpense")}
              </button>
            </div>
          )}
        </div>

        {canWrite && importOuvert && (
          <div className="mb-4 space-y-3 rounded-lg border border-si-line bg-si-surface p-4">
            <button
              type="button"
              onClick={() => {
                setRecuModalOpen(true);
                setImportOuvert(false);
              }}
              className="safe-zoom inline-flex min-h-tap items-center gap-1.5 rounded-md border border-si-line bg-si-surface px-3 text-xs font-medium text-si-ink"
            >
              <Receipt size={13} />
              {td("importReceipt")}
            </button>
            <ImportStatementBlock
              onSuccess={() => {
                setSelectedTransactionId(null);
                setImportOuvert(false);
                router.refresh();
              }}
            />
          </div>
        )}

        <DepensesTable depenses={depenses} categories={categories} />
      </section>

      {/* ── La file d'attente d'un relevé importé ────────────────── */}
      {fileImport.length > 0 && (
        <section>
          <h2 className="mb-3 text-[11px] font-medium uppercase tracking-[0.09em] text-si-ink">
            {td("importedQueue")}
          </h2>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className={canWrite && selectedTransaction ? "xl:col-span-2" : "xl:col-span-3"}>
              <ExpensesJournalTable
                transactions={fileImport}
                categories={categories}
                selectedId={selectedTransactionId}
                onSelectTransaction={canWrite ? setSelectedTransactionId : () => {}}
                onValidationComplete={() => setSelectedTransactionId(null)}
              />
            </div>
            {/* Le panneau de validation n'apparaît QUE sur sélection. Il
                occupait un tiers de la largeur en permanence pour dire
                « sélectionnez une transaction ». */}
            {canWrite && selectedTransaction && (
              <div className="xl:col-span-1">
                <ValidationPanel
                  transaction={selectedTransaction}
                  categories={categories}
                  onClose={() => setSelectedTransactionId(null)}
                  onValidated={() => setSelectedTransactionId(null)}
                />
              </div>
            )}
          </div>
        </section>
      )}

      {canWrite && (
        <>
          <AjouterDepenseModal
            open={depenseModalOpen}
            onClose={() => setDepenseModalOpen(false)}
            categories={categories}
            onSuccess={() => router.refresh()}
          />
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
        </>
      )}

      {/* Après la boucle quotidienne, pas avant. Importer et valider est le geste
          de tous les jours ; confirmer les taxes est une dette qu'on vient solder. */}
      <TaxesAConfirmerSection
        depenses={taxesAConfirmer}
        sansOrigine={taxesSansOrigine}
        canWrite={canWrite}
      />
    </div>
  );
}
