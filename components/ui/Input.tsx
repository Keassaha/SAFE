import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = "", ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-neutral-text-secondary mb-1">
          {label}
        </label>
      )}
      <input
        className={`w-full h-10 px-3 rounded-safe border bg-white/90 backdrop-blur-sm text-neutral-text-primary placeholder:text-neutral-muted focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none transition-all ${
          error ? "border-status-error" : "border-neutral-border"
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-status-error">{error}</p>
      )}
    </div>
  );
}
