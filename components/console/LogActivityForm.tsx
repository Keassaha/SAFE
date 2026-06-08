"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createActivity } from "@/app/(app)/console/leads/[id]/activity-actions";

const TYPES = [
  { v: "LINKEDIN_DM", l: "LinkedIn DM", dir: "OUTBOUND" },
  { v: "EMAIL_ENVOYE", l: "Email envoyé", dir: "OUTBOUND" },
  { v: "EMAIL_RECU", l: "Email reçu", dir: "INBOUND" },
  { v: "CALL", l: "Appel", dir: "OUTBOUND" },
  { v: "MEETING", l: "Réunion", dir: "OUTBOUND" },
  { v: "DEMO", l: "Démo", dir: "OUTBOUND" },
  { v: "LINKEDIN_COMMENT", l: "Commentaire LinkedIn", dir: "INBOUND" },
  { v: "NOTE", l: "Note interne", dir: "INTERNAL" },
];

const inputCls =
  "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

export function LogActivityForm({ leadId }: { leadId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [type, setType] = useState("LINKEDIN_DM");
  const [isPending, startTransition] = useTransition();

  const selectedType = TYPES.find((t) => t.v === type);
  const defaultDirection = selectedType?.dir ?? "OUTBOUND";

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("leadId", leadId);
    setError(null);
    startTransition(async () => {
      const result = await createActivity(formData);
      if (result.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-md border border-dashed border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-600 hover:border-emerald-400 hover:text-emerald-700"
      >
        + Logger une activité
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-md border border-zinc-200 bg-zinc-50/60 p-4"
    >
      {error && (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-1.5 text-xs text-red-800">
          ⚠️ {error}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">
            Type
          </label>
          <select
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={inputCls}
          >
            {TYPES.map((t) => (
              <option key={t.v} value={t.v}>
                {t.l}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">
            Direction
          </label>
          <select
            name="direction"
            key={defaultDirection}
            defaultValue={defaultDirection}
            className={inputCls}
          >
            <option value="OUTBOUND">Sortant</option>
            <option value="INBOUND">Entrant</option>
            <option value="INTERNAL">Interne</option>
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600">
          Sujet
        </label>
        <input
          name="sujet"
          className={inputCls}
          placeholder="Ex: Premier DM value-first"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600">
          Contenu / notes
        </label>
        <textarea
          name="contenu"
          rows={3}
          className={inputCls}
          placeholder="Détails de l'interaction…"
        />
      </div>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {isPending ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
        >
          Annuler
        </button>
        <span className="ml-auto text-[11px] text-zinc-500">
          Met à jour le score automatiquement
        </span>
      </div>
    </form>
  );
}
