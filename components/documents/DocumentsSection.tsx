"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils/format";

type DocumentWithUploader = {
  id: string;
  nom: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
  uploadedBy: { nom: string } | null;
};

export function DocumentsSection({
  dossierId,
  clientId,
  documents,
  canManage,
}: {
  dossierId?: string;
  clientId?: string;
  documents: DocumentWithUploader[];
  canManage: boolean;
}) {
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || (!dossierId && !clientId)) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      if (dossierId) formData.set("dossierId", dossierId);
      if (clientId) formData.set("clientId", clientId);
      formData.set("nom", file.name);
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error ?? "Erreur lors de l'upload");
        return;
      }
      window.location.reload();
    } finally {
      setUploading(false);
      setFile(null);
    }
  };

  return (
    <div className="space-y-4">
      {canManage && (dossierId || clientId) && (
        <form onSubmit={handleUpload} className="flex flex-wrap items-end gap-2">
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm text-neutral-muted file:mr-2 file:py-2 file:px-3 file:rounded-safe file:border-0 file:bg-primary-100 file:text-primary-800"
          />
          <Button type="submit" disabled={!file || uploading}>
            {uploading ? "Envoi…" : "Téléverser"}
          </Button>
        </form>
      )}
      {documents.length === 0 ? (
        <p className="text-sm text-neutral-muted">Aucun document.</p>
      ) : (
        <ul className="space-y-2">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between gap-2 py-2 border-b border-neutral-borderSubtle last:border-0"
            >
              <span className="text-sm font-medium truncate">{doc.nom}</span>
              <span className="text-xs text-neutral-muted shrink-0">
                {formatDate(doc.createdAt)} — {(doc.sizeBytes / 1024).toFixed(1)} Ko
              </span>
              <Link
                href={`/api/documents/${doc.id}/download`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary-600 hover:underline shrink-0"
              >
                Télécharger
              </Link>
              {canManage && (
                <DeleteDocumentButton documentId={doc.id} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function DeleteDocumentButton({ documentId }: { documentId: string }) {
  const [deleting, setDeleting] = useState(false);
  const handleDelete = async () => {
    if (!confirm("Supprimer ce document ?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/documents/${documentId}`, { method: "DELETE" });
      if (res.ok) window.location.reload();
      else alert("Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };
  return (
    <Button type="button" variant="danger" onClick={handleDelete} disabled={deleting}>
      {deleting ? "…" : "Supprimer"}
    </Button>
  );
}
