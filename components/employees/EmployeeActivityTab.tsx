"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";

export type ActivityRow = {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  performedAt: Date | null;
  metadata: string | null;
};

interface EmployeeActivityTabProps {
  activities: ActivityRow[];
}

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat("fr-CA", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(d));
}

export function EmployeeActivityTab({ activities }: EmployeeActivityTabProps) {
  const t = useTranslations("employees");

  return (
    <Card>
      <CardHeader title={t("activityHistory")} />
      <CardContent className="p-0">
        {activities.length === 0 ? (
          <div className="py-12 text-center text-neutral-muted text-sm">
            {t("noActivity")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table">
              <thead>
                <tr className="border-b border-neutral-border bg-neutral-surface/50">
                  <th className="px-4 py-3 text-left font-medium text-neutral-600">{t("dateColumn")}</th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-600">{t("actionColumn")}</th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-600">{t("entityColumn")}</th>
                  <th className="px-4 py-3 text-left font-medium text-neutral-600">{t("detailsColumn")}</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-neutral-border hover:bg-neutral-surface/30"
                  >
                    <td className="px-4 py-3 text-neutral-muted whitespace-nowrap">
                      {row.performedAt ? formatDate(row.performedAt) : "—"}
                    </td>
                    <td className="px-4 py-3 font-medium">{row.action}</td>
                    <td className="px-4 py-3">
                      {t(`entityLabels.${row.entityType}`, { defaultValue: row.entityType })} ({row.entityId.slice(0, 8)}…)
                    </td>
                    <td className="px-4 py-3 text-neutral-muted max-w-xs truncate">
                      {row.metadata ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
