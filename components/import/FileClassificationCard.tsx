"use client";

import { Receipt, Users, Clock, CheckCircle2, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { DocumentType, ClassificationResult } from "@/lib/import/types";

const TYPE_ICONS: Record<DocumentType, typeof Receipt> = {
  releve_bancaire: Receipt,
  registre_clients: Users,
  fiches_temps: Clock,
};

const TYPE_BADGE_CLASSES: Record<DocumentType, string> = {
  releve_bancaire: "bg-[var(--safe-status-warning-bg)] text-[var(--safe-status-warning)] border-[var(--safe-status-warning)]/20",
  registre_clients: "bg-[var(--safe-green-50)] text-[var(--safe-green-800)] border-[var(--safe-green-600)]/20",
  fiches_temps: "bg-[var(--safe-green-50)] text-[var(--safe-green-800)] border-[var(--safe-green-600)]/20",
};

export function FileClassificationCard({
  fileName,
  classification,
  totalRows,
  onTypeChange,
}: {
  fileName: string;
  classification: ClassificationResult;
  totalRows: number;
  onTypeChange: (type: DocumentType) => void;
}) {
  const t = useTranslations("import");
  const TYPE_LABELS: Record<DocumentType, string> = {
    releve_bancaire: t("bankStatement"),
    registre_clients: t("clientRegistry"),
    fiches_temps: t("timesheets"),
  };
  const Icon = TYPE_ICONS[classification.type];
  const badgeClass = TYPE_BADGE_CLASSES[classification.type];
  const label = TYPE_LABELS[classification.type];
  const isHighConfidence = classification.confidence >= 0.7;

  return (
    <div className="flex items-start gap-4 px-5 py-4 rounded-[var(--safe-radius-lg)] bg-white/70 border border-[var(--safe-neutral-border)]/60 transition-all duration-200 hover:bg-white/85">
      <div className="w-10 h-10 rounded-[var(--safe-radius-md)] bg-[var(--safe-green-50)] border border-[var(--safe-green-100)] flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-[var(--safe-icon-default)]" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium safe-text-title truncate">{fileName}</span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${badgeClass}`}>
            {isHighConfidence ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <AlertTriangle className="w-3 h-3" />
            )}
            {label}
          </span>
        </div>

        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-xs safe-text-secondary">
            {totalRows.toLocaleString()} {t("linesCount")}
          </span>
          <span className="text-xs safe-text-secondary">
            {t("confidence", { percent: Math.round(classification.confidence * 100) })}
          </span>
        </div>

        {!isHighConfidence && (
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <span className="text-xs safe-text-secondary">{t("correct")}</span>
            {(Object.keys(TYPE_LABELS) as DocumentType[])
              .filter((dt) => dt !== classification.type)
              .map((dt) => (
                <button
                  key={dt}
                  type="button"
                  onClick={() => onTypeChange(dt)}
                  className="text-xs px-2 py-1 rounded-[var(--safe-radius-sm)] border border-[var(--safe-neutral-border)] bg-white/80 hover:bg-white safe-text-title transition-colors"
                >
                  {TYPE_LABELS[dt]}
                </button>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
