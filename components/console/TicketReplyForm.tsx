"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addReply, setTicketStatus } from "@/app/(app)/console/support/actions";

const STATUTS = [
  { v: "NOUVEAU", l: "Nouveau" },
  { v: "EN_COURS", l: "En cours" },
  { v: "EN_ATTENTE_CLIENT", l: "En attente client" },
  { v: "RESOLU", l: "Résolu" },
  { v: "FERME", l: "Fermé" },
  { v: "REOUVERT", l: "Rouvert" },
];

export function TicketReplyForm({
  ticketId,
  currentStatut,
}: {
  ticketId: string;
  currentStatut: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleReply(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("ticketId", ticketId);
    setError(null);
    startTransition(async () => {
      const result = await addReply(formData);
      if (result.ok) {
        form.reset();
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function handleStatus(statut: string) {
    const formData = new FormData();
    formData.set("ticketId", ticketId);
    formData.set("statut", statut);
    startTransition(async () => {
      const result = await setTicketStatus(formData);
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded border border-red-300 bg-red-50 px-3 py-1.5 text-xs text-red-800">⚠️ {error}</div>
      )}

      <form onSubmit={handleReply} className="space-y-2">
        <textarea
          name="contenu"
          required
          rows={3}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder="Répondre au client…"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {isPending ? "Envoi…" : "Envoyer la réponse"}
        </button>
      </form>

      <div className="flex items-center gap-2 border-t border-zinc-200 pt-3">
        <span className="text-xs text-zinc-500">Changer le statut :</span>
        <select
          defaultValue={currentStatut}
          onChange={(e) => handleStatus(e.target.value)}
          disabled={isPending}
          className="rounded-md border border-zinc-300 px-2 py-1 text-xs focus:border-emerald-500 focus:outline-none"
        >
          {STATUTS.map((s) => (
            <option key={s.v} value={s.v}>{s.l}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
