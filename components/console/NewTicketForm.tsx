"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTicket } from "@/app/(app)/console/support/actions";

type CabinetOption = { id: string; nom: string };

const inputCls =
  "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

export function NewTicketForm({ cabinets }: { cabinets: CabinetOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await createTicket(formData);
      if (result.ok) {
        setOpen(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  if (cabinets.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Aucun cabinet client disponible. Convertissez un lead en client pour ouvrir des tickets.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
      >
        + Nouveau ticket
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-md border border-zinc-200 bg-zinc-50/60 p-4">
      {error && (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-1.5 text-xs text-red-800">⚠️ {error}</div>
      )}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">Cabinet</label>
          <select name="cabinetId" required className={inputCls}>
            {cabinets.map((c) => (
              <option key={c.id} value={c.id}>{c.nom}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">Type</label>
          <select name="type" className={inputCls} defaultValue="QUESTION">
            <option value="BUG">Bug</option>
            <option value="DEMANDE_FEATURE">Demande de feature</option>
            <option value="QUESTION">Question</option>
            <option value="REMARQUE">Remarque</option>
            <option value="URGENCE">Urgence</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-600">Priorité</label>
          <select name="priorite" className={inputCls} defaultValue="NORMALE">
            <option value="HAUTE">Haute</option>
            <option value="NORMALE">Normale</option>
            <option value="BASSE">Basse</option>
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600">Titre</label>
        <input name="titre" required className={inputCls} placeholder="Résumé du problème" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-600">Description</label>
        <textarea name="description" required rows={3} className={inputCls} placeholder="Détails…" />
      </div>
      <div className="flex items-center gap-2">
        <button type="submit" disabled={isPending} className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
          {isPending ? "Création…" : "Créer le ticket"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50">
          Annuler
        </button>
      </div>
    </form>
  );
}
