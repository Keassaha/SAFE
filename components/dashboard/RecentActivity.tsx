"use client";

import type { ReactNode } from "react";

interface RecentActivityProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

/**
 * Reusable recent activity list inside a glass card.
 */
export function RecentActivity({
  title = "Activité récente",
  children,
  className = "",
}: RecentActivityProps) {
  return (
    <div className={`safe-glass-panel overflow-hidden p-5 md:p-6 ${className}`}>
      <h3 className="text-sm font-semibold text-neutral-text-primary mb-4 tracking-tight">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
