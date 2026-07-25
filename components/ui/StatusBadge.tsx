/**
 * Badge de statut avec point coloré (style registre / KPI).
 * Utilise les couleurs du design system SAFE.
 */

type StatusVariant = "success" | "warning" | "neutral" | "error";

const variantClasses: Record<
  StatusVariant,
  { wrapper: string; dot: string }
> = {
  success: { wrapper: "bg-status-success-bg text-status-success", dot: "bg-status-success" },
  warning: { wrapper: "bg-status-warning-bg text-status-warning", dot: "bg-status-warning" },
  neutral: { wrapper: "bg-si-line2 text-si-muted", dot: "bg-si-muted" },
  error: { wrapper: "bg-status-error-bg text-status-error", dot: "bg-status-error" },
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
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${wrapper} ${className}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} aria-hidden />
      {label}
    </span>
  );
}
