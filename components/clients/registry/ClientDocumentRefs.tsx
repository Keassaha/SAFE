"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { FileText } from "lucide-react";

export type DocumentRefsMap = {
  retainer_agreement?: string;
  id_documents?: string;
  court_documents?: string;
  client_correspondence?: string;
  [key: string]: string | undefined;
};

interface ClientDocumentRefsProps {
  documentRefsJson: string | null;
  baseDownloadUrl?: string;
}

export function ClientDocumentRefs({
  documentRefsJson,
  baseDownloadUrl = "/api/documents",
}: ClientDocumentRefsProps) {
  const t = useTranslations("clients");

  const LABELS: Record<string, string> = {
    retainer_agreement: t("retainerAgreement"),
    id_documents: t("idDocuments"),
    court_documents: t("courtDocuments"),
    client_correspondence: t("clientCorrespondence"),
  };

  let refs: DocumentRefsMap = {};
  if (documentRefsJson) {
    try {
      refs = JSON.parse(documentRefsJson) as DocumentRefsMap;
    } catch {
      refs = {};
    }
  }

  const entries = Object.entries(refs).filter(([, id]) => id);

  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader title={t("keyDocuments")} />
        <CardContent>
          <p className="text-sm text-neutral-muted">
            {t("noDocumentRefs")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title={t("keyDocuments")} />
      <CardContent>
        <ul className="space-y-2">
          {entries.map(([key, docId]) => (
            <li key={key}>
              <Link
                href={`${baseDownloadUrl}/${docId}/download`}
                className="inline-flex items-center gap-2 text-sm text-primary-700 hover:underline"
              >
                <FileText className="w-4 h-4 shrink-0" />
                {LABELS[key] ?? key}
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
