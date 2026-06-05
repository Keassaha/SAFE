import { notFound } from "next/navigation";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import { requireCabinetAndUser } from "@/lib/auth/session";
import { routes } from "@/lib/routes";
import { prisma } from "@/lib/db";
import { toIntlLocale, normalizeAppLocale } from "@/lib/i18n/locale";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { DossierForm } from "@/components/dossiers/DossierForm";
import { DossierBriefcase } from "@/components/dossiers/briefcase";
import { canViewSensitiveFields, canAssignSelfAsAssistant } from "@/lib/auth/permissions";
import { getDossierSections, generateCartable } from "@/lib/dossiers/cartable-service";
import { loadDossierPreparationSnapshot } from "@/lib/dossiers/preparation-loader";
import { getDossierPreparationStatus } from "@/lib/dossiers/preparation-status";
import { DossierPreparationCard } from "@/components/dossiers/DossierPreparationCard";
import { getDossierResume } from "@/lib/dossiers/dossier-resume";
import { DossierResumeCard } from "@/components/dossiers/DossierResumeCard";
import { DossierResumeIA } from "@/components/dossiers/DossierResumeIA";
import { getDossierNavette } from "@/lib/navette/navette-service";
import { NavetteThread } from "@/components/navette/NavetteThread";
import { StartTimerButton } from "@/components/temps/StartTimerButton";
import type { UserRole } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { getCabinetBillingMode } from "@/lib/services/cabinet-interface";
import { getCabinetDossierTaxonomyById } from "@/lib/dossiers/cabinet-dossier-taxonomy";
import { localizedLabel } from "@/lib/dossiers/taxonomy";

function clientDisplayName(dossier: {
  client: { raisonSociale: string | null; prenom: string | null; nom: string | null; typeClient: string };
}): string {
  const c = dossier.client;
  if (c.typeClient === "personne_physique" && (c.prenom || c.nom)) {
    return [c.nom, c.prenom].filter(Boolean).join(", ");
  }
  return c.raisonSociale ?? "";
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
  const rawLocale = await getLocale();
  const intlLocale = toIntlLocale(rawLocale);
  // Locale du bloc de reprise = locale de l'app (FR si app FR, EN si app EN).
  const resumeLocale = normalizeAppLocale(rawLocale);

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

  // Sections cartable — génération auto si dossier existant sans sections
  let sections = await getDossierSections(id, cabinetId);
  if (sections.length === 0 && dossier.type) {
    await generateCartable(id, cabinetId, dossier.type, dossier.sousType);
    sections = await getDossierSections(id, cabinetId);
  }

  // Documents rédigés via l'éditeur (RichDocument) liés à ce dossier
  const richDocs = await prisma.richDocument.findMany({
    where: { dossierId: id, cabinetId, isArchived: false },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      titre: true,
      type: true,
      statut: true,
      updatedAt: true,
      lastEditedBy: { select: { nom: true } },
      _count: { select: { versions: true } },
    },
  });

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
    const [clients, avocats, assistants, cabinetBillingMode, taxonomy] = await Promise.all([
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
      getCabinetBillingMode(cabinetId),
      getCabinetDossierTaxonomyById(cabinetId),
    ]);
    const localeStr = await getLocale();
    const subjectOptions = taxonomy
      ? taxonomy.subjects.map((s) => ({ value: s.code, label: localizedLabel(s, localeStr) }))
      : undefined;
    const submatterOptions = taxonomy
      ? Object.fromEntries(
          Object.entries(taxonomy.submatters).map(([code, list]) => [
            code,
            list.map((m) => ({ value: localizedLabel(m, localeStr), label: localizedLabel(m, localeStr) })),
          ]),
        )
      : undefined;
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
              cabinetBillingMode={cabinetBillingMode}
              subjectOptions={subjectOptions}
              submatterOptions={submatterOptions}
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

  // Doctrine: docs/product/ACTIVE_ASSISTANT_LAYER.md
  // Calcul de l'état de préparation (dérivé, jamais stocké).
  const preparationSnapshot = await loadDossierPreparationSnapshot(
    cabinetId,
    id,
    { callerUserId: userId },
  );
  const preparationStatus = preparationSnapshot
    ? getDossierPreparationStatus(preparationSnapshot)
    : null;

  // T1 — Bloc « Où j'en étais ? » (context-resume, dérivé, zéro migration).
  const resume = await getDossierResume(cabinetId, id, resumeLocale);

  // N2 — Navette : fil de communication interne du dossier (sérialisé pour le client).
  const navetteRows = await getDossierNavette(cabinetId, id, role);
  const navetteSerialized = navetteRows.map((r) => ({
    id: r.id,
    type: r.type,
    body: r.body,
    authorName: r.authorName,
    authorRole: r.authorRole,
    recipientId: r.recipientId,
    dueDate: r.dueDate ? r.dueDate.toISOString() : null,
    confidentiel: r.confidentiel,
    resolvedAt: r.resolvedAt ? r.resolvedAt.toISOString() : null,
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-0">
      {/* En-tête dossier — Liquid Glass clair, hiérarchie claire, actions à droite */}
      <header className="sticky top-0 z-10 border-b border-slate-200/70 bg-white/75 backdrop-blur-md px-6 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={routes.dossiers}
                className="text-sm font-medium text-emerald-700 hover:text-emerald-800 transition-colors"
              >
                ← {t("backToList")}
              </Link>
              <span className="text-slate-300">·</span>
              <span className="text-sm text-slate-600 truncate">{clientName}</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              {numeroDossier} — {dossier.intitule}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              {dossier.avocatResponsable?.nom && (
                <span className="rounded-safe-sm bg-slate-100 border border-slate-200/60 px-3 py-1 text-xs font-medium text-slate-700">
                  Avocat : {dossier.avocatResponsable.nom}
                </span>
              )}
              <span
                className={`inline-flex items-center rounded-safe-sm px-3 py-1 text-xs font-semibold ${
                  dossier.statut === "actif" || dossier.statut === "ouvert"
                    ? "bg-emerald-50 border border-emerald-200/70 text-emerald-700"
                    : "bg-slate-100 border border-slate-200/60 text-slate-600"
                }`}
              >
                {STATUT_LABELS[dossier.statut] ?? dossier.statut}
              </span>
              {mandatIncomplet && (
                <span className="inline-flex items-center gap-1 rounded-safe-sm bg-red-50 border border-red-200/70 px-3 py-1 text-xs font-medium text-red-700">
                  ⚠ Mandat incomplet
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <StartTimerButton
              clientId={dossier.clientId}
              clientLabel={clientName}
              dossierId={id}
              dossierLabel={numeroDossier}
              variant="soft"
            />
            <Link
              href={routes.client(dossier.clientId)}
              className="inline-flex items-center rounded-safe-sm border border-slate-200 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-white hover:border-slate-300 transition-colors"
            >
              {t("viewClient")}
            </Link>
            <Link
              href={`${routes.dossier(id)}?edit=1`}
              className="inline-flex items-center rounded-safe-sm bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors shadow-md shadow-emerald-600/20"
            >
              {t("editMatter")}
            </Link>
          </div>
        </div>
      </header>

      {/* T1 — Bloc « Où j'en étais ? » (context-resume, différenciateur + TDAH). */}
      {resume && (
        <section className="px-6 pt-5 bg-white">
          <DossierResumeCard
            resume={resume}
            locale={resumeLocale}
            nextActionHref={resume.nextAction ? "#preparation" : undefined}
          />
        </section>
      )}

      {/* Résumé IA du dossier — factuel, garde-fous Barreau, validation humaine.
          Inactif (message) tant que ANTHROPIC_API_KEY n'est pas configurée. */}
      <section className="px-6 py-5 border-b border-slate-200/70 bg-white">
        <DossierResumeIA
          dossierId={dossier.id}
          initialResume={dossier.resumeDossier}
          canSave={["admin_cabinet", "avocat", "assistante"].includes(role as string)}
        />
      </section>

      {/* Carte État de préparation — V2 couche assistante active (deep links + bouton). */}
      {preparationStatus && (
        <section id="preparation" className="px-6 py-5 border-b border-slate-200/70 bg-white scroll-mt-24">
          <DossierPreparationCard
            status={preparationStatus}
            dossierId={dossier.id}
            clientId={dossier.clientId}
            canSelfAssign={canAssignSelfAsAssistant(role as UserRole)}
          />
        </section>
      )}

      {/* N2 — Navette : communication interne assistante↔avocate sur ce dossier */}
      <section className="px-6 py-5 border-b border-slate-200/70 bg-white">
        <NavetteThread
          dossierId={id}
          rows={navetteSerialized}
          currentUserId={userId}
          currentUserRole={role}
          locale={resumeLocale}
        />
      </section>

      {/* Documents rédigés via l'éditeur SAFE */}
      <section className="px-6 py-5 border-b border-slate-200/70 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Documents rédigés</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Documents créés depuis l&apos;éditeur · liés à ce dossier
            </p>
          </div>
          <Link
            href={`/edition/${id}`}
            className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 text-xs font-medium transition-colors"
          >
            + Nouveau / Atelier
          </Link>
        </div>
        {richDocs.length === 0 ? (
          <div className="text-xs text-slate-500 italic py-3 px-3 bg-slate-50 rounded-md border border-slate-200">
            Aucun document rédigé pour ce dossier.{" "}
            <Link href={`/edition/${id}`} className="text-emerald-700 hover:underline">
              Créer le premier
            </Link>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-md overflow-hidden bg-white">
            {richDocs.map((d, i) => {
              const statutColor =
                d.statut === "final"
                  ? "text-green-700 bg-green-50 border-green-200"
                  : d.statut === "brouillon"
                  ? "text-amber-700 bg-amber-50 border-amber-200"
                  : "text-slate-600 bg-slate-50 border-slate-200";
              const statutLabel =
                d.statut === "final" ? "Final" : d.statut === "brouillon" ? "Brouillon" : "Archivé";
              return (
                <Link
                  key={d.id}
                  href={`/edition/${id}/${d.id}`}
                  className={`flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors ${
                    i > 0 ? "border-t border-slate-100" : ""
                  }`}
                >
                  <div className="text-slate-400">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                      <path d="M14 3v5h5" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-900 truncate">{d.titre}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {d.type} · {d._count.versions} version{d._count.versions > 1 ? "s" : ""}
                      {d.lastEditedBy?.nom && ` · ${d.lastEditedBy.nom}`}
                      {" · "}
                      {new Date(d.updatedAt).toLocaleDateString(intlLocale, { day: "numeric", month: "short" })}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${statutColor}`}>
                    {statutLabel}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Cartables de détail */}
      <DossierBriefcase
        dossierId={id}
        statutDossier={statutDossier}
        sections={sections}
      />
    </div>
  );
}
