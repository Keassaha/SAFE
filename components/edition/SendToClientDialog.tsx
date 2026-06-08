"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Send, Loader2, X, AlertTriangle } from "lucide-react";
import { documentEmailTemplate } from "@/lib/services/client-send/email-templates";

interface Props {
  documentId: string;
  onClose: () => void;
  onSent?: () => void;
}

const FOREST = "#1F3A2E";
const WARN = { fg: "#8B6B1F", bg: "#F5E6C8" };
const ERR = "#8A3A2D";

/**
 * Fenêtre d'envoi d'un document au client (E3). Préremplit le destinataire (email
 * du client) et un message d'accompagnement selon le type de document, tous deux
 * éditables. Envoie via POST /api/edition/documents/[id]/send.
 */
export function SendToClientDialog({ documentId, onClose, onSent }: Props) {
  const locale = (useLocale() === "en" ? "en" : "fr") as "fr" | "en";
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [isDraft, setIsDraft] = useState(false);

  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/edition/documents/${documentId}/send`);
        if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error ?? `HTTP ${res.status}`);
        const d = (await res.json()) as {
          clientEmail: string;
          clientNom: string;
          cabinetNom: string;
          documentTitre: string;
          documentType: string;
          statut: string;
        };
        if (cancelled) return;
        const tpl = documentEmailTemplate(d.documentType, locale, {
          clientNom: d.clientNom,
          cabinetNom: d.cabinetNom,
          documentTitre: d.documentTitre,
        });
        setRecipient(d.clientEmail);
        setSubject(tpl.subject);
        setBody(tpl.body);
        setIsDraft(d.statut === "brouillon");
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur de chargement");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [documentId, locale]);

  async function submit() {
    setError(null);
    if (!recipient.trim() || !subject.trim() || !body.trim()) {
      setError(locale === "en" ? "Recipient, subject and message are required." : "Destinataire, objet et message sont requis.");
      return;
    }
    setPending(true);
    try {
      const res = await fetch(`/api/edition/documents/${documentId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientEmail: recipient.trim(), subject, body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data?.error ?? (locale === "en" ? "Send failed" : "Échec de l'envoi"));
      setOk(true);
      onSent?.();
      setTimeout(onClose, 900);
    } catch (e) {
      setError(e instanceof Error ? e.message : locale === "en" ? "Send failed" : "Échec de l'envoi");
    } finally {
      setPending(false);
    }
  }

  const L = (fr: string, en: string) => (locale === "en" ? en : fr);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-3">
          <h3 className="text-[15px] font-semibold text-neutral-900">{L("Envoyer au client", "Send to client")}</h3>
          <button type="button" onClick={onClose} className="text-neutral-400 hover:text-neutral-700" aria-label="Fermer">
            <X className="h-4 w-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-neutral-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : (
          <div className="space-y-3 px-5 py-4">
            {isDraft ? (
              <div className="flex items-start gap-2 rounded-lg px-3 py-2 text-xs" style={{ backgroundColor: WARN.bg, color: WARN.fg }}>
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {L("Ce document est encore un brouillon. Vérifiez qu'il est prêt avant l'envoi.", "This document is still a draft. Make sure it is final before sending.")}
              </div>
            ) : null}

            <label className="block">
              <span className="mb-1 block text-[12px] font-medium text-neutral-600">{L("Destinataire", "Recipient")}</span>
              <input
                type="email"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="client@exemple.com"
                className="h-[38px] w-full rounded-md border border-neutral-300 px-3 text-sm focus:border-forest-700 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-[12px] font-medium text-neutral-600">{L("Objet", "Subject")}</span>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="h-[38px] w-full rounded-md border border-neutral-300 px-3 text-sm focus:border-forest-700 focus:outline-none"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-[12px] font-medium text-neutral-600">{L("Message", "Message")}</span>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={8}
                className="w-full resize-y rounded-md border border-neutral-300 px-3 py-2 text-sm leading-relaxed focus:border-forest-700 focus:outline-none"
              />
            </label>

            <p className="text-[11px] text-neutral-400">
              {L("Le document sera joint en PDF. Cet envoi est tracé (preuve de communication).", "The document will be attached as a PDF. This send is logged (proof of communication).")}
            </p>

            {error ? <p className="text-xs" style={{ color: ERR }}>{error}</p> : null}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button type="button" onClick={onClose} className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-600">
                {L("Annuler", "Cancel")}
              </button>
              <button
                type="button"
                disabled={pending || ok}
                onClick={submit}
                className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: FOREST }}
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {ok ? L("Envoyé", "Sent") : L("Envoyer", "Send")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
