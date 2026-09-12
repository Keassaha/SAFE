"use client";

/**
 * SAFE — Inscrire une dépense à la main.
 *
 * LA PORTE QUI MANQUAIT. Une dépense ne pouvait entrer que par l'import d'un
 * relevé bancaire ou la photo d'un reçu. Payée comptant sans reçu à scanner,
 * ou reçue par courriel, elle n'entrait pas du tout.
 */

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { creerDepenseManuelle } from "@/app/(app)/journal/depenses/actions";
import { toCalendarDayUTC, toIsoDay } from "@/lib/utils/calendar-date";

interface AjouterDepenseModalProps {
  open: boolean;
  onClose: () => void;
  categories: Array<{ id: string; name: string }>;
  onSuccess?: () => void;
}

const selectClass =
  "h-tap w-full rounded-md border border-si-line bg-si-surface px-3 text-sm text-si-ink outline-none transition-colors hover:border-si-muted focus:border-si-border-strong focus:ring-2 focus:ring-si-ink/[0.06]";

export function AjouterDepenseModal({
  open,
  onClose,
  categories,
  onSuccess,
}: AjouterDepenseModalProps) {
  const t = useTranslations("expenseJournal");
  const tc = useTranslations("common");

  const [date, setDate] = useState(() => toIsoDay(toCalendarDayUTC(new Date())));
  const [libelle, setLibelle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [montant, setMontant] = useState("");
  const [tps, setTps] = useState("");
  const [tvq, setTvq] = useState("");
  const [sansTaxe, setSansTaxe] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDate(toIsoDay(toCalendarDayUTC(new Date())));
    setLibelle("");
    setCategoryId("");
    setMontant("");
    setTps("");
    setTvq("");
    setSansTaxe(false);
    setErreur(null);
  }, [open]);

  const nombreOuNull = (v: string): number | null => {
    const n = Number(v.replace(",", "."));
    return v.trim() !== "" && Number.isFinite(n) ? n : null;
  };

  async function enregistrer(e: React.FormEvent) {
    e.preventDefault();
    if (envoi) return;
    setErreur(null);
    setEnvoi(true);
    try {
      const res = await creerDepenseManuelle({
        date,
        libelle,
        categoryId: categoryId || null,
        montant: Number(montant.replace(",", ".")),
        tps: sansTaxe ? null : nombreOuNull(tps),
        tvq: sansTaxe ? null : nombreOuNull(tvq),
        sansTaxe,
      });
      if (!res.success) {
        setErreur(res.error);
        return;
      }
      toast.success(t("newExpenseTitle"));
      onSuccess?.();
      onClose();
    } catch {
      setErreur(t("errorGeneric"));
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t("newExpenseTitle")}>
      <form onSubmit={enregistrer} className="space-y-4">
        {/* Dire tout de suite ce qui N'A PAS sa place ici : une somme avancée
            pour un client n'est pas une dépense du cabinet. */}
        <p className="text-[12.5px] leading-relaxed text-si-muted">{t("newExpenseIntro")}</p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label={t("fieldDate")}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          <Input
            label={t("fieldAmount")}
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
            placeholder="0,00"
            required
          />
        </div>

        <Input
          label={t("fieldSupplier")}
          value={libelle}
          onChange={(e) => setLibelle(e.target.value)}
          placeholder="Bureau en Gros"
          required
        />

        <div>
          <label
            htmlFor="depense-categorie"
            className="mb-1.5 block text-sm font-medium text-si-ink"
          >
            {t("fieldCategory")}
          </label>
          <select
            id="depense-categorie"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={selectClass}
          >
            <option value="">{t("uncategorized")}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="border-t border-si-line pt-4">
          <label className="flex min-h-tap cursor-pointer items-center gap-2.5 text-sm text-si-ink">
            <input
              type="checkbox"
              checked={sansTaxe}
              onChange={(e) => setSansTaxe(e.target.checked)}
              className="rounded border-si-line text-si-verified focus:ring-si-accent/30"
            />
            {t("noTax")}
          </label>

          {!sansTaxe && (
            <>
              <div className="mt-3 grid grid-cols-2 gap-4">
                <Input
                  label={t("fieldTps")}
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  value={tps}
                  onChange={(e) => setTps(e.target.value)}
                  placeholder="0,00"
                />
                <Input
                  label={t("fieldTvq")}
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  value={tvq}
                  onChange={(e) => setTvq(e.target.value)}
                  placeholder="0,00"
                />
              </div>
              {/* Une taxe estimée n'est pas justifiable en vérification : mieux
                  vaut le dire au moment de la saisie qu'au moment du contrôle. */}
              <p className="mt-2 text-[12px] leading-relaxed text-si-muted">{t("taxesHint")}</p>
            </>
          )}
        </div>

        {erreur && <p className="text-sm text-status-error">{erreur}</p>}

        <div className="flex gap-2 pt-1">
          <Button type="submit" disabled={envoi}>
            {envoi ? t("saving") : t("save")}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} disabled={envoi}>
            {tc("cancel")}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
