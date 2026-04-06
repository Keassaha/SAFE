"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Eye, Pencil, Clock, Archive, MoreVertical, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { routes } from "@/lib/routes";
import { archiveDossier } from "@/app/(app)/dossiers/actions";
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
  client: { id: string; raisonSociale: string; prenom: string | null; nom: string | null; typeClient: string };
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
      className="inline-flex items-center gap-1 text-xs font-medium text-neutral-muted uppercase tracking-wider hover:text-primary-700"
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
  return row.client.raisonSociale;
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
        className="p-1.5 rounded-safe-sm text-neutral-muted hover:bg-neutral-200 hover:text-neutral-text-primary transition-colors"
        aria-label={tc("actions")}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <MoreVertical className="w-5 h-5" aria-hidden />
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 py-1 bg-white border border-neutral-border rounded-safe-sm shadow-lg z-20 min-w-[160px]"
          role="menu"
        >
          <Link
            href={routes.dossier(row.id)}
            className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-neutral-text-primary hover:bg-neutral-50"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <Eye className="w-4 h-4 shrink-0" aria-hidden />
            {t("viewAction")}
          </Link>
          <Link
            href={`${routes.dossier(row.id)}?edit=1`}
            className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-neutral-text-primary hover:bg-neutral-50"
            role="menuitem"
            onClick={() => setOpen(false)}
          >
            <Pencil className="w-4 h-4 shrink-0" aria-hidden />
            {t("editAction")}
          </Link>
          <Link
            href={routes.dossier(row.id)}
            className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-neutral-text-primary hover:bg-neutral-50"
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
                className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm text-neutral-text-primary hover:bg-neutral-50"
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
      <div className="px-4 py-8 text-center text-neutral-muted text-sm">
        {t("noMattersFound")}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-neutral-border bg-neutral-surface/50">
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
            <th className="text-left py-3 px-4">{tc("client")}</th>
            <th className="text-left py-3 px-4">
              <SortHeader
                label={t("lawyer")}
                field="avocatResponsable"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                getSortUrl={getSortUrl}
              />
            </th>
            <th className="text-left py-3 px-4">{tc("type")}</th>
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
            <th className="text-right py-3 px-4">{tc("actions")}</th>
          </tr>
        </thead>
        <tbody>
          {dossiers.map((row) => (
            <tr
              key={row.id}
              className="border-b border-neutral-border hover:bg-neutral-surface/30 transition-colors duration-200"
            >
              <td className="py-3 px-4 font-medium text-neutral-text-primary">
                <Link
                  href={routes.dossier(row.id)}
                  className="text-primary-700 hover:underline"
                >
                  {row.numeroDossier ?? row.reference ?? "—"}
                </Link>
              </td>
              <td className="py-3 px-4 text-neutral-text-secondary">{row.intitule}</td>
              <td className="py-3 px-4">
                <Link
                  href={routes.client(row.clientId)}
                  className="text-primary-700 hover:underline"
                >
                  {clientDisplayName(row)}
                </Link>
              </td>
              <td className="py-3 px-4 text-neutral-text-secondary">
                {row.avocatResponsable?.nom ?? "—"}
              </td>
              <td className="py-3 px-4 text-neutral-text-secondary">
                {row.type ? TYPE_LABELS[row.type] ?? row.type : "—"}
              </td>
              <td className="py-3 px-4">
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                    row.statut === "actif" || row.statut === "ouvert"
                      ? "bg-status-success-bg text-status-success"
                      : row.statut === "cloture" || row.statut === "archive"
                        ? "bg-neutral-200 text-neutral-muted"
                        : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {STATUT_LABELS[row.statut] ?? row.statut}
                </span>
              </td>
              <td className="py-3 px-4 text-neutral-muted">{formatDate(row.dateOuverture)}</td>
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
