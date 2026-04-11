"use client";

import { motion } from "framer-motion";
import { T } from "@/lib/onboarding/translations";
import { calculateOnboardingValue } from "@/lib/onboarding/calculator";
import type { StepProps } from "@/lib/onboarding/types";

export default function Step8Offer({ data, setData, lang, errors }: StepProps) {
  const result = calculateOnboardingValue(data);

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-[var(--safe-darkest)] mb-2">
        {T("step8Title", lang)}
      </h2>

      {/* ── Section 1 : Message Jérémie ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="bg-[var(--safe-darkest)] text-white rounded-2xl p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[var(--safe-accent)] flex items-center justify-center">
            <span className="text-white text-sm font-bold">JT</span>
          </div>
          <p className="text-sm font-medium text-[var(--safe-sage)]">Jérémie Tiahou</p>
        </div>
        <p className="text-sm leading-relaxed italic text-white/90">
          {T("offerIntro", lang)}
        </p>
      </motion.div>

      {/* ── Section 2 : Tableau de valeur ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="border border-[var(--safe-neutral-border)] rounded-2xl overflow-hidden"
      >
        <div className="bg-[var(--safe-lightest)] px-6 py-3 border-b border-[var(--safe-neutral-border)]">
          <h3 className="text-sm font-semibold text-[var(--safe-darkest)]">
            {T("valueTable", lang)}
          </h3>
        </div>
        <div className="divide-y divide-[var(--safe-neutral-100)]">
          {result.lineItems.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.1, duration: 0.3 }}
              className="flex justify-between items-center px-6 py-3"
            >
              <span className="text-sm text-[var(--safe-darkest)]">{item.label[lang]}</span>
              <span className="text-sm font-semibold text-[var(--safe-darkest)]">{item.amount} $</span>
            </motion.div>
          ))}
        </div>
        <div className="bg-[var(--safe-accent)] text-white flex justify-between items-center px-6 py-4">
          <span className="font-semibold">{T("totalValue", lang)}</span>
          <span className="text-xl font-bold">{result.totalValue} $</span>
        </div>
      </motion.div>

      {/* ── Section 3 : Révélation du prix ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="text-center py-8"
      >
        <p className="text-[var(--safe-text-muted)] text-sm mb-3">{T("whatYouPay", lang)}</p>
        <div className="inline-flex items-baseline gap-1 bg-[var(--safe-lightest)] border-2 border-[var(--safe-accent)] rounded-2xl px-8 py-4">
          <span className="text-lg font-medium text-[var(--safe-darkest)]">{result.plan.name[lang]}</span>
          <span className="mx-2 text-[var(--safe-text-muted)]">—</span>
          <span className="text-4xl font-bold text-[var(--safe-accent)]">{result.plan.price}$</span>
          <span className="text-sm text-[var(--safe-text-muted)]">{T("perMonth", lang)}</span>
        </div>
        <p className="mt-4 text-sm font-medium text-[var(--safe-darkest)]">{T("noSetupFees", lang)}</p>
        <p className="mt-1 text-xs text-[var(--safe-accent)] font-semibold">{T("founderOffer", lang)}</p>
      </motion.div>

      {/* ── Section 4 : Prise de rendez-vous ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="bg-white border border-[var(--safe-neutral-border)] rounded-2xl p-6"
      >
        <h3 className="text-lg font-bold text-[var(--safe-darkest)] mb-5">
          {T("bookCall", lang)}
        </h3>

        <div className="space-y-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-[var(--safe-darkest)] mb-1.5">
              {T("preferredDate", lang)} <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={data.preferredDate}
              onChange={(e) => setData({ preferredDate: e.target.value })}
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--safe-neutral-border)] text-sm outline-none focus:border-[var(--safe-accent)] focus:ring-2 focus:ring-[var(--safe-accent)]/20"
            />
            {errors.preferredDate && <p className="text-xs text-red-500 mt-1">{errors.preferredDate}</p>}
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-[var(--safe-darkest)] mb-2">
              {T("preferredTime", lang)} <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: "morning", key: "timeMorning" as const },
                { value: "afternoon", key: "timeAfternoon" as const },
                { value: "evening", key: "timeEvening" as const },
              ]).map(({ value, key }) => (
                <button key={value} type="button" onClick={() => setData({ preferredTime: value })}
                  className={`py-3 rounded-xl border text-sm font-medium transition-all duration-200
                    ${data.preferredTime === value
                      ? "bg-[var(--safe-accent)] text-white border-[var(--safe-accent)]"
                      : "bg-white border-[var(--safe-neutral-border)] text-[var(--safe-darkest)] hover:border-[var(--safe-sage)]"}`}>
                  {T(key, lang)}
                </button>
              ))}
            </div>
            {errors.preferredTime && <p className="text-xs text-red-500 mt-1">{errors.preferredTime}</p>}
          </div>

          {/* Message optionnel */}
          <div>
            <label className="block text-sm font-medium text-[var(--safe-darkest)] mb-1.5">
              {T("optionalMessage", lang)} {T("optional", lang)}
            </label>
            <textarea
              value={data.optionalMessage}
              onChange={(e) => setData({ optionalMessage: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--safe-neutral-border)] text-sm outline-none focus:border-[var(--safe-accent)] focus:ring-2 focus:ring-[var(--safe-accent)]/20 resize-none"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
