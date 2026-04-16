"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { SafeLogo } from "@/components/branding/SafeLogo";
import { ArrowRight, Home } from "lucide-react";

const LOCALE_COOKIE = "NEXT_LOCALE";

function setLocaleCookie(locale: "fr" | "en") {
  document.cookie = `${LOCALE_COOKIE}=${locale};path=/;max-age=31536000;SameSite=Lax`;
}

export function InscriptionGate() {
  const router = useRouter();
  const t = useTranslations("inscriptionGate");
  const [step, setStep] = useState<1 | 2>(1);
  const [visible, setVisible] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    // Trigger entrance animation on mount / step change
    setVisible(false);
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true));
    });
    return () => cancelAnimationFrame(id);
  }, [step]);

  function handleContinue() {
    setTransitioning(true);
    setTimeout(() => {
      setTransitioning(false);
      setStep(2);
    }, 400);
  }

  function handleLanguageSelect(locale: "fr" | "en") {
    setLocaleCookie(locale);
    setTransitioning(true);
    setTimeout(() => {
      router.push("/audit-gratuit");
    }, 450);
  }

  const animClass = visible && !transitioning
    ? "opacity-100 translate-y-0"
    : "opacity-0 translate-y-6";

  return (
    <div className="min-h-screen auth-container flex items-center justify-center px-4 py-10">
      {step === 1 && (
        <div className={`w-full max-w-lg transition-all duration-500 ease-out ${animClass}`}>
          <div className="mb-8 flex justify-center">
            <SafeLogo variant="dark" className="shrink-0" />
          </div>

          <div className="auth-card overflow-hidden border border-white/25 p-8 shadow-2xl">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-1 w-8 rounded-full bg-primary-400/60" />
            </div>
            <h1 className="text-xl font-semibold text-white">
              {t("title")}
            </h1>

            <p className="mt-4 text-sm leading-relaxed text-white/75">
              {t("description")}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="inline-flex items-center justify-center gap-2 rounded-safe px-5 py-2.5 text-sm font-medium text-white/70 transition-all duration-200 hover:bg-white/10 hover:text-white"
              >
                <Home className="h-4 w-4" />
                {t("backHome")}
              </button>
              <button
                type="button"
                onClick={handleContinue}
                className="inline-flex items-center justify-center gap-2 rounded-safe bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-primary-500 hover:shadow-md active:scale-[0.98]"
              >
                {t("continue")}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className={`w-full max-w-md text-center transition-all duration-500 ease-out ${animClass}`}>
          <div className="mb-10 flex justify-center">
            <SafeLogo variant="dark" className="shrink-0" />
          </div>

          <p className="mb-10 text-lg font-medium text-white/85">
            {t("chooseLanguage")}
          </p>

          <div className="flex justify-center gap-5">
            <button
              type="button"
              onClick={() => handleLanguageSelect("fr")}
              className="group relative h-24 w-36 overflow-hidden rounded-safe-md border border-white/20 bg-white/8 backdrop-blur-sm transition-all duration-300 hover:border-white/40 hover:bg-white/14 hover:shadow-lg hover:scale-[1.03] active:scale-[0.98]"
            >
              <span className="block text-2xl font-bold text-white">FR</span>
              <span className="mt-1 block text-xs text-white/55 transition-colors group-hover:text-white/75">
                Français
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleLanguageSelect("en")}
              className="group relative h-24 w-36 overflow-hidden rounded-safe-md border border-white/20 bg-white/8 backdrop-blur-sm transition-all duration-300 hover:border-white/40 hover:bg-white/14 hover:shadow-lg hover:scale-[1.03] active:scale-[0.98]"
            >
              <span className="block text-2xl font-bold text-white">EN</span>
              <span className="mt-1 block text-xs text-white/55 transition-colors group-hover:text-white/75">
                English
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
