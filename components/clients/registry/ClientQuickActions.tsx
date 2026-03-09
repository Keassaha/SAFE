"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Phone, Mail, Download } from "lucide-react";

interface ClientQuickActionsProps {
  email: string | null;
  telephone: string | null;
  clientId: string;
  clientName: string;
}

export function ClientQuickActions({
  email,
  telephone,
  clientId,
  clientName,
}: ClientQuickActionsProps) {
  const t = useTranslations("clients");
  const exportHref = `/api/clients/${clientId}/export-dossier`;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {telephone && (
        <a
          href={`tel:${telephone.replace(/\s/g, "")}`}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-border bg-white text-neutral-text-secondary hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200 transition-colors text-sm font-medium"
        >
          <Phone className="w-4 h-4" />
          {t("call")}
        </a>
      )}
      {email && (
        <a
          href={`mailto:${email}`}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-border bg-white text-neutral-text-secondary hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200 transition-colors text-sm font-medium"
        >
          <Mail className="w-4 h-4" />
          {t("emailAction")}
        </a>
      )}
      <Link
        href={exportHref}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-border bg-white text-neutral-text-secondary hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200 transition-colors text-sm font-medium"
      >
        <Download className="w-4 h-4" />
        {t("exportDossier")}
      </Link>
    </div>
  );
}
