"use client";

import { motion } from "framer-motion";
import type { Lang } from "@/lib/onboarding/types";

interface Props {
  onSelect: (lang: Lang) => void;
}

export default function LanguageSelect({ onSelect }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="flex flex-col items-center justify-center min-h-[70vh] px-4"
    >
      {/* Logo */}
      <div className="mb-8">
        <div className="w-16 h-16 rounded-2xl bg-[var(--safe-accent)] flex items-center justify-center">
          <span className="text-white text-2xl font-bold tracking-tight">S</span>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-bold text-[var(--safe-darkest)] mb-3 text-center">
        Bonjour / Hello
      </h1>
      <p className="text-[var(--safe-text-muted)] text-base md:text-lg mb-10 text-center max-w-md">
        Choisissez votre langue / Please select your language
      </p>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <button
          onClick={() => onSelect("fr")}
          className="flex-1 py-4 px-8 rounded-xl text-lg font-semibold
                     bg-[var(--safe-accent)] text-white
                     hover:bg-[var(--safe-green-800)] active:scale-[0.98]
                     transition-all duration-200 shadow-md hover:shadow-lg"
        >
          Français
        </button>
        <button
          onClick={() => onSelect("en")}
          className="flex-1 py-4 px-8 rounded-xl text-lg font-semibold
                     border-2 border-[var(--safe-accent)] text-[var(--safe-accent)]
                     hover:bg-[var(--safe-accent)] hover:text-white active:scale-[0.98]
                     transition-all duration-200"
        >
          English
        </button>
      </div>
    </motion.div>
  );
}
