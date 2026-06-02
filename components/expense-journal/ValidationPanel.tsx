"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("billingCompUi");
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
        <CardHeader title={t("validationCorrection")} className="pb-2" />
        <CardContent>
          <p className="text-sm text-[var(--safe-text-muted)]">
            {t("selectTransactionHint")}
          </p>
        </CardContent>
      </Card>
    );
  }

  const tx = transaction;
  async function handleValidate() {
    setSaving(true);
    try {
      const result = await validateImportedTransaction({
        transactionId: tx.id,
        categoryId: currentCategoryId || undefined,
        categoryName: currentCategoryName || "Autres",
        refacturable,
        learnRule,
      });
      if (result.success) {
        toast.success(t("transactionValidated"));
        router.refresh();
        onValidated();
      } else {
        toast.error(result.error ?? t("error"));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("error"));
    } finally {
      setSaving(false);
    }
  }

  async function handleIgnore() {
    setIgnoring(true);
    try {
      await ignoreTransactions([tx.id]);
      toast.success(t("transactionIgnored"));
      router.refresh();
      onValidated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("error"));
    } finally {
      setIgnoring(false);
    }
  }

  const isAlreadyValidated = tx.status === "validated" || tx.status === "ignored";

  return (
    <Card>
      <CardHeader
        title={t("validationCorrection")}
        className="pb-2 flex flex-row items-center justify-between gap-2"
        action={
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-safe-sm text-[var(--safe-text-muted)] hover:bg-white/10 hover:text-[var(--safe-text-title)]"
            aria-label={t("close")}
          >
            <X className="h-4 w-4" />
          </button>
        }
      />
      <CardContent className="space-y-4">
        <div>
          <p className="text-xs font-medium text-[var(--safe-text-muted)] uppercase tracking-wider mb-1">
            {t("description")}
          </p>
          <p className="text-sm font-medium text-[var(--safe-text-title)] break-words">
            {tx.rawDescription}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-[var(--safe-text-muted)]">{t("date")}</span>
            <p className="font-medium text-[var(--safe-text-title)]">{formatDate(tx.date)}</p>
          </div>
          <div>
            <span className="text-[var(--safe-text-muted)]">{t("amount")}</span>
            <p className="font-medium text-[var(--safe-text-title)]">
              {formatCurrency(tx.rawAmount)}
            </p>
          </div>
          <div>
            <span className="text-[var(--safe-text-muted)]">{t("supplier")}</span>
            <p className="font-medium text-[var(--safe-text-title)] truncate" title={tx.normalizedSupplier ?? undefined}>
              {tx.normalizedSupplier ?? "—"}
            </p>
          </div>
        </div>

        {!isAlreadyValidated && (
          <>
            <div>
              <label className="block text-xs font-medium text-[var(--safe-text-muted)] uppercase tracking-wider mb-1">
                {t("category")}
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
                <option value="">{t("chooseOption")}</option>
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
              {t("rebillableToClient")}
            </label>
            <label className="flex items-center gap-2 text-sm text-[var(--safe-text-title)] cursor-pointer">
              <input
                type="checkbox"
                checked={learnRule}
                onChange={(e) => setLearnRule(e.target.checked)}
                className="rounded border-[var(--safe-neutral-border)]"
              />
              {t("rememberForNextTime")}
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
                    {t("saving")}
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    {t("validate")}
                  </>
                )}
              </Button>
              <Button variant="tertiary" onClick={handleIgnore} disabled={ignoring}>
                {ignoring ? "…" : t("ignoreThisLine")}
              </Button>
            </div>
          </>
        )}

        {isAlreadyValidated && (
          <p className="text-sm text-[var(--safe-text-muted)]">
            {t("alreadyProcessed", { status: tx.status })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
