"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  Check,
  Copy,
  FileText,
  Folder,
  MoreVertical,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Trash2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { routes } from "@/lib/routes";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { useDeleteTimeEntry, useUpdateTimeEntry } from "@/lib/hooks/useTemps";
import { TimeEntryFormModal } from "./TimeEntryFormModal";
import { useTranslations } from "next-intl";
import type { TimeEntryStatut } from "@prisma/client";
import type { TimeEntryCreateInput } from "@/lib/validations/time-entry";

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
  dossier: { id: string; intitule: string; numeroDossier: string | null; reference: string | null; client: { raisonSociale: string | null } } | null;
  client?: { id: string; raisonSociale: string | null } | null;
  user: { id: string; nom: string };
  invoiceLines: { id: string }[];
}

function formatDuree(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h${m}` : `${h}h`;
}

function StatutBadge({
  billingStatus,
  needsDescription,
}: {
  billingStatus: string | null;
  needsDescription: boolean;
}) {
  const t = useTranslations("temps");
  const isFacture = billingStatus === "BILLED";
  const label = isFacture
    ? t("billed")
    : needsDescription
      ? t("needsCompletion")
      : t("notBilled");
  const className = isFacture
    ? "bg-green-100 text-green-800"
    : needsDescription
      ? "bg-amber-100 text-amber-800"
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
  clients: Array<{ id: string; raisonSociale: string | null }>;
  dossiers: Array<{ id: string; intitule: string; numeroDossier: string | null; reference: string | null; clientId: string; client: { raisonSociale: string | null } }>;
  users: Array<{ id: string; nom: string }>;
  canEditAll: boolean;
  onRefresh: () => void;
}) {
  const t = useTranslations("temps");
  const tc = useTranslations("common");
  const router = useRouter();
  const [editId, setEditId] = useState<string | null>(null);
  const [duplicateInitial, setDuplicateInitial] = useState<
    (Partial<TimeEntryCreateInput> & { clientId?: string }) | null
  >(null);
  const [menu, setMenu] = useState<{ id: string; top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const updateMutation = useUpdateTimeEntry(cabinetId);
  const deleteMutation = useDeleteTimeEntry(cabinetId);

  const canEdit = (entry: TimeEntryRow) => canEditAll || entry.userId === currentUserId;
  const entryToEdit = editId ? entries.find((e) => e.id === editId) : null;
  const menuEntry = menu ? entries.find((entry) => entry.id === menu.id) : null;

  const isBilled = (entry: TimeEntryRow) =>
    entry.billingStatus === "BILLED" || entry.invoiceLines.length > 0 || entry.statut === "facture";

  const closeMenu = () => setMenu(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!menu) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };

    window.addEventListener("resize", closeMenu);
    window.addEventListener("scroll", closeMenu, true);
    document.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("resize", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [menu]);

  const toggleMenu = (entryId: string, button: HTMLButtonElement) => {
    if (menu?.id === entryId) {
      closeMenu();
      return;
    }
    const rect = button.getBoundingClientRect();
    const menuWidth = 240;
    const menuHeight = 340;
    const margin = 8;
    const hasRoomBelow = window.innerHeight - rect.bottom > menuHeight + margin;
    setMenu({
      id: entryId,
      top: hasRoomBelow ? rect.bottom + margin : Math.max(margin, rect.top - menuHeight - margin),
      left: Math.max(margin, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - margin)),
    });
  };

  const handleValidate = (entry: TimeEntryRow) => {
    updateMutation.mutate(
      { id: entry.id, statut: "valide" },
      { onSuccess: () => { closeMenu(); onRefresh(); } }
    );
  };

  const handleToggleFacturable = (entry: TimeEntryRow) => {
    updateMutation.mutate(
      { id: entry.id, facturable: !entry.facturable },
      { onSuccess: () => { closeMenu(); onRefresh(); } }
    );
  };

  const handleCreateInvoice = (entry: TimeEntryRow) => {
    if (!entry.description?.trim()) {
      toast.error(t("needsDescriptionToBill"));
      return;
    }
    closeMenu();
    router.push(`${routes.facturationFactureNouvelle}?timeEntryIds=${entry.id}`);
  };

  const handleDuplicate = (entry: TimeEntryRow) => {
    setDuplicateInitial({
      dossierId: entry.dossierId ?? undefined,
      clientId: entry.clientId ?? entry.client?.id ?? undefined,
      userId: currentUserId,
      date: new Date(),
      dureeMinutes: entry.dureeMinutes,
      description: entry.description ?? "",
      typeActivite: entry.typeActivite ?? undefined,
      facturable: entry.facturable,
      statut: "brouillon",
      tauxHoraire: entry.tauxHoraire,
    });
    closeMenu();
  };

  const handleDelete = (entry: TimeEntryRow) => {
    if (!confirm(t("deleteEntry"))) return;
    deleteMutation.mutate(entry.id, {
      onSuccess: () => { closeMenu(); onRefresh(); },
    });
  };

  const renderMenu = (entry: TimeEntryRow) => {
    const billed = isBilled(entry);
    const clientId = entry.clientId ?? entry.client?.id ?? null;
    const hasDescription = !!entry.description?.trim();
    const canShowValidate = entry.statut !== "valide" && entry.statut !== "facture";
    const canShowFacturableToggle = !billed;
    const canShowCreateInvoice = entry.facturable && !billed;
    const canShowViewMatter = !!entry.dossier;
    const canShowViewClient = !!clientId;

    return (
      <>
        <div className="fixed inset-0 z-[9998]" onClick={closeMenu} />
        <div
          className="fixed py-1 bg-white border border-neutral-200 rounded-safe-sm shadow-xl z-[9999] w-[240px]"
          style={{ top: menu?.top ?? 0, left: menu?.left ?? 0 }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => { setEditId(entry.id); closeMenu(); }}
            className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-neutral-50"
          >
            <Pencil className="w-4 h-4" /> {tc("edit")}
          </button>
          {canShowValidate && (
            <button
              type="button"
              onClick={() => handleValidate(entry)}
              className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-neutral-50"
            >
              <Check className="w-4 h-4" /> {t("markValidated")}
            </button>
          )}
          {canShowFacturableToggle && (
            <button
              type="button"
              onClick={() => handleToggleFacturable(entry)}
              className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-neutral-50"
            >
              {entry.facturable ? (
                <>
                  <ToggleLeft className="w-4 h-4" /> {t("markNonBillable")}
                </>
              ) : (
                <>
                  <ToggleRight className="w-4 h-4" /> {t("markBillable")}
                </>
              )}
            </button>
          )}
          {canShowCreateInvoice && (
            <button
              type="button"
              onClick={() => handleCreateInvoice(entry)}
              disabled={!hasDescription}
              title={!hasDescription ? t("needsDescriptionToBill") : undefined}
              className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileText className="w-4 h-4" /> {t("createInvoiceFromEntry")}
            </button>
          )}
          {canShowViewMatter && (
            <Link
              href={routes.dossier(entry.dossier!.id)}
              onClick={closeMenu}
              className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-neutral-50"
            >
              <Folder className="w-4 h-4" /> {t("viewMatter")}
            </Link>
          )}
          {canShowViewClient && (
            <Link
              href={routes.client(clientId!)}
              onClick={closeMenu}
              className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-neutral-50"
            >
              <User className="w-4 h-4" /> {t("viewClient")}
            </Link>
          )}
          <button
            type="button"
            onClick={() => handleDuplicate(entry)}
            className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-neutral-50"
          >
            <Copy className="w-4 h-4" /> {t("duplicateEntry")}
          </button>
          <button
            type="button"
            onClick={() => handleDelete(entry)}
            className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-red-50 text-red-700"
          >
            <Trash2 className="w-4 h-4" /> {tc("delete")}
          </button>
        </div>
      </>
    );
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
              entries.map((entry, i) => {
                const billed = isBilled(entry);
                const hasDescription = !!entry.description?.trim();

                return (
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
                      <StatutBadge billingStatus={entry.billingStatus ?? null} needsDescription={!hasDescription && entry.facturable && !billed} />
                    </td>
                    <td className="px-4 py-3 relative">
                      {canEdit(entry) && (
                        <div className="flex items-center justify-end">
                          <button
                            type="button"
                            onClick={(event) => toggleMenu(entry.id, event.currentTarget)}
                            className="p-1 rounded hover:bg-neutral-100"
                            aria-label="Actions"
                            aria-expanded={menu?.id === entry.id}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {mounted && menuEntry && createPortal(renderMenu(menuEntry), document.body)}

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

      {duplicateInitial && (
        <TimeEntryFormModal
          open={!!duplicateInitial}
          onClose={() => setDuplicateInitial(null)}
          cabinetId={cabinetId}
          currentUserId={currentUserId}
          clients={clients}
          dossiers={dossiers}
          users={users}
          initial={duplicateInitial}
          onSuccess={() => { setDuplicateInitial(null); onRefresh(); }}
        />
      )}
    </>
  );
}
