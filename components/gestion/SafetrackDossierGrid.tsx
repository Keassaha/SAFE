"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Search,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  ArrowRight,
} from "lucide-react";

interface DossierItem {
  id: string;
  numeroDossier: string | null;
  reference: string | null;
  intitule: string;
  type: string | null;
  clientName: string | null;
  total: number;
  done: number;
  enCours: number;
  enRetard: number;
  progressPct: number;
  href: string;
}

interface SafetrackDossierGridProps {
  dossiers: DossierItem[];
}

const ITEMS_PER_PAGE = 12;

export function SafetrackDossierGrid({ dossiers }: SafetrackDossierGridProps) {
  const t = useTranslations("gestionCompUi");
  const TYPE_LABELS: Record<string, string> = {
    droit_famille: t("dossierTypeFamily"),
    litige_civil: t("dossierTypeCivilLitigation"),
    criminel: t("dossierTypeCriminal"),
    immigration: t("dossierTypeImmigration"),
    corporate: t("dossierTypeCorporate"),
    autre: t("dossierTypeOther"),
  };
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return dossiers;
    const q = search.toLowerCase();
    return dossiers.filter(
      (d) =>
        d.intitule.toLowerCase().includes(q) ||
        d.clientName?.toLowerCase().includes(q) ||
        d.numeroDossier?.toLowerCase().includes(q) ||
        d.reference?.toLowerCase().includes(q)
    );
  }, [dossiers, search]);

  const visible = expanded ? filtered : filtered.slice(0, ITEMS_PER_PAGE);
  const hasMore = filtered.length > ITEMS_PER_PAGE;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-white/50">
          {t("dossiersCount", { count: filtered.length })}
        </h2>
        {dossiers.length > 6 && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-si-muted/50" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setExpanded(false); }}
              placeholder={t("filterPlaceholder")}
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-white/15 bg-si-surface/5 text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-[var(--safe-green-600)]/50 w-48"
            />
          </div>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visible.map((d) => (
          <Link
            key={d.id}
            href={d.href}
            className="group flex items-center gap-3 rounded-xl border border-si-line bg-si-surface p-3 shadow-sm transition-all hover:shadow-md hover:border-si-line hover:-translate-y-0.5"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-xs font-bold uppercase tracking-wider text-si-forest">
                  {d.numeroDossier ?? d.reference ?? d.id.slice(0, 8)}
                </span>
                {d.type && (
                  <span className="text-xs font-medium text-si-muted/50 uppercase">
                    {TYPE_LABELS[d.type] ?? d.type}
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-si-ink truncate leading-tight">
                {d.intitule}
              </p>
              {d.clientName && (
                <p className="text-xs text-si-muted truncate mt-0.5">
                  {d.clientName}
                </p>
              )}

              <div className="flex items-center gap-3 mt-2">
                {/* Progress bar */}
                <div className="flex-1 h-1.5 rounded-full bg-si-canvas overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${d.progressPct}%` }}
                  />
                </div>
                <span className="text-xs font-bold tabular-nums text-si-muted shrink-0">
                  {d.progressPct}%
                </span>
              </div>

              <div className="flex gap-3 mt-1.5 text-xs tabular-nums">
                <span className="text-si-muted/50">
                  {t("actsCount", { count: d.total })}
                </span>
                {d.enCours > 0 && (
                  <span className="text-si-amber-ink font-medium">{t("inProgressCount", { count: d.enCours })}</span>
                )}
                {d.enRetard > 0 && (
                  <span className="text-[#B84A3E] font-medium">{t("overdueCount", { count: d.enRetard })}</span>
                )}
              </div>
            </div>

            <ArrowRight className="w-4 h-4 text-si-muted/40 group-hover:text-si-forest transition-colors shrink-0" />
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-si-line bg-si-surface p-8 text-center">
          <FolderOpen className="w-8 h-8 text-si-muted/40 mx-auto mb-2" />
          <p className="text-sm text-si-muted">{t("noMatterFound")}</p>
        </div>
      )}

      {hasMore && !search && (
        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-white/60 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-si-surface/5"
          >
            {expanded ? (
              <>{t("showLess")} <ChevronUp className="w-3.5 h-3.5" /></>
            ) : (
              <>{t("showMore", { count: filtered.length - ITEMS_PER_PAGE })} <ChevronDown className="w-3.5 h-3.5" /></>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
