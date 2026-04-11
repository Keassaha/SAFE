"use client";

import { T } from "@/lib/onboarding/translations";
import type { StepProps } from "@/lib/onboarding/types";

const TEAM_STRUCTURES = [
  { value: "solo", key: "teamSolo" as const },
  { value: "plus_assistant", key: "teamPlusAssistant" as const },
  { value: "multi_attorneys", key: "teamMultiAttorneys" as const },
  { value: "full_team", key: "teamFull" as const },
  { value: "other", key: "other" as const },
];

const INVOICE_PREP = [
  { value: "attorney", key: "invoicePrepAttorney" as const },
  { value: "assistant", key: "invoicePrepAssistant" as const },
  { value: "both", key: "invoicePrepBoth" as const },
  { value: "other", key: "other" as const },
];

const TECH_LEVELS = [
  { value: "beginner", key: "techBeginner" as const },
  { value: "intermediate", key: "techIntermediate" as const },
  { value: "advanced", key: "techAdvanced" as const },
];

export default function Step5Team({ data, setData, lang, errors }: StepProps) {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-[var(--safe-darkest)] mb-6">
        {T("step5Title", lang)}
      </h2>

      {/* Structure */}
      <div>
        <label className="block text-sm font-medium text-[var(--safe-darkest)] mb-2">
          {T("teamStructure", lang)} <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {TEAM_STRUCTURES.map(({ value, key }) => (
            <button key={value} type="button" onClick={() => setData({ teamStructure: value })}
              className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all duration-200 text-left
                ${data.teamStructure === value
                  ? "bg-[var(--safe-accent)] text-white border-[var(--safe-accent)]"
                  : "bg-white border-[var(--safe-neutral-border)] text-[var(--safe-darkest)] hover:border-[var(--safe-sage)]"}`}>
              {T(key, lang)}
            </button>
          ))}
        </div>
        {data.teamStructure === "other" && (
          <input type="text" value={data.teamStructureOther} onChange={(e) => setData({ teamStructureOther: e.target.value })}
            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-[var(--safe-neutral-border)] text-sm outline-none focus:border-[var(--safe-accent)] focus:ring-2 focus:ring-[var(--safe-accent)]/20"
            placeholder={T("otherPlaceholder", lang)} />
        )}
        {errors.teamStructure && <p className="text-xs text-red-500 mt-1">{errors.teamStructure}</p>}
      </div>

      {/* Total users */}
      <div>
        <label className="block text-sm font-medium text-[var(--safe-darkest)] mb-2">
          {T("totalUsers", lang)} <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-4 gap-2">
          {["1", "2", "3-5", "6-15"].map((val) => (
            <button key={val} type="button" onClick={() => setData({ totalUsers: val })}
              className={`py-3 rounded-xl border text-sm font-semibold transition-all duration-200
                ${data.totalUsers === val
                  ? "bg-[var(--safe-accent)] text-white border-[var(--safe-accent)]"
                  : "bg-white border-[var(--safe-neutral-border)] text-[var(--safe-darkest)] hover:border-[var(--safe-sage)]"}`}>
              {val}
            </button>
          ))}
        </div>
        {errors.totalUsers && <p className="text-xs text-red-500 mt-1">{errors.totalUsers}</p>}
      </div>

      {/* Who prepares invoices */}
      <div>
        <label className="block text-sm font-medium text-[var(--safe-darkest)] mb-2">
          {T("whoPreparesInvoices", lang)} <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {INVOICE_PREP.map(({ value, key }) => (
            <button key={value} type="button" onClick={() => setData({ whoPreparesInvoices: value })}
              className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all duration-200
                ${data.whoPreparesInvoices === value
                  ? "bg-[var(--safe-accent)] text-white border-[var(--safe-accent)]"
                  : "bg-white border-[var(--safe-neutral-border)] text-[var(--safe-darkest)] hover:border-[var(--safe-sage)]"}`}>
              {T(key, lang)}
            </button>
          ))}
        </div>
        {data.whoPreparesInvoices === "other" && (
          <input type="text" value={data.whoPreparesInvoicesOther} onChange={(e) => setData({ whoPreparesInvoicesOther: e.target.value })}
            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-[var(--safe-neutral-border)] text-sm outline-none focus:border-[var(--safe-accent)] focus:ring-2 focus:ring-[var(--safe-accent)]/20"
            placeholder={T("otherPlaceholder", lang)} />
        )}
        {errors.whoPreparesInvoices && <p className="text-xs text-red-500 mt-1">{errors.whoPreparesInvoices}</p>}
      </div>

      {/* Tech comfort */}
      <div>
        <label className="block text-sm font-medium text-[var(--safe-darkest)] mb-2">
          {T("techComfort", lang)} <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {TECH_LEVELS.map(({ value, key }) => (
            <button key={value} type="button" onClick={() => setData({ techComfort: value })}
              className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all duration-200
                ${data.techComfort === value
                  ? "bg-[var(--safe-accent)] text-white border-[var(--safe-accent)]"
                  : "bg-white border-[var(--safe-neutral-border)] text-[var(--safe-darkest)] hover:border-[var(--safe-sage)]"}`}>
              {T(key, lang)}
            </button>
          ))}
        </div>
        {errors.techComfort && <p className="text-xs text-red-500 mt-1">{errors.techComfort}</p>}
      </div>
    </div>
  );
}
