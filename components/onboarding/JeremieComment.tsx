"use client";

import { motion } from "framer-motion";
import type { Lang } from "@/lib/onboarding/types";
import { T, type TranslationKey } from "@/lib/onboarding/translations";

interface Props {
  step: number;
  lang: Lang;
}

const COMMENT_KEYS: Record<number, TranslationKey> = {
  1: "jeremie0",
  2: "jeremie1",
  3: "jeremie2",
  4: "jeremie3",
  5: "jeremie4",
  6: "jeremie5",
  7: "jeremie6",
  8: "jeremie7",
};

export default function JeremieComment({ step, lang }: Props) {
  const key = COMMENT_KEYS[step];
  if (!key) return null;

  return (
    <motion.div
      key={step}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="flex items-start gap-3 mb-8 max-w-2xl mx-auto"
    >
      {/* Avatar */}
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--safe-accent)] flex items-center justify-center shadow-sm">
        <span className="text-white text-sm font-bold">JT</span>
      </div>

      {/* Bubble */}
      <div className="flex-1 bg-[var(--safe-lightest)] border border-[var(--safe-neutral-border)] rounded-2xl rounded-tl-md px-5 py-4">
        <p className="text-sm font-medium text-[var(--safe-accent)] mb-1">
          {lang === "fr" ? "Jérémie Tiahou" : "Jérémie Tiahou"}
        </p>
        <p className="text-[var(--safe-darkest)] text-sm leading-relaxed italic">
          {T(key, lang)}
        </p>
      </div>
    </motion.div>
  );
}
