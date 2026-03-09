"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { createDossier } from "@/app/(app)/dossiers/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { routes } from "@/lib/routes";
import {
  FileText,
  User,
  Users,
  Building2,
  CreditCard,
  FileCheck,
} from "lucide-react";

interface DossierCreationWizardProps {
  clients: { id: string; raisonSociale: string }[];
  avocats: { id: string; nom: string }[];
  assistants?: { id: string; nom: string }[];
  initialClientId?: string;
  initialError?: string;
}

export function DossierCreationWizard({
  clients,
  avocats,
  assistants = [],
  initialClientId,
  initialError,
}: DossierCreationWizardProps) {
  const t = useTranslations("matters");
  const tc = useTranslations("common");

  const STEPS = [
    { id: 1, title: t("stepIdentification"), icon: FileText },
    { id: 2, title: t("stepClient"), icon: User },
    { id: 3, title: t("stepTeam"), icon: Users },
    { id: 4, title: t("stepCourt"), icon: Building2 },
    { id: 5, title: t("stepBilling"), icon: CreditCard },
    { id: 6, title: t("stepSummary"), icon: FileCheck },
  ] as const;

  const TYPE_OPTIONS = [
    { value: "", label: t("selectType") },
    { value: "droit_famille", label: t("typeFamily") },
    { value: "litige_civil", label: t("typeCivilLitigation") },
    { value: "criminel", label: t("typeCriminal") },
    { value: "immigration", label: t("typeImmigration") },
    { value: "corporate", label: t("typeCorporate") },
    { value: "autre", label: t("typeOther") },
  ];

  const STATUT_OPTIONS = [
    { value: "ouvert", label: t("statusOpen") },
    { value: "actif", label: t("statusActive") },
    { value: "en_attente", label: t("statusPending") },
    { value: "cloture", label: t("statusClosed") },
    { value: "archive", label: t("statusArchived") },
  ];

  const MODE_FACTURATION_OPTIONS = [
    { value: "", label: t("noMatterNone") },
    { value: "horaire", label: t("billingHourly") },
    { value: "forfait", label: t("billingFlat") },
    { value: "retainer", label: t("billingRetainer") },
    { value: "contingent", label: t("billingContingent") },
  ];

  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const clientId = get("clientId")?.trim();
    const type = get("type")?.trim();
    if (!clientId || !type) {
      setError(t("errorSelectClientAndType"));
      return;
    }
    const form = e.currentTarget;
    const formData = new FormData(form);
    try {
      const result = await createDossier(formData);
      if (result && !result.ok) {
        setError(
          result.error === "invalid"
            ? t("errorCheckFields")
            : t("errorOccurred")
        );
        return;
      }
    } catch {
      setError(t("errorOccurred"));
    }
  }

  function get(name: string): string {
    const form = formRef.current;
    if (!form) return "";
    const el = form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
    return el?.value ?? "";
  }

  function validateCurrentStep(): string | null {
    if (step === 1) {
      const type = get("type")?.trim();
      if (!type) return t("errorSelectType");
    }
    if (step === 2) {
      const clientId = get("clientId")?.trim();
      if (!clientId) return t("errorSelectClient");
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

  function getSummary(): Array<{ label: string; value: string }> {
    const client = clients.find((c) => c.id === get("clientId"));
    const avocat = avocats.find((a) => a.id === get("avocatResponsableId"));
    const assistant = assistants.find((a) => a.id === get("assistantJuridiqueId"));
    const year = new Date().getFullYear();
    return [
      { label: t("matterNumberHeader"), value: t("matterNumberAutoSummary", { year }) },
      { label: tc("type"), value: TYPE_OPTIONS.find((o) => o.value === get("type"))?.label ?? "—" },
      { label: tc("client"), value: client?.raisonSociale ?? "—" },
      { label: t("summaryReference"), value: get("reference") || "—" },
      { label: t("matterTitle"), value: get("intitule") || "—" },
      { label: tc("status"), value: STATUT_OPTIONS.find((o) => o.value === get("statut"))?.label ?? "—" },
      { label: t("summaryLawyer"), value: avocat?.nom ?? "—" },
      { label: t("summaryAssistant"), value: assistant?.nom ?? "—" },
      { label: t("court"), value: get("tribunalNom") || "—" },
      { label: t("summaryDistrict"), value: get("districtJudiciaire") || "—" },
      { label: t("courtFileNumber"), value: get("numeroDossierTribunal") || "—" },
      { label: t("summaryJudge"), value: get("nomJuge") || "—" },
      { label: t("summaryBillingMode"), value: MODE_FACTURATION_OPTIONS.find((o) => o.value === get("modeFacturation"))?.label ?? "—" },
      { label: t("summaryHourlyRate"), value: get("tauxHoraire") ? `${get("tauxHoraire")} $/h` : "—" },
    ];
  }

  const year = new Date().getFullYear();

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
        {/* Step 1: Identification */}
        <div className={step !== 1 ? "hidden" : ""}>
          <div className="space-y-4 max-w-xl">
            <h3 className="text-lg font-semibold text-neutral-text-primary">
              {t("matterIdentification")}
            </h3>
            <div className="rounded-lg border border-neutral-border bg-neutral-surface/50 px-3 py-2 text-sm text-neutral-muted">
              <span className="font-medium text-neutral-text-secondary">{t("matterNumberAuto")}</span>{" "}
              {t("matterNumberAutoDesc", { year })}
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
                {tc("type")} <span className="text-red-500">*</span>
              </label>
              <select
                name="type"
                required
                className="w-full h-10 px-3 rounded-lg border border-neutral-border bg-white text-neutral-text-primary focus:ring-2 focus:ring-primary-500/30"
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o.value || "none"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <Input label={t("referenceOptional")} name="reference" placeholder="Ex. DOS-2024-001" />
            <Input label={`${t("matterTitle")} (${tc("optional").toLowerCase()})`} name="intitule" placeholder={t("taskTitle")} />
            <div>
              <label className="block text-sm font-medium text-neutral-text-secondary mb-1">{t("initialStatus")}</label>
              <select
                name="statut"
                defaultValue="actif"
                className="w-full h-10 px-3 rounded-lg border border-neutral-border bg-white text-neutral-text-primary focus:ring-2 focus:ring-primary-500/30"
              >
                {STATUT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Step 2: Client */}
        <div className={step !== 2 ? "hidden" : ""}>
          <div className="space-y-4 max-w-xl">
            <h3 className="text-lg font-semibold text-neutral-text-primary">
              {t("clientAssociation")}
            </h3>
            <div>
              <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
                {tc("client")} <span className="text-red-500">*</span>
              </label>
              <select
                name="clientId"
                required
                defaultValue={initialClientId ?? ""}
                className="w-full h-10 px-3 rounded-lg border border-neutral-border bg-white text-neutral-text-primary focus:ring-2 focus:ring-primary-500/30"
              >
                <option value="">{t("selectClient")}</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.raisonSociale}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Step 3: Team */}
        <div className={step !== 3 ? "hidden" : ""}>
          <div className="space-y-4 max-w-xl">
            <h3 className="text-lg font-semibold text-neutral-text-primary">
              {t("team")}
            </h3>
            <div>
              <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
                {t("responsibleLawyer")}
              </label>
              <select
                name="avocatResponsableId"
                className="w-full h-10 px-3 rounded-lg border border-neutral-border bg-white text-neutral-text-primary focus:ring-2 focus:ring-primary-500/30"
              >
                <option value="">{t("noMatterNone")}</option>
                {avocats.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nom}
                  </option>
                ))}
              </select>
            </div>
            {assistants.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
                  {t("legalAssistant")}
                </label>
                <select
                  name="assistantJuridiqueId"
                  className="w-full h-10 px-3 rounded-lg border border-neutral-border bg-white text-neutral-text-primary focus:ring-2 focus:ring-primary-500/30"
                >
                  <option value="">{t("noMatterNone")}</option>
                  {assistants.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.nom}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Step 4: Court */}
        <div className={step !== 4 ? "hidden" : ""}>
          <div className="space-y-4 max-w-xl">
            <h3 className="text-lg font-semibold text-neutral-text-primary">
              {t("court")}
            </h3>
            <Input label={t("courtNameLabel")} name="tribunalNom" placeholder={t("optional")} />
            <Input label={t("judicialDistrict")} name="districtJudiciaire" placeholder={t("optional")} />
            <Input label={t("courtFileNumber")} name="numeroDossierTribunal" placeholder={t("optional")} />
            <Input label={t("judgeName")} name="nomJuge" placeholder={t("optional")} />
          </div>
        </div>

        {/* Step 5: Billing */}
        <div className={step !== 5 ? "hidden" : ""}>
          <div className="space-y-4 max-w-xl">
            <h3 className="text-lg font-semibold text-neutral-text-primary">
              {t("stepBilling")}
            </h3>
            <div>
              <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
                {t("billingModeLabel")}
              </label>
              <select
                name="modeFacturation"
                className="w-full h-10 px-3 rounded-lg border border-neutral-border bg-white text-neutral-text-primary focus:ring-2 focus:ring-primary-500/30"
              >
                {MODE_FACTURATION_OPTIONS.map((o) => (
                  <option key={o.value || "none"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label={t("hourlyRate")}
              name="tauxHoraire"
              type="number"
              step="0.01"
              min="0"
              placeholder={t("optional")}
            />
          </div>
        </div>

        {/* Step 6: Summary */}
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
                  <span className="font-medium text-neutral-muted w-44 shrink-0">{label}</span>
                  <span className="text-neutral-text-primary break-words">{value || "—"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-status-error">{error}</p>}

      <div className="flex items-center justify-between pt-4 border-t border-neutral-border">
        <div>
          {step > 1 && (
            <Button type="button" variant="secondary" onClick={() => goToStep(step - 1)}>
              {tc("previous")}
            </Button>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {step === 6 &&
            (!get("type")?.trim() || !get("clientId")?.trim()) && (
              <p className="text-sm text-amber-600">
                {t("selectTypeAndClient")}
              </p>
            )}
          <div className="flex gap-2">
            {step < 6 ? (
              <Button type="button" onClick={goToNextStep}>
                {tc("next")}
              </Button>
            ) : (
              <>
                <Button
                  type="submit"
                  disabled={!get("type")?.trim() || !get("clientId")?.trim()}
                >
                  {t("createMatter")}
                </Button>
                <Button type="button" variant="secondary" onClick={() => goToStep(5)}>
                  {tc("back")}
                </Button>
                <Link href={routes.dossiers}>
                  <Button type="button" variant="secondary">
                    {tc("cancel")}
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
