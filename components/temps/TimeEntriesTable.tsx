"use client";

import { useState } from "react";
import Link from "next/link";
import { MoreVertical, Pencil, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { routes } from "@/lib/routes";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { useUpdateTimeEntry, useDeleteTimeEntry } from "@/lib/hooks/useTemps";
import { TimeEntryFormModal } from "./TimeEntryFormModal";
import type { TimeEntryStatut } from "@prisma/client";
import { useTranslations } from "next-intl";

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
  dossier: { id: string; intitule: string; numeroDossier: string | null; reference: string | null; client: { raisonSociale: string } } | null;
  client?: { id: string; raisonSociale: string } | null;
  user: { id: string; nom: string };
  invoiceLines: { id: string }[];
}

function formatDuree(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m}` : `${h}h`;
}

function StatutBadge({ billingStatus }: { billingStatus: string | null }) {
  const t = useTranslations("temps");
  const isFacture = billingStatus === "BILLED";
  const label = isFacture ? t("billed") : t("notBilled");
  const className = isFacture
    ? "bg-green-100 text-green-800"
    : "bg-red-100 text-red-800";
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${className}`}>
      {label}
    </span>
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
  clients: Array<{ id: string; raisonSociale: string }>;
  dossiers: Array<{ id: string; intitule: string; numeroDossier: string | null; reference: string | null; clientId: string; client: { raisonSociale: string } }>;
  users: Array<{ id: string; nom: string }>;
  canEditAll: boolean;
  onRefresh: () => void;
}) {
  const t = useTranslations("temps");
  const tc = useTranslations("common");
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
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-[var(--safe-neutral-border)]">
              <th className="px-4 py-3 text-left text-xs font-medium safe-text-secondary uppercase">{tc("date")}</th>
              <th className="px-4 py-3 text-left text-xs font-medium safe-text-secondary uppercase">{tc("client")}</th>
              <th className="px-4 py-3 text-left text-xs font-medium safe-text-secondary uppercase">{tc("dossier")}</th>
              <th className="px-4 py-3 text-left text-xs font-medium safe-text-secondary uppercase">{tc("description")}</th>
              <th className="px-4 py-3 text-left text-xs font-medium safe-text-secondary uppercase">{t("duration")}</th>
              <th className="px-4 py-3 text-left text-xs font-medium safe-text-secondary uppercase">{t("rate")}</th>
              <th className="px-4 py-3 text-right text-xs font-medium safe-text-secondary uppercase">{tc("amount")}</th>
              <th className="px-4 py-3 text-left text-xs font-medium safe-text-secondary uppercase">{t("lawyer")}</th>
              <th className="px-4 py-3 text-left text-xs font-medium safe-text-secondary uppercase">{tc("status")}</th>
              <th className="px-4 py-3 w-10" aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-sm safe-text-secondary">
                  {t("noEntries")}
                </td>
              </tr>
            ) : (
              entries.map((entry, i) => (
                <tr
                  key={entry.id}
                  className={`border-b border-[var(--safe-neutral-border)]/80 hover:bg-green-50/50 ${
                    i % 2 === 1 ? "bg-neutral-100/30" : ""
                  }`}
                >
                  <td className="px-4 py-3 text-sm whitespace-nowrap">{formatDate(entry.date)}</td>
                  <td className="px-4 py-3 text-sm">
                    {entry.dossier?.client?.raisonSociale ?? entry.client?.raisonSociale ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {entry.dossier ? (
                      <Link
                        href={routes.dossier(entry.dossier.id)}
                        className="text-green-800 hover:underline"
                      >
                        {entry.dossier.numeroDossier ?? entry.dossier.reference ?? "—"}
                      </Link>
                    ) : (
                      <span className="text-[var(--safe-text-secondary)]">{t("noMatter")}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm max-w-[180px] truncate" title={entry.description ?? ""}>
                    {entry.description ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-sm whitespace-nowrap">{formatDuree(entry.dureeMinutes)}</td>
                  <td className="px-4 py-3 text-sm whitespace-nowrap">{formatCurrency(entry.tauxHoraire)}/h</td>
                  <td className="px-4 py-3 text-sm font-medium text-right tabular-nums">{formatCurrency(entry.montant)}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="w-7 h-7 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-medium shrink-0">
                        {entry.user.nom.slice(0, 2).toUpperCase()}
                      </span>
                      {entry.user.nom}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatutBadge billingStatus={entry.billingStatus ?? null} />
                  </td>
                  <td className="px-4 py-3 relative">
                    {canEdit(entry) && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setMenuId(menuId === entry.id ? null : entry.id)}
                          className="p-1 rounded hover:bg-neutral-100"
                          aria-label="Actions"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {menuId === entry.id && (
                          <div className="absolute right-0 top-full mt-1 py-1 bg-white border rounded-safe-sm shadow-lg z-10 min-w-[140px]">
                            <button
                              type="button"
                              onClick={() => { setEditId(entry.id); setMenuId(null); }}
                              className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-neutral-50"
                            >
                              <Pencil className="w-4 h-4" /> {tc("edit")}
                            </button>
                            {entry.statut !== "valide" && (
                              <button
                                type="button"
                                onClick={() => handleValidate(entry)}
                                className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-neutral-50"
                              >
                                <Check className="w-4 h-4" /> {t("markValidated")}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDelete(entry)}
                              className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-red-50 text-red-700"
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
