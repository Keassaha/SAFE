"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Clock } from "lucide-react";

export type ActivityItem = {
  id: string;
  date: Date;
  action: string;
  label: string;
  entityType?: string;
};

interface ClientHistoryTabProps {
  items: ActivityItem[];
}

export function ClientHistoryTab({ items }: ClientHistoryTabProps) {
  const t = useTranslations("clients");

  return (
    <Card>
      <CardHeader
        title={t("activityHistory")}
        action={
          <span className="text-xs text-neutral-muted">
            {t("activityHistoryFullDesc")}
          </span>
        }
      />
      <CardContent>
        {items.length === 0 ? (
          <div className="py-8 text-center text-neutral-muted">
            <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t("noActivityRecorded")}</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex gap-3 py-2 border-b border-neutral-border/60 last:border-0"
              >
                <span className="text-xs text-neutral-muted shrink-0 w-20">
                  {new Intl.DateTimeFormat("fr-CA", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }).format(new Date(item.date))}
                </span>
                <div>
                  <span className="text-sm font-medium text-neutral-text-primary">
                    {item.label}
                  </span>
                  {item.entityType && (
                    <span className="ml-2 text-xs text-neutral-muted">
                      ({item.entityType})
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
