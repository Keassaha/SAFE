"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { motion } from "framer-motion";

const AuditChat = dynamic(() => import("@/components/audit/AuditChat"), {
  loading: () => (
    <div className="flex-1 flex items-center justify-center">
      <div className="animate-pulse space-y-4 w-full max-w-xl px-4">
        <div className="h-12 bg-neutral-200 rounded-safe-sm w-3/4" />
        <div className="h-8 bg-neutral-100 rounded-safe-sm w-1/2" />
        <div className="h-32 bg-neutral-100 rounded-safe-sm" />
      </div>
    </div>
  ),
});

type Lang = "fr" | "en";

export default function AuditGratuitPage() {
  const [lang, setLang] = useState<Lang | null>(null);

  if (!lang) {
    return (
      <div className="min-h-screen bg-[var(--safe-white)] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md text-center"
        >
          <div className="mb-10 flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--safe-text-title)] flex items-center justify-center">
              <span className="text-2xl font-bold text-[var(--safe-white)] font-sans tracking-tight">S</span>
            </div>
          </div>
          <p className="mb-10 text-lg font-medium text-[var(--safe-text-title)]">Safe</p>
          <p className="mb-10 text-sm font-medium text-[var(--safe-text-secondary)]">
            Choisissez votre langue
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setLang("fr")}
              className="h-24 w-32 rounded-safe-md border border-[var(--safe-sage)]/30 bg-[var(--safe-white)] hover:border-[var(--safe-text-title)] hover:bg-[var(--safe-text-title)]/5 text-[var(--safe-text-title)] transition-all duration-300 group"
            >
              <span className="block text-xl font-bold">FR</span>
              <span className="mt-1 block text-xs text-[var(--safe-text-secondary)]">Français</span>
            </button>
            <button
              onClick={() => setLang("en")}
              className="h-24 w-32 rounded-safe-md border border-[var(--safe-sage)]/30 bg-[var(--safe-white)] hover:border-[var(--safe-text-title)] hover:bg-[var(--safe-text-title)]/5 text-[var(--safe-text-title)] transition-all duration-300 group"
            >
              <span className="block text-xl font-bold">EN</span>
              <span className="mt-1 block text-xs text-[var(--safe-text-secondary)]">English</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col h-screen overflow-hidden bg-[var(--safe-white)]">
      <main className="flex-1 overflow-hidden">
        <AuditChat lang={lang} />
      </main>
    </div>
  );
}
