"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Send, HelpCircle, Check, CornerUpLeft, Loader2, ArrowRight, FileText, Receipt, AlertTriangle } from "lucide-react";
import { approveMatterAction, sendBackAction } from "@/app/(app)/navette/actions";
import type { NavetteMessageType } from "@prisma/client";

export interface GlanceRow {
  id: string;
  dossierId: string;
  type: NavetteMessageType;
  body: string | null;
  matterLabel: string;
  authorName: string | null;
}

// Rouge destructif — hors palette si (forêt/albâtre), conservé pour l'action « Renvoyer ».
const DANGER = "#8A3A2D";

const LABEL_KEY: Record<string, string> = {
  ready_for_review: "typeReadyForReview",
  question: "typeQuestion",
  document_ready: "typeDocumentReady",
  invoice_ready: "typeInvoiceReady",
  acte_urgent: "typeActeUrgent",
};

function GlanceIcon({ type }: { type: NavetteMessageType }) {
  const cls = "h-4 w-4";
  switch (type) {
    case "question": return <HelpCircle className={cls} aria-hidden />;
    case "document_ready": return <FileText className={cls} aria-hidden />;
    case "invoice_ready": return <Receipt className={cls} aria-hidden />;
    case "acte_urgent": return <AlertTriangle className={cls} aria-hidden />;
    case "ready_for_review": return <Send className={cls} aria-hidden />;
    default: return <Send className={cls} aria-hidden />;
  }
}

/**
 * Vue avocate « 15 secondes » : ce qui l'attend (prêt pour revue + questions),
 * avec Approuver / Renvoyer en 1 clic. Sert l'aversion au risque + le manque de temps.
 * Design system safe-interface (tokens si-*), aligné sur le tableau de bord.
 */
export function LawyerGlance({ rows }: { rows: GlanceRow[] }) {
  const t = useTranslations("navetteUi");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [sendBackId, setSendBackId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (rows.length === 0) return null;

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) setError(res.error ?? t("genericError"));
      else {
        setSendBackId(null);
        setReason("");
        router.refresh();
      }
    });
  }

  return (
    <div className="rounded-2xl border border-si-line bg-si-surface p-5">
      <div className="flex items-center gap-2">
        <h2 className="font-serif text-[17px] leading-tight text-si-ink">{t("title")}</h2>
        <span className="text-xs text-si-muted">· {t("glanceTitle")}</span>
        <span className="ml-auto rounded-full bg-si-forest/[0.08] px-2.5 py-0.5 font-mono text-xs text-si-forest">
          {rows.length}
        </span>
      </div>

      <div className="mt-2">
        {rows.map((r) => {
          const isReady = r.type === "ready_for_review";
          const chipClass = r.type === "question"
            ? "bg-si-amber/[0.13] text-si-amber"
            : "bg-si-forest/[0.06] text-si-forest";
          return (
            <div key={r.id} className="border-t border-si-line2 py-3 first:border-t-0">
              <div className="flex items-start gap-3">
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${chipClass}`}>
                  <GlanceIcon type={r.type} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wide text-si-muted">
                      {t(LABEL_KEY[r.type] ?? "typeInfo")}
                    </span>
                    <span className="rounded-md border border-si-line bg-si-canvas px-2 py-0.5 text-xs font-semibold text-si-muted">{r.matterLabel}</span>
                  </div>
                  {r.body ? <div className="mt-1 text-sm text-si-ink">{r.body}</div> : null}
                  <div className="mt-0.5 text-xs text-si-muted">{r.authorName ?? "—"}</div>

                  {/* Actions */}
                  {isReady ? (
                    sendBackId === r.id ? (
                      <div className="mt-2 flex items-end gap-2">
                        <input
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder={t("sendBackPlaceholder")}
                          className="flex-1 rounded-lg border border-si-line bg-si-canvas px-3 py-2 text-sm text-si-ink outline-none focus:border-si-verified focus:ring-2 focus:ring-si-verified/25"
                        />
                        <button
                          type="button"
                          disabled={pending || !reason.trim()}
                          onClick={() => run(() => sendBackAction({ dossierId: r.dossierId, reason: reason.trim() }))}
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
                          style={{ backgroundColor: DANGER }}
                        >
                          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CornerUpLeft className="h-3.5 w-3.5" />} {t("sendBack")}
                        </button>
                        <button type="button" onClick={() => setSendBackId(null)} className="rounded-lg border border-si-line px-3 py-2 text-xs font-semibold text-si-muted hover:bg-si-canvas">
                          {t("cancel")}
                        </button>
                      </div>
                    ) : (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => run(() => approveMatterAction({ dossierId: r.dossierId }))}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-si-forest px-3 py-1.5 text-xs font-bold text-si-surface hover:bg-si-forest-soft disabled:opacity-50"
                        >
                          <Check className="h-3.5 w-3.5" aria-hidden /> {t("approve")}
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => { setSendBackId(r.id); setReason(""); }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-si-line px-3 py-1.5 text-xs font-semibold text-si-muted hover:bg-si-canvas"
                        >
                          <CornerUpLeft className="h-3.5 w-3.5" aria-hidden /> {t("sendBack")}
                        </button>
                        <Link href={`/dossiers/${r.dossierId}`} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-si-forest hover:bg-si-canvas">
                          {t("open")} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                        </Link>
                      </div>
                    )
                  ) : (
                    <Link href={`/dossiers/${r.dossierId}`} className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-si-forest hover:bg-si-canvas">
                      {t("open")} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {error ? <p className="mt-2 text-xs" style={{ color: DANGER }}>{error}</p> : null}
    </div>
  );
}
