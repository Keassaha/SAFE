import { routes } from "@/lib/routes";
import { requireCabinetId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { DossierCreationWizard } from "@/components/dossiers/registry/DossierCreationWizard";
import { getCabinetBillingMode } from "@/lib/services/cabinet-interface";
import { getCabinetDossierTaxonomyOptions } from "@/lib/dossiers/cabinet-dossier-taxonomy";
import { getLocale, getTranslations } from "next-intl/server";

export default async function NouveauDossierPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; clientId?: string }>;
}) {
  const cabinetId = await requireCabinetId();
  const params = await searchParams;
  const initialClientId = params.clientId?.trim() || undefined;

  const locale = await getLocale();
  const tx = await getTranslations("appExtraUi");
  const [clients, avocats, assistants, cabinetBillingMode, taxonomyOptions] = await Promise.all([
    prisma.client.findMany({
      where: { cabinetId },
      orderBy: { raisonSociale: "asc" },
      select: { id: true, typeClient: true, raisonSociale: true, prenom: true, nom: true },
    }),
    prisma.user.findMany({
      where: { cabinetId, role: { in: ["admin_cabinet", "avocat"] } },
      select: { id: true, nom: true },
      orderBy: { nom: "asc" },
    }),
    prisma.user.findMany({
      where: { cabinetId, role: "assistante" },
      select: { id: true, nom: true },
      orderBy: { nom: "asc" },
    }),
    getCabinetBillingMode(cabinetId),
    // Source unique partagée avec le modal de création (lib/dossiers/cabinet-dossier-taxonomy).
    getCabinetDossierTaxonomyOptions(cabinetId, locale),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={tx("newMatterTitle")}
        description={tx("newMatterDescription")}
        backHref={routes.dossiers}
        backLabel={tx("newMatterBackLabel")}
      />
      <Card>
        <CardHeader title={tx("newMatterCardTitle")} />
        <CardContent>
          <DossierCreationWizard
            clients={clients}
            avocats={avocats}
            assistants={assistants}
            initialClientId={initialClientId}
            cabinetBillingMode={cabinetBillingMode}
            subjectOptions={taxonomyOptions.subjectOptions}
            submatterOptions={taxonomyOptions.submatterOptions}
            initialError={params.error === "invalid" ? tx("newMatterErrorRequired") : undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
}
