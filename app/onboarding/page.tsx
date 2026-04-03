"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, User, Landmark, Receipt, UserPlus, ChevronRight, ChevronLeft, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useTranslations } from "next-intl";

type Step = 1 | 2 | 3 | 4 | 5;

function InputField({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-left">
      <span className="text-sm font-medium text-[var(--safe-white)]">{label}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-safe bg-[var(--safe-darkest)] border border-white/10 px-3 py-2.5 text-sm text-[var(--safe-white)] placeholder:text-[var(--safe-text-muted)] focus:outline-none focus:border-[var(--safe-sage)] focus:ring-1 focus:ring-[var(--safe-sage)] transition-colors"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block text-left">
      <span className="text-sm font-medium text-[var(--safe-white)]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-safe bg-[var(--safe-darkest)] border border-white/10 px-3 py-2.5 text-sm text-[var(--safe-white)] focus:outline-none focus:border-[var(--safe-sage)] focus:ring-1 focus:ring-[var(--safe-sage)] transition-colors"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

const STEP_ICONS: Record<Step, typeof Building2> = {
  1: Building2,
  2: User,
  3: Landmark,
  4: Receipt,
  5: UserPlus,
};

export default function OnboardingPage() {
  const t = useTranslations("onboarding");
  const tc = useTranslations("common");
  const [step, setStep] = useState<Step>(1);

  // Step 1 — Cabinet
  const [cabinetName, setCabinetName] = useState("");
  const [siren, setSiren] = useState("");
  const [address, setAddress] = useState("");

  // Step 2 — User
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("associate");

  // Step 3 — Bank
  const [iban, setIban] = useState("");
  const [bic, setBic] = useState("");
  const [bankName, setBankName] = useState("");

  // Step 4 — Billing
  const [hourlyRate, setHourlyRate] = useState("");
  const [currency, setCurrency] = useState("EUR");
  const [paymentTerms, setPaymentTerms] = useState("30");
  const [invoicePrefix, setInvoicePrefix] = useState("FACT-");
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState("001");

  // Step 5 — First client
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientSiren, setClientSiren] = useState("");

  const STEPS: { id: Step; title: string; short: string }[] = [
    { id: 1, title: t("step1"), short: t("step1Short") },
    { id: 2, title: t("step2"), short: t("step2Short") },
    { id: 3, title: t("step3"), short: t("step3Short") },
    { id: 4, title: t("step4"), short: t("step4Short") },
    { id: 5, title: t("step5"), short: t("step5Short") },
  ];

  const prev = () => setStep((s) => Math.max(1, s - 1) as Step);
  const next = () => setStep((s) => Math.min(5, s + 1) as Step);

  const StepIcon = STEP_ICONS[step];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--safe-darkest)] via-[var(--safe-dark)] to-[var(--safe-mid-dark)] flex flex-col text-[var(--safe-white)]">
      <header className="safe-glass-topbar border-b border-neutral-border/50 h-14 flex items-center justify-between px-4 md:px-6 shrink-0">
        <Link href="/" className="text-lg font-semibold text-[var(--safe-white)]">
          SAFE
        </Link>
        <Link
          href="/tableau-de-bord"
          className="text-sm text-[var(--safe-sage)] hover:text-[var(--safe-white)] transition-colors"
        >
          {t("skipToDashboard")}
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 md:py-12">
        <div className="w-full max-w-lg mx-auto">
          {/* Step indicator */}
          <div className="flex justify-center gap-3 mb-8 md:mb-10">
            {STEPS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStep(s.id)}
                className="flex flex-col items-center gap-1.5 group"
                aria-current={step === s.id ? "step" : undefined}
                aria-label={t("stepLabel", { step: s.id, title: s.title })}
              >
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-200 ${
                    s.id < step
                      ? "bg-[var(--safe-sage)] text-[var(--safe-darkest)]"
                      : s.id === step
                        ? "bg-green-600 text-[var(--safe-white)] scale-110 shadow-sm"
                        : "bg-white/10 text-[var(--safe-text-muted)] group-hover:bg-white/20"
                  }`}
                >
                  {s.id < step ? "✓" : s.id}
                </span>
                <span className="text-[10px] md:text-xs text-[var(--safe-text-muted)] hidden sm:inline">
                  {s.short}
                </span>
              </button>
            ))}
          </div>

          {/* Step header */}
          <div className="text-center mb-6">
            <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-green-800/40 flex items-center justify-center">
              <StepIcon className="w-7 h-7 text-[var(--safe-sage)]" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--safe-white)] tracking-tight mb-2">
              {step === 1 && t("cabinetTitle")}
              {step === 2 && t("userTitle")}
              {step === 3 && t("bankTitle")}
              {step === 4 && t("billingTitle")}
              {step === 5 && t("clientTitle")}
            </h1>
            <p className="text-[var(--safe-text-muted)] text-sm md:text-base max-w-md mx-auto">
              {step === 1 && t("cabinetDescription")}
              {step === 2 && t("userDescription")}
              {step === 3 && t("bankDescription")}
              {step === 4 && t("billingDescription")}
              {step === 5 && t("clientDescription")}
            </p>
          </div>

          {/* Step content */}
          <div className="bg-[var(--safe-mid-dark)] border border-white/5 rounded-2xl p-6 md:p-8 mb-6 space-y-4">
            {step === 1 && (
              <>
                <InputField label={t("cabinetName")} placeholder={t("cabinetNamePlaceholder")} value={cabinetName} onChange={setCabinetName} />
                <InputField label={t("siren")} placeholder={t("sirenPlaceholder")} value={siren} onChange={setSiren} />
                <InputField label={t("address")} placeholder={t("addressPlaceholder")} value={address} onChange={setAddress} />
                <div className="text-left">
                  <span className="text-sm font-medium text-[var(--safe-white)]">{t("logo")}</span>
                  <div className="mt-1 flex items-center gap-3">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-safe bg-[var(--safe-darkest)] border border-white/10 px-3 py-2.5 text-sm text-[var(--safe-text-muted)] hover:border-[var(--safe-sage)] transition-colors"
                    >
                      <Upload className="w-4 h-4" />
                      {t("uploadLogo")}
                    </button>
                    <span className="text-xs text-[var(--safe-text-muted)]">{t("logoHelp")}</span>
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label={t("lastName")} placeholder={t("lastNamePlaceholder")} value={lastName} onChange={setLastName} />
                  <InputField label={t("firstName")} placeholder={t("firstNamePlaceholder")} value={firstName} onChange={setFirstName} />
                </div>
                <InputField label={t("email")} placeholder={t("emailPlaceholder")} type="email" value={email} onChange={setEmail} />
                <SelectField
                  label={t("role")}
                  value={role}
                  onChange={setRole}
                  options={[
                    { value: "associate", label: t("roleAssociate") },
                    { value: "collaborator", label: t("roleCollaborator") },
                    { value: "admin", label: t("roleAdmin") },
                  ]}
                />
              </>
            )}

            {step === 3 && (
              <>
                <InputField label={t("iban")} placeholder={t("ibanPlaceholder")} value={iban} onChange={setIban} />
                <div className="grid grid-cols-2 gap-4">
                  <InputField label={t("bic")} placeholder={t("bicPlaceholder")} value={bic} onChange={setBic} />
                  <InputField label={t("bankName")} placeholder={t("bankNamePlaceholder")} value={bankName} onChange={setBankName} />
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label={t("hourlyRate")} placeholder={t("hourlyRatePlaceholder")} type="number" value={hourlyRate} onChange={setHourlyRate} />
                  <SelectField
                    label={t("currency")}
                    value={currency}
                    onChange={setCurrency}
                    options={[
                      { value: "EUR", label: "EUR (€)" },
                      { value: "USD", label: "USD ($)" },
                      { value: "GBP", label: "GBP (£)" },
                      { value: "CHF", label: "CHF" },
                      { value: "CAD", label: "CAD ($)" },
                    ]}
                  />
                </div>
                <SelectField
                  label={t("paymentTerms")}
                  value={paymentTerms}
                  onChange={setPaymentTerms}
                  options={[
                    { value: "immediate", label: t("paymentTermsImmediate") },
                    { value: "30", label: t("paymentTerms30") },
                    { value: "45", label: t("paymentTerms45") },
                    { value: "60", label: t("paymentTerms60") },
                  ]}
                />
                <div className="grid grid-cols-2 gap-4">
                  <InputField label={t("invoicePrefix")} placeholder={t("invoicePrefixPlaceholder")} value={invoicePrefix} onChange={setInvoicePrefix} />
                  <InputField label={t("nextInvoiceNumber")} placeholder={t("nextInvoiceNumberPlaceholder")} value={nextInvoiceNumber} onChange={setNextInvoiceNumber} />
                </div>
              </>
            )}

            {step === 5 && (
              <>
                <InputField label={t("clientName")} placeholder={t("clientNamePlaceholder")} value={clientName} onChange={setClientName} />
                <InputField label={t("clientEmail")} placeholder={t("clientEmailPlaceholder")} type="email" value={clientEmail} onChange={setClientEmail} />
                <div className="grid grid-cols-2 gap-4">
                  <InputField label={t("clientPhone")} placeholder={t("clientPhonePlaceholder")} type="tel" value={clientPhone} onChange={setClientPhone} />
                  <InputField label={t("clientSiren")} placeholder={t("clientSirenPlaceholder")} value={clientSiren} onChange={setClientSiren} />
                </div>
              </>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <div>
              {step > 1 && (
                <Button type="button" variant="tertiary" onClick={prev} className="text-[var(--safe-text-muted)] hover:text-[var(--safe-white)]">
                  <ChevronLeft className="w-4 h-4" />
                  {tc("back")}
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              {step === 5 && (
                <Link href="/tableau-de-bord">
                  <Button type="button" variant="tertiary" className="text-[var(--safe-text-muted)] hover:text-[var(--safe-white)]">
                    {t("skipClient")}
                  </Button>
                </Link>
              )}
              {step < 5 ? (
                <Button type="button" onClick={next} className="inline-flex items-center gap-2 !bg-green-700 hover:!bg-green-600">
                  {tc("next")} <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Link href="/tableau-de-bord">
                  <Button type="button" className="inline-flex items-center gap-2 !bg-green-700 hover:!bg-green-600">
                    {t("goToDashboard")} <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center">
        <p className="text-xs text-[var(--safe-text-muted)]">
          {t("footerText")}
        </p>
      </footer>
    </div>
  );
}
