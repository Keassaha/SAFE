"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { LogoMark } from "@/components/brand/Logo";
import { ArrowRight, Home } from "lucide-react";

const LOCALE_COOKIE = "NEXT_LOCALE";

function setLocaleCookie(locale: "fr" | "en") {
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000;SameSite=Lax`;
}

export function InscriptionGate() {
  const router = useRouter();
  const t = useTranslations("inscriptionGate");
  const [step, setStep] = useState<1 | 2>(1);
  const ease = [0.16, 1, 0.3, 1] as const;

  useEffect(() => {
    // Reset scroll en haut à chaque changement d'étape.
    window.scrollTo({ top: 0 });
  }, [step]);

  function handleContinue() {
    setStep(2);
  }

  function handleLanguageSelect(locale: "fr" | "en") {
    setLocaleCookie(locale);
    setTimeout(() => router.push("/audit-gratuit"), 250);
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-6 py-16 relative overflow-hidden">
      {/* Halo décoratif très subtil */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(900px circle at 50% 0%, rgba(31,58,46,0.06), transparent 55%)",
        }}
      />

      <div className="relative w-full max-w-lg flex flex-col items-center">
        {/* Logo — le vrai logo du site */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease }}
          className="mb-10"
        >
          <LogoMark size={32} />
        </motion.div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.55, ease }}
              className="w-full"
            >
              <article className="relative bg-surface border border-[0.5px] border-border rounded-[12px] p-10 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.25)] overflow-hidden">
                {/* Trait vert supérieur */}
                <span
                  aria-hidden
                  className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-forest-600 to-transparent"
                />

                <span className="text-[12px] font-sans uppercase tracking-[0.15em] text-forest-600 font-medium block mb-4">
                  Accès anticipé
                </span>

                <h1 className="font-serif text-[28px] leading-[1.15] tracking-[-0.02em] text-text-primary mb-4">
                  {t("title")}
                </h1>

                <p className="text-[14.5px] text-text-body font-sans leading-[1.65] mb-10">
                  {t("description")}
                </p>

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => router.push("/")}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-[7px] text-[13.5px] font-sans font-medium text-text-muted hover:text-text-primary hover:bg-surface-2 transition-colors duration-200"
                  >
                    <Home className="h-4 w-4" />
                    {t("backHome")}
                  </button>
                  <button
                    type="button"
                    onClick={handleContinue}
                    className="group inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-[7px] bg-forest-600 text-white text-[13.5px] font-sans font-semibold hover:bg-forest-700 active:scale-[0.98] transition-all duration-200 shadow-[0_8px_24px_-10px_rgba(31,58,46,0.5)]"
                  >
                    {t("continue")}
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </button>
                </div>
              </article>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.55, ease }}
              className="w-full flex flex-col items-center text-center"
            >
              <span className="text-[12px] font-sans uppercase tracking-[0.15em] text-forest-600 font-medium block mb-4">
                Langue
              </span>
              <h2 className="font-serif text-[26px] leading-[1.2] tracking-[-0.02em] text-text-primary mb-10 max-w-sm">
                {t("chooseLanguage")}
              </h2>

              <div className="flex justify-center gap-4 w-full max-w-sm">
                {(["fr", "en"] as const).map((loc) => (
                  <motion.button
                    key={loc}
                    type="button"
                    onClick={() => handleLanguageSelect(loc)}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.97 }}
                    className="group relative flex-1 flex flex-col items-center justify-center h-28 rounded-[10px] bg-surface border border-[0.5px] border-border hover:border-forest-600/50 hover:shadow-[0_20px_50px_-25px_rgba(31,58,46,0.35)] transition-[border-color,box-shadow] duration-400 overflow-hidden"
                  >
                    <motion.span
                      aria-hidden
                      className="absolute top-0 left-0 h-[2px] w-full bg-gradient-to-r from-forest-600 to-transparent origin-left"
                      initial={{ scaleX: 0 }}
                      whileHover={{ scaleX: 1 }}
                      transition={{ duration: 0.6, ease }}
                    />
                    <span className="font-serif text-[28px] tracking-[-0.02em] text-text-primary">
                      {loc.toUpperCase()}
                    </span>
                    <span className="mt-1 text-[12px] font-sans text-text-subtle group-hover:text-forest-600 transition-colors">
                      {loc === "fr" ? "Français" : "English"}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
