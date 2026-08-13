"use client";

import React, { forwardRef, useId, type InputHTMLAttributes } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type InputStatus = "default" | "success" | "warning" | "error";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  status?: InputStatus;
}

/**
 * Le champ se lit comme un champ.
 *
 * Il portait `bg-si-surface` (blanc) et `border-si-line` (11 % d'encre) : posé
 * sur une carte blanche, la bordure atteignait 1,32 de rapport, très en deçà
 * des 3:1 que WCAG 1.4.11 exige pour un bord de composant. Le champ était donc
 * littéralement invisible, ce que le CEO a décrit comme « les fonds mêlés aux
 * formulaires ».
 *
 * Désormais : un creux gris distinct de la carte, une bordure à 3,03:1, et au
 * focus un fond blanc qui donne la sensation que le champ s'ouvre.
 */
const statusClasses: Record<InputStatus, string> = {
  default:
    "border-border-strong focus:border-si-ink focus:bg-si-surface focus:ring-si-ink/15",
  success: "border-status-success focus:border-status-success focus:ring-status-success/20",
  warning: "border-status-warning focus:border-status-warning focus:ring-status-warning/20",
  error: "border-status-error focus:border-status-error focus:ring-status-error/20",
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    error,
    hint,
    status = "default",
    className,
    id,
    disabled,
    "aria-describedby": ariaDescribedBy,
    ...props
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const resolvedStatus = error ? "error" : status;
  const message = error ?? hint;
  const messageId = message ? `${inputId}-message` : undefined;
  const describedBy = [ariaDescribedBy, messageId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={inputId} className="mb-2 block font-sans text-[13px] font-medium text-si-ink">
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        disabled={disabled}
        aria-invalid={resolvedStatus === "error" || undefined}
        aria-describedby={describedBy}
        data-status={resolvedStatus}
        className={cn(
          "min-h-11 w-full rounded-md border bg-si-surface2 px-3.5 font-sans text-sm text-si-ink",
          "placeholder:text-si-subtle outline-none transition-[border-color,box-shadow,background-color] duration-normal ease-safe motion-reduce:transition-none",
          "hover:border-si-ink/40",
          "focus:ring-2 disabled:cursor-not-allowed disabled:border-si-line disabled:bg-si-line2 disabled:opacity-60",
          statusClasses[resolvedStatus],
          className,
        )}
        {...props}
      />
      {message ? (
        <p
          id={messageId}
          className={cn(
            "mt-1.5 flex items-center gap-1.5 font-sans text-xs",
            resolvedStatus === "error" && "text-status-error",
            resolvedStatus === "warning" && "text-status-warning",
            resolvedStatus === "success" && "text-status-success",
            resolvedStatus === "default" && "text-si-muted",
          )}
        >
          {resolvedStatus === "error" || resolvedStatus === "warning" ? (
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
          ) : resolvedStatus === "success" ? (
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
          ) : null}
          {message}
        </p>
      ) : null}
    </div>
  );
});

Input.displayName = "Input";
