import { routes } from "@/lib/routes";
import { requireCabinetId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { DossierCreationWizard } from "@/components/dossiers/registry/DossierCreationWizard";
import { getCabinetBillingMode } from "@/lib/services/cabinet-interface";
import { getCabinetDossierTaxonomyById } from "@/lib/dossiers/cabinet-dossier-taxonomy";
import { localizedLabel } from "@/lib/dossiers/taxonomy";
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
  const [clients, avocats, assistants, cabinetBillingMode, taxonomy] = await Promise.all([
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
    getCabinetDossierTaxonomyById(cabinetId),
  ]);

  // Taxonomie cabinet → options Sujet/Sous-matière localisées (sinon undefined → legacy).
  const subjectOptions = taxonomy
    ? taxonomy.subjects.map((s) => ({ value: s.code, label: localizedLabel(s, locale) }))
    : undefined;
  const submatterOptions = taxonomy
    ? Object.fromEntries(
        Object.entries(taxonomy.submatters).map(([code, list]) => [
          code,
          list.map((m) => ({ value: localizedLabel(m, locale), label: localizedLabel(m, locale) })),
        ]),
      )
    : undefined;

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
            subjectOptions={subjectOptions}
            submatterOptions={submatterOptions}
            initialError={params.error === "invalid" ? tx("newMatterErrorRequired") : undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
}
