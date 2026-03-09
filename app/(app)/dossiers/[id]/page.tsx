import { notFound } from "next/navigation";
import Link from "next/link";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { routes } from "@/lib/routes";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { DossierForm } from "@/components/dossiers/DossierForm";
import { DocumentsSection } from "@/components/documents/DocumentsSection";
import { DossierProfile } from "@/components/dossiers/registry/DossierProfile";
import type { DossierProfileData } from "@/components/dossiers/registry/DossierProfile";
import type { DossierOverviewData } from "@/components/dossiers/registry/DossierOverview";
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
    },
  });
  if (!dossier) notFound();

  const [
    clients,
    avocats,
    assistants,
    documents,
    timeEntries,
    taches,
    evenements,
    dossierNotes,
    deboursDossiers,
    deboursTypes,
  ] = await Promise.all([
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
    prisma.document.findMany({
      where: { dossierId: id, cabinetId },
      orderBy: { createdAt: "desc" },
      include: { uploadedBy: { select: { nom: true } } },
    }),
    prisma.timeEntry.findMany({
      where: { dossierId: id, cabinetId },
      include: { user: { select: { nom: true } } },
      orderBy: { date: "desc" },
    }),
    prisma.dossierTache.findMany({
      where: { dossierId: id, dossier: { cabinetId } },
      include: { assignee: { select: { nom: true } } },
      orderBy: { dateEcheance: "asc" },
    }),
    prisma.dossierEvenement.findMany({
      where: { dossierId: id, dossier: { cabinetId } },
      orderBy: { date: "asc" },
    }),
    prisma.dossierNote.findMany({
      where: { dossierId: id, dossier: { cabinetId } },
      include: { createdBy: { select: { nom: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.deboursDossier.findMany({
      where: { dossierId: id, cabinetId },
      orderBy: { date: "desc" },
      include: {
        deboursType: { select: { nom: true, categorie: true } },
        facture: { select: { numero: true } },
      },
    }),
    prisma.deboursType.findMany({
      where: { cabinetId, actif: true },
      select: { id: true, nom: true, categorie: true },
      orderBy: [{ categorie: "asc" }, { nom: "asc" }],
    }),
  ]);

  const t = await getTranslations("matters");
  const tc = await getTranslations("common");

  const STATUT_LABELS: Record<string, string> = {
    ouvert: t("statusOpen"),
    actif: t("statusActive"),
    en_attente: t("statusPending"),
    cloture: t("statusClosed"),
    archive: t("statusArchived"),
  };

  const canEditSensitive = canViewSensitiveFields(role as UserRole, {
    avocatResponsableId: dossier.avocatResponsableId,
    userId,
  });

  const totalHeures = timeEntries.reduce((s, e) => s + e.dureeMinutes, 0) / 60;
  const totalMontant = timeEntries.reduce((s, e) => s + e.montant, 0);

  const overview: DossierOverviewData = {
    clientId: dossier.clientId,
    clientName: clientDisplayName(dossier),
    avocatResponsableNom: dossier.avocatResponsable?.nom ?? null,
    assistantJuridiqueNom: dossier.assistantJuridique?.nom ?? null,
    tribunalNom: dossier.tribunalNom ?? null,
    districtJudiciaire: dossier.districtJudiciaire ?? null,
    numeroDossierTribunal: dossier.numeroDossierTribunal ?? null,
    nomJuge: dossier.nomJuge ?? null,
    resumeDossier: dossier.resumeDossier ?? null,
    statut: dossier.statut,
    type: dossier.type,
    reference: dossier.reference,
    intitule: dossier.intitule,
    dateOuverture: dossier.dateOuverture,
    modeFacturation: dossier.modeFacturation,
    tauxHoraire: dossier.tauxHoraire,
  };

  const profileData: DossierProfileData = {
    overview,
    dossierId: dossier.id,
    timeEntries: timeEntries.map((e) => ({
      id: e.id,
      date: e.date,
      description: e.description,
      dureeMinutes: e.dureeMinutes,
      montant: e.montant,
      userNom: e.user.nom,
    })),
    totalHeures,
    totalMontant,
    documentsSlot: (
      <DocumentsSection
        dossierId={dossier.id}
        clientId={dossier.clientId}
        documents={documents}
        canManage={role === "admin_cabinet" || role === "assistante"}
      />
    ),
    tasks: taches.map((t) => ({
      id: t.id,
      titre: t.titre,
      description: t.description,
      priorite: t.priorite,
      statut: t.statut,
      dateEcheance: t.dateEcheance,
      assigneeId: t.assigneeId,
      assignee: t.assignee ? { nom: t.assignee.nom } : null,
    })),
    events: evenements.map((e) => ({
      id: e.id,
      type: e.type,
      titre: e.titre,
      date: e.date,
      lieu: e.lieu,
      notes: e.notes,
    })),
    taskUsers: [...avocats, ...assistants],
    descriptionConfidentielle: dossier.descriptionConfidentielle,
    notesStrategieJuridique: dossier.notesStrategieJuridique,
    notes: dossierNotes.map((n) => ({
      id: n.id,
      content: n.content,
      createdAt: n.createdAt,
      createdByNom: n.createdBy?.nom ?? null,
    })),
    soldeFiducieDossier: dossier.soldeFiducieDossier,
    autoriserPaiementFiducie: dossier.autoriserPaiementFiducie,
    debours: deboursDossiers.map((d) => ({
      id: d.id,
      description: d.description,
      montant: d.montant,
      taxable: d.taxable,
      date: d.date,
      payeParCabinet: d.payeParCabinet,
      refacturable: d.refacturable,
      factureId: d.factureId,
      factureNumero: d.facture?.numero ?? null,
      deboursTypeNom: d.deboursType?.nom ?? null,
      deboursTypeCategorie: d.deboursType?.categorie ?? null,
    })),
    deboursTypes: deboursTypes.map((t) => ({ id: t.id, nom: t.nom, categorie: t.categorie })),
    clientTrustLink: (
      <Link
        href={`${routes.comptes}?clientId=${encodeURIComponent(dossier.clientId)}&dossierId=${encodeURIComponent(id)}`}
        className="text-sm text-primary-700 hover:underline"
      >
        {t("viewTrustModuleLink")}
      </Link>
    ),
  };

  const showEditForm = edit === "1";

  return (
    <div className="space-y-6">
      <PageHeader
        title={`${dossier.numeroDossier ?? dossier.reference ?? "Dossier"} — ${dossier.intitule}`}
        backHref={routes.dossiers}
        backLabel={t("backToList")}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                dossier.statut === "actif" || dossier.statut === "ouvert"
                  ? "bg-status-success-bg text-status-success"
                  : "bg-neutral-200 text-neutral-muted"
              }`}
            >
              {STATUT_LABELS[dossier.statut] ?? dossier.statut}
            </span>
            <Link
              href={routes.client(dossier.clientId)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-border bg-white text-neutral-text-secondary hover:bg-primary-50 hover:text-primary-700 transition-colors text-sm font-medium"
            >
              {t("viewClient")}
            </Link>
            {showEditForm ? (
              <Link
                href={routes.dossier(id)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-neutral-border bg-white text-neutral-text-secondary hover:bg-primary-50 text-sm font-medium"
              >
                {t("closeEdit")}
              </Link>
            ) : (
              <Link
                href={`${routes.dossier(id)}?edit=1`}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-primary-600 bg-primary-50 text-primary-700 text-sm font-medium hover:bg-primary-100"
              >
                {t("editMatter")}
              </Link>
            )}
          </div>
        }
      />

      {showEditForm && (
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
      )}

      {!showEditForm && (
        <Card>
          <CardContent className="pt-6">
            <DossierProfile data={profileData} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
