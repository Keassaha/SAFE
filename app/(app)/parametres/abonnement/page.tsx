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

export default async function AbonnementPage() {
  const { cabinetId, role } = await requireCabinetAndUser();
  if (!canManageCabinetSettings(role as UserRole)) {
    notFound();
  }
  const t = await getTranslations("parametres");

  const cabinet = await prisma.cabinet.findUnique({
    where: { id: cabinetId },
    select: {
      plan: true,
      stripeCustomerId: true,
      stripeSubscriptionStatus: true,
      stripeCurrentPeriodEnd: true,
      stripeCancelAtPeriodEnd: true,
      stripeTrialEnd: true,
    },
  });

  return (
    <div className="max-w-4xl space-y-6 animate-fade-in">
      <PageHeader
        title={t("subscriptionPageTitle")}
        description={t("subscriptionPageDescription")}
        backHref={routes.parametres}
        backLabel={t("backToSettings")}
      />
      <Card>
        <CardContent>
          <SubscriptionManager
            currentPlan={cabinet?.plan ?? "essentiel"}
            stripeCustomerId={cabinet?.stripeCustomerId ?? null}
            subscriptionStatus={cabinet?.stripeSubscriptionStatus ?? null}
            periodEnd={
              cabinet?.stripeCurrentPeriodEnd
                ? cabinet.stripeCurrentPeriodEnd.toISOString()
                : null
            }
            trialEnd={
              cabinet?.stripeTrialEnd
                ? cabinet.stripeTrialEnd.toISOString()
                : null
            }
            cancelAtPeriodEnd={cabinet?.stripeCancelAtPeriodEnd ?? false}
          />
        </CardContent>
      </Card>
    </div>
  );
}
