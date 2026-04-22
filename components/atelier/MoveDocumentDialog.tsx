"use client";

import { useState } from "react";
import { X, FolderOpen, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Dossier {
  id: string;
  intitule: string;
  clientNom: string;
  numeroDossier?: string | null;
}

interface Props {
  documentId: string;
  documentTitre: string;
  currentDossierId: string;
  dossiers: Dossier[];
  onClose: () => void;
  onSuccess: (targetDossierId: string, targetIntitule: string) => void;
}

export function MoveDocumentDialog({
  documentId,
  documentTitre,
  currentDossierId,
  dossiers,
  onClose,
  onSuccess,
}: Props) {
  const [selectedId, setSelectedId] = useState<string>("");
  const [search, setSearch] = useState("");
  const [isMoving, setIsMoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = dossiers.filter(
    (d) =>
      d.id !== currentDossierId &&
      (d.intitule.toLowerCase().includes(search.toLowerCase()) ||
        d.clientNom.toLowerCase().includes(search.toLowerCase()))
  );

  async function handleMove() {
    if (!selectedId) return;
    setIsMoving(true);
    setError(null);
    try {
      const res = await fetch(`/api/atelier/documents/${documentId}/move`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetDossierId: selectedId }),
      });
      if (res.ok) {
        const data = await res.json();
        onSuccess(selectedId, data.targetDossier.intitule);
      } else {
        const err = await res.json();
        setError(err.error ?? "Erreur lors du déplacement");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setIsMoving(false);
    }
  }

  const target = dossiers.find((d) => d.id === selectedId);

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--safe-neutral-border)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[var(--safe-primary)]/10 flex items-center justify-center">
              <FolderOpen className="w-4 h-4 text-[var(--safe-primary)]" />
            </div>
            <div>
              <p className="font-semibold text-[var(--safe-text-title)] text-sm">Déplacer le document</p>
              <p className="text-xs text-[var(--safe-text-secondary)] truncate max-w-[240px]">{documentTitre}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--safe-neutral-bg)]">
            <X className="w-4 h-4 text-[var(--safe-text-secondary)]" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Recherche */}
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un dossier..."
            className="w-full text-sm border border-[var(--safe-neutral-border)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--safe-primary)]"
            autoFocus
          />

          {/* Liste dossiers */}
          <div className="max-h-64 overflow-y-auto space-y-1 -mx-1 px-1">
            {filtered.length === 0 ? (
              <p className="text-sm text-[var(--safe-text-secondary)] text-center py-6">
                Aucun autre dossier disponible
              </p>
            ) : (
              filtered.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelectedId(d.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-colors ${
                    selectedId === d.id
                      ? "bg-[var(--safe-primary)] text-white"
                      : "hover:bg-[var(--safe-neutral-bg)]"
                  }`}
                >
                  <FolderOpen
                    className={`w-4 h-4 shrink-0 ${
                      selectedId === d.id ? "text-white" : "text-[var(--safe-text-secondary)]"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${selectedId === d.id ? "text-white" : "text-[var(--safe-text-title)]"}`}>
                      {d.intitule}
                    </p>
                    <p className={`text-xs truncate ${selectedId === d.id ? "text-white/70" : "text-[var(--safe-text-secondary)]"}`}>
                      {d.clientNom}
                      {d.numeroDossier && ` · #${d.numeroDossier}`}
                    </p>
                  </div>
                  {selectedId === d.id && <CheckCircle className="w-4 h-4 text-white shrink-0" />}
                </button>
              ))
            )}
          </div>

          {/* Aperçu du déplacement */}
          {target && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--safe-neutral-bg)] text-sm">
              <span className="text-[var(--safe-text-secondary)] truncate flex-1">Dossier actuel</span>
              <ArrowRight className="w-4 h-4 text-[var(--safe-primary)] shrink-0" />
              <span className="font-medium text-[var(--safe-primary)] truncate flex-1 text-right">
                {target.intitule}
              </span>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-[var(--safe-neutral-border)]">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm border border-[var(--safe-neutral-border)] rounded-xl hover:bg-[var(--safe-neutral-bg)] transition-colors text-[var(--safe-text-secondary)]"
          >
            Annuler
          </button>
          <Button
            onClick={handleMove}
            disabled={!selectedId || isMoving}
            className="flex-1 flex items-center justify-center gap-2"
          >
            {isMoving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Déplacement...</>
            ) : (
              <><FolderOpen className="w-4 h-4" /> Déplacer</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
