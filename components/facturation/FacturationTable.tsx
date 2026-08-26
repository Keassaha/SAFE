"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Bell, Eye, Send } from "lucide-react";
import { displayInvoiceNumero } from "@/lib/facturation/invoice-numero-format";
import { useFormatteurs } from "@/lib/i18n/formatteurs";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RowMenu, rowMenuItemClass } from "@/components/ui/RowMenu";
import { routes } from "@/lib/routes";
import {
  RegistrePlainHeader,
  RegistreSortHeader,
  registreCellMutedClass,
  registreCellNumClass,
  registreHeadCellClass,
  registreHeadRowClass,
  registreRowClass,
  rangeeOuvrable,
} from "@/components/ui/registre";
import type { FactureChampTri, FactureOrdreTri } from "@/lib/facturation/liste-query";
import type { InvoiceStatut } from "@prisma/client";

/**
 * Registre de facturation.
 *
 * Il était le seul tableau du produit écrit hors de la grammaire commune des
 * registres (`components/ui/registre.tsx`) — y compris à l'intérieur de son
 * propre module, où Paiements, Suivi, Notes de crédit et Honoraires s'y
 * appuient tous. Passer d'une liste à l'autre demandait donc de réapprendre
 * l'objet.
 *
 * ── Ce que la refonte décide ────────────────────────────────────────────────
 *
 * 1. UNE COLONNE PORTEUSE au lieu de trois. Le numéro, le client et le dossier
 *    occupaient trois colonnes de largeur voisine : à 1440 px, un nom de
 *    société passait sur quatre lignes et un intitulé de dossier sur cinq. Le
 *    client porte la ligne ; le numéro et le dossier descendent en seconde
 *    ligne, tronqués (L3, A15, E1).
 *
 * 2. FILETS HORIZONTAUX SEULS. Les zébrures une ligne sur deux faisaient
 *    tableur (A14, C2). Le survol soulève la rangée au lieu de la peindre en
 *    gris (déc. CEO 2026-08-11, `safe-zoom-rang`).
 *
 * 3. LA RANGÉE ENTIÈRE OUVRE, donc la colonne « Voir › » disparaît : elle
 *    répétait sur chaque ligne ce que le clic fait déjà (A11). Le menu de
 *    ligne la remplace, avec un déclencheur permanent — jamais une action qui
 *    n'existe qu'au survol.
 *
 * 4. L'AMBRE REDEVIENT UN APPEL À L'ACTION. « Envoyée » était en ambre, comme
 *    une alerte, alors qu'une facture envoyée ne demande rien. Voir
 *    `VARIANTES` plus bas.
 */

export interface FacturationTableRow {
  id: string;
  numero: string;
  client: string;
  clientId: string;
  dossier: string;
  dossierId: string | null;
  dateEmission: Date;
  dateEcheance: Date;
  montantTotal: number;
  balanceDue: number;
  statut: InvoiceStatut;
  lastReminderDay?: number | null;
  lastReminderSentAt?: Date | null;
}

/**
 * Un état ne porte la couleur que s'il appelle un geste.
 *
 * Envoyée, partiellement payée et brouillon sont des états d'attente : ils se
 * distinguent par leur libellé. C'est le même arbitrage que « inactif » au
 * registre clients, où l'ambre est réservé à ce qui réclame une action (C3).
 * Le retard est en outre doublé par l'échéance en rouge : la couleur ne
 * travaille jamais seule (WCAG 1.4.1).
 */
const VARIANTES: Record<InvoiceStatut, "neutral" | "warning" | "success" | "error"> = {
  brouillon: "neutral",
  envoyee: "neutral",
  partiellement_payee: "neutral",
  payee: "success",
  en_retard: "error",
};

function partPayee(montantTotal: number, balanceDue: number): number {
  if (montantTotal <= 0) return 0;
  return Math.min(100, Math.round(((montantTotal - balanceDue) / montantTotal) * 100));
}

export function FacturationTable({
  invoices,
  sortBy,
  sortOrder,
}: {
  invoices: FacturationTableRow[];
  sortBy: FactureChampTri;
  sortOrder: FactureOrdreTri;
}) {
  const t = useTranslations("common");
  const tf = useTranslations("facturation");
  const tStatut = useTranslations("invoiceStatut");
  const router = useRouter();
  const searchParams = useSearchParams();
  // Montants et dates suivent la langue du cabinet, comme les tuiles de KPI
  // juste au-dessus. Voir `lib/i18n/formatteurs.ts`.
  const { formatCurrency, formatCalendarDate, formatDate } = useFormatteurs();

  function getSortUrl(champ: FactureChampTri, ordre: FactureOrdreTri) {
    const suivant = new URLSearchParams(searchParams.toString());
    suivant.set("sortBy", champ);
    suivant.set("sortOrder", ordre);
    suivant.delete("page");
    return `${routes.facturation}?${suivant.toString()}`;
  }

  const entete = { currentSortBy: sortBy, currentSortOrder: sortOrder, getSortUrl };

  return (
    // Défilement horizontal confiné au conteneur du tableau : la page, elle,
    // ne défile jamais latéralement.
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] border-collapse">
        <thead>
          <tr className={registreHeadRowClass}>
            <th scope="col" className={registreHeadCellClass}>
              <RegistreSortHeader label={t("client")} field="client" {...entete} />
            </th>
            <th scope="col" className="w-[104px] px-3 py-2.5 text-right">
              <RegistreSortHeader
                label={t("issueDateShort")}
                field="dateEmission"
                align="right"
                {...entete}
              />
            </th>
            <th scope="col" className="w-[104px] px-3 py-2.5 text-right">
              <RegistreSortHeader
                label={t("dueDateShort")}
                field="dateEcheance"
                align="right"
                {...entete}
              />
            </th>
            <th scope="col" className="w-[140px] px-3 py-2.5 text-right">
              <RegistreSortHeader
                label={t("total")}
                field="montantTotal"
                align="right"
                {...entete}
              />
            </th>
            <th scope="col" className="w-[140px] px-3 py-2.5 text-right">
              <RegistreSortHeader
                label={t("balance")}
                field="balanceDue"
                align="right"
                {...entete}
              />
            </th>
            <th scope="col" className="w-[132px] px-3 py-2.5 text-left">
              <RegistrePlainHeader label={t("status")} />
            </th>
            <th scope="col" className="w-[88px] px-3 py-2.5 text-left">
              <RegistrePlainHeader label={t("reminder")} />
            </th>
            {/* Colonne de contrôle : jamais de libellé (L4) */}
            <th scope="col" className="w-[48px] px-3 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => {
            const part = partPayee(inv.montantTotal, inv.balanceDue);
            const enRetard = inv.statut === "en_retard";
            const lien = routes.facturationFactureEdit(inv.id);
            return (
              <tr
                key={inv.id}
                className={`${registreRowClass} cursor-pointer`}
                onClick={rangeeOuvrable(() => router.push(lien))}
              >
                <td className="max-w-0 px-3 py-2.5">
                  <Link href={lien} className="block min-w-0">
                    <span
                      className="block truncate text-[14px] font-medium leading-5 text-si-ink"
                      title={inv.client}
                    >
                      {inv.client}
                    </span>
                  </Link>
                  <span className="mt-0.5 flex min-w-0 items-center gap-1.5 truncate text-[12px] leading-[17px] text-si-muted">
                    <span className="shrink-0 font-mono">
                      {displayInvoiceNumero(inv.numero)}
                    </span>
                    {inv.dossierId && (
                      <>
                        <span className="text-si-subtle" aria-hidden>
                          ·
                        </span>
                        <span className="truncate" title={inv.dossier}>
                          {inv.dossier}
                        </span>
                      </>
                    )}
                  </span>
                </td>
                <td className={`whitespace-nowrap text-right ${registreCellMutedClass}`}>
                  {formatCalendarDate(inv.dateEmission)}
                </td>
                <td
                  className={`whitespace-nowrap px-3 py-2.5 text-right align-middle text-[13px] ${
                    enRetard ? "font-medium text-si-danger-ink" : "text-si-muted"
                  }`}
                >
                  {formatCalendarDate(inv.dateEcheance)}
                </td>
                <td className={registreCellNumClass}>{formatCurrency(inv.montantTotal)}</td>
                <td className="px-3 py-2.5 text-right align-middle">
                  <span
                    className={`block font-mono text-[13px] tabular-nums ${
                      inv.balanceDue === 0
                        ? "text-si-muted"
                        : enRetard
                          ? "font-medium text-si-danger-ink"
                          : "font-medium text-si-ink"
                    }`}
                  >
                    {formatCurrency(inv.balanceDue)}
                  </span>
                  {part > 0 && part < 100 && (
                    <span className="mt-0.5 block text-[12px] text-si-muted">
                      {part} {t("paidPercent")}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5 align-middle">
                  <StatusBadge label={tStatut(inv.statut)} variant={VARIANTES[inv.statut]} />
                </td>
                <td className={`whitespace-nowrap ${registreCellMutedClass}`}>
                  {inv.lastReminderDay != null ? (
                    <span
                      className="inline-flex items-center gap-1.5"
                      title={
                        inv.lastReminderSentAt
                          ? `${t("relanceOn")} ${formatDate(inv.lastReminderSentAt)}`
                          : undefined
                      }
                    >
                      <Bell className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                      J+{inv.lastReminderDay}
                    </span>
                  ) : (
                    <span className="text-si-subtle">—</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-right align-middle">
                  <RowMenu
                    label={t("actions")}
                    describedBy={tf("rowActions", { numero: displayInvoiceNumero(inv.numero) })}
                  >
                    <Link href={lien} className={rowMenuItemClass} role="menuitem">
                      <Eye className="h-4 w-4" aria-hidden />
                      {tf("openInvoice")}
                    </Link>
                    <Link
                      href={routes.facturationSuivi}
                      className={rowMenuItemClass}
                      role="menuitem"
                    >
                      <Send className="h-4 w-4" aria-hidden />
                      {tf("sendReminder")}
                    </Link>
                  </RowMenu>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
