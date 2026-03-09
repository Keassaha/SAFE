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

export default async function ClientVerificationIdentitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: clientId } = await params;
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
        title={`Vérification d&apos;identité — ${client.raisonSociale}`}
        backHref={routes.client(clientId)}
        backLabel="Retour au client"
      />
      {canManage && (
        <Card>
          <CardHeader title="Nouvelle vérification" />
          <CardContent>
            <IdentityVerificationForm clientId={clientId} />
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader title="Historique" />
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
