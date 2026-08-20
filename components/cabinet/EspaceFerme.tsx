import { getTranslations } from "next-intl/server";

/**
 * Écran d'un espace cabinet fermé.
 *
 * Rendu à la place de la page, jamais par `redirect()` : un `redirect()` levé
 * depuis un layout pendant une requête RSC renvoie un arbre vide, ce qui donne
 * une page blanche. Même raison que dans `AbonnementRequis`.
 *
 * Le ton compte ici plus qu'ailleurs. La personne en face est une avocate dont
 * les dossiers vivent derrière cet écran : on lui dit que rien n'est perdu, on
 * lui dit comment récupérer ses données, et on ne lui fait pas la leçon.
 */
export async function EspaceFerme({ motif }: { motif?: string | null }) {
  const t = await getTranslations("espaceFerme");

  return (
    <main className="flex min-h-screen items-center justify-center bg-si-canvas p-6">
      <div className="w-full max-w-lg space-y-5 border border-si-line bg-si-surface p-8">
        <h1 className="font-serif text-2xl text-si-ink">{t("titre")}</h1>
        <p className="text-sm leading-6 text-si-muted">{t("corps")}</p>
        <p className="text-sm leading-6 text-si-muted">{t("export")}</p>
        <div className="flex flex-wrap gap-2 pt-1">
          {/* Ancres simples, pas des <Link> : une navigation douce ne rejoue pas
              le layout partagé, et cet écran resterait affiché par-dessus. */}
          <a
            href="/api/clients/export"
            className="inline-flex h-11 items-center justify-center rounded-md bg-si-verified px-5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            {t("exportClients")}
          </a>
          <a
            href="/api/dossiers/export"
            className="inline-flex h-11 items-center justify-center rounded-md border border-si-line px-5 text-sm font-medium text-si-ink transition-colors hover:bg-si-canvas"
          >
            {t("exportDossiers")}
          </a>
        </div>
        <p className="pt-1 text-xs leading-5 text-si-muted/80">{t("contact")}</p>
        {motif ? <p className="text-xs text-si-muted/70">{t("motif", { motif })}</p> : null}
      </div>
    </main>
  );
}
