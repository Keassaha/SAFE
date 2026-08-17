/**
 * Écran de blocage affiché quand l'abonnement d'un cabinet n'est plus actif.
 *
 * Pourquoi un écran et pas un `redirect()` :
 *
 * La garde vivait dans `app/(app)/layout.tsx` sous forme de
 * `redirect("/parametres/abonnement")`. Un `redirect()` levé depuis un *layout*
 * pendant une requête RSC (celle que déclenche `router.refresh()` après une
 * mutation) ne produit pas une navigation : il renvoie un arbre vide. Résultat
 * observé en reproduction, cabinet à l'abonnement inactif : l'avocate crée sa
 * facture, la facture part bien en base, et l'écran entier devient blanc —
 * plus d'en-tête, plus de barre latérale, plus rien. Elle actualise, le
 * chargement complet repasse par la garde, et elle atterrit sur la grille des
 * forfaits sans comprendre ce qui s'est passé.
 *
 * Un layout doit toujours rendre quelque chose. On rend donc le blocage à la
 * place de la page, sans changer d'URL et sans changer *qui* est bloqué :
 * `shouldBlockForSubscription` reste seul juge.
 *
 * Effet de bord bienvenu : le blocage devient cohérent. Avant, il ne
 * s'appliquait qu'aux chargements complets — un cabinet dont l'abonnement
 * venait d'expirer pouvait continuer à travailler tant qu'il ne rechargeait
 * pas, puis se faire éjecter d'un coup.
 */
export function AbonnementRequis({ raison }: { raison?: string | null }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-si-canvas p-6">
      <div className="w-full max-w-md space-y-5 border border-si-line bg-si-surface p-8 text-center">
        <h1 className="font-serif text-2xl text-si-ink">
          Votre abonnement n&apos;est plus actif
        </h1>
        <p className="text-sm leading-6 text-si-muted">
          L&apos;accès à votre espace est en pause. Vos données, vos dossiers et
          vos factures sont intacts : ils vous attendent et rien n&apos;a été
          supprimé. La reprise est immédiate dès la réactivation.
        </p>
        <div className="pt-1">
          {/* Ancre simple, volontairement pas un <Link> Next.
              Une navigation douce ne rejoue pas le layout partagé : cet écran
              resterait affiché et le bouton semblerait mort. Un chargement
              complet fait repasser la requête par le middleware, qui pose
              `x-pathname`, et le layout reconnaît alors le chemin exempté. */}
          <a
            href="/parametres/abonnement"
            className="inline-flex h-11 items-center justify-center rounded-md bg-si-verified px-5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Voir mon abonnement
          </a>
        </div>
        {raison ? (
          <p className="text-xs text-si-muted/70">Réf. : {raison}</p>
        ) : null}
      </div>
    </main>
  );
}
