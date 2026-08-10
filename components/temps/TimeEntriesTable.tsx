"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreVertical, Pencil, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { routes } from "@/lib/routes";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { clientDisplayName } from "@/lib/clients/normalize-name";
import { useUpdateTimeEntry, useDeleteTimeEntry } from "@/lib/hooks/useTemps";
import { TimeEntryFormModal } from "./TimeEntryFormModal";
import { StatusBadge } from "@/components/ui/StatusBadge";
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

function formatDuree(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m > 0 ? `${h} h ${String(m).padStart(2, "0")}` : `${h} h`;
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
  const [menuId, setMenuId] = useState<string | null>(null);
  const updateMutation = useUpdateTimeEntry(cabinetId);
  const deleteMutation = useDeleteTimeEntry(cabinetId);

  const canEdit = (entry: TimeEntryRow) => canEditAll || entry.userId === currentUserId;
  const entryToEdit = editId ? entries.find((e) => e.id === editId) : null;

  const handleValidate = (entry: TimeEntryRow) => {
    updateMutation.mutate(
      { id: entry.id, statut: "valide" },
      { onSuccess: () => { setMenuId(null); onRefresh(); } }
    );
  };

  const handleDelete = (entry: TimeEntryRow) => {
    if (!confirm(t("deleteEntry"))) return;
    deleteMutation.mutate(entry.id, {
      onSuccess: () => { setMenuId(null); onRefresh(); },
    });
  };

  return (
    <>
      {(updateMutation.isError || deleteMutation.isError) && (
        <div className="mx-4 mt-4 border-l-2 border-status-error pl-3" role="alert">
          <p className="text-sm text-status-error">{t("actionError")}</p>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-[960px] w-full">
          <thead>
            <tr className="border-b border-si-line">
              <th className="px-4 py-3 text-left text-xs font-medium text-si-muted">{tc("date")}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-si-muted">{tc("dossier")}</th>
              <th className="w-full px-4 py-3 text-left text-xs font-medium text-si-muted">{tc("description")}</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-si-muted">{t("duration")}</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-si-muted">{tc("amount")}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-si-muted">{t("lawyer")}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-si-muted">{tc("status")}</th>
              <th className="w-14 px-2 py-3" aria-label={t("actions")} />
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
                  className={`border-b border-si-line/80 hover:bg-si-canvas/60 ${
                    menuId === entry.id ? "bg-si-canvas/60" : ""
                  }`}
                >
                  <td className="whitespace-nowrap px-4 py-3 text-sm">
                    {formatDate(entry.date, locale)}
                  </td>
                  <td className="px-4 py-3 text-sm">
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
                  <td className="max-w-[360px] px-4 py-3 text-sm" title={entry.description ?? ""}>
                    <p className="line-clamp-2 leading-snug">
                    {entry.description ?? "—"}
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-sm tabular-nums">
                    {formatDuree(entry.dureeMinutes)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                    <p className="font-mono font-medium tabular-nums">
                      {formatCurrency(entry.montant, "CAD", locale)}
                    </p>
                    <p className="mt-0.5 font-mono text-xs tabular-nums text-si-muted">
                      {formatCurrency(entry.tauxHoraire, "CAD", locale)}/h
                    </p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm">{entry.user.nom}</td>
                  <td className="px-4 py-3">
                    <BillingStatus billingStatus={entry.billingStatus ?? null} />
                  </td>
                  <td className="relative px-2 py-2">
                    {canEdit(entry) && (
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => setMenuId(menuId === entry.id ? null : entry.id)}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-md hover:bg-si-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-si-accent/30"
                          aria-label={t("actions")}
                          aria-expanded={menuId === entry.id}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {menuId === entry.id && (
                          <div className="absolute right-2 top-full z-20 mt-1 min-w-[160px] rounded-lg border border-si-line bg-si-surface py-1 ring-1 ring-si-line/40">
                            <button
                              type="button"
                              onClick={() => { setEditId(entry.id); setMenuId(null); }}
                              className="flex min-h-11 w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-si-canvas"
                            >
                              <Pencil className="w-4 h-4" /> {tc("edit")}
                            </button>
                            {entry.statut !== "valide" && (
                              <button
                                type="button"
                                onClick={() => handleValidate(entry)}
                                className="flex min-h-11 w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-si-canvas"
                              >
                                <Check className="w-4 h-4" /> {t("markValidated")}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDelete(entry)}
                              className="flex min-h-11 w-full items-center gap-2 px-3 py-2 text-left text-sm text-status-error hover:bg-status-error-bg"
                            >
                              <Trash2 className="w-4 h-4" /> {tc("delete")}
                            </button>
                          </div>
                        )}
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
