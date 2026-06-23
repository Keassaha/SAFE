"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, CheckCircle2, FileText, FolderOpen, RefreshCw } from "lucide-react";

interface DocketEntry {
  id: string;
  entryType: string;
  docketMode: "procedure" | "suivi" | "transaction" | "general";
  title: string;
  status: string;
  eventDate: string | null;
  sectionKey: string;
  confidence: number | null;
  needsReview: boolean;
  notes: string | null;
  source: string;
  createdAt: string;
  linkedDocument: { id: string; nom: string; mimeType: string } | null;
  linkedRichDocument: { id: string; titre: string; type: string; statut: string } | null;
}

function modeLabel(mode: string): string {
  switch (mode) {
    case "procedure":
      return "Cahier de procédure";
    case "suivi":
      return "Cahier de suivi";
    case "transaction":
      return "Cahier de transaction";
    default:
      return "Cahier du dossier";
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "classe":
      return "Classé";
    case "a_reviser":
      return "À réviser";
    default:
      return status.replace(/_/g, " ");
  }
}

function formatDate(value: string | null): string {
  if (!value) return "Date à préciser";
  return new Intl.DateTimeFormat("fr-CA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function DossierDetailProcedures({ dossierId }: { dossierId: string }) {
  const t = useTranslations("matterDetailUi");
  const [entries, setEntries] = useState<DocketEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/dossiers/${dossierId}/docket`, { cache: "no-store" });
        if (!res.ok) throw new Error("Impossible de charger le cahier.");
        const data = (await res.json()) as { entries: DocketEntry[] };
        if (!cancelled) setEntries(data.entries ?? []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur de chargement.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [dossierId]);

  const mode = entries[0]?.docketMode ?? "procedure";
  const reviewCount = useMemo(() => entries.filter((entry) => entry.needsReview).length, [entries]);

  return (
    <div className="rounded-lg border border-si-line bg-si-surface p-5">
      <div className="flex flex-col gap-3 border-b border-si-line pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-si-muted">
            {modeLabel(mode)}
          </p>
          <h3 className="mt-1 text-base font-semibold text-si-ink">
            {t("proceduresStructuredEntries")}
          </h3>
          <p className="mt-1 text-sm text-si-muted">
            {t("proceduresAutoFeed")}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-si-muted">
          {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <FolderOpen className="h-3.5 w-3.5" />}
          <span>{t("entriesCount", { count: entries.length })}</span>
          {reviewCount > 0 ? (
            <span className="rounded-lg bg-si-amber/[0.13] px-2 py-0.5 font-medium text-si-amber-ink">
              {t("reviewCount", { count: reviewCount })}
            </span>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="mt-4 rounded-lg border border-[#B84A3E]/30 bg-[#B84A3E]/10 p-3 text-sm text-[#B84A3E]">
          {error}
        </div>
      ) : null}

      {!loading && entries.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-si-line bg-si-canvas/70 p-5 text-center">
          <FileText className="mx-auto h-5 w-5 text-si-muted/60" />
          <p className="mt-2 text-sm font-medium text-si-ink">{t("proceduresEmptyTitle")}</p>
          <p className="mt-1 text-xs text-si-muted">
            {t("proceduresEmptyHint")}
          </p>
        </div>
      ) : null}

      {entries.length > 0 ? (
        <div className="mt-4 overflow-hidden rounded-lg border border-si-line">
          <div className="grid grid-cols-[minmax(0,1fr)_8rem_7rem] gap-3 border-b border-si-line bg-si-canvas px-3 py-2 text-xs font-medium uppercase tracking-wide text-si-muted">
            <span>{t("columnDocumentEvent")}</span>
            <span>{t("columnSection")}</span>
            <span>{t("columnStatus")}</span>
          </div>
          <div className="divide-y divide-[var(--safe-neutral-border)]">
            {entries.map((entry) => (
              <div key={entry.id} className="grid grid-cols-[minmax(0,1fr)_8rem_7rem] gap-3 px-3 py-3 text-sm">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {entry.needsReview ? (
                      <AlertCircle className="h-4 w-4 shrink-0 text-si-amber-ink" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                    )}
                    <p className="truncate font-medium text-si-ink">{entry.title}</p>
                  </div>
                  <p className="mt-1 text-xs text-si-muted">
                    {entry.entryType.replace(/_/g, " ")} · {formatDate(entry.eventDate)}
                    {entry.confidence != null ? ` · ${t("confidence", { value: entry.confidence })}` : ""}
                  </p>
                  {entry.notes ? (
                    <p className="mt-1 line-clamp-2 text-xs text-si-muted">{entry.notes}</p>
                  ) : null}
                </div>
                <div className="self-start rounded-lg bg-si-canvas px-2 py-1 text-xs font-medium text-si-muted">
                  {entry.sectionKey}
                </div>
                <div className="self-start rounded-lg bg-si-surface px-2 py-1 text-xs font-medium text-si-ink ring-1 ring-si-line">
                  {statusLabel(entry.status)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
