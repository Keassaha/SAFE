/**
 * Pastille d'état.
 *
 * Le décoratif est achromatique, l'état ne l'est pas : la couleur reste
 * réservée à ce qui appelle un geste (déc. CEO 2026-08-11).
 *
 *   validé          vert dilué, contour, point plein
 *   à vérifier      ambre dilué, contour, point plein
 *   bloquant        rouge dilué, contour, point plein
 *   neutre          gris très pâle
 *
 * La couleur est réservée à ce qui appelle un geste. Elle ne travaille jamais
 * seule : chaque pastille porte un contour, un point et un libellé, donc reste
 * lisible sans être perçue en couleur (WCAG 1.4.1).
 */
import React from "react";

export type StatusVariant = "success" | "warning" | "neutral" | "error" | "info";

const variantClasses: Record<StatusVariant, { wrapper: string; dot: string }> = {
  success: {
    wrapper: "bg-si-verified/12 text-si-verified ring-1 ring-inset ring-si-verified/25",
    dot: "bg-si-verified",
  },
  warning: {
    wrapper: "bg-si-amber/12 text-si-amber-ink ring-1 ring-inset ring-si-amber/30",
    dot: "bg-si-amber",
  },
  error: {
    wrapper: "bg-si-danger/12 text-si-danger-ink ring-1 ring-inset ring-si-danger/35",
    dot: "bg-si-danger",
  },
  neutral: {
    wrapper: "bg-si-line2 text-si-muted",
    dot: "bg-si-muted",
  },
  info: {
    wrapper: "bg-si-surface2 text-si-body ring-1 ring-inset ring-si-line",
    dot: "bg-si-muted",
  },
};

interface StatusBadgeProps {
  label: string;
  variant: StatusVariant;
  className?: string;
}

export function StatusBadge({ label, variant, className = "" }: StatusBadgeProps) {
  const { wrapper, dot } = variantClasses[variant];
  return (
    <span
      className={`inline-flex min-h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${wrapper} ${className}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} aria-hidden />
      {label}
    </span>
  );
}
