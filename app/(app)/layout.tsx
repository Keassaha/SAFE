import { getServerSession } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AppChrome } from "@/components/layout/AppChrome";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { TimerProvider } from "@/lib/contexts/TimerContext";
import { getCabinetInterfaceDerived } from "@/lib/services/cabinet-interface";
import { getTrustReconciliationStatus } from "@/lib/services/trust-reconciliation-status";
import { getSidebarCounts } from "@/lib/services/sidebar-counts";
import { QuickCapture } from "@/components/capture/QuickCapture";
import { isSafeIncCabinet } from "@/lib/safe-inc";
import { getCabinetSubscriptionState } from "@/lib/services/subscription-state";
import { AbonnementRequis } from "@/components/abonnement/AbonnementRequis";
import {
  isSubscriptionExemptPath,
  shouldBlockForSubscription,
} from "@/lib/services/subscription-guard";
import { getCabinetProvince } from "@/lib/cabinet/get-province";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    /* `session=expiree` n'est pas décoratif : il casse une boucle de
       redirection. Le rappel `jwt` révoque la session quand le compte n'existe
       plus (base réinitialisée, employé désactivé), mais le drapeau ne
       redescend pas dans le cookie du navigateur. Le middleware, qui ne lit que
       le jeton brut, croit donc l'utilisateur connecté et le renvoie du
       formulaire vers le tableau de bord, qui le renvoie au formulaire.
       Le marqueur dit au middleware de laisser passer et de purger le cookie. */
    redirect("/connexion?session=expiree");
  }

  const role = (session.user as { role?: string }).role ?? "avocat";
  const cabinetId = (session.user as { cabinetId?: string }).cabinetId ?? null;
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "";

  // `pathname` vient d'un en-tête posé par le middleware (x-pathname). S'il
  // arrive vide pour une raison quelconque, on refuse de bloquer à l'aveugle :
  // un cabinet payant coincé sans issue est pire qu'une vérification sautée
  // une fois, et la garde se réévalue de toute façon à chaque navigation.
  if (cabinetId && pathname && !isSubscriptionExemptPath(pathname)) {
    const subscription = await getCabinetSubscriptionState(cabinetId);
    if (shouldBlockForSubscription(pathname, subscription)) {
      // On rend le blocage, on ne redirige pas. Un `redirect()` levé depuis un
      // layout pendant une requête RSC renvoie un arbre vide : c'est la page
      // blanche observée après création de facture sur un cabinet dont
      // l'abonnement n'est plus actif. Détail dans AbonnementRequis.
      return <AbonnementRequis raison={subscription.reason} />;
    }
  }

  // Cinq lectures indépendantes (aucune ne consomme le résultat d'une autre) :
  //   - CabinetInterface  : mode de facturation + visibilité de nav (cache React)
  //   - trustStatus       : bannière de conformité globale
  //   - cabinetProvince   : localise la réglementation affichée (bannière +
  //     écrans fidéicommis/conformité) — QC → Barreau du Québec (B-1, r. 5),
  //     sinon LSO Ontario. Fournie via contexte dans AppChrome.
  //   - sidebarCounts     : compteurs vivants (clients actifs, dossiers
  //     ouverts, factures à traiter)
  //   - isSafeInc         : mode consultant SAFE Inc. (dog food), bascule sur
  //     une navigation dédiée. Spec : CONSOLE_CONSULTANT_REFACTOR_v1.
  // Séquentielles avant : la garde d'abonnement (peut rediriger, inutile de
  // lancer ces cinq requêtes si on quitte la page).
  const userId = (session.user as { id?: string }).id ?? undefined;
  const [
    { billingMode, activeNavIds, hiddenNavIds },
    trustStatus,
    cabinetProvince,
    sidebarCounts,
    isSafeInc,
  ] = await Promise.all([
    cabinetId
      ? getCabinetInterfaceDerived(cabinetId)
      : Promise.resolve({ billingMode: "horaire" as const, activeNavIds: null, hiddenNavIds: [] }),
    cabinetId ? getTrustReconciliationStatus(cabinetId) : Promise.resolve(null),
    getCabinetProvince(cabinetId),
    cabinetId ? getSidebarCounts(cabinetId, userId) : Promise.resolve(null),
    cabinetId ? isSafeIncCabinet(cabinetId) : Promise.resolve(false),
  ]);

  return (
    <QueryProvider>
      <TimerProvider>
        <AppChrome
          role={role}
          user={session.user}
          cabinetId={cabinetId}
          billingMode={billingMode}
          activeNavIds={activeNavIds}
          hiddenNavIds={hiddenNavIds}
          trustStatus={isSafeInc ? null : trustStatus}
          province={cabinetProvince}
          sidebarCounts={sidebarCounts}
          isSafeInc={isSafeInc}
        >
          {children}
        </AppChrome>
        <QuickCapture />
        {/* SupportWidget est rendu par AppChrome, qui connaît `isSafeInc` et ne
            l'affiche pas en mode consultant. Le doublon posé ici affichait deux
            widgets superposés sur chaque écran. */}
      </TimerProvider>
    </QueryProvider>
  );
}
