"use client";

import { T } from "@/lib/onboarding/translations";
import { getTaxDisplay } from "@/lib/onboarding/taxes";
import type { StepProps } from "@/lib/onboarding/types";

const BILLING_METHODS = [
  { value: "hourly", key: "billingHourly" as const },
  { value: "flat_fee", key: "billingFlatFee" as const },
  { value: "per_task", key: "billingPerTask" as const },
  { value: "mixed", key: "billingMixed" as const },
  { value: "other", key: "other" as const },
];

const FREQUENCIES = [
  { value: "per_file", key: "freqPerFile" as const },
  { value: "monthly", key: "freqMonthly" as const },
  { value: "on_demand", key: "freqOnDemand" as const },
  { value: "other", key: "other" as const },
];

const PAYMENT_TERMS = [
  { value: "15", key: "terms15" as const },
  { value: "30", key: "terms30" as const },
  { value: "receipt", key: "termsReceipt" as const },
  { value: "other", key: "other" as const },
];

const PAYMENT_METHODS_LIST = [
  { value: "wire", key: "methodWire" as const },
  { value: "cheque", key: "methodCheque" as const },
  { value: "card", key: "methodCard" as const },
  { value: "cash", key: "methodCash" as const },
  { value: "other", key: "other" as const },
];

export default function Step3Billing({ data, setData, lang, errors }: StepProps) {
  const togglePayMethod = (value: string) => {
    const updated = data.paymentMethods.includes(value)
      ? data.paymentMethods.filter((m) => m !== value)
      : [...data.paymentMethods, value];
    setData({ paymentMethods: updated });
  };

  const showHourly = ["hourly", "mixed"].includes(data.billingMethod);
  const taxDisplay = data.province ? getTaxDisplay(data.province) : null;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-[var(--safe-darkest)] mb-6">
        {T("step3Title", lang)}
      </h2>

      {/* Mode de facturation */}
      <div>
        <label className="block text-sm font-medium text-[var(--safe-darkest)] mb-2">
          {T("billingMethod", lang)} <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {BILLING_METHODS.map(({ value, key }) => (
            <button
              key={value}
              type="button"
              onClick={() => setData({ billingMethod: value })}
              className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all duration-200
                ${data.billingMethod === value
                  ? "bg-[var(--safe-accent)] text-white border-[var(--safe-accent)]"
                  : "bg-white border-[var(--safe-neutral-border)] text-[var(--safe-darkest)] hover:border-[var(--safe-sage)]"}`}
            >
              {T(key, lang)}
            </button>
          ))}
        </div>
        {data.billingMethod === "other" && (
          <input type="text" value={data.billingMethodOther} onChange={(e) => setData({ billingMethodOther: e.target.value })}
            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-[var(--safe-neutral-border)] text-sm outline-none focus:border-[var(--safe-accent)] focus:ring-2 focus:ring-[var(--safe-accent)]/20"
            placeholder={T("otherPlaceholder", lang)} />
        )}
        {errors.billingMethod && <p className="text-xs text-red-500 mt-1">{errors.billingMethod}</p>}
      </div>

      {/* Taux horaire (conditionnel) */}
      {showHourly && (
        <div>
          <label className="block text-sm font-medium text-[var(--safe-darkest)] mb-1.5">
            {T("hourlyRate", lang)}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--safe-text-muted)] text-sm">$</span>
            <input type="number" value={data.hourlyRate} onChange={(e) => setData({ hourlyRate: e.target.value })}
              className="w-full pl-7 pr-4 py-2.5 rounded-xl border border-[var(--safe-neutral-border)] text-sm outline-none focus:border-[var(--safe-accent)] focus:ring-2 focus:ring-[var(--safe-accent)]/20"
              placeholder={T("hourlyRatePlaceholder", lang)} />
          </div>
        </div>
      )}

      {/* Fréquence de facturation */}
      <div>
        <label className="block text-sm font-medium text-[var(--safe-darkest)] mb-2">
          {T("billingFrequency", lang)} <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {FREQUENCIES.map(({ value, key }) => (
            <button key={value} type="button" onClick={() => setData({ billingFrequency: value })}
              className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all duration-200
                ${data.billingFrequency === value
                  ? "bg-[var(--safe-accent)] text-white border-[var(--safe-accent)]"
                  : "bg-white border-[var(--safe-neutral-border)] text-[var(--safe-darkest)] hover:border-[var(--safe-sage)]"}`}>
              {T(key, lang)}
            </button>
          ))}
        </div>
        {data.billingFrequency === "other" && (
          <input type="text" value={data.billingFrequencyOther} onChange={(e) => setData({ billingFrequencyOther: e.target.value })}
            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-[var(--safe-neutral-border)] text-sm outline-none focus:border-[var(--safe-accent)] focus:ring-2 focus:ring-[var(--safe-accent)]/20"
            placeholder={T("otherPlaceholder", lang)} />
        )}
        {errors.billingFrequency && <p className="text-xs text-red-500 mt-1">{errors.billingFrequency}</p>}
      </div>

      {/* Délai de paiement */}
      <div>
        <label className="block text-sm font-medium text-[var(--safe-darkest)] mb-2">
          {T("paymentTerms", lang)} <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {PAYMENT_TERMS.map(({ value, key }) => (
            <button key={value} type="button" onClick={() => setData({ paymentTerms: value })}
              className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all duration-200
                ${data.paymentTerms === value
                  ? "bg-[var(--safe-accent)] text-white border-[var(--safe-accent)]"
                  : "bg-white border-[var(--safe-neutral-border)] text-[var(--safe-darkest)] hover:border-[var(--safe-sage)]"}`}>
              {T(key, lang)}
            </button>
          ))}
        </div>
        {data.paymentTerms === "other" && (
          <input type="text" value={data.paymentTermsOther} onChange={(e) => setData({ paymentTermsOther: e.target.value })}
            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-[var(--safe-neutral-border)] text-sm outline-none focus:border-[var(--safe-accent)] focus:ring-2 focus:ring-[var(--safe-accent)]/20"
            placeholder={T("otherPlaceholder", lang)} />
        )}
        {errors.paymentTerms && <p className="text-xs text-red-500 mt-1">{errors.paymentTerms}</p>}
      </div>

      {/* Méthodes de paiement */}
      <div>
        <label className="block text-sm font-medium text-[var(--safe-darkest)] mb-1">
          {T("paymentMethods", lang)} <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-[var(--safe-text-muted)] mb-3">{T("paymentMethodsHint", lang)}</p>
        <div className="flex flex-wrap gap-2">
          {PAYMENT_METHODS_LIST.map(({ value, key }) => (
            <button key={value} type="button" onClick={() => togglePayMethod(value)}
              className={`py-2 px-4 rounded-full border text-sm font-medium transition-all duration-200
                ${data.paymentMethods.includes(value)
                  ? "bg-[var(--safe-accent)] text-white border-[var(--safe-accent)]"
                  : "bg-white border-[var(--safe-neutral-border)] text-[var(--safe-darkest)] hover:border-[var(--safe-sage)]"}`}>
              {T(key, lang)}
            </button>
          ))}
        </div>
        {data.paymentMethods.includes("other") && (
          <input type="text" value={data.paymentMethodsOther} onChange={(e) => setData({ paymentMethodsOther: e.target.value })}
            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-[var(--safe-neutral-border)] text-sm outline-none focus:border-[var(--safe-accent)] focus:ring-2 focus:ring-[var(--safe-accent)]/20"
            placeholder={T("otherPlaceholder", lang)} />
        )}
        {errors.paymentMethods && <p className="text-xs text-red-500 mt-1">{errors.paymentMethods}</p>}
      </div>

      {/* Taxes automatiques */}
      {taxDisplay && (
        <div className="bg-[var(--safe-lightest)] border border-[var(--safe-neutral-border)] rounded-xl px-4 py-3">
          <p className="text-sm font-medium text-[var(--safe-darkest)]">
            {T("taxesApplicable", lang)}
          </p>
          <p className="text-sm text-[var(--safe-accent)] font-semibold mt-1">{taxDisplay}</p>
          <p className="text-xs text-[var(--safe-text-muted)] mt-1">{T("taxesAuto", lang)}</p>
        </div>
      )}
    </div>
  );
}
