"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { CheckCircle, X } from "lucide-react";

export function ClientSuccessBanner() {
  const searchParams = useSearchParams();
  const t = useTranslations("clients");
  const tc = useTranslations("common");
  const success = searchParams.get("success");

  const MESSAGES: Record<string, string> = {
    created: t("clientCreatedSuccess"),
    archived: t("clientArchivedSuccess"),
  };

  const message = success ? MESSAGES[success] : null;

  if (!message) return null;

  const urlWithoutSuccess = new URLSearchParams(searchParams.toString());
  urlWithoutSuccess.delete("success");
  const clearHref = `/clients?${urlWithoutSuccess.toString()}`;

  return (
    <div className="rounded-xl border border-status-success bg-status-success-bg px-4 py-3 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 text-status-success">
        <CheckCircle className="w-5 h-5 shrink-0" />
        <p className="text-sm font-medium">{message}</p>
      </div>
      <Link
        href={clearHref}
        className="p-1 rounded text-neutral-muted hover:text-neutral-text-primary"
        aria-label={tc("close")}
      >
        <X className="w-4 h-4" />
      </Link>
    </div>
  );
}
