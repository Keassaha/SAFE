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
import { DossierResumeOuverture } from "@/components/dossiers/DossierResumeOuverture";
import { DossierProfile } from "@/components/dossiers/DossierProfile";
import { canViewSensitiveFields } from "@/lib/auth/permissions";
import { getDossierSections, generateCartable } from "@/lib/dossiers/cartable-service";
import { loadDossierPreparationSnapshot } from "@/lib/dossiers/preparation-loader";
import { getDossierPreparationStatus } from "@/lib/dossiers/preparation-status";
import { DossierEtatCard } from "@/components/dossiers/DossierEtatCard";
import { getDossierResume } from "@/lib/dossiers/dossier-resume";
import { DossierResumeIAAction } from "@/components/dossiers/DossierResumeIAAction";
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
import { PiecesAttenduesSection } from "@/components/dossiers/PiecesAttenduesSection";
import { chargerPiecesAttendues } from "@/lib/dossiers/pieces-attendues-service";
import { toCalendarDayUTC } from "@/lib/utils/calendar-date";
import { canManageDossiers } from "@/lib/auth/permissions";

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
  /* « statutDossier » a ete retire le 2026-08-27 : il n'alimentait que
     « DossierBriefcase », qui ne recevait deja pas ce statut au travail (son
     propre parametre s'appelle « _statutDossier »). Le cartable est passe en
     l'onglet « Cartable » de « DossierProfile », qui n'en a pas besoin.
     Le composant reste utilise par app/(app-v2), il n'est donc pas supprime. */

  // QUATRE LECTURES INDÉPENDANTES, DONC SIMULTANÉES.
  //
  // Elles s'attendaient les unes les autres sans aucune raison : aucune ne lit le
  // résultat d'une autre. En file, la page mettait plus d'une seconde à se composer
  // même à chaud, assez pour que Next envoie d'abord le squelette de route et fasse
  // patienter le cabinet devant une page grise. En parallèle, la page ne coûte plus
  // que la plus lente des quatre.
  //
  // `toCalendarDayUTC` plutôt que `new Date()` pour les pièces attendues : un délai
  // ne doit pas changer selon l'heure à laquelle l'écran est rendu.
  const [piecesAttendues, preparationSnapshot, resume, navetteRows] = await Promise.all([
    chargerPiecesAttendues({
      cabinetId,
      dossierId: id,
      aujourdhui: toCalendarDayUTC(new Date()),
    }),
    // Doctrine: docs/product/ACTIVE_ASSISTANT_LAYER.md
    // État de préparation (dérivé, jamais stocké).
    loadDossierPreparationSnapshot(cabinetId, id, { callerUserId: userId }),
    // T1 — Bloc « Où j'en étais ? » (context-resume, dérivé, zéro migration).
    getDossierResume(cabinetId, id, resumeLocale),
    // N2 — Navette : fil de communication interne du dossier.
    getDossierNavette(cabinetId, id, role),
  ]);

  const preparationStatus = preparationSnapshot
    ? getDossierPreparationStatus(preparationSnapshot)
    : null;
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
    <div className="space-y-6">
      {/* En-tete a la disposition de la fiche client : retour, titre, rangee
          d'actions. Demande CEO du 2026-08-27, « je voulais que la disposition
          soit la meme, juste avec les details d'un dossier ». */}
      {/* En-tete du dossier.
          Il etait « safe-glass-subtle sticky top-0 z-10 » : colle en haut, avec
          un fond de VERRE translucide pour laisser deviner le contenu qui
          defilait dessous. Ce raisonnement valait quand la fiche etait une pile
          de neuf blocs qu'on parcourait longuement.

          Depuis le passage aux onglets (2026-08-27), il produisait un defaut
          visible : la barre d'onglets glissait SOUS l'en-tete colle et se
          lisait au travers du verre, titre et onglets superposes.

          Il ne colle donc plus. Chaque panneau d'onglet est court, et la
          navigation du dossier est desormais la barre d'onglets elle-meme, qui
          n'a rien a gagner a etre recouverte.

          Ni fond ni filet non plus : le conteneur visuel est la carte a onglets
          juste dessous, comme sur la fiche client dont on reprend le patron. Un
          filet bas suivi d'un vide de 24px flottait sans rien separer. */}
      <header className="px-6 pt-2">
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
            <h1 className="text-xl font-medium tracking-tight text-si-ink sm:text-2xl">
              {numeroDossier} — {dossier.intitule}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              {dossier.avocatResponsable?.nom && (
                <span className="rounded-lg bg-si-canvas border border-si-line/60 px-3 py-1 text-xs font-medium text-si-ink">
                  Avocat : {dossier.avocatResponsable.nom}
                </span>
              )}
              <span
                className={`inline-flex items-center rounded-lg px-3 py-1 text-xs font-medium ${
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
            {/* Le resume IA est une ACTION depuis le 2026-08-27, decision CEO.
                Il occupait un bloc entier de la fiche pour une fonction qu'on
                declenche rarement et qu'on ne lit pas en passant.

                Le garde-fou ne bouge pas : entierement MASQUE tant que
                ANTHROPIC_API_KEY n'est pas configuree, clé absente de Vercel a
                ce jour. Un bouton qui echoue devant un cabinet est pire que pas
                de bouton. Le test reste ICI parce que seule la page lit
                l'environnement cote serveur. */}
            {process.env.ANTHROPIC_API_KEY && (
              <DossierResumeIAAction
                dossierId={dossier.id}
                initialResume={dossier.resumeDossier}
                canSave={["admin_cabinet", "avocat", "assistante"].includes(role as string)}
              />
            )}
            <Link
              href={routes.client(dossier.clientId)}
              className="inline-flex items-center rounded-lg border border-si-line bg-si-surface/80 px-4 py-2 text-sm font-medium text-si-ink hover:bg-si-surface hover:border-si-line transition-colors"
            >
              {t("viewClient")}
            </Link>
            <Link
              href={`${routes.dossier(id)}?edit=1`}
              className="inline-flex items-center rounded-lg safe-action-degrade px-4 py-2 text-sm font-medium text-white transition-colors shadow-md shadow-si-card"
            >
              {t("editMatter")}
            </Link>
          </div>
        </div>
      </header>

      {/* UNE carte a onglets, comme la fiche client. Les neuf blocs empiles
          se repartissent en quatre panneaux, et le cartable passe de la
          NEUVIEME place a la deuxieme : c'etait le probleme P1 du document
          docs/product/REFONTE_ORGANISATION_DOSSIER.md. */}
      <DossierProfile
        nbSections={sections.length}
        nbDocuments={richDocs.length}
        nbPieces={piecesAttendues?.pieces.length ?? 0}
        apercu={
          <div className="space-y-5">
            {/* Le resume d'ouverture, demande CEO du 2026-08-27. La fiche
                n'affichait NULLE PART ce qu'est le dossier : ni son domaine de
                pratique, ni sa date d'ouverture, ni son tribunal. Il fallait
                ouvrir le formulaire d'edition pour le savoir. */}
            <DossierResumeOuverture
              domaine={dossier.type ? String(dossier.type).replace(/_/g, " ") : null}
              sousType={dossier.sousType}
              dateOuverture={dossier.dateOuverture}
              statut={STATUT_LABELS[dossier.statut] ?? dossier.statut}
              client={clientName}
              responsable={dossier.avocatResponsable?.nom ?? null}
              adjointe={dossier.assistantJuridique?.nom ?? null}
              tribunal={dossier.tribunalNom}
              district={dossier.districtJudiciaire}
              reference={dossier.reference}
              locale={intlLocale}
            />
          {/* ── UN SEUL bloc d'état, depuis le 2026-08-27 ──────────────────────
              « Où j'en étais ? » et « État de préparation » affichaient la MÊME
              phrase. Sur un dossier neuf, « Prochaine action : Créer le mandat du
              dossier » apparaissait trois fois sur cet écran : dans le récit du
              premier bloc, dans son encadré vert avec bouton, puis dans le second
              bloc avec un second lien. Deux boutons menaient au même endroit.
    
              Le bloc unique suit l'ordre que la vitrine promet : ce qui a été
              fait, ce qui manque, ce qui doit suivre.
    
              Les deux composants d'origine RESTENT en place : app/(app-v2) les
              monte encore. Voir docs/product/REFONTE_ORGANISATION_DOSSIER.md, P2. */}
          {(resume || preparationStatus) && (
              <DossierEtatCard
                resume={resume}
                status={preparationStatus}
                nextActionHref={preparationStatus?.nextAction ? "#preparation" : undefined}
              />
          )}
          {/* Personnes du dossier — co-clients + parties (adverse/tiers). N'apparaît
              que si le dossier réunit plus d'une personne. Doctrine :
              docs/product/SPEC_MULTI_CLIENTS_PARTIES_DOSSIER.md */}
          {multiPartiesEnabled && dossierParties.some((p) => !p.estPrincipal) && (
              <div className="rounded-2xl border border-si-line bg-si-surface p-4">
                <h2 className="mb-3 text-sm font-medium text-si-ink">{t("dossierPeople")}</h2>
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
          )}
          </div>
        }
        cartable={
          /* Le cartable s'ouvre DIRECTEMENT depuis le 2026-08-27, demande CEO.
             Il portait avant une carte fermee qu'il fallait cliquer, ce qui
             ajoutait un geste pour atteindre ce que l'onglet annonce deja.

             « hauteurClassName » : sans lui le cartable prend « h-screen » et
             deborde de la carte a onglets qui le contient. */
          <DossierBriefcase
            dossierId={id}
            statutDossier={dossier.statut}
            sections={sections}
            hauteurClassName="h-[min(70vh,640px)]"
          />
        }
        pieces={
          <div className="space-y-5">
            {/* Pièces attendues du client, et les délais qui les commandent.
                Onglet a part depuis le 2026-08-27, demande CEO : ce qu'on ATTEND
                du client ne se lit pas au milieu de ce qu'on a deja classe. */}
            {piecesAttendues ? (
              <PiecesAttenduesSection
                dossierId={id}
                delais={piecesAttendues.delais.map((d) => ({
                  code: d.code,
                  libelle: d.libelle,
                  reference: d.reference,
                  consequence: d.consequence,
                  etat: d.etat,
                  echeance: d.echeance ? d.echeance.toISOString() : null,
                  joursRestants: d.joursRestants,
                }))}
                pieces={piecesAttendues.pieces.map((p) => ({
                  id: p.id,
                  libelle: p.libelle,
                  raison: p.raison,
                  fournisseur: p.fournisseur,
                  obligation: p.obligation,
                  etat: p.etat,
                  referenceLegale: p.referenceLegale,
                  echeance: p.echeance ? p.echeance.toISOString() : null,
                }))}
                dates={{
                  dateSignification: piecesAttendues.dates.signification?.toISOString() ?? null,
                  datePresentation: piecesAttendues.dates.presentation?.toISOString() ?? null,
                  dateInstruction: piecesAttendues.dates.instruction?.toISOString() ?? null,
                  dateProtocole: piecesAttendues.dates.protocole?.toISOString() ?? null,
                  dateCommunicationPatrimoine:
                    piecesAttendues.dates.communicationPatrimoine?.toISOString() ?? null,
                }}
                lien={
                  dossier.collecteToken && dossier.collecteTokenExpiresAt &&
                  dossier.collecteTokenExpiresAt > new Date()
                    ? {
                        url: `/collecte/${dossier.collecteToken}`,
                        expireLe: dossier.collecteTokenExpiresAt.toISOString(),
                      }
                    : null
                }
                canWrite={canManageDossiers(role as UserRole)}
              />
            ) : null}
          </div>
        }
        communications={
          <div className="space-y-5">
          {/* N2 — Navette : communication interne assistante↔avocate sur ce dossier */}
            <NavetteThread
              dossierId={id}
              rows={navetteSerialized}
              currentUserId={userId}
              currentUserRole={role}
              locale={resumeLocale}
            />
    
          </div>
        }
        documents={
          <div className="space-y-5">
          {/* Documents rédigés via l'éditeur SAFE */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-medium text-si-ink">Documents rédigés</h2>
                <p className="text-xs text-si-muted mt-0.5">
                  Documents créés depuis l&apos;éditeur · liés à ce dossier
                </p>
              </div>
              <Link
                href={`/edition/${id}`}
                className="inline-flex items-center gap-1.5 rounded-md safe-action-degrade text-white px-3 py-1.5 text-xs font-medium transition-colors"
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
          </div>
        }
      />
    </div>
  );
}
