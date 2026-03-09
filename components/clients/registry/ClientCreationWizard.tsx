"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { createClient } from "@/app/(app)/clients/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { routes } from "@/lib/routes";
import { User, Contact, Scale, CreditCard, ShieldCheck, FileCheck } from "lucide-react";

interface LawyerOption {
  id: string;
  nom: string;
}

export function ClientCreationWizard({
  lawyers = [],
  initialData,
  initialError,
}: {
  lawyers?: LawyerOption[];
  initialData?: Record<string, string | undefined>;
  initialError?: "invalid";
}) {
  const t = useTranslations("clients");
  const tc = useTranslations("common");

  const STEPS = [
    { id: 1, title: t("stepIdentification"), icon: User },
    { id: 2, title: t("stepContact"), icon: Contact },
    { id: 3, title: t("stepLegal"), icon: Scale },
    { id: 4, title: t("stepBilling"), icon: CreditCard },
    { id: 5, title: t("stepCompliance"), icon: ShieldCheck },
    { id: 6, title: t("stepSummary"), icon: FileCheck },
  ] as const;

  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(
    initialError === "invalid" ? t("invalidDataError") : null
  );
  const formRef = useRef<HTMLFormElement>(null);

  function buildFormData(form: HTMLFormElement): FormData {
    const fd = new FormData(form);
    return fd;
  }

  function get(name: string): string {
    const form = formRef.current;
    if (!form) return "";
    const el = form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
    return el?.value ?? "";
  }

  function validateCurrentStep(): string | null {
    if (step === 1) {
      const raisonSociale = get("raisonSociale")?.trim();
      if (!raisonSociale) return t("requiredFieldError");
    }
    return null;
  }

  function goToNextStep() {
    const err = validateCurrentStep();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, 6));
  }

  function goToStep(targetStep: number) {
    if (targetStep <= step) {
      setError(null);
      setStep(targetStep);
      return;
    }
    const err = validateCurrentStep();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep(targetStep);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = buildFormData(form);
    try {
      await createClient(formData);
    } catch (err: unknown) {
      if (
        err &&
        typeof err === "object" &&
        "digest" in err &&
        String((err as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
      ) {
        return;
      }
      setError(t("genericError"));
    }
  }

  function getSummary(): Array<{ label: string; value: string }> {
    const form = formRef.current;
    if (!form) return [];
    const get = (name: string) => (form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)?.value ?? "";
    return [
      { label: t("summaryType"), value: get("typeClient") === "personne_physique" ? t("individual") : t("company") },
      { label: t("summaryName"), value: get("raisonSociale") || "—" },
      { label: t("summaryFirstName"), value: get("prenom") || "—" },
      { label: t("summaryLastName"), value: get("nom") || "—" },
      { label: t("summaryEmail"), value: get("email") || "—" },
      { label: t("summaryPhone"), value: get("telephone") || "—" },
      { label: t("summaryLawyer"), value: lawyers.find((l) => l.id === get("assignedLawyerId"))?.nom ?? "—" },
      { label: t("summaryRetainer"), value: form.elements.namedItem("retainerSigned") && (form.elements.namedItem("retainerSigned") as HTMLInputElement).checked ? tc("yes") : tc("no") },
    ];
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {STEPS.map((s) => {
          const Icon = s.icon;
          const isActive = step === s.id;
          const isPast = step > s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => goToStep(s.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-primary-100 text-primary-800"
                  : isPast
                    ? "bg-primary-50 text-primary-700"
                    : "bg-neutral-100 text-neutral-muted"
              }`}
            >
              <Icon className="w-4 h-4" />
              {s.title}
            </button>
          );
        })}
      </div>

      <div className="min-h-[320px]">
        <div className={step !== 1 ? "hidden" : ""}>
          <div className="space-y-4 max-w-xl">
            <h3 className="text-lg font-semibold text-neutral-text-primary">
              {t("clientIdentification")}
            </h3>
            <div>
              <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
                {t("clientTypeLabel")}
              </label>
              <select
                name="typeClient"
                defaultValue={initialData?.typeClient ?? "personne_morale"}
                className="w-full h-10 px-3 rounded-lg border border-neutral-border bg-white text-neutral-text-primary focus:ring-2 focus:ring-primary-500/30"
              >
                <option value="personne_morale">{t("company")}</option>
                <option value="personne_physique">{t("individual")}</option>
              </select>
            </div>
            <Input
              label={t("businessNameLabel")}
              name="raisonSociale"
              required
              defaultValue={initialData?.raisonSociale}
              placeholder={t("businessNamePlaceholder")}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input label={t("firstName")} name="prenom" defaultValue={initialData?.prenom} placeholder={t("firstName")} />
              <Input label={t("lastName")} name="nom" defaultValue={initialData?.nom} placeholder={t("lastName")} />
            </div>
            <Input
              label={t("dateOfBirth")}
              name="dateNaissance"
              type="date"
            />
            <Input
              label={t("registrationNumber")}
              name="numeroRegistreEntreprise"
              placeholder={tc("optional")}
            />
          </div>
        </div>

        <div className={step !== 2 ? "hidden" : ""}>
          <div className="space-y-4 max-w-xl">
            <h3 className="text-lg font-semibold text-neutral-text-primary">
              {t("stepContact")}
            </h3>
            <Input
              label={t("primaryEmail")}
              name="email"
              type="email"
              defaultValue={initialData?.email}
              placeholder="courriel@exemple.com"
            />
            <Input
              label={t("secondaryEmail")}
              name="emailSecondaire"
              type="email"
              placeholder={tc("optional")}
            />
            <Input
              label={t("primaryPhone")}
              name="telephone"
              defaultValue={initialData?.telephone}
              placeholder="(514) 123-4567"
            />
            <Input label={t("secondaryPhone")} name="telephoneSecondaire" placeholder={tc("optional")} />
            <Input
              label={t("addressLine1")}
              name="addressLine1"
              defaultValue={initialData?.addressLine1}
              placeholder={t("streetPlaceholder")}
            />
            <Input label={t("addressLine2")} name="addressLine2" placeholder={t("suitePlaceholder")} />
            <div className="grid grid-cols-2 gap-4">
              <Input label={t("city")} name="city" defaultValue={initialData?.city} />
              <Input label={t("province")} name="province" defaultValue={initialData?.province} />
              <Input label={t("postalCode")} name="postalCode" defaultValue={initialData?.postalCode} />
              <Input label={t("country")} name="country" defaultValue={initialData?.country ?? "Canada"} />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
                {t("preferredContact")}
              </label>
              <select
                name="preferredContactMethod"
                className="w-full h-10 px-3 rounded-lg border border-neutral-border bg-white text-neutral-text-primary focus:ring-2 focus:ring-primary-500/30"
              >
                <option value="">—</option>
                <option value="email">{t("contactEmail")}</option>
                <option value="phone">{t("contactPhone")}</option>
                <option value="mail">{t("contactMail")}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
                {t("languageLabel")}
              </label>
              <select
                name="langue"
                className="w-full h-10 px-3 rounded-lg border border-neutral-border bg-white text-neutral-text-primary focus:ring-2 focus:ring-primary-500/30"
              >
                <option value="">—</option>
                <option value="FR">{tc("french")}</option>
                <option value="EN">{tc("english")}</option>
              </select>
            </div>
          </div>
        </div>

        <div className={step !== 3 ? "hidden" : ""}>
          <div className="space-y-4 max-w-xl">
            <h3 className="text-lg font-semibold text-neutral-text-primary">
              {t("legalRepresentation")}
            </h3>
            {lawyers.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
                  {t("assignedLawyerLabel")}
                </label>
                <select
                  name="assignedLawyerId"
                  defaultValue={initialData?.assignedLawyerId ?? ""}
                  className="w-full h-10 px-3 rounded-lg border border-neutral-border bg-white text-neutral-text-primary focus:ring-2 focus:ring-primary-500/30"
                >
                  <option value="">{t("noLawyer")}</option>
                  {lawyers.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.nom}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
                {t("representationType")}
              </label>
              <select
                name="representationType"
                defaultValue={initialData?.representationType ?? ""}
                className="w-full h-10 px-3 rounded-lg border border-neutral-border bg-white text-neutral-text-primary focus:ring-2 focus:ring-primary-500/30"
              >
                <option value="">—</option>
                <option value="plaintiff">{t("plaintiff")}</option>
                <option value="defendant">{t("defendant")}</option>
                <option value="advisor">{t("advisor")}</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="retainerSigned"
                id="retainerSigned"
                value="on"
                className="rounded border-neutral-border text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="retainerSigned" className="text-sm text-neutral-text-secondary">
                {t("retainerSigned")}
              </label>
            </div>
            <Input
              label={t("retainerDate")}
              name="retainerDate"
              type="date"
            />
          </div>
        </div>

        <div className={step !== 4 ? "hidden" : ""}>
          <div className="space-y-4 max-w-xl">
            <h3 className="text-lg font-semibold text-neutral-text-primary">
              {t("billingTitle")}
            </h3>
            <Input
              label={t("billingContact")}
              name="billingContactName"
              placeholder={t("billingContactPlaceholder")}
            />
            <Input
              label={t("billingEmail")}
              name="billingEmail"
              type="email"
              placeholder={t("billingEmailPlaceholder")}
            />
            <Input
              label={t("billingAddress")}
              name="billingAddress"
              placeholder={t("billingAddressPlaceholder")}
            />
            <Input
              label={t("paymentTerms")}
              name="paymentTerms"
              placeholder={t("paymentTermsPlaceholder")}
            />
            <div>
              <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
                {t("preferredPayment")}
              </label>
              <select
                name="preferredPaymentMethod"
                className="w-full h-10 px-3 rounded-lg border border-neutral-border bg-white text-neutral-text-primary focus:ring-2 focus:ring-primary-500/30"
              >
                <option value="">—</option>
                <option value="card">{t("paymentCard")}</option>
                <option value="transfer">{t("paymentTransfer")}</option>
                <option value="trust">{t("paymentTrust")}</option>
                <option value="cheque">{t("paymentCheque")}</option>
              </select>
            </div>
          </div>
        </div>

        <div className={step !== 5 ? "hidden" : ""}>
          <div className="space-y-4 max-w-xl">
            <h3 className="text-lg font-semibold text-neutral-text-primary">
              {t("complianceTitle")}
            </h3>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                name="conflictChecked"
                id="conflictChecked"
                value="on"
                className="rounded border-neutral-border text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="conflictChecked" className="text-sm text-neutral-text-secondary">
                {t("conflictCheckDone")}
              </label>
            </div>
            <Input
              label={t("conflictCheckDate")}
              name="conflictCheckDate"
              type="date"
            />
            <div>
              <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
                {t("conflictNotes")}
              </label>
              <textarea
                name="conflictNotes"
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-neutral-border bg-white text-neutral-text-primary focus:ring-2 focus:ring-primary-500/30"
                placeholder={t("conflictNotesPlaceholder")}
              />
            </div>
          </div>
        </div>

        <div className={step !== 6 ? "hidden" : ""}>
          <div className="space-y-4 max-w-xl">
            <h3 className="text-lg font-semibold text-neutral-text-primary">
              {t("summaryTitle")}
            </h3>
            <p className="text-sm text-neutral-muted">
              {t("summaryDescription")}
            </p>
            <div className="rounded-xl border border-neutral-border bg-neutral-surface/50 p-4 space-y-2">
              {getSummary().map(({ label, value }) => (
                <div key={label} className="flex gap-2 text-sm">
                  <span className="font-medium text-neutral-muted w-40 shrink-0">{label}</span>
                  <span className="text-neutral-text-primary">{value || "—"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-status-error">{error}</p>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-neutral-border">
        <div>
          {step > 1 && (
            <Button
              type="button"
              variant="secondary"
              onClick={() => goToStep(step - 1)}
            >
              {tc("previous")}
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          {step < 6 ? (
            <Button
              type="button"
              onClick={goToNextStep}
            >
              {tc("next")}
            </Button>
          ) : (
            <>
              <Button type="submit">{t("createClient")}</Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => goToStep(5)}
              >
                {tc("back")}
              </Button>
              <Link href={routes.clients}>
                <Button type="button" variant="secondary">
                  {tc("cancel")}
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </form>
  );
}
