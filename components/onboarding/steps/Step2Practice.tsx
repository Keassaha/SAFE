"use client";

import { T } from "@/lib/onboarding/translations";
import type { StepProps } from "@/lib/onboarding/types";

const PRACTICE_AREAS = [
  { value: "family", key: "areaFamily" as const },
  { value: "criminal", key: "areaCriminal" as const },
  { value: "civil", key: "areaCivil" as const },
  { value: "real_estate", key: "areaRealEstate" as const },
  { value: "corporate", key: "areaCorporate" as const },
  { value: "estates", key: "areaEstates" as const },
  { value: "litigation", key: "areaLitigation" as const },
  { value: "immigration", key: "areaImmigration" as const },
  { value: "other", key: "areaOther" as const },
];

const VOLUME_OPTIONS = [
  { value: "1-5", key: "files1_5" as const },
  { value: "6-15", key: "files6_15" as const },
  { value: "16-30", key: "files16_30" as const },
  { value: "30+", key: "files30plus" as const },
];

const CLIENT_TYPES = [
  { value: "individuals", key: "clientIndividuals" as const },
  { value: "businesses", key: "clientBusinesses" as const },
  { value: "mixed", key: "clientMixed" as const },
  { value: "other", key: "other" as const },
];

export default function Step2Practice({ data, setData, lang, errors }: StepProps) {
  const toggleArea = (value: string) => {
    const updated = data.practiceAreas.includes(value)
      ? data.practiceAreas.filter((a) => a !== value)
      : [...data.practiceAreas, value];
    setData({ practiceAreas: updated });
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-[var(--safe-darkest)] mb-6">
        {T("step2Title", lang)}
      </h2>

      {/* Domaines de pratique */}
      <div>
        <label className="block text-sm font-medium text-[var(--safe-darkest)] mb-1">
          {T("practiceAreas", lang)} <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-[var(--safe-text-muted)] mb-3">{T("practiceAreasHint", lang)}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {PRACTICE_AREAS.map(({ value, key }) => (
            <label
              key={value}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all duration-200
                ${
                  data.practiceAreas.includes(value)
                    ? "bg-[var(--safe-lightest)] border-[var(--safe-accent)] text-[var(--safe-darkest)]"
                    : "bg-white border-[var(--safe-neutral-border)] hover:border-[var(--safe-sage)]"
                }`}
            >
              <input
                type="checkbox"
                checked={data.practiceAreas.includes(value)}
                onChange={() => toggleArea(value)}
                className="sr-only"
              />
              <div
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors
                  ${
                    data.practiceAreas.includes(value)
                      ? "bg-[var(--safe-accent)] border-[var(--safe-accent)]"
                      : "border-[var(--safe-neutral-300)]"
                  }`}
              >
                {data.practiceAreas.includes(value) && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-sm">{T(key, lang)}</span>
            </label>
          ))}
        </div>
        {data.practiceAreas.includes("other") && (
          <input
            type="text"
            value={data.practiceAreasOther}
            onChange={(e) => setData({ practiceAreasOther: e.target.value })}
            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-[var(--safe-neutral-border)] text-sm outline-none focus:border-[var(--safe-accent)] focus:ring-2 focus:ring-[var(--safe-accent)]/20"
            placeholder={T("otherPlaceholder", lang)}
          />
        )}
        {errors.practiceAreas && <p className="text-xs text-red-500 mt-1">{errors.practiceAreas}</p>}
      </div>

      {/* Volume mensuel */}
      <div>
        <label className="block text-sm font-medium text-[var(--safe-darkest)] mb-2">
          {T("monthlyNewFiles", lang)} <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {VOLUME_OPTIONS.map(({ value, key }) => (
            <button
              key={value}
              type="button"
              onClick={() => setData({ monthlyNewFiles: value })}
              className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all duration-200
                ${
                  data.monthlyNewFiles === value
                    ? "bg-[var(--safe-accent)] text-white border-[var(--safe-accent)]"
                    : "bg-white border-[var(--safe-neutral-border)] text-[var(--safe-darkest)] hover:border-[var(--safe-sage)]"
                }`}
            >
              {T(key, lang)}
            </button>
          ))}
        </div>
        {errors.monthlyNewFiles && <p className="text-xs text-red-500 mt-1">{errors.monthlyNewFiles}</p>}
      </div>

      {/* Type de clientèle */}
      <div>
        <label className="block text-sm font-medium text-[var(--safe-darkest)] mb-2">
          {T("clientType", lang)} <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {CLIENT_TYPES.map(({ value, key }) => (
            <button
              key={value}
              type="button"
              onClick={() => setData({ clientType: value })}
              className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all duration-200
                ${
                  data.clientType === value
                    ? "bg-[var(--safe-accent)] text-white border-[var(--safe-accent)]"
                    : "bg-white border-[var(--safe-neutral-border)] text-[var(--safe-darkest)] hover:border-[var(--safe-sage)]"
                }`}
            >
              {T(key, lang)}
            </button>
          ))}
        </div>
        {data.clientType === "other" && (
          <input
            type="text"
            value={data.clientTypeOther}
            onChange={(e) => setData({ clientTypeOther: e.target.value })}
            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-[var(--safe-neutral-border)] text-sm outline-none focus:border-[var(--safe-accent)] focus:ring-2 focus:ring-[var(--safe-accent)]/20"
            placeholder={T("otherPlaceholder", lang)}
          />
        )}
        {errors.clientType && <p className="text-xs text-red-500 mt-1">{errors.clientType}</p>}
      </div>
    </div>
  );
}
