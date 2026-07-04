import { notFound } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { canManageCabinetSettings } from "@/lib/auth/permissions";
import { ONLINE_PAYMENTS_ENABLED } from "@/lib/payments/eligibility";
import { getCabinetConnectState, syncConnectStatus } from "@/lib/services/stripe/connect-service";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { PageHeader } from "@/components/ui/PageHeader";
import { routes } from "@/lib/routes";
import { getTranslations } from "next-intl/server";
import { startConnectOnboardingAction, refreshConnectStatusAction } from "./actions";

export default async function PaiementsPage({
  searchParams,
}: {
  searchParams: Promise<{ connect?: string }>;
}) {
  const { cabinetId, role } = await requireCabinetAndUser();
  // Fonctionnalité derrière le flag : invisible tant qu'elle n'est pas activée.
  if (!ONLINE_PAYMENTS_ENABLED || !canManageCabinetSettings(role as UserRole)) {
    notFound();
  }
  const t = await getTranslations("parametres");
  const params = await searchParams;

  // Au retour de l'onboarding Stripe, on resynchronise le statut du compte.
  if (params.connect === "return") {
    await syncConnectStatus(cabinetId).catch(() => null);
  }
  const state = await getCabinetConnectState(cabinetId);

  const status = state.chargesEnabled
    ? "ready"
    : state.accountId
      ? "incomplete"
      : "not_connected";

  return (
    <div className="max-w-4xl space-y-6 animate-fade-in">
      <PageHeader
        title={t("paymentsPageTitle")}
        description={t("paymentsPageDescription")}
        backHref={routes.parametres}
        backLabel={t("backToSettings")}
      />
      <Card>
        <CardContent className="p-6 space-y-5">
          <p className="text-sm text-si-muted">{t("paymentsIntro")}</p>

          {params.connect === "error" && (
            <p className="rounded-lg border border-[#B84A3E]/30 bg-[#B84A3E]/10 px-3 py-2 text-sm text-[#B84A3E]">
              {t("paymentsSetupError")}
            </p>
          )}

          <div className="flex items-center gap-3">
            <StatusBadge
              label={
                status === "ready"
                  ? t("paymentsStatusReady")
                  : status === "incomplete"
                    ? t("paymentsStatusIncomplete")
                    : t("paymentsStatusNotConnected")
              }
              variant={status === "ready" ? "success" : status === "incomplete" ? "warning" : "neutral"}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {status !== "ready" && (
              <form action={startConnectOnboardingAction}>
                <Button type="submit" variant="primary">
                  {status === "incomplete" ? t("paymentsContinueButton") : t("paymentsConnectButton")}
                </Button>
              </form>
            )}
            {status !== "not_connected" && (
              <form action={refreshConnectStatusAction}>
                <Button type="submit" variant="secondary">
                  {t("paymentsRefreshButton")}
                </Button>
              </form>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
