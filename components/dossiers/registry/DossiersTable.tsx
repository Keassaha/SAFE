"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Eye, Pencil, Clock, Archive, MoreVertical, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { routes } from "@/lib/routes";
import { archiveDossier } from "@/app/(app)/dossiers/actions";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { DossierSortField, DossierSortOrder } from "@/lib/dossiers/query";

export type DossierRow = {
  id: string;
  clientId: string;
  reference: string | null;
  numeroDossier: string | null;
  intitule: string;
  statut: string;
  type: string | null;
  dateOuverture: Date;
  updatedAt: Date;
  client: { id: string; raisonSociale: string | null; prenom: string | null; nom: string | null; typeClient: string };
  avocatResponsable: { nom: string } | null;
};

interface DossiersTableProps {
  dossiers: DossierRow[];
  sortBy?: DossierSortField;
  sortOrder?: DossierSortOrder;
}

function SortHeader({
  label,
  field,
  currentSortBy,
  currentSortOrder,
  getSortUrl,
}: {
  label: string;
  field: DossierSortField;
  currentSortBy: DossierSortField;
  currentSortOrder: DossierSortOrder;
  getSortUrl: (sortBy: DossierSortField, sortOrder: DossierSortOrder) => string;
}) {
  const isActive = currentSortBy === field;
  const nextOrder = isActive && currentSortOrder === "asc" ? "desc" : "asc";
  const Icon = isActive ? (currentSortOrder === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <Link
      href={getSortUrl(field, isActive ? nextOrder : "asc")}
      className="inline-flex items-center gap-1 text-xs font-medium text-si-muted uppercase tracking-wider hover:text-si-forest"
    >
      {label}
      <Icon className="w-3.5 h-3.5" />
    </Link>
  );
}

function formatDate(d: Date): string {
  return new Date(d).toLocaleDateString("fr-CA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function clientDisplayName(row: DossierRow): string {
  if (
    row.client.typeClient === "personne_physique" &&
    (row.client.prenom || row.client.nom)
  ) {
    return [row.client.nom, row.client.prenom].filter(Boolean).join(", ");
  }
  return row.client.raisonSociale ?? "";
}

function statutVariant(statut: string): "success" | "warning" | "neutral" {
  if (statut === "actif" || statut === "ouvert") return "success";
  if (statut === "cloture" || statut === "archive") return "neutral";
  return "warning";
}

function DossierActionsMenu({ row }: { row: DossierRow }) {
  const t = useTranslations("matters");
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [open]);

  return (
    <div className="relative inline-block text-left" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-lg text-si-muted hover:bg-si-canvas hover:text-si-ink transition-colors"
        aria-label={tc("actions")}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <MoreVertical className="w-5 h-5" aria-hidden />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 py-1 bg-si-surface border border-si-line rounded-lg shadow-si-card z-20 min-w-[160px]"
          role="menu"
        >
          <Link
            href={routes.dossier(row.id)}
            className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-si-ink hover:bg-si-canvas"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <Eye className="w-4 h-4 shrink-0" aria-hidden />
            {t("viewAction")}
          </Link>
          <Link
            href={`${routes.dossier(row.id)}?edit=1`}
            className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-si-ink hover:bg-si-canvas"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <Pencil className="w-4 h-4 shrink-0" aria-hidden />
            {t("editAction")}
          </Link>
          <Link
            href={routes.dossier(row.id)}
            className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-si-ink hover:bg-si-canvas"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <Clock className="w-4 h-4 shrink-0" aria-hidden />
            {t("viewMatterAction")}
          </Link>
          {row.statut !== "archive" && (
            <form action={archiveDossier.bind(null, row.id)} className="block">
              <button
                type="submit"
                className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-si-ink hover:bg-si-canvas"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                <Archive className="w-4 h-4 shrink-0" aria-hidden />
                {t("archiveAction")}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export function DossiersTable({
  dossiers,
  sortBy = "dateOuverture",
  sortOrder = "desc",
}: DossiersTableProps) {
  const t = useTranslations("matters");
  const tc = useTranslations("common");
  const searchParams = useSearchParams();

  const STATUT_LABELS: Record<string, string> = {
    ouvert: t("statusOpen"),
    actif: t("statusActive"),
    en_attente: t("statusPending"),
    cloture: t("statusClosed"),
    archive: t("statusArchived"),
  };

  const TYPE_LABELS: Record<string, string> = {
    droit_famille: t("typeFamily"),
    litige_civil: t("typeCivilLitigation"),
    criminel: t("typeCriminal"),
    immigration: t("typeImmigration"),
    corporate: t("typeCorporate"),
    autre: t("typeOther"),
  };

  function getSortUrl(sortByField: DossierSortField, order: DossierSortOrder) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("sortBy", sortByField);
    next.set("sortOrder", order);
    next.delete("page");
    return `/dossiers?${next.toString()}`;
  }

  if (dossiers.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-si-muted text-sm">
        {t("noMattersFound")}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-si-line bg-si-canvas/60">
            <th className="text-left py-3 px-4">
              <SortHeader
                label={t("matterNumberHeader")}
                field="reference"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                getSortUrl={getSortUrl}
              />
            </th>
            <th className="text-left py-3 px-4">
              <SortHeader
                label={t("matterTitleHeader")}
                field="intitule"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                getSortUrl={getSortUrl}
              />
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-si-muted uppercase tracking-wider">{tc("client")}</th>
            <th className="text-left py-3 px-4">
              <SortHeader
                label={t("lawyer")}
                field="avocatResponsable"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                getSortUrl={getSortUrl}
              />
            </th>
            <th className="text-left py-3 px-4 text-xs font-medium text-si-muted uppercase tracking-wider">{tc("type")}</th>
            <th className="text-left py-3 px-4">
              <SortHeader
                label={tc("status")}
                field="statut"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                getSortUrl={getSortUrl}
              />
            </th>
            <th className="text-left py-3 px-4">
              <SortHeader
                label={t("openingDateHeader")}
                field="dateOuverture"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                getSortUrl={getSortUrl}
              />
            </th>
            <th className="text-right py-3 px-4 text-xs font-medium text-si-muted uppercase tracking-wider">{tc("actions")}</th>
          </tr>
        </thead>
        <tbody>
          {dossiers.map((row) => (
            <tr
              key={row.id}
              className="border-b border-si-line hover:bg-si-canvas transition-colors duration-200"
            >
              <td className="py-3 px-4">
                <Link
                  href={routes.dossier(row.id)}
                  className="font-mono text-si-forest hover:underline"
                >
                  {row.numeroDossier ?? row.reference ?? "—"}
                </Link>
              </td>
              <td className="py-3 px-4 text-si-ink">{row.intitule}</td>
              <td className="py-3 px-4">
                <Link
                  href={routes.client(row.clientId)}
                  className="text-si-forest hover:underline"
                >
                  {clientDisplayName(row)}
                </Link>
              </td>
              <td className="py-3 px-4 text-si-muted">
                {row.avocatResponsable?.nom ?? "—"}
              </td>
              <td className="py-3 px-4 text-si-muted">
                {row.type ? TYPE_LABELS[row.type] ?? row.type : "—"}
              </td>
              <td className="py-3 px-4">
                <StatusBadge
                  label={STATUT_LABELS[row.statut] ?? row.statut}
                  variant={statutVariant(row.statut)}
                />
              </td>
              <td className="py-3 px-4 text-si-muted">{formatDate(row.dateOuverture)}</td>
              <td className="py-3 px-4 text-right">
                <div className="flex items-center justify-end">
                  <DossierActionsMenu row={row} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
