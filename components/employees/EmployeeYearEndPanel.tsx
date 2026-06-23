"use client";

import { useState, useTransition } from "react";
import { Pencil, X, Check, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { updateEmployeeYearEndInfo } from "@/app/(app)/employees/actions";
import type { EmploymentType } from "@prisma/client";

interface EmployeeYearEndPanelProps {
  employeeId: string;
  employmentType: EmploymentType;
  /** NAS masqué (***-***-XXX) ou null si non renseigné. */
  sinMasked: string | null;
  canEdit: boolean;
}

const TYPE_LABELS: Record<EmploymentType, { label: string; badge: string; color: string }> = {
  employee: {
    label: "Employé (T4)",
    badge: "T4",
    color: "bg-si-verified/10 text-si-verified",
  },
  contractor: {
    label: "Contractuel (T4A)",
    badge: "T4A",
    color: "bg-si-amber/[0.13] text-si-amber-ink",
  },
};

/** Formate la saisie NAS au fil du frappe : 123456789 → 123-456-789. */
function formatSinInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 9);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function EmployeeYearEndPanel({
  employeeId,
  employmentType,
  sinMasked,
  canEdit,
}: EmployeeYearEndPanelProps) {
  const [editing, setEditing] = useState(false);
  const [type, setType] = useState<EmploymentType>(employmentType);
  const [sinInput, setSinInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const meta = TYPE_LABELS[type];
  const currentMeta = TYPE_LABELS[employmentType];

  function handleSinChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSinInput(formatSinInput(e.target.value));
  }

  function handleEdit() {
    setSinInput("");
    setType(employmentType);
    setError(null);
    setEditing(true);
  }

  function handleCancel() {
    setEditing(false);
    setError(null);
  }

  function handleSave() {
    setError(null);
    // Valider le NAS si fourni
    const digits = sinInput.replace(/\D/g, "");
    if (sinInput.trim() && digits.length !== 9) {
      setError("Le NAS doit contenir exactement 9 chiffres.");
      return;
    }
    startTransition(async () => {
      try {
        await updateEmployeeYearEndInfo(
          employeeId,
          type,
          sinInput.trim() ? sinInput : null,
        );
        setEditing(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors de la sauvegarde.");
      }
    });
  }

  return (
    <div className="rounded-xl border border-si-line bg-si-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-si-muted/50" />
          <span className="text-[13px] font-semibold text-si-ink">
            Informations fin d&apos;année
          </span>
        </div>
        {canEdit && !editing && (
          <button
            type="button"
            onClick={handleEdit}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-medium text-si-muted hover:bg-si-canvas hover:text-si-ink"
          >
            <Pencil className="h-3.5 w-3.5" />
            Modifier
          </button>
        )}
      </div>

      {!editing ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-si-muted/50">
              Type de feuillet
            </p>
            <div className="mt-1 flex items-center gap-1.5">
              <span
                className={`rounded px-1.5 py-0.5 text-[11px] font-bold ${currentMeta.color}`}
              >
                {currentMeta.badge}
              </span>
              <span className="text-[13px] text-si-ink">{currentMeta.label}</span>
            </div>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-si-muted/50">
              NAS
            </p>
            <p className="mt-1 font-mono text-[13px] text-si-ink">
              {sinMasked ?? <span className="text-si-muted/50 italic">Non renseigné</span>}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Type */}
          <div>
            <label className="block text-[12px] font-medium text-si-muted mb-1">
              Type d&apos;emploi
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as EmploymentType)}
              className="w-full rounded-lg border border-si-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-si-verified"
            >
              <option value="employee">Employé — T4 (retenues CPP / AE / impôt)</option>
              <option value="contractor">Contractuel — T4A (case 48 honoraires)</option>
            </select>
          </div>

          {/* NAS */}
          <div>
            <label className="block text-[12px] font-medium text-si-muted mb-1">
              Numéro d&apos;assurance sociale (NAS)
              <span className="ml-1 font-normal text-si-muted/50">— optionnel</span>
            </label>
            <input
              type="text"
              value={sinInput}
              onChange={handleSinChange}
              placeholder="123-456-789"
              className="w-full rounded-lg border border-si-line px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-si-verified"
              maxLength={11}
            />
            <p className="mt-1 text-[11px] text-si-muted/50">
              Laissez vide pour ne pas modifier le NAS actuel.
              Le NAS est affiché masqué (***-***-XXX) dans l&apos;application.
            </p>
          </div>

          {error && (
            <p className="rounded-lg bg-[#B84A3E]/10 px-3 py-2 text-[13px] text-[#B84A3E]">{error}</p>
          )}

          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="primary"
              className="gap-2 text-sm"
              disabled={isPending}
              onClick={handleSave}
            >
              <Check className="h-4 w-4" />
              {isPending ? "Enregistrement…" : "Enregistrer"}
            </Button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isPending}
              className="flex items-center gap-1.5 rounded-lg border border-si-line px-3 py-1.5 text-sm text-si-muted hover:bg-si-canvas"
            >
              <X className="h-4 w-4" />
              Annuler
            </button>
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-si-amber/[0.13] px-3 py-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-si-amber-ink" />
            <p className="text-[11px] text-si-amber-ink">
              Le NAS est une donnée personnelle sensible. Il est stocké dans votre base de données
              sécurisée et utilisé uniquement pour la préparation des feuillets de fin d&apos;année.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
