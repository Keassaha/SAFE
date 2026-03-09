import { routes } from "@/lib/routes";
import { requireCabinetId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { DossierCreationWizard } from "@/components/dossiers/registry/DossierCreationWizard";

export default async function NouveauDossierPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; clientId?: string }>;
}) {
  const cabinetId = await requireCabinetId();
  const params = await searchParams;
  const initialClientId = params.clientId?.trim() || undefined;

  const [clients, avocats, assistants] = await Promise.all([
    prisma.client.findMany({
      where: { cabinetId },
      orderBy: { raisonSociale: "asc" },
      select: { id: true, raisonSociale: true },
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
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nouveau dossier"
        description="Créez un dossier en quelques étapes."
        backHref={routes.dossiers}
        backLabel="Retour à la liste"
      />
      <Card>
        <CardHeader title="Création du dossier" />
        <CardContent>
          <DossierCreationWizard
            clients={clients}
            avocats={avocats}
            assistants={assistants}
            initialClientId={initialClientId}
            initialError={params.error === "invalid" ? "Vérifiez les champs obligatoires (client et type)." : undefined}
          />
        </CardContent>
      </Card>
    </div>
  );
}
