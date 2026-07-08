"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { createClient } from "@/app/(app)/clients/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { routes } from "@/lib/routes";
import { normalizeClientName } from "@/lib/clients/normalize-name";
import { User, Contact, Scale, CreditCard, ShieldCheck, FileCheck, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

interface LawyerOption {
  id: string;
  nom: string;
}

type ConflictStatus = "clear" | "possible_match" | "high_risk" | "error";

interface ConflictMatch {
  kind: "client" | "dossier" | "adverse_party" | "other";
  id: string;
  label: string;
  reason: string;
  risk: "low" | "medium" | "high";
  href?: string;
}

interface ConflictCheckResult {
  status: ConflictStatus;
  checkedAt: string;
  query: string;
  matches: ConflictMatch[];
}

const DEBOUNCE_MS = 500;
const MIN_QUERY_LENGTH = 3;

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
  const [typeClient, setTypeClient] = useState<"personne_morale" | "personne_physique">(
    (initialData?.typeClient as "personne_morale" | "personne_physique" | undefined) ?? "personne_morale"
  );
  const isMorale = typeClient === "personne_morale";
  const [error, setError] = useState<string | null>(
    initialError === "invalid" ? t("invalidDataError") : null
  );
  const formRef = useRef<HTMLFormElement>(null);

  // --- Contrôle de conflit automatique ---
  const [conflictName, setConflictName] = useState({
    raisonSociale: initialData?.raisonSociale ?? "",
    prenom: initialData?.prenom ?? "",
    nom: initialData?.nom ?? "",
    email: initialData?.email ?? "",
  });
  const [conflictResult, setConflictResult] = useState<ConflictCheckResult | null>(null);
  const [conflictLoading, setConflictLoading] = useState(false);
  const [conflictAcknowledged, setConflictAcknowledged] = useState(false);
  const lastQuerySignatureRef = useRef<string>("");

  useEffect(() => {
    const query = isMorale
      ? conflictName.raisonSociale.trim()
      : [conflictName.prenom, conflictName.nom].map((s) => s.trim()).filter(Boolean).join(" ");
    const normalized = normalizeClientName(query);
    if (normalized.length < MIN_QUERY_LENGTH) {
      setConflictResult(null);
      setConflictLoading(false);
      lastQuerySignatureRef.current = "";
      return;
    }
    const signature = `${typeClient}|${normalized}|${conflictName.email.trim().toLowerCase()}`;
    if (signature === lastQuerySignatureRef.current) return;

    let cancelled = false;
    setConflictLoading(true);
    const handle = window.setTimeout(async () => {
      try {
        const res = await fetch("/api/clients/conflict-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            typeClient,
            raisonSociale: isMorale ? conflictName.raisonSociale : undefined,
            prenom: !isMorale ? conflictName.prenom : undefined,
            nom: !isMorale ? conflictName.nom : undefined,
            email: conflictName.email || undefined,
          }),
        });
        if (cancelled) return;
        if (!res.ok) {
          setConflictResult({ status: "error", checkedAt: new Date().toISOString(), query, matches: [] });
          setConflictLoading(false);
          return;
        }
        const data = (await res.json()) as ConflictCheckResult;
        if (cancelled) return;
        setConflictResult(data);
        setConflictAcknowledged(false);
        lastQuerySignatureRef.current = signature;
      } catch {
        if (!cancelled) {
          setConflictResult({ status: "error", checkedAt: new Date().toISOString(), query, matches: [] });
        }
      } finally {
        if (!cancelled) setConflictLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [typeClient, isMorale, conflictName]);

  const blockedByConflict =
    conflictResult?.status === "high_risk" && !conflictAcknowledged;

  function get(name: string): string {
    const form = formRef.current;
    if (!form) return "";
    const el = form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
    return el?.value ?? "";
  }

  function validateCurrentStep(): string | null {
    if (step === 1) {
      if (isMorale) {
        if (!get("raisonSociale")?.trim()) return t("requiredBusinessName");
      } else {
        if (!get("prenom")?.trim() || !get("nom")?.trim()) return t("requiredIndividualName");
      }
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
    const form = formRef.current;
    if (!form) return [];
    const get = (name: string) => (form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)?.value ?? "";
    const isPhysique = get("typeClient") === "personne_physique";
    const conflictLabel = conflictResult ? t(`conflictStatus_${conflictResult.status}`) : t("conflictStatus_pending");
    return [
      { label: t("summaryType"), value: isPhysique ? t("individual") : t("company") },
      ...(isPhysique
        ? [
            { label: t("summaryFirstName"), value: get("prenom") || "—" },
            { label: t("summaryLastName"), value: get("nom") || "—" },
          ]
        : [{ label: t("summaryName"), value: get("raisonSociale") || "—" }]),
      { label: t("summaryEmail"), value: get("email") || "—" },
      { label: t("summaryPhone"), value: get("telephone") || "—" },
      { label: t("summaryLawyer"), value: lawyers.find((l) => l.id === get("assignedLawyerId"))?.nom ?? "—" },
      { label: t("summaryRetainer"), value: form.elements.namedItem("retainerSigned") && (form.elements.namedItem("retainerSigned") as HTMLInputElement).checked ? tc("yes") : tc("no") },
      { label: t("summaryConflict"), value: conflictLabel },
    ];
  }

  return (
    <form ref={formRef} action={createClient} className="space-y-6">
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
                  ? "bg-si-forest/10 text-si-forest"
                  : isPast
                    ? "bg-si-canvas text-si-ink"
                    : "bg-si-canvas/60 text-si-muted"
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
            <h3 className="text-lg font-serif text-si-ink tracking-tight">
              {t("clientIdentification")}
            </h3>
            <div>
              <label className="block text-sm font-medium text-si-muted mb-1">
                {t("clientTypeLabel")}
              </label>
              <select
                name="typeClient"
                value={typeClient}
                onChange={(e) => setTypeClient(e.target.value as "personne_morale" | "personne_physique")}
                className="w-full h-10 px-3 rounded-[10px] border border-si-line bg-si-surface font-sans text-si-ink outline-none focus:border-si-verified focus:ring-2 focus:ring-si-verified/25 transition"
              >
                <option value="personne_morale">{t("company")}</option>
                <option value="personne_physique">{t("individual")}</option>
              </select>
              <p className="mt-1 text-xs text-si-muted">
                {isMorale ? t("companyHint") : t("individualHint")}
              </p>
            </div>
            {isMorale ? (
              <>
                <Input
                  label={t("businessNameLabel")}
                  name="raisonSociale"
                  required
                  defaultValue={initialData?.raisonSociale}
                  placeholder={t("businessNamePlaceholder")}
                  onChange={(e) => setConflictName((s) => ({ ...s, raisonSociale: e.target.value }))}
                />
                <Input
                  label={t("registrationNumber")}
                  name="numeroRegistreEntreprise"
                  placeholder={tc("optional")}
                />
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label={t("firstName")}
                    name="prenom"
                    required
                    defaultValue={initialData?.prenom}
                    placeholder={t("firstName")}
                    onChange={(e) => setConflictName((s) => ({ ...s, prenom: e.target.value }))}
                  />
                  <Input
                    label={t("lastName")}
                    name="nom"
                    required
                    defaultValue={initialData?.nom}
                    placeholder={t("lastName")}
                    onChange={(e) => setConflictName((s) => ({ ...s, nom: e.target.value }))}
                  />
                </div>
                <Input
                  label={t("dateOfBirth")}
                  name="dateNaissance"
                  type="date"
                />
              </>
            )}
            <ConflictCheckBanner
              t={t}
              loading={conflictLoading}
              result={conflictResult}
              compact
            />
          </div>
        </div>

        <div className={step !== 2 ? "hidden" : ""}>
          <div className="space-y-4 max-w-xl">
            <h3 className="text-lg font-serif text-si-ink tracking-tight">
              {t("stepContact")}
            </h3>
            <Input
              label={t("primaryEmail")}
              name="email"
              type="email"
              defaultValue={initialData?.email}
              placeholder="courriel@exemple.com"
              onChange={(e) => setConflictName((s) => ({ ...s, email: e.target.value }))}
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
              <label className="block text-sm font-medium text-si-muted mb-1">
                {t("preferredContact")}
              </label>
              <select
                name="preferredContactMethod"
                className="w-full h-10 px-3 rounded-[10px] border border-si-line bg-si-surface font-sans text-si-ink outline-none focus:border-si-verified focus:ring-2 focus:ring-si-verified/25 transition"
              >
                <option value="">—</option>
                <option value="email">{t("contactEmail")}</option>
                <option value="phone">{t("contactPhone")}</option>
                <option value="mail">{t("contactMail")}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-si-muted mb-1">
                {t("languageLabel")}
              </label>
              <select
                name="langue"
                className="w-full h-10 px-3 rounded-[10px] border border-si-line bg-si-surface font-sans text-si-ink outline-none focus:border-si-verified focus:ring-2 focus:ring-si-verified/25 transition"
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
            <h3 className="text-lg font-serif text-si-ink tracking-tight">
              {t("legalRepresentation")}
            </h3>
            {lawyers.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-si-muted mb-1">
                  {t("assignedLawyerLabel")}
                </label>
                <select
                  name="assignedLawyerId"
                  defaultValue={initialData?.assignedLawyerId ?? ""}
                  className="w-full h-10 px-3 rounded-[10px] border border-si-line bg-si-surface font-sans text-si-ink outline-none focus:border-si-verified focus:ring-2 focus:ring-si-verified/25 transition"
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
              <label className="block text-sm font-medium text-si-muted mb-1">
                {t("representationType")}
              </label>
              <select
                name="representationType"
                defaultValue={initialData?.representationType ?? ""}
                className="w-full h-10 px-3 rounded-[10px] border border-si-line bg-si-surface font-sans text-si-ink outline-none focus:border-si-verified focus:ring-2 focus:ring-si-verified/25 transition"
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
                className="rounded border-si-line text-si-forest focus:ring-si-verified"
              />
              <label htmlFor="retainerSigned" className="text-sm text-si-muted">
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
            <h3 className="text-lg font-serif text-si-ink tracking-tight">
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
              <label className="block text-sm font-medium text-si-muted mb-1">
                {t("preferredPayment")}
              </label>
              <select
                name="preferredPaymentMethod"
                className="w-full h-10 px-3 rounded-[10px] border border-si-line bg-si-surface font-sans text-si-ink outline-none focus:border-si-verified focus:ring-2 focus:ring-si-verified/25 transition"
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
            <h3 className="text-lg font-serif text-si-ink tracking-tight">
              {t("complianceTitle")}
            </h3>
            <p className="text-sm text-si-muted">{t("conflictCheckIntro")}</p>
            <ConflictCheckBanner
              t={t}
              loading={conflictLoading}
              result={conflictResult}
            />
            {conflictResult?.status === "high_risk" && (
              <label className="flex items-start gap-2 rounded-xl border border-status-error/40 bg-status-error/5 p-3 text-sm text-si-ink">
                <input
                  type="checkbox"
                  checked={conflictAcknowledged}
                  onChange={(e) => setConflictAcknowledged(e.target.checked)}
                  className="mt-0.5 rounded border-si-line text-si-forest focus:ring-si-verified"
                />
                <span>{t("conflictAcknowledge")}</span>
              </label>
            )}
            <div>
              <label className="block text-sm font-medium text-si-muted mb-1">
                {t("conflictNotes")}
              </label>
              <textarea
                name="conflictNotes"
                rows={3}
                className="w-full px-3 py-2 rounded-[10px] border border-si-line bg-si-surface font-sans text-si-ink outline-none focus:border-si-verified focus:ring-2 focus:ring-si-verified/25 transition"
                placeholder={t("conflictNotesPlaceholder")}
              />
            </div>
          </div>
        </div>

        <div className={step !== 6 ? "hidden" : ""}>
          <div className="space-y-4 max-w-xl">
            <h3 className="text-lg font-serif text-si-ink tracking-tight">
              {t("summaryTitle")}
            </h3>
            <p className="text-sm text-si-muted">
              {t("summaryDescription")}
            </p>
            <div className="rounded-xl border border-si-line bg-si-canvas/60 p-4 space-y-2">
              {getSummary().map(({ label, value }) => (
                <div key={label} className="flex gap-2 text-sm">
                  <span className="font-medium text-si-muted w-40 shrink-0">{label}</span>
                  <span className="text-si-ink">{value || "—"}</span>
                </div>
              ))}
            </div>
            <ConflictCheckBanner
              t={t}
              loading={conflictLoading}
              result={conflictResult}
              compact
            />
            <label className="flex items-start gap-2 rounded-xl border border-si-line bg-si-surface px-3 py-2 cursor-pointer">
              <input type="checkbox" name="thenCreateDossier" className="mt-0.5" />
              <span className="text-sm text-si-ink">
                {t("thenCreateAffaire")}
                <span className="block text-xs text-si-muted">
                  {t("thenCreateAffaireHint")}
                </span>
              </span>
            </label>
          </div>
        </div>
      </div>

      <input
        type="hidden"
        name="conflictCheckStatus"
        value={conflictResult?.status ?? "pending"}
      />
      <input
        type="hidden"
        name="conflictCheckedAt"
        value={conflictResult?.checkedAt ?? ""}
      />
      <input
        type="hidden"
        name="conflictCheckQuery"
        value={conflictResult?.query ?? ""}
      />
      <input
        type="hidden"
        name="conflictCheckMatches"
        value={conflictResult ? JSON.stringify(conflictResult.matches) : "[]"}
      />
      <input
        type="hidden"
        name="conflictAcknowledged"
        value={conflictAcknowledged ? "true" : "false"}
      />

      {error && (
        <p className="text-sm text-status-error">{error}</p>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-si-line">
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
              <CreateClientSubmitButton
                label={t("createClient")}
                pendingLabel={t("creatingClient")}
                blocked={blockedByConflict}
                blockedLabel={t("conflictBlockSubmit")}
              />
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

function ConflictCheckBanner({
  t,
  loading,
  result,
  compact,
}: {
  t: ReturnType<typeof useTranslations>;
  loading: boolean;
  result: ConflictCheckResult | null;
  compact?: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-si-line bg-si-canvas px-3 py-2 text-sm text-si-muted">
        <Loader2 className="w-4 h-4 animate-spin" />
        {t("conflictCheckLoading")}
      </div>
    );
  }
  if (!result) {
    if (compact) return null;
    return (
      <div className="rounded-lg border border-dashed border-si-line bg-si-canvas px-3 py-2 text-sm text-si-muted">
        {t("conflictCheckIdle")}
      </div>
    );
  }

  if (result.status === "error") {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-status-warning/40 bg-status-warning/10 px-3 py-2 text-sm text-si-ink">
        <AlertTriangle className="w-4 h-4 mt-0.5 text-status-warning" />
        <span>{t("conflictCheckError")}</span>
      </div>
    );
  }

  if (result.status === "clear") {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-status-success/40 bg-status-success/10 px-3 py-2 text-sm text-si-ink">
        <CheckCircle2 className="w-4 h-4 mt-0.5 text-status-success" />
        <div>
          <div className="font-medium">{t("conflictStatus_clear")}</div>
          <div className="text-xs text-si-muted">
            {t("conflictCheckMeta", { query: result.query, time: formatTime(result.checkedAt) })}
          </div>
        </div>
      </div>
    );
  }

  const isHigh = result.status === "high_risk";
  const containerCls = isHigh
    ? "border-status-error/50 bg-status-error/10"
    : "border-status-warning/50 bg-status-warning/10";
  const iconCls = isHigh ? "text-status-error" : "text-status-warning";

  return (
    <div className={`rounded-lg border ${containerCls} p-3 text-sm text-si-ink`}>
      <div className="flex items-start gap-2">
        <AlertTriangle className={`w-4 h-4 mt-0.5 ${iconCls}`} />
        <div className="flex-1 space-y-1">
          <div className="font-semibold">{t(`conflictStatus_${result.status}`)}</div>
          <div className="text-xs text-si-muted">
            {t("conflictCheckMeta", { query: result.query, time: formatTime(result.checkedAt) })}
          </div>
        </div>
      </div>
      {!compact && result.matches.length > 0 && (
        <ul className="mt-3 space-y-2">
          {result.matches.slice(0, 8).map((m, idx) => (
            <li
              key={`${m.kind}-${m.id}-${idx}`}
              className="rounded-lg bg-si-surface/70 border border-si-line px-3 py-2"
            >
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-si-muted">
                <span>{t(`conflictKind_${m.kind}`)}</span>
                <span>·</span>
                <span>{t(`conflictRisk_${m.risk}`)}</span>
              </div>
              <div className="mt-1 text-sm font-medium text-si-ink">
                {m.href ? (
                  <Link href={m.href} target="_blank" className="hover:underline">
                    {m.label}
                  </Link>
                ) : (
                  m.label
                )}
              </div>
              <div className="text-xs text-si-muted">{t(`conflictReason_${m.reason}`)}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString();
  } catch {
    return iso;
  }
}

function CreateClientSubmitButton({
  label,
  pendingLabel,
  blocked,
  blockedLabel,
}: {
  label: string;
  pendingLabel: string;
  blocked: boolean;
  blockedLabel: string;
}) {
  const { pending } = useFormStatus();
  const disabled = pending || blocked;
  return (
    <Button type="submit" disabled={disabled} title={blocked ? blockedLabel : undefined}>
      {pending ? pendingLabel : blocked ? blockedLabel : label}
    </Button>
  );
}
