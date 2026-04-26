"use client";

import { useEffect, useState, useCallback } from "react";
import { X, RotateCcw, Eye, EyeOff, Clock, User, Tag, Plus, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface Version {
  id: string;
  versionNumber: number;
  label: string | null;
  createdAt: string;
  createdBy: { nom: string };
}

interface Props {
  documentId: string;
  onClose: () => void;
  onRestore: (content: string) => void;
}

export function VersionsPanel({ documentId, onClose, onRestore }: Props) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [snapshotLabel, setSnapshotLabel] = useState("");
  const [isSnapshotting, setIsSnapshotting] = useState(false);
  const [showSnapshotInput, setShowSnapshotInput] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVersions = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/edition/documents/${documentId}/versions`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data);
      } else {
        setError("Impossible de charger les versions.");
      }
    } catch {
      setError("Erreur réseau.");
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  async function handleRestore(version: Version) {
    if (restoringId) return;
    const confirmed = window.confirm(
      `Restaurer la version ${version.versionNumber}${version.label ? ` — ${version.label}` : ""} ?\n\nL'état actuel sera sauvegardé automatiquement avant la restauration.`
    );
    if (!confirmed) return;

    setRestoringId(version.id);
    try {
      const res = await fetch(
        `/api/edition/documents/${documentId}/versions/${version.id}/restore`,
        { method: "POST" }
      );
      if (res.ok) {
        const data = await res.json();
        onRestore(data.restoredContent);
        await fetchVersions(); // Refresh the list
      } else {
        setError("Erreur lors de la restauration.");
      }
    } catch {
      setError("Erreur réseau lors de la restauration.");
    } finally {
      setRestoringId(null);
    }
  }

  async function handleSnapshot() {
    setIsSnapshotting(true);
    try {
      const res = await fetch(`/api/edition/documents/${documentId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: snapshotLabel.trim() || undefined }),
      });
      if (res.ok) {
        setSnapshotLabel("");
        setShowSnapshotInput(false);
        await fetchVersions();
      } else {
        setError("Erreur lors du snapshot.");
      }
    } catch {
      setError("Erreur réseau.");
    } finally {
      setIsSnapshotting(false);
    }
  }

  // Determines badge color based on label content
  function getVersionBadge(version: Version) {
    const label = version.label ?? "";
    if (label.startsWith("Restauré")) return "bg-purple-100 text-purple-700";
    if (label.startsWith("Avant restauration")) return "bg-orange-100 text-orange-700";
    if (label.startsWith("Terminé")) return "bg-green-100 text-green-700";
    if (label === "Version initiale") return "bg-blue-100 text-blue-700";
    return "bg-gray-100 text-gray-600";
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Panel slide-over */}
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white border-l border-[var(--safe-neutral-border)] shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--safe-neutral-border)]">
          <div>
            <h2 className="font-semibold text-[var(--safe-text-title)] text-sm">
              Historique des versions
            </h2>
            <p className="text-xs text-[var(--safe-text-secondary)] mt-0.5">
              {versions.length} version{versions.length !== 1 ? "s" : ""} sauvegardée{versions.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[var(--safe-neutral-bg)] text-[var(--safe-text-secondary)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Snapshot manuel */}
        <div className="px-4 py-3 border-b border-[var(--safe-neutral-border)] bg-[var(--safe-neutral-bg)]">
          {showSnapshotInput ? (
            <div className="space-y-2">
              <input
                type="text"
                value={snapshotLabel}
                onChange={(e) => setSnapshotLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSnapshot()}
                placeholder="Ex: Avant envoi au client"
                className="w-full text-sm border border-[var(--safe-neutral-border)] rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--safe-primary)] focus:border-transparent bg-white"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSnapshot}
                  disabled={isSnapshotting}
                  className="flex-1 flex items-center justify-center gap-1.5 text-xs bg-[var(--safe-primary)] text-white rounded-lg px-3 py-1.5 hover:bg-[var(--safe-primary-dark)] disabled:opacity-50 transition-colors"
                >
                  {isSnapshotting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  Créer le snapshot
                </button>
                <button
                  onClick={() => { setShowSnapshotInput(false); setSnapshotLabel(""); }}
                  className="text-xs text-[var(--safe-text-secondary)] hover:bg-white rounded-lg px-3 py-1.5 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowSnapshotInput(true)}
              className="w-full flex items-center justify-center gap-1.5 text-xs text-[var(--safe-text-secondary)] hover:text-[var(--safe-primary)] border border-dashed border-[var(--safe-neutral-border)] rounded-lg px-3 py-2 hover:border-[var(--safe-primary)] transition-colors bg-white"
            >
              <Plus className="w-3.5 h-3.5" />
              Créer un snapshot manuel
            </button>
          )}
        </div>

        {/* Erreur */}
        {error && (
          <div className="mx-4 mt-3 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            {error}
            <button onClick={() => setError(null)} className="ml-2 underline">
              Fermer
            </button>
          </div>
        )}

        {/* Liste des versions */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--safe-text-secondary)]" />
            </div>
          ) : versions.length === 0 ? (
            <div className="py-16 text-center px-6">
              <Clock className="w-8 h-8 text-[var(--safe-neutral-border)] mx-auto mb-2" />
              <p className="text-sm text-[var(--safe-text-secondary)]">
                Aucune version sauvegardée.
              </p>
              <p className="text-xs text-[var(--safe-text-secondary)] mt-1">
                Les versions se créent automatiquement lors des actions importantes.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--safe-neutral-border)]">
              {versions.map((version, index) => (
                <div
                  key={version.id}
                  className={`px-4 py-3 hover:bg-[var(--safe-neutral-bg)] transition-colors ${
                    index === 0 ? "bg-blue-50/40" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      {/* Version number + label */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono font-bold text-[var(--safe-text-title)]">
                          v{version.versionNumber}
                        </span>
                        {index === 0 && (
                          <span className="text-xs bg-[var(--safe-primary)] text-white px-1.5 py-0.5 rounded-full">
                            Actuelle
                          </span>
                        )}
                      </div>

                      {/* Label badge */}
                      {version.label && (
                        <div className="flex items-center gap-1 mb-1.5">
                          <Tag className="w-3 h-3 text-[var(--safe-text-secondary)] shrink-0" />
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${getVersionBadge(version)}`}>
                            {version.label}
                          </span>
                        </div>
                      )}

                      {/* Meta */}
                      <div className="flex items-center gap-3 text-xs text-[var(--safe-text-secondary)]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(version.createdAt), {
                            locale: fr,
                            addSuffix: true,
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {version.createdBy.nom}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Preview toggle */}
                      <button
                        onClick={() =>
                          setPreviewId(previewId === version.id ? null : version.id)
                        }
                        className="p-1.5 rounded hover:bg-[var(--safe-neutral-border)] text-[var(--safe-text-secondary)] transition-colors"
                        title="Aperçu"
                      >
                        {previewId === version.id ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Restore — masqué pour la version la plus récente */}
                      {index !== 0 && (
                        <button
                          onClick={() => handleRestore(version)}
                          disabled={!!restoringId}
                          className="p-1.5 rounded hover:bg-purple-100 text-[var(--safe-text-secondary)] hover:text-purple-700 transition-colors disabled:opacity-50"
                          title="Restaurer cette version"
                        >
                          {restoringId === version.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RotateCcw className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Preview zone */}
                  {previewId === version.id && (
                    <VersionPreview documentId={documentId} versionId={version.id} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-[var(--safe-neutral-border)] bg-[var(--safe-neutral-bg)]">
          <p className="text-xs text-[var(--safe-text-secondary)] text-center">
            Les versions sont conservées indéfiniment — obligation Barreau du Québec
          </p>
        </div>
      </div>
    </>
  );
}

// ── Composant d'aperçu d'une version
function VersionPreview({
  documentId,
  versionId,
}: {
  documentId: string;
  versionId: string;
}) {
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/edition/documents/${documentId}/versions`);
        if (res.ok) {
          const versions: (Version & { content: string })[] = await res.json();
          const v = versions.find((v) => v.id === versionId);
          if (v) setContent(v.content);
        }
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [documentId, versionId]);

  if (isLoading) {
    return (
      <div className="mt-2 flex items-center justify-center py-4">
        <Loader2 className="w-4 h-4 animate-spin text-[var(--safe-text-secondary)]" />
      </div>
    );
  }

  if (!content) return null;

  // Extraire le texte brut depuis le JSON Tiptap
  function extractText(json: string): string {
    try {
      const doc = JSON.parse(json);
      const lines: string[] = [];
      function traverse(node: { type?: string; text?: string; content?: unknown[] }) {
        if (node.text) lines.push(node.text);
        if (node.content) (node.content as typeof node[]).forEach(traverse);
      }
      traverse(doc);
      return lines.join(" ").slice(0, 300) + (lines.join(" ").length > 300 ? "…" : "");
    } catch {
      return json.slice(0, 300);
    }
  }

  const preview = extractText(content);

  return (
    <div className="mt-2 p-3 bg-white border border-[var(--safe-neutral-border)] rounded-lg">
      <p className="text-xs text-[var(--safe-text-secondary)] leading-relaxed line-clamp-4">
        {preview || <em>Document vide</em>}
      </p>
    </div>
  );
}
