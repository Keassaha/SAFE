import { notFound } from "next/navigation";
import Link from "next/link";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { routes } from "@/lib/routes";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { IdentityVerificationForm } from "@/components/clients/IdentityVerificationForm";
import { IdentityVerificationSection } from "@/components/clients/IdentityVerificationSection";
import { canManageIdentityVerification } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import { getTranslations } from "next-intl/server";

export default async function ClientVerificationIdentitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: clientId } = await params;
  const t = await getTranslations("clientsUi");
  const { cabinetId, role } = await requireCabinetAndUser();
  const [client, verifications] = await Promise.all([
    prisma.client.findFirst({
      where: { id: clientId, cabinetId },
    }),
    prisma.clientIdentityVerification.findMany({
      where: { clientId, client: { cabinetId } },
      include: { document: true },
      orderBy: { date: "desc" },
    }),
  ]);
  if (!client) notFound();
  const canManage = canManageIdentityVerification(role as UserRole);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("identityVerificationTitle", {
          name: client.raisonSociale ?? [client.prenom, client.nom].filter(Boolean).join(" "),
        })}
        backHref={routes.client(clientId)}
        backLabel={t("backToClient")}
      />
      {canManage && (
        <Card>
          <CardHeader title={t("newVerification")} />
          <CardContent>
            <IdentityVerificationForm clientId={clientId} />
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader title={t("history")} />
        <CardContent>
          <IdentityVerificationSection
            clientId={clientId}
            verifications={verifications}
            canManage={canManage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
