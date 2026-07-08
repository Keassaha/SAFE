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
import { isMultiPartiesDossierEnabled } from "@/lib/flags";
import type { PartieDraft } from "@/lib/dossiers/parties";

function clientDisplayName(dossier: {
  client: { raisonSociale: string | null; prenom: string | null; nom: string | null; typeClient: string };
}): string {
  const c = dossier.client;
  if (c.typeClient === "personne_physique" && (c.prenom || c.nom)) {
    return [c.nom, c.prenom].filter(Boolean).join(", ");
  }
  return c.raisonSociale ?? "";
}

function partyClientLabel(
  c: { raisonSociale: string | null; prenom: string | null; nom: string | null; typeClient: string } | null,
): string {
  if (!c) return "";
  if (c.typeClient === "personne_physique") {
    return [c.prenom, c.nom].filter(Boolean).join(" ").trim() || c.raisonSociale || "";
  }
  return c.raisonSociale || [c.prenom, c.nom].filter(Boolean).join(" ").trim();
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

  // Personnes du dossier (co-clients + parties externes), au-delà du principal.
  const multiPartiesEnabled = isMultiPartiesDossierEnabled();
  const dossierParties = multiPartiesEnabled
    ? await prisma.dossierPartie.findMany({
        where: { dossierId: id, cabinetId },
        orderBy: [{ estPrincipal: "desc" }, { createdAt: "asc" }],
        include: {
          client: {
            select: { id: true, typeClient: true, raisonSociale: true, prenom: true, nom: true },
          },
        },
      })
    : [];
  // Parties à réinjecter dans le formulaire d'édition (hors principal).
  const initialParties: PartieDraft[] = dossierParties
    .filter((p) => !p.estPrincipal)
    .map((p) =>
      p.nature === "co_client" && p.clientId
        ? { nature: "co_client" as const, clientId: p.clientId }
        : {
            nature: "partie_externe" as const,
            nomAffiche: p.nomAffiche ?? "",
            role: (p.role === "tiers" ? "tiers" : "partie_adverse") as "partie_adverse" | "tiers",
          },
    );

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
              multiPartiesEnabled={multiPartiesEnabled}
              initialParties={initialParties}
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
      <header className="sticky top-0 z-10 border-b border-si-line bg-si-surface/75 backdrop-blur-md px-6 py-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={routes.dossiers}
                className="text-sm font-medium text-emerald-700 hover:text-emerald-800 transition-colors"
              >
                ← {t("backToList")}
              </Link>
              <span className="text-si-muted/50">·</span>
              <span className="text-sm text-si-muted truncate">{clientName}</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-si-ink sm:text-2xl">
              {numeroDossier} — {dossier.intitule}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              {dossier.avocatResponsable?.nom && (
                <span className="rounded-lg bg-si-canvas border border-si-line/60 px-3 py-1 text-xs font-medium text-si-ink">
                  Avocat : {dossier.avocatResponsable.nom}
                </span>
              )}
              <span
                className={`inline-flex items-center rounded-lg px-3 py-1 text-xs font-semibold ${
                  dossier.statut === "actif" || dossier.statut === "ouvert"
                    ? "bg-emerald-50 border border-emerald-200/70 text-emerald-700"
                    : "bg-si-canvas border border-si-line/60 text-si-muted"
                }`}
              >
                {STATUT_LABELS[dossier.statut] ?? dossier.statut}
              </span>
              {mandatIncomplet && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-[#B84A3E]/10 border border-[#B84A3E]/30 px-3 py-1 text-xs font-medium text-[#B84A3E]">
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
              className="inline-flex items-center rounded-lg border border-si-line bg-si-surface/80 px-4 py-2 text-sm font-medium text-si-ink hover:bg-si-surface hover:border-si-line transition-colors"
            >
              {t("viewClient")}
            </Link>
            <Link
              href={`${routes.dossier(id)}?edit=1`}
              className="inline-flex items-center rounded-lg bg-si-forest px-4 py-2 text-sm font-semibold text-white hover:bg-si-forest-soft transition-colors shadow-md shadow-si-card"
            >
              {t("editMatter")}
            </Link>
          </div>
        </div>
      </header>

      {/* Personnes du dossier — co-clients + parties (adverse/tiers). N'apparaît
          que si le dossier réunit plus d'une personne. Doctrine :
          docs/product/SPEC_MULTI_CLIENTS_PARTIES_DOSSIER.md */}
      {multiPartiesEnabled && dossierParties.some((p) => !p.estPrincipal) && (
        <section className="px-6 pt-5 bg-si-surface">
          <div className="rounded-2xl border border-si-line bg-si-surface p-4">
            <h2 className="mb-3 text-sm font-semibold text-si-ink">{t("dossierPeople")}</h2>
            <ul className="space-y-2">
              {dossierParties.map((p) => {
                const isExterne = p.nature === "partie_externe";
                const label = isExterne ? p.nomAffiche ?? "—" : partyClientLabel(p.client);
                const badge = p.estPrincipal
                  ? t("principalClientBadge")
                  : p.nature === "co_client"
                    ? t("coClientBadge")
                    : p.role === "tiers"
                      ? t("roleThird")
                      : t("roleAdverse");
                return (
                  <li key={p.id} className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate text-sm text-si-ink">
                      {!isExterne && p.clientId ? (
                        <Link href={routes.client(p.clientId)} className="hover:underline">
                          {label}
                        </Link>
                      ) : (
                        label
                      )}
                    </span>
                    <span
                      className={`shrink-0 rounded-lg border px-2 py-0.5 text-xs font-medium ${
                        isExterne
                          ? "border-si-line bg-si-canvas text-si-muted"
                          : "border-emerald-200/70 bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {badge}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      {/* T1 — Bloc « Où j'en étais ? » (context-resume, différenciateur + TDAH). */}
      {resume && (
        <section className="px-6 pt-5 bg-si-surface">
          <DossierResumeCard
            resume={resume}
            locale={resumeLocale}
            nextActionHref={resume.nextAction ? "#preparation" : undefined}
          />
        </section>
      )}

      {/* Résumé IA du dossier — fonction IA différée : entièrement MASQUÉE tant que
          ANTHROPIC_API_KEY n'est pas configurée (pas de bouton qui échoue devant un cabinet).
          Réapparaît automatiquement dès que la clé est ajoutée. */}
      {process.env.ANTHROPIC_API_KEY && (
        <section className="px-6 py-5 border-b border-si-line bg-si-surface">
          <DossierResumeIA
            dossierId={dossier.id}
            initialResume={dossier.resumeDossier}
            canSave={["admin_cabinet", "avocat", "assistante"].includes(role as string)}
          />
        </section>
      )}

      {/* Carte État de préparation — V2 couche assistante active (deep links + bouton). */}
      {preparationStatus && (
        <section id="preparation" className="px-6 py-5 border-b border-si-line bg-si-surface scroll-mt-24">
          <DossierPreparationCard
            status={preparationStatus}
            dossierId={dossier.id}
            clientId={dossier.clientId}
            canSelfAssign={canAssignSelfAsAssistant(role as UserRole)}
          />
        </section>
      )}

      {/* N2 — Navette : communication interne assistante↔avocate sur ce dossier */}
      <section className="px-6 py-5 border-b border-si-line bg-si-surface">
        <NavetteThread
          dossierId={id}
          rows={navetteSerialized}
          currentUserId={userId}
          currentUserRole={role}
          locale={resumeLocale}
        />
      </section>

      {/* Documents rédigés via l'éditeur SAFE */}
      <section className="px-6 py-5 border-b border-si-line bg-si-surface">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-si-ink">Documents rédigés</h2>
            <p className="text-xs text-si-muted mt-0.5">
              Documents créés depuis l&apos;éditeur · liés à ce dossier
            </p>
          </div>
          <Link
            href={`/edition/${id}`}
            className="inline-flex items-center gap-1.5 rounded-md bg-si-forest hover:bg-si-forest-soft text-white px-3 py-1.5 text-xs font-medium transition-colors"
          >
            + Nouveau / Atelier
          </Link>
        </div>
        {richDocs.length === 0 ? (
          <div className="text-xs text-si-muted italic py-3 px-3 bg-si-canvas rounded-md border border-si-line">
            Aucun document rédigé pour ce dossier.{" "}
            <Link href={`/edition/${id}`} className="text-emerald-700 hover:underline">
              Créer le premier
            </Link>
          </div>
        ) : (
          <div className="border border-si-line rounded-md overflow-hidden bg-si-surface">
            {richDocs.map((d, i) => {
              const statutColor =
                d.statut === "final"
                  ? "text-si-verified bg-si-verified/10 border-si-verified/30"
                  : d.statut === "brouillon"
                  ? "text-si-amber-ink bg-si-amber/[0.13] border-si-amber/30"
                  : "text-si-muted bg-si-canvas border-si-line";
              const statutLabel =
                d.statut === "final" ? "Final" : d.statut === "brouillon" ? "Brouillon" : "Archivé";
              return (
                <Link
                  key={d.id}
                  href={`/edition/${id}/${d.id}`}
                  className={`flex items-center gap-3 px-4 py-2.5 hover:bg-si-canvas transition-colors ${
                    i > 0 ? "border-t border-si-line" : ""
                  }`}
                >
                  <div className="text-si-muted/60">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                      <path d="M14 3v5h5" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-si-ink truncate">{d.titre}</div>
                    <div className="text-xs text-si-muted mt-0.5">
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
