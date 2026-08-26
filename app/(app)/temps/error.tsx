"use client";

import { useEffect } from "react";
import { tryReloadForChunkError } from "@/lib/errors/chunk-reload";

export default function TempsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (tryReloadForChunkError(error)) return;
    console.error("[temps/error]", error);
  }, [error]);

  return (
    <section
      aria-labelledby="temps-error-title"
      className="mx-auto flex min-h-[50vh] max-w-xl items-center px-4 py-12"
    >
      <div className="w-full border-l-2 border-status-error pl-5">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-status-error">
          Fiche de temps indisponible
        </p>
        <h1 id="temps-error-title" className="mt-2 font-serif text-2xl text-si-ink">
          Vos données n&apos;ont pas pu être affichées
        </h1>
        <p className="mt-2 max-w-[55ch] text-sm leading-6 text-si-muted">
          Aucune entrée n&apos;a été modifiée. Réessayez pour reprendre le chargement de la page.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 h-10 rounded-md safe-action-degrade px-4 text-sm font-medium text-si-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-si-ink-strong/40"
        >
          Réessayer
        </button>
        {error.digest && <p className="mt-3 text-xs text-si-muted">Réf. : {error.digest}</p>}
      </div>
    </section>
  );
}
