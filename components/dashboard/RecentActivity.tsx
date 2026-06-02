"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

interface RecentActivityProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Reusable recent activity list inside a glass card.
 */
export function RecentActivity({
  title,
  children,
  className = "",
}: RecentActivityProps) {
  const tUi = useTranslations("dashboardUi");
  const resolvedTitle = title ?? tUi("recentActivity");
  return (
    <div className={`safe-glass-panel overflow-hidden p-5 md:p-6 ${className}`}>
      <h3 className="text-sm font-semibold text-neutral-text-primary mb-4 tracking-tight">{resolvedTitle}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
