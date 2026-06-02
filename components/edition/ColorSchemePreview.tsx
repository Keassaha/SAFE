"use client";

import { useTranslations } from "next-intl";
import { FolderOpen, FileText, ChevronRight } from "lucide-react";

const SCHEMES = {
  current: {
    nameKey: "schemeCurrentName",
    colors: {
      famille: { bg: "bg-blue-50", border: "border-blue-200", tab: "bg-blue-400", icon: "text-blue-500" },
      immobilier: { bg: "bg-amber-50", border: "border-amber-200", tab: "bg-amber-500", icon: "text-amber-600" },
      litige: { bg: "bg-red-50", border: "border-red-200", tab: "bg-red-400", icon: "text-red-500" },
      contrat: { bg: "bg-gray-50", border: "border-gray-200", tab: "bg-gray-400", icon: "text-gray-500" },
      immigration: { bg: "bg-green-50", border: "border-green-200", tab: "bg-green-500", icon: "text-green-600" },
      succession: { bg: "bg-purple-50", border: "border-purple-200", tab: "bg-purple-400", icon: "text-purple-500" },
    },
  },
  slate: {
    nameKey: "schemeSlateName",
    colors: {
      famille: { bg: "bg-slate-50", border: "border-slate-200", tab: "bg-slate-600", icon: "text-slate-700" },
      immobilier: { bg: "bg-slate-50", border: "border-slate-200", tab: "bg-slate-600", icon: "text-slate-700" },
      litige: { bg: "bg-slate-50", border: "border-slate-200", tab: "bg-slate-700", icon: "text-slate-700" },
      contrat: { bg: "bg-slate-50", border: "border-slate-200", tab: "bg-slate-600", icon: "text-slate-700" },
      immigration: { bg: "bg-slate-50", border: "border-slate-200", tab: "bg-slate-600", icon: "text-slate-700" },
      succession: { bg: "bg-slate-50", border: "border-slate-200", tab: "bg-slate-700", icon: "text-slate-700" },
    },
  },
  blue: {
    nameKey: "schemeBlueName",
    colors: {
      famille: { bg: "bg-blue-50", border: "border-blue-150", tab: "bg-blue-700", icon: "text-blue-800" },
      immobilier: { bg: "bg-slate-50", border: "border-slate-200", tab: "bg-blue-700", icon: "text-blue-800" },
      litige: { bg: "bg-blue-50", border: "border-blue-150", tab: "bg-blue-700", icon: "text-blue-800" },
      contrat: { bg: "bg-slate-50", border: "border-slate-200", tab: "bg-blue-700", icon: "text-blue-800" },
      immigration: { bg: "bg-blue-50", border: "border-blue-150", tab: "bg-blue-700", icon: "text-blue-800" },
      succession: { bg: "bg-slate-50", border: "border-slate-200", tab: "bg-blue-700", icon: "text-blue-800" },
    },
  },
  minimal: {
    nameKey: "schemeMinimalName",
    colors: {
      famille: { bg: "bg-white", border: "border-gray-300", tab: "bg-gray-900", icon: "text-gray-800" },
      immobilier: { bg: "bg-gray-50", border: "border-gray-300", tab: "bg-gray-900", icon: "text-gray-800" },
      litige: { bg: "bg-white", border: "border-gray-300", tab: "bg-gray-900", icon: "text-gray-800" },
      contrat: { bg: "bg-gray-50", border: "border-gray-300", tab: "bg-gray-900", icon: "text-gray-800" },
      immigration: { bg: "bg-white", border: "border-gray-300", tab: "bg-gray-900", icon: "text-gray-800" },
      succession: { bg: "bg-gray-50", border: "border-gray-300", tab: "bg-gray-900", icon: "text-gray-800" },
    },
  },
};

const DOSSIER_TYPES = [
  { type: "famille", labelKey: "schemeMatterFamille" },
  { type: "immobilier", labelKey: "schemeMatterImmobilier" },
  { type: "litige", labelKey: "schemeMatterLitige" },
  { type: "contrat", labelKey: "schemeMatterContrat" },
  { type: "immigration", labelKey: "schemeMatterImmigration" },
  { type: "succession", labelKey: "schemeMatterSuccession" },
];

function FolderCardPreview({
  type,
  label,
  colors,
}: {
  type: string;
  label: string;
  colors: Record<string, any>;
}) {
  const t = useTranslations("editorUi");
  const color = colors[type as keyof typeof colors];
  return (
    <div
      className={`rounded-lg border-2 ${color.bg} ${color.border} shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 overflow-hidden`}
    >
      <div className={`h-2 ${color.tab} w-1/2 rounded-b-sm mx-4`} />
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm leading-tight">{label}</p>
            <p className="text-xs text-gray-500 mt-0.5">#2024-{type.substring(0, 3).toUpperCase()}</p>
          </div>
          <FolderOpen className={`w-5 h-5 shrink-0 ${color.icon}`} />
        </div>

        <div className="space-y-1.5 border-t border-current border-opacity-10 pt-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center gap-2 text-xs">
              <FileText className="w-3 h-3 text-gray-400 shrink-0" />
              <span className="truncate text-gray-600 flex-1">{t("sampleDocument", { n })}</span>
              <span className="text-gray-400 shrink-0">{t("sampleRelativeTime")}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-gray-500">{t("documentCount", { count: 3 })}</span>
          <span className={`text-xs font-medium ${color.icon} opacity-70 flex items-center gap-1`}>
            {t("open")} <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </div>
  );
}

export function ColorSchemePreview() {
  const t = useTranslations("editorUi");
  return (
    <div className="w-full bg-white py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-900">
          {t("colorSchemeTitle")}
        </h1>
        <p className="text-center text-gray-600 mb-12">
          {t("colorSchemeSubtitle")}
        </p>

        <div className="space-y-16">
          {Object.entries(SCHEMES).map(([key, scheme]) => (
            <div key={key} className="border-b border-gray-200 pb-12 last:border-b-0">
              <h2 className="text-2xl font-semibold text-gray-900 mb-1">{t(scheme.nameKey)}</h2>
              <p className="text-sm text-gray-600 mb-6">
                {key === "current" && t("schemeCurrentDesc")}
                {key === "slate" && t("schemeSlateDesc")}
                {key === "blue" && t("schemeBlueDesc")}
                {key === "minimal" && t("schemeMinimalDesc")}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {DOSSIER_TYPES.map(({ type, labelKey }) => (
                  <FolderCardPreview
                    key={type}
                    type={type}
                    label={t(labelKey)}
                    colors={scheme.colors}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">{t("recommendation")}</h3>
          <p className="text-sm text-blue-800">
            {t.rich("recommendationText", {
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
