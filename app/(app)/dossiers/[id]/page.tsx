import { notFound } from "next/navigation";
import Link from "next/link";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { routes } from "@/lib/routes";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { DossierForm } from "@/components/dossiers/DossierForm";
import { DossierDetailTabs } from "@/components/dossiers/detail";
import { canViewSensitiveFields } from "@/lib/auth/permissions";
import type { UserRole } from "@prisma/client";
import { getTranslations } from "next-intl/server";

function clientDisplayName(dossier: {
  client: { raisonSociale: string; prenom: string | null; nom: string | null; typeClient: string };
}): string {
  const c = dossier.client;
  if (c.typeClient === "personne_physique" && (c.prenom || c.nom)) {
    return [c.nom, c.prenom].filter(Boolean).join(", ");
  }
  return c.raisonSociale;
}

export default async function DossierDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; edit?: string }>;
}) {
  const { id } = await params;
  const { error, edit } = await searchParams;
  const { cabinetId, userId, role } = await requireCabinetAndUser();

  const dossier = await prisma.dossier.findFirst({
    where: { id, cabinetId },
    include: {
      client: true,
      avocatResponsable: { select: { nom: true } },
      assistantJuridique: { select: { nom: true } },
      mandate: true,
    },
  });
  if (!dossier) notFound();

  const t = await getTranslations("matters");
  const tc = await getTranslations("common");

  const STATUT_LABELS: Record<string, string> = {
    ouvert: t("statusOpen"),
    actif: t("statusActive"),
    en_attente: t("statusPending"),
    cloture: t("statusClosed"),
    archive: t("statusArchived"),
  };

  // Badge "Mandat incomplet" si la checklist du mandat a des documents obligatoires non cochés
  const mandatChecklist = (dossier.mandate?.checklist as Array<{ obligatoire?: boolean; checked?: boolean }> | null) ?? [];
  const mandatIncomplet =
    mandatChecklist.some((item) => item.obligatoire === true && item.checked !== true) ?? false;

  const showEditForm = edit === "1";

  if (showEditForm) {
    const [clients, avocats, assistants] = await Promise.all([
      prisma.client.findMany({
        where: { cabinetId },
        orderBy: { raisonSociale: "asc" },
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
    const canEditSensitive = canViewSensitiveFields(role as UserRole, {
      avocatResponsableId: dossier.avocatResponsableId,
      userId,
    });

    return (
      <div className="space-y-6">
        <PageHeader
          title={t("editInfo")}
          backHref={routes.dossier(id)}
          backLabel={t("backToList")}
        />
        <Card>
          <CardHeader title={t("editInfo")} />
          <CardContent>
            <DossierForm
              dossier={dossier}
              clients={clients}
              avocats={avocats}
              assistants={assistants}
              canEditSensitive={canEditSensitive}
              error={
                error === "invalid"
                  ? tc("invalidData")
                  : error === "numero_dossier_duplique"
                    ? t("duplicateMatterNumber")
                    : undefined
              }
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  const clientName = clientDisplayName(dossier);
  const numeroDossier = dossier.numeroDossier ?? dossier.reference ?? "Dossier";
  const statutDossier = dossier.mandate?.statutDossier ?? dossier.statut;

  return (
    <div className="space-y-0">
      {/* En-tête dossier : hiérarchie claire, actions à droite */}
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[var(--safe-neutral-900)]/95 backdrop-blur-md px-6 py-4 shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={routes.dossiers}
                className="text-sm font-medium text-[var(--safe-green-600)] hover:text-[var(--safe-green-100)] transition-colors"
              >
                ← {t("backToList")}
              </Link>
              <span className="text-[var(--safe-neutral-500)]">·</span>
              <span className="text-sm text-white/80 truncate">{clientName}</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              {numeroDossier} — {dossier.intitule}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              {dossier.avocatResponsable?.nom && (
                <span className="rounded-md bg-white/10 px-2.5 py-1 text-xs font-medium text-white/90">
                  Avocat : {dossier.avocatResponsable.nom}
                </span>
              )}
              <span
                className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${
                  dossier.statut === "actif" || dossier.statut === "ouvert"
                    ? "bg-[var(--safe-status-success)]/20 text-[var(--safe-green-100)]"
                    : "bg-white/10 text-white/80"
                }`}
              >
                {STATUT_LABELS[dossier.statut] ?? dossier.statut}
              </span>
              {mandatIncomplet && (
                <span className="inline-flex items-center gap-1 rounded-md bg-red-500/20 px-2.5 py-1 text-xs font-medium text-red-200">
                  ⚠ Mandat incomplet
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Link
              href={routes.client(dossier.clientId)}
              className="inline-flex items-center rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition-colors"
            >
              {t("viewClient")}
            </Link>
            <Link
              href={`${routes.dossier(id)}?edit=1`}
              className="inline-flex items-center rounded-lg bg-[var(--safe-green-600)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--safe-green-700)] transition-colors shadow-md"
            >
              {t("editMatter")}
            </Link>
          </div>
        </div>
      </header>

      {/* Onglets de détail */}
      <div className="p-4 sm:p-6">
        <DossierDetailTabs
          dossierId={id}
          statutDossier={statutDossier}
        />
      </div>
    </div>
  );
}
