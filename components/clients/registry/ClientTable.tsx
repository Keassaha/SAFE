"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Eye, Pencil, Archive, FolderOpen, FolderX, Check, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { routes } from "@/lib/routes";
import { archiveClient, archiveClientsBulk } from "@/app/(app)/clients/actions";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { ClientStatus } from "@prisma/client";
import type { ClientSortField, ClientSortOrder } from "@/lib/clients/query";

export type ClientRow = {
  id: string;
  typeClient: "personne_physique" | "personne_morale";
  status: ClientStatus;
  raisonSociale: string;
  prenom: string | null;
  nom: string | null;
  email: string | null;
  telephone: string | null;
  langue: string | null;
  trustAccountBalance: number;
  assignedLawyerNom: string | null;
  dossiersActifsCount: number;
  lastActivityAt: Date | null;
};

interface ClientTableProps {
  clients: ClientRow[];
  canEdit: boolean;
  canArchive: boolean;
  sortBy?: ClientSortField;
  sortOrder?: ClientSortOrder;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
  }).format(value);
}

function displayName(row: ClientRow): string {
  if (row.typeClient === "personne_physique" && (row.prenom || row.nom)) {
    return [row.nom, row.prenom].filter(Boolean).join(", ");
  }
  return row.raisonSociale;
}

function initials(row: ClientRow): string {
  if (row.typeClient === "personne_physique" && (row.prenom || row.nom)) {
    const p = (row.prenom ?? "").charAt(0);
    const n = (row.nom ?? "").charAt(0);
    return (n + p).toUpperCase() || row.raisonSociale.slice(0, 2).toUpperCase();
  }
  return row.raisonSociale.slice(0, 2).toUpperCase();
}

function SortHeader({
  label,
  field,
  currentSortBy,
  currentSortOrder,
  getSortUrl,
}: {
  label: string;
  field: ClientSortField;
  currentSortBy: ClientSortField;
  currentSortOrder: ClientSortOrder;
  getSortUrl: (sortBy: ClientSortField, sortOrder: ClientSortOrder) => string;
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

export function ClientTable({
  clients,
  canEdit,
  canArchive,
  sortBy = "raisonSociale",
  sortOrder = "asc",
}: ClientTableProps) {
  const searchParams = useSearchParams();
  const t = useTranslations("clients");
  const tc = useTranslations("common");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isArchiving, setIsArchiving] = useState(false);

  function getSortUrl(sortByField: ClientSortField, order: ClientSortOrder) {
    const next = new URLSearchParams(searchParams.toString());
    next.set("sortBy", sortByField);
    next.set("sortOrder", order);
    next.delete("page");
    return `/clients?${next.toString()}`;
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === clients.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(clients.map((r) => r.id)));
    }
  }

  async function handleBulkArchive() {
    if (selectedIds.size === 0) return;
    setIsArchiving(true);
    try {
      await archiveClientsBulk(Array.from(selectedIds));
    } finally {
      setIsArchiving(false);
    }
  }

  if (clients.length === 0) {
    return (
      <p className="px-6 py-8 text-center text-sm text-neutral-muted">
        {t("noMatchCriteria")}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      {canArchive && selectedIds.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 bg-primary-50 border-b border-primary-100">
          <span className="text-sm font-medium text-primary-800">
            {t("selectedCount", { count: selectedIds.size })}
          </span>
          <Button
            type="button"
            variant="secondary"
            className="!py-1.5 !px-3 text-sm"
            onClick={handleBulkArchive}
            disabled={isArchiving}
          >
            {isArchiving ? t("archiving") : t("archiveSelection")}
          </Button>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="text-sm text-neutral-muted hover:text-primary-700"
          >
            {tc("cancel")}
          </button>
        </div>
      )}
      <table className="min-w-full">
        <thead>
          <tr className="border-b border-neutral-border bg-neutral-surface/50">
            {canArchive && (
              <th className="px-4 py-3 w-10">
                <input
                  type="checkbox"
                  checked={selectedIds.size === clients.length && clients.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-neutral-border text-primary-600 focus:ring-primary-500"
                  aria-label={t("selectAll")}
                />
              </th>
            )}
            <th className="px-4 py-3 text-left">
              <SortHeader
                label={tc("name")}
                field="raisonSociale"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                getSortUrl={getSortUrl}
              />
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-muted uppercase tracking-wider">
              {t("contactInfo")}
            </th>
            <th className="px-4 py-3 text-left">
              <SortHeader
                label={t("assignedLawyer")}
                field="assignedLawyer"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                getSortUrl={getSortUrl}
              />
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-muted uppercase tracking-wider">
              {t("language")}
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-muted uppercase tracking-wider">
              {t("activeMatters")}
            </th>
            <th className="px-4 py-3 text-left">
              <SortHeader
                label={t("unbilled")}
                field="trustAccountBalance"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                getSortUrl={getSortUrl}
              />
            </th>
            <th className="px-4 py-3 text-left">
              <SortHeader
                label={tc("status")}
                field="status"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                getSortUrl={getSortUrl}
              />
            </th>
            <th className="px-4 py-3 text-left">
              <SortHeader
                label={t("lastActivity")}
                field="updatedAt"
                currentSortBy={sortBy}
                currentSortOrder={sortOrder}
                getSortUrl={getSortUrl}
              />
            </th>
            <th className="px-4 py-3 text-right text-xs font-medium text-neutral-muted uppercase tracking-wider w-16">
              {tc("actions")}
            </th>
          </tr>
        </thead>
        <tbody>
          {clients.map((row) => (
            <tr
              key={row.id}
              className="border-b border-neutral-border/80 transition-colors duration-200 hover:bg-primary-50/40"
            >
              {canArchive && (
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(row.id)}
                    onChange={() => toggleSelect(row.id)}
                    className="rounded border-neutral-border text-primary-600 focus:ring-primary-500"
                    aria-label={t("selectClient", { name: row.raisonSociale })}
                  />
                </td>
              )}
              <td className="px-4 py-3">
                <Link
                  href={routes.client(row.id)}
                  className="flex items-center gap-3 group"
                >
                  <span className="flex-shrink-0 w-9 h-9 rounded-full bg-neutral-200 border-2 border-neutral-300 flex items-center justify-center text-sm font-medium text-neutral-700">
                    {initials(row)}
                  </span>
                  <span className="text-sm font-medium text-neutral-text-primary group-hover:text-primary-700">
                    {displayName(row)}
                  </span>
                </Link>
              </td>
              <td className="px-4 py-3 text-sm text-neutral-text-secondary">
                <div className="flex flex-col">
                  {row.email && (
                    <a
                      href={`mailto:${row.email}`}
                      className="text-primary-700 hover:underline"
                    >
                      {row.email}
                    </a>
                  )}
                  {row.telephone && (
                    <span className="text-neutral-muted">{row.telephone}</span>
                  )}
                  {!row.email && !row.telephone && "—"}
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-neutral-text-secondary">
                {row.assignedLawyerNom ?? "—"}
              </td>
              <td className="px-4 py-3 text-sm text-neutral-text-secondary">
                {row.langue ?? "—"}
              </td>
              <td className="px-4 py-3 text-sm text-neutral-text-secondary">
                {row.dossiersActifsCount === 0
                  ? t("noCases")
                  : row.dossiersActifsCount}
              </td>
              <td className="px-4 py-3 text-sm">
                <span className="text-neutral-text-primary">
                  {formatCurrency(row.trustAccountBalance)}
                </span>
                {row.trustAccountBalance > 0 && (
                  <span className="block text-xs text-status-success">{t("billable")}</span>
                )}
              </td>
              <td className="px-4 py-3">
                <StatusBadge
                  label={
                    row.status === "actif"
                      ? t("statusActive")
                      : row.status === "inactif"
                        ? t("statusInactive")
                        : t("statusArchived")
                  }
                  variant={
                    row.status === "actif"
                      ? "success"
                      : row.status === "inactif"
                        ? "warning"
                        : "neutral"
                  }
                />
              </td>
              <td className="px-4 py-3 text-sm text-neutral-muted">
                {row.lastActivityAt
                  ? new Intl.DateTimeFormat("fr-CA", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }).format(row.lastActivityAt)
                  : "—"}
              </td>
              <td className="px-4 py-3 text-right">
                <ClientRowActions
                  clientId={row.id}
                  canEdit={canEdit}
                  canArchive={canArchive}
                  hasCases={row.dossiersActifsCount > 0}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ClientRowActions({
  clientId,
  canEdit,
  canArchive,
  hasCases,
}: {
  clientId: string;
  canEdit: boolean;
  canArchive: boolean;
  hasCases: boolean;
}) {
  const t = useTranslations("clients");
  const tc = useTranslations("common");

  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        href={routes.client(clientId)}
        className="inline-flex p-2 rounded-lg text-neutral-muted hover:bg-primary-50 hover:text-primary-700 transition-colors"
        title={tc("view")}
      >
        <Eye className="w-4 h-4" />
      </Link>
      {canEdit ? (
        <Link
          href={`${routes.client(clientId)}?edit=1`}
          className="inline-flex p-2 rounded-lg text-neutral-muted hover:bg-primary-50 hover:text-primary-700 transition-colors"
          title={tc("edit")}
        >
          <Pencil className="w-4 h-4" />
        </Link>
      ) : (
        <span className="inline-flex w-9 h-9 shrink-0" aria-hidden />
      )}
      {hasCases ? (
        <Link
          href={routes.dossiers + `?clientId=${clientId}`}
          className="inline-flex p-2 rounded-lg text-green-600 hover:bg-primary-50 hover:text-green-700 transition-colors relative items-center justify-center"
          title={t("openMatters")}
        >
          <FolderOpen className="w-4 h-4" />
          <span className="absolute inset-0 flex items-center justify-center pointer-events-none mt-0.5" aria-hidden>
            <Check className="w-2.5 h-2.5 text-green-600" strokeWidth={3} />
          </span>
        </Link>
      ) : (
        <span
          className="inline-flex p-2 rounded-lg text-red-500/80"
          title={t("noOpenMatters")}
          aria-hidden
        >
          <FolderX className="w-4 h-4" />
        </span>
      )}
      {canArchive ? (
        <form action={archiveClient.bind(null, clientId)} className="inline">
          <button
            type="submit"
            className="inline-flex p-2 rounded-lg text-neutral-muted hover:bg-status-warning-bg hover:text-status-warning transition-colors"
            title={t("archive")}
          >
            <Archive className="w-4 h-4" />
          </button>
        </form>
      ) : (
        <span className="inline-flex w-9 h-9 shrink-0" aria-hidden />
      )}
    </div>
  );
}
