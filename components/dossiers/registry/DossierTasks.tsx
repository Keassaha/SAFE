"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  createDossierTache,
  updateDossierTache,
  deleteDossierTache,
} from "@/app/(app)/dossiers/actions";
import { Pencil, Trash2 } from "lucide-react";

export type DossierTacheItem = {
  id: string;
  titre: string;
  description: string | null;
  priorite: string;
  statut: string;
  dateEcheance: Date | null;
  assigneeId: string | null;
  assignee: { nom: string } | null;
};

interface DossierTasksProps {
  dossierId: string;
  tasks: DossierTacheItem[];
  users: { id: string; nom: string }[];
}

export function DossierTasks({ dossierId, tasks, users }: DossierTasksProps) {
  const t = useTranslations("matters");
  const tc = useTranslations("common");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const PRIORITE_LABELS: Record<string, string> = {
    low: t("priorityLow"),
    medium: t("priorityMedium"),
    high: t("priorityHigh"),
    urgent: t("priorityUrgent"),
  };

  const STATUT_LABELS: Record<string, string> = {
    a_faire: t("taskStatusTodo"),
    en_cours: t("taskStatusInProgress"),
    terminee: t("taskStatusDone"),
    annulee: t("taskStatusCancelled"),
  };

  function formatDate(d: Date | null): string {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("fr-CA", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  return (
    <Card>
      <CardHeader
        title={t("tasks")}
        action={
          <Button type="button" onClick={() => setShowAdd((v) => !v)}>
            {showAdd ? tc("cancel") : t("addTask")}
          </Button>
        }
      />
      <CardContent className="space-y-4">
        {showAdd && (
          <form action={createDossierTache} className="rounded-safe-sm border border-neutral-border p-4 space-y-3 bg-neutral-surface/30">
            <input type="hidden" name="dossierId" value={dossierId} />
            <Input label={t("eventTitle")} name="titre" required placeholder={t("taskTitle")} />
            <div>
              <label className="block text-sm font-medium text-neutral-text-secondary mb-1">{tc("description")}</label>
              <textarea
                name="description"
                rows={2}
                className="w-full px-3 py-2 rounded-safe-sm border border-neutral-border bg-white text-neutral-text-primary text-sm"
                placeholder={t("optional")}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-neutral-text-secondary mb-1">{t("priority")}</label>
                <select
                  name="priorite"
                  defaultValue="medium"
                  className="w-full h-10 px-3 rounded-safe-sm border border-neutral-border bg-white text-sm"
                >
                  <option value="low">{t("priorityLow")}</option>
                  <option value="medium">{t("priorityMedium")}</option>
                  <option value="high">{t("priorityHigh")}</option>
                  <option value="urgent">{t("priorityUrgent")}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-text-secondary mb-1">{t("assignedTo")}</label>
                <select name="assigneeId" className="w-full h-10 px-3 rounded-safe-sm border border-neutral-border bg-white text-sm">
                  <option value="">—</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.nom}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Input label={t("dueDate")} name="dateEcheance" type="date" />
            <div className="flex gap-2">
              <Button type="submit">{tc("create")}</Button>
              <Button type="button" variant="secondary" onClick={() => setShowAdd(false)}>
                {tc("cancel")}
              </Button>
            </div>
          </form>
        )}

        {tasks.length === 0 && !showAdd ? (
          <p className="text-sm text-neutral-muted">{t("noTasks")}</p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((task) =>
              editingId === task.id ? (
                <li key={task.id}>
                  <form
                    action={(fd) => updateDossierTache(task.id, fd)}
                    className="rounded-safe-sm border border-primary-200 p-4 space-y-3 bg-primary-50/30"
                  >
                    <input type="hidden" name="dossierId" value={dossierId} />
                    <Input label={t("eventTitle")} name="titre" defaultValue={task.titre} required />
                    <div>
                      <label className="block text-sm font-medium text-neutral-text-secondary mb-1">{tc("description")}</label>
                      <textarea
                        name="description"
                        rows={2}
                        defaultValue={task.description ?? ""}
                        className="w-full px-3 py-2 rounded-safe-sm border border-neutral-border bg-white text-sm"
                      />
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <div>
                        <label className="block text-sm font-medium text-neutral-text-secondary mb-1">{tc("status")}</label>
                        <select name="statut" defaultValue={task.statut} className="w-full h-10 px-3 rounded-safe-sm border border-neutral-border bg-white text-sm">
                          <option value="a_faire">{t("taskStatusTodo")}</option>
                          <option value="en_cours">{t("taskStatusInProgress")}</option>
                          <option value="terminee">{t("taskStatusDone")}</option>
                          <option value="annulee">{t("taskStatusCancelled")}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-text-secondary mb-1">{t("priority")}</label>
                        <select name="priorite" defaultValue={task.priorite} className="w-full h-10 px-3 rounded-safe-sm border border-neutral-border bg-white text-sm">
                          <option value="low">{t("priorityLow")}</option>
                          <option value="medium">{t("priorityMedium")}</option>
                          <option value="high">{t("priorityHigh")}</option>
                          <option value="urgent">{t("priorityUrgent")}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-text-secondary mb-1">{t("assignedTo")}</label>
                        <select name="assigneeId" defaultValue={task.assigneeId ?? ""} className="w-full h-10 px-3 rounded-safe-sm border border-neutral-border bg-white text-sm">
                          <option value="">—</option>
                          {users.map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.nom}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-text-secondary mb-1">{t("deadline")}</label>
                        <Input
                          name="dateEcheance"
                          type="date"
                          defaultValue={
                            task.dateEcheance ? new Date(task.dateEcheance).toISOString().slice(0, 10) : ""
                          }
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit">{tc("save")}</Button>
                      <Button type="button" variant="secondary" onClick={() => setEditingId(null)}>
                        {tc("cancel")}
                      </Button>
                    </div>
                  </form>
                </li>
              ) : (
                <li
                  key={task.id}
                  className="flex items-center justify-between gap-2 py-2 px-3 rounded-safe-sm border border-neutral-border hover:bg-neutral-surface/30"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-neutral-text-primary truncate">{task.titre}</p>
                    <p className="text-xs text-neutral-muted">
                      {PRIORITE_LABELS[task.priorite] ?? task.priorite} · {STATUT_LABELS[task.statut] ?? task.statut}
                      {task.assignee && ` · ${task.assignee.nom}`}
                      {task.dateEcheance && ` · ${t("deadline")} ${formatDate(task.dateEcheance)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditingId(task.id)}
                      className="p-2 text-neutral-muted hover:text-primary-700 rounded"
                      aria-label={tc("edit")}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <form action={deleteDossierTache.bind(null, task.id)} className="inline">
                      <button
                        type="submit"
                        className="p-2 text-neutral-muted hover:text-red-600 rounded"
                        aria-label={tc("delete")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </li>
              )
            )}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
