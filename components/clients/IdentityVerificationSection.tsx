"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { formatDate } from "@/lib/utils/format";
import type { ClientIdentityVerification, Document } from "@prisma/client";
import { routes } from "@/lib/routes";

type VerificationWithDoc = ClientIdentityVerification & {
  document: Document | null;
};

export function IdentityVerificationSection({
  clientId,
  verifications,
  canManage,
}: {
  clientId: string;
  verifications: VerificationWithDoc[];
  canManage: boolean;
}) {
  const t = useTranslations("clients");

  if (verifications.length === 0) {
    return (
      <p className="text-sm text-neutral-muted">
        {t("noVerification")}
        {canManage && (
          <Link
            href={routes.clientVerificationIdentite(clientId)}
            className="ml-2 text-primary-600 hover:underline"
          >
            {t("addVerification")}
          </Link>
        )}
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {verifications.map((v) => (
        <li
          key={v.id}
          className="flex items-center justify-between gap-2 py-2 border-b border-neutral-borderSubtle last:border-0"
        >
          <span className="text-sm">
            {formatDate(v.date)} — {v.methode} —{" "}
            <span
              className={
                v.statut === "verifie"
                  ? "text-status-success"
                  : v.statut === "refuse"
                    ? "text-status-error"
                    : "text-status-warning"
              }
            >
              {v.statut}
            </span>
          </span>
          {v.document && (
            <a
              href={`/api/documents/${v.document.id}/download`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary-600 hover:underline"
            >
              {t("attachment")}
            </a>
          )}
        </li>
      ))}
      {canManage && (
        <li>
          <Link
            href={routes.clientVerificationIdentite(clientId)}
            className="text-sm text-primary-600 hover:underline"
          >
            {t("addVerification")}
          </Link>
        </li>
      )}
    </ul>
  );
}
