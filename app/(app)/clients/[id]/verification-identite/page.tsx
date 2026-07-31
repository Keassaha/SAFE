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
import { getCabinetProvince } from "@/lib/cabinet/get-province";
import { resolveProvince } from "@/lib/compliance/rules";
import { getVerificationMethods } from "@/lib/compliance/identity";

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

  // CH-06.6 — les méthodes de vérification proposées dépendent du RÉGIME applicable
  // et du type de client. L'Ontario en énumère limitativement trois pour une personne
  // physique (By-Law 7.1 s. 23(7)1) ; le Québec admet en plus le répondant (art. 24),
  // que l'Ontario ignore. Le calcul se fait côté serveur pour qu'aucune méthode
  // inapplicable n'atteigne jamais l'écran.
  const province = resolveProvince(await getCabinetProvince(cabinetId));
  // Réglage cabinet : la pièce est-elle exigée pour marquer « vérifié » ? (CH-06.7)
  const cabinet = await prisma.cabinet.findUnique({
    where: { id: cabinetId },
    select: { identityProofRequired: true },
  });
  const subjectKind = client.typeClient === "personne_physique" ? "INDIVIDUAL" : "ORGANIZATION";
  const methods = getVerificationMethods(province).filter((m) => m.appliesTo.includes(subjectKind));

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
            <IdentityVerificationForm
              clientId={clientId}
              province={province}
              subjectKind={subjectKind}
              methods={methods}
              proofRequiredByCabinet={cabinet?.identityProofRequired ?? true}
            />
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
