import { redirect } from "next/navigation";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { routes } from "@/lib/routes";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { canManageRetentionPolicies } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import { RetentionPoliciesList } from "@/components/parametres/RetentionPoliciesList";
import { RetentionPolicyForm } from "@/components/parametres/RetentionPolicyForm";
import { getTranslations } from "next-intl/server";

export default async function ParametresRetentionPage() {
  const { cabinetId, role } = await requireCabinetAndUser();
  if (!canManageRetentionPolicies(role as UserRole)) {
    redirect(routes.parametres);
  }
  const policies = await prisma.documentRetentionPolicy.findMany({
    where: { cabinetId },
    orderBy: { documentType: "asc" },
  });

  const t = await getTranslations("parametres");

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title={t("retentionTitle")}
        description={t("retentionDescription")}
        backHref={routes.parametres}
        backLabel={t("backToSettings")}
      />
      <Card>
        <CardHeader title={t("newPolicy")} />
        <CardContent>
          <RetentionPolicyForm cabinetId={cabinetId} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader title={t("activePolicies")} />
        <CardContent>
          <RetentionPoliciesList policies={policies} />
        </CardContent>
      </Card>
    </div>
  );
}
