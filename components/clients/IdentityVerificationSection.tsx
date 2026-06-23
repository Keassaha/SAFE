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
      <p className="text-sm text-si-muted">
        {t("noVerification")}
        {canManage && (
          <Link
            href={routes.clientVerificationIdentite(clientId)}
            className="ml-2 text-si-forest hover:underline"
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
          className="flex items-center justify-between gap-2 py-2 border-b border-si-lineSubtle last:border-0"
        >
          <span className="text-sm">
            {formatDate(v.date)} — {v.methode} —{" "}
            <span
              className={
                v.statut === "verifie"
                  ? "text-si-verified"
                  : v.statut === "refuse"
                    ? "text-[#B84A3E]"
                    : "text-si-amber-ink"
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
              className="text-xs text-si-forest hover:underline"
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
            className="text-sm text-si-forest hover:underline"
          >
            {t("addVerification")}
          </Link>
        </li>
      )}
    </ul>
  );
}
