"use client";

import { useEffect, useState } from "react";
import { Edit, FileText, AlertCircle, Download, Loader } from "lucide-react";

export interface DocumentViewerProps {
  dossierId: string;
  itemId: string | null;
  onEdit: (itemId: string) => void;
}

export function DocumentViewer({ dossierId, itemId, onEdit }: DocumentViewerProps) {
  const [document, setDocument] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!itemId) {
      setDocument(null);
      return;
    }

    const fetchDocument = async () => {
      setLoading(true);
      try {
        const { getDocumentContent } = await import("@/lib/actions/dossier-briefcase");
        // Try as rich-document first, then as document
        let doc = await getDocumentContent(itemId, "rich-document");
        let type: "document" | "rich-document" = "rich-document";

        if (!doc) {
          doc = await getDocumentContent(itemId, "document");
          type = "document";
        }

        if (doc) {
          setDocument({ ...doc, _type: type });
        }
      } catch (error) {
        console.error("Failed to fetch document:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [itemId]);

  if (!itemId) {
    return (
      <div className="flex flex-1 items-center justify-center bg-white">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-slate-300" />
          <p className="mt-4 text-sm font-medium text-slate-600">
            Sélectionnez un document pour voir son contenu
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-white">
        <div className="text-center">
          <Loader className="mx-auto h-8 w-8 animate-spin text-slate-400" />
          <p className="mt-4 text-sm text-slate-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex flex-1 flex-col bg-white p-6 lg:border-l lg:border-slate-200/70">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Document non trouvé</h2>
          </div>
          <button
            onClick={() => onEdit(itemId)}
            className="inline-flex items-center gap-2 rounded-safe-sm border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Edit className="h-4 w-4" />
            Créer
          </button>
        </div>

        <div className="mt-6 flex flex-1 items-center justify-center rounded-safe border border-dashed border-slate-300 bg-slate-50">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-slate-400" />
            <p className="mt-4 text-sm text-slate-600">
              Ce document n'existe pas encore
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Cliquez sur "Créer" pour ajouter ce document
            </p>
          </div>
        </div>
      </div>
    );
  }

  const isRichDocument = document._type === "rich-document";
  const title = isRichDocument ? document.titre : document.nom;
  const docType = isRichDocument ? document.type : document.documentType;

  return (
    <div className="flex flex-1 flex-col bg-white p-6 lg:border-l lg:border-slate-200/70 overflow-y-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">Type: {docType}</p>
          <p className="mt-1 text-xs text-slate-500">
            Créé le {new Date(document.createdAt).toLocaleDateString("fr-CA")}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {!isRichDocument && (
            <a
              href={`/api/documents/download/${document.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-safe-sm border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Download className="h-4 w-4" />
              Télécharger
            </a>
          )}
          <button
            onClick={() => onEdit(itemId)}
            className="inline-flex items-center gap-2 rounded-safe-sm border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            <Edit className="h-4 w-4" />
            Éditer
          </button>
        </div>
      </div>

      {/* Document content */}
      <div className="mt-6 flex-1 rounded-safe border border-slate-200 bg-slate-50 p-4">
        {isRichDocument ? (
          <div className="prose prose-sm max-w-none text-slate-900">
            {/* Placeholder for rich document content rendering */}
            <div className="text-sm text-slate-600">
              <p className="mb-2 font-medium">Contenu du document :</p>
              <div className="rounded bg-white p-3 font-mono text-xs">
                {document.content
                  ? `[Contenu Tiptap — ${(document.content as string).length} caractères]`
                  : "[Document vide]"}
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Statut: <span className="font-medium">{document.statut}</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="flex h-96 flex-col items-center justify-center">
            <FileText className="h-16 w-16 text-slate-300" />
            <p className="mt-4 text-sm text-slate-600">
              Fichier: {document.nom}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Format: {document.mimeType}
            </p>
            <a
              href={`/api/documents/download/${document.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-safe-sm bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Télécharger le fichier
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
