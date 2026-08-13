"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Eye, Pencil, Clock, Archive } from "lucide-react";
import { routes } from "@/lib/routes";
import { archiveDossier } from "@/app/(app)/dossiers/actions";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RowMenu, rowMenuItemClass } from "@/components/ui/RowMenu";
import {
  RegistreAucunResultat,
  RegistrePlainHeader,
  RegistreSortHeader,
  registreCaseClass,
  registreCellMutedClass,
  registreHeadCellClass,
  registreHeadRowClass,
  registreLienClass,
  registreRowClass,
  rangeeOuvrable,
} from "@/components/ui/registre";
import { DossierBulkActionBar } from "@/components/dossiers/registry/DossierBulkActionBar";
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
  /** Liste des avocats du cabinet (pour l'assignation en lot). */
  avocats?: { id: string; nom: string }[];
  /** Autorise les actions en lot (admin_cabinet / assistante). */
  canManage?: boolean;
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

/**
 * Menu d'actions d'une rangée de dossier.
 *
 * Reprend `RowMenu`, partagé avec le registre clients : rendu dans un portail,
 * donc jamais rogné par le `overflow-x-auto` du tableau sur les dernières
 * lignes — ce que faisait le menu maison qu'il remplace.
 */
function DossierRowMenu({ row }: { row: DossierRow }) {
  const t = useTranslations("matters");
  const tc = useTranslations("common");

  return (
    <RowMenu label={tc("actions")} describedBy={row.intitule}>
      <Link href={routes.dossier(row.id)} role="menuitem" className={rowMenuItemClass}>
        <Eye className="h-4 w-4 shrink-0 text-si-muted" aria-hidden />
        {t("viewAction")}
      </Link>
      <Link
        href={`${routes.dossier(row.id)}?edit=1`}
        role="menuitem"
        className={rowMenuItemClass}
      >
        <Pencil className="h-4 w-4 shrink-0 text-si-muted" aria-hidden />
        {t("editAction")}
      </Link>
      <Link href={routes.dossier(row.id)} role="menuitem" className={rowMenuItemClass}>
        <Clock className="h-4 w-4 shrink-0 text-si-muted" aria-hidden />
        {t("viewMatterAction")}
      </Link>
      {row.statut !== "archive" && (
        <>
          <div className="my-1 border-t border-si-line2" role="separator" />
          <form action={archiveDossier.bind(null, row.id)}>
            <button type="submit" role="menuitem" className={rowMenuItemClass}>
              <Archive className="h-4 w-4 shrink-0 text-si-muted" aria-hidden />
              {t("archiveAction")}
            </button>
          </form>
        </>
      )}
    </RowMenu>
  );
}

export function DossiersTable({
  dossiers,
  sortBy = "dateOuverture",
  sortOrder = "desc",
  avocats = [],
  canManage = false,
}: DossiersTableProps) {
  const t = useTranslations("matters");
  const tc = useTranslations("common");
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const pageIds = dossiers.map((d) => d.id);
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelectedIds((prev) => {
      if (pageIds.every((id) => prev.has(id))) {
        const next = new Set(prev);
        pageIds.forEach((id) => next.delete(id));
        return next;
      }
      return new Set([...prev, ...pageIds]);
    });
  }

  const selectable = canManage;

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
    return <RegistreAucunResultat message={t("noMattersFound")} />;
  }

  const selectedIdList = pageIds.filter((id) => selectedIds.has(id));

  return (
    <>
      {selectable && selectedIdList.length > 0 && (
        <DossierBulkActionBar
          selectedIds={selectedIdList}
          avocats={avocats}
          onClear={() => setSelectedIds(new Set())}
        />
      )}

      {/* ── Vue mobile : la rangée devient une fiche empilée ── */}
      <div className="divide-y divide-si-line2 md:hidden">
        {dossiers.map((row) => (
          <Link
            key={row.id}
            href={routes.dossier(row.id)}
            className="safe-zoom-rang block px-4 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-medium leading-5 text-si-ink">
                  {row.intitule}
                </span>
                <span className="mt-0.5 flex min-w-0 items-center gap-1.5 truncate text-[12px] leading-[17px] text-si-muted">
                  <span className="shrink-0 font-mono">
                    {row.numeroDossier ?? row.reference ?? "—"}
                  </span>
                  <span className="text-si-subtle" aria-hidden>
                    ·
                  </span>
                  <span className="truncate">{clientDisplayName(row)}</span>
                </span>
              </span>
              <StatusBadge
                label={STATUT_LABELS[row.statut] ?? row.statut}
                variant={statutVariant(row.statut)}
              />
            </div>
            <div className="mt-2 flex items-baseline gap-4 text-[12px] text-si-muted">
              <span>{row.avocatResponsable?.nom ?? "—"}</span>
              <span className="ml-auto">{formatDate(row.dateOuverture)}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Vue bureau : registre ──
          Même grammaire que le registre clients : filets horizontaux seuls,
          en-têtes de 12 px, et le zoom souple comme unique marque de survol. */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr className={registreHeadRowClass}>
              {selectable && (
                <th scope="col" className="w-10 px-4 py-2.5">
                  <input
                    type="checkbox"
                    aria-label={t("bulkSelectAll")}
                    checked={allSelected}
                    onChange={toggleAll}
                    className={registreCaseClass}
                  />
                </th>
              )}
              <th scope="col" className={`w-[128px] ${registreHeadCellClass}`}>
                <RegistreSortHeader
                  label={t("matterNumberHeader")}
                  field="reference"
                  currentSortBy={sortBy}
                  currentSortOrder={sortOrder}
                  getSortUrl={getSortUrl}
                />
              </th>
              <th scope="col" className={registreHeadCellClass}>
                <RegistreSortHeader
                  label={t("matterTitleHeader")}
                  field="intitule"
                  currentSortBy={sortBy}
                  currentSortOrder={sortOrder}
                  getSortUrl={getSortUrl}
                />
              </th>
              <th scope="col" className={registreHeadCellClass}>
                <RegistrePlainHeader label={tc("client")} />
              </th>
              <th scope="col" className={`w-[150px] ${registreHeadCellClass}`}>
                <RegistreSortHeader
                  label={t("lawyer")}
                  field="avocatResponsable"
                  currentSortBy={sortBy}
                  currentSortOrder={sortOrder}
                  getSortUrl={getSortUrl}
                />
              </th>
              <th scope="col" className={`w-[128px] ${registreHeadCellClass}`}>
                <RegistrePlainHeader label={tc("type")} />
              </th>
              <th scope="col" className={`w-[104px] ${registreHeadCellClass}`}>
                <RegistreSortHeader
                  label={tc("status")}
                  field="statut"
                  currentSortBy={sortBy}
                  currentSortOrder={sortOrder}
                  getSortUrl={getSortUrl}
                />
              </th>
              <th scope="col" className={`w-[128px] ${registreHeadCellClass} text-right`}>
                <RegistreSortHeader
                  label={t("openingDateHeader")}
                  field="dateOuverture"
                  currentSortBy={sortBy}
                  currentSortOrder={sortOrder}
                  getSortUrl={getSortUrl}
                  align="right"
                />
              </th>
              {/* Colonne de contrôle : jamais de libellé */}
              <th scope="col" className="w-[48px] px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {dossiers.map((row) => (
              <tr
                key={row.id}
                data-selectionne={selectedIds.has(row.id) ? "true" : undefined}
                className={`${registreRowClass} cursor-pointer`}
                onClick={rangeeOuvrable(() => router.push(routes.dossier(row.id)))}
              >
                {selectable && (
                  <td className="w-10 px-4 py-2.5 align-middle">
                    <input
                      type="checkbox"
                      aria-label={t("bulkSelectRow")}
                      checked={selectedIds.has(row.id)}
                      onChange={() => toggleOne(row.id)}
                      className={registreCaseClass}
                    />
                  </td>
                )}
                <td className="px-3 py-2.5 align-middle">
                  <Link
                    href={routes.dossier(row.id)}
                    className="font-mono text-[13px] text-si-body transition-colors hover:text-si-forest"
                  >
                    {row.numeroDossier ?? row.reference ?? "—"}
                  </Link>
                </td>
                <td className="max-w-0 px-3 py-2.5 align-middle">
                  <Link
                    href={routes.dossier(row.id)}
                    className={registreLienClass}
                    title={row.intitule}
                  >
                    {row.intitule}
                  </Link>
                </td>
                <td className="max-w-0 px-3 py-2.5 align-middle">
                  <Link
                    href={routes.client(row.clientId)}
                    className="block truncate text-[13px] text-si-body transition-colors hover:text-si-forest"
                    title={clientDisplayName(row)}
                  >
                    {clientDisplayName(row)}
                  </Link>
                </td>
                <td className={registreCellMutedClass}>
                  {row.avocatResponsable?.nom ?? "—"}
                </td>
                <td className={registreCellMutedClass}>
                  {row.type ? TYPE_LABELS[row.type] ?? row.type : "—"}
                </td>
                <td className="px-3 py-2.5 align-middle">
                  <StatusBadge
                    label={STATUT_LABELS[row.statut] ?? row.statut}
                    variant={statutVariant(row.statut)}
                  />
                </td>
                <td className="px-3 py-2.5 text-right align-middle text-[12px] text-si-muted">
                  {formatDate(row.dateOuverture)}
                </td>
                <td className="px-3 py-2.5 text-right align-middle">
                  <DossierRowMenu row={row} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
