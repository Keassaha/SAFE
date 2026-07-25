/**
 * Détection + auto-récupération des erreurs de chargement de chunk.
 *
 * Symptôme visé : après un nouveau déploiement (Vercel), un onglet resté sur
 * l'ancienne version fait une navigation douce qui va chercher un chunk JS dont
 * le fichier a été remplacé. Le chunk ne charge pas → écran blanc jusqu'à un
 * rechargement complet (« deployment skew »).
 *
 * Plutôt que de laisser React afficher du vide, les frontières d'erreur
 * (`error.tsx`, `global-error.tsx`) appellent `tryReloadForChunkError` : si
 * l'erreur est un échec de chunk, on recharge une seule fois pour récupérer la
 * dernière version. Un garde anti-boucle évite les rechargements en rafale si le
 * rechargement ne corrige rien (vraie panne, pas un simple skew).
 */

export function isChunkLoadError(error: unknown): boolean {
  if (!error) return false;
  const name = (error as { name?: string }).name ?? "";
  const message = (error as { message?: string }).message ?? "";
  return (
    name === "ChunkLoadError" ||
    /loading chunk [\d]+ failed/i.test(message) ||
    /loading css chunk/i.test(message) ||
    /failed to fetch dynamically imported module/i.test(message) ||
    /error loading dynamically imported module/i.test(message) ||
    /importing a module script failed/i.test(message)
  );
}

const RELOAD_KEY = "safe:chunk-reload-at";
const RELOAD_COOLDOWN_MS = 10_000;

/**
 * Recharge la page une seule fois si `error` est un échec de chargement de chunk.
 * @returns `true` si un rechargement a été déclenché (l'appelant peut s'arrêter là).
 */
export function tryReloadForChunkError(error: unknown): boolean {
  if (typeof window === "undefined") return false;
  if (!isChunkLoadError(error)) return false;

  try {
    const last = Number(window.sessionStorage.getItem(RELOAD_KEY) ?? "0");
    const now = Date.now();
    // Déjà rechargé récemment : le rechargement n'a pas résolu → on n'insiste pas,
    // on laisse la frontière d'erreur afficher son message.
    if (now - last < RELOAD_COOLDOWN_MS) return false;
    window.sessionStorage.setItem(RELOAD_KEY, String(now));
  } catch {
    // sessionStorage indisponible (navigation privée stricte) : on tente quand même
    // un rechargement, le garde anti-boucle est simplement inactif.
  }

  window.location.reload();
  return true;
}
