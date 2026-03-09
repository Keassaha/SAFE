"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  createDossierEvenement,
  updateDossierEvenement,
  deleteDossierEvenement,
} from "@/app/(app)/dossiers/actions";
import { Pencil, Trash2 } from "lucide-react";

export type DossierEvenementItem = {
  id: string;
  type: string;
  titre: string;
  date: Date;
  lieu: string | null;
  notes: string | null;
};

interface DossierEventsProps {
  dossierId: string;
  events: DossierEvenementItem[];
}

export function DossierEvents({ dossierId, events }: DossierEventsProps) {
  const t = useTranslations("matters");
  const tc = useTranslations("common");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const TYPE_LABELS: Record<string, string> = {
    audience: t("eventTypeHearing"),
    reunion_client: t("eventTypeClientMeeting"),
    echeance: t("eventTypeDeadline"),
    depot: t("eventTypeFiling"),
  };

  function formatDate(d: Date): string {
    return new Date(d).toLocaleDateString("fr-CA", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <Card>
      <CardHeader
        title={t("events")}
        action={
          <Button type="button" onClick={() => setShowAdd((v) => !v)}>
            {showAdd ? tc("cancel") : t("addEvent")}
          </Button>
        }
      />
      <CardContent className="space-y-4">
        {showAdd && (
          <form
            action={createDossierEvenement}
            className="rounded-lg border border-neutral-border p-4 space-y-3 bg-neutral-surface/30"
          >
            <input type="hidden" name="dossierId" value={dossierId} />
            <div>
              <label className="block text-sm font-medium text-neutral-text-secondary mb-1">{tc("type")}</label>
              <select
                name="type"
                required
                className="w-full h-10 px-3 rounded-lg border border-neutral-border bg-white text-sm"
              >
                <option value="audience">{t("eventTypeHearing")}</option>
                <option value="reunion_client">{t("eventTypeClientMeeting")}</option>
                <option value="echeance">{t("eventTypeDeadline")}</option>
                <option value="depot">{t("eventTypeFiling")}</option>
              </select>
            </div>
            <Input label={t("eventTitle")} name="titre" required placeholder="Ex. Audience préliminaire" />
            <Input label={t("eventDateTime")} name="date" type="datetime-local" required />
            <Input label={t("eventLocation")} name="lieu" placeholder={t("optional")} />
            <div>
              <label className="block text-sm font-medium text-neutral-text-secondary mb-1">{t("eventNotes")}</label>
              <textarea
                name="notes"
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-neutral-border bg-white text-sm"
                placeholder={t("optional")}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit">{tc("create")}</Button>
              <Button type="button" variant="secondary" onClick={() => setShowAdd(false)}>
                {tc("cancel")}
              </Button>
            </div>
          </form>
        )}

        {events.length === 0 && !showAdd ? (
          <p className="text-sm text-neutral-muted">{t("noEvents")}</p>
        ) : (
          <ul className="space-y-2">
            {events
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map((e) =>
                editingId === e.id ? (
                  <li key={e.id}>
                    <form
                      action={(fd) => updateDossierEvenement(e.id, fd)}
                      className="rounded-lg border border-primary-200 p-4 space-y-3 bg-primary-50/30"
                    >
                      <input type="hidden" name="dossierId" value={dossierId} />
                      <div>
                        <label className="block text-sm font-medium text-neutral-text-secondary mb-1">{tc("type")}</label>
                        <select name="type" defaultValue={e.type} required className="w-full h-10 px-3 rounded-lg border border-neutral-border bg-white text-sm">
                          <option value="audience">{t("eventTypeHearing")}</option>
                          <option value="reunion_client">{t("eventTypeClientMeeting")}</option>
                          <option value="echeance">{t("eventTypeDeadline")}</option>
                          <option value="depot">{t("eventTypeFiling")}</option>
                        </select>
                      </div>
                      <Input label={t("eventTitle")} name="titre" defaultValue={e.titre} required />
                      <Input
                        label={t("eventDateTime")}
                        name="date"
                        type="datetime-local"
                        required
                        defaultValue={
                          new Date(e.date).toISOString().slice(0, 16)
                        }
                      />
                      <Input label={t("eventLocation")} name="lieu" defaultValue={e.lieu ?? ""} />
                      <div>
                        <label className="block text-sm font-medium text-neutral-text-secondary mb-1">{t("eventNotes")}</label>
                        <textarea
                          name="notes"
                          rows={2}
                          defaultValue={e.notes ?? ""}
                          className="w-full px-3 py-2 rounded-lg border border-neutral-border bg-white text-sm"
                        />
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
                    key={e.id}
                    className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg border border-neutral-border hover:bg-neutral-surface/30"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-neutral-text-primary truncate">{e.titre}</p>
                      <p className="text-xs text-neutral-muted">
                        {TYPE_LABELS[e.type] ?? e.type} · {formatDate(e.date)}
                        {e.lieu && ` · ${e.lieu}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditingId(e.id)}
                        className="p-2 text-neutral-muted hover:text-primary-700 rounded"
                        aria-label={tc("edit")}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <form action={deleteDossierEvenement.bind(null, e.id)} className="inline">
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
