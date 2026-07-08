"use client";

/**
 * Intake client Console — formulaire d'ajout manuel d'un cabinet.
 *
 * Réutilise le questionnaire d'audit (`lib/audit-gratuit/questions.ts`) comme
 * source unique. Contrairement à l'audit public (marketing, pas-à-pas), c'est un
 * outil INTERNE : toutes les sections sont visibles d'un coup pour aller vite.
 * Design safe-interface (tokens si-*). Spec : docs/product/SPEC_INTAKE_CLIENT_CONSOLE.md
 */

import { useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  SECTIONS,
  visibleQuestions,
  sectionQuestions,
  type Question,
} from "@/lib/audit-gratuit/questions";
import { Card, CardContent } from "@/components/ui/Card";
import {
  createClientFromIntake,
  type ImportableAudit,
} from "@/app/(app)/console/clients/nouveau/actions";

type Answers = Record<string, unknown>;

const SOURCES: { value: string; label: string }[] = [
  { value: "OFFLINE", label: "Contact hors ligne / rencontre" },
  { value: "REFERRAL", label: "Référence / bouche-à-oreille" },
  { value: "AUDIT_GRATUIT", label: "Audit gratuit" },
  { value: "LINKEDIN_DM_WARM", label: "LinkedIn (DM tiède)" },
  { value: "LINKEDIN_POST", label: "LinkedIn (publication)" },
  { value: "SEO_ORGANIC", label: "Recherche web / SEO" },
  { value: "EMAIL", label: "Courriel" },
];

const inputCls =
  "w-full rounded-xl border border-si-line bg-si-surface px-3 py-2.5 text-sm text-si-ink placeholder:text-si-muted transition focus:border-si-verified focus:outline-none focus:ring-2 focus:ring-si-verified/20";

/* ── Validation (portée de l'audit) ─────────────────────────────── */
function isAnswered(q: Question, v: unknown): boolean {
  if (!q.required) return true;
  if (v == null) return false;
  if (q.subfields && typeof v === "object") {
    const obj = v as Record<string, unknown>;
    return q.subfields.every((sf) => !sf.required || (obj[sf.id] != null && obj[sf.id] !== ""));
  }
  if (Array.isArray(v)) return v.length > 0;
  if (q.type === "scale10") return typeof v === "number" && v >= 1 && v <= 10;
  return String(v).trim() !== "";
}

function OptionChip({
  label,
  sub,
  selected,
  onClick,
}: {
  label: string;
  sub?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-0.5 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
        selected
          ? "border-si-verified bg-si-verified/10 text-si-ink"
          : "border-si-line bg-si-surface text-si-ink hover:border-si-verified/40"
      }`}
    >
      <span className="font-medium">{label}</span>
      {sub && <span className="text-xs text-si-muted">{sub}</span>}
    </button>
  );
}

function Field({
  q,
  value,
  onChange,
}: {
  q: Question;
  value: unknown;
  onChange: (v: unknown) => void;
}) {
  // Sous-champs groupés (ex. ville + province, nom + titre, courriel + tél)
  if (q.subfields) {
    const obj = (value as Record<string, unknown>) || {};
    return (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {q.subfields.map((sf) => (
          <div key={sf.id} className={sf.options && sf.options.length > 4 ? "md:col-span-2" : ""}>
            <label className="mb-1.5 block text-xs font-medium text-si-muted">{sf.label}</label>
            {sf.type === "radio" && sf.options ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {sf.options.map((o) => (
                  <OptionChip
                    key={o.value}
                    label={o.label}
                    selected={obj[sf.id] === o.value}
                    onClick={() => onChange({ ...obj, [sf.id]: o.value })}
                  />
                ))}
              </div>
            ) : (
              <input
                type={sf.type === "number" ? "number" : sf.type === "email" ? "email" : sf.type === "tel" ? "tel" : "text"}
                value={(obj[sf.id] as string) ?? ""}
                onChange={(e) =>
                  onChange({ ...obj, [sf.id]: sf.type === "number" ? Number(e.target.value) : e.target.value })
                }
                placeholder={sf.placeholder}
                className={inputCls}
              />
            )}
          </div>
        ))}
      </div>
    );
  }

  switch (q.type) {
    case "text":
    case "email":
    case "tel":
    case "url":
    case "number":
      return (
        <input
          type={q.type}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(q.type === "number" ? Number(e.target.value) : e.target.value)}
          placeholder={q.placeholder}
          className={inputCls}
        />
      );

    case "textarea":
      return (
        <textarea
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={q.placeholder}
          rows={3}
          className={inputCls}
        />
      );

    case "scale10": {
      const v = typeof value === "number" ? value : 0;
      return (
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className={`h-10 w-10 rounded-lg border text-sm font-medium tabular-nums transition ${
                v === n
                  ? "border-si-verified bg-si-verified text-si-surface"
                  : "border-si-line bg-si-surface text-si-ink hover:border-si-verified/40"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      );
    }

    case "radio":
    case "radio-with-other": {
      const selected = value as string;
      const isOther =
        q.type === "radio-with-other" && typeof selected === "string" && selected.startsWith("other:");
      return (
        <div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {q.options?.map((o) => (
              <OptionChip
                key={o.value}
                label={o.label}
                sub={o.sub}
                selected={selected === o.value || (o.value === "autre" && isOther)}
                onClick={() => {
                  if (o.value === "autre" && q.type === "radio-with-other") onChange("other:");
                  else onChange(o.value);
                }}
              />
            ))}
          </div>
          {isOther && (
            <input
              type="text"
              autoFocus
              value={typeof selected === "string" ? selected.replace(/^other:/, "") : ""}
              onChange={(e) => onChange(`other:${e.target.value}`)}
              placeholder="Précisez…"
              className={`${inputCls} mt-2`}
            />
          )}
        </div>
      );
    }

    case "checkbox":
    case "checkbox-with-other": {
      const arr = Array.isArray(value) ? (value as string[]) : [];
      const otherChecked = q.type === "checkbox-with-other" && arr.some((v) => v.startsWith("other:"));
      const otherText = otherChecked
        ? (arr.find((v) => v.startsWith("other:")) || "other:").replace(/^other:/, "")
        : "";
      const toggle = (val: string) => {
        if (val === "autre" && q.type === "checkbox-with-other") {
          if (otherChecked) onChange(arr.filter((x) => !x.startsWith("other:")));
          else {
            if (q.maxChecked && arr.length >= q.maxChecked) return;
            onChange([...arr, "other:"]);
          }
          return;
        }
        if (arr.includes(val)) onChange(arr.filter((x) => x !== val));
        else {
          if (q.maxChecked && arr.length >= q.maxChecked) return;
          onChange([...arr, val]);
        }
      };
      return (
        <div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {q.options?.map((o) => (
              <OptionChip
                key={o.value}
                label={o.label}
                sub={o.sub}
                selected={arr.includes(o.value) || (o.value === "autre" && otherChecked)}
                onClick={() => toggle(o.value)}
              />
            ))}
          </div>
          {otherChecked && (
            <input
              type="text"
              autoFocus
              value={otherText}
              onChange={(e) => {
                const rest = arr.filter((x) => !x.startsWith("other:"));
                onChange([...rest, `other:${e.target.value}`]);
              }}
              placeholder="Précisez…"
              className={`${inputCls} mt-2`}
            />
          )}
          {q.maxChecked && <p className="mt-2 text-xs text-si-muted">Maximum {q.maxChecked} sélections.</p>}
        </div>
      );
    }

    default:
      return null;
  }
}

export function ConsoleIntakeForm({ imports = [] }: { imports?: ImportableAudit[] }) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Answers>({});
  const [sourceLead, setSourceLead] = useState("OFFLINE");
  const [importedAuditId, setImportedAuditId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setAnswer = useCallback((qid: string, v: unknown) => {
    setAnswers((prev) => ({ ...prev, [qid]: v }));
    setError(null);
  }, []);

  const onSelectImport = useCallback(
    (id: string) => {
      if (!id) {
        setImportedAuditId(null);
        setAnswers({});
        setSourceLead("OFFLINE");
        setError(null);
        return;
      }
      const found = imports.find((i) => i.id === id);
      if (!found) return;
      setImportedAuditId(found.id);
      setAnswers({ ...(found.answers as Answers) });
      setSourceLead("AUDIT_GRATUIT");
      setError(null);
    },
    [imports],
  );

  const visible = useMemo(() => visibleQuestions(answers), [answers]);
  const answeredRequired = visible.filter((q) => q.required && isAnswered(q, answers[q.id])).length;
  const totalRequired = visible.filter((q) => q.required).length;

  const handleSubmit = useCallback(async () => {
    const firstMissing = visible.find((q) => q.required && !isAnswered(q, answers[q.id]));
    if (firstMissing) {
      setError(`Réponse manquante : « ${firstMissing.label} »`);
      const el = document.getElementById(`q-${firstMissing.id}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await createClientFromIntake({ answers, sourceLead, importedAuditId });
    if (res.ok) {
      router.push(`/console/clients/${res.leadId}`);
    } else {
      setError(res.error);
      setSubmitting(false);
    }
  }, [answers, sourceLead, importedAuditId, visible, router]);

  return (
    <div className="space-y-6">
      {/* Mode A — importer depuis un audit déjà rempli */}
      {imports.length > 0 && (
        <Card>
          <CardContent className="px-6 py-5">
            <label className="block text-sm font-medium text-si-ink">Importer depuis un audit</label>
            <p className="mb-2 mt-0.5 text-xs text-si-muted">
              Le cabinet a rempli l'audit gratuit ? Choisissez sa soumission pour préremplir tout le formulaire.
            </p>
            <select
              value={importedAuditId ?? ""}
              onChange={(e) => onSelectImport(e.target.value)}
              className={inputCls}
            >
              <option value="">Partir de zéro (saisie manuelle)</option>
              {imports.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.label} — {i.sub}
                </option>
              ))}
            </select>
            {importedAuditId && (
              <p className="mt-2 text-xs text-si-verified">
                Prérempli depuis l'audit. Vous pouvez corriger les champs avant de créer le client.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {SECTIONS.map((section) => {
        const qs = sectionQuestions(section.id, answers);
        if (qs.length === 0) return null;
        return (
          <Card key={section.id}>
            <CardContent className="p-0">
              <div className="border-b border-si-line px-6 py-4">
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-si-muted">
                  Section {section.number} · {section.subtitle}
                </p>
                <h2 className="mt-1 font-serif text-[20px] leading-tight text-si-ink">{section.title}</h2>
              </div>
              <div className="space-y-6 px-6 py-5">
                {qs.map((q) => (
                  <div key={q.id} id={`q-${q.id}`}>
                    <label className="block text-sm font-medium text-si-ink">
                      {q.label}
                      {q.required && <span className="ml-1 text-si-amber-ink">*</span>}
                    </label>
                    {q.help && <p className="mb-2 mt-0.5 text-xs text-si-muted">{q.help}</p>}
                    <div className={q.help ? "" : "mt-2"}>
                      <Field q={q} value={answers[q.id]} onChange={(v) => setAnswer(q.id, v)} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Source + soumission */}
      <Card>
        <CardContent className="px-6 py-5">
          <label className="block text-sm font-medium text-si-ink">Comment ce cabinet est-il arrivé ?</label>
          <p className="mb-2 mt-0.5 text-xs text-si-muted">Source du contact (pour le suivi CRM).</p>
          <select
            value={sourceLead}
            onChange={(e) => setSourceLead(e.target.value)}
            className={inputCls}
          >
            {SOURCES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-xl border border-[#B84A3E]/30 bg-[#B84A3E]/10 px-4 py-3 text-sm text-[#B84A3E]">
          {error}
        </div>
      )}

      <div className="sticky bottom-4 flex items-center justify-between gap-4 rounded-2xl border border-si-line bg-si-surface/95 px-5 py-4 backdrop-blur">
        <p className="text-sm text-si-muted">
          <span className="font-mono tabular-nums text-si-ink">{answeredRequired}</span> / {totalRequired} champs requis remplis
        </p>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded-xl bg-si-forest px-6 py-3 text-sm font-medium text-si-surface transition hover:bg-si-forest-soft disabled:opacity-60"
        >
          {submitting ? "Création…" : "Créer le client"}
        </button>
      </div>
    </div>
  );
}
