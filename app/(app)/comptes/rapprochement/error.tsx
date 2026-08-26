"use client";

import { useEffect } from "react";
import { tryReloadForChunkError } from "@/lib/errors/chunk-reload";

export default function RapprochementError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (tryReloadForChunkError(error)) return;
    console.error("[rapprochement/error]", error);
  }, [error]);

  return (
    <section
      aria-labelledby="rapprochement-error-title"
      className="mx-auto flex min-h-[50vh] max-w-xl items-center px-4 py-12"
    >
      <div className="w-full border-l-2 border-status-error pl-5">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-status-error">
          Rapprochement indisponible
        </p>
        <h1 id="rapprochement-error-title" className="mt-2 font-serif text-2xl text-si-ink">
          Les soldes n&apos;ont pas pu être affichés
        </h1>
        <p className="mt-2 max-w-[55ch] text-sm leading-6 text-si-muted">
          Aucun rapprochement n&apos;a été certifié. Réessayez avant de poursuivre votre contrôle.
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
