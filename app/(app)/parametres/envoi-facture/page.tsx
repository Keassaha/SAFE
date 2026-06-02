import { redirect } from "next/navigation";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { routes } from "@/lib/routes";
import { PageHeader } from "@/components/ui/PageHeader";
import { canManageCabinetSettings } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import { EnvoiFactureConfigForm } from "./EnvoiFactureConfigForm";
import { getTranslations } from "next-intl/server";

export default async function ParametresEnvoiFacturePage() {
  const { role } = await requireCabinetAndUser();
  if (!canManageCabinetSettings(role as UserRole)) {
    redirect(routes.parametres);
  }

  const t = await getTranslations("parametres");
  const tu = await getTranslations("settingsUi");

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title={tu("invoiceSendTitle")}
        description={tu("invoiceSendDescription")}
        backHref={routes.parametres}
        backLabel={t("backToSettings")}
      />
      <EnvoiFactureConfigForm />
    </div>
  );
}
