"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Paperclip, FileText, X } from "lucide-react";
import {
  markConversationRead,
  setConversationStatut,
  convertToBillet,
} from "@/app/(app)/console/support/chat-actions";
import { subscribeSupport, supportChannels } from "@/lib/support/realtime-browser";

const ACCEPT = ".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp";

const TYPES = [
  { v: "QUESTION", l: "Question" },
  { v: "BUG", l: "Bug" },
  { v: "DEMANDE_FEATURE", l: "Demande de feature" },
  { v: "REMARQUE", l: "Remarque" },
  { v: "URGENCE", l: "Urgence" },
];
const PRIORITES = [
  { v: "NORMALE", l: "Normale" },
  { v: "HAUTE", l: "Haute" },
  { v: "BASSE", l: "Basse" },
];

const inputCls =
  "w-full rounded-md border border-si-line px-3 py-2 text-sm focus:border-si-verified focus:outline-none focus:ring-1 focus:ring-si-verified/20";

export function ConversationThread({
  conversationId,
  statut,
  suggestedTitre,
  suggestedDescription,
}: {
  conversationId: string;
  statut: string;
  suggestedTitre: string;
  suggestedDescription: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [showConvert, setShowConvert] = useState(false);
  const [converted, setConverted] = useState(false);
  const [replyFiles, setReplyFiles] = useState<File[]>([]);
  const [isPending, startTransition] = useTransition();

  // Marque le fil comme lu à l'ouverture, puis rafraîchit doucement.
  useEffect(() => {
    markConversationRead(conversationId);
  }, [conversationId]);

  // Temps réel : le client écrit → on recharge le fil. Filet de sécurité à 20 s.
  useEffect(() => {
    const unsub = subscribeSupport(supportChannels.console(), (sig) => {
      if (sig.conversationId === conversationId && sig.side === "client") router.refresh();
    });
    const timer = setInterval(() => router.refresh(), 20000);
    return () => {
      unsub();
      clearInterval(timer);
    };
  }, [router, conversationId]);

  function handleReply(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const contenu = String(new FormData(form).get("contenu") || "").trim();
    if (!contenu && replyFiles.length === 0) return;
    const fd = new FormData();
    fd.set("conversationId", conversationId);
    fd.set("contenu", contenu);
    replyFiles.forEach((f) => fd.append("files", f));
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/support/messages", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        form.reset();
        setReplyFiles([]);
        router.refresh();
      } else {
        setError(data.error || "Erreur d'envoi");
      }
    });
  }

  function toggleArchive() {
    const formData = new FormData();
    formData.set("conversationId", conversationId);
    formData.set("statut", statut === "ARCHIVEE" ? "OUVERTE" : "ARCHIVEE");
    startTransition(async () => {
      const res = await setConversationStatut(formData);
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }

  function handleConvert(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("conversationId", conversationId);
    setError(null);
    startTransition(async () => {
      const res = await convertToBillet(formData);
      if (res.ok) {
        setShowConvert(false);
        setConverted(true);
        setTimeout(() => setConverted(false), 4000);
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded border border-[#B84A3E]/30 bg-[#B84A3E]/10 px-3 py-1.5 text-xs text-[#B84A3E]">⚠️ {error}</div>
      )}
      {converted && (
        <div className="rounded border border-si-verified/30 bg-si-verified/[0.06] px-3 py-1.5 text-xs text-si-forest">
          ✓ Billet créé. Il apparaît dans le suivi du client.
        </div>
      )}

      {/* Répondre */}
      <Card>
        <form onSubmit={handleReply} className="space-y-2">
          <textarea
            name="contenu"
            rows={3}
            className={inputCls}
            placeholder="Répondre au client…"
          />
          {replyFiles.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {replyFiles.map((f, i) => (
                <span key={i} className="flex items-center gap-1 rounded bg-si-canvas px-2 py-1 text-[11px] text-si-ink">
                  <FileText className="h-3 w-3" />
                  <span className="max-w-[160px] truncate">{f.name}</span>
                  <button type="button" onClick={() => setReplyFiles((prev) => prev.filter((_, x) => x !== i))} className="text-si-muted hover:text-si-ink">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <label className="flex cursor-pointer items-center gap-1 rounded-md border border-si-line px-2 py-1.5 text-xs text-si-muted hover:bg-si-canvas">
              <Paperclip className="h-3.5 w-3.5" /> Joindre
              <input
                type="file"
                multiple
                accept={ACCEPT}
                className="hidden"
                onChange={(e) => { setReplyFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])]); e.target.value = ""; }}
              />
            </label>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-si-verified px-3 py-1.5 text-sm font-medium text-si-surface hover:bg-si-forest-soft disabled:opacity-50"
            >
              {isPending ? "Envoi…" : "Envoyer la réponse"}
            </button>
            <button
              type="button"
              onClick={() => { setShowConvert((s) => !s); setError(null); }}
              className="rounded-md border border-si-verified/40 px-3 py-1.5 text-sm font-medium text-si-forest hover:bg-si-verified/[0.06]"
            >
              Transformer en billet
            </button>
            <button
              type="button"
              onClick={toggleArchive}
              disabled={isPending}
              className="ml-auto rounded-md border border-si-line px-3 py-1.5 text-xs text-si-muted hover:bg-si-canvas"
            >
              {statut === "ARCHIVEE" ? "Rouvrir" : "Archiver"}
            </button>
          </div>
        </form>
      </Card>

      {/* Formulaire de transformation en billet */}
      {showConvert && (
        <Card>
          <form onSubmit={handleConvert} className="space-y-3">
            <h3 className="text-sm font-medium uppercase tracking-wide text-si-muted">Nouveau billet</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-si-muted">Type</label>
                <select name="type" defaultValue="QUESTION" className={inputCls}>
                  {TYPES.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-si-muted">Priorité</label>
                <select name="priorite" defaultValue="NORMALE" className={inputCls}>
                  {PRIORITES.map((p) => <option key={p.v} value={p.v}>{p.l}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-si-muted">Titre</label>
              <input name="titre" required defaultValue={suggestedTitre} className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-si-muted">Description</label>
              <textarea name="description" required rows={4} defaultValue={suggestedDescription} className={inputCls} />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowConvert(false)} className="rounded-md border border-si-line px-3 py-1.5 text-sm text-si-muted hover:bg-si-canvas">
                Annuler
              </button>
              <button type="submit" disabled={isPending} className="rounded-md bg-si-verified px-3 py-1.5 text-sm font-medium text-si-surface hover:bg-si-forest-soft disabled:opacity-50">
                {isPending ? "Création…" : "Créer le billet"}
              </button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-si-line bg-si-surface px-5 py-4">{children}</div>;
}
