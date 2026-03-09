import { routes } from "@/lib/routes";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { ClientCreationWizard } from "@/components/clients/registry/ClientCreationWizard";
import { requireCabinetId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export default async function NouveauClientPage({
  searchParams,
}: {
  searchParams: Promise<{ duplicate?: string; error?: string }>;
}) {
  const cabinetId = await requireCabinetId();
  const params = await searchParams;
  const duplicateId = params.duplicate;
  const initialError = params.error === "invalid" ? "invalid" : undefined;

  const [lawyers, duplicateClient] = await Promise.all([
    prisma.user.findMany({
      where: { cabinetId, role: "avocat" },
      select: { id: true, nom: true },
      orderBy: { nom: "asc" },
    }),
    duplicateId
      ? prisma.client.findFirst({
          where: { id: duplicateId, cabinetId },
        })
      : null,
  ]);

  const initialData = duplicateClient
    ? {
        typeClient: duplicateClient.typeClient,
        raisonSociale: duplicateClient.raisonSociale,
        prenom: duplicateClient.prenom ?? undefined,
        nom: duplicateClient.nom ?? undefined,
        email: duplicateClient.email ?? undefined,
        telephone: duplicateClient.telephone ?? undefined,
        addressLine1: duplicateClient.addressLine1 ?? undefined,
        city: duplicateClient.city ?? undefined,
        province: duplicateClient.province ?? undefined,
        postalCode: duplicateClient.postalCode ?? undefined,
        country: duplicateClient.country ?? undefined,
        langue: duplicateClient.langue ?? undefined,
        assignedLawyerId: duplicateClient.assignedLawyerId ?? undefined,
        representationType: duplicateClient.representationType ?? undefined,
        billingContactName: duplicateClient.billingContactName ?? undefined,
        billingEmail: duplicateClient.billingEmail ?? undefined,
      }
    : undefined;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={duplicateClient ? "Dupliquer le client" : "Nouveau client"}
        description={
          duplicateClient
            ? "Créez un nouveau client à partir des informations existantes."
            : "Créez un client en 6 étapes : identification, coordonnées, représentation, facturation, conformité, récapitulatif."
        }
        backHref={routes.clients}
        backLabel="Retour au registre"
      />
      <Card>
        <CardHeader title={duplicateClient ? "Dupliquer le client" : "Création du client"} />
        <CardContent>
          <ClientCreationWizard lawyers={lawyers} initialData={initialData} initialError={initialError} />
        </CardContent>
      </Card>
    </div>
  );
}
