"use client";

import { useEffect } from "react";
import { tryReloadForChunkError } from "@/lib/errors/chunk-reload";
import "./globals.css";

/**
 * Frontière d'erreur racine : attrape les erreurs qui remontent au-dessus du
 * layout applicatif (y compris dans le layout lui-même). Remplace entièrement le
 * document, donc doit rendre ses propres <html>/<body>.
 *
 * Même logique que `app/(app)/error.tsx` : récupération auto du skew de
 * déploiement, sinon message lisible plutôt qu'un écran blanc.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (tryReloadForChunkError(error)) return;
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="fr">
      <body>
        <div className="min-h-screen flex items-center justify-center p-6 bg-si-surface">
          <div className="max-w-md text-center space-y-4">
            <h1 className="text-xl font-serif text-si-ink">
              Une erreur est survenue
            </h1>
            <p className="text-sm text-si-muted">
              L&apos;application n&apos;a pas pu s&apos;afficher. Réessayez ; si le
              problème persiste, rechargez complètement la page.
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
                className="h-10 px-4 rounded-xl border border-si-line bg-white text-si-ink text-sm font-medium"
              >
                Recharger la page
              </button>
            </div>
            {error?.digest && (
              <p className="text-xs text-si-muted/70">Réf. : {error.digest}</p>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
