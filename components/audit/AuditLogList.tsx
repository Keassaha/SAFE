"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { formatDate } from "@/lib/utils/format";
import { routes } from "@/lib/routes";

type Item = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  metadata: Record<string, unknown> | null;
  user: { nom: string; email: string } | null;
  createdAt: Date;
};

export function AuditLogList({
  items,
  nextCursor,
  entityTypeFilter,
}: {
  items: Item[];
  nextCursor: string | null;
  entityTypeFilter?: string;
}) {
  const t = useTranslations("gestionCompUi");
  if (items.length === 0) {
    return (
      <p className="p-6 text-sm text-neutral-muted">{t("noLog")}</p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-neutral-surface border-b border-neutral-border sticky top-0">
          <tr>
            <th className="px-4 py-3 font-medium">{t("logDate")}</th>
            <th className="px-4 py-3 font-medium">{t("logEntity")}</th>
            <th className="px-4 py-3 font-medium">{t("logAction")}</th>
            <th className="px-4 py-3 font-medium">{t("logUser")}</th>
            <th className="px-4 py-3 font-medium">{t("logDetails")}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((log) => (
            <tr key={log.id} className="border-b border-neutral-borderSubtle hover:bg-neutral-surface/50">
              <td className="px-4 py-2 text-neutral-muted">{formatDate(log.createdAt)}</td>
              <td className="px-4 py-2">
                <span className="font-medium">{log.entityType}</span> {log.entityId.slice(0, 8)}…
              </td>
              <td className="px-4 py-2">{log.action}</td>
              <td className="px-4 py-2">{log.user?.nom ?? "—"}</td>
              <td className="px-4 py-2 text-neutral-muted max-w-xs truncate">
                {log.metadata ? JSON.stringify(log.metadata) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {nextCursor && (
        <div className="p-4 border-t border-neutral-border">
          <Link
            href={`${routes.parametresAudit}?cursor=${nextCursor}${entityTypeFilter ? `&entityType=${entityTypeFilter}` : ""}`}
          >
            <span className="text-sm text-primary-600 hover:underline">{t("seeMore")}</span>
          </Link>
        </div>
      )}
    </div>
  );
}
