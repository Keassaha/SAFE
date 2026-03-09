"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { createDossierNote } from "@/app/(app)/dossiers/actions";

interface DossierNoteItem {
  id: string;
  content: string;
  createdAt: Date;
  createdByNom: string | null;
}

interface DossierNotesProps {
  dossierId: string;
  notes: DossierNoteItem[];
  descriptionConfidentielle: string | null;
  notesStrategieJuridique: string | null;
  canEditSensitive?: boolean;
}

export function DossierNotes({
  dossierId,
  notes,
  descriptionConfidentielle,
  notesStrategieJuridique,
}: DossierNotesProps) {
  const t = useTranslations("matters");
  const tc = useTranslations("common");
  const [showAdd, setShowAdd] = useState(false);

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

  const hasConfidentialContent =
    (descriptionConfidentielle?.trim().length ?? 0) > 0 ||
    (notesStrategieJuridique?.trim().length ?? 0) > 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title={t("matterNotes")}
          action={
            <Button type="button" onClick={() => setShowAdd((v) => !v)}>
              {showAdd ? tc("cancel") : `+ ${t("addNote")}`}
            </Button>
          }
        />
        <CardContent className="space-y-4">
          {showAdd && (
            <form
              action={createDossierNote}
              className="rounded-lg border border-neutral-border p-4 space-y-3 bg-neutral-surface/30"
            >
              <input type="hidden" name="dossierId" value={dossierId} />
              <div>
                <label
                  htmlFor="note-content"
                  className="block text-sm font-medium text-neutral-text-secondary mb-1"
                >
                  {t("noteContent")}
                </label>
                <textarea
                  id="note-content"
                  name="content"
                  rows={4}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-neutral-border bg-white text-sm focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none transition-all"
                  placeholder={t("notePlaceholder")}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">{t("saveNote")}</Button>
                <Button type="button" variant="secondary" onClick={() => setShowAdd(false)}>
                  {tc("cancel")}
                </Button>
              </div>
            </form>
          )}

          {notes.length === 0 && !showAdd ? (
            <p className="text-sm text-neutral-muted">{t("noNotesYet")}</p>
          ) : (
            <ul className="space-y-3">
              {notes.map((note) => (
                <li
                  key={note.id}
                  className="rounded-lg border border-neutral-border p-3 bg-white/80 text-sm"
                >
                  <p className="text-neutral-text-secondary whitespace-pre-wrap">{note.content}</p>
                  <p className="mt-2 text-xs text-neutral-muted">
                    {formatDate(note.createdAt)}
                    {note.createdByNom ? ` — ${note.createdByNom}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {!hasConfidentialContent && (
        <Card>
          <CardHeader title={t("confidentialNotes")} />
          <CardContent>
            <p className="text-sm text-neutral-muted">{t("noConfidentialNotes")}</p>
          </CardContent>
        </Card>
      )}

      {hasConfidentialContent && (
        <div className="space-y-4">
          {descriptionConfidentielle?.trim() && (
            <Card>
              <CardHeader title={t("confidentialDescriptionTitle")} />
              <CardContent>
                <p className="text-sm text-neutral-text-secondary whitespace-pre-wrap">
                  {descriptionConfidentielle}
                </p>
              </CardContent>
            </Card>
          )}
          {notesStrategieJuridique?.trim() && (
            <Card>
              <CardHeader title={t("legalStrategyNotesTitle")} />
              <CardContent>
                <p className="text-sm text-neutral-text-secondary whitespace-pre-wrap">
                  {notesStrategieJuridique}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
