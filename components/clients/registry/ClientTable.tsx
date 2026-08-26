"use client";
import { useFormatteurs } from "@/lib/i18n/formatteurs";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Archive, FolderOpen, Pencil, Eye } from "lucide-react";
import { routes } from "@/lib/routes";
import { archiveClient, archiveClientsBulk } from "@/app/(app)/clients/actions";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RowMenu, rowMenuItemClass } from "@/components/ui/RowMenu";
import {
  RegistreAucunResultat,
  RegistrePlainHeader,
  RegistreSortHeader,
  registreCaseClass,
  registreHeadCellClass,
  registreHeadRowClass,
  registreRowClass,
  rangeeOuvrable,
} from "@/components/ui/registre";
import { toIntlLocale } from "@/lib/i18n/locale";
import type { ClientStatus } from "@prisma/client";
import type { ClientSortField, ClientSortOrder } from "@/lib/clients/query";

export type ClientRow = {
  id: string;
  typeClient: "personne_physique" | "personne_morale";
  status: ClientStatus;
  raisonSociale: string | null;
  prenom: string | null;
  nom: string | null;
  email: string | null;
  telephone: string | null;
  langue: string | null;
  trustAccountBalance: number;
  /** Honoraires accumulés (facturés + travail non facturé) pour le client. */
  honorairesAccumules: number;
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

function displayName(row: ClientRow): string {
  if (row.typeClient === "personne_physique" && (row.prenom || row.nom)) {
    return [row.nom, row.prenom].filter(Boolean).join(", ");
  }
  return row.raisonSociale ?? "";
}

/**
 * Temps relatif court dans la liste, date complète au survol (A13).
 * Les paliers sont grossiers (heure, jour, mois) : serveur et client tombent
 * donc sur la même valeur en pratique, et `suppressHydrationWarning` couvre
 * le cas limite d'un rendu à cheval sur un palier.
 */
function relativeTime(date: Date, intlLocale: string): string {
  const rtf = new Intl.RelativeTimeFormat(intlLocale, { numeric: "auto", style: "short" });
  const ecart = date.getTime() - Date.now();
  const abs = Math.abs(ecart);
  const MINUTE = 60_000;
  const HEURE = 3_600_000;
  const JOUR = 86_400_000;
  if (abs < HEURE) return rtf.format(Math.round(ecart / MINUTE), "minute");
  if (abs < JOUR) return rtf.format(Math.round(ecart / HEURE), "hour");
  if (abs < 30 * JOUR) return rtf.format(Math.round(ecart / JOUR), "day");
  if (abs < 365 * JOUR) return rtf.format(Math.round(ecart / (30 * JOUR)), "month");
  return rtf.format(Math.round(ecart / (365 * JOUR)), "year");
}

export function ClientTable({
  clients,
  canEdit,
  canArchive,
  sortBy = "raisonSociale",
  sortOrder = "asc",
}: ClientTableProps) {
  const searchParams = useSearchParams();
  const { formatCurrency } = useFormatteurs();
  const router = useRouter();
  const t = useTranslations("clients");
  const tc = useTranslations("common");
  const locale = useLocale();
  const intlLocale = toIntlLocale(locale);
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
    return <RegistreAucunResultat message={t("noMatchCriteria")} />;
  }

  function statusLabel(status: ClientStatus) {
    return status === "actif"
      ? t("statusActive")
      : status === "inactif"
        ? t("statusInactive")
        : t("statusArchived");
  }

  /**
   * « Inactif » n'est pas un avertissement : c'est un état passif. L'ambre est
   * réservé à ce qui appelle un geste (C3). Actif, inactif et archivé se
   * distinguent par leur libellé, jamais par la seule couleur.
   */
  function statusVariant(status: ClientStatus) {
    return status === "actif" ? "success" : "neutral";
  }

  /**
   * Deuxième ligne : responsable, courriel, sans jamais passer à la ligne (E1).
   * `avecLien` reste faux en vue mobile, où la carte entière est déjà un lien :
   * un <a> dans un <a> est du HTML invalide et casse l'hydratation.
   */
  function metaLine(row: ClientRow, avecLien: boolean) {
    const morceaux: React.ReactNode[] = [];
    if (row.assignedLawyerNom) {
      // Le responsable ne se tronque pas : c'est le courriel qui cède la place.
      morceaux.push(
        <span key="av" className="shrink-0">
          {row.assignedLawyerNom}
        </span>,
      );
    }
    if (row.email) {
      morceaux.push(
        avecLien ? (
          <a
            key="ml"
            href={`mailto:${row.email}`}
            className="truncate underline-offset-2 hover:text-si-ink hover:underline"
          >
            {row.email}
          </a>
        ) : (
          <span key="ml" className="truncate">
            {row.email}
          </span>
        ),
      );
    } else if (row.telephone) {
      morceaux.push(<span key="tel">{row.telephone}</span>);
    }
    if (morceaux.length === 0) return null;
    return (
      <span className="mt-0.5 flex min-w-0 items-center gap-1.5 truncate text-[12px] leading-[17px] text-si-muted">
        {morceaux.map((m, i) => (
          <span key={i} className="flex min-w-0 items-center gap-1.5 truncate">
            {i > 0 && (
              <span className="text-si-subtle" aria-hidden>
                ·
              </span>
            )}
            {m}
          </span>
        ))}
      </span>
    );
  }

  return (
    <>
      {canArchive && selectedIds.size > 0 && (
        <div className="flex items-center gap-3 border-b border-si-line bg-si-surface2 px-4 py-2">
          <span className="text-sm font-medium text-si-ink">
            {t("selectedCount", { count: selectedIds.size })}
          </span>
          <Button
            type="button"
            variant="secondary"
            className="!px-3 !py-1.5 text-sm"
            onClick={handleBulkArchive}
            disabled={isArchiving}
          >
            {isArchiving ? t("archiving") : t("archiveSelection")}
          </Button>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            className="text-sm text-si-muted transition-colors hover:text-si-ink"
          >
            {tc("cancel")}
          </button>
        </div>
      )}

      {/* ── Vue mobile : la ligne devient une fiche empilée (MB3) ── */}
      <div className="divide-y divide-si-line2 md:hidden">
        {clients.map((row) => (
          <Link
            key={row.id}
            href={routes.client(row.id)}
            className="safe-zoom-rang block px-4 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-medium leading-5 text-si-ink">
                  {displayName(row)}
                </span>
                {metaLine(row, false)}
              </span>
              <StatusBadge label={statusLabel(row.status)} variant={statusVariant(row.status)} />
            </div>
            <div className="mt-2 flex items-baseline gap-4 text-[12px] text-si-muted">
              <span>
                {row.dossiersActifsCount} {t("activeMatters").toLowerCase()}
              </span>
              <span className="font-mono tabular-nums text-si-ink">
                {formatCurrency(row.honorairesAccumules, "CAD", locale)}
              </span>
              {row.lastActivityAt && (
                <span className="ml-auto" suppressHydrationWarning>
                  {relativeTime(row.lastActivityAt, intlLocale)}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* ── Vue bureau : registre ──
          Une colonne porteuse large, des métadonnées comprimées, les montants
          à droite pour se comparer verticalement (L2, L3, A15). Filets
          horizontaux seulement (C2, A14). */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr className={registreHeadRowClass}>
              {canArchive && (
                <th scope="col" className="w-10 px-4 py-2.5">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === clients.length && clients.length > 0}
                    onChange={toggleSelectAll}
                    className={registreCaseClass}
                    aria-label={t("selectAll")}
                  />
                </th>
              )}
              <th scope="col" className={registreHeadCellClass}>
                <RegistreSortHeader
                  label={tc("name")}
                  field="raisonSociale"
                  currentSortBy={sortBy}
                  currentSortOrder={sortOrder}
                  getSortUrl={getSortUrl}
                />
              </th>
              <th scope="col" className="w-[88px] px-3 py-2.5 text-right">
                <RegistrePlainHeader label={t("activeMatters")} align="right" />
              </th>
              <th scope="col" className="w-[140px] px-3 py-2.5 text-right">
                <RegistreSortHeader
                  label={t("trustAccount")}
                  field="trustAccountBalance"
                  currentSortBy={sortBy}
                  currentSortOrder={sortOrder}
                  getSortUrl={getSortUrl}
                  align="right"
                />
              </th>
              <th scope="col" className="w-[140px] px-3 py-2.5 text-right">
                <RegistrePlainHeader label={t("accumulatedFees")} align="right" />
              </th>
              <th scope="col" className="w-[104px] px-3 py-2.5 text-left">
                <RegistreSortHeader
                  label={tc("status")}
                  field="status"
                  currentSortBy={sortBy}
                  currentSortOrder={sortOrder}
                  getSortUrl={getSortUrl}
                />
              </th>
              <th scope="col" className="w-[108px] px-3 py-2.5 text-right">
                <RegistreSortHeader
                  label={t("lastActivity")}
                  field="updatedAt"
                  currentSortBy={sortBy}
                  currentSortOrder={sortOrder}
                  getSortUrl={getSortUrl}
                  align="right"
                />
              </th>
              {/* Colonne de contrôle : jamais de libellé (L4) */}
              <th scope="col" className="w-[48px] px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {clients.map((row) => (
              <tr
                key={row.id}
                data-selectionne={selectedIds.has(row.id) ? "true" : undefined}
                className={`${registreRowClass} cursor-pointer`}
                onClick={rangeeOuvrable(() => router.push(routes.client(row.id)))}
              >
                {canArchive && (
                  <td className="px-4 py-2.5 align-top">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(row.id)}
                      onChange={() => toggleSelect(row.id)}
                      className={`mt-0.5 ${registreCaseClass}`}
                      aria-label={t("selectClient", { name: displayName(row) })}
                    />
                  </td>
                )}
                <td className="max-w-0 px-3 py-2.5">
                  <Link href={routes.client(row.id)} className="block min-w-0">
                    <span
                      className="block truncate text-[14px] font-medium leading-5 text-si-ink"
                      title={displayName(row)}
                    >
                      {displayName(row)}
                    </span>
                  </Link>
                  {metaLine(row, true)}
                </td>
                <td className="px-3 py-2.5 text-right align-middle font-mono text-[13px] tabular-nums text-si-body">
                  {row.dossiersActifsCount}
                </td>
                <td className="px-3 py-2.5 text-right align-middle">
                  {/* Un solde de fidéicommis négatif est un manquement à
                      B-1 r.5. La couleur d'urgence le signale, le signe moins
                      et la graisse le doublent : jamais la teinte seule. */}
                  <span
                    className={`font-mono text-[13px] tabular-nums ${
                      row.trustAccountBalance < 0
                        ? "font-medium text-si-danger-ink"
                        : row.trustAccountBalance > 0
                          ? "text-si-ink"
                          : "text-si-muted"
                    }`}
                  >
                    {formatCurrency(row.trustAccountBalance, "CAD", locale)}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right align-middle font-mono text-[13px] font-medium tabular-nums text-si-ink">
                  {formatCurrency(row.honorairesAccumules, "CAD", locale)}
                </td>
                <td className="px-3 py-2.5 align-middle">
                  <StatusBadge label={statusLabel(row.status)} variant={statusVariant(row.status)} />
                </td>
                <td
                  className="px-3 py-2.5 text-right align-middle text-[12px] text-si-muted"
                  title={
                    row.lastActivityAt
                      ? new Intl.DateTimeFormat(intlLocale, {
                          dateStyle: "long",
                          timeStyle: "short",
                        }).format(row.lastActivityAt)
                      : undefined
                  }
                  suppressHydrationWarning
                >
                  {row.lastActivityAt ? relativeTime(row.lastActivityAt, intlLocale) : "—"}
                </td>
                <td className="px-3 py-2.5 text-right align-middle">
                  <ClientRowMenu
                    clientId={row.id}
                    clientName={displayName(row)}
                    canEdit={canEdit}
                    canArchive={canArchive}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/**
 * Menu de ligne du registre clients.
 *
 * Remplace les quatre icônes qui vivaient en permanence sur chaque ligne : sur
 * 50 lignes, cela faisait 200 cibles à l'écran (A11). Toute la mécanique
 * d'ouverture, de positionnement et de clavier vient de `RowMenu`, partagée
 * avec les actions rapides de la fiche client.
 */
function ClientRowMenu({
  clientId,
  clientName,
  canEdit,
  canArchive,
}: {
  clientId: string;
  clientName: string;
  canEdit: boolean;
  canArchive: boolean;
}) {
  const t = useTranslations("clients");
  const tc = useTranslations("common");

  return (
    <RowMenu label={tc("actions")} describedBy={clientName}>
      <Link href={routes.client(clientId)} role="menuitem" className={rowMenuItemClass}>
        <Eye className="h-4 w-4 shrink-0 text-si-muted" aria-hidden />
        {tc("view")}
      </Link>
      {canEdit && (
        <Link
          href={`${routes.client(clientId)}?edit=1`}
          role="menuitem"
          className={rowMenuItemClass}
        >
          <Pencil className="h-4 w-4 shrink-0 text-si-muted" aria-hidden />
          {tc("edit")}
        </Link>
      )}
      <Link
        href={`${routes.dossiers}?clientId=${clientId}`}
        role="menuitem"
        className={rowMenuItemClass}
      >
        <FolderOpen className="h-4 w-4 shrink-0 text-si-muted" aria-hidden />
        {t("openMatters")}
      </Link>
      {canArchive && (
        <>
          <div className="my-1 border-t border-si-line2" role="separator" />
          <form action={archiveClient.bind(null, clientId)}>
            <button type="submit" role="menuitem" className={rowMenuItemClass}>
              <Archive className="h-4 w-4 shrink-0 text-si-muted" aria-hidden />
              {t("archive")}
            </button>
          </form>
        </>
      )}
    </RowMenu>
  );
}
