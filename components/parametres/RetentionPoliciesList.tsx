"use client";

import { deleteRetentionPolicy } from "@/app/(app)/parametres/retention/actions";
import { Button } from "@/components/ui/Button";
import type { DocumentRetentionPolicy } from "@prisma/client";
import { useTranslations } from "next-intl";

export function RetentionPoliciesList({
  policies,
}: {
  policies: DocumentRetentionPolicy[];
}) {
  const t = useTranslations("parametres");
  const tc = useTranslations("common");
  if (policies.length === 0) {
    return (
      <p className="text-sm text-neutral-muted">{t("noPolicies")}</p>
    );
  }
  return (
    <ul className="space-y-2">
      {policies.map((p) => (
        <li
          key={p.id}
          className="flex items-center justify-between gap-2 py-2 border-b border-neutral-borderSubtle last:border-0"
        >
          <span className="font-medium">{p.documentType}</span>
          <span className="text-sm text-neutral-muted">
            {p.retentionYears} {t("years")}
            {p.legalBasis ? ` — ${p.legalBasis}` : ""}
          </span>
          <form action={deleteRetentionPolicy.bind(null, p.id)} className="inline">
            <Button type="submit" variant="danger">
              {tc("delete")}
            </Button>
          </form>
        </li>
      ))}
    </ul>
  );
}
