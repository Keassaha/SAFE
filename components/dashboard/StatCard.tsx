"use client";

import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  subtitle?: string;
  value: string;
  valueLabel?: string;
  action?: ReactNode;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/**
 * Reusable stat card with glass design. Uses design system text colors for contrast.
 */
export function StatCard({
  title,
  subtitle,
  value,
  valueLabel,
  action,
  icon,
  children,
  className = "",
}: StatCardProps) {
  return (
    <div className={`safe-glass-panel overflow-hidden p-5 md:p-6 ${className}`}>
      <div className="flex items-start justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-neutral-text-primary tracking-tight">{title}</h3>
          {subtitle && (
            <p className="text-xs text-neutral-muted mt-0.5">{subtitle}</p>
          )}
        </div>
        {action}
        {icon && (
          <div className="w-9 h-9 rounded-safe bg-primary-100 flex items-center justify-center text-primary-600 shrink-0">
            {icon}
          </div>
        )}
      </div>
      <p className="text-2xl md:text-3xl font-semibold text-neutral-text-primary tracking-tight">
        {value}
      </p>
      {valueLabel && (
        <p className="text-sm text-neutral-muted mt-1">{valueLabel}</p>
      )}
      {children}
    </div>
  );
}
