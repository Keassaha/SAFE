import { requireCabinetAndUser } from "@/lib/auth/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { OutilsHub } from "@/components/outils/OutilsHub";
import { routes } from "@/lib/routes";
import { getTranslations } from "next-intl/server";

export default async function OutilsPage() {
  await requireCabinetAndUser();
  const t = await getTranslations("outils");

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={t("title")}
        description={t("description")}
        breadcrumbs={[{ label: t("title"), href: routes.outils }]}
      />
      <OutilsHub />
    </div>
  );
}
