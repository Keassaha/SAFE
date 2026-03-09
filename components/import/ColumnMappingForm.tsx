"use client";

import { useTranslations } from "next-intl";
import type { ColumnMapping } from "@/lib/import/types";

export function ColumnMappingForm({
  mapping,
  fieldLabels,
  fileHeaders,
  onChange,
}: {
  mapping: ColumnMapping;
  fieldLabels: Record<string, string>;
  fileHeaders: string[];
  onChange: (field: string, column: string | null) => void;
}) {
  const t = useTranslations("import");
  return (
    <div className="space-y-3">
      <p className="text-xs safe-text-secondary">
        {t("mappingInstruction")}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.entries(fieldLabels).map(([field, label]) => {
          const currentCol = mapping[field] ?? "";
          return (
            <div key={field} className="flex flex-col gap-1">
              <label className="text-xs font-medium safe-text-secondary">{label}</label>
              <select
                value={currentCol}
                onChange={(e) => onChange(field, e.target.value || null)}
                className="
                  h-9 px-3 rounded-[var(--safe-radius-default)] border border-[var(--safe-neutral-border)]
                  bg-white/90 backdrop-blur-sm text-sm safe-text-title
                  focus:ring-2 focus:ring-[var(--safe-green-600)]/20 focus:border-[var(--safe-green-600)] outline-none
                  transition-all
                "
              >
                <option value="">{t("notMapped")}</option>
                {fileHeaders.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}
