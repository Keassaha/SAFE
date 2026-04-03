"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const alertBase =
  "relative w-full rounded-[var(--safe-radius-lg)] border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[1rem_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current";
const alertVariants = {
  default:
    "bg-[var(--safe-neutral-surface)] text-[var(--safe-text-title)] border-[var(--safe-neutral-border)] shadow-[var(--safe-shadow-sm)]",
  destructive:
    "text-[var(--safe-status-error)] bg-[var(--safe-status-error-bg)] border-[var(--safe-status-error)]/30 [&>svg]:text-current *:data-[slot=alert-description]:text-[var(--safe-status-error)]/90",
  info: "text-[var(--safe-status-info)] bg-[var(--safe-primary-50)] border-[var(--safe-green-600)]/20 [&>svg]:text-current *:data-[slot=alert-description]:text-[var(--safe-text-secondary)]",
  warning:
    "text-[var(--safe-status-warning)] bg-[var(--safe-status-warning-bg)] border-[var(--safe-status-warning)]/30 [&>svg]:text-current *:data-[slot=alert-description]:text-[var(--safe-text-secondary)]",
} as const;

export type AlertVariant = keyof typeof alertVariants;

export interface AlertProps
  extends Omit<React.ComponentProps<"div">, "className"> {
  variant?: AlertVariant;
  className?: string;
}

function Alert({
  className,
  variant = "default",
  ...props
}: AlertProps) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertBase, alertVariants[variant], className)}
      {...props}
    />
  );
}

function AlertTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight",
        className
      )}
      {...props}
    />
  );
}

function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        "text-[var(--safe-text-secondary)] col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed",
        className
      )}
      {...props}
    />
  );
}

export { Alert, AlertTitle, AlertDescription };
