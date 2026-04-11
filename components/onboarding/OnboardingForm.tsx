"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Lang, OnboardingData } from "@/lib/onboarding/types";
import { INITIAL_DATA } from "@/lib/onboarding/types";
import { T } from "@/lib/onboarding/translations";

import LanguageSelect from "./LanguageSelect";
import JeremieComment from "./JeremieComment";
import ProgressBar from "./ProgressBar";

import Step1FirmInfo from "./steps/Step1FirmInfo";
import Step2Practice from "./steps/Step2Practice";
import Step3Billing from "./steps/Step3Billing";
import Step4Trust from "./steps/Step4Trust";
import Step5Team from "./steps/Step5Team";
import Step6Tools from "./steps/Step6Tools";
import Step7Priorities from "./steps/Step7Priorities";
import Step8Offer from "./steps/Step8Offer";

/* ─────────────────────────────────────────────
   Validation par étape
   ───────────────────────────────────────────── */

function validateStep(step: number, data: OnboardingData, lang: Lang): Record<string, string> {
  const errors: Record<string, string> = {};
  const req = lang === "fr" ? "Ce champ est requis" : "This field is required";
  const emailErr = lang === "fr" ? "Courriel invalide" : "Invalid email";

  switch (step) {
    case 1:
      if (!data.firmName.trim()) errors.firmName = req;
      if (!data.leadName.trim()) errors.leadName = req;
      if (!data.email.trim()) errors.email = req;
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = emailErr;
      if (!data.barNumber.trim()) errors.barNumber = req;
      if (!data.province) errors.province = req;
      if (!data.address.trim()) errors.address = req;
      if (!data.phone.trim()) errors.phone = req;
      break;
    case 2:
      if (data.practiceAreas.length === 0) errors.practiceAreas = req;
      if (!data.monthlyNewFiles) errors.monthlyNewFiles = req;
      if (!data.clientType) errors.clientType = req;
      break;
    case 3:
      if (!data.billingMethod) errors.billingMethod = req;
      if (!data.billingFrequency) errors.billingFrequency = req;
      if (!data.paymentTerms) errors.paymentTerms = req;
      if (data.paymentMethods.length === 0) errors.paymentMethods = req;
      break;
    case 4:
      if (!data.hasTrustAccount) errors.hasTrustAccount = req;
      if (data.hasTrustAccount === "yes") {
        if (!data.trustAccountCount) errors.trustAccountCount = req;
        if (!data.reconciliationFrequency) errors.reconciliationFrequency = req;
      }
      if (!data.auditIssues) errors.auditIssues = req;
      break;
    case 5:
      if (!data.teamStructure) errors.teamStructure = req;
      if (!data.totalUsers) errors.totalUsers = req;
      if (!data.whoPreparesInvoices) errors.whoPreparesInvoices = req;
      if (!data.techComfort) errors.techComfort = req;
      break;
    case 6:
      if (!data.currentSoftware) errors.currentSoftware = req;
      if (!data.hasDataToMigrate) errors.hasDataToMigrate = req;
      if (data.hasDataToMigrate === "yes" && !data.dataFormat) errors.dataFormat = req;
      if (!data.primaryDevice) errors.primaryDevice = req;
      break;
    case 7:
      if (data.urgentChallenges.length === 0) errors.urgentChallenges = req;
      if (!data.goLiveTimeline) errors.goLiveTimeline = req;
      break;
    case 8:
      if (!data.preferredDate) errors.preferredDate = req;
      if (!data.preferredTime) errors.preferredTime = req;
      break;
  }
  return errors;
}

/* ─────────────────────────────────────────────
   Composant principal
   ───────────────────────────────────────────── */

export default function OnboardingForm() {
  const [lang, setLang] = useState<Lang | null>(null);
  const [step, setStep] = useState(0); // 0 = language select
  const [data, setDataRaw] = useState<OnboardingData>(INITIAL_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const setData = useCallback((updates: Partial<OnboardingData>) => {
    setDataRaw((prev) => ({ ...prev, ...updates }));
    // Clear errors for changed fields
    const keys = Object.keys(updates);
    setErrors((prev) => {
      const next = { ...prev };
      keys.forEach((k) => delete next[k]);
      return next;
    });
  }, []);

  const handleLanguageSelect = (selectedLang: Lang) => {
    setLang(selectedLang);
    setStep(1);
  };

  const handleNext = () => {
    if (!lang) return;
    const stepErrors = validateStep(step, data, lang);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    setErrors({});
    if (step < 8) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setErrors({});
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async () => {
    if (!lang) return;
    const stepErrors = validateStep(8, data, lang);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lang, data }),
      });
      if (res.ok) {
        setIsSubmitted(true);
      }
    } catch {
      // Silently handle — UI will remain on step 8
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepProps = {
    data,
    setData,
    lang: lang || "fr",
    errors,
  };

  const STEPS: Record<number, React.ReactNode> = {
    1: <Step1FirmInfo {...stepProps} />,
    2: <Step2Practice {...stepProps} />,
    3: <Step3Billing {...stepProps} />,
    4: <Step4Trust {...stepProps} />,
    5: <Step5Team {...stepProps} />,
    6: <Step6Tools {...stepProps} />,
    7: <Step7Priorities {...stepProps} />,
    8: <Step8Offer {...stepProps} />,
  };

  /* ── Success screen ── */
  if (isSubmitted && lang) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-16 h-16 rounded-full bg-[var(--safe-accent)] flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-lg font-semibold text-[var(--safe-darkest)] mb-2">
            {T("thankYou", lang)}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8">
      <AnimatePresence mode="wait">
        {step === 0 ? (
          <motion.div key="lang" exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
            <LanguageSelect onSelect={handleLanguageSelect} />
          </motion.div>
        ) : (
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          >
            {lang && (
              <>
                <ProgressBar step={step} lang={lang} />
                <JeremieComment step={step} lang={lang} />
                {STEPS[step]}

                {/* Navigation */}
                <div className="flex justify-between items-center mt-10 max-w-2xl mx-auto">
                  <button
                    type="button"
                    onClick={handleBack}
                    className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                      ${step === 1
                        ? "invisible"
                        : "border border-[var(--safe-neutral-border)] text-[var(--safe-darkest)] hover:bg-[var(--safe-neutral-100)]"}`}
                  >
                    {T("back", lang)}
                  </button>

                  {step < 8 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-8 py-2.5 rounded-xl text-sm font-semibold
                                 bg-[var(--safe-accent)] text-white
                                 hover:bg-[var(--safe-green-800)] active:scale-[0.98]
                                 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      {T("next", lang)}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="px-8 py-3 rounded-xl text-sm font-semibold
                                 bg-[var(--safe-accent)] text-white
                                 hover:bg-[var(--safe-green-800)] active:scale-[0.98]
                                 transition-all duration-200 shadow-md hover:shadow-lg
                                 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? T("submitting", lang) : T("confirmCall", lang)}
                    </button>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
