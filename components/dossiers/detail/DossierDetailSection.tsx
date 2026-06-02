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
    <div className="rounded-safe-sm border border-[var(--safe-neutral-border)] bg-[var(--safe-neutral-bg)] p-6 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-[var(--safe-text-primary)]">{label}</h3>
          {description && (
            <p className="text-xs text-[var(--safe-text-secondary)]">{description}</p>
          )}
        </div>
        {sourceReglementaire && (
          <span className="shrink-0 rounded-safe-sm bg-slate-100 border border-slate-200/60 px-2 py-0.5 text-[10px] font-medium text-slate-500">
            {sourceReglementaire}
          </span>
        )}
      </div>

      <div className="rounded-safe-sm border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center">
        <p className="text-xs text-slate-400">
          {t("sectionEmptyState")}
        </p>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-safe-sm border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          {t("addDocument")}
        </button>
      </div>
    </div>
  );
}
