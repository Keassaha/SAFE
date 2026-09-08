"use client";

/**
 * Fenêtre d'envoi d'un document au client.
 *
 * Préremplit le destinataire (courriel du client du dossier) et un message
 * d'accompagnement selon le type de document, tous deux modifiables. Envoie via
 * `POST /api/edition/documents/[id]/send`.
 *
 * ── Remise au référentiel, lot 0.5 ───────────────────────────────────────────
 * Elle n'était atteignable que depuis l'éditeur du portail d'édition. En la
 * rendant joignable depuis l'onglet Correspondance d'un dossier, elle devient
 * une surface courante, et une surface courante doit tenir le référentiel.
 * Elle portait six manquements : trois couleurs en hexadécimal (PS-001), des
 * familles Tailwind génériques `neutral-*` (PS-002), un rayon `2xl` hors
 * superposition (PS-004), un `animate-spin` de chargement (PS-033), un fond
 * blanc littéral et une ombre hors système (PS-005).
 *
 * La coquille est désormais la même que celle de l'envoi de facture, voile et
 * panneau frères, verre du plan focalisé (PS-091 : une seule coquille de
 * fenêtre dans le produit).
 */

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Send, Loader2, X, AlertTriangle } from "lucide-react";
import { documentEmailTemplate } from "@/lib/services/client-send/email-templates";

interface Props {
  documentId: string;
  onClose: () => void;
  onSent?: () => void;
}

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

  const L = (fr: string, en: string) => (locale === "en" ? en : fr);

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
      setError(
        locale === "en"
          ? "Recipient, subject and message are required."
          : "Destinataire, objet et message sont requis.",
      );
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
      if (!res.ok || !data.ok) {
        throw new Error(data?.error ?? (locale === "en" ? "Send failed" : "Échec de l'envoi"));
      }
      setOk(true);
      onSent?.();
      setTimeout(onClose, 900);
    } catch (e) {
      setError(e instanceof Error ? e.message : locale === "en" ? "Send failed" : "Échec de l'envoi");
    } finally {
      setPending(false);
    }
  }

  const champ =
    "min-h-tap w-full rounded-md border border-si-line bg-si-surface px-3 py-2 text-sm text-si-ink focus:border-si-verified focus:outline-none focus:ring-2 focus:ring-si-verified/20";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="safe-scrim absolute inset-0" aria-hidden onClick={onClose} />
      <div
        className="safe-glass-focus relative z-10 flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-lg border"
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-doc-title"
      >
        <div className="flex items-center justify-between border-b border-si-line px-5 py-3">
          <h3 id="send-doc-title" className="text-base font-medium text-si-ink">
            {L("Envoyer au client", "Send to client")}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-tap w-tap items-center justify-center rounded-md text-si-muted transition-colors hover:bg-si-canvas hover:text-si-ink"
            aria-label={L("Fermer", "Close")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          /* Squelette immobile, aux dimensions des champs attendus (PS-033). */
          <div className="space-y-3 px-5 py-4" aria-busy="true" aria-live="polite">
            <span className="sr-only">{L("Chargement", "Loading")}</span>
            <div className="h-[52px] rounded-md bg-si-surface2" />
            <div className="h-[52px] rounded-md bg-si-surface2" />
            <div className="h-[150px] rounded-md bg-si-surface2" />
          </div>
        ) : (
          <div className="space-y-3 overflow-y-auto px-5 py-4">
            {isDraft ? (
              <div className="flex items-start gap-2 rounded-md bg-si-amber/[0.13] px-3 py-2 text-xs text-si-amber-ink">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                {L(
                  "Ce document est encore un brouillon. Vérifiez qu'il est prêt avant l'envoi.",
                  "This document is still a draft. Make sure it is final before sending.",
                )}
              </div>
            ) : null}

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-si-muted">
                {L("Destinataire", "Recipient")}
              </span>
              <input
                type="email"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="client@exemple.com"
                className={champ}
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-si-muted">{L("Objet", "Subject")}</span>
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} className={champ} />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-si-muted">{L("Message", "Message")}</span>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={8}
                className={`${champ} resize-y leading-relaxed`}
              />
            </label>

            <p className="text-xs text-si-muted">
              {L(
                "Le document sera joint en PDF. Cet envoi est tracé (preuve de communication).",
                "The document will be attached as a PDF. This send is logged (proof of communication).",
              )}
            </p>

            {error ? (
              <p className="text-xs text-si-danger-ink" role="alert">
                {error}
              </p>
            ) : null}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex min-h-tap items-center rounded-md border border-si-line px-4 text-sm font-medium text-si-ink transition-colors hover:bg-si-canvas"
              >
                {L("Annuler", "Cancel")}
              </button>
              <button
                type="button"
                disabled={pending || ok}
                onClick={submit}
                className="inline-flex min-h-tap items-center gap-1.5 rounded-md bg-si-ink-strong px-4 text-sm font-medium text-si-surface transition-colors hover:bg-si-ink-strong-soft disabled:opacity-50"
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Send className="h-4 w-4" aria-hidden />}
                {ok ? L("Envoyé", "Sent") : L("Envoyer", "Send")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
