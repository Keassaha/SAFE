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
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center text-center max-w-sm w-full"
        >
          {/* Logo SAFE */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="mb-10 flex flex-col items-center gap-3"
          >
            <div className="w-16 h-16 rounded-2xl bg-[var(--safe-text-title)] flex items-center justify-center">
              <span className="text-2xl font-bold text-[var(--safe-white)] font-sans tracking-tight">S</span>
            </div>
            <p className="text-2xl font-bold font-sans tracking-tight text-[var(--safe-text-title)]">
              SAFE
            </p>
          </motion.div>

          {/* Titre */}
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-xl font-semibold font-sans text-[var(--safe-text-title)] mb-2"
          >
            Audit d&apos;efficacité gratuit
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
            className="text-sm text-[var(--safe-text-secondary)] font-sans mb-10 leading-relaxed"
          >
            Choisissez votre langue pour commencer.
            <br />
            <span className="text-[var(--safe-text-secondary)]/70 text-xs">
              Choose your language to get started.
            </span>
          </motion.p>

          {/* Boutons langue */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex gap-4 w-full"
          >
            <button
              onClick={() => setLang("fr")}
              className="flex-1 flex flex-col items-center gap-2 py-5 rounded-safe-md border-2 border-[var(--safe-sage)]/30 hover:border-[var(--safe-text-title)] hover:bg-[var(--safe-text-title)] hover:text-[var(--safe-white)] text-[var(--safe-text-title)] transition-all duration-250 group"
            >
              <span className="text-2xl">🇫🇷</span>
              <span className="text-sm font-semibold font-sans">Français</span>
            </button>

            <button
              onClick={() => setLang("en")}
              className="flex-1 flex flex-col items-center gap-2 py-5 rounded-safe-md border-2 border-[var(--safe-sage)]/30 hover:border-[var(--safe-text-title)] hover:bg-[var(--safe-text-title)] hover:text-[var(--safe-white)] text-[var(--safe-text-title)] transition-all duration-250 group"
            >
              <span className="text-2xl">🇨🇦</span>
              <span className="text-sm font-semibold font-sans">English</span>
            </button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-8 text-xs text-[var(--safe-text-secondary)]/60 font-sans"
          >
            ~8 min · Gratuit · Confidentiel
          </motion.p>
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
