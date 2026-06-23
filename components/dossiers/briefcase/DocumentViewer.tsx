"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Edit, FileText, AlertCircle, Download, Loader } from "lucide-react";

export interface DocumentViewerProps {
  dossierId: string;
  itemId: string | null;
  onEdit: (itemId: string) => void;
}

export function DocumentViewer({ dossierId, itemId, onEdit }: DocumentViewerProps) {
  const t = useTranslations("miscUi");
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
      <div className="flex flex-1 items-center justify-center bg-si-surface">
        <div className="text-center">
          <FileText className="mx-auto h-12 w-12 text-si-muted/50" />
          <p className="mt-4 text-sm font-medium text-si-muted">
            {t("selectDocumentToView")}
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-si-surface">
        <div className="text-center">
          <Loader className="mx-auto h-8 w-8 animate-spin text-si-muted/60" />
          <p className="mt-4 text-sm text-si-muted">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="flex flex-1 flex-col bg-si-surface p-6 lg:border-l lg:border-si-line">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-si-ink">{t("documentNotFound")}</h2>
          </div>
          <button
            onClick={() => onEdit(itemId)}
            className="inline-flex items-center gap-2 rounded-lg border border-si-line bg-si-surface px-3 py-2 text-sm font-medium text-si-ink hover:bg-si-canvas transition-colors"
          >
            <Edit className="h-4 w-4" />
            {t("create")}
          </button>
        </div>

        <div className="mt-6 flex flex-1 items-center justify-center rounded-xl border border-dashed border-si-line bg-si-canvas">
          <div className="text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-si-muted/60" />
            <p className="mt-4 text-sm text-si-muted">
              {t("documentDoesNotExistYet")}
            </p>
            <p className="mt-2 text-xs text-si-muted">
              {t("clickCreateToAddDocument")}
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
    <div className="flex flex-1 flex-col bg-si-surface p-6 lg:border-l lg:border-si-line overflow-y-auto">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-si-ink">{title}</h2>
          <p className="mt-1 text-sm text-si-muted">{t("typeLabel", { type: docType })}</p>
          <p className="mt-1 text-xs text-si-muted">
            {t("createdOn", { date: new Date(document.createdAt).toLocaleDateString("fr-CA") })}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {!isRichDocument && (
            <a
              href={`/api/documents/download/${document.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-si-line bg-si-surface px-3 py-2 text-sm font-medium text-si-ink hover:bg-si-canvas transition-colors"
            >
              <Download className="h-4 w-4" />
              {t("download")}
            </a>
          )}
          <button
            onClick={() => onEdit(itemId)}
            className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition-colors"
          >
            <Edit className="h-4 w-4" />
            {t("edit")}
          </button>
        </div>
      </div>

      {/* Document content */}
      <div className="mt-6 flex-1 rounded-xl border border-si-line bg-si-canvas p-4">
        {isRichDocument ? (
          <div className="prose prose-sm max-w-none text-si-ink">
            {/* Placeholder for rich document content rendering */}
            <div className="text-sm text-si-muted">
              <p className="mb-2 font-medium">{t("documentContent")}</p>
              <div className="rounded bg-si-surface p-3 font-mono text-xs">
                {document.content
                  ? t("tiptapContent", { count: (document.content as string).length })
                  : t("emptyDocument")}
              </div>
              <p className="mt-3 text-xs text-si-muted">
                {t("statusLabel")} <span className="font-medium">{document.statut}</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="flex h-96 flex-col items-center justify-center">
            <FileText className="h-16 w-16 text-si-muted/50" />
            <p className="mt-4 text-sm text-si-muted">
              {t("fileLabel", { name: document.nom })}
            </p>
            <p className="mt-2 text-xs text-si-muted">
              {t("formatLabel", { format: document.mimeType })}
            </p>
            <a
              href={`/api/documents/download/${document.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-si-forest px-4 py-2 text-sm font-medium text-white hover:bg-si-forest-soft transition-colors"
            >
              <Download className="h-4 w-4" />
              {t("downloadFile")}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
