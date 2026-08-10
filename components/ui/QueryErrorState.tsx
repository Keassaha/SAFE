"use client";

import { AlertCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface QueryErrorStateProps {
  title: string;
  description: string;
  retryLabel: string;
  onRetry: () => void;
  retrying?: boolean;
}

/**
 * État d'erreur local pour une zone de données récupérable.
 *
 * Il reste volontairement sobre : l'utilisateur comprend ce qui n'a pas
 * chargé, conserve le contexte de la page et dispose d'une seule action sûre.
 */
export function QueryErrorState({
  title,
  description,
  retryLabel,
  onRetry,
  retrying = false,
}: QueryErrorStateProps) {
  return (
    <div
      role="alert"
      className="rounded-lg border border-status-error/25 bg-status-error-bg px-5 py-4"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <AlertCircle
            className="mt-0.5 h-5 w-5 shrink-0 text-status-error"
            aria-hidden
          />
          <div>
            <p className="text-sm font-semibold text-si-ink">{title}</p>
            <p className="mt-1 max-w-[65ch] text-sm text-si-muted">
              {description}
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={onRetry}
          disabled={retrying}
          className="shrink-0"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          {retrying ? `${retryLabel}…` : retryLabel}
        </Button>
      </div>
    </div>
  );
}
