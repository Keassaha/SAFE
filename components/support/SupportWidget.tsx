"use client";

import { useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { LifeBuoy, X } from "lucide-react";
import {
  createClientTicket,
  listMyTickets,
  type WidgetTicket,
} from "@/app/(app)/support-widget-actions";

const STATUT_LABELS: Record<string, string> = {
  NOUVEAU: "Nouveau",
  EN_COURS: "En cours",
  EN_ATTENTE_CLIENT: "Réponse reçue",
  RESOLU: "Résolu",
  FERME: "Fermé",
  REOUVERT: "Rouvert",
};

const inputCls =
  "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500";

export function SupportWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"new" | "list">("new");
  const [tickets, setTickets] = useState<WidgetTicket[]>([]);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Ne pas afficher le widget dans la console interne SAFE Inc.
  if (pathname.startsWith("/console")) return null;

  function openPanel() {
    setOpen(true);
    startTransition(async () => {
      const t = await listMyTickets();
      setTickets(t);
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("contexteUrl", pathname);
    setError(null);
    startTransition(async () => {
      const result = await createClientTicket(formData);
      if (result.ok) {
        form.reset();
        setSent(true);
        const t = await listMyTickets();
        setTickets(t);
        setTimeout(() => setSent(false), 4000);
        setTab("list");
      } else {
        setError(result.error);
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={openPanel}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-lg hover:bg-emerald-700"
        aria-label="Aide"
      >
        <LifeBuoy className="h-4 w-4" />
        Aide
      </button>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 flex w-[360px] max-w-[calc(100vw-2rem)] flex-col rounded-xl border border-zinc-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
          <LifeBuoy className="h-4 w-4 text-emerald-600" />
          Support SAFE
        </div>
        <button onClick={() => setOpen(false)} className="text-zinc-400 hover:text-zinc-700">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex border-b border-zinc-200">
        <button
          onClick={() => setTab("new")}
          className={`flex-1 px-3 py-2 text-xs font-medium ${tab === "new" ? "border-b-2 border-emerald-600 text-emerald-700" : "text-zinc-500"}`}
        >
          Nouvelle demande
        </button>
        <button
          onClick={() => setTab("list")}
          className={`flex-1 px-3 py-2 text-xs font-medium ${tab === "list" ? "border-b-2 border-emerald-600 text-emerald-700" : "text-zinc-500"}`}
        >
          Mes demandes ({tickets.length})
        </button>
      </div>

      <div className="max-h-[60vh] overflow-y-auto p-4">
        {tab === "new" ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            {sent && (
              <div className="rounded border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-800">
                ✓ Demande envoyée. Nous revenons vers vous rapidement.
              </div>
            )}
            {error && (
              <div className="rounded border border-red-300 bg-red-50 px-3 py-1.5 text-xs text-red-800">⚠️ {error}</div>
            )}
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">Type</label>
              <select name="type" className={inputCls} defaultValue="QUESTION">
                <option value="QUESTION">Question</option>
                <option value="BUG">Problème / bug</option>
                <option value="DEMANDE_FEATURE">Suggestion</option>
                <option value="REMARQUE">Remarque</option>
                <option value="URGENCE">Urgence</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">Sujet</label>
              <input name="titre" required className={inputCls} placeholder="En quelques mots…" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600">Détails</label>
              <textarea name="description" required rows={4} className={inputCls} placeholder="Décrivez votre demande…" />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {isPending ? "Envoi…" : "Envoyer"}
            </button>
          </form>
        ) : (
          <div className="space-y-3">
            {tickets.length === 0 ? (
              <p className="py-6 text-center text-sm text-zinc-400">Aucune demande pour l'instant.</p>
            ) : (
              tickets.map((t) => (
                <div key={t.id} className="rounded-md border border-zinc-200 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-zinc-900">{t.titre}</span>
                    <span className="shrink-0 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-600">
                      {STATUT_LABELS[t.statut] ?? t.statut}
                    </span>
                  </div>
                  {t.replies.length > 0 && (
                    <div className="mt-2 space-y-1.5 border-t border-zinc-100 pt-2">
                      {t.replies.map((r, i) => (
                        <div key={i} className={`text-xs ${r.isFromSafeInc ? "text-emerald-700" : "text-zinc-600"}`}>
                          <span className="font-medium">{r.isFromSafeInc ? "SAFE" : "Vous"} :</span>{" "}
                          {r.contenu}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
