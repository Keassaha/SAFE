import { getTranslations } from "next-intl/server";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { TempsPageClient } from "./TempsPageClient";
import { RegistreTachesPage } from "./RegistreTachesPage";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/PageHeader";
import type { UserRole } from "@prisma/client";

export default async function TempsPage() {
  const { cabinetId, userId, role } = await requireCabinetAndUser();

  // Detect billing mode from CabinetInterface
  const interfaceConfig = await prisma.cabinetInterface.findUnique({
    where: { cabinetId },
  });
  const modules = interfaceConfig?.modules ? JSON.parse(interfaceConfig.modules) : {};
  const isForfait = modules?.facturation?.principal === "forfait";

  if (isForfait) {
    const [dossiers, t] = await Promise.all([
      prisma.dossier.findMany({
        where: { cabinetId, statut: { in: ["ouvert", "actif", "en_attente"] } },
        select: { id: true, intitule: true, numeroDossier: true, clientId: true },
        orderBy: { intitule: "asc" },
      }),
      getTranslations("temps.taskRegister"),
    ]);

    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title={t("title")} description={t("description")} />
        <RegistreTachesPage dossiers={dossiers} />
      </div>
    );
  }

  return (
    <TempsPageClient
      cabinetId={cabinetId}
      userId={userId}
      role={role as UserRole}
    />
  );
}
