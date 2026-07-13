"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { X, Upload, ClipboardPaste, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

type Mode = "file" | "paste";

/**
 * Dialogue d'import d'un mandat existant. Deux sources :
 *   - Fichier Word (.docx, conversion fidèle) / PDF / .txt (texte seul)
 *   - Copier-coller de texte
 * En cas de succès, remonte l'id du RichDocument créé (+ éventuel avertissement).
 */
export function ImportMandatDialog({
  dossierId,
  onClose,
  onImported,
}: {
  dossierId: string;
  onClose: () => void;
  onImported: (id: string, warning?: string) => void;
}) {
  const t = useTranslations("matterDetailUi");
  const [mode, setMode] = useState<Mode>("file");
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSubmit = mode === "file" ? !!file : text.trim().length > 0;

  const submit = async () => {
    if (!canSubmit || busy) return;
    setBusy(true);
    setError(null);
    try {
      let res: Response;
      if (mode === "file" && file) {
        const fd = new FormData();
        fd.append("file", file);
        res = await fetch(`/api/dossiers/${dossierId}/mandat/import`, { method: "POST", body: fd });
      } else {
        res = await fetch(`/api/dossiers/${dossierId}/mandat/import`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.id) throw new Error(data?.error ?? t("mandateImportError"));
      onImported(data.id, data.warning);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("mandateImportError"));
      setBusy(false);
    }
  };

  const tabClass = (active: boolean) =>
    `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      active ? "bg-si-primary/10 text-si-primary" : "text-si-muted hover:bg-si-line/40"
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <h3 className="text-base font-semibold text-si-ink">{t("mandateImportTitle")}</h3>
          <button onClick={onClose} className="rounded-md p-1 text-si-muted hover:bg-si-line/40" aria-label="Fermer">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex gap-2">
          <button type="button" className={tabClass(mode === "file")} onClick={() => setMode("file")}>
            <Upload className="h-4 w-4" />
            {t("mandateImportFileTab")}
          </button>
          <button type="button" className={tabClass(mode === "paste")} onClick={() => setMode("paste")}>
            <ClipboardPaste className="h-4 w-4" />
            {t("mandateImportPasteTab")}
          </button>
        </div>

        <div className="mt-4">
          {mode === "file" ? (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".docx,.doc,.pdf,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,text/plain"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full items-center gap-3 rounded-lg border border-dashed border-si-line px-4 py-6 text-left hover:border-si-primary/50 hover:bg-si-primary/5"
              >
                <FileText className="h-6 w-6 shrink-0 text-si-muted" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-si-ink">
                    {file ? file.name : t("mandateImportChoose")}
                  </span>
                  <span className="mt-0.5 block text-xs text-si-muted">{t("mandateImportFileHint")}</span>
                </span>
              </button>
            </div>
          ) : (
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={9}
              placeholder={t("mandateImportPastePlaceholder")}
              className="w-full resize-y rounded border border-si-line px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-si-primary/40"
            />
          )}
        </div>

        {error && <p className="mt-3 text-sm text-[#B84A3E]">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={busy}>
            {t("mandateImportCancel")}
          </Button>
          <Button type="button" variant="primary" onClick={submit} disabled={!canSubmit || busy} className="gap-2">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {busy ? t("mandateImporting") : t("mandateImportSubmit")}
          </Button>
        </div>
      </div>
    </div>
  );
}
