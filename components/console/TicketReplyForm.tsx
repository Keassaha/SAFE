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
        <div className="rounded border border-[#B84A3E]/30 bg-[#B84A3E]/10 px-3 py-1.5 text-xs text-[#B84A3E]">⚠️ {error}</div>
      )}

      <form onSubmit={handleReply} className="space-y-2">
        <textarea
          name="contenu"
          required
          rows={3}
          className="w-full rounded-md border border-si-line px-3 py-2 text-sm focus:border-si-verified focus:outline-none focus:ring-1 focus:ring-si-verified/20"
          placeholder="Répondre au client…"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-si-verified px-3 py-1.5 text-sm font-medium text-si-surface hover:bg-si-forest-soft disabled:opacity-50"
        >
          {isPending ? "Envoi…" : "Envoyer la réponse"}
        </button>
      </form>

      <div className="flex items-center gap-2 border-t border-si-line pt-3">
        <span className="text-xs text-si-muted">Changer le statut :</span>
        <select
          defaultValue={currentStatut}
          onChange={(e) => handleStatus(e.target.value)}
          disabled={isPending}
          className="rounded-md border border-si-line px-2 py-1 text-xs focus:border-si-verified focus:outline-none"
        >
          {STATUTS.map((s) => (
            <option key={s.v} value={s.v}>{s.l}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
