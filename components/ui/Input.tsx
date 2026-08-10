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

const statusClasses: Record<InputStatus, string> = {
  default: "border-si-line focus:border-si-verified focus:ring-si-verified/25",
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
        <label htmlFor={inputId} className="mb-1.5 block font-sans text-xs font-medium text-si-muted">
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
          "min-h-11 w-full rounded-md border bg-si-surface px-3 font-sans text-sm text-si-ink",
          "placeholder:text-si-muted/70 outline-none transition-[border-color,box-shadow,background-color] duration-normal ease-safe motion-reduce:transition-none",
          "focus:ring-2 disabled:cursor-not-allowed disabled:bg-si-line2 disabled:opacity-60",
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
