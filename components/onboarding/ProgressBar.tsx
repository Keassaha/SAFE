"use client";

import type { Lang } from "@/lib/onboarding/types";
import { Tf } from "@/lib/onboarding/translations";

interface Props {
  step: number; // 1-8
  lang: Lang;
}

export default function ProgressBar({ step, lang }: Props) {
  const progress = (step / 8) * 100;

  return (
    <div className="w-full max-w-2xl mx-auto mb-6">
      {/* Label */}
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-medium text-[var(--safe-text-muted)]">
          {Tf("stepOf", lang, { n: step })}
        </span>
        <span className="text-xs text-[var(--safe-text-muted)]">
          {Math.round(progress)}%
        </span>
      </div>

      {/* Bar */}
      <div className="h-2 bg-[var(--safe-neutral-100)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--safe-accent)] rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step dots */}
      <div className="flex justify-between mt-2">
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              i + 1 <= step
                ? "bg-[var(--safe-accent)]"
                : "bg-[var(--safe-neutral-300)]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
