"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import {
  validateImportedTransaction,
  ignoreTransactions,
} from "@/app/(app)/journal/depenses/actions";
import type { BankImportTransaction, ExpenseCategory } from "@prisma/client";
import { Loader2, X, Check } from "lucide-react";
import { toast } from "sonner";

export function ValidationPanel({
  transaction,
  categories,
  onClose,
  onValidated,
}: {
  transaction: BankImportTransaction | null;
  categories: ExpenseCategory[];
  onClose: () => void;
  onValidated: () => void;
}) {
  const [categoryId, setCategoryId] = useState<string>("");
  const [categoryName, setCategoryName] = useState<string>("");
  const [refacturable, setRefacturable] = useState(false);
  const [learnRule, setLearnRule] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ignoring, setIgnoring] = useState(false);
  const router = useRouter();

  const suggestedName = transaction?.suggestedCategoryName ?? "";
  useEffect(() => {
    if (!transaction) {
      setCategoryId("");
      setCategoryName("");
      return;
    }
    if (suggestedName) {
      const cat = categories.find((c) => c.name === suggestedName);
      setCategoryId(cat?.id ?? "");
      setCategoryName(cat?.name ?? suggestedName);
    } else {
      setCategoryId("");
      setCategoryName("");
    }
  }, [transaction, suggestedName, categories]);

  const currentCategoryId = categoryId || (categories.find((c) => c.name === (categoryName || suggestedName))?.id ?? "");
  const currentCategoryName = categoryName || suggestedName || (categories.find((c) => c.id === currentCategoryId)?.name ?? "Autres");

  if (!transaction) {
    return (
      <Card>
        <CardHeader title="Validation / correction" className="pb-2" />
        <CardContent>
          <p className="text-sm text-[var(--safe-text-muted)]">
            Sélectionnez une transaction dans le tableau pour la valider ou la corriger.
          </p>
        </CardContent>
      </Card>
    );
  }

  const t = transaction;
  async function handleValidate() {
    setSaving(true);
    try {
      const result = await validateImportedTransaction({
        transactionId: t.id,
        categoryId: currentCategoryId || undefined,
        categoryName: currentCategoryName || "Autres",
        refacturable,
        learnRule,
      });
      if (result.success) {
        toast.success("Transaction validée.");
        router.refresh();
        onValidated();
      } else {
        toast.error(result.error ?? "Erreur");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSaving(false);
    }
  }

  async function handleIgnore() {
    setIgnoring(true);
    try {
      await ignoreTransactions([t.id]);
      toast.success("Transaction ignorée.");
      router.refresh();
      onValidated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setIgnoring(false);
    }
  }

  const isAlreadyValidated = t.status === "validated" || t.status === "ignored";

  return (
    <Card>
      <CardHeader
        title="Validation / correction"
        className="pb-2 flex flex-row items-center justify-between gap-2"
        action={
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-safe-sm text-[var(--safe-text-muted)] hover:bg-white/10 hover:text-[var(--safe-text-title)]"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        }
      />
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs font-medium text-[var(--safe-text-muted)] uppercase tracking-wider mb-1">
            Description
          </p>
          <p className="text-sm font-medium text-[var(--safe-text-title)] break-words">
            {t.rawDescription}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-[var(--safe-text-muted)]">Date</span>
            <p className="font-medium text-[var(--safe-text-title)]">{formatDate(t.date)}</p>
          </div>
          <div>
            <span className="text-[var(--safe-text-muted)]">Montant</span>
            <p className="font-medium text-[var(--safe-text-title)]">
              {formatCurrency(t.rawAmount)}
            </p>
          </div>
          <div>
            <span className="text-[var(--safe-text-muted)]">Fournisseur</span>
            <p className="font-medium text-[var(--safe-text-title)] truncate" title={t.normalizedSupplier ?? undefined}>
              {t.normalizedSupplier ?? "—"}
            </p>
          </div>
        </div>

        {!isAlreadyValidated && (
          <>
            <div>
              <label className="block text-xs font-medium text-[var(--safe-text-muted)] uppercase tracking-wider mb-1">
                Catégorie
              </label>
              <select
                className="w-full rounded-safe-sm border border-[var(--safe-neutral-border)] bg-white/5 text-sm text-[var(--safe-text-title)] px-3 py-2"
                value={currentCategoryId}
                onChange={(e) => {
                  const c = categories.find((cat) => cat.id === e.target.value);
                  setCategoryId(e.target.value);
                  setCategoryName(c?.name ?? "");
                }}
              >
                <option value="">— Choisir —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-[var(--safe-text-title)] cursor-pointer">
              <input
                type="checkbox"
                checked={refacturable}
                onChange={(e) => setRefacturable(e.target.checked)}
                className="rounded border-[var(--safe-neutral-border)]"
              />
              Refacturable au client
            </label>
            <label className="flex items-center gap-2 text-sm text-[var(--safe-text-title)] cursor-pointer">
              <input
                type="checkbox"
                checked={learnRule}
                onChange={(e) => setLearnRule(e.target.checked)}
                className="rounded border-[var(--safe-neutral-border)]"
              />
              Mémoriser pour les prochaines fois (règle apprenante)
            </label>
            <div className="flex flex-col gap-2 pt-2">
              <Button
                variant="primary"
                onClick={handleValidate}
                disabled={saving || !currentCategoryName}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Enregistrement…
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Valider
                  </>
                )}
              </Button>
              <Button variant="tertiary" onClick={handleIgnore} disabled={ignoring}>
                {ignoring ? "…" : "Ignorer cette ligne"}
              </Button>
            </div>
          </>
        )}

        {isAlreadyValidated && (
          <p className="text-sm text-[var(--safe-text-muted)]">
            Cette transaction a déjà été traitée ({t.status}).
          </p>
        )}
      </CardContent>
    </Card>
  );
}
