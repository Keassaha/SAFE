"use client";

import { T } from "@/lib/onboarding/translations";
import type { StepProps } from "@/lib/onboarding/types";

const SOFTWARE_OPTIONS = [
  { value: "excel", key: "swExcel" as const },
  { value: "clio", key: "swClio" as const },
  { value: "pclaw", key: "swPCLaw" as const },
  { value: "cosmolex", key: "swCosmolex" as const },
  { value: "paper", key: "swPaper" as const },
  { value: "other", key: "other" as const },
];

const DATA_FORMATS = [
  { value: "excel", key: "formatExcel" as const },
  { value: "pdf", key: "formatPDF" as const },
  { value: "software", key: "formatSoftware" as const },
  { value: "paper", key: "formatPaper" as const },
  { value: "other", key: "other" as const },
];

const DEVICES = [
  { value: "windows", key: "deviceWindows" as const },
  { value: "mac", key: "deviceMac" as const },
  { value: "both", key: "deviceBoth" as const },
];

export default function Step6Tools({ data, setData, lang, errors }: StepProps) {
  const showDataFormat = data.hasDataToMigrate === "yes";

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-[var(--safe-darkest)] mb-6">
        {T("step6Title", lang)}
      </h2>

      {/* Logiciel actuel */}
      <div>
        <label className="block text-sm font-medium text-[var(--safe-darkest)] mb-2">
          {T("currentSoftware", lang)} <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SOFTWARE_OPTIONS.map(({ value, key }) => (
            <button key={value} type="button" onClick={() => setData({ currentSoftware: value })}
              className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all duration-200
                ${data.currentSoftware === value
                  ? "bg-[var(--safe-accent)] text-white border-[var(--safe-accent)]"
                  : "bg-white border-[var(--safe-neutral-border)] text-[var(--safe-darkest)] hover:border-[var(--safe-sage)]"}`}>
              {T(key, lang)}
            </button>
          ))}
        </div>
        {data.currentSoftware === "other" && (
          <input type="text" value={data.currentSoftwareOther} onChange={(e) => setData({ currentSoftwareOther: e.target.value })}
            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-[var(--safe-neutral-border)] text-sm outline-none focus:border-[var(--safe-accent)] focus:ring-2 focus:ring-[var(--safe-accent)]/20"
            placeholder={T("otherPlaceholder", lang)} />
        )}
        {errors.currentSoftware && <p className="text-xs text-red-500 mt-1">{errors.currentSoftware}</p>}
      </div>

      {/* Migration */}
      <div>
        <label className="block text-sm font-medium text-[var(--safe-darkest)] mb-2">
          {T("hasDataToMigrate", lang)} <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {([
            { value: "yes", key: "yes" as const },
            { value: "no", key: "no" as const },
            { value: "not_sure", key: "migrateNotSure" as const },
          ]).map(({ value, key }) => (
            <button key={value} type="button" onClick={() => setData({ hasDataToMigrate: value })}
              className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all duration-200
                ${data.hasDataToMigrate === value
                  ? "bg-[var(--safe-accent)] text-white border-[var(--safe-accent)]"
                  : "bg-white border-[var(--safe-neutral-border)] text-[var(--safe-darkest)] hover:border-[var(--safe-sage)]"}`}>
              {T(key, lang)}
            </button>
          ))}
        </div>
        {errors.hasDataToMigrate && <p className="text-xs text-red-500 mt-1">{errors.hasDataToMigrate}</p>}
      </div>

      {/* Format données (conditionnel) */}
      {showDataFormat && (
        <div>
          <label className="block text-sm font-medium text-[var(--safe-darkest)] mb-2">
            {T("dataFormat", lang)} <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {DATA_FORMATS.map(({ value, key }) => (
              <button key={value} type="button" onClick={() => setData({ dataFormat: value })}
                className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all duration-200
                  ${data.dataFormat === value
                    ? "bg-[var(--safe-accent)] text-white border-[var(--safe-accent)]"
                    : "bg-white border-[var(--safe-neutral-border)] text-[var(--safe-darkest)] hover:border-[var(--safe-sage)]"}`}>
                {T(key, lang)}
              </button>
            ))}
          </div>
          {data.dataFormat === "other" && (
            <input type="text" value={data.dataFormatOther} onChange={(e) => setData({ dataFormatOther: e.target.value })}
              className="w-full mt-2 px-4 py-2.5 rounded-xl border border-[var(--safe-neutral-border)] text-sm outline-none focus:border-[var(--safe-accent)] focus:ring-2 focus:ring-[var(--safe-accent)]/20"
              placeholder={T("otherPlaceholder", lang)} />
          )}
          {errors.dataFormat && <p className="text-xs text-red-500 mt-1">{errors.dataFormat}</p>}
        </div>
      )}

      {/* Appareil */}
      <div>
        <label className="block text-sm font-medium text-[var(--safe-darkest)] mb-2">
          {T("primaryDevice", lang)} <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {DEVICES.map(({ value, key }) => (
            <button key={value} type="button" onClick={() => setData({ primaryDevice: value })}
              className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all duration-200
                ${data.primaryDevice === value
                  ? "bg-[var(--safe-accent)] text-white border-[var(--safe-accent)]"
                  : "bg-white border-[var(--safe-neutral-border)] text-[var(--safe-darkest)] hover:border-[var(--safe-sage)]"}`}>
              {T(key, lang)}
            </button>
          ))}
        </div>
        {errors.primaryDevice && <p className="text-xs text-red-500 mt-1">{errors.primaryDevice}</p>}
      </div>
    </div>
  );
}
