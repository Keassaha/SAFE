"use client";

import { useTranslations } from "next-intl";

interface DossierDetailSectionProps {
  dossierId: string;
  label: string;
  description?: string | null;
  sourceReglementaire?: string | null;
  sectionKey: string;
}

export function DossierDetailSection({
  dossierId: _dossierId,
  label,
  description,
  sourceReglementaire,
  sectionKey: _sectionKey,
}: DossierDetailSectionProps) {
  const t = useTranslations("matterDetailUi");
  return (
    <div className="rounded-lg border border-si-line bg-[var(--safe-neutral-bg)] p-6 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-si-ink">{label}</h3>
          {description && (
            <p className="text-xs text-si-muted">{description}</p>
          )}
        </div>
        {sourceReglementaire && (
          <span className="shrink-0 rounded-lg bg-si-canvas border border-si-line/60 px-2 py-0.5 text-[10px] font-medium text-si-muted">
            {sourceReglementaire}
          </span>
        )}
      </div>

      <div className="rounded-lg border border-dashed border-si-line bg-si-canvas/50 p-4 text-center">
        <p className="text-xs text-si-muted/60">
          {t("sectionEmptyState")}
        </p>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-si-line bg-si-surface px-3 py-1.5 text-xs font-medium text-si-ink hover:bg-si-canvas transition-colors"
        >
          {t("addDocument")}
        </button>
      </div>
    </div>
  );
}
