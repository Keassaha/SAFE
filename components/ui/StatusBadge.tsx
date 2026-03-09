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
  neutral: { wrapper: "bg-neutral-100 text-neutral-500", dot: "bg-neutral-500" },
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
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${wrapper} ${className}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} aria-hidden />
      {label}
    </span>
  );
}
