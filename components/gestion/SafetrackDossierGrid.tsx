"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
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

const TYPE_LABELS: Record<string, string> = {
  droit_famille: "Famille",
  litige_civil: "Litige civil",
  criminel: "Criminel",
  immigration: "Immigration",
  corporate: "Corporate",
  autre: "Autre",
};

const ITEMS_PER_PAGE = 12;

export function SafetrackDossierGrid({ dossiers }: SafetrackDossierGridProps) {
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
          Dossiers ({filtered.length})
        </h2>
        {dossiers.length > 6 && (
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setExpanded(false); }}
              placeholder="Filtrer…"
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-white/15 bg-white/5 text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-[var(--safe-gold-400)]/50 w-48"
            />
          </div>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visible.map((d) => (
          <Link
            key={d.id}
            href={d.href}
            className="group flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 shadow-sm transition-all hover:shadow-md hover:border-primary-300 hover:-translate-y-0.5"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600">
                  {d.numeroDossier ?? d.reference ?? d.id.slice(0, 8)}
                </span>
                {d.type && (
                  <span className="text-[9px] font-medium text-neutral-400 uppercase">
                    {TYPE_LABELS[d.type] ?? d.type}
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-neutral-900 truncate leading-tight">
                {d.intitule}
              </p>
              {d.clientName && (
                <p className="text-xs text-neutral-500 truncate mt-0.5">
                  {d.clientName}
                </p>
              )}

              <div className="flex items-center gap-3 mt-2">
                {/* Progress bar */}
                <div className="flex-1 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${d.progressPct}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold tabular-nums text-neutral-500 shrink-0">
                  {d.progressPct}%
                </span>
              </div>

              <div className="flex gap-3 mt-1.5 text-[10px] tabular-nums">
                <span className="text-neutral-400">
                  {d.total} acte{d.total !== 1 ? "s" : ""}
                </span>
                {d.enCours > 0 && (
                  <span className="text-amber-600 font-medium">{d.enCours} en cours</span>
                )}
                {d.enRetard > 0 && (
                  <span className="text-red-600 font-medium">{d.enRetard} en retard</span>
                )}
              </div>
            </div>

            <ArrowRight className="w-4 h-4 text-neutral-300 group-hover:text-primary-500 transition-colors shrink-0" />
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center">
          <FolderOpen className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
          <p className="text-sm text-neutral-500">Aucun dossier trouvé</p>
        </div>
      )}

      {hasMore && !search && (
        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-white/60 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/5"
          >
            {expanded ? (
              <>Voir moins <ChevronUp className="w-3.5 h-3.5" /></>
            ) : (
              <>Voir les {filtered.length - ITEMS_PER_PAGE} autres <ChevronDown className="w-3.5 h-3.5" /></>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
