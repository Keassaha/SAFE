"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CornerUpLeft, HelpCircle, Check, Send, MessageSquare, Loader2 } from "lucide-react";
import type { NavetteMessageType } from "@prisma/client";
import {
  sendNavetteMessageAction,
  sendBackAction,
  approveMatterAction,
  markReadyForReviewAction,
  resolveNavetteAction,
} from "@/app/(app)/navette/actions";

/** Ligne sérialisée (dates en ISO) passée depuis le serveur. */
export interface SerializedNavetteRow {
  id: string;
  type: NavetteMessageType;
  body: string | null;
  authorName: string | null;
  authorRole: string;
  recipientId: string | null;
  dueDate: string | null;
  confidentiel: boolean;
  resolvedAt: string | null;
  createdAt: string;
}

interface Props {
  dossierId: string;
  rows: SerializedNavetteRow[];
  currentUserId: string;
  currentUserRole: string;
  locale?: "fr" | "en";
}

/** Couleurs de tonalité — tokens de statut SAFE. */
const TONE: Record<string, { fg: string; bg: string }> = {
  err: { fg: "#8A3A2D", bg: "#F3D8D2" },
  warn: { fg: "#8B6B1F", bg: "#F5E6C8" },
  succ: { fg: "#1F3A2E", bg: "#D4E8D9" },
  brand: { fg: "#1F3A2E", bg: "#EEF5F0" },
  muted: { fg: "#71717A", bg: "#FAFAFA" },
};

function toneFor(type: NavetteMessageType): keyof typeof TONE {
  switch (type) {
    case "sent_back": return "err";
    case "question": return "warn";
    case "approved": return "succ";
    case "ready_for_review": return "brand";
    default: return "muted";
  }
}

function IconFor({ type }: { type: NavetteMessageType }) {
  const cls = "h-4 w-4";
  switch (type) {
    case "sent_back": return <CornerUpLeft className={cls} aria-hidden />;
    case "question": return <HelpCircle className={cls} aria-hidden />;
    case "approved": return <Check className={cls} aria-hidden />;
    case "ready_for_review": return <Send className={cls} aria-hidden />;
    default: return <MessageSquare className={cls} aria-hidden />;
  }
}

export function NavetteThread({ dossierId, rows, currentUserId, currentUserRole, locale = "en" }: Props) {
  const t = useTranslations("navetteUi");
  const router = useRouter();
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"message" | "sentback">("message");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isLawyer = currentUserRole === "avocat" || currentUserRole === "admin_cabinet";
  const isAssistant = currentUserRole === "assistante" || currentUserRole === "admin_cabinet";

  const typeLabel = (type: NavetteMessageType) =>
    t(
      ({
        sent_back: "typeSentBack",
        question: "typeQuestion",
        approved: "typeApproved",
        ready_for_review: "typeReadyForReview",
        info: "typeInfo",
        reply: "typeReply",
      } as const)[type],
    );

  const fmtDate = (iso: string) =>
    new Intl.DateTimeFormat(locale === "en" ? "en-CA" : "fr-CA", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await action();
      if (!res.ok) setError(res.error ?? t("genericError"));
      else {
        setText("");
        setMode("message");
        router.refresh();
      }
    });
  }

  const onSend = () => {
    const body = text.trim();
    if (!body) return;
    if (mode === "sentback") {
      run(() => sendBackAction({ dossierId, reason: body }));
    } else {
      run(() => sendNavetteMessageAction({ dossierId, type: "question", body }));
    }
  };

  return (
    <div className="rounded-2xl border border-si-line bg-si-surface">
      {/* En-tête */}
      <div className="flex items-center gap-2 px-5 pt-4 pb-2">
        <h3 className="text-[15px] font-semibold text-si-ink">{t("title")}</h3>
        <span className="text-xs text-si-muted">· {t("subtitle")}</span>
      </div>

      {/* Fil */}
      <div className="px-5 pb-2">
        {rows.length === 0 ? (
          <p className="py-4 text-sm text-si-muted/50">{t("empty")}</p>
        ) : (
          rows.map((r) => {
            const tone = TONE[toneFor(r.type)];
            return (
              <div key={r.id} className="flex gap-3 border-t border-si-line py-3 first:border-t-0">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: tone.bg, color: tone.fg }}
                >
                  <IconFor type={r.type} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: tone.fg }}>
                      {typeLabel(r.type)}
                    </span>
                    {r.dueDate ? (
                      <span className="text-[11px] font-semibold" style={{ color: TONE.warn.fg }}>
                        {t("due")} {fmtDate(r.dueDate)}
                      </span>
                    ) : null}
                    <span className="ml-auto text-[11px] text-si-muted/50">{fmtDate(r.createdAt)}</span>
                  </div>
                  {r.body ? <div className="mt-1 text-sm text-si-ink">{r.body}</div> : null}
                  <div className="mt-0.5 text-xs text-si-muted/50">
                    {r.authorName ?? "—"}
                    {r.confidentiel ? ` · ${t("confidential")}` : ""}
                  </div>
                  {/* Marquer traité — par le destinataire, si non résolu */}
                  {r.recipientId === currentUserId && !r.resolvedAt && r.type === "sent_back" ? (
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => run(() => resolveNavetteAction(r.id, dossierId))}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-si-line bg-si-surface px-3 py-1.5 text-xs font-semibold text-si-muted"
                    >
                      {t("markAddressed")}
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Actions de rôle */}
      <div className="flex flex-wrap items-center gap-2 px-5 pt-1">
        {isLawyer ? (
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => approveMatterAction({ dossierId }))}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
              style={{ backgroundColor: "#1F3A2E" }}
            >
              <Check className="h-3.5 w-3.5" aria-hidden /> {t("approve")}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setMode(mode === "sentback" ? "message" : "sentback")}
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold"
              style={mode === "sentback" ? { backgroundColor: TONE.err.bg, color: TONE.err.fg, borderColor: TONE.err.bg } : { borderColor: "#D4D4D8", color: "#71717A" }}
            >
              <CornerUpLeft className="h-3.5 w-3.5" aria-hidden /> {t("sendBack")}
            </button>
          </>
        ) : null}
        {isAssistant ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => markReadyForReviewAction({ dossierId }))}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold"
            style={{ borderColor: "#CDE0D4", backgroundColor: "#EEF5F0", color: "#1F3A2E" }}
          >
            <Send className="h-3.5 w-3.5" aria-hidden /> {t("markReady")}
          </button>
        ) : null}
      </div>

      {/* Compose */}
      <div className="m-4 mt-3 flex items-end gap-2 rounded-xl border border-si-line bg-si-canvas p-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={1}
          placeholder={mode === "sentback" ? t("sendBackPlaceholder") : t("composePlaceholder")}
          className="min-h-[40px] flex-1 resize-none rounded-lg border-0 bg-transparent px-2 py-2 text-sm text-si-ink outline-none"
        />
        <button
          type="button"
          disabled={pending || !text.trim()}
          onClick={onSend}
          className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: mode === "sentback" ? TONE.err.fg : "#1F3A2E" }}
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" aria-hidden />}
          {mode === "sentback" ? t("sendBack") : t("send")}
        </button>
      </div>
      {error ? <p className="px-5 pb-4 text-xs" style={{ color: TONE.err.fg }}>{error}</p> : null}
    </div>
  );
}
