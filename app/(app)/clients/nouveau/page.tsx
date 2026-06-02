import Link from "next/link";
import { routes } from "@/lib/routes";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { ClientCreationWizard } from "@/components/clients/registry/ClientCreationWizard";
import { requireCabinetId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { formatClientDisplayName } from "@/lib/clients/detect-duplicate";
import { getTranslations } from "next-intl/server";

export default async function NouveauClientPage({
  searchParams,
}: {
  searchParams: Promise<{ duplicate?: string; error?: string; existingId?: string }>;
}) {
  const t = await getTranslations("clientsUi");
  const cabinetId = await requireCabinetId();
  const params = await searchParams;
  const duplicateId = params.duplicate;
  const initialError = params.error === "invalid" ? "invalid" : undefined;
  const blockedDuplicateId = params.error === "duplicate" ? params.existingId : undefined;
  const blockedDuplicate = blockedDuplicateId
    ? await prisma.client.findFirst({
        where: { id: blockedDuplicateId, cabinetId },
        select: { id: true, raisonSociale: true, prenom: true, nom: true, typeClient: true },
      })
    : null;

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
        raisonSociale: duplicateClient.raisonSociale ?? undefined,
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
        title={duplicateClient ? t("duplicateClientTitle") : t("newClientTitle")}
        description={
          duplicateClient
            ? t("duplicateClientDesc")
            : t("newClientDesc")
        }
        backHref={routes.clients}
        backLabel={t("backToRegistry")}
      />
      {blockedDuplicate && (
        <div className="rounded-safe border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">
            {t("similarClientExists", { name: formatClientDisplayName(blockedDuplicate) })}
          </p>
          <p className="mt-1">
            {t("avoidDuplicatesHint")}
          </p>
          <Link
            href={`/clients/${blockedDuplicate.id}`}
            className="mt-2 inline-flex items-center font-semibold text-amber-900 underline underline-offset-2"
          >
            {t("openExistingRecord")}
          </Link>
        </div>
      )}
      <Card>
        <CardHeader title={duplicateClient ? t("duplicateClientTitle") : t("createClientTitle")} />
        <CardContent>
          <ClientCreationWizard lawyers={lawyers} initialData={initialData} initialError={initialError} />
        </CardContent>
      </Card>
    </div>
  );
}
