import { notFound } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { canManageCabinetSettings } from "@/lib/auth/permissions";
import { Card, CardContent } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { routes } from "@/lib/routes";
import { getTranslations } from "next-intl/server";
import { SubscriptionManager } from "@/components/settings/SubscriptionManager";
import { getCabinetSubscriptionState } from "@/lib/services/subscription-state";

export default async function AbonnementPage() {
  const { cabinetId, role } = await requireCabinetAndUser();
  if (!canManageCabinetSettings(role as UserRole)) {
    notFound();
  }
  const t = await getTranslations("parametres");

  // L'écran lisait les colonnes Stripe brutes et rejugeait l'accès lui-même.
  // Il annonçait donc « abonnement inactif » à un cabinet qui a payé par
  // virement Interac et qui travaille normalement. La règle d'accès n'a qu'une
  // source, `deriveCabinetSubscriptionState` : cette page la lit, elle ne la
  // redécide pas.
  const [cabinet, subscription] = await Promise.all([
    prisma.cabinet.findUnique({
      where: { id: cabinetId },
      select: { plan: true, stripeCustomerId: true },
    }),
    getCabinetSubscriptionState(cabinetId),
  ]);

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title={t("subscriptionPageTitle")}
        description={t("subscriptionPageDescription")}
        backHref={routes.parametres}
        backLabel={t("backToSettings")}
      />
      <Card>
        <CardContent>
          <SubscriptionManager
            currentPlan={cabinet?.plan ?? subscription.plan}
            stripeCustomerId={cabinet?.stripeCustomerId ?? null}
            isActive={subscription.active}
            accessSource={subscription.source}
            subscriptionStatus={subscription.status}
            periodEnd={subscription.currentPeriodEnd?.toISOString() ?? null}
            trialEnd={subscription.trialEnd?.toISOString() ?? null}
            cancelAtPeriodEnd={subscription.cancelAtPeriodEnd}
          />
        </CardContent>
      </Card>
    </div>
  );
}
