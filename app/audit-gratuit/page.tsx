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
      <div className="min-h-screen auth-container flex items-center justify-center px-4 py-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md text-center"
        >
          <div className="mb-10 flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-white font-sans tracking-tight">S</span>
            </div>
          </div>
          <p className="mb-10 text-lg font-medium text-white">Safe</p>
          <p className="mb-10 text-sm font-medium text-white/70">Choisissez votre langue</p>
          <div className="flex justify-center gap-5">
            <button
              onClick={() => setLang("fr")}
              className="group relative h-24 w-36 overflow-hidden rounded-safe-md border border-white/20 bg-white/8 backdrop-blur-sm transition-all duration-300 hover:border-white/40 hover:bg-white/14 hover:shadow-lg hover:scale-[1.03] active:scale-[0.98]"
            >
              <span className="block text-2xl font-bold text-white">FR</span>
              <span className="mt-1 block text-xs text-white/55 transition-colors group-hover:text-white/75">Français</span>
            </button>
            <button
              onClick={() => setLang("en")}
              className="group relative h-24 w-36 overflow-hidden rounded-safe-md border border-white/20 bg-white/8 backdrop-blur-sm transition-all duration-300 hover:border-white/40 hover:bg-white/14 hover:shadow-lg hover:scale-[1.03] active:scale-[0.98]"
            >
              <span className="block text-2xl font-bold text-white">EN</span>
              <span className="mt-1 block text-xs text-white/55 transition-colors group-hover:text-white/75">English</span>
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
