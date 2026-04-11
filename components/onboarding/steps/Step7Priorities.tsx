"use client";

import { T } from "@/lib/onboarding/translations";
import type { StepProps } from "@/lib/onboarding/types";

const CHALLENGES = [
  { value: "trust", key: "challengeTrust" as const },
  { value: "billing", key: "challengeBilling" as const },
  { value: "audit", key: "challengeAudit" as const },
  { value: "profitability", key: "challengeProfitability" as const },
  { value: "admin", key: "challengeAdmin" as const },
  { value: "compliance", key: "challengeCompliance" as const },
  { value: "other", key: "other" as const },
];

const TIMELINES = [
  { value: "asap", key: "goLiveASAP" as const },
  { value: "30_days", key: "goLive30" as const },
  { value: "60_90_days", key: "goLive60_90" as const },
];

export default function Step7Priorities({ data, setData, lang, errors }: StepProps) {
  const toggleChallenge = (value: string) => {
    if (data.urgentChallenges.includes(value)) {
      setData({ urgentChallenges: data.urgentChallenges.filter((c) => c !== value) });
    } else if (data.urgentChallenges.length < 3) {
      setData({ urgentChallenges: [...data.urgentChallenges, value] });
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-[var(--safe-darkest)] mb-6">
        {T("step7Title", lang)}
      </h2>

      {/* Challenges */}
      <div>
        <label className="block text-sm font-medium text-[var(--safe-darkest)] mb-1">
          {T("urgentChallenges", lang)} <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-[var(--safe-text-muted)] mb-3">{T("urgentHint", lang)}</p>
        <div className="grid grid-cols-1 gap-2">
          {CHALLENGES.map(({ value, key }) => {
            const selected = data.urgentChallenges.includes(value);
            const disabled = !selected && data.urgentChallenges.length >= 3;
            return (
              <button key={value} type="button" onClick={() => !disabled && toggleChallenge(value)}
                className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all duration-200 text-left
                  ${selected
                    ? "bg-[var(--safe-accent)] text-white border-[var(--safe-accent)]"
                    : disabled
                      ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-white border-[var(--safe-neutral-border)] text-[var(--safe-darkest)] hover:border-[var(--safe-sage)]"}`}>
                <span className="flex items-center gap-3">
                  <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0
                    ${selected ? "bg-white/20 border-white/50" : "border-[var(--safe-neutral-300)]"}`}>
                    {selected && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  {T(key, lang)}
                </span>
              </button>
            );
          })}
        </div>
        {data.urgentChallenges.includes("other") && (
          <input type="text" value={data.urgentChallengesOther} onChange={(e) => setData({ urgentChallengesOther: e.target.value })}
            className="w-full mt-2 px-4 py-2.5 rounded-xl border border-[var(--safe-neutral-border)] text-sm outline-none focus:border-[var(--safe-accent)] focus:ring-2 focus:ring-[var(--safe-accent)]/20"
            placeholder={T("otherPlaceholder", lang)} />
        )}
        {errors.urgentChallenges && <p className="text-xs text-red-500 mt-1">{errors.urgentChallenges}</p>}
      </div>

      {/* Timeline */}
      <div>
        <label className="block text-sm font-medium text-[var(--safe-darkest)] mb-2">
          {T("goLiveTimeline", lang)} <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {TIMELINES.map(({ value, key }) => (
            <button key={value} type="button" onClick={() => setData({ goLiveTimeline: value })}
              className={`py-3 px-4 rounded-xl border text-sm font-medium transition-all duration-200
                ${data.goLiveTimeline === value
                  ? "bg-[var(--safe-accent)] text-white border-[var(--safe-accent)]"
                  : "bg-white border-[var(--safe-neutral-border)] text-[var(--safe-darkest)] hover:border-[var(--safe-sage)]"}`}>
              {T(key, lang)}
            </button>
          ))}
        </div>
        {errors.goLiveTimeline && <p className="text-xs text-red-500 mt-1">{errors.goLiveTimeline}</p>}
      </div>
    </div>
  );
}
