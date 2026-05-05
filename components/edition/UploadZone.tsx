"use client";

import { useCallback, useRef, useState } from "react";
import {
  Upload, FileText, FileImage, File,
  Sparkles, CheckCircle, XCircle, Loader2, X
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Dossier {
  id: string;
  intitule: string;
  clientNom: string;
  numeroDossier?: string | null;
}

interface UploadedFile {
  id: string;
  nom: string;
  mimeType: string;
  sizeBytes: number;
}

interface ClassificationResult {
  dossierId: string | null;
  clientNom: string;
  dossierIntitule: string;
  documentType: string;
  confidence: number;
  reasoning: string;
  suggestedTitre: string;
  suggestedSectionKey?: string;
  suggestedSubtype?: string;
  docketMode?: string;
  needsReview?: boolean;
  practiceReason?: string;
}

interface PendingUpload {
  file: File;
  status: "uploading" | "classifying" | "pending_validation" | "confirmed" | "error";
  uploadedDoc?: UploadedFile;
  classification?: ClassificationResult | null;
  error?: string;
  // Valeurs éditables dans le dialog
  selectedDossierId?: string;
  selectedType?: string;
  customTitre?: string;
}

interface Props {
  dossiers: Dossier[]; // Pour le fallback manuel
  currentDossierId?: string; // Pré-sélectionné si dans un dossier
  currentClientId?: string;
  onSuccess?: (documentId: string, dossierId: string) => void;
}

const ACCEPTED_TYPES = ".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp";
const MAX_SIZE_MB = 25;

const DOC_TYPES = [
  { value: "note", label: "Note interne" },
  { value: "lettre", label: "Lettre" },
  { value: "contrat", label: "Contrat" },
  { value: "procedure", label: "Procédure" },
  { value: "requete", label: "Requête" },
  { value: "autre", label: "Autre" },
];

function fileIcon(mime: string) {
  if (mime.startsWith("image/")) return <FileImage className="w-5 h-5 text-blue-500" />;
  if (mime === "application/pdf") return <FileText className="w-5 h-5 text-red-500" />;
  return <File className="w-5 h-5 text-gray-500" />;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function ConfidenceBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? "bg-green-100 text-green-700" :
    score >= 60 ? "bg-yellow-100 text-yellow-700" :
    "bg-red-100 text-red-700";
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>
      {score}% confiance
    </span>
  );
}

export function UploadZone({ dossiers, currentDossierId, currentClientId, onSuccess }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<PendingUpload[]>([]);

  const updateUpload = (idx: number, patch: Partial<PendingUpload>) =>
    setUploads((prev) => prev.map((u, i) => (i === idx ? { ...u, ...patch } : u)));

  const processFile = useCallback(
    async (file: File, idx: number) => {
      // Vérifier taille
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        updateUpload(idx, { status: "error", error: `Fichier trop volumineux (max ${MAX_SIZE_MB} Mo)` });
        return;
      }

      // Upload
      updateUpload(idx, { status: "uploading" });
      const formData = new FormData();
      formData.append("file", file);
      formData.append("classify", "true");

      try {
        const res = await fetch("/api/edition/upload", { method: "POST", body: formData });
        if (!res.ok) {
          const err = await res.json();
          updateUpload(idx, { status: "error", error: err.error ?? "Erreur upload" });
          return;
        }

        const data = await res.json();
        const classification: ClassificationResult | null = data.classification;

        updateUpload(idx, {
          status: "pending_validation",
          uploadedDoc: data.document,
          classification,
          // Pré-remplir les valeurs
          selectedDossierId: classification?.dossierId ?? currentDossierId ?? "",
          selectedType: classification?.documentType ?? "autre",
          customTitre: classification?.suggestedTitre ?? file.name,
        });
      } catch {
        updateUpload(idx, { status: "error", error: "Erreur réseau" });
      }
    },
    [currentDossierId]
  );

  const handleFiles = (files: FileList | File[]) => {
    const arr = Array.from(files);
    const startIdx = uploads.length;
    setUploads((prev) => [
      ...prev,
      ...arr.map((f) => ({ file: f, status: "uploading" as const })),
    ]);
    arr.forEach((f, i) => processFile(f, startIdx + i));
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const confirmUpload = async (idx: number) => {
    const u = uploads[idx];
    if (!u.uploadedDoc || !u.selectedDossierId) return;

    const dossier = dossiers.find((d) => d.id === u.selectedDossierId);
    const clientId = currentClientId ?? dossier?.id ?? "";

    updateUpload(idx, { status: "uploading" });

    try {
      const res = await fetch("/api/edition/upload/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: u.uploadedDoc.id,
          dossierId: u.selectedDossierId,
          clientId,
          documentType: u.selectedType,
          nom: u.customTitre,
          iaConfidence: u.classification?.confidence,
          iaValidated: !!u.classification,
        }),
      });

      if (res.ok) {
        updateUpload(idx, { status: "confirmed" });
        onSuccess?.(u.uploadedDoc.id, u.selectedDossierId);
      } else {
        updateUpload(idx, { status: "error", error: "Erreur confirmation" });
      }
    } catch {
      updateUpload(idx, { status: "error", error: "Erreur réseau" });
    }
  };

  const removeUpload = (idx: number) =>
    setUploads((prev) => prev.filter((_, i) => i !== idx));

  return (
    <div className="space-y-4">
      {/* Zone de drop */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? "border-[var(--safe-primary)] bg-[var(--safe-primary)]/5 scale-[1.01]"
            : "border-[var(--safe-neutral-border)] hover:border-[var(--safe-primary)] hover:bg-[var(--safe-neutral-bg)]"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        <Upload className="w-8 h-8 text-[var(--safe-text-secondary)] mx-auto mb-3" />
        <p className="font-medium text-[var(--safe-text-title)] text-sm">
          Glissez vos documents ici ou cliquez pour choisir
        </p>
        <p className="text-xs text-[var(--safe-text-secondary)] mt-1">
          PDF, Word, TXT, Images — max {MAX_SIZE_MB} Mo
        </p>
        <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-[var(--safe-primary)]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Classification automatique par IA</span>
        </div>
      </div>

      {/* Liste des fichiers en cours / à valider */}
      {uploads.length > 0 && (
        <div className="space-y-3">
          {uploads.map((u, idx) => (
            <UploadCard
              key={idx}
              upload={u}
              dossiers={dossiers}
              onConfirm={() => confirmUpload(idx)}
              onRemove={() => removeUpload(idx)}
              onUpdate={(patch) => updateUpload(idx, patch)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function UploadCard({
  upload,
  dossiers,
  onConfirm,
  onRemove,
  onUpdate,
}: {
  upload: PendingUpload;
  dossiers: Dossier[];
  onConfirm: () => void;
  onRemove: () => void;
  onUpdate: (patch: Partial<PendingUpload>) => void;
}) {
  const { file, status, classification, uploadedDoc } = upload;

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${
      status === "confirmed" ? "border-green-200 bg-green-50" :
      status === "error" ? "border-red-200 bg-red-50" :
      "border-[var(--safe-neutral-border)] bg-white"
    }`}>
      {/* Header fichier */}
      <div className="flex items-center gap-3">
        {uploadedDoc ? fileIcon(uploadedDoc.mimeType) : <File className="w-5 h-5 text-gray-400" />}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--safe-text-title)] truncate">{file.name}</p>
          <p className="text-xs text-[var(--safe-text-secondary)]">
            {formatBytes(file.size)}
          </p>
        </div>
        {(status === "confirmed" || status === "error") && (
          <button onClick={onRemove} className="p-1 rounded hover:bg-black/5">
            <X className="w-4 h-4 text-[var(--safe-text-secondary)]" />
          </button>
        )}
      </div>

      {/* États */}
      {(status === "uploading" || status === "classifying") && (
        <div className="flex items-center gap-2 text-sm text-[var(--safe-text-secondary)]">
          <Loader2 className="w-4 h-4 animate-spin" />
          {status === "uploading" ? "Upload en cours..." : "Analyse IA en cours..."}
        </div>
      )}

      {status === "confirmed" && (
        <div className="flex items-center gap-2 text-sm text-green-700">
          <CheckCircle className="w-4 h-4" />
          Classé dans <strong>{dossiers.find(d => d.id === upload.selectedDossierId)?.intitule ?? "le dossier"}</strong>
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center gap-2 text-sm text-red-700">
          <XCircle className="w-4 h-4" />
          {upload.error}
        </div>
      )}

      {/* Validation IA */}
      {status === "pending_validation" && (
        <div className="space-y-3 pt-1 border-t border-[var(--safe-neutral-border)]">
          {/* Suggestion IA */}
          {classification ? (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-[var(--safe-primary)]/5 border border-[var(--safe-primary)]/20">
              <Sparkles className="w-4 h-4 text-[var(--safe-primary)] mt-0.5 shrink-0" />
              <div className="flex-1 text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[var(--safe-text-title)]">
                    IA suggère : {classification.dossierIntitule}
                  </span>
                  <ConfidenceBadge score={classification.confidence} />
                </div>
                <p className="text-xs text-[var(--safe-text-secondary)]">{classification.reasoning}</p>
                {classification.suggestedSectionKey ? (
                  <p className="text-xs text-[var(--safe-text-secondary)]">
                    Section suggérée : <span className="font-medium">{classification.suggestedSectionKey}</span>
                    {classification.suggestedSubtype ? ` · ${classification.suggestedSubtype}` : ""}
                    {classification.needsReview ? " · revue recommandée" : ""}
                  </p>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-[var(--safe-text-secondary)] p-2 bg-[var(--safe-neutral-bg)] rounded-lg">
              <Sparkles className="w-3.5 h-3.5" />
              Classification IA non disponible — sélectionnez manuellement
            </div>
          )}

          {/* Titre */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--safe-text-secondary)]">Titre du document</label>
            <input
              type="text"
              value={upload.customTitre ?? file.name}
              onChange={(e) => onUpdate({ customTitre: e.target.value })}
              className="w-full text-sm border border-[var(--safe-neutral-border)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--safe-primary)]"
            />
          </div>

          {/* Dossier */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--safe-text-secondary)]">Classer dans le dossier</label>
            <select
              value={upload.selectedDossierId ?? ""}
              onChange={(e) => onUpdate({ selectedDossierId: e.target.value })}
              className="w-full text-sm border border-[var(--safe-neutral-border)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--safe-primary)]"
            >
              <option value="">— Choisir un dossier —</option>
              {dossiers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.clientNom} · {d.intitule}
                  {d.numeroDossier ? ` (#${d.numeroDossier})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-[var(--safe-text-secondary)]">Type de document</label>
            <div className="flex flex-wrap gap-1.5">
              {DOC_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => onUpdate({ selectedType: t.value })}
                  className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                    upload.selectedType === t.value
                      ? "bg-[var(--safe-primary)] text-white"
                      : "bg-[var(--safe-neutral-bg)] text-[var(--safe-text-secondary)] hover:bg-[var(--safe-neutral-border)]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              onClick={onConfirm}
              disabled={!upload.selectedDossierId}
              className="flex-1 flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Confirmer et classer
            </Button>
            <button
              onClick={onRemove}
              className="px-3 py-2 text-sm text-[var(--safe-text-secondary)] border border-[var(--safe-neutral-border)] rounded-xl hover:bg-[var(--safe-neutral-bg)]"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
