"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Archive, X, Check, Loader2 } from "lucide-react";
import { bulkUpdateDossiers } from "@/app/(app)/dossiers/actions";

interface DossierBulkActionBarProps {
  selectedIds: string[];
  avocats: { id: string; nom: string }[];
  onClear: () => void;
}

/**
 * Barre d'actions groupées (Lot A). Apparaît quand au moins un dossier est
 * sélectionné dans la liste. Actions : changer le statut, assigner un avocat,
 * archiver (avec confirmation en ligne). `cloture` n'est jamais proposé ici.
 */
export function DossierBulkActionBar({ selectedIds, avocats, onClear }: DossierBulkActionBarProps) {
  const t = useTranslations("matters");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const count = selectedIds.length;

  function run(input: Parameters<typeof bulkUpdateDossiers>[0]) {
    setError(null);
    startTransition(async () => {
      const res = await bulkUpdateDossiers(input);
      if (res.ok) {
        setConfirmArchive(false);
        onClear();
        router.refresh();
      } else {
        setError(t("bulkError"));
      }
    });
  }

  const selectClass =
    "h-9 px-3 rounded-lg border border-si-line bg-si-surface text-si-ink text-sm focus:ring-2 focus:ring-si-forest/20 focus:border-si-forest/40 outline-none disabled:opacity-50";

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 border-b border-si-line bg-si-forest/5 px-6 py-3">
      <span className="text-sm font-medium text-si-ink">
        {t("bulkSelectedCount", { count })}
      </span>

      {isPending && <Loader2 className="h-4 w-4 animate-spin text-si-forest" aria-hidden />}

      {!confirmArchive ? (
        <>
          {/* Changer le statut (jamais clôture) */}
          <select
            aria-label={t("bulkSetStatus")}
            defaultValue=""
            disabled={isPending}
            onChange={(e) => {
              const v = e.target.value as "ouvert" | "actif" | "en_attente" | "";
              if (v) run({ ids: selectedIds, action: "setStatut", statut: v });
              e.target.value = "";
            }}
            className={selectClass}
          >
            <option value="" disabled>
              {t("bulkSetStatus")}
            </option>
            <option value="ouvert">{t("statusOpen")}</option>
            <option value="actif">{t("statusActive")}</option>
            <option value="en_attente">{t("statusPending")}</option>
          </select>

          {/* Assigner un avocat responsable */}
          <select
            aria-label={t("bulkAssignLawyer")}
            defaultValue=""
            disabled={isPending || avocats.length === 0}
            onChange={(e) => {
              const v = e.target.value;
              if (v) run({ ids: selectedIds, action: "assignLawyer", avocatResponsableId: v });
              e.target.value = "";
            }}
            className={`${selectClass} min-w-[180px]`}
          >
            <option value="" disabled>
              {t("bulkAssignLawyer")}
            </option>
            {avocats.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nom}
              </option>
            ))}
          </select>

          {/* Archiver */}
          <button
            type="button"
            disabled={isPending}
            onClick={() => setConfirmArchive(true)}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-lg border border-si-line bg-si-surface text-si-ink hover:bg-si-canvas text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Archive className="h-4 w-4" aria-hidden />
            {t("bulkArchive")}
          </button>

          <button
            type="button"
            onClick={onClear}
            className="ml-auto inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-si-muted hover:text-si-ink hover:bg-si-canvas text-sm transition-colors"
          >
            <X className="h-4 w-4" aria-hidden />
            {t("bulkClear")}
          </button>
        </>
      ) : (
        <>
          <span className="text-sm text-si-ink">{t("bulkArchiveConfirm", { count })}</span>
          <button
            type="button"
            disabled={isPending}
            onClick={() => run({ ids: selectedIds, action: "archive" })}
            className="inline-flex items-center gap-2 h-9 px-3 rounded-lg bg-si-forest text-white hover:bg-si-forest/90 text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Check className="h-4 w-4" aria-hidden />
            {t("bulkArchiveConfirmYes")}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => setConfirmArchive(false)}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-si-muted hover:text-si-ink hover:bg-si-canvas text-sm transition-colors"
          >
            {t("bulkCancel")}
          </button>
        </>
      )}

      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
