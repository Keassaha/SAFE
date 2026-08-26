"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Trash2, Check } from "lucide-react";
import { RowMenu, rowMenuItemClass, rowMenuItemDangerClass } from "@/components/ui/RowMenu";
import { routes } from "@/lib/routes";
import { formatCalendarDate, formatCurrency } from "@/lib/utils/format";
import { clientDisplayName } from "@/lib/clients/normalize-name";
import { useUpdateTimeEntry, useDeleteTimeEntry } from "@/lib/hooks/useTemps";
import { TimeEntryFormModal } from "./TimeEntryFormModal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  registreCellClass,
  registreCellMutedClass,
  registreCellNumClass,
  registreHeadCellClass,
  registreHeadRowClass,
  registreRowClass,
  RegistrePlainHeader,
  rangeeOuvrable,
} from "@/components/ui/registre";
import { formatDureeHM, formatHeuresDecimales } from "@/lib/temps/duree";
import type { TimeEntryStatut } from "@prisma/client";
import { useLocale, useTranslations } from "next-intl";

interface TimeEntryRow {
  id: string;
  dossierId: string | null;
  clientId?: string | null;
  userId: string;
  date: string;
  dureeMinutes: number;
  description: string | null;
  typeActivite: string | null;
  facturable: boolean;
  statut: string;
  billingStatus: string | null;
  tauxHoraire: number;
  montant: number;
  dossier: { id: string; intitule: string; numeroDossier: string | null; reference: string | null; client: { raisonSociale: string | null; prenom: string | null; nom: string | null } } | null;
  client?: { id: string; raisonSociale: string | null; prenom: string | null; nom: string | null } | null;
  user: { id: string; nom: string };
  invoiceLines: { id: string }[];
}

function BillingStatus({ billingStatus }: { billingStatus: string | null }) {
  const t = useTranslations("temps");
  const isFacture = billingStatus === "BILLED";
  return (
    <StatusBadge
      label={isFacture ? t("billed") : t("notBilled")}
      variant={isFacture ? "success" : "warning"}
    />
  );
}

export function TimeEntriesTable({
  entries,
  cabinetId,
  currentUserId,
  clients,
  dossiers,
  users,
  canEditAll,
  onRefresh,
}: {
  entries: TimeEntryRow[];
  cabinetId: string | null;
  currentUserId: string;
  clients: Array<{ id: string; raisonSociale: string | null }>;
  dossiers: Array<{ id: string; intitule: string; numeroDossier: string | null; reference: string | null; clientId: string; client: { raisonSociale: string | null } }>;
  users: Array<{ id: string; nom: string }>;
  canEditAll: boolean;
  onRefresh: () => void;
}) {
  const t = useTranslations("temps");
  const tc = useTranslations("common");
  const locale = useLocale();
  const [editId, setEditId] = useState<string | null>(null);
  const updateMutation = useUpdateTimeEntry(cabinetId);
  const deleteMutation = useDeleteTimeEntry(cabinetId);

  const canEdit = (entry: TimeEntryRow) => canEditAll || entry.userId === currentUserId;
  const entryToEdit = editId ? entries.find((e) => e.id === editId) : null;

  const handleValidate = (entry: TimeEntryRow) => {
    updateMutation.mutate(
      { id: entry.id, statut: "valide" },
      { onSuccess: onRefresh },
    );
  };

  const handleDelete = (entry: TimeEntryRow) => {
    if (!confirm(t("deleteEntry"))) return;
    deleteMutation.mutate(entry.id, { onSuccess: onRefresh });
  };

  return (
    <>
      {(updateMutation.isError || deleteMutation.isError) && (
        <div className="mx-4 mt-4 border-l-2 border-si-danger pl-3" role="alert">
          <p className="text-sm text-si-danger-ink">{t("actionError")}</p>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-[960px] w-full">
          <thead>
            <tr className={registreHeadRowClass}>
              <th className={registreHeadCellClass}><RegistrePlainHeader label={tc("date")} /></th>
              <th className={registreHeadCellClass}><RegistrePlainHeader label={tc("dossier")} /></th>
              <th className={`w-full ${registreHeadCellClass}`}><RegistrePlainHeader label={tc("description")} /></th>
              <th className={`${registreHeadCellClass} text-right`}><RegistrePlainHeader label={t("duration")} align="right" /></th>
              <th className={`${registreHeadCellClass} text-right`}><RegistrePlainHeader label={tc("amount")} align="right" /></th>
              <th className={registreHeadCellClass}><RegistrePlainHeader label={t("lawyer")} /></th>
              <th className={registreHeadCellClass}><RegistrePlainHeader label={tc("status")} /></th>
              {/* Colonne de contrôle : jamais de libellé (L4). */}
              <th className="w-12 px-3 py-2.5" aria-label={t("actions")} />
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-si-muted">
                  {t("noEntries")}
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr
                  key={entry.id}
                  className={`${registreRowClass} ${canEdit(entry) ? "cursor-pointer" : ""}`}
                  onClick={canEdit(entry) ? rangeeOuvrable(() => setEditId(entry.id)) : undefined}
                >
                  <td className={`whitespace-nowrap ${registreCellMutedClass}`}>
                    {formatCalendarDate(entry.date, locale)}
                  </td>
                  <td className={registreCellClass}>
                    {entry.dossier ? (
                      <div className="min-w-[150px]">
                        <Link
                          href={routes.dossier(entry.dossier.id)}
                          className="font-medium text-si-verified hover:underline"
                        >
                          {entry.dossier.numeroDossier ?? entry.dossier.reference ?? "—"}
                        </Link>
                        <p className="mt-0.5 max-w-[180px] truncate text-xs text-si-muted">
                          {clientDisplayName(entry.dossier.client)}
                        </p>
                      </div>
                    ) : (
                      <div className="min-w-[150px]">
                        <span className="text-si-muted">{t("noMatter")}</span>
                        {entry.client && (
                          <p className="mt-0.5 max-w-[180px] truncate text-xs text-si-muted">
                            {clientDisplayName(entry.client)}
                          </p>
                        )}
                      </div>
                    )}
                  </td>
                  {/* La description porte l'ouverture au clavier : la rangée
                      entière est cliquable à la souris, mais une `<tr>` ne se
                      tabule pas. Un vrai bouton, donc, plutôt qu'un
                      `tabIndex` posé sur la ligne (WCAG 2.1.1). */}
                  <td className="max-w-[360px] px-4 py-3 text-sm" title={entry.description ?? ""}>
                    {canEdit(entry) ? (
                      <button
                        type="button"
                        onClick={() => setEditId(entry.id)}
                        className="block w-full rounded-sm text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-si-ink-strong/30"
                      >
                        <span className="line-clamp-2 leading-snug">
                          {entry.description ?? "—"}
                        </span>
                      </button>
                    ) : (
                      <p className="line-clamp-2 leading-snug">{entry.description ?? "—"}</p>
                    )}
                  </td>
                  {/* La durée se lit dans l'unité qui sera facturée : des heures.
                      Le survol garde la lecture en heures et minutes. */}
                  <td
                    className="whitespace-nowrap px-4 py-3 text-right font-mono text-sm tabular-nums"
                    title={formatDureeHM(entry.dureeMinutes)}
                  >
                    {t("hoursShort", { heures: formatHeuresDecimales(entry.dureeMinutes, locale) })}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                    <p className="font-mono font-medium tabular-nums">
                      {formatCurrency(entry.montant, "CAD", locale)}
                    </p>
                    <p className="mt-0.5 font-mono text-xs tabular-nums text-si-muted">
                      {formatCurrency(entry.tauxHoraire, "CAD", locale)}/h
                    </p>
                  </td>
                  <td className={`whitespace-nowrap ${registreCellMutedClass}`}>{entry.user.nom}</td>
                  <td className="px-4 py-3">
                    <BillingStatus billingStatus={entry.billingStatus ?? null} />
                  </td>
                  {/* Le menu vit dans un portail en position fixe : ce tableau
                      défile dans un `overflow-x-auto`, qui force `overflow-y`
                      à `auto` et rognait le menu sur les dernières lignes. */}
                  <td className="px-3 py-2.5 text-right align-middle">
                    {canEdit(entry) && (
                      <div className="flex items-center justify-end">
                        <RowMenu label={t("actions")} describedBy={entry.description ?? undefined}>
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => setEditId(entry.id)}
                            className={rowMenuItemClass}
                          >
                            <Pencil className="h-4 w-4" aria-hidden /> {tc("edit")}
                          </button>
                          {entry.statut !== "valide" && (
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => handleValidate(entry)}
                              className={rowMenuItemClass}
                            >
                              <Check className="h-4 w-4" aria-hidden /> {t("markValidated")}
                            </button>
                          )}
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => handleDelete(entry)}
                            className={rowMenuItemDangerClass}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden /> {tc("delete")}
                          </button>
                        </RowMenu>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {entryToEdit && (
        <TimeEntryFormModal
          open={!!editId}
          onClose={() => setEditId(null)}
          cabinetId={cabinetId}
          currentUserId={currentUserId}
          clients={clients}
          dossiers={dossiers}
          users={users}
          initial={{
            id: entryToEdit.id,
            dossierId: entryToEdit.dossierId ?? undefined,
            clientId: entryToEdit.clientId ?? entryToEdit.client?.id ?? undefined,
            userId: entryToEdit.userId,
            date: new Date(entryToEdit.date),
            dureeMinutes: entryToEdit.dureeMinutes,
            description: entryToEdit.description ?? "",
            typeActivite: entryToEdit.typeActivite ?? "",
            facturable: entryToEdit.facturable,
            statut: entryToEdit.statut as TimeEntryStatut,
            tauxHoraire: entryToEdit.tauxHoraire,
          }}
          onSuccess={() => { setEditId(null); onRefresh(); }}
        />
      )}
    </>
  );
}
