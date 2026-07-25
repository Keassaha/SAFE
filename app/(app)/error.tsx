"use client";

import { useEffect } from "react";
import { tryReloadForChunkError } from "@/lib/errors/chunk-reload";

/**
 * Frontière d'erreur du segment applicatif (app authentifiée).
 *
 * Avant : aucune frontière → une erreur pendant une navigation affichait un
 * écran blanc indéfini. Maintenant : message lisible + bouton réessayer, et
 * récupération automatique du « deployment skew » (chunk obsolète) via un
 * rechargement unique.
 *
 * Volontairement sans dépendance (pas d'i18n, pas de tokens dynamiques) : une
 * frontière d'erreur ne doit jamais elle-même pouvoir planter.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Skew de déploiement : on récupère la dernière version au lieu du vide.
    if (tryReloadForChunkError(error)) return;
    // Sinon, on trace pour le diagnostic (visible dans la console navigateur).
    console.error("[app/error]", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-xl font-serif text-si-ink">Une erreur est survenue</h1>
        <p className="text-sm text-si-muted">
          La page n&apos;a pas pu s&apos;afficher. Réessayez ; si le problème
          persiste, rechargez complètement la page.
        </p>
        <div className="flex items-center justify-center gap-3 pt-1">
          <button
            onClick={() => reset()}
            className="h-10 px-4 rounded-xl bg-si-verified text-white text-sm font-medium"
          >
            Réessayer
          </button>
          <button
            onClick={() => window.location.reload()}
            className="h-10 px-4 rounded-xl border border-si-line bg-si-surface text-si-ink text-sm font-medium"
          >
            Recharger la page
          </button>
        </div>
        {error?.digest && (
          <p className="text-xs text-si-muted/70">Réf. : {error.digest}</p>
        )}
      </div>
    </div>
  );
}
