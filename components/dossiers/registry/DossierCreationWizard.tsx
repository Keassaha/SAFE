"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { createDossier } from "@/app/(app)/dossiers/actions";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { routes } from "@/lib/routes";
import type { CabinetBillingMode } from "@/lib/services/cabinet-interface";
import {
  FileText,
  User,
  Users,
  Building2,
  CreditCard,
  FileCheck,
} from "lucide-react";

interface TaxonomyOption {
  value: string;
  label: string;
}

interface DossierCreationWizardProps {
  clients: { id: string; typeClient: string; raisonSociale: string | null; prenom: string | null; nom: string | null }[];
  avocats: { id: string; nom: string }[];
  assistants?: { id: string; nom: string }[];
  initialClientId?: string;
  initialError?: string;
  cabinetBillingMode?: CabinetBillingMode;
  /** Sujets de la taxonomie cabinet (code → libellé localisé). Absent = legacy. */
  subjectOptions?: TaxonomyOption[];
  /** Sous-matières par code de Sujet (libellé localisé en value + label). */
  submatterOptions?: Record<string, TaxonomyOption[]>;
}

export function DossierCreationWizard({
  clients,
  avocats,
  assistants = [],
  initialClientId,
  initialError,
  cabinetBillingMode = "horaire",
  subjectOptions,
  submatterOptions,
}: DossierCreationWizardProps) {
  const hasTaxonomy = Boolean(subjectOptions && subjectOptions.length > 0);
  const isCabinetForfait = cabinetBillingMode === "forfait";
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
    { value: "immobilier", label: "Immobilier / Real Estate" },
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
  const [selectedType, setSelectedType] = useState("");
  const [selectedClientId, setSelectedClientId] = useState(initialClientId ?? "");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedSubmatter, setSelectedSubmatter] = useState("");
  const availableSubmatters = (submatterOptions?.[selectedSubject] ?? []);
  // Quand la taxonomie pilote la création, « Type » = le Sujet taxonomie ;
  // sinon « Type » = l'enum SAFE. Un seul de ces champs est requis.
  const typeChosen = hasTaxonomy ? Boolean(selectedSubject.trim()) : Boolean(selectedType.trim());
  const formRef = useRef<HTMLFormElement>(null);

  function get(name: string): string {
    const form = formRef.current;
    if (!form) return "";
    const el = form.elements.namedItem(name) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null;
    return el?.value ?? "";
  }

  function validateCurrentStep(): string | null {
    if (step === 1) {
      if (!typeChosen) return t("errorSelectType");
    }
    if (step === 2) {
      if (!selectedClientId.trim()) return t("errorSelectClient");
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

  async function submitDossier(formData: FormData) {
    setError(null);
    const result = await createDossier(formData);
    if (result && !result.ok) {
      setError(
        result.error === "invalid"
          ? t("errorCheckFields")
          : t("errorOccurred")
      );
    }
  }

  function getSummary(): Array<{ label: string; value: string }> {
    const client = clients.find((c) => c.id === selectedClientId);
    const avocat = avocats.find((a) => a.id === get("avocatResponsableId"));
    const assistant = assistants.find((a) => a.id === get("assistantJuridiqueId"));
    const year = new Date().getFullYear();
    return [
      { label: t("matterNumberHeader"), value: t("matterNumberAutoSummary", { year }) },
      {
        label: tc("type"),
        value: hasTaxonomy
          ? subjectOptions!.find((o) => o.value === selectedSubject)?.label ?? "—"
          : TYPE_OPTIONS.find((o) => o.value === selectedType)?.label ?? "—",
      },
      ...(hasTaxonomy && availableSubmatters.length > 0
        ? [{ label: t("subjectLabel"), value: selectedSubmatter || "—" }]
        : []),
      { label: tc("client"), value: formatClientLabel(client) || "—" },
      { label: t("summaryReference"), value: get("reference") || "—" },
      { label: t("matterTitle"), value: get("intitule") || "—" },
      { label: tc("status"), value: STATUT_OPTIONS.find((o) => o.value === get("statut"))?.label ?? "—" },
      { label: t("summaryLawyer"), value: avocat?.nom ?? "—" },
      { label: t("summaryAssistant"), value: assistant?.nom ?? "—" },
      { label: t("court"), value: get("tribunalNom") || "—" },
      { label: t("summaryDistrict"), value: get("districtJudiciaire") || "—" },
      { label: t("courtFileNumber"), value: get("numeroDossierTribunal") || "—" },
      { label: t("summaryJudge"), value: get("nomJuge") || "—" },
      {
        label: t("summaryBillingMode"),
        value: isCabinetForfait
          ? t("billingFlat")
          : MODE_FACTURATION_OPTIONS.find((o) => o.value === get("modeFacturation"))?.label ?? "—",
      },
      ...(isCabinetForfait
        ? []
        : [
            {
              label: t("summaryHourlyRate"),
              value: get("tauxHoraire") ? `${get("tauxHoraire")} $/h` : "—",
            },
          ]),
    ];
  }

  const year = new Date().getFullYear();

  return (
    <form ref={formRef} action={submitDossier} className="space-y-6">
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
        {/* Step 1: Identification */}
        <div className={step !== 1 ? "hidden" : ""}>
          <div className="space-y-4 max-w-xl">
            <h3 className="text-lg font-serif text-si-ink tracking-tight">
              {t("matterIdentification")}
            </h3>
            <div className="rounded-lg border border-si-line bg-si-canvas/60 px-3 py-2 text-sm text-si-muted">
              <span className="font-medium text-si-muted">{t("matterNumberAuto")}</span>{" "}
              {t("matterNumberAutoDesc", { year })}
            </div>
            {hasTaxonomy ? (
              <>
                {/* « Type » = pratique du cabinet (taxonomie). Pilote le préfixe
                    de numérotation + le type métier dérivé côté serveur. */}
                <div>
                  <label className="block text-sm font-medium text-si-muted mb-1">
                    {tc("type")} <span className="text-si-amber-ink">*</span>
                  </label>
                  <select
                    name="subject"
                    required
                    value={selectedSubject}
                    onChange={(e) => {
                      setSelectedSubject(e.target.value);
                      setSelectedSubmatter("");
                    }}
                    className="w-full h-10 px-3 rounded-[10px] border border-si-line bg-si-surface font-sans text-si-ink outline-none focus:border-si-verified focus:ring-2 focus:ring-si-verified/25 transition"
                  >
                    <option value="">{t("selectType")}</option>
                    {subjectOptions!.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                {/* « Sujet » = point précis de la pratique (sous-matière).
                    Affiché seulement si la pratique en définit. */}
                {selectedSubject && availableSubmatters.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-si-muted mb-1">
                      {t("subjectLabel")}
                    </label>
                    <select
                      name="submatter"
                      value={selectedSubmatter}
                      onChange={(e) => setSelectedSubmatter(e.target.value)}
                      className="w-full h-10 px-3 rounded-[10px] border border-si-line bg-si-surface font-sans text-si-ink outline-none focus:border-si-verified focus:ring-2 focus:ring-si-verified/25 transition"
                    >
                      <option value="">{t("subjectSelect")}</option>
                      {availableSubmatters.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-si-muted mb-1">
                  {tc("type")} <span className="text-si-amber-ink">*</span>
                </label>
                <select
                  name="type"
                  required
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full h-10 px-3 rounded-[10px] border border-si-line bg-si-surface font-sans text-si-ink outline-none focus:border-si-verified focus:ring-2 focus:ring-si-verified/25 transition"
                >
                  {TYPE_OPTIONS.map((o) => (
                    <option key={o.value || "none"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <Input label={t("referenceOptional")} name="reference" placeholder="Ex. DOS-2024-001" />
            <Input label={`${t("matterTitle")} (${tc("optional").toLowerCase()})`} name="intitule" placeholder={t("taskTitle")} />
            <div>
              <label className="block text-sm font-medium text-si-muted mb-1">{t("initialStatus")}</label>
              <select
                name="statut"
                defaultValue="actif"
                className="w-full h-10 px-3 rounded-[10px] border border-si-line bg-si-surface font-sans text-si-ink outline-none focus:border-si-verified focus:ring-2 focus:ring-si-verified/25 transition"
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
            <h3 className="text-lg font-serif text-si-ink tracking-tight">
              {t("clientAssociation")}
            </h3>
            <div>
              <label className="block text-sm font-medium text-si-muted mb-1">
                {tc("client")} <span className="text-si-amber-ink">*</span>
              </label>
              <select
                name="clientId"
                required
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full h-10 px-3 rounded-[10px] border border-si-line bg-si-surface font-sans text-si-ink outline-none focus:border-si-verified focus:ring-2 focus:ring-si-verified/25 transition"
              >
                <option value="">{t("selectClient")}</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {formatClientLabel(c)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Step 3: Team */}
        <div className={step !== 3 ? "hidden" : ""}>
          <div className="space-y-4 max-w-xl">
            <h3 className="text-lg font-serif text-si-ink tracking-tight">
              {t("team")}
            </h3>
            <div>
              <label className="block text-sm font-medium text-si-muted mb-1">
                {t("responsibleLawyer")}
              </label>
              <select
                name="avocatResponsableId"
                className="w-full h-10 px-3 rounded-[10px] border border-si-line bg-si-surface font-sans text-si-ink outline-none focus:border-si-verified focus:ring-2 focus:ring-si-verified/25 transition"
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
                <label className="block text-sm font-medium text-si-muted mb-1">
                  {t("legalAssistant")}
                </label>
                <select
                  name="assistantJuridiqueId"
                  className="w-full h-10 px-3 rounded-[10px] border border-si-line bg-si-surface font-sans text-si-ink outline-none focus:border-si-verified focus:ring-2 focus:ring-si-verified/25 transition"
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
            <h3 className="text-lg font-serif text-si-ink tracking-tight">
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
            <h3 className="text-lg font-serif text-si-ink tracking-tight">
              {t("stepBilling")}
            </h3>
            {isCabinetForfait ? (
              <>
                <input type="hidden" name="modeFacturation" value="forfait" />
                <div className="rounded-lg border border-si-line bg-si-canvas/60 px-3 py-2 text-sm text-si-muted">
                  <span className="font-medium text-si-muted">
                    {t("billingFlat")}
                  </span>{" "}
                  — {t("billingFlatCabinetNote")}
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-si-muted mb-1">
                    {t("billingModeLabel")}
                  </label>
                  <select
                    name="modeFacturation"
                    className="w-full h-10 px-3 rounded-[10px] border border-si-line bg-si-surface font-sans text-si-ink outline-none focus:border-si-verified focus:ring-2 focus:ring-si-verified/25 transition"
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
              </>
            )}
          </div>
        </div>

        {/* Step 6: Summary */}
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
                  <span className="font-medium text-si-muted w-44 shrink-0">{label}</span>
                  <span className="text-si-ink break-words">{value || "—"}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-status-error">{error}</p>}

      <div className="flex items-center justify-between pt-4 border-t border-si-line">
        <div>
          {step > 1 && (
            <Button type="button" variant="secondary" onClick={() => goToStep(step - 1)}>
              {tc("previous")}
            </Button>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {step === 6 &&
            (!typeChosen || !selectedClientId.trim()) && (
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
                <CreateDossierSubmitButton
                  label={t("createMatter")}
                  pendingLabel={t("creatingMatter")}
                  disabled={!typeChosen || !selectedClientId.trim()}
                />
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

function CreateDossierSubmitButton({
  label,
  pendingLabel,
  disabled,
}: {
  label: string;
  pendingLabel: string;
  disabled: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={disabled || pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

function formatClientLabel(client?: DossierCreationWizardProps["clients"][number]) {
  if (!client) return "";
  if (client.typeClient === "personne_physique") {
    return [client.prenom, client.nom].filter(Boolean).join(" ").trim() || client.raisonSociale || "";
  }
  return client.raisonSociale || [client.prenom, client.nom].filter(Boolean).join(" ").trim();
}
