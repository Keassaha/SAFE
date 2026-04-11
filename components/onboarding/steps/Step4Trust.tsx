"use client";

import { T } from "@/lib/onboarding/translations";
import type { StepProps } from "@/lib/onboarding/types";

export default function Step4Trust({ data, setData, lang, errors }: StepProps) {
  const showDetails = data.hasTrustAccount === "yes";

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-[var(--safe-darkest)] mb-6">
        {T("step4Title", lang)}
      </h2>

      {/* Compte en fidéicommis */}
      <div>
        <label className="block text-sm font-medium text-[var(--safe-darkest)] mb-2">
          {T("hasTrustAccount", lang)} <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {(["yes", "no"] as const).map((val) => (
            <button key={val} type="button" onClick={() => setData({ hasTrustAccount: val })}
              className={`py-4 rounded-xl border text-sm font-semibold transition-all duration-200
                ${data.hasTrustAccount === val
                  ? "bg-[var(--safe-accent)] text-white border-[var(--safe-accent)]"
                  : "bg-white border-[var(--safe-neutral-border)] text-[var(--safe-darkest)] hover:border-[var(--safe-sage)]"}`}>
              {T(val === "yes" ? "yes" : "no", lang)}
            </button>
          ))}
        </div>
        {errors.hasTrustAccount && <p className="text-xs text-red-500 mt-1">{errors.hasTrustAccount}</p>}
      </div>

      {showDetails && (
        <>
          {/* Nombre de comptes */}
          <div>
            <label className="block text-sm font-medium text-[var(--safe-darkest)] mb-2">
              {T("trustAccountCount", lang)} <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["1", "2", "3+"] as const).map((val) => (
                <button key={val} type="button" onClick={() => setData({ trustAccountCount: val })}
                  className={`py-3 rounded-xl border text-sm font-semibold transition-all duration-200
                    ${data.trustAccountCount === val
                      ? "bg-[var(--safe-accent)] text-white border-[var(--safe-accent)]"
                      : "bg-white border-[var(--safe-neutral-border)] text-[var(--safe-darkest)] hover:border-[var(--safe-sage)]"}`}>
                  {val}
                </button>
              ))}
            </div>
            {errors.trustAccountCount && <p className="text-xs text-red-500 mt-1">{errors.trustAccountCount}</p>}
          </div>

          {/* Fréquence réconciliation */}
          <div>
            <label className="block text-sm font-medium text-[var(--safe-darkest)] mb-2">
              {T("reconciliationFreq", lang)} <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: "weekly", key: "freqWeekly" as const },
                { value: "monthly", key: "freqMonthlyTrust" as const },
                { value: "irregular", key: "freqIrregular" as const },
                { value: "other", key: "other" as const },
              ]).map(({ value, key }) => (
                <button key={value} type="button" onClick={() => setData({ reconciliationFrequency: value })}
                  className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all duration-200
                    ${data.reconciliationFrequency === value
                      ? "bg-[var(--safe-accent)] text-white border-[var(--safe-accent)]"
                      : "bg-white border-[var(--safe-neutral-border)] text-[var(--safe-darkest)] hover:border-[var(--safe-sage)]"}`}>
                  {T(key, lang)}
                </button>
              ))}
            </div>
            {data.reconciliationFrequency === "other" && (
              <input type="text" value={data.reconciliationFrequencyOther} onChange={(e) => setData({ reconciliationFrequencyOther: e.target.value })}
                className="w-full mt-2 px-4 py-2.5 rounded-xl border border-[var(--safe-neutral-border)] text-sm outline-none focus:border-[var(--safe-accent)] focus:ring-2 focus:ring-[var(--safe-accent)]/20"
                placeholder={T("otherPlaceholder", lang)} />
            )}
            {errors.reconciliationFrequency && <p className="text-xs text-red-500 mt-1">{errors.reconciliationFrequency}</p>}
          </div>
        </>
      )}

      {/* Problèmes inspection */}
      <div>
        <label className="block text-sm font-medium text-[var(--safe-darkest)] mb-2">
          {T("auditIssues", lang)} <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {([
            { value: "no", key: "auditNo" as const },
            { value: "yes", key: "auditYes" as const },
            { value: "first", key: "auditFirst" as const },
          ]).map(({ value, key }) => (
            <button key={value} type="button" onClick={() => setData({ auditIssues: value })}
              className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all duration-200
                ${data.auditIssues === value
                  ? "bg-[var(--safe-accent)] text-white border-[var(--safe-accent)]"
                  : "bg-white border-[var(--safe-neutral-border)] text-[var(--safe-darkest)] hover:border-[var(--safe-sage)]"}`}>
              {T(key, lang)}
            </button>
          ))}
        </div>
        {errors.auditIssues && <p className="text-xs text-red-500 mt-1">{errors.auditIssues}</p>}
      </div>
    </div>
  );
}
